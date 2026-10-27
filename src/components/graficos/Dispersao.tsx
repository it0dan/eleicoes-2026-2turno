import { useEffect, useMemo, useRef, useState } from 'react'
import { scaleLinear, scaleLog, scaleSqrt } from 'd3-scale'
import { quadtree } from 'd3-quadtree'
import { extent, max } from 'd3-array'

export interface Ponto {
  chave: string
  nome: string
  x: number
  y: number
  /** tamanho (ex.: eleitores) */
  peso: number
  cor: string
}

export interface Eixo {
  rotulo: string
  formatar: (n: number) => string
  /** forma curta para os números do eixo (padrão: `formatar`) */
  formatarEixo?: (n: number) => string
  /** escala logarítmica (bom para tamanho e riqueza, que vão de poucos a milhões) */
  log?: boolean
  dominio?: [number, number]
}

interface Props {
  pontos: Ponto[]
  x: Eixo
  y: Eixo
  /** linha horizontal de referência (ex.: 50% = metade dos votos) */
  referenciaY?: { valor: number; texto: string }
  destacado?: string | null
  onSelecionar?: (chave: string) => void
  /** texto para leitores de tela (o gráfico em si é desenho) */
  descricao: string
}

const ALTURA = 380
const M = { topo: 16, dir: 16, base: 44, esq: 56 }

/** Lê uma cor do tema (variável CSS "r g b") para desenhar no canvas. */
const corDoTema = (nome: string, alfa = 1) => {
  const [r, g, b] = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${nome}`)
    .trim()
    .split(/\s+/)
  return `rgba(${r},${g},${b},${alfa})`
}

/** Um ponto por lugar, eixo X × eixo Y, tamanho pelo peso. Passar o mouse mostra o nome; tocar seleciona. */
export function Dispersao({
  pontos,
  x,
  y,
  referenciaY,
  destacado,
  onSelecionar,
  descricao
}: Props) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [largura, setLargura] = useState(600)
  const [tema, setTema] = useState(0)
  const [sobre, setSobre] = useState<{ p: Ponto; px: number; py: number } | null>(null)

  // Acompanha a largura do cartão e as trocas de tema (para redesenhar com as cores certas).
  useEffect(() => {
    const el = caixaRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLargura(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    const mo = new MutationObserver(() => setTema((t) => t + 1))
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  const escalas = useMemo(() => {
    // Escala log não aceita zero: começa em 1.
    const dominio = (e: Eixo, ler: (p: Ponto) => number): [number, number] => {
      const [lo = 0, hi = 1] = e.dominio ?? extent(pontos, ler)
      return [e.log ? Math.max(1, lo) : lo, hi]
    }
    // Linear: arredonda as pontas (nice). Log: não, senão estica até a potência de 10 seguinte.
    const escala = (e: Eixo, ler: (p: Ponto) => number, faixa: [number, number]) =>
      e.log
        ? scaleLog().domain(dominio(e, ler)).range(faixa)
        : scaleLinear().domain(dominio(e, ler)).range(faixa).nice()
    const sx = escala(x, (p) => p.x, [M.esq, largura - M.dir])
    const sy = escala(y, (p) => p.y, [ALTURA - M.base, M.topo])
    const sr = scaleSqrt()
      .domain([0, max(pontos, (p) => p.peso) ?? 1])
      .range([1.6, largura < 500 ? 12 : 18])
    return { sx, sy, sr }
  }, [pontos, x, y, largura])

  const busca = useMemo(
    () =>
      quadtree<Ponto>()
        .x((p) => escalas.sx(p.x))
        .y((p) => escalas.sy(p.y))
        .addAll(pontos.filter((p) => !(x.log && p.x <= 0) && !(y.log && p.y <= 0))),
    [pontos, escalas, x.log, y.log]
  )

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = largura * dpr
    cv.height = ALTURA * dpr
    const ctx = cv.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, largura, ALTURA)
    const { sx, sy, sr } = escalas
    const tinta2 = corDoTema('tinta-2')
    const linha = corDoTema('linha')

    // Grade e eixos (discretos)
    ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif'
    ctx.fillStyle = tinta2
    ctx.strokeStyle = linha
    ctx.lineWidth = 1
    const ticksX = sx.ticks(largura < 500 ? 4 : 7)
    const ticksY = sy.ticks(6)
    const fx = x.formatarEixo ?? x.formatar
    const fy = y.formatarEixo ?? y.formatar
    ctx.textAlign = 'center'
    // Escala log tem muitos traços (1, 2, 3… 9 × 10ⁿ): escreve só os que não encostam no anterior.
    let ultimo = -Infinity
    for (const t of ticksX) {
      const px = sx(t)
      const texto = fx(t)
      const meia = ctx.measureText(texto).width / 2
      const cabe = px - meia > ultimo + 8
      ctx.beginPath()
      ctx.moveTo(px, M.topo)
      ctx.lineTo(px, ALTURA - M.base)
      ctx.globalAlpha = cabe ? 1 : 0.35
      ctx.stroke()
      ctx.globalAlpha = 1
      if (cabe) {
        ctx.fillText(texto, px, ALTURA - M.base + 16)
        ultimo = px + meia
      }
    }
    ctx.textAlign = 'right'
    for (const t of ticksY) {
      const py = sy(t)
      ctx.beginPath()
      ctx.moveTo(M.esq, py)
      ctx.lineTo(largura - M.dir, py)
      ctx.stroke()
      ctx.fillText(fy(t), M.esq - 6, py + 4)
    }
    ctx.textAlign = 'center'
    ctx.fillText(x.rotulo, (M.esq + largura - M.dir) / 2, ALTURA - 6)

    if (referenciaY) {
      const py = sy(referenciaY.valor)
      ctx.strokeStyle = corDoTema('tinta', 0.7)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(M.esq, py)
      ctx.lineTo(largura - M.dir, py)
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.fillText(referenciaY.texto, M.esq + 6, py - 6)
    }

    // Pontos: maiores primeiro, para os pequenos ficarem por cima e visíveis.
    const ordem = [...busca.data()].sort((a, b) => b.peso - a.peso)
    ctx.lineWidth = 1
    ctx.strokeStyle = corDoTema('superficie')
    for (const p of ordem) {
      ctx.globalAlpha = 0.75
      ctx.fillStyle = p.cor
      ctx.beginPath()
      ctx.arc(sx(p.x), sy(p.y), sr(p.peso), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.stroke()
    }
    const d = destacado ? ordem.find((p) => p.chave === destacado) : undefined
    if (d) {
      ctx.strokeStyle = corDoTema('tinta')
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(sx(d.x), sy(d.y), sr(d.peso) + 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [busca, escalas, largura, referenciaY, destacado, x, y, tema])

  const ponteiro = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const p = busca.find(px, py, 16)
    setSobre(p ? { p, px: escalas.sx(p.x), py: escalas.sy(p.y) } : null)
    return p
  }

  return (
    <div ref={caixaRef} className="relative">
      <p
        className="pointer-events-none absolute left-0 top-1/2 origin-left -translate-y-1/2 -rotate-90 translate-x-3 whitespace-nowrap text-[11px] font-semibold text-tinta-2"
        aria-hidden="true"
      >
        {y.rotulo}
      </p>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={descricao}
        style={{ width: largura, height: ALTURA, cursor: sobre ? 'pointer' : 'default' }}
        className="block max-w-full touch-pan-y"
        onPointerMove={(e) => e.pointerType !== 'touch' && ponteiro(e)}
        onPointerLeave={() => setSobre(null)}
        onClick={(e) => {
          const p = ponteiro(e as unknown as React.PointerEvent)
          if (p) onSelecionar?.(p.chave)
        }}
      />
      {sobre && (
        <div
          role="status"
          className="pointer-events-none absolute z-20 w-max max-w-[15rem] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
          style={{ left: sobre.px, top: sobre.py }}
        >
          <span className="block font-bold">{sobre.p.nome}</span>
          <span className="block">
            {x.rotulo}: {x.formatar(sobre.p.x)}
          </span>
          <span className="block">
            {y.rotulo}: {y.formatar(sobre.p.y)}
          </span>
          {onSelecionar && <span className="block text-tinta-3">Toque para ver no painel</span>}
        </div>
      )}
    </div>
  )
}
