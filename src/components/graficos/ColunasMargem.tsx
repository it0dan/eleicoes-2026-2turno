import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Confronto } from '../../services/graficos'
import { casasParaDesempatar as casasPar, numero as fmt } from '../../lib/formato'

interface Props {
  itens: Confronto[]
  /** nome curto embaixo de cada coluna (ex.: sigla do estado) */
  rotulo: (c: Confronto) => string
  selecionado?: string | null
  onSelecionar?: (chave: string) => void
}

const A = 220 // altura útil das colunas

const descricao = (c: Confronto) => {
  const venceu = c.margem >= 0 ? 'Lula' : 'Flávio'
  return `${c.nome}: ${venceu} venceu. Lula ${fmt(c.percLula, 1)}%, Flávio ${fmt(c.percFlavio, 1)}%.`
}

function Detalhe({ c }: { c: Confronto }) {
  const casas = casasPar(c.percLula, c.percFlavio)
  return (
    <>
      <span className="block font-bold">{c.nome}</span>
      <span className="block">
        Lula: {fmt(c.percLula, casas)}% · Flávio: {fmt(c.percFlavio, casas)}%
      </span>
      <span className="block text-tinta-3">
        {c.margem >= 0 ? 'Lula' : 'Flávio'} venceu por {fmt(Math.abs(c.lula - c.flavio))} votos
      </span>
    </>
  )
}

/**
 * Uma coluna por lugar, saindo de uma linha do meio: para cima quando Lula venceu, para baixo quando Flávio
 * venceu; o tamanho é a diferença entre os dois (em % dos votos válidos). No celular vira barras deitadas
 * (para a direita = Lula, para a esquerda = Flávio). Tocar escolhe o lugar no painel.
 */
export function ColunasMargem({ itens, rotulo, selecionado, onSelecionar }: Props) {
  const reduzir = useReducedMotion()
  const [ativa, setAtiva] = useState<string | null>(null)
  const maxLula = Math.max(0, ...itens.map((c) => c.margem))
  const maxFlavio = Math.max(0, ...itens.map((c) => -c.margem))
  const escala = Math.max(1e-9, maxLula + maxFlavio)
  const zero = (maxLula / escala) * A // distância do topo até a linha do meio
  const n = itens.length
  const iAtiva = itens.findIndex((c) => c.chave === ativa)
  const transicao = (i: number) => ({
    duration: reduzir ? 0 : 0.7,
    delay: reduzir ? 0 : Math.min(i, 27) * 0.02,
    ease: [0.16, 1, 0.3, 1] as const
  })
  const eventos = (c: Confronto) => ({
    onClick: () => onSelecionar?.(c.chave),
    onMouseEnter: () => setAtiva(c.chave),
    onMouseLeave: () => setAtiva(null),
    onFocus: () => setAtiva(c.chave),
    onBlur: () => setAtiva(null),
    'aria-pressed': selecionado === c.chave,
    'aria-label': descricao(c)
  })

  return (
    <div>
      <div
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-tinta-2"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lula" />
          <span>
            Lula venceu <span className="hidden sm:inline">(para cima)</span>
            <span className="sm:hidden">(para a direita)</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-flavio" />
          <span>
            Flávio venceu <span className="hidden sm:inline">(para baixo)</span>
            <span className="sm:hidden">(para a esquerda)</span>
          </span>
        </span>
        <span>Quanto maior, maior a diferença</span>
      </div>

      {/* Telas médias e grandes: colunas em pé */}
      <div className="relative hidden sm:block">
        <div className="flex gap-[2px]" style={{ height: A }}>
          {itens.map((c, i) => {
            const altura = (Math.abs(c.margem) / escala) * A
            const lula = c.margem >= 0
            const realce = ativa === null || ativa === c.chave || selecionado === c.chave
            return (
              <button
                key={c.chave}
                type="button"
                {...eventos(c)}
                className={`relative h-full flex-1 rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cat-1 ${
                  selecionado === c.chave ? 'bg-superficie-2' : 'hover:bg-superficie-2/60'
                }`}
              >
                <motion.span
                  className={`absolute inset-x-[15%] block ${lula ? 'rounded-t-[4px] bg-lula' : 'rounded-b-[4px] bg-flavio'}`}
                  style={{
                    ...(lula ? { bottom: A - zero } : { top: zero }),
                    opacity: realce ? 1 : 0.45
                  }}
                  initial={reduzir ? false : { height: 0 }}
                  whileInView={{ height: Math.max(2, altura) }}
                  viewport={{ once: true }}
                  transition={transicao(i)}
                />
              </button>
            )
          })}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 h-[2px] bg-tinta/70"
          style={{ top: zero - 1 }}
          aria-hidden="true"
        />
        <div
          className="mt-1 flex gap-[2px] text-[11px] font-semibold text-tinta-2"
          aria-hidden="true"
        >
          {itens.map((c) => (
            <span
              key={c.chave}
              className={`flex-1 truncate text-center ${selecionado === c.chave ? 'font-extrabold text-tinta' : ''}`}
            >
              {rotulo(c)}
            </span>
          ))}
        </div>
        {iAtiva >= 0 && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-20 w-max max-w-[16rem] -translate-x-1/2 rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
            style={{ left: `${Math.min(88, Math.max(12, ((iAtiva + 0.5) / n) * 100))}%` }}
          >
            <Detalhe c={itens[iAtiva]} />
          </div>
        )}
      </div>

      {/* Celular: barras deitadas, saindo da linha do meio */}
      <ul className="space-y-0.5 sm:hidden">
        {itens.map((c, i) => {
          const lula = c.margem >= 0
          const largura = (Math.abs(c.margem) / escala) * 100
          const meio = (maxFlavio / escala) * 100
          return (
            <li key={c.chave}>
              <button
                type="button"
                {...eventos(c)}
                className={`grid min-h-[36px] w-full grid-cols-[2.25rem_1fr] items-center gap-2 rounded-lg px-1 text-left ${
                  selecionado === c.chave ? 'bg-superficie-2 ring-1 ring-linha' : ''
                }`}
              >
                <span className="text-xs font-bold text-tinta">{rotulo(c)}</span>
                <span className="relative block h-4">
                  <span
                    className="absolute inset-y-[-4px] w-[2px] bg-tinta/70"
                    style={{ left: `calc(${meio}% - 1px)` }}
                    aria-hidden="true"
                  />
                  <motion.span
                    className={`absolute inset-y-0 block ${lula ? 'rounded-r-[4px] bg-lula' : 'rounded-l-[4px] bg-flavio'}`}
                    style={lula ? { left: `${meio}%` } : { right: `${100 - meio}%` }}
                    initial={reduzir ? false : { width: 0 }}
                    whileInView={{ width: `max(2px, ${largura}%)` }}
                    viewport={{ once: true }}
                    transition={transicao(i)}
                  />
                </span>
              </button>
              {ativa === c.chave && (
                <p role="status" className="mb-1 ml-11 text-xs text-tinta">
                  <Detalhe c={c} />
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
