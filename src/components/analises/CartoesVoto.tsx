import { useMemo } from 'react'
import { deCada100, numero, proporcao } from '../../lib/formato'
import {
  cascata,
  histograma,
  placarDeCidades,
  somar,
  votosEmPalavras,
  votosPorExtenso
} from '../../services/analises'
import { composicaoVotos, FatiaComposicao } from '../../services/graficos'
import { METRICAS } from '../../services/metricas'
import { corDaMargem } from '../mapa/cores'
import { CartaoAnalise } from '../ui/CartaoAnalise'
import { Medidor } from '../graficos/Medidor'
import { Pizza } from '../graficos/Pizza'
import { Cascata } from '../graficos/Cascata'
import { Treemap } from '../graficos/Treemap'
import { Histograma } from '../graficos/Histograma'
import { Tabela } from '../graficos/Tabela'
import { Lugar, PropsAnalise } from './contexto'

const LULA = 'rgb(var(--lula))'
const FLAVIO = 'rgb(var(--flavio))'
const COR_FATIA: Record<FatiaComposicao['chave'], string> = {
  lula: LULA,
  flavio: FLAVIO,
  brancos: 'rgb(var(--cat-2))',
  nulos: 'rgb(var(--cat-3))',
  abstencao: 'rgb(var(--cat-4))'
}
const MAX_BLOCOS = 60
const pct = (n: number, casas = 1) => `${numero(n, casas)}%`
const margemDe = (lula: number, flavio: number) =>
  proporcao(lula, lula + flavio) - proporcao(flavio, lula + flavio)

/** 1. Quem ganhou e por quanto (segue o cenário com/sem prorrogação). */
export function CartaoQuemGanhou({
  p,
  lugar,
  className
}: {
  p: PropsAnalise
  lugar: Lugar
  className?: string
}) {
  const r = p.resultado
  const [lula, flavio] = r.candidatos
  const liderLula = lula.votos >= flavio.votos
  const lider = liderLula ? 'Lula' : 'Flávio'
  const fatias = composicaoVotos(r).map((f) => ({ ...f, cor: COR_FATIA[f.chave] }))

  return (
    <CartaoAnalise
      className={className}
      pergunta="Quem ganhou e por quanto?"
      resposta={
        <>
          <strong>{lider}</strong> ganhou {lugar.ondeExato}, com{' '}
          <strong>{numero(Math.abs(lula.votos - flavio.votos))} votos a mais</strong>. De cada 100
          votos dados a um candidato, {Math.round(Math.max(lula.percentual, flavio.percentual))}{' '}
          foram para {lider}.
        </>
      }
      formas={[
        {
          id: 'medidor',
          rotulo: 'Medidor',
          comoLer:
            'a parte vermelha é de Lula e a azul, de Flávio. Quem passa do risco do meio tem mais da metade dos votos e ganha.',
          conteudo: () => (
            <Medidor
              valor={lula.percentual}
              cor={LULA}
              corResto={FLAVIO}
              centro={pct(liderLula ? lula.percentual : flavio.percentual)}
              corCentro={liderLula ? LULA : FLAVIO}
              nomeCentro={lider}
              rotulo="Votos de cada um (sem contar branco e nulo)"
              metade
              partes={['Lula', 'Flávio']}
            />
          )
        },
        {
          id: 'pizza',
          rotulo: 'Pizza',
          comoLer:
            'a pizza inteira são todas as pessoas que podiam votar. Cada fatia mostra uma parte delas. Toque numa fatia para ver o número.',
          conteudo: () => <Pizza fatias={fatias} unidade={['eleitor', 'eleitores']} />
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => (
            <Tabela
              chave={(f) => f.chave}
              linhas={fatias}
              colunas={[
                { titulo: 'Eleitores', valor: (f) => f.rotulo },
                { titulo: 'Quantas pessoas', valor: (f) => numero(f.valor), numero: true },
                { titulo: 'De cada 100', valor: (f) => numero(f.percentual, 1), numero: true }
              ]}
            />
          )
        }
      ]}
      fonte="TSE"
    />
  )
}

/** 2. De onde veio a vantagem: soma lugar a lugar (estados no Brasil/região, cidades no estado). */
export function CartaoVantagem({ lugar, className }: { lugar: Lugar; className?: string }) {
  const degraus = useMemo(
    () => cascata(lugar.partes, lugar.tipoPartes === 'cidades' ? 10 : 14),
    [lugar.partes, lugar.tipoPartes]
  )
  const pos = [...lugar.partes].sort(
    (a, b) => b.votos.cand1 - b.votos.cand2 - (a.votos.cand1 - a.votos.cand2)
  )
  const maiorLula = pos[0]
  const maiorFlavio = pos[pos.length - 1]
  const total = degraus[degraus.length - 1]?.fim ?? 0
  // Muitas cidades viram blocos minúsculos: mostra as maiores e junta o resto num bloco só.
  const maiores = [...lugar.partes].sort((a, b) => b.votos.eleitorado - a.votos.eleitorado)
  const resto = maiores.slice(MAX_BLOCOS - 1)
  const visiveis =
    resto.length > 1
      ? [
          ...maiores.slice(0, MAX_BLOCOS - 1),
          {
            ...somar(resto),
            chave: '_demais',
            nome: `Demais ${resto.length} ${lugar.tipoPartes}`,
            uf: '',
            capital: false,
            populacao: null,
            pibMilReais: null,
            agroPct: null
          }
        ]
      : maiores
  const blocos = visiveis.map((t) => {
    const m = margemDe(t.votos.cand1, t.votos.cand2)
    return {
      chave: t.chave,
      nome: t.nome,
      curto: lugar.tipoPartes === 'estados' ? t.uf : undefined,
      valor: t.votos.eleitorado,
      cor: corDaMargem(m),
      detalhes: [
        `${m >= 0 ? 'Lula' : 'Flávio'} teve ${votosEmPalavras(t.votos.cand1 - t.votos.cand2)} a mais`,
        `Lula ${pct(proporcao(t.votos.cand1, t.votos.totalValidos))} · Flávio ${pct(proporcao(t.votos.cand2, t.votos.totalValidos))} dos votos`
      ]
    }
  })
  const saldo = (t: (typeof lugar.partes)[number]) => t.votos.cand1 - t.votos.cand2

  return (
    <CartaoAnalise
      className={className}
      pergunta="De onde veio a vantagem?"
      resposta={
        maiorLula && maiorFlavio ? (
          <>
            Somando {lugar.tipoPartes === 'estados' ? 'todos os estados' : 'todas as cidades'},{' '}
            <strong>
              {total >= 0 ? 'Lula' : 'Flávio'} ficou {votosEmPalavras(total)} à frente
            </strong>{' '}
            {lugar.onde}. Quem mais ajudou Lula: {maiorLula.nome} (+
            {votosPorExtenso(saldo(maiorLula))}). Quem mais ajudou Flávio: {maiorFlavio.nome} (+
            {votosPorExtenso(saldo(maiorFlavio))}).
          </>
        ) : undefined
      }
      formas={[
        {
          id: 'cascata',
          rotulo: 'Passo a passo',
          comoLer: `cada linha é ${lugar.tipoPartes === 'estados' ? 'um estado' : 'uma cidade'}. Barra vermelha: ali Lula teve mais votos e a vantagem dele cresceu. Barra azul: ali Flávio teve mais votos e a vantagem de Lula diminuiu. A barra preta no fim é o resultado.`,
          conteudo: () => <Cascata degraus={degraus} rotuloTotal={`Total ${lugar.onde}`} />
        },
        {
          id: 'blocos',
          rotulo: 'Blocos',
          comoLer: `cada bloco é ${lugar.tipoPartes === 'estados' ? 'um estado' : 'uma cidade'}. Bloco maior = mais eleitores. Vermelho: Lula ganhou ali. Azul: Flávio ganhou. Cor mais forte = ganhou com mais folga.`,
          conteudo: () => (
            <Treemap
              blocos={blocos}
              unidade="eleitores"
              onSelecionar={(chave) => chave !== '_demais' && lugar.escolherParte(chave)}
            />
          )
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => (
            <Tabela
              chave={(t) => t.chave}
              linhas={pos}
              colunas={[
                {
                  titulo: lugar.tipoPartes === 'estados' ? 'Estado' : 'Cidade',
                  valor: (t) => t.nome
                },
                { titulo: 'Lula', valor: (t) => numero(t.votos.cand1), numero: true },
                { titulo: 'Flávio', valor: (t) => numero(t.votos.cand2), numero: true },
                {
                  titulo: 'Quem teve mais votos',
                  valor: (t) =>
                    `${saldo(t) >= 0 ? 'Lula' : 'Flávio'} +${numero(Math.abs(saldo(t)))}`,
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

/** 3. Quantas cidades cada um ganhou (e quantos eleitores moram nelas). */
export function CartaoCidadesGanhas({ lugar, className }: { lugar: Lugar; className?: string }) {
  const placar = placarDeCidades(lugar.cidades)
  const n = lugar.cidades.length
  const eleitores = placar.lula.eleitores + placar.flavio.eleitores + placar.empate.eleitores
  const linhas = [
    { chave: 'lula', rotulo: 'Lula ganhou', ...placar.lula, cor: LULA },
    { chave: 'flavio', rotulo: 'Flávio ganhou', ...placar.flavio, cor: FLAVIO },
    ...(placar.empate.cidades > 0
      ? [{ chave: 'empate', rotulo: 'Empate', ...placar.empate, cor: 'rgb(var(--tinta-3))' }]
      : [])
  ]
  const fatiasPor = (k: 'cidades' | 'eleitores', total: number) =>
    linhas.map((l) => ({
      chave: l.chave,
      rotulo: l.rotulo,
      valor: l[k],
      percentual: proporcao(l[k], total),
      cor: l.cor
    }))

  return (
    <CartaoAnalise
      className={className}
      pergunta="Em quantas cidades cada um ganhou?"
      resposta={
        <>
          {lugar.onde[0].toUpperCase() + lugar.onde.slice(1)}, Lula ganhou em{' '}
          <strong>{numero(placar.lula.cidades)} cidades</strong> e Flávio em{' '}
          <strong>{numero(placar.flavio.cidades)}</strong>.{' '}
          {deCada100(proporcao(placar.lula.eleitores, eleitores))[0].toUpperCase() +
            deCada100(proporcao(placar.lula.eleitores, eleitores)).slice(1)}{' '}
          eleitores moram em cidades onde Lula ganhou.
        </>
      }
      formas={[
        {
          id: 'cidades',
          rotulo: 'Cidades',
          comoLer: 'cada fatia mostra quantas cidades cada candidato ganhou.',
          conteudo: () => <Pizza fatias={fatiasPor('cidades', n)} unidade={['cidade', 'cidades']} />
        },
        {
          id: 'eleitores',
          rotulo: 'Eleitores',
          comoLer: 'aqui cada fatia mostra quantos eleitores moram nas cidades que cada um ganhou.',
          conteudo: () => (
            <Pizza fatias={fatiasPor('eleitores', eleitores)} unidade={['eleitor', 'eleitores']} />
          )
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => (
            <Tabela
              chave={(l) => l.chave}
              linhas={linhas}
              colunas={[
                { titulo: 'Quem ganhou', valor: (l) => l.rotulo },
                { titulo: 'Cidades', valor: (l) => numero(l.cidades), numero: true },
                { titulo: 'Eleitores nelas', valor: (l) => numero(l.eleitores), numero: true }
              ]}
            />
          )
        }
      ]}
      nota="Atenção: aqui uma cidade pequena conta igual a uma cidade grande. Por isso vale ver também quantos eleitores moram nelas (botão Eleitores). Não inclui quem vota fora do Brasil."
      fonte="TSE"
    />
  )
}

/** 4. Como as cidades se dividiram: quantas cidades em cada faixa de % de Lula. */
export function CartaoDivisaoCidades({ lugar, className }: { lugar: Lugar; className?: string }) {
  const barras = useMemo(
    () => histograma(lugar.cidades, METRICAS.pctLula.ler, { min: 0, max: 100, largura: 5 }),
    [lugar.cidades]
  )
  const acimaDeMetade = lugar.cidades.filter((t) => t.votos.cand1 > t.votos.cand2).length
  const faixa = (b: { de: number; ate: number }) =>
    `Lula teve de ${b.de} a ${b.ate} de cada 100 votos`

  return (
    <CartaoAnalise
      className={className}
      pergunta="Como as cidades se dividiram?"
      resposta={
        <>
          Lula teve mais da metade dos votos em <strong>{numero(acimaDeMetade)}</strong> das{' '}
          {numero(lugar.cidades.length)} cidades {lugar.onde}.
        </>
      }
      formas={[
        {
          id: 'histograma',
          rotulo: 'Barras',
          comoLer:
            'cada barra junta as cidades em que Lula teve uma quantidade parecida de votos. Quanto mais alta a barra, mais cidades. À direita do risco “metade”, Lula ganhou; à esquerda, Flávio ganhou.',
          conteudo: () => (
            <Histograma
              barras={barras}
              corDe={(b) => corDaMargem(b.de + b.ate - 100)}
              faixa={faixa}
              rotuloEixo={(b) => `${b.de}%`}
              referencia={{ valor: 50, texto: 'metade' }}
            />
          )
        },
        {
          id: 'tabela',
          rotulo: 'Tabela',
          conteudo: () => (
            <Tabela
              chave={(b) => String(b.de)}
              linhas={barras.filter((b) => b.quantos > 0)}
              colunas={[
                {
                  titulo: 'Votos de Lula na cidade (de cada 100)',
                  valor: (b) => `${b.de} a ${b.ate}`
                },
                { titulo: 'Cidades', valor: (b) => numero(b.quantos), numero: true },
                { titulo: 'Eleitores', valor: (b) => numero(b.eleitores), numero: true }
              ]}
            />
          )
        }
      ]}
      fonte="TSE"
    />
  )
}
