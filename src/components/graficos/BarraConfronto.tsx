import { motion, useReducedMotion } from 'framer-motion'
import { NumeroAnimado } from '../ui/NumeroAnimado'

interface Lado {
  nome: string
  votos: number
  percentual: number
}

/** "Cabo de guerra": a barra inteira é 100% dos votos válidos; a linha central marca 50%. */
export function BarraConfronto({ lula, flavio }: { lula: Lado; flavio: Lado }) {
  const reduzir = useReducedMotion()
  const trans = reduzir ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        {[lula, flavio].map((l, i) => (
          <div key={l.nome} className={i === 1 ? 'text-right' : ''}>
            <p
              className="flex items-center gap-2 text-sm font-bold text-tinta-2"
              style={{ justifyContent: i ? 'flex-end' : undefined }}
            >
              {i === 0 && <span className="h-3 w-3 rounded-full bg-lula" aria-hidden="true" />}
              {l.nome}
              {i === 1 && <span className="h-3 w-3 rounded-full bg-flavio" aria-hidden="true" />}
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-tinta">
              <NumeroAnimado valor={l.percentual} casas={2} sufixo="%" />
            </p>
            <p className="text-xs sm:text-sm text-tinta-3">
              <NumeroAnimado valor={l.votos} /> votos
            </p>
          </div>
        ))}
      </div>

      <div
        className="relative mt-4 flex h-6 gap-[2px] overflow-hidden rounded-full bg-superficie-2"
        role="img"
        aria-label={`${lula.nome} ${lula.percentual.toFixed(2)}%, ${flavio.nome} ${flavio.percentual.toFixed(2)}% dos votos válidos`}
      >
        <motion.div
          className="h-full rounded-l-full bg-lula"
          initial={{ width: reduzir ? `${lula.percentual}%` : '50%' }}
          animate={{ width: `calc(${lula.percentual}% - 1px)` }}
          transition={trans}
        />
        <div className="h-full flex-1 rounded-r-full bg-flavio" />
        <div
          className="absolute inset-y-[-4px] left-1/2 w-[2px] -translate-x-1/2 bg-tinta/70"
          aria-hidden="true"
        />
      </div>
      <p className="mt-1.5 text-center text-xs text-tinta-3">
        A linha do meio marca metade dos votos
      </p>
    </div>
  )
}
