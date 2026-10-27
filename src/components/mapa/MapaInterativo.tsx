import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ESTADOS_BRASIL, EstadoInfo } from '../../data/geografia'
import {
  CAIXA_BRASIL,
  CAIXA_ESTADO,
  CAMINHO_SUAVE,
  CENTROIDE,
  caixaDeZoom
} from '../../data/geometriaMapa'
import { Cidade } from '../../data/cidades'
import { UFS_COM_MALHA } from '../../data/malhas'
import { Metrica, quintos, territorioDaCidade, territoriosEstados } from '../../services/metricas'
import { corDoTerritorio } from './cores'
import { LegendaMapa } from './LegendaMapa'
import { ResumoTerritorio } from './ResumoTerritorio'
import { useCaixaAnimada } from './useCaixaAnimada'

// Mapa das cidades (d3-geo, malhas do IBGE): só carrega quando alguém abre um estado.
const MapaMunicipios = lazy(() =>
  import('./MapaMunicipios').then((m) => ({ default: m.MapaMunicipios }))
)

// Estados pequenos demais para a sigla caber dentro: rótulo fora, com uma linha até o estado.
const ROTULO_EXTERNO: Record<string, { x: number; y: number }> = {
  RN: { x: 596, y: 150 },
  PB: { x: 596, y: 172 },
  PE: { x: 596, y: 194 },
  AL: { x: 596, y: 216 },
  SE: { x: 596, y: 238 },
  ES: { x: 540, y: 352 },
  DF: { x: 404, y: 318 }
}

interface Props {
  filtroUf: string | null
  onSelectUf: (uf: string | null) => void
  onSelectRegiao: (regiao: string | null) => void
  cidades: Cidade[] | null
  cidade: Cidade | null
  onSelectCidade: (c: Cidade | null) => void
  metrica: Metrica
  grande?: boolean
  /** tela cheia: todas as cidades do Brasil num mapa só */
  brasilPorCidade?: boolean
}

const valores = <T,>(lista: T[], ler: (x: T) => number | null) =>
  lista.map(ler).filter((v): v is number => v !== null)

export function MapaInterativo({
  filtroUf,
  onSelectUf,
  onSelectRegiao,
  cidades,
  cidade,
  onSelectCidade,
  metrica,
  grande = false,
  brasilPorCidade = false
}: Props) {
  const [sobre, setSobre] = useState<EstadoInfo | null>(null)
  const [cidadeSobre, setCidadeSobre] = useState<Cidade | null>(null)
  const caixa = useCaixaAnimada(filtroUf ? caixaDeZoom(filtroUf) : CAIXA_BRASIL)
  const ampliado = filtroUf !== null
  const destaque = filtroUf ?? sobre?.sigla ?? null
  // Cidades no mapa: as do estado escolhido, ou todas no modo "Brasil por cidade".
  const ufsCidades = brasilPorCidade
    ? UFS_COM_MALHA
    : ampliado && UFS_COM_MALHA.includes(filtroUf)
      ? [filtroUf]
      : []
  const mostraCidades = ufsCidades.length > 0 && cidades !== null

  // Cores dos estados (quintos entre os 27) e das cidades (quintos entre as cidades mostradas).
  const estados = useMemo(() => territoriosEstados(cidades), [cidades])
  const cortesEstados = useMemo(() => quintos(valores(estados, metrica.ler)), [estados, metrica])
  const corEstado = useMemo(
    () => new Map(estados.map((t) => [t.chave, corDoTerritorio(t, metrica, cortesEstados)])),
    [estados, metrica, cortesEstados]
  )
  const chaveUfs = ufsCidades.join(',')
  const cidadesVisiveis = useMemo(
    () => (cidades ?? []).filter((c) => chaveUfs.split(',').includes(c.uf)),
    [cidades, chaveUfs]
  )
  const cortesCidades = useMemo(
    () => quintos(valores(cidadesVisiveis.map(territorioDaCidade), metrica.ler)),
    [cidadesVisiveis, metrica]
  )
  const corCidade = useCallback(
    (c: Cidade) => corDoTerritorio(territorioDaCidade(c), metrica, cortesCidades),
    [metrica, cortesCidades]
  )
  const valorCidade = useCallback(
    (c: Cidade) => {
      const v = metrica.ler(territorioDaCidade(c))
      return `${metrica.rotulo}: ${v === null ? 'sem dado' : metrica.formatar(v)}`
    },
    [metrica]
  )

  const escolher = (est: EstadoInfo) => {
    if (filtroUf === est.sigla) return
    onSelectUf(est.sigla)
    onSelectRegiao(est.regiao)
    setSobre(null)
  }
  const voltar = () => {
    onSelectUf(null)
    onSelectRegiao(null)
    setSobre(null)
  }

  // O estado em foco é desenhado por último para o contorno não ficar escondido pelos vizinhos.
  const ordemEstados = Object.values(ESTADOS_BRASIL).sort(
    (a, b) => Number(a.sigla === destaque) - Number(b.sigla === destaque)
  )
  const cidadeEmFoco = cidadeSobre ?? (cidade && ufsCidades.includes(cidade.uf) ? cidade : null)
  const resumo = cidadeEmFoco
    ? territorioDaCidade(cidadeEmFoco)
    : (estados.find((t) => t.chave === destaque) ?? null)

  return (
    <div
      className={
        grande
          ? 'grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'
          : 'grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start'
      }
    >
      <div
        className={`relative overflow-hidden rounded-xl border border-linha bg-superficie-2/60 ${
          grande ? 'min-h-[60vh] lg:min-h-0' : 'aspect-square'
        }`}
      >
        {ampliado && !brasilPorCidade && (
          <button
            onClick={voltar}
            className="absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-zinc-950 shadow-lg hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao Brasil
          </button>
        )}

        {!brasilPorCidade && (
          <svg
            viewBox={`${caixa.x} ${caixa.y} ${caixa.w} ${caixa.h}`}
            role="group"
            aria-label="Mapa do Brasil. Use Tab para andar pelos estados e Enter para escolher um."
            className="h-full w-full touch-manipulation select-none"
          >
            {ordemEstados.map((est) => {
              const escolhido = filtroUf === est.sigla
              const emFoco = destaque === est.sigla
              const visivel = !ampliado || escolhido
              return (
                <g
                  key={est.sigla}
                  role="button"
                  tabIndex={visivel && !escolhido ? 0 : -1}
                  aria-hidden={!visivel}
                  aria-label={`${est.nome}, ${est.sigla}`}
                  aria-pressed={escolhido}
                  onClick={() => escolher(est)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      escolher(est)
                    }
                  }}
                  onMouseEnter={() => setSobre(est)}
                  onMouseLeave={() => setSobre(null)}
                  onFocus={() => setSobre(est)}
                  onBlur={() => setSobre(null)}
                  className="focus:outline-none"
                  style={{
                    opacity: visivel ? 1 : 0,
                    pointerEvents: visivel ? 'auto' : 'none',
                    cursor: escolhido ? 'default' : 'pointer',
                    transition: 'opacity 350ms'
                  }}
                >
                  <path
                    d={ampliado ? CAMINHO_SUAVE[est.sigla] : est.svgPath}
                    fill={corEstado.get(est.sigla)}
                    stroke={emFoco ? 'rgb(var(--tinta))' : 'rgb(var(--superficie))'}
                    strokeWidth={emFoco ? (ampliado ? 2 : 2.5) : 1}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    style={{ filter: emFoco && !ampliado ? 'brightness(1.15)' : undefined }}
                  />
                </g>
              )
            })}

            {/* Siglas numa camada própria, acima de todos os estados, para nenhum vizinho cobri-las */}
            {!ampliado && (
              <g pointerEvents="none" aria-hidden="true">
                {ordemEstados.map((est) => {
                  const centro = CENTROIDE[est.sigla]
                  const c = CAIXA_ESTADO[est.sigla]
                  const externo = ROTULO_EXTERNO[est.sigla]
                  const tamanho = externo ? 9 : Math.max(8, Math.min(13, Math.min(c.w, c.h) * 0.4))
                  return (
                    <g key={est.sigla}>
                      {externo && (
                        <>
                          <line
                            x1={externo.x}
                            y1={externo.y}
                            x2={centro.x}
                            y2={centro.y}
                            stroke="rgb(var(--tinta-3))"
                            strokeWidth={0.8}
                          />
                          <circle cx={centro.x} cy={centro.y} r={1.6} fill="rgb(var(--tinta))" />
                        </>
                      )}
                      <text
                        x={externo ? externo.x + 2 : centro.x}
                        y={externo ? externo.y : centro.y}
                        textAnchor={externo ? 'start' : 'middle'}
                        dominantBaseline="central"
                        fontSize={tamanho}
                        fontWeight="800"
                        fill={externo ? 'rgb(var(--tinta))' : '#ffffff'}
                        stroke="#000000"
                        strokeWidth={externo ? 0 : 2.5}
                        strokeOpacity={0.55}
                        paintOrder="stroke"
                      >
                        {est.sigla}
                      </text>
                    </g>
                  )
                })}
              </g>
            )}
          </svg>
        )}

        {/* Cidades por cima do estado ampliado (entram depois do zoom) */}
        {mostraCidades && (
          <motion.div
            key={chaveUfs}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: brasilPorCidade ? 0 : 0.35 }}
            className="absolute inset-0 bg-superficie-2"
          >
            <Suspense fallback={null}>
              <MapaMunicipios
                ufs={ufsCidades}
                cidades={cidadesVisiveis}
                corDe={corCidade}
                valorDe={valorCidade}
                selecionada={cidade?.codigo ?? null}
                onEscolher={onSelectCidade}
                onSobre={setCidadeSobre}
                livre={grande}
                className="h-full w-full"
              />
            </Suspense>
          </motion.div>
        )}

        {ampliado && !brasilPorCidade && (
          // Na tela cheia, o canto de baixo é da caixa de ajuda: o nome do estado vai para cima.
          <div
            className={`pointer-events-none absolute left-2 rounded-lg ${grande ? 'top-14' : 'bottom-2'} bg-superficie px-3 py-1.5 text-sm font-bold text-tinta`}
          >
            {ESTADOS_BRASIL[filtroUf].nome}
          </div>
        )}
      </div>

      <div
        className={`rounded-xl border border-linha bg-superficie p-4 ${grande ? 'overflow-y-auto' : 'lg:sticky lg:top-24'}`}
      >
        <ResumoTerritorio
          territorio={resumo}
          tipo={mostraCidades ? 'cidade' : 'estado'}
          metrica={metrica}
        />
        <div className="mt-4 border-t border-linha pt-3">
          <LegendaMapa metrica={metrica} cortes={mostraCidades ? cortesCidades : cortesEstados} />
          {mostraCidades && (
            <p className="mt-2 text-xs text-tinta-3">
              Toque numa cidade para ver os números dela. Use + e − para aproximar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
