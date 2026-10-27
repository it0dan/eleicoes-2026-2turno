import { useId } from 'react'
import { motion } from 'framer-motion'

interface Opcao<T extends string> {
  valor: T
  rotulo: string
  cor?: string // classe Tailwind do ponto colorido (ex.: 'bg-destaque')
}

interface Props<T extends string> {
  opcoes: Opcao<T>[]
  valor: T
  onChange: (v: T) => void
  rotuloGrupo: string
  className?: string
}

/** Botões lado a lado com um indicador que desliza até a opção escolhida. */
export function ControleSegmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotuloGrupo,
  className = ''
}: Props<T>) {
  const grupo = useId()
  return (
    <div
      role="radiogroup"
      aria-label={rotuloGrupo}
      className={`relative grid gap-1 rounded-2xl border border-linha bg-superficie-2/80 p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={`relative z-10 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[13px] sm:text-sm font-bold leading-tight transition-colors ${
              ativo ? 'text-tinta' : 'text-tinta-3 hover:text-tinta'
            }`}
          >
            {ativo && (
              <motion.span
                layoutId={`indicador-${grupo}`}
                className="absolute inset-0 -z-10 rounded-xl bg-superficie shadow-md ring-1 ring-linha"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {o.cor && (
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${o.cor}`} aria-hidden="true" />
            )}
            <span className="text-center">{o.rotulo}</span>
          </button>
        )
      })}
    </div>
  )
}
