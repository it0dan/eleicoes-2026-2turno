import { useEffect, useState } from 'react'
import { deCada100, numero, numeroCompacto, proporcao } from '../../lib/formato'
import {
  carregarHorasDasCidades,
  INICIO_MIN,
  LINHA_DO_TEMPO,
  serieDoLugar
} from '../../data/linhaDoTempo'
import { acumulado, emPorcentagem, pico, porHora } from '../../services/analises'
import { CartaoAnalise } from '../ui/CartaoAnalise'
import { Secao } from '../ui/Secao'
import { LinhaDoTempo, Serie } from '../graficos/LinhaDoTempo'
import { Tabela } from '../graficos/Tabela'
import { Lugar, PropsAnalise } from './contexto'

const DEZESSETE = 17 * 60
const hora = (min: number) =>
  `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`
const COR_LUGAR = 'rgb(var(--cat-1))'
const COR_COMPARA = 'rgb(var(--cat-2))'

/** 8. Como foi a votação ao longo do dia (logs das urnas, hora de Brasília). */
export function CartaoLinhaDoTempo({
  p,
  lugar,
  className
}: {
  p: PropsAnalise
  lugar: Lugar
  className?: string
}) {
  const [horasCidades, setHorasCidades] = useState<Record<string, number[]> | null>(null)
  useEffect(() => {
    if (p.cidade && !horasCidades) carregarHorasDasCidades().then(setHorasCidades)
  }, [p.cidade, horasCidades])

  // Com cidade escolhida: por hora (comparada ao estado); senão, a cada 10 minutos (comparada ao Brasil).
  const daCidade = p.cidade ? (horasCidades?.[p.cidade.codigo] ?? null) : null
  const doLugar = serieDoLugar(p.filtroUf, p.filtroRegiao)
  const usarCidade = p.cidade !== null && p.cidade.uf !== 'ZZ'
  const passo = usarCidade ? 60 : LINHA_DO_TEMPO.passoMin
  const serie = usarCidade ? daCidade : doLugar
  const referencia = usarCidade
    ? doLugar && porHora(doLugar, LINHA_DO_TEMPO.passoMin)
    : p.filtroUf || p.filtroRegiao
      ? serieDoLugar(null, null)
      : null
  const nomeReferencia = usarCidade ? lugar.onde.replace(/^(em|na|no) /, '') : 'Brasil'

  if (!serie) {
    const carregandoCidade = usarCidade && !horasCidades
    return (
      <Secao titulo="Como foi a votação ao longo do dia?" className={className}>
        <p className="text-sm text-tinta-2">
          {carregandoCidade
            ? 'Carregando os horários da cidade…'
            : p.cidade?.uf === 'ZZ'
              ? 'No exterior, cada país vota no seu horário local; por isso não entra nesta linha do tempo.'
              : `Ainda estamos contando os horários de cada urna: ${LINHA_DO_TEMPO.estadosConferidos} de 27 estados prontos.`}
        </p>
      </Secao>
    )
  }

  const total = serie.reduce((a, b) => a + b, 0)
  const acum = acumulado(serie)
  const kMetade = acum.findIndex((v) => v >= 50)
  const kPico = pico(serie)
  const k17 = (DEZESSETE - INICIO_MIN) / passo
  const apos17 = serie.slice(k17).reduce((a, b) => a + b, 0)
  const inicioDe = (k: number) => INICIO_MIN + k * passo
  const linhas = serie.map((v, k) => ({ k, v, acum: acum[k] }))

  const seriesComparadas: Serie[] = [
    {
      chave: 'lugar',
      nome: `${lugar.ondeExato.replace(/^(em|na|no) /, '')}`,
      valores: emPorcentagem(serie),
      cor: COR_LUGAR
    },
    ...(referencia
      ? [
          {
            chave: 'ref',
            nome: nomeReferencia,
            valores: emPorcentagem(referencia),
            cor: COR_COMPARA
          }
        ]
      : [])
  ]

  return (
    <CartaoAnalise
      className={className}
      pergunta="Como foi a votação ao longo do dia?"
      resposta={
        <>
          {lugar.ondeExato[0].toUpperCase() + lugar.ondeExato.slice(1)}, metade das pessoas já tinha
          votado até as <strong>{hora(inicioDe(kMetade + 1))}</strong>. O horário mais cheio foi das{' '}
          {hora(inicioDe(kPico))} às {hora(inicioDe(kPico + 1))}. Depois das 17h foram só{' '}
          <strong>{numero(apos17)} votos</strong> ({deCada100(proporcao(apos17, total))}).
        </>
      }
      formas={[
        {
          id: 'horario',
          rotulo: 'Por horário',
          comoLer: `quanto mais alta a linha, mais gente votando naquele horário. A faixa laranja é depois das 17h. Passe o dedo ou o mouse para ver cada horário.`,
          conteudo: () => (
            <LinhaDoTempo
              series={[{ chave: 'lugar', nome: 'Votos', valores: serie, cor: COR_LUGAR }]}
              inicio={INICIO_MIN}
              passo={passo}
              formatarY={(n) => `${numero(Math.round(n))} votos`}
              formatarEixo={(n) => numeroCompacto(Math.round(n))}
              area
              inicioProrrogacao={DEZESSETE}
              descricao={`Votos a cada ${passo === 60 ? 'hora' : `${passo} minutos`} ${lugar.ondeExato}, das 8h às 20h.`}
            />
          )
        },
        {
          id: 'acumulado',
          rotulo: 'Somando o dia',
          comoLer:
            'mostra quantas pessoas já tinham votado até cada horário, de 0 a 100 de cada 100. No fim do dia, chega a 100.',
          conteudo: () => (
            <LinhaDoTempo
              series={[{ chave: 'lugar', nome: 'Já votaram', valores: acum, cor: COR_LUGAR }]}
              inicio={INICIO_MIN}
              passo={passo}
              formatarY={(n) => `${numero(n, n < 10 ? 1 : 0)} de cada 100 já tinham votado`}
              formatarEixo={(n) => numero(n)}
              area
              inicioProrrogacao={DEZESSETE}
              descricao={`Parte de quem votou que já tinha votado em cada horário ${lugar.ondeExato}.`}
            />
          )
        },
        ...(referencia
          ? [
              {
                id: 'comparar',
                rotulo: `Comparar`,
                comoLer: `as duas linhas mostram em que horário as pessoas votaram ${lugar.ondeExato} e ${nomeReferencia === 'Brasil' ? 'no Brasil' : `em ${nomeReferencia}`}. Se as linhas andam juntas, o dia foi parecido nos dois lugares.`,
                conteudo: () => (
                  <>
                    <LinhaDoTempo
                      series={seriesComparadas}
                      inicio={INICIO_MIN}
                      passo={passo}
                      formatarY={(n) => `${numero(n, 1)} de cada 100 votos do dia`}
                      formatarEixo={(n) => numero(n, 1)}
                      inicioProrrogacao={DEZESSETE}
                      descricao={`Ritmo da votação ${lugar.ondeExato} comparado com ${nomeReferencia}.`}
                    />
                  </>
                )
              }
            ]
          : []),
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => (
            <Tabela
              chave={(l) => String(l.k)}
              linhas={linhas}
              colunas={[
                {
                  titulo: 'Horário',
                  valor: (l) => `${hora(inicioDe(l.k))} a ${hora(inicioDe(l.k + 1))}`
                },
                { titulo: 'Votos', valor: (l) => numero(l.v), numero: true },
                { titulo: 'Já tinham votado', valor: (l) => `${numero(l.acum, 1)}%`, numero: true }
              ]}
            />
          )
        }
      ]}
      nota="Horário de Brasília. Não inclui quem votou fora do Brasil (lá cada país tem seu horário)."
      fonte="hora de cada voto anotada pelas urnas (TSE)"
    />
  )
}
