import { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useModal } from '../../hooks/useModal'

interface Props {
  aberto: boolean
  onFechar: () => void
  titulo: string
  /** controles no cabeçalho, ao lado do "Fechar" */
  acoes?: ReactNode
  /** faixa de controles abaixo do cabeçalho */
  barra?: ReactNode
  children: ReactNode
}

/** Janela que ocupa a tela toda (Esc fecha, foco preso dentro, rolagem da página travada). */
export function TelaCheia({ aberto, onFechar, titulo, acoes, barra, children }: Props) {
  const caixa = useModal(aberto, onFechar)
  if (!aberto) return null

  // Portal: as seções animadas usam transform, que prenderia o "fixed" dentro delas.
  return createPortal(
    <div
      ref={caixa}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 flex flex-col bg-superficie"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linha px-4 py-3">
        <h2 className="text-base font-extrabold text-tinta sm:text-lg">{titulo}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {acoes}
          <button
            onClick={onFechar}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-superficie-2 px-3 text-sm font-bold text-tinta focus:outline-none focus-visible:ring-2 focus-visible:ring-cat-1"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Fechar
          </button>
        </div>
      </div>
      {barra && <div className="border-b border-linha px-4 py-2">{barra}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">{children}</div>
    </div>,
    document.body
  )
}
