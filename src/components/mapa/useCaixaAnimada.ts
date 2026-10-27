import { useEffect, useRef, useState } from 'react'
import { Caixa } from '../../data/geometriaMapa'

const DURACAO_MS = 500
const suave = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const reduzMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Anima o viewBox do SVG até a caixa alvo (zoom suave); sem animação se o usuário pediu menos movimento.
export function useCaixaAnimada({ x, y, w, h }: Caixa): Caixa {
  const [atual, setAtual] = useState<Caixa>({ x, y, w, h })
  const ref = useRef<Caixa>({ x, y, w, h })
  ref.current = atual

  useEffect(() => {
    const alvo = { x, y, w, h }
    if (reduzMovimento()) {
      setAtual(alvo)
      return
    }
    const de = ref.current
    const inicio = performance.now()
    let raf = 0
    const passo = (agora: number) => {
      // O quadro do rAF pode vir com horário anterior ao início: limita t a [0, 1].
      const t = Math.min(1, Math.max(0, (agora - inicio) / DURACAO_MS))
      const k = suave(t)
      setAtual({
        x: de.x + (alvo.x - de.x) * k,
        y: de.y + (alvo.y - de.y) * k,
        w: de.w + (alvo.w - de.w) * k,
        h: de.h + (alvo.h - de.h) * k
      })
      if (t < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [x, y, w, h])

  return atual
}
