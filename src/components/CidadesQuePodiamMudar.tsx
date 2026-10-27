import { Building2 } from 'lucide-react'
import { Cidade } from '../data/cidades'
import { EXTERIOR, siglaDoLugar } from '../data/lugares'
import { numero as num } from '../lib/formato'
import { cidadesQuePodiamMudar } from '../services/prorrogacao'

const votos = (n: number) => `${num(n)} ${n === 1 ? 'voto' : 'votos'}`

const vencedor = (c: Cidade) =>
  c.votos.cand1 === c.votos.cand2 ? null : c.votos.cand1 > c.votos.cand2 ? 'Lula' : 'Flávio'

/** As cidades onde os votos após 17h bastariam para mudar o resultado local (com a lista completa). */
export function CidadesQuePodiamMudar({ cidades }: { cidades: Cidade[] }) {
  const lista = cidadesQuePodiamMudar(cidades)
  if (lista.length === 0) return null
  const noBrasil = lista.filter((c) => c.uf !== EXTERIOR)
  const noExterior = lista.filter((c) => c.uf === EXTERIOR)
  const exteriorSemHorario = noExterior.every((c) => c.votosSemHorario === c.votosDepoisDas17h)
  const votosExterior = noExterior.reduce((n, c) => n + c.comparecimento, 0)

  return (
    <div className="mt-6 rounded-2xl border border-linha bg-superficie-2/60 p-4">
      <h3 className="flex items-center gap-2 text-base font-bold text-tinta">
        <Building2 className="h-5 w-5 text-cat-3" aria-hidden="true" />E nas cidades?
      </h3>
      <p className="mt-2 text-sm text-tinta">
        Em <strong>{lista.length}</strong> das {num(cidades.length)} cidades, os votos depois das
        17h poderiam ter mudado quem ganhou <em>na cidade</em>.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tinta-2">
        {noBrasil.length > 0 && (
          <li>
            <strong className="text-tinta">
              No Brasil, {noBrasil.length === 1 ? 'só 1' : noBrasil.length}:
            </strong>{' '}
            {noBrasil.map((c, i) => {
              const quem = vencedor(c)
              return (
                <span key={c.codigo}>
                  {i > 0 && '; '}
                  {c.nome} ({c.uf}) —{' '}
                  {quem
                    ? `${quem} ganhou por ${votos(Math.abs(c.votos.cand1 - c.votos.cand2))}`
                    : 'deu empate'}
                  , e houve {votos(c.votosDepoisDas17h)} depois das 17h
                </span>
              )
            })}
            .
          </li>
        )}
        {noExterior.length > 0 && (
          <li>
            <strong className="text-tinta">No exterior, {noExterior.length}:</strong> cidades
            pequenas, com {votos(votosExterior)} no total.
            {exteriorSemHorario &&
              ' Nelas o TSE não publicou o horário dos votos, então, por segurança, contamos todos como depois das 17h.'}
          </li>
        )}
      </ul>
      <p className="mt-2 text-sm font-semibold text-tinta">
        Nada disso muda quem ganhou no Brasil.
      </p>

      <details className="mt-3">
        <summary className="inline-flex min-h-[40px] cursor-pointer items-center rounded-xl px-1 text-sm font-bold text-tinta-2 hover:text-tinta">
          Ver as {lista.length} cidades
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-tinta-3">
                <th className="py-2 pr-2 font-semibold">Cidade</th>
                <th className="py-2 pr-2 text-right font-semibold">Lula</th>
                <th className="py-2 pr-2 text-right font-semibold">Flávio</th>
                <th className="py-2 text-right font-semibold">Depois das 17h</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.codigo} className="border-b border-linha/60">
                  <td className="py-2 pr-2 font-semibold text-tinta">
                    {c.nome} ({siglaDoLugar(c.uf)})
                  </td>
                  <td className="py-2 pr-2 text-right text-tinta-2">{num(c.votos.cand1)}</td>
                  <td className="py-2 pr-2 text-right text-tinta-2">{num(c.votos.cand2)}</td>
                  <td className="py-2 text-right font-semibold text-tinta">
                    {num(c.votosDepoisDas17h)}
                    {c.votosSemHorario > 0 && (
                      <span className="block text-xs font-normal text-tinta-3">
                        {c.votosSemHorario === c.votosDepoisDas17h
                          ? 'todos sem horário'
                          : `${num(c.votosSemHorario)} sem horário`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
