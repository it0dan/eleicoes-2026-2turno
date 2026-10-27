import { numero, proporcao } from '../../lib/formato'
import { REGIOES_BRASIL } from '../../data/geografia'
import { siglaDoLugar } from '../../data/lugares'
import { Metrica, Territorio } from '../../services/metricas'

interface Props {
  territorio: Territorio | null
  /** "estado" ou "cidade": muda só o texto de ajuda */
  tipo: 'estado' | 'cidade'
  metrica: Metrica
}

const regiaoDe = (uf: string) =>
  Object.values(REGIOES_BRASIL).find((r) => r.estados.includes(uf))?.nome

/** Resumo ao lado do mapa: quem ganhou no lugar em foco e o valor da métrica escolhida. */
export function ResumoTerritorio({ territorio: t, tipo, metrica }: Props) {
  if (!t) {
    return (
      <p className="py-3 text-center text-sm text-tinta-2">
        Toque em {tipo === 'estado' ? 'um estado' : 'uma cidade'} do mapa para ver quem ganhou.
      </p>
    )
  }
  const v = t.votos
  const pLula = proporcao(v.cand1, v.totalValidos)
  const pFlavio = proporcao(v.cand2, v.totalValidos)
  const lider = v.cand1 === v.cand2 ? null : v.cand1 > v.cand2 ? 'Lula' : 'Flávio'
  const valor = metrica.ler(t)
  const ehCidade = t.chave.length > 2

  return (
    <div className="space-y-3" aria-live="polite">
      <div>
        <h3 className="text-base font-black leading-tight text-tinta sm:text-lg">
          {t.nome}
          {ehCidade && ` (${siglaDoLugar(t.uf)})`}
        </h3>
        <p className="text-xs text-tinta-3">
          {ehCidade ? (t.capital ? 'Capital' : 'Cidade') : `Região ${regiaoDe(t.uf) ?? ''}`} ·{' '}
          {numero(v.eleitorado)} eleitores
        </p>
      </div>

      <p className="flex items-center gap-1.5 text-sm font-bold text-tinta">
        <span
          className={`h-2.5 w-2.5 rounded-full ${lider === 'Lula' ? 'bg-lula' : lider ? 'bg-flavio' : 'bg-tinta-3'}`}
          aria-hidden="true"
        />
        {lider ? `${lider} ganhou aqui` : 'Deu empate aqui'}
      </p>

      {[
        { nome: 'Lula', p: pLula, votos: v.cand1, cor: 'bg-lula' },
        { nome: 'Flávio Bolsonaro', p: pFlavio, votos: v.cand2, cor: 'bg-flavio' }
      ].map((c) => (
        <div key={c.nome}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-tinta">{c.nome}</span>
            <span className="text-lg font-black text-tinta">{numero(c.p, 1)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-superficie-2">
            <div className={`h-full rounded-full ${c.cor}`} style={{ width: `${c.p}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-tinta-3">{numero(c.votos)} votos</p>
        </div>
      ))}

      {metrica.id !== 'margem' && (
        <p className="rounded-xl bg-superficie-2 px-3 py-2 text-sm text-tinta">
          <span className="block text-xs text-tinta-2">{metrica.rotulo}</span>
          <strong>{valor === null ? 'sem dado' : metrica.formatar(valor)}</strong>
        </p>
      )}
    </div>
  )
}
