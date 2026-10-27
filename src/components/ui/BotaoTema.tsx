import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Tema } from '../../hooks/useTema'

export function BotaoTema({ tema, onAlternar }: { tema: Tema; onAlternar: () => void }) {
  const escuro = tema === 'escuro'
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-linha bg-superficie text-tinta-2 transition hover:text-tinta"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={tema}
          initial={{ y: 16, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -16, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.25 }}
        >
          {escuro ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
