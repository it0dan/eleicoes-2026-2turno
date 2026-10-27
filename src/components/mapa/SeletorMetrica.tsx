import { METRICAS, MetricaId } from '../../services/metricas'

/** Métricas que dá para pintar no mapa, na ordem dos botões. */
const MODOS: MetricaId[] = [
  'margem',
  'abstencao',
  'brancosNulos',
  'apos17h',
  'pibPorPessoa',
  'agroPct'
]

export function SeletorMetrica({
  valor,
  onChange
}: {
  valor: MetricaId
  onChange: (m: MetricaId) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="A cor do mapa mostra"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="rotulo mr-1">A cor do mapa mostra</span>
      {MODOS.map((id) => {
        const ativo = valor === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(id)}
            className={`min-h-[40px] rounded-xl border px-3 text-xs font-bold transition sm:text-sm ${
              ativo
                ? 'border-transparent bg-tinta text-fundo'
                : 'border-linha bg-superficie text-tinta-2 hover:text-tinta'
            }`}
          >
            {METRICAS[id].rotulo}
          </button>
        )
      })}
    </div>
  )
}
