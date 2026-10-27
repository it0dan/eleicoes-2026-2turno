import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Hourglass, Table2, BarChart3 } from 'lucide-react'
import { TOTAL_LUGARES, nomeDoLugar } from '../data/lugares'
import { numero as num } from '../lib/formato'
import {
  ATUALIZADO_EM,
  lugaresExportados,
  prorrogacaoNasCidades,
  prorrogacaoPorLugar,
  provaNacional,
  resumoConferido
} from '../services/prorrogacao'
import { Cidade } from '../data/cidades'
import { Secao } from './ui/Secao'
import { ControleSegmentado } from './ui/ControleSegmentado'
import { CidadesQuePodiamMudar } from './CidadesQuePodiamMudar'
import { NumeroAnimado } from './ui/NumeroAnimado'
import { EscalaProrrogacao, ProrrogacaoEstados } from './graficos/ProrrogacaoEstados'

const MAIS_CIDADES = 15

export function SecaoProrrogacao({ cidades }: { cidades: Cidade[] | null }) {
  const reduzir = useReducedMotion()
  const [verTabela, setVerTabela] = useState(false)
  const [recorte, setRecorte] = useState<'estados' | 'cidades'>('estados')
  const porCidade = recorte === 'cidades' && cidades !== null
  const itens = porCidade ? prorrogacaoNasCidades(cidades, MAIS_CIDADES) : prorrogacaoPorLugar()
  const lugares = lugaresExportados()
  const resumo = resumoConferido()
  const { tardios, ate17h, completo } = resumo
  const prova = provaNacional()
  const nomesPendentes = prova.pendentes.map(nomeDoLugar).sort((a, b) => a.localeCompare(b))
  const ondeSoma = completo ? 'no Brasil todo' : `nos ${resumo.lugares} lugares já conferidos`

  return (
    <Secao
      id="prorrogacao"
      titulo="A votação passou das 17h. Isso mudou quem ganhou?"
      subtitulo="Cada urna anota a hora de cada voto (não em quem foi). Contamos, urna por urna, quantos votos foram dados depois das 17h."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            rotulo: 'Lula ganhou por',
            valor: prova.vantagemFinal,
            nota: 'votos, no Brasil',
            cor: 'bg-destaque'
          },
          {
            rotulo: 'Votos até as 17h',
            valor: ate17h,
            nota: `votos ${ondeSoma}`,
            cor: 'bg-cat-1'
          },
          {
            rotulo: 'Votos depois das 17h',
            valor: tardios,
            nota: `votos ${ondeSoma}`,
            cor: 'bg-cat-3'
          }
        ].map((c) => (
          <div
            key={c.rotulo}
            className="relative overflow-hidden rounded-2xl border border-linha bg-superficie-2/60 p-4"
          >
            <span className={`absolute inset-x-0 top-0 h-1 ${c.cor}`} aria-hidden="true" />
            <p className="text-sm font-semibold text-tinta-2">{c.rotulo}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-tinta">
              <NumeroAnimado valor={c.valor} />
            </p>
            <p className="text-xs text-tinta-3">{c.nota}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={reduzir ? false : { opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${
          prova.provado ? 'border-destaque/40 bg-destaque/10' : 'border-linha bg-superficie-2/60'
        }`}
      >
        {prova.provado ? (
          <>
            <CheckCircle2 className="h-7 w-7 shrink-0 text-destaque" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-base sm:text-lg text-tinta">
                <strong>Não mudou.</strong> Mesmo se todos os votos dados depois das 17h fossem de
                Lula, ele ainda ganharia por <strong>{num(prova.vantagemMinima)} votos</strong>.
              </p>
              {!completo && (
                <p className="text-sm text-tinta-2">
                  Ainda faltam conferir: {nomesPendentes.join(', ')}. Nesses lugares, a conta já
                  tira de Lula todos os {num(prova.lulaPendentes)} votos dele, como se fossem depois
                  das 17h.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <Hourglass className="h-7 w-7 shrink-0 text-cat-3" aria-hidden="true" />
            <div className="space-y-1 text-sm text-tinta-2">
              <p className="text-base text-tinta">
                Já conferimos{' '}
                <strong>
                  {resumo.lugares} de {TOTAL_LUGARES}
                </strong>{' '}
                (27 estados e o exterior), {num(resumo.urnas)} urnas.
              </p>
              <p>A resposta para o Brasil inteiro aparece aqui assim que a conta fechar.</p>
              <p>
                Para mudar o resultado, seriam precisos mais de {num(prova.vantagemFinal)} votos
                depois das 17h, todos em Lula.
              </p>
            </div>
          </>
        )}
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-base font-bold text-tinta">Comparando os tamanhos</h3>
          <EscalaProrrogacao vantagem={prova.vantagemFinal} tardios={tardios} />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-tinta">
              {porCidade
                ? `As ${MAIS_CIDADES} cidades com mais votos depois das 17h`
                : 'Votos depois das 17h, em cada estado'}
            </h3>
            <button
              type="button"
              onClick={() => setVerTabela((v) => !v)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-linha px-3 text-xs font-bold text-tinta-2 hover:text-tinta"
            >
              {verTabela ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
              {verTabela ? 'Ver gráfico' : 'Ver como tabela'}
            </button>
          </div>

          <ControleSegmentado
            rotuloGrupo="Ver por estado ou por cidade"
            valor={recorte}
            onChange={setRecorte}
            className="mb-3 w-full"
            opcoes={[
              { valor: 'estados', rotulo: 'Por estado' },
              { valor: 'cidades', rotulo: 'Por cidade' }
            ]}
          />

          {!verTabela ? (
            <ProrrogacaoEstados itens={itens} />
          ) : porCidade ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-linha text-left text-tinta-3">
                    <th className="py-2 pr-2 font-semibold">Cidade</th>
                    <th className="py-2 pr-2 text-right font-semibold">Até 17h</th>
                    <th className="py-2 text-right font-semibold">Depois das 17h</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((c) => (
                    <tr key={c.chave} className="border-b border-linha/60">
                      <td className="py-2 pr-2 font-semibold text-tinta">{c.nome}</td>
                      <td className="py-2 pr-2 text-right text-tinta-2">{num(c.ate17h)}</td>
                      <td className="py-2 text-right font-semibold text-tinta">{num(c.apos17h)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="pb-2 text-left text-xs text-tinta-3">
                  &ldquo;Bate com o TSE&rdquo;: a nossa soma, urna por urna, dá o mesmo número
                  oficial de pessoas que votaram.
                </caption>
                <thead>
                  <tr className="border-b border-linha text-left text-tinta-3">
                    <th className="py-2 pr-2 font-semibold">Lugar</th>
                    <th className="py-2 pr-2 text-right font-semibold">Urnas</th>
                    <th className="py-2 pr-2 text-right font-semibold">Até 17h</th>
                    <th className="py-2 pr-2 text-right font-semibold">Depois das 17h</th>
                    <th className="py-2 text-center font-semibold">Bate com o TSE</th>
                  </tr>
                </thead>
                <tbody>
                  {lugares.map(([uf, l]) => (
                    <tr key={uf} className="border-b border-linha/60">
                      <td className="py-2 pr-2 font-semibold text-tinta">{nomeDoLugar(uf)}</td>
                      <td className="py-2 pr-2 text-right text-tinta-2">{num(l.urnas)}</td>
                      <td className="py-2 pr-2 text-right text-tinta-2">
                        {num(l.comparecimentoOficial - l.votosDepoisDas17h)}
                      </td>
                      <td className="py-2 pr-2 text-right font-semibold text-tinta">
                        {num(l.votosDepoisDas17h)}
                      </td>
                      <td className="py-2 text-center">
                        {!l.confereComTse
                          ? '❌ Não'
                          : l.votosSemHorario > 0
                            ? `✅ Sim (${num(l.votosSemHorario)} sem horário)`
                            : '✅ Sim'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {cidades && <CidadesQuePodiamMudar cidades={cidades} />}

      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-tinta-2">
        <li>
          Quem já estava na fila às 17h também votou depois desse horário, e votaria de qualquer
          jeito. Ou seja: a prorrogação mudou ainda menos do que estes números mostram.
        </li>
        <li>
          Algumas urnas não trazem a hora dos votos (por exemplo, quando a urna foi trocada no dia).
          Por segurança, contamos esses votos como se fossem depois das 17h.
        </li>
        <li className="text-xs text-tinta-3">
          Dados: arquivos de cada urna, no site de resultados do TSE. Atualizado em {ATUALIZADO_EM}.
        </li>
      </ul>
    </Secao>
  )
}
