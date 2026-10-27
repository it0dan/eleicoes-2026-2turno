import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, zoomTransform, ZoomBehavior, ZoomTransform } from 'd3-zoom'
import { interpolate } from 'd3-interpolate'
import 'd3-transition' // .transition() nas seleções: zoom e deslocamento suaves pelos botões e teclas
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RotateCcw } from 'lucide-react'
import { Cidade } from '../../data/cidades'
import { carregarMalha } from '../../data/malhas'
import { siglaDoLugar } from '../../data/lugares'

const L = 600 // lado do viewBox
const ESCALA_MAX = 40 // aproxima até ver as menores cidades no mapa do Brasil inteiro
const PASSO_PX = 60 // quanto cada seta move o mapa (em pixels do viewBox)
const DURACAO = 250
const FOLGA = 0.6 // quanto o mapa pode sair do quadro, em frações do lado

interface Forma {
  ibge: string
  d: string
  centro: [number, number]
  /** largura e altura do contorno (para saber se o nome cabe) */
  tamanho: [number, number]
}

interface Props {
  /** estados a desenhar (um, ou todos para "Brasil por cidade") */
  ufs: string[]
  cidades: Cidade[]
  /** cor de cada cidade, pelo código IBGE */
  corDe: (c: Cidade) => string
  /** texto da métrica na dica */
  valorDe: (c: Cidade) => string
  selecionada: string | null
  onEscolher: (c: Cidade) => void
  onSobre: (c: Cidade | null) => void
  /** navegação livre, como num mapa de celular (tela cheia): rodinha e um dedo movem o mapa sem restrição */
  livre?: boolean
  className?: string
}

function useMalhas(ufs: string[], detalhe: boolean) {
  const [topos, setTopos] = useState<Topology[] | null>(null)
  const chave = ufs.join(',')
  useEffect(() => {
    let ativo = true
    setTopos(null)
    Promise.all(chave.split(',').map((uf) => carregarMalha(uf, detalhe))).then(
      (t) => ativo && setTopos(t)
    )
    return () => {
      ativo = false
    }
  }, [chave, detalhe])
  return topos
}

const reduzMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const objetoDe = (t: Topology) =>
  Object.values(t.objects)[0] as GeometryCollection<{ codarea: string }>

/** Contornos projetados para o viewBox e a linha da divisa de cada estado. */
function projetar(topos: Topology[]): { formas: Forma[]; divisas: string } {
  const feats = topos.flatMap(
    (t) => (feature(t, objetoDe(t)) as FeatureCollection<Geometry, { codarea: string }>).features
  )
  const proj = geoMercator().fitExtent(
    [
      [8, 8],
      [L - 8, L - 8]
    ],
    { type: 'FeatureCollection', features: feats }
  )
  const caminho = geoPath(proj)
  const formas = feats.map((f: Feature<Geometry, { codarea: string }>) => {
    const [[x0, y0], [x1, y1]] = caminho.bounds(f)
    return {
      ibge: f.properties.codarea,
      d: caminho(f) ?? '',
      centro: caminho.centroid(f) as [number, number],
      tamanho: [x1 - x0, y1 - y0] as [number, number]
    }
  })
  // Divisa: arcos que não são compartilhados entre dois municípios do mesmo arquivo (= contorno do estado).
  const divisas = topos.map((t) => caminho(mesh(t, objetoDe(t), (a, b) => a === b)) ?? '').join('')
  return { formas, divisas }
}

// Camada pesada (centenas de caminhos): só redesenha quando as formas ou as cores mudam.
const Camada = memo(function Camada({
  formas,
  cores,
  fino,
  onEntrar,
  onSair,
  onClicar
}: {
  formas: Forma[]
  cores: Map<string, string>
  /** muitas cidades (Brasil todo): divisas mais finas para não "lavar" as cores */
  fino: boolean
  onEntrar: (ibge: string, e: React.PointerEvent) => void
  onSair: () => void
  onClicar: (ibge: string) => void
}) {
  return (
    <>
      {formas.map((f) => (
        <path
          key={f.ibge}
          d={f.d}
          fill={cores.get(f.ibge) ?? 'rgb(var(--superficie-2))'}
          stroke="rgb(var(--superficie))"
          strokeWidth={fino ? 0.2 : 0.6}
          vectorEffect="non-scaling-stroke"
          onPointerMove={(e) => onEntrar(f.ibge, e)}
          onPointerLeave={onSair}
          onClick={() => onClicar(f.ibge)}
          style={{ cursor: 'pointer' }}
        />
      ))}
    </>
  )
})

/** Mapa das cidades de um ou mais estados: tocar escolhe a cidade; botões e arrasto para aproximar. */
export function MapaMunicipios({
  ufs,
  cidades,
  corDe,
  valorDe,
  selecionada,
  onEscolher,
  onSobre,
  livre = false,
  className = ''
}: Props) {
  // Tela cheia de poucos estados: contornos detalhados. Brasil inteiro: leves (são 5.570 cidades).
  const topos = useMalhas(ufs, livre && ufs.length <= 3)
  const svgRef = useRef<SVGSVGElement>(null)
  const caixaRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  // Para onde a animação em curso está indo: teclas seguidas somam a partir daqui (e não do meio do caminho).
  const alvoRef = useRef<ZoomTransform>(zoomIdentity)
  const [transf, setTransf] = useState<ZoomTransform>(zoomIdentity)
  const [dica, setDica] = useState<{ cidade: Cidade; x: number; y: number } | null>(null)

  const desenho = useMemo(() => (topos ? projetar(topos) : null), [topos])
  const porIbge = useMemo(
    () => new Map(cidades.filter((c) => c.ibge).map((c) => [c.ibge!, c])),
    [cidades]
  )
  const cores = useMemo(
    () => new Map(cidades.filter((c) => c.ibge).map((c) => [c.ibge!, corDe(c)])),
    [cidades, corDe]
  )
  const semContorno = useMemo(() => {
    if (!desenho) return []
    const com = new Set(desenho.formas.map((f) => f.ibge))
    return cidades.filter((c) => ufs.includes(c.uf) && (!c.ibge || !com.has(c.ibge)))
  }, [desenho, cidades, ufs])

  // Zoom e arrasto. Na página: rodinha só com Ctrl (para não prender a rolagem) e, no toque, um dedo só arrasta
  // depois de aproximar. Livre (tela cheia): rodinha, pinça e arrasto direto, como num app de mapa.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, ESCALA_MAX])
      // Transição em linha reta (a padrão faz um "voo" que afasta e aproxima; com teclas seguidas, sai torta).
      .interpolate(interpolate)
      // Folga em volta do mapa: dá para mover (setas, arrasto) mesmo sem zoom, como num app de mapa.
      .translateExtent([
        [-L * FOLGA, -L * FOLGA],
        [L * (1 + FOLGA), L * (1 + FOLGA)]
      ])
      .filter((e: Event) => {
        if (e.type === 'wheel') return livre || (e as WheelEvent).ctrlKey
        if (e.type === 'touchstart')
          return livre || (e as TouchEvent).touches.length > 1 || zoomTransform(svg).k > 1
        return !(e as MouseEvent).button
      })
      .on('zoom', (e: { transform: ZoomTransform }) => {
        setTransf(e.transform)
        svg.style.touchAction = livre || e.transform.k > 1 ? 'none' : 'pan-y'
      })
      // Arrasto, rodinha ou pinça terminados: o destino passa a ser onde o mapa parou.
      .on('end', (e: { transform: ZoomTransform; sourceEvent: Event | null }) => {
        if (e.sourceEvent) alvoRef.current = e.transform
      })
    zoomRef.current = z
    select(svg).call(z)
    svg.style.touchAction = livre ? 'none' : 'pan-y'
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [desenho, livre])

  // Novo estado: volta ao enquadramento inteiro.
  useEffect(() => {
    alvoRef.current = zoomIdentity
    if (svgRef.current && zoomRef.current)
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity)
  }, [desenho])

  // Botões e teclas: com transição curta (sem animação se a pessoa pediu menos movimento).
  const animar = () => {
    const sel = select(svgRef.current!)
    return reduzMovimento() ? sel : sel.transition().duration(DURACAO)
  }
  const irPara = (t: ZoomTransform) => {
    const z = zoomRef.current
    if (!svgRef.current || !z) return
    // Aplica os limites do zoom já no destino (para a próxima tecla somar a partir de um ponto válido).
    const limitado = z.constrain()(
      t,
      [
        [0, 0],
        [L, L]
      ],
      [
        [-L * FOLGA, -L * FOLGA],
        [L * (1 + FOLGA), L * (1 + FOLGA)]
      ]
    )
    alvoRef.current = limitado
    animar().call(z.transform, limitado)
  }
  /** Aproxima (fator > 1) ou afasta, mantendo o centro do quadro no lugar. */
  const aproximar = (fator: number) => {
    const a = alvoRef.current
    const k = Math.max(1, Math.min(ESCALA_MAX, a.k * fator))
    const c = L / 2
    irPara(zoomIdentity.translate(c - ((c - a.x) * k) / a.k, c - ((c - a.y) * k) / a.k).scale(k))
  }
  /** Move o mapa `dx`, `dy` pixels na tela. */
  const mover = (dx: number, dy: number) => {
    const a = alvoRef.current
    irPara(zoomIdentity.translate(a.x + dx, a.y + dy).scale(a.k))
  }
  const reiniciar = () => irPara(zoomIdentity)
  const teclas: Record<string, () => void> = {
    ArrowLeft: () => mover(PASSO_PX, 0),
    ArrowRight: () => mover(-PASSO_PX, 0),
    ArrowUp: () => mover(0, PASSO_PX),
    ArrowDown: () => mover(0, -PASSO_PX),
    '+': () => aproximar(1.6),
    '=': () => aproximar(1.6),
    '-': () => aproximar(1 / 1.6),
    '0': reiniciar
  }

  const entrar = useMemo(
    () => (ibge: string, e: React.PointerEvent) => {
      const c = porIbge.get(ibge)
      const caixa = caixaRef.current?.getBoundingClientRect()
      if (!c || !caixa || e.pointerType === 'touch') return
      setDica({ cidade: c, x: e.clientX - caixa.left, y: e.clientY - caixa.top })
      onSobre(c)
    },
    [porIbge, onSobre]
  )
  // Passar o mouse só mostra; ao sair da cidade, volta ao normal. Escolher é só no clique/toque.
  const sair = useMemo(
    () => () => {
      setDica(null)
      onSobre(null)
    },
    [onSobre]
  )
  const clicar = useMemo(
    () => (ibge: string) => {
      const c = porIbge.get(ibge)
      if (c) onEscolher(c)
    },
    [porIbge, onEscolher]
  )

  const escolhida = selecionada ? cidades.find((c) => c.codigo === selecionada) : undefined
  const formaEscolhida = escolhida?.ibge
    ? desenho?.formas.find((f) => f.ibge === escolhida.ibge)
    : undefined
  const capitais = desenho
    ? cidades
        .filter((c) => c.capital && ufs.includes(c.uf))
        .map((c) => ({ c, f: desenho.formas.find((f) => f.ibge === c.ibge) }))
        .filter((x): x is { c: Cidade; f: Forma } => !!x.f)
    : []
  const k = transf.k

  // Nomes das cidades que cabem dentro do próprio contorno no zoom atual (e estão à vista), como num app de mapa.
  const nomes = useMemo(() => {
    if (!desenho || k < 1.5) return []
    const [vx0, vy0] = transf.invert([0, 0])
    const [vx1, vy1] = transf.invert([L, L])
    const lista: { c: Cidade; f: Forma }[] = []
    for (const f of desenho.formas) {
      const [x, y] = f.centro
      if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue
      const c = porIbge.get(f.ibge)
      if (!c || c.capital || c.codigo === selecionada) continue
      if (f.tamanho[0] * k < c.nome.length * 6.2 + 6 || f.tamanho[1] * k < 14) continue
      lista.push({ c, f })
      if (lista.length >= 300) break
    }
    return lista
  }, [desenho, transf, k, porIbge, selecionada])

  return (
    <div
      ref={caixaRef}
      tabIndex={0}
      role="group"
      aria-label="Mapa das cidades. Setas movem o mapa, + e − aproximam e afastam, 0 volta ao início."
      // O zoom do d3 cancela o foco no clique; foca à mão para as setas do teclado funcionarem em seguida.
      onPointerDownCapture={() => caixaRef.current?.focus({ preventScroll: true })}
      onKeyDown={(e) => {
        const acao = teclas[e.key]
        if (!acao) return
        e.preventDefault()
        acao()
      }}
      className={`relative focus:outline-none focus-visible:ring-2 focus-visible:ring-cat-1 ${className}`}
    >
      {!desenho && (
        <div className="absolute inset-0 grid place-items-center text-sm text-tinta-2">
          Carregando as cidades…
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${L} ${L}`}
        aria-hidden="true"
        className="h-full w-full select-none"
        onPointerLeave={() => {
          setDica(null)
          onSobre(null)
        }}
      >
        {desenho && (
          <g transform={transf.toString()}>
            <Camada
              formas={desenho.formas}
              cores={cores}
              fino={ufs.length > 1}
              onEntrar={entrar}
              onSair={sair}
              onClicar={clicar}
            />
            <path
              d={desenho.divisas}
              fill="none"
              stroke="rgb(var(--tinta))"
              strokeOpacity={0.55}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            {formaEscolhida && (
              <path
                d={formaEscolhida.d}
                fill="none"
                stroke="rgb(var(--tinta))"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            <g pointerEvents="none">
              {nomes.map(({ c, f }) => (
                <text
                  key={c.codigo}
                  transform={`translate(${f.centro[0]},${f.centro[1]}) scale(${1 / k})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10.5}
                  fontWeight={700}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeOpacity={0.55}
                  paintOrder="stroke"
                >
                  {c.nome}
                </text>
              ))}
              {capitais.map(({ c, f }) => (
                <g
                  key={c.codigo}
                  transform={`translate(${f.centro[0]},${f.centro[1]}) scale(${1 / k})`}
                >
                  <circle r={4.5} fill="#ffffff" stroke="#18181b" strokeWidth={1.5} />
                  <circle r={1.8} fill="#18181b" />
                  {ufs.length === 1 && (
                    <text
                      y={-9}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={800}
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth={3}
                      strokeOpacity={0.6}
                      paintOrder="stroke"
                    >
                      {c.nome}
                    </text>
                  )}
                </g>
              ))}
              {formaEscolhida && escolhida && !escolhida.capital && (
                <text
                  transform={`translate(${formaEscolhida.centro[0]},${formaEscolhida.centro[1]}) scale(${1 / k})`}
                  textAnchor="middle"
                  y={16}
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={800}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={3}
                  strokeOpacity={0.7}
                  paintOrder="stroke"
                >
                  {escolhida.nome}
                </text>
              )}
            </g>
          </g>
        )}
      </svg>

      {dica && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 w-max max-w-[15rem] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
          style={{ left: dica.x, top: dica.y }}
        >
          <span className="block font-bold">
            {dica.cidade.nome} ({siglaDoLugar(dica.cidade.uf)})
          </span>
          <span className="block">{valorDe(dica.cidade)}</span>
          <span className="block text-tinta-3">Toque para ver os números</span>
        </div>
      )}

      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
        {[
          { rotulo: 'Aproximar (+)', icone: Plus, acao: () => aproximar(1.6) },
          { rotulo: 'Afastar (−)', icone: Minus, acao: () => aproximar(1 / 1.6) },
          { rotulo: 'Ver tudo de novo (0)', icone: RotateCcw, acao: reiniciar }
        ].map((b) => (
          <BotaoMapa key={b.rotulo} {...b} />
        ))}
      </div>

      {livre && (
        <>
          {/* Setas na tela (também funcionam as do teclado) */}
          <div className="absolute bottom-3 right-3 z-10 grid grid-cols-3 gap-1">
            <span />
            <BotaoMapa rotulo="Mover para cima" icone={ArrowUp} acao={() => mover(0, PASSO_PX)} />
            <span />
            <BotaoMapa
              rotulo="Mover para a esquerda"
              icone={ArrowLeft}
              acao={() => mover(PASSO_PX, 0)}
            />
            <span />
            <BotaoMapa
              rotulo="Mover para a direita"
              icone={ArrowRight}
              acao={() => mover(-PASSO_PX, 0)}
            />
            <span />
            <BotaoMapa
              rotulo="Mover para baixo"
              icone={ArrowDown}
              acao={() => mover(0, -PASSO_PX)}
            />
            <span />
          </div>
          <p className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-xs rounded-xl bg-superficie/90 px-3 py-2 text-xs text-tinta-2 shadow sm:block">
            Arraste para mover · rodinha do mouse ou pinça para aproximar · no teclado: setas, + e
            −. Quanto mais perto, mais nomes de cidades aparecem.
          </p>
        </>
      )}

      {semContorno.length > 0 && (
        <p
          className={`absolute max-w-[60%] text-[11px] text-tinta-3 ${livre ? 'bottom-20 left-3' : 'bottom-1 right-2 text-right'}`}
        >
          Sem contorno no mapa do IBGE (cidade nova): {semContorno.map((c) => c.nome).join(', ')}.
          Use a busca.
        </p>
      )}
    </div>
  )
}

function BotaoMapa({
  rotulo,
  icone: Icone,
  acao
}: {
  rotulo: string
  icone: typeof Plus
  acao: () => void
}) {
  return (
    <button
      type="button"
      onClick={acao}
      aria-label={rotulo}
      title={rotulo}
      className="grid h-10 w-10 place-items-center rounded-xl border border-linha bg-superficie text-tinta shadow-md hover:bg-superficie-2"
    >
      <Icone className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
