import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ProrrogacaoNoLugar } from '../../services/prorrogacao'
import { deCada100, numero as fmt } from '../../lib/formato'
import { Dica } from '../ui/Dica'

/** Duas barras na mesma escala: a vantagem de Lula e todos os votos dados após as 17h. */
export function EscalaProrrogacao({ vantagem, tardios }: { vantagem: number; tardios: number }) {
  const reduzir = useReducedMotion()
  const proporcao = vantagem > 0 ? (tardios / vantagem) * 100 : 0
  const linhas = [
    { rotulo: 'Vantagem de Lula', valor: vantagem, largura: 100, cor: 'bg-destaque' },
    { rotulo: 'Votos depois das 17h', valor: tardios, largura: proporcao, cor: 'bg-cat-3' }
  ]
  return (
    <div
      className="space-y-3"
      role="img"
      aria-label={`Vantagem de Lula: ${fmt(vantagem)} votos. Votos depois das 17h: ${fmt(tardios)}.`}
    >
      {linhas.map((l, i) => (
        <div key={l.rotulo}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-tinta-2">{l.rotulo}</span>
            <span className="text-sm font-bold text-tinta">{fmt(l.valor)}</span>
          </div>
          <div className="h-5 overflow-hidden rounded-full bg-superficie-2">
            <motion.div
              className={`h-full rounded-r-full ${l.cor}`}
              initial={reduzir ? false : { width: 0 }}
              whileInView={{ width: `max(${l.largura}%, 4px)` }}
              viewport={{ once: true }}
              transition={{
                duration: reduzir ? 0 : 1.1,
                delay: reduzir ? 0 : i * 0.25,
                ease: [0.16, 1, 0.3, 1]
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-tinta-2">
        Todos os votos depois das 17h juntos são{' '}
        <strong className="text-tinta">{deCada100(proporcao)}</strong> votos da vantagem de Lula
        {proporcao < 1 && '. Por isso a barra laranja quase não aparece'}.
      </p>
    </div>
  )
}

/** Votos após 17h em cada lugar já conferido (uma série só: dispensa legenda). */
export function ProrrogacaoEstados({ itens }: { itens: ProrrogacaoNoLugar[] }) {
  const reduzir = useReducedMotion()
  const [aberto, setAberto] = useState<string | null>(null)
  const maximo = Math.max(1, ...itens.map((i) => i.apos17h))
  return (
    <ul className="space-y-1">
      {itens.map((e, i) => (
        <li key={e.chave}>
          <div
            tabIndex={0}
            onMouseEnter={() => setAberto(e.chave)}
            onMouseLeave={() => setAberto(null)}
            onFocus={() => setAberto(e.chave)}
            onBlur={() => setAberto(null)}
            aria-label={`${e.nome}: ${fmt(e.apos17h)} votos depois das 17h.`}
            className="relative grid min-h-[40px] grid-cols-[6.5rem_1fr_4.5rem] sm:grid-cols-[9rem_1fr_6rem] items-center gap-3 rounded-xl px-2 hover:bg-superficie-2/60"
          >
            <span className="py-1 text-sm font-semibold leading-tight text-tinta">{e.nome}</span>
            <span className="h-4 overflow-hidden rounded-full bg-superficie-2">
              <motion.span
                className="block h-full rounded-r-full bg-cat-3"
                initial={reduzir ? false : { width: 0 }}
                whileInView={{ width: `max(${(e.apos17h / maximo) * 100}%, 3px)` }}
                viewport={{ once: true }}
                transition={{
                  duration: reduzir ? 0 : 0.7,
                  delay: reduzir ? 0 : Math.min(i, 15) * 0.04
                }}
              />
            </span>
            <span className="text-right text-sm font-bold text-tinta">{fmt(e.apos17h)}</span>
            <Dica aberta={aberto === e.chave}>
              <span className="block font-bold">{e.nome}</span>
              <span className="block">Até 17h: {fmt(e.ate17h)} votos</span>
              <span className="block">
                Depois das 17h: {fmt(e.apos17h)} votos ({fmt(e.percentualApos, 2)}%)
              </span>
            </Dica>
          </div>
        </li>
      ))}
    </ul>
  )
}
