import { RefObject, useEffect, useRef } from 'react'

const FOCAVEIS =
  'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Comportamento comum dos modais. Enquanto aberto: Esc fecha, a página de trás não rola, o primeiro controle
 * recebe o foco e o Tab fica dentro do modal. Ao fechar, o foco volta para quem abriu.
 * Devolve o ref para colocar no elemento com role="dialog".
 */
export function useModal<T extends HTMLElement = HTMLDivElement>(
  aberto: boolean,
  onFechar: () => void
): RefObject<T> {
  const ref = useRef<T>(null)
  const fechar = useRef(onFechar)
  fechar.current = onFechar

  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const el = ref.current
    const focaveis = () =>
      el
        ? [...el.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((f) => f.offsetParent !== null)
        : []
    if (el && !el.contains(document.activeElement)) focaveis()[0]?.focus()

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fechar.current()
        return
      }
      if (e.key !== 'Tab') return
      const lista = focaveis()
      if (lista.length === 0) return
      const primeiro = lista[0]
      const ultimo = lista[lista.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [aberto])

  return ref
}
