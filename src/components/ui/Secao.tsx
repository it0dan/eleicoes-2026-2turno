import { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  id?: string
  titulo?: string
  subtitulo?: string
  acao?: ReactNode
  children: ReactNode
  className?: string
}

/** Cartão de seção com entrada suave ao rolar a página. */
export function Secao({ id, titulo, subtitulo, acao, children, className = '' }: Props) {
  const reduzir = useReducedMotion()
  return (
    <motion.section
      id={id}
      aria-labelledby={titulo && id ? `${id}-titulo` : undefined}
      initial={reduzir ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`cartao p-4 sm:p-6 ${className}`}
    >
      {(titulo || acao) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && (
              <h2
                id={id ? `${id}-titulo` : undefined}
                className="text-lg sm:text-xl font-extrabold tracking-tight text-tinta"
              >
                {titulo}
              </h2>
            )}
            {subtitulo && <p className="mt-0.5 text-sm text-tinta-2">{subtitulo}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </motion.section>
  )
}
