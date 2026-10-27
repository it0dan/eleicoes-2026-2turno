/**
 * Cruzamentos para os cartões de análise e o explorador. Funções puras sobre Territorio (estado ou cidade);
 * nada é estimado: só somas, contagens e divisões dos números oficiais.
 */
import { REGIOES_BRASIL } from '../data/geografia'
import { EXTERIOR } from '../data/lugares'
import { VotosTerritorio } from '../data/votos'
import { deCada100, numero, proporcao } from '../lib/formato'
import { Confronto } from './graficos'
import { Metrica, quintos, Territorio } from './metricas'

// ---- Somas -------------------------------------------------------------------------

export interface Soma {
  votos: VotosTerritorio
  comparecimento: number
  votosDepoisDas17h: number
  lugares: number
}

const ZERO: VotosTerritorio = {
  cand1: 0,
  cand2: 0,
  totalValidos: 0,
  brancos: 0,
  nulos: 0,
  eleitorado: 0,
  totalSecoes: 0,
  abstencao: 0
}

export function somar(lista: Territorio[]): Soma {
  return lista.reduce<Soma>(
    (s, t) => ({
      votos: {
        cand1: s.votos.cand1 + t.votos.cand1,
        cand2: s.votos.cand2 + t.votos.cand2,
        totalValidos: s.votos.totalValidos + t.votos.totalValidos,
        brancos: s.votos.brancos + t.votos.brancos,
        nulos: s.votos.nulos + t.votos.nulos,
        eleitorado: s.votos.eleitorado + t.votos.eleitorado,
        totalSecoes: s.votos.totalSecoes + t.votos.totalSecoes,
        abstencao: s.votos.abstencao + t.votos.abstencao
      },
      comparecimento: s.comparecimento + t.comparecimento,
      votosDepoisDas17h: s.votosDepoisDas17h + t.votosDepoisDas17h,
      lugares: s.lugares + 1
    }),
    { votos: ZERO, comparecimento: 0, votosDepoisDas17h: 0, lugares: 0 }
  )
}

/** Um grupo de lugares como linha Lula × Flávio (para BarrasConfronto). */
export function confrontoDoGrupo(chave: string, nome: string, lista: Territorio[]): Confronto {
  const { votos: v } = somar(lista)
  const percLula = proporcao(v.cand1, v.totalValidos)
  const percFlavio = proporcao(v.cand2, v.totalValidos)
  return {
    chave,
    nome,
    lula: v.cand1,
    flavio: v.cand2,
    percLula,
    percFlavio,
    margem: percLula - percFlavio,
    eleitorado: v.eleitorado
  }
}

// ---- Onde olhar ------------------------------------------------------------------

/** Cidades do lugar escolhido no painel (estado, região ou Brasil). O exterior entra só no Brasil todo. */
export function cidadesDoLugar<T extends { uf: string }>(
  cidades: T[],
  filtroUf: string | null,
  filtroRegiao: string | null
): T[] {
  if (filtroUf) return cidades.filter((c) => c.uf === filtroUf)
  if (filtroRegiao) {
    const ufs = REGIOES_BRASIL[filtroRegiao]?.estados ?? []
    return cidades.filter((c) => ufs.includes(c.uf))
  }
  return cidades
}

export const semExterior = <T extends { uf: string }>(lista: T[]) =>
  lista.filter((t) => t.uf !== EXTERIOR)

// ---- Quem ganhou onde -------------------------------------------------------------

export interface PlacarCidades {
  lula: { cidades: number; eleitores: number }
  flavio: { cidades: number; eleitores: number }
  empate: { cidades: number; eleitores: number }
}

export function placarDeCidades(lista: Territorio[]): PlacarCidades {
  const p: PlacarCidades = {
    lula: { cidades: 0, eleitores: 0 },
    flavio: { cidades: 0, eleitores: 0 },
    empate: { cidades: 0, eleitores: 0 }
  }
  for (const t of lista) {
    const lado =
      t.votos.cand1 > t.votos.cand2 ? p.lula : t.votos.cand1 < t.votos.cand2 ? p.flavio : p.empate
    lado.cidades += 1
    lado.eleitores += t.votos.eleitorado
  }
  return p
}

// ---- De onde veio a vantagem (cascata) ----------------------------------------------

export interface DegrauCascata {
  chave: string
  nome: string
  /** votos de Lula − votos de Flávio no lugar (ou no grupo "demais") */
  saldo: number
  inicio: number
  fim: number
}

/**
 * Soma, lugar a lugar, a diferença Lula − Flávio: primeiro os que deram vantagem a Lula (do maior para o menor),
 * depois os que deram vantagem a Flávio. Além de `limite` lugares, o resto vira "Demais" de cada lado.
 * O último `fim` é sempre a vantagem total do conjunto.
 */
export function cascata(lista: Territorio[], limite = 12): DegrauCascata[] {
  const saldos = lista
    .map((t) => ({ chave: t.chave, nome: t.nome, saldo: t.votos.cand1 - t.votos.cand2 }))
    .filter((s) => s.saldo !== 0)
  const pos = saldos.filter((s) => s.saldo > 0).sort((a, b) => b.saldo - a.saldo)
  const neg = saldos.filter((s) => s.saldo < 0).sort((a, b) => a.saldo - b.saldo)
  const metade = Math.max(1, Math.floor(limite / 2))
  const agrupar = (lado: typeof pos, n: number, nome: string, chave: string) => {
    if (lado.length <= n + 1) return lado
    const resto = lado.slice(n)
    return [
      ...lado.slice(0, n),
      { chave, nome: `${nome} (${resto.length})`, saldo: resto.reduce((s, x) => s + x.saldo, 0) }
    ]
  }
  const passos = [
    ...agrupar(pos, metade, 'Demais onde Lula ganhou', '_demais_lula'),
    ...agrupar(neg, metade, 'Demais onde Flávio ganhou', '_demais_flavio')
  ]
  let acumulado = 0
  return passos.map((p) => {
    const inicio = acumulado
    acumulado += p.saldo
    return { ...p, inicio, fim: acumulado }
  })
}

// ---- Distribuições -----------------------------------------------------------------

export interface Barra {
  de: number
  ate: number
  /** quantos lugares caem na faixa */
  quantos: number
  /** eleitores somados dos lugares da faixa */
  eleitores: number
}

/** Histograma com faixas de largura fixa entre `min` e `max` (o último inclui o `max`). */
export function histograma(
  lista: Territorio[],
  ler: (t: Territorio) => number | null,
  { min, max, largura }: { min: number; max: number; largura: number }
): Barra[] {
  const n = Math.ceil((max - min) / largura)
  const barras: Barra[] = Array.from({ length: n }, (_, i) => ({
    de: min + i * largura,
    ate: min + (i + 1) * largura,
    quantos: 0,
    eleitores: 0
  }))
  for (const t of lista) {
    const v = ler(t)
    if (v === null) continue
    const i = Math.min(n - 1, Math.max(0, Math.floor((v - min) / largura)))
    barras[i].quantos += 1
    barras[i].eleitores += t.votos.eleitorado
  }
  return barras
}

// ---- Grupos (porte, riqueza, agro, abstenção) --------------------------------------

export interface Grupo {
  chave: string
  nome: string
  /** de onde até onde vai o grupo (ex.: "R$ 16.986 a R$ 21.675") */
  faixa?: string
  lugares: Territorio[]
}

/** Porte da cidade pelo número de eleitores. */
export const FAIXAS_PORTE = [
  { chave: 'p1', nome: 'Até 10 mil', faixa: 'até 10 mil eleitores', ate: 10_000 },
  { chave: 'p2', nome: '10 a 50 mil', faixa: '10 mil a 50 mil eleitores', ate: 50_000 },
  { chave: 'p3', nome: '50 a 200 mil', faixa: '50 mil a 200 mil eleitores', ate: 200_000 },
  {
    chave: 'p4',
    nome: '200 mil a 1 milhão',
    faixa: '200 mil a 1 milhão de eleitores',
    ate: 1_000_000
  },
  { chave: 'p5', nome: 'Mais de 1 milhão', faixa: 'mais de 1 milhão de eleitores', ate: Infinity }
]

export function gruposPorPorte(lista: Territorio[]): Grupo[] {
  return FAIXAS_PORTE.map((f, i) => ({
    chave: f.chave,
    nome: f.nome,
    faixa: f.faixa,
    lugares: lista.filter(
      (t) =>
        t.votos.eleitorado <= f.ate && (i === 0 || t.votos.eleitorado > FAIXAS_PORTE[i - 1].ate)
    )
  })).filter((g) => g.lugares.length > 0)
}

export function capitalEInterior(lista: Territorio[]): Grupo[] {
  return [
    { chave: 'capitais', nome: 'Capitais', lugares: lista.filter((t) => t.capital) },
    { chave: 'interior', nome: 'Demais cidades', lugares: lista.filter((t) => !t.capital) }
  ].filter((g) => g.lugares.length > 0)
}

/** 5 grupos com o mesmo número de lugares, do menor para o maior valor da métrica (quintos). */
export function gruposPorQuinto(lista: Territorio[], metrica: Metrica, nomes: string[]): Grupo[] {
  const comValor = lista.filter((t) => metrica.ler(t) !== null)
  const cortes = quintos(comValor.map((t) => metrica.ler(t)!))
  if (cortes.length === 0) return []
  return nomes
    .map((nome, i) => {
      const de = i === 0 ? -Infinity : cortes[i - 1]
      const ate = i === 4 ? Infinity : cortes[i]
      const lugares = comValor.filter((t) => {
        const v = metrica.ler(t)!
        return v > de && v <= ate
      })
      const faixa =
        i === 0
          ? `até ${metrica.formatar(ate)}`
          : i === 4
            ? `mais de ${metrica.formatar(de)}`
            : `${metrica.formatar(de)} a ${metrica.formatar(ate)}`
      return { chave: `q${i + 1}`, nome, faixa, lugares }
    })
    .filter((g) => g.lugares.length > 0)
}

// ---- Frases-resumo ----------------------------------------------------------------

/** "Lula teve 58 de cada 100 votos nas cidades com até 10 mil eleitores, e 47 de cada 100 nas …" */
export function frasePrimeiroUltimo(grupos: Grupo[], como: (g: Grupo) => string): string {
  if (grupos.length < 2) return ''
  const [a, b] = [grupos[0], grupos[grupos.length - 1]]
  const pa = confrontoDoGrupo(a.chave, a.nome, a.lugares).percLula
  const pb = confrontoDoGrupo(b.chave, b.nome, b.lugares).percLula
  return `Lula teve ${deCada100(pa)} votos ${como(a)}, e ${deCada100(pb)} ${como(b)}.`
}

/** Mil, milhão: "3,9 milhões", "820 mil", "950". */
export function votosPorExtenso(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${numero(a / 1_000_000, 1)} ${a >= 2_000_000 ? 'milhões' : 'milhão'}`
  if (a >= 10_000) return `${numero(Math.round(a / 1000))} mil`
  return numero(a)
}

/** "4,4 milhões de votos", "109 mil votos", "1 voto". */
export function votosEmPalavras(n: number): string {
  const texto = votosPorExtenso(n)
  if (/milh/.test(texto)) return `${texto} de votos`
  return `${texto} ${Math.abs(n) === 1 ? 'voto' : 'votos'}`
}

// ---- Linha do tempo ------------------------------------------------------------------

/** Junta faixas de `passo` minutos em faixas de 1 hora. */
export function porHora(valores: number[], passo: number): number[] {
  const k = 60 / passo
  return Array.from({ length: Math.ceil(valores.length / k) }, (_, h) =>
    valores.slice(h * k, (h + 1) * k).reduce((a, b) => a + b, 0)
  )
}

/** Cada faixa como % do total do dia (para comparar lugares de tamanhos diferentes). */
export const emPorcentagem = (valores: number[]) => {
  const total = valores.reduce((a, b) => a + b, 0)
  return valores.map((v) => proporcao(v, total))
}

/** % acumulado do total até o fim de cada faixa. */
export function acumulado(valores: number[]): number[] {
  const total = valores.reduce((a, b) => a + b, 0)
  let soma = 0
  return valores.map((v) => proporcao((soma += v), total))
}

/** Índice da faixa com mais votos. */
export const pico = (valores: number[]) => valores.indexOf(Math.max(...valores))
