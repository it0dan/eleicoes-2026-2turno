import { ShieldCheck, Vote } from 'lucide-react'
import { Tema } from '../hooks/useTema'
import { BotaoTema } from './ui/BotaoTema'

const SECOES = [
  { id: 'resultado', rotulo: 'Resultado' },
  { id: 'mapa', rotulo: 'Mapa' },
  { id: 'analises', rotulo: 'Gráficos' },
  { id: 'prorrogacao', rotulo: 'Prorrogação' },
  { id: 'explorar', rotulo: 'Explorar' }
]

interface Props {
  tema: Tema
  onAlternarTema: () => void
  onAbrirFontes: () => void
}

export function Cabecalho({ tema, onAlternarTema, onAbrirFontes }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-linha/60 bg-fundo/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#resultado" className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brilho-1 via-brilho-3 to-brilho-2 text-white shadow-lg">
            <Vote className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold tracking-tight text-tinta">
              Painel Eleições Brasil
            </span>
            <span className="block truncate text-xs text-tinta-2">
              2º turno para presidente · dados do TSE
            </span>
          </span>
        </a>
        <nav aria-label="Seções" className="hidden lg:flex items-center gap-1">
          {SECOES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-tinta-2 transition hover:bg-superficie-2 hover:text-tinta"
            >
              {s.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAbrirFontes}
            className="hidden sm:inline-flex h-11 items-center gap-2 rounded-2xl border border-linha bg-superficie px-4 text-sm font-bold text-tinta-2 transition hover:text-tinta"
          >
            <ShieldCheck className="h-4 w-4 text-destaque" aria-hidden="true" />
            Conferir no TSE
          </button>
          <BotaoTema tema={tema} onAlternar={onAlternarTema} />
        </div>
      </div>
      {/* Celular: atalhos para as seções numa linha rolável; a borda direita esmaece para mostrar que tem mais */}
      <nav
        aria-label="Seções"
        className="flex gap-1 overflow-x-auto px-4 pb-2 pr-12 [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:px-6 sm:pr-12 lg:hidden"
      >
        {SECOES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm font-semibold text-tinta-2"
          >
            {s.rotulo}
          </a>
        ))}
        <button
          type="button"
          onClick={onAbrirFontes}
          className="shrink-0 rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm font-semibold text-tinta-2 sm:hidden"
        >
          Conferir no TSE
        </button>
      </nav>
    </header>
  )
}
