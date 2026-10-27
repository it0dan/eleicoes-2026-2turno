/**
 * Catálogo de métricas: o que dá para medir em cada lugar (estado ou cidade), de onde vem o dado e como mostrar.
 * Usado pelo mapa (modos de cor), pelos cartões de análise e pelo explorador.
 */
import { quantileSorted } from 'd3-array'
import semProrrogacao from '../data/sem_prorrogacao.json'
import tseBrasil from '../data/tse_6258_brasil.json'
import { Cidade } from '../data/cidades'
import { ESTADOS_BRASIL } from '../data/geografia'
import { EXTERIOR } from '../data/lugares'
import { VOTOS_ESTADOS_2T, VotosTerritorio } from '../data/votos'
import { numero, proporcao } from '../lib/formato'

/** Um lugar comparável: estado ou cidade. */
export interface Territorio {
  /** UF (estados) ou código da cidade */
  chave: string
  nome: string
  uf: string
  capital: boolean
  votos: VotosTerritorio
  comparecimento: number
  votosDepoisDas17h: number
  populacao: number | null
  pibMilReais: number | null
  /** só existe por cidade (o IBGE não soma essa parte por estado na mesma base) */
  agroPct: number | null
}

export type Fonte = 'TSE' | 'IBGE' | 'Logs das urnas (TSE)'

export type MetricaId =
  | 'margem'
  | 'pctLula'
  | 'pctFlavio'
  | 'abstencao'
  | 'brancosNulos'
  | 'apos17h'
  | 'eleitores'
  | 'populacao'
  | 'pibPorPessoa'
  | 'agroPct'

export interface Metrica {
  id: MetricaId
  /** nome curto e simples, para botões e eixos */
  rotulo: string
  /** frase explicando o número, para dicas */
  explicacao: string
  fonte: Fonte
  /** divergente: positivo = Lula, negativo = Flávio; sequencial: quanto maior, mais forte */
  escala: 'divergente' | 'sequencial'
  /** valores em % (0–100); os demais são contagens ou reais */
  porcentagem: boolean
  /** vai de poucos a milhões: melhor em escala logarítmica nos gráficos */
  log?: boolean
  ler: (t: Territorio) => number | null
  formatar: (n: number) => string
}

const pct = (n: number) => `${numero(n, 1)}%`
const validos = (t: Territorio) => t.votos.totalValidos

export const METRICAS: Record<MetricaId, Metrica> = {
  margem: {
    id: 'margem',
    porcentagem: false,
    rotulo: 'Quem ganhou',
    explicacao: 'quem teve mais votos ali, e com quanta folga',
    fonte: 'TSE',
    escala: 'divergente',
    ler: (t) =>
      validos(t) > 0
        ? proporcao(t.votos.cand1, validos(t)) - proporcao(t.votos.cand2, validos(t))
        : null,
    formatar: (n) =>
      n === 0
        ? 'empate'
        : `${n > 0 ? 'Lula' : 'Flávio'} ganhou por ${numero(Math.abs(n), 1)} de cada 100 votos`
  },
  pctLula: {
    id: 'pctLula',
    porcentagem: true,
    rotulo: 'Votos em Lula',
    explicacao: 'de cada 100 votos dados a um candidato, quantos foram para Lula',
    fonte: 'TSE',
    escala: 'sequencial',
    ler: (t) => (validos(t) > 0 ? proporcao(t.votos.cand1, validos(t)) : null),
    formatar: pct
  },
  pctFlavio: {
    id: 'pctFlavio',
    porcentagem: true,
    rotulo: 'Votos em Flávio',
    explicacao: 'de cada 100 votos dados a um candidato, quantos foram para Flávio',
    fonte: 'TSE',
    escala: 'sequencial',
    ler: (t) => (validos(t) > 0 ? proporcao(t.votos.cand2, validos(t)) : null),
    formatar: pct
  },
  abstencao: {
    id: 'abstencao',
    porcentagem: true,
    rotulo: 'Não foram votar',
    explicacao: 'de cada 100 eleitores, quantos não foram votar',
    fonte: 'TSE',
    escala: 'sequencial',
    ler: (t) => (t.votos.eleitorado > 0 ? proporcao(t.votos.abstencao, t.votos.eleitorado) : null),
    formatar: pct
  },
  brancosNulos: {
    id: 'brancosNulos',
    porcentagem: true,
    rotulo: 'Brancos e nulos',
    explicacao: 'de cada 100 pessoas que foram votar, quantas votaram em branco ou anularam',
    fonte: 'TSE',
    escala: 'sequencial',
    ler: (t) =>
      t.comparecimento > 0 ? proporcao(t.votos.brancos + t.votos.nulos, t.comparecimento) : null,
    formatar: pct
  },
  apos17h: {
    id: 'apos17h',
    porcentagem: true,
    rotulo: 'Votos após 17h',
    explicacao: 'de cada 100 votos, quantos foram dados depois das 17h',
    fonte: 'Logs das urnas (TSE)',
    escala: 'sequencial',
    ler: (t) => (t.comparecimento > 0 ? proporcao(t.votosDepoisDas17h, t.comparecimento) : null),
    formatar: (n) => `${numero(n, 2)}%`
  },
  eleitores: {
    id: 'eleitores',
    porcentagem: false,
    log: true,
    rotulo: 'Eleitores',
    explicacao: 'quantas pessoas podiam votar ali',
    fonte: 'TSE',
    escala: 'sequencial',
    ler: (t) => t.votos.eleitorado,
    formatar: (n) => numero(n)
  },
  populacao: {
    id: 'populacao',
    porcentagem: false,
    log: true,
    rotulo: 'População',
    explicacao: 'quantas pessoas moram ali (contagem do IBGE em 2022)',
    fonte: 'IBGE',
    escala: 'sequencial',
    ler: (t) => t.populacao,
    formatar: (n) => numero(n)
  },
  pibPorPessoa: {
    id: 'pibPorPessoa',
    porcentagem: false,
    log: true,
    rotulo: 'Riqueza por pessoa',
    explicacao: 'tudo o que a cidade produz em um ano, dividido pelo número de moradores',
    fonte: 'IBGE',
    escala: 'sequencial',
    ler: (t) => (t.pibMilReais && t.populacao ? (t.pibMilReais * 1000) / t.populacao : null),
    formatar: (n) => `R$ ${numero(n)}`
  },
  agroPct: {
    id: 'agroPct',
    porcentagem: true,
    rotulo: 'Peso do agro',
    explicacao:
      'de cada 100 reais que a cidade produz, quantos vêm da lavoura e da criação de animais',
    fonte: 'IBGE',
    escala: 'sequencial',
    ler: (t) => t.agroPct,
    formatar: pct
  }
}

export const LISTA_METRICAS = Object.values(METRICAS)

// ---- Territórios ----------------------------------------------------------------

export const territorioDaCidade = (c: Cidade): Territorio => ({
  chave: c.codigo,
  nome: c.nome,
  uf: c.uf,
  capital: c.capital,
  votos: c.votos,
  comparecimento: c.comparecimento,
  votosDepoisDas17h: c.votosDepoisDas17h,
  populacao: c.populacao,
  pibMilReais: c.pibMilReais,
  agroPct: c.agroPct
})

const TARDIOS_UF = semProrrogacao.estados as Record<string, { votosDepoisDas17h: number }>

/** Os 27 estados; população e PIB vêm da soma das cidades (quando já carregadas). */
export function territoriosEstados(cidades: Cidade[] | null): Territorio[] {
  return Object.entries(VOTOS_ESTADOS_2T).map(([uf, v]) => {
    const doUf = cidades?.filter((c) => c.uf === uf) ?? []
    // Município criado depois do Censo fica sem dado próprio; ele ainda está contado nas cidades de origem.
    const somaDasCidades = (f: (c: Cidade) => number | null) =>
      doUf.length > 0 ? doUf.reduce((n, c) => n + (f(c) ?? 0), 0) : null
    return {
      chave: uf,
      nome: ESTADOS_BRASIL[uf]?.nome ?? uf,
      uf,
      capital: false,
      votos: v,
      comparecimento: v.totalValidos + v.brancos + v.nulos,
      votosDepoisDas17h: TARDIOS_UF[uf]?.votosDepoisDas17h ?? 0,
      populacao: somaDasCidades((c) => c.populacao),
      pibMilReais: somaDasCidades((c) => c.pibMilReais),
      agroPct: null
    }
  })
}

// ---- Faixas para cores ----------------------------------------------------------

/** 4 cortes que dividem os valores em 5 grupos do mesmo tamanho (quintos). */
export function quintos(valores: number[]): number[] {
  const ord = [...valores].sort((a, b) => a - b)
  if (ord.length === 0) return []
  return [0.2, 0.4, 0.6, 0.8].map((q) => quantileSorted(ord, q) ?? 0)
}

/** Em qual dos 5 grupos (0–4) o valor cai. */
export const faixaDe = (valor: number, cortes: number[]) => cortes.filter((c) => valor > c).length

/** Os eleitores no exterior, como um lugar só (para comparar com os estados). */
export function territorioExterior(): Territorio {
  const e = tseBrasil.exterior
  return {
    chave: EXTERIOR,
    nome: 'Exterior',
    uf: EXTERIOR,
    capital: false,
    votos: {
      cand1: e.lula,
      cand2: e.flavio,
      totalValidos: e.votosValidos,
      brancos: e.brancos,
      nulos: e.nulos,
      eleitorado: e.eleitorado,
      totalSecoes: e.totalSecoes,
      abstencao: e.abstencao
    },
    comparecimento: e.comparecimento,
    votosDepoisDas17h: TARDIOS_UF[EXTERIOR]?.votosDepoisDas17h ?? 0,
    populacao: null,
    pibMilReais: null,
    agroPct: null
  }
}
