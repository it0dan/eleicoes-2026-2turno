import { useMemo } from 'react'
import { deCada100, numero, numeroCompacto, proporcao } from '../../lib/formato'
import {
  capitalEInterior,
  confrontoDoGrupo,
  frasePrimeiroUltimo,
  Grupo,
  gruposPorPorte,
  gruposPorQuinto,
  histograma,
  somar
} from '../../services/analises'
import { METRICAS, Metrica, Territorio } from '../../services/metricas'
import { siglaDoLugar } from '../../data/lugares'
import { corDaMargem } from '../mapa/cores'
import { CartaoAnalise } from '../ui/CartaoAnalise'
import { BarrasConfronto } from '../graficos/BarrasConfronto'
import { Dispersao, Ponto } from '../graficos/Dispersao'
import { Histograma } from '../graficos/Histograma'
import { Medidor } from '../graficos/Medidor'
import { Tabela } from '../graficos/Tabela'
import { Lugar } from './contexto'

const NOTA_CAUSA = 'Atenção: duas coisas acontecerem juntas não quer dizer que uma causa a outra.'
const COMO_LER_BARRAS =
  'cada linha é um grupo de cidades. A parte vermelha são os votos de Lula e a azul, os de Flávio. Quem passa do risco do meio teve mais votos no grupo.'
const COMO_LER_BOLINHAS =
  'cada bolinha é uma cidade; bolinha maior = mais eleitores. Quanto mais alta, mais votos Lula teve ali. Acima do risco “metade”, Lula ganhou. Toque numa bolinha para ver a cidade.'

/** Barras Lula × Flávio de cada grupo (votos somados no grupo). */
function BarrasDeGrupos({ grupos }: { grupos: Grupo[] }) {
  return <BarrasConfronto itens={grupos.map((g) => confrontoDoGrupo(g.chave, g.nome, g.lugares))} />
}

function TabelaDeGrupos({ grupos, titulo }: { grupos: Grupo[]; titulo: string }) {
  return (
    <Tabela
      chave={(g) => g.chave}
      linhas={grupos}
      colunas={[
        { titulo, valor: (g) => g.nome },
        { titulo: 'Quais cidades', valor: (g) => g.faixa ?? '' },
        { titulo: 'Cidades', valor: (g) => numero(g.lugares.length), numero: true },
        {
          titulo: 'Eleitores',
          valor: (g) => numero(somar(g.lugares).votos.eleitorado),
          numero: true
        },
        {
          titulo: 'Votos de Lula (de cada 100)',
          valor: (g) => numero(confrontoDoGrupo(g.chave, g.nome, g.lugares).percLula, 1),
          numero: true
        },
        {
          titulo: 'Não foram votar (de cada 100)',
          valor: (g) => {
            const v = somar(g.lugares).votos
            return numero(proporcao(v.abstencao, v.eleitorado), 1)
          },
          numero: true
        }
      ]}
    />
  )
}

/** Cidades como pontos: X = a métrica, Y = % de Lula; tamanho = eleitores; cor = quem ganhou. */
function pontosDe(lista: Territorio[], x: Metrica): Ponto[] {
  return lista.flatMap((t) => {
    const vx = x.ler(t)
    const vy = METRICAS.pctLula.ler(t)
    if (vx === null || vy === null) return []
    return [
      {
        chave: t.chave,
        nome: `${t.nome} (${siglaDoLugar(t.uf)})`,
        x: vx,
        y: vy,
        peso: t.votos.eleitorado,
        cor: corDaMargem(METRICAS.margem.ler(t) ?? 0)
      }
    ]
  })
}

function DispersaoContraLula({ lugar, x, log }: { lugar: Lugar; x: Metrica; log?: boolean }) {
  const pontos = useMemo(() => pontosDe(lugar.cidades, x), [lugar.cidades, x])
  return (
    <>
      <Dispersao
        pontos={pontos}
        x={{
          rotulo: x.rotulo,
          formatar: x.formatar,
          formatarEixo: (n) => (x.id === 'pibPorPessoa' ? 'R$ ' : '') + numeroCompacto(n),
          log
        }}
        y={{
          rotulo: 'Votos em Lula (de cada 100)',
          formatar: (n) => `${numero(n)} de cada 100`,
          formatarEixo: (n) => numero(n),
          dominio: [0, 100]
        }}
        referenciaY={{ valor: 50, texto: 'metade' }}
        destacado={lugar.parteEscolhida}
        onSelecionar={lugar.escolherCidade}
        descricao={`${pontos.length} cidades ${lugar.onde}: ${x.rotulo} contra a porcentagem de votos de Lula.`}
      />
    </>
  )
}

/** Histograma de uma métrica de cidades, com faixas que se ajustam ao maior valor. */
function HistogramaDe({ lugar, metrica }: { lugar: Lugar; metrica: Metrica }) {
  const barras = useMemo(() => {
    const valores = lugar.cidades.map(metrica.ler).filter((v): v is number => v !== null)
    const max = Math.max(5, Math.ceil(Math.max(...valores) / 5) * 5)
    return histograma(lugar.cidades, metrica.ler, { min: 0, max, largura: max / 20 })
  }, [lugar.cidades, metrica])
  return (
    <Histograma
      barras={barras}
      corDe={() => 'rgb(var(--cat-1))'}
      faixa={(b) =>
        `${metrica.rotulo}: de ${numero(b.de, b.de % 1 ? 1 : 0)} a ${numero(b.ate, b.ate % 1 ? 1 : 0)} de cada 100`
      }
      cadaRotulo={4}
      rotuloEixo={(b) => `${numero(b.de, b.de % 1 ? 1 : 0)}%`}
    />
  )
}

/** 5. Cidade grande vota diferente? */
export function CartaoPorte({ lugar, className }: { lugar: Lugar; className?: string }) {
  const porte = useMemo(() => gruposPorPorte(lugar.cidades), [lugar.cidades])
  const capital = useMemo(() => capitalEInterior(lugar.cidades), [lugar.cidades])
  return (
    <CartaoAnalise
      className={className}
      pergunta="Cidade grande vota diferente?"
      resposta={frasePrimeiroUltimo(porte, (g) => `nas cidades com ${g.faixa}`)}
      formas={[
        {
          id: 'porte',
          rotulo: 'Por tamanho',
          comoLer: COMO_LER_BARRAS + ' Os grupos vão da cidade menor para a maior.',
          conteudo: () => <BarrasDeGrupos grupos={porte} />
        },
        ...(capital.length > 1
          ? [
              {
                id: 'capital',
                rotulo: 'Capitais',
                comoLer:
                  'compara os votos nas capitais dos estados com os votos nas outras cidades.',
                conteudo: () => <BarrasDeGrupos grupos={capital} />
              }
            ]
          : []),
        {
          id: 'pontos',
          rotulo: 'Bolinhas',
          comoLer: COMO_LER_BOLINHAS + ' Mais à direita = cidade maior.',
          conteudo: () => <DispersaoContraLula lugar={lugar} x={METRICAS.eleitores} log />
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => <TabelaDeGrupos grupos={[...porte, ...capital]} titulo="Grupo" />
        }
      ]}
      nota={NOTA_CAUSA}
      fonte="TSE"
    />
  )
}

const NOMES_RIQUEZA = ['Mais pobres', 'Pobres', 'No meio', 'Ricas', 'Mais ricas']
const NOMES_AGRO = ['Quase sem agro', 'Pouco agro', 'No meio', 'Muito agro', 'Mais agro']

/** 6. Cidades mais ricas (ou mais agrícolas) votaram diferente? Dados do IBGE. */
export function CartaoRiqueza({
  lugar,
  fonte,
  className
}: {
  lugar: Lugar
  fonte: string
  className?: string
}) {
  const riqueza = useMemo(
    () => gruposPorQuinto(lugar.cidades, METRICAS.pibPorPessoa, NOMES_RIQUEZA),
    [lugar.cidades]
  )
  const agro = useMemo(
    () => gruposPorQuinto(lugar.cidades, METRICAS.agroPct, NOMES_AGRO),
    [lugar.cidades]
  )
  if (riqueza.length < 2) return null
  return (
    <CartaoAnalise
      className={className}
      pergunta="Cidades mais ricas votaram diferente?"
      resposta={frasePrimeiroUltimo(riqueza, (g) => `nas cidades ${g.nome.toLowerCase()}`)}
      formas={[
        {
          id: 'riqueza',
          rotulo: 'Riqueza',
          comoLer:
            'separamos as cidades em 5 grupos do mesmo tamanho, da mais pobre para a mais rica. ' +
            COMO_LER_BARRAS.replace('cada linha é um grupo de cidades. ', ''),
          conteudo: () => <BarrasDeGrupos grupos={riqueza} />
        },
        {
          id: 'agro',
          rotulo: 'Agro',
          comoLer:
            'agro = lavoura e criação de animais. Separamos as cidades em 5 grupos, da que menos depende do agro para a que mais depende. ' +
            COMO_LER_BARRAS.replace('cada linha é um grupo de cidades. ', ''),
          conteudo: () => <BarrasDeGrupos grupos={agro} />
        },
        {
          id: 'pontos',
          rotulo: 'Bolinhas',
          comoLer: COMO_LER_BOLINHAS + ' Mais à direita = cidade mais rica.',
          conteudo: () => <DispersaoContraLula lugar={lugar} x={METRICAS.pibPorPessoa} log />
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => <TabelaDeGrupos grupos={[...riqueza, ...agro]} titulo="Grupo" />
        }
      ]}
      nota={`Riqueza = tudo o que a cidade produz em um ano, dividido pelo número de moradores. ${NOTA_CAUSA}`}
      fonte={fonte}
    />
  )
}

/** 7. Quem deixou de votar? */
export function CartaoAbstencao({
  lugar,
  abstencao,
  abstencaoPercentual,
  className
}: {
  lugar: Lugar
  /** quantas pessoas não foram votar no lugar escolhido */
  abstencao: number
  abstencaoPercentual: number
  className?: string
}) {
  const grupos = useMemo(
    () =>
      gruposPorQuinto(lugar.cidades, METRICAS.abstencao, [
        'Faltou pouca gente',
        'Faltou menos',
        'No meio',
        'Faltou mais',
        'Faltou muita gente'
      ]),
    [lugar.cidades]
  )
  return (
    <CartaoAnalise
      className={className}
      pergunta="Quantos deixaram de votar?"
      resposta={
        <>
          {lugar.ondeExato[0].toUpperCase() + lugar.ondeExato.slice(1)},{' '}
          <strong>{numero(abstencao)} pessoas</strong> não foram votar. É como se{' '}
          {deCada100(abstencaoPercentual)} eleitores tivessem ficado em casa.
        </>
      }
      formas={[
        {
          id: 'medidor',
          rotulo: 'Medidor',
          comoLer:
            'o meio círculo inteiro são todos os eleitores. A parte colorida são os que não foram votar.',
          conteudo: () => (
            <Medidor valor={abstencaoPercentual} cor="rgb(var(--cat-4))" rotulo="Não foram votar" />
          )
        },
        {
          id: 'cidades',
          rotulo: 'Cidades',
          comoLer:
            'cada barra junta as cidades parecidas. Quanto mais alta a barra, mais cidades. Mais à direita = faltou mais gente.',
          conteudo: () => <HistogramaDe lugar={lugar} metrica={METRICAS.abstencao} />
        },
        {
          id: 'voto',
          rotulo: 'E o voto?',
          comoLer:
            'separamos as cidades em 5 grupos do mesmo tamanho, de onde faltou menos gente para onde faltou mais. ' +
            COMO_LER_BARRAS.replace('cada linha é um grupo de cidades. ', ''),
          conteudo: () => <BarrasDeGrupos grupos={grupos} />
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => <TabelaDeGrupos grupos={grupos} titulo="Grupo" />
        }
      ]}
      nota={NOTA_CAUSA}
      fonte="TSE"
    />
  )
}

/** 9. Brancos e nulos. */
export function CartaoBrancosNulos({ lugar, className }: { lugar: Lugar; className?: string }) {
  const soma = somar(lugar.cidades)
  const parte = proporcao(soma.votos.brancos + soma.votos.nulos, soma.comparecimento)
  const ranking = useMemo(
    () =>
      [...lugar.cidades]
        .filter((t) => t.comparecimento >= 1000)
        .sort((a, b) => (METRICAS.brancosNulos.ler(b) ?? 0) - (METRICAS.brancosNulos.ler(a) ?? 0))
        .slice(0, 15),
    [lugar.cidades]
  )
  return (
    <CartaoAnalise
      className={className}
      pergunta="Quantos votaram em branco ou anularam?"
      resposta={
        <>
          {lugar.onde[0].toUpperCase() + lugar.onde.slice(1)},{' '}
          <strong>{numero(soma.votos.brancos + soma.votos.nulos)} pessoas</strong> foram votar mas
          votaram em branco ou anularam o voto. São {deCada100(parte)} pessoas que votaram.
        </>
      }
      formas={[
        {
          id: 'medidor',
          rotulo: 'Medidor',
          comoLer:
            'o meio círculo inteiro são todas as pessoas que foram votar. A parte colorida votou em branco ou anulou.',
          conteudo: () => <Medidor valor={parte} cor="rgb(var(--cat-3))" rotulo="Brancos e nulos" />
        },
        {
          id: 'cidades',
          rotulo: 'Cidades',
          comoLer:
            'cada barra junta as cidades parecidas. Quanto mais alta a barra, mais cidades. Mais à direita = mais brancos e nulos.',
          conteudo: () => <HistogramaDe lugar={lugar} metrica={METRICAS.brancosNulos} />
        },
        {
          id: 'ranking',
          rotulo: 'Ranking',
          comoLer: 'lista das cidades com mais brancos e nulos, da maior para a menor.',
          conteudo: () => (
            <Tabela
              legenda="As 15 cidades com mais votos brancos e nulos (só cidades onde votaram pelo menos mil pessoas)."
              chave={(t) => t.chave}
              linhas={ranking}
              colunas={[
                { titulo: 'Cidade', valor: (t) => `${t.nome} (${siglaDoLugar(t.uf)})` },
                {
                  titulo: 'Brancos e nulos (de cada 100)',
                  valor: (t) => numero(METRICAS.brancosNulos.ler(t) ?? 0, 1),
                  numero: true
                },
                {
                  titulo: 'Pessoas que votaram',
                  valor: (t) => numero(t.comparecimento),
                  numero: true
                }
              ]}
            />
          )
        }
      ]}
      fonte="TSE"
    />
  )
}
