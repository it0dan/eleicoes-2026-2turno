import { Metrica } from '../../services/metricas'
import { ESCALA_FLAVIO, ESCALA_LULA, ESCALA_SEQUENCIAL, SEM_DADO } from './cores'

/** Como ler as cores do mapa, para a métrica escolhida. */
export function LegendaMapa({ metrica, cortes }: { metrica: Metrica; cortes: number[] }) {
  if (metrica.escala === 'divergente') {
    return (
      <div className="space-y-1.5 text-xs text-tinta-2">
        <p className="font-bold text-tinta">Como ler as cores</p>
        {[
          { nome: 'Lula', escala: ESCALA_LULA },
          { nome: 'Flávio', escala: ESCALA_FLAVIO }
        ].map((l) => (
          <div key={l.nome} className="flex items-center gap-2">
            <span className="w-16 shrink-0">{l.nome}</span>
            <span className="flex h-2.5 flex-1 overflow-hidden rounded-full">
              {l.escala.map((cor) => (
                <span key={cor} className="flex-1" style={{ backgroundColor: cor }} />
              ))}
            </span>
          </div>
        ))}
        <p className="text-tinta-3">
          Vermelho: Lula ganhou. Azul: Flávio ganhou. Quanto mais escura a cor, maior a vitória ali.
        </p>
      </div>
    )
  }

  // Sequencial: 5 grupos com a mesma quantidade de lugares (quintos).
  const faixas = ESCALA_SEQUENCIAL.map((cor, i) => {
    const de = i === 0 ? null : cortes[i - 1]
    const ate = i === ESCALA_SEQUENCIAL.length - 1 ? null : cortes[i]
    const texto =
      de === null && ate !== null
        ? `até ${metrica.formatar(ate)}`
        : ate === null && de !== null
          ? `mais de ${metrica.formatar(de)}`
          : de !== null && ate !== null
            ? `${metrica.formatar(de)} a ${metrica.formatar(ate)}`
            : ''
    return { cor, texto }
  })
  return (
    <div className="space-y-1.5 text-xs text-tinta-2">
      <p className="font-bold text-tinta">{metrica.rotulo}</p>
      <ul className="space-y-1">
        {faixas.map((f) => (
          <li key={f.cor} className="flex items-center gap-2">
            <span className="h-3 w-6 shrink-0 rounded" style={{ backgroundColor: f.cor }} />
            {f.texto}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-3 w-6 shrink-0 rounded" style={{ backgroundColor: SEM_DADO }} />
          sem dado
        </li>
      </ul>
      <p className="text-tinta-3">
        {metrica.rotulo}: {metrica.explicacao}. Cor mais forte = número maior. Cada cor junta a
        mesma quantidade de lugares. Fonte: {metrica.fonte}.
      </p>
    </div>
  )
}
