import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Barra } from '../../services/analises'
import { numero as fmt } from '../../lib/formato'

interface Props {
  barras: Barra[]
  /** cor de cada barra (CSS) */
  corDe: (b: Barra) => string
  /** texto da faixa, ex.: "50% a 55%" */
  faixa: (b: Barra) => string
  /** rótulos do eixo de baixo: a cada quantas barras */
  cadaRotulo?: number
  rotuloEixo: (b: Barra) => string
  /** linha vertical de referência (ex.: 50%) no valor indicado */
  referencia?: { valor: number; texto: string }
  unidade?: string
}

const A = 160 // altura útil

/** Quantos lugares caem em cada faixa de valor. Tocar uma barra mostra os números dela. */
export function Histograma({
  barras,
  corDe,
  faixa,
  cadaRotulo = 2,
  rotuloEixo,
  referencia,
  unidade = 'cidades'
}: Props) {
  const reduzir = useReducedMotion()
  const [ativa, setAtiva] = useState<number | null>(null)
  const maximo = Math.max(1, ...barras.map((b) => b.quantos))
  const n = barras.length
  const min = barras[0]?.de ?? 0
  const max = barras[n - 1]?.ate ?? 1
  const xRef = referencia ? ((referencia.valor - min) / (max - min)) * 100 : null

  return (
    <div className="relative">
      <div
        className="flex h-[200px] items-end gap-[2px] border-b border-linha pt-6"
        aria-hidden="true"
      >
        {barras.map((b, i) => (
          <button
            key={b.de}
            type="button"
            tabIndex={-1}
            onMouseEnter={() => setAtiva(i)}
            onMouseLeave={() => setAtiva(null)}
            onClick={() => setAtiva((v) => (v === i ? null : i))}
            className="relative flex h-full flex-1 items-end"
          >
            <motion.span
              className="block w-full rounded-t-[4px]"
              style={{ background: corDe(b), opacity: ativa === null || ativa === i ? 1 : 0.5 }}
              initial={reduzir ? false : { height: 0 }}
              whileInView={{ height: `${(b.quantos / maximo) * A}px` }}
              viewport={{ once: true }}
              transition={{ duration: reduzir ? 0 : 0.7, delay: reduzir ? 0 : i * 0.02 }}
            />
          </button>
        ))}
      </div>
      {xRef !== null && (
        <div
          className="pointer-events-none absolute top-0 h-[200px] w-[2px] bg-tinta/70"
          style={{ left: `${xRef}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-0.5 left-1.5 whitespace-nowrap text-[11px] font-semibold text-tinta-2">
            {referencia!.texto}
          </span>
        </div>
      )}
      <div className="mt-1 flex text-[11px] font-semibold text-tinta-3" aria-hidden="true">
        {barras.map((b, i) => (
          <span key={b.de} className="flex-1 text-left">
            {i % cadaRotulo === 0 ? rotuloEixo(b) : ''}
          </span>
        ))}
      </div>
      {ativa !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-20 w-max max-w-[15rem] -translate-x-1/2 rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
          style={{ left: `${((ativa + 0.5) / n) * 100}%` }}
        >
          <span className="block font-bold">{faixa(barras[ativa])}</span>
          <span className="block">
            {fmt(barras[ativa].quantos)} {unidade}
          </span>
          <span className="block text-tinta-3">{fmt(barras[ativa].eleitores)} eleitores</span>
        </div>
      )}
    </div>
  )
}
