import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Confronto } from '../../services/graficos'
import { casasParaDesempatar as casasPar, numero as fmt } from '../../lib/formato'
import { Dica } from '../ui/Dica'

interface Props {
  itens: Confronto[]
  selecionado?: string | null
  onSelecionar?: (chave: string) => void
  /** mostra a sigla (estados) em vez do nome inteiro em telas pequenas */
  compacto?: boolean
}

/**
 * Uma linha por lugar: a barra é 100% dos votos válidos dali (Lula à esquerda, Flávio à direita) e a linha
 * vertical marca 50% — quem passa dela venceu. Tocar a linha seleciona o lugar no painel.
 */
export function BarrasConfronto({ itens, selecionado, onSelecionar, compacto }: Props) {
  const reduzir = useReducedMotion()
  const [aberto, setAberto] = useState<string | null>(null)

  return (
    <div>
      <div
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-tinta-2"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lula" />
          Lula
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-flavio" />
          Flávio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[2px] bg-tinta/70" />
          metade dos votos
        </span>
      </div>
      <ul className="space-y-1">
        {itens.map((c, i) => {
          const ativo = selecionado === c.chave
          const venceu = c.margem >= 0 ? 'Lula' : 'Flávio'
          return (
            <motion.li
              key={c.chave}
              layout={!reduzir}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <button
                type="button"
                onClick={() => onSelecionar?.(c.chave)}
                onMouseEnter={() => setAberto(c.chave)}
                onMouseLeave={() => setAberto(null)}
                onFocus={() => setAberto(c.chave)}
                onBlur={() => setAberto(null)}
                aria-pressed={ativo}
                aria-label={`${c.nome}: Lula ${fmt(c.percLula, 1)}%, Flávio ${fmt(c.percFlavio, 1)}%. ${venceu} venceu.`}
                className={`group grid min-h-[44px] w-full ${compacto ? 'grid-cols-[4.5rem_1fr]' : 'grid-cols-[6.5rem_1fr]'} sm:grid-cols-[8.5rem_1fr] items-center gap-3 rounded-xl px-2 py-1.5 text-left transition ${
                  ativo ? 'bg-superficie-2 ring-1 ring-linha' : 'hover:bg-superficie-2/60'
                }`}
              >
                <span className="truncate text-sm font-semibold text-tinta">
                  {compacto ? (
                    <>
                      <span className="sm:hidden">{c.chave}</span>
                      <span className="hidden sm:inline">{c.nome}</span>
                    </>
                  ) : (
                    c.nome
                  )}
                </span>
                <span className="relative block">
                  <span className="flex h-5 gap-[2px] overflow-hidden rounded-full bg-superficie-2">
                    <motion.span
                      className="block h-full rounded-l-full bg-lula"
                      initial={reduzir ? false : { width: '50%' }}
                      animate={{ width: `calc(${c.percLula}% - 1px)` }}
                      transition={{
                        duration: reduzir ? 0 : 0.8,
                        delay: reduzir ? 0 : Math.min(i, 12) * 0.03,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                    />
                    <span className="block h-full flex-1 rounded-r-full bg-flavio" />
                  </span>
                  <span
                    className="absolute inset-y-[-3px] left-1/2 w-[2px] -translate-x-1/2 bg-tinta/70"
                    aria-hidden="true"
                  />
                  <span className="mt-0.5 flex justify-between text-[11px] font-semibold text-tinta-3">
                    <span>{fmt(c.percLula, casasPar(c.percLula, c.percFlavio))}%</span>
                    <span>{fmt(c.percFlavio, casasPar(c.percLula, c.percFlavio))}%</span>
                  </span>
                  <Dica aberta={aberto === c.chave}>
                    <span className="block font-bold">{c.nome}</span>
                    <span className="block">
                      Lula: {fmt(c.lula)} votos ({fmt(c.percLula, 2)}%)
                    </span>
                    <span className="block">
                      Flávio: {fmt(c.flavio)} votos ({fmt(c.percFlavio, 2)}%)
                    </span>
                    <span className="block text-tinta-3">
                      {venceu} venceu por {fmt(Math.abs(c.lula - c.flavio))} votos
                    </span>
                  </Dica>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
