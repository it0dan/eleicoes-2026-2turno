import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { numero } from '../../lib/formato'

interface Props {
  valor: number
  casas?: number
  sufixo?: string
  className?: string
}

/** Número que "conta" até o valor quando entra na tela e sempre que muda. */
export function NumeroAnimado({ valor, casas = 0, sufixo = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef(0)
  const visivel = useInView(ref, { once: true, margin: '-40px' })
  const reduzir = useReducedMotion()
  const formatar = (n: number) => numero(n, casas) + sufixo

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduzir || !visivel) {
      el.textContent = formatar(valor)
      if (reduzir) anterior.current = valor
      if (!visivel) return
    }
    const controle = animate(anterior.current, valor, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = formatar(v)
      }
    })
    anterior.current = valor
    return () => controle.stop()
  }, [valor, visivel, reduzir]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={className} aria-label={formatar(valor)}>
      {formatar(valor)}
    </span>
  )
}
