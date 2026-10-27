import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { scaleLinear } from 'd3-scale'

export interface Serie {
  chave: string
  nome: string
  valores: number[]
  cor: string
}

interface Props {
  series: Serie[]
  /** minuto do dia da primeira faixa (8h = 480) */
  inicio: number
  /** tamanho de cada faixa, em minutos */
  passo: number
  formatarY: (n: number) => string
  /** forma curta para o eixo (padrão: `formatarY`) */
  formatarEixo?: (n: number) => string
  /** área preenchida (uma série) ou só linhas (comparação) */
  area?: boolean
  /** minuto do dia a partir do qual a faixa é "prorrogação" (17h = 1020) */
  inicioProrrogacao?: number
  descricao: string
}

const M = { topo: 26, dir: 14, base: 30, esq: 52 }

const hora = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Votos ao longo do dia: área (ou linhas), com a faixa da prorrogação marcada. Passar o dedo/mouse mostra a hora. */
export function LinhaDoTempo({
  series,
  inicio,
  passo,
  formatarY,
  formatarEixo = formatarY,
  area,
  inicioProrrogacao,
  descricao
}: Props) {
  const reduzir = useReducedMotion()
  const caixa = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)
  const [i, setI] = useState<number | null>(null)
  // Desenha na largura real (textos sempre no tamanho certo, também no celular).
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = W < 500 ? 220 : 260
  const n = series[0]?.valores.length ?? 0
  const fim = inicio + n * passo
  // Eixo do tempo em minutos do dia: cada ponto fica no começo da sua faixa; o eixo vai até o fim da última.
  const xm = (min: number) => M.esq + ((min - inicio) / (fim - inicio)) * (W - M.esq - M.dir)
  const x = (k: number) => xm(inicio + k * passo)
  const escalaY = scaleLinear()
    .domain([0, Math.max(1e-9, ...series.flatMap((s) => s.valores))])
    .range([H - M.base, M.topo])
    .nice()
  const y = (v: number) => escalaY(v)
  const caminho = (v: number[]) =>
    v.map((val, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(val).toFixed(1)}`).join('')
  const ticksY = escalaY.ticks(4)
  const cadaHoras = W < 500 ? 3 : 2
  const horas = Array.from({ length: (fim - inicio) / 60 + 1 }, (_, h) => h).filter(
    (h) => h % cadaHoras === 0
  )
  const temProrrog = inicioProrrogacao !== undefined && inicioProrrogacao < fim

  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const min = inicio + ((e.clientX - r.left - M.esq) / (W - M.esq - M.dir)) * (fim - inicio)
    const k = Math.floor((min - inicio) / passo)
    setI(k >= 0 && k < n ? k : null)
  }

  return (
    <div ref={caixa} className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block max-w-full touch-pan-y select-none"
        role="img"
        aria-label={descricao}
        onPointerMove={mover}
        onPointerDown={mover}
        onPointerLeave={() => setI(null)}
      >
        {temProrrog && (
          <g>
            <rect
              x={xm(inicioProrrogacao!)}
              y={M.topo}
              width={xm(fim) - xm(inicioProrrogacao!)}
              height={H - M.topo - M.base}
              fill="rgb(var(--cat-3) / 0.12)"
            />
            <line
              x1={xm(inicioProrrogacao!)}
              x2={xm(inicioProrrogacao!)}
              y1={M.topo - 6}
              y2={H - M.base}
              stroke="rgb(var(--cat-3))"
              strokeWidth={2}
            />
            {/* Rótulo centrado na faixa (cabe também no celular) */}
            <text
              x={(xm(inicioProrrogacao!) + xm(fim)) / 2}
              y={M.topo - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="rgb(var(--tinta-2))"
            >
              após 17h
            </text>
          </g>
        )}
        {ticksY.map((t) => (
          <g key={t}>
            <line x1={M.esq} x2={W - M.dir} y1={y(t)} y2={y(t)} stroke="rgb(var(--linha))" />
            <text
              x={M.esq - 6}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill="rgb(var(--tinta-3))"
            >
              {formatarEixo(t)}
            </text>
          </g>
        ))}
        {horas.map((h) => (
          <text
            key={h}
            x={xm(inicio + h * 60)}
            y={H - M.base + 18}
            textAnchor={inicio + h * 60 >= fim ? 'end' : 'middle'}
            fontSize={11}
            fontWeight={600}
            fill="rgb(var(--tinta-3))"
          >
            {Math.floor(inicio / 60) + h}h
          </text>
        ))}

        {series.map((s, k) => (
          <g key={s.chave}>
            {area && (
              <motion.path
                d={`${caminho(s.valores)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`}
                fill={s.cor}
                fillOpacity={0.18}
                initial={reduzir ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: reduzir ? 0 : 0.8 }}
              />
            )}
            <motion.path
              d={caminho(s.valores)}
              fill="none"
              stroke={s.cor}
              strokeWidth={2}
              strokeLinejoin="round"
              initial={reduzir ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduzir ? 0 : 1.2,
                delay: reduzir ? 0 : k * 0.2,
                ease: 'easeOut'
              }}
            />
          </g>
        ))}

        {i !== null && (
          <g pointerEvents="none">
            <line
              x1={x(i)}
              x2={x(i)}
              y1={M.topo}
              y2={H - M.base}
              stroke="rgb(var(--tinta))"
              strokeOpacity={0.5}
            />
            {series.map((s) => (
              <circle
                key={s.chave}
                cx={x(i)}
                cy={y(s.valores[i])}
                r={4}
                fill={s.cor}
                stroke="rgb(var(--superficie))"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>

      {series.length > 1 && (
        <div
          className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-tinta-2"
          aria-hidden="true"
        >
          {series.map((s) => (
            <span key={s.chave} className="flex items-center gap-1.5">
              <span className="h-[3px] w-4 rounded-full" style={{ background: s.cor }} />
              {s.nome}
            </span>
          ))}
        </div>
      )}

      {i !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-20 w-max max-w-[15rem] -translate-x-1/2 rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
          style={{ left: `${Math.min(85, Math.max(15, (x(i) / W) * 100))}%` }}
        >
          <span className="block font-bold">
            {hora(inicio + i * passo)} a {hora(inicio + (i + 1) * passo)}
          </span>
          {series.map((s) => (
            <span key={s.chave} className="block">
              {series.length > 1 && `${s.nome}: `}
              {formatarY(s.valores[i])}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
