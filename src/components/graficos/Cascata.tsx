import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DegrauCascata } from '../../services/analises'
import { numero as fmt } from '../../lib/formato'
import { Dica } from '../ui/Dica'

/**
 * Cascata deitada: cada linha é um lugar e a barra vai do saldo acumulado antes dele até o saldo depois.
 * Vermelho = somou vantagem para Lula; azul = tirou (vantagem do Flávio ali). A última linha é o total.
 */
export function Cascata({
  degraus,
  rotuloTotal
}: {
  degraus: DegrauCascata[]
  rotuloTotal: string
}) {
  const reduzir = useReducedMotion()
  const [aberto, setAberto] = useState<string | null>(null)
  const extremos = degraus.flatMap((d) => [d.inicio, d.fim])
  const min = Math.min(0, ...extremos)
  const max = Math.max(1, ...extremos)
  const x = (v: number) => ((v - min) / (max - min)) * 100
  const total = degraus[degraus.length - 1]?.fim ?? 0
  const linhas = [
    ...degraus,
    { chave: '_total', nome: rotuloTotal, saldo: total, inicio: 0, fim: total }
  ]

  return (
    <div>
      <div
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-tinta-2"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lula" />
          deu vantagem a Lula
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-flavio" />
          deu vantagem a Flávio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-tinta" />
          resultado
        </span>
      </div>
      <ul className="space-y-1">
        {linhas.map((d, i) => {
          const ehTotal = d.chave === '_total'
          const a = x(Math.min(d.inicio, d.fim))
          const largura = Math.max(0.6, Math.abs(x(d.fim) - x(d.inicio)))
          const cor = ehTotal ? 'bg-tinta' : d.saldo > 0 ? 'bg-lula' : 'bg-flavio'
          return (
            <li
              key={d.chave}
              tabIndex={0}
              onMouseEnter={() => setAberto(d.chave)}
              onMouseLeave={() => setAberto(null)}
              onFocus={() => setAberto(d.chave)}
              onBlur={() => setAberto(null)}
              aria-label={`${d.nome}: ${d.saldo >= 0 ? '+' : '−'}${fmt(Math.abs(d.saldo))} votos para ${d.saldo >= 0 ? 'Lula' : 'Flávio'}`}
              className={`relative grid min-h-[36px] grid-cols-[7.5rem_1fr] items-center gap-3 rounded-lg px-2 sm:grid-cols-[11rem_1fr] ${
                ehTotal ? 'mt-2 border-t border-linha pt-2 font-bold' : 'hover:bg-superficie-2/60'
              }`}
            >
              <span className="truncate text-sm font-semibold text-tinta">{d.nome}</span>
              <span className="relative block h-5">
                <span
                  className="absolute inset-y-[-4px] w-px bg-tinta/40"
                  style={{ left: `${x(0)}%` }}
                  aria-hidden="true"
                />
                <motion.span
                  className={`absolute inset-y-0 rounded-[4px] ${cor}`}
                  style={{ left: `${a}%` }}
                  initial={reduzir ? false : { width: 0 }}
                  whileInView={{ width: `${largura}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: reduzir ? 0 : 0.6, delay: reduzir ? 0 : i * 0.05 }}
                />
                <Dica aberta={aberto === d.chave}>
                  <span className="block font-bold">{d.nome}</span>
                  <span className="block">
                    {ehTotal
                      ? 'Vantagem final de '
                      : d.saldo >= 0
                        ? 'Somou para Lula: '
                        : 'Tirou de Lula: '}
                    {ehTotal && (d.saldo >= 0 ? 'Lula: ' : 'Flávio: ')}
                    {fmt(Math.abs(d.saldo))} votos
                  </span>
                  {!ehTotal && (
                    <span className="block text-tinta-3">
                      Vantagem acumulada: {d.fim >= 0 ? 'Lula' : 'Flávio'} +{fmt(Math.abs(d.fim))}
                    </span>
                  )}
                </Dica>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
