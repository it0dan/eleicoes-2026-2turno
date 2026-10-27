import { ReactNode } from 'react'

/** Balão de dica sobre a marca em foco (mouse, toque ou teclado). O pai precisa ser `relative`. */
export function Dica({ aberta, children }: { aberta: boolean; children: ReactNode }) {
  if (!aberta) return null
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 block w-max max-w-[16rem] -translate-x-1/2 rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl"
    >
      {children}
    </span>
  )
}
