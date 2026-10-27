import { motion, useReducedMotion } from 'framer-motion'

export interface ItemRanking {
  chave: string
  nome: string
  valor: number
  texto: string
}

/** Lista ordenada com uma barra por item (uma medida só: dispensa legenda). Tocar escolhe o item. */
export function Ranking({
  itens,
  onSelecionar,
  selecionado
}: {
  itens: ItemRanking[]
  onSelecionar?: (chave: string) => void
  selecionado?: string | null
}) {
  const reduzir = useReducedMotion()
  const maximo = Math.max(1e-9, ...itens.map((i) => Math.abs(i.valor)))
  return (
    <ol className="space-y-1">
      {itens.map((it, i) => (
        <li key={it.chave}>
          <button
            type="button"
            onClick={() => onSelecionar?.(it.chave)}
            aria-pressed={selecionado === it.chave}
            className={`grid min-h-[40px] w-full grid-cols-[1.75rem_minmax(0,9rem)_1fr_auto] items-center gap-2 rounded-xl px-2 text-left text-sm transition sm:grid-cols-[2rem_minmax(0,14rem)_1fr_auto] ${
              selecionado === it.chave
                ? 'bg-superficie-2 ring-1 ring-linha'
                : 'hover:bg-superficie-2/60'
            }`}
          >
            <span className="text-right text-xs font-bold text-tinta-3">{i + 1}º</span>
            <span className="truncate font-semibold text-tinta">{it.nome}</span>
            <span className="h-3 overflow-hidden rounded-full bg-superficie-2">
              <motion.span
                className="block h-full rounded-r-full bg-cat-1"
                initial={reduzir ? false : { width: 0 }}
                animate={{ width: `${(Math.abs(it.valor) / maximo) * 100}%` }}
                transition={{
                  duration: reduzir ? 0 : 0.6,
                  delay: reduzir ? 0 : Math.min(i, 20) * 0.02
                }}
              />
            </span>
            <span className="text-right font-bold text-tinta">{it.texto}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
