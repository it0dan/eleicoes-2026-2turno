import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { numero as fmt } from '../../lib/formato'

export interface Fatia {
  chave: string
  rotulo: string
  valor: number
  /** % do total */
  percentual: number
  /** cor CSS */
  cor: string
  /** texto extra na legenda (ex.: "1.234 cidades") */
  detalhe?: string
}

const R = 70
const ESPESSURA = 22
const C = 2 * Math.PI * R
const FOLGA = 3 // espaço (na cor da superfície) entre fatias

/**
 * Rosca (pizza com furo): partes de um todo. O centro mostra a maior fatia, na cor dela e com o nome
 * embaixo; tocar/passar o mouse destaca outra fatia e a mostra no centro.
 */
export function Pizza({
  fatias,
  unidade
}: {
  fatias: Fatia[]
  /** [singular, plural], ex.: ['cidade', 'cidades'] */
  unidade?: [string, string]
}) {
  const reduzir = useReducedMotion()
  const [ativa, setAtiva] = useState<string | null>(null)
  const maior = fatias.reduce((a, f) => (f.valor > a.valor ? f : a), fatias[0])
  const foco = fatias.find((f) => f.chave === ativa) ?? maior

  let acumulado = 0
  const arcos = fatias.map((f) => {
    const comprimento = Math.max(0, (f.percentual / 100) * C - FOLGA)
    const inicio = acumulado
    acumulado += (f.percentual / 100) * C
    return { ...f, comprimento, inicio }
  })

  return (
    <div className="grid items-center gap-5">
      <div className="relative mx-auto w-full max-w-[200px]">
        <svg viewBox="0 0 180 180" className="w-full -rotate-90" aria-hidden="true">
          <circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke="rgb(var(--superficie-2))"
            strokeWidth={ESPESSURA}
          />
          {arcos.map((a, i) => (
            <motion.circle
              key={a.chave}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={a.cor}
              strokeWidth={ativa === a.chave ? ESPESSURA + 6 : ESPESSURA}
              strokeDashoffset={-a.inicio}
              initial={reduzir ? false : { strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${a.comprimento} ${C}` }}
              transition={{
                duration: reduzir ? 0 : 0.9,
                delay: reduzir ? 0 : i * 0.12,
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{ cursor: 'pointer', transition: 'stroke-width 150ms' }}
              onMouseEnter={() => setAtiva(a.chave)}
              onMouseLeave={() => setAtiva(null)}
              onClick={() => setAtiva((v) => (v === a.chave ? null : a.chave))}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-extrabold" style={{ color: foco.cor }}>
              {fmt(foco.percentual, 1)}%
            </p>
            <p className="max-w-[7rem] text-sm font-bold text-tinta">{foco.rotulo}</p>
          </div>
        </div>
      </div>

      {/* Legenda = também a versão em lista, acessível */}
      <ul className="grid gap-1 sm:grid-cols-2">
        {fatias.map((f) => (
          <li key={f.chave}>
            <button
              type="button"
              onMouseEnter={() => setAtiva(f.chave)}
              onMouseLeave={() => setAtiva(null)}
              onFocus={() => setAtiva(f.chave)}
              onBlur={() => setAtiva(null)}
              onClick={() => setAtiva((v) => (v === f.chave ? null : f.chave))}
              aria-pressed={ativa === f.chave}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                ativa === f.chave ? 'bg-superficie-2' : 'hover:bg-superficie-2/60'
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: f.cor }}
                aria-hidden="true"
              />
              <span className="flex-1 text-sm font-semibold text-tinta">
                {f.rotulo}
                {f.detalhe && (
                  <span className="block text-xs font-normal text-tinta-3">{f.detalhe}</span>
                )}
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold text-tinta">
                  {fmt(f.valor)}
                  {unidade && (
                    <span className="font-normal text-tinta-3">
                      {' '}
                      {f.valor === 1 ? unidade[0] : unidade[1]}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-tinta-3">{fmt(f.percentual, 1)}%</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
