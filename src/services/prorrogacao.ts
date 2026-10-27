/**
 * Tudo o que vem da conferência urna a urna (analise/ → src/data/sem_prorrogacao.json):
 * quantos votos foram dados após as 17h em cada lugar e o que isso pode mudar no pior caso para Lula.
 */
import semProrrogacao from '../data/sem_prorrogacao.json'
import tseBrasil from '../data/tse_6258_brasil.json'
import { VOTOS_ESTADOS_2T } from '../data/votos'
import { EXTERIOR, LUGARES, TOTAL_LUGARES, nomeDoLugar, siglaDoLugar } from '../data/lugares'
import { Cidade } from '../data/cidades'
import { proporcao } from '../lib/formato'

/** Um lugar conferido (como exportado por analise/exportar_painel.py). */
export interface LugarConferido {
  urnas: number
  comparecimentoOficial: number
  /** a soma dos votos nos registros das urnas bate com o comparecimento oficial (sobras tratadas no pior caso) */
  confereComTse: boolean
  /** votos do resultado oficial cujo registro não veio no arquivo da urna; contados como após as 17h */
  votosSemHorario: number
  votosDepoisDas17h: number
  /** quanto a vantagem de Lula pode cair sem os votos após as 17h (pior caso, urna a urna) */
  perdaMaxLula: number
}

const LUGARES_EXPORTADOS = semProrrogacao.estados as Record<string, LugarConferido>

/** Data/hora da última exportação da análise. */
export const ATUALIZADO_EM: string = semProrrogacao.geradoEm

/** Lugares exportados, em ordem alfabética do nome. */
export function lugaresExportados(): [string, LugarConferido][] {
  return Object.entries(LUGARES_EXPORTADOS).sort(([a], [b]) =>
    nomeDoLugar(a).localeCompare(nomeDoLugar(b))
  )
}

const conferido = (uf: string) => LUGARES_EXPORTADOS[uf]?.confereComTse === true

/** Votos após as 17h e perda máxima de Lula num conjunto de lugares — só se todos já foram conferidos. */
export function tardiosDe(ufs: string[]): { tardios: number; perda: number } | null {
  if (!ufs.every(conferido)) return null
  return ufs.reduce(
    (acc, uf) => ({
      tardios: acc.tardios + LUGARES_EXPORTADOS[uf].votosDepoisDas17h,
      perda: acc.perda + LUGARES_EXPORTADOS[uf].perdaMaxLula
    }),
    { tardios: 0, perda: 0 }
  )
}

/** Os 28 lugares (27 UFs + exterior) já conferidos? */
export const tardiosDoBrasil = () => tardiosDe(LUGARES)

export const quantosConferidos = () => LUGARES.filter(conferido).length

/** Totais do que já foi conferido, para o bloco da prorrogação. */
export function resumoConferido() {
  const lista = LUGARES.filter(conferido).map((uf) => LUGARES_EXPORTADOS[uf])
  const soma = (k: 'urnas' | 'comparecimentoOficial' | 'votosDepoisDas17h') =>
    lista.reduce((n, l) => n + l[k], 0)
  const tardios = soma('votosDepoisDas17h')
  return {
    lugares: lista.length,
    completo: lista.length === TOTAL_LUGARES,
    urnas: soma('urnas'),
    ate17h: soma('comparecimentoOficial') - tardios,
    tardios
  }
}

export interface ProvaNacional {
  vantagemFinal: number
  /** lugares já conferidos urna a urna e batendo com o TSE */
  conferidos: string[]
  pendentes: string[]
  /** quanto a vantagem de Lula pode cair nos lugares conferidos (votos após as 17h, no pior caso) */
  perdaConferidos: number
  /** pior caso nos pendentes: todos os votos de Lula ali dados após as 17h (total oficial) */
  lulaPendentes: number
  vantagemMinima: number
  provado: boolean
}

const votosLulaEm = (uf: string) =>
  uf === EXTERIOR ? tseBrasil.exterior.lula : VOTOS_ESTADOS_2T[uf].cand1

/**
 * Menor vantagem possível de Lula sem os votos dados após as 17h, só com dados oficiais:
 * nos lugares conferidos, tira os votos após as 17h urna a urna; nos ainda pendentes, tira TODOS os votos
 * de Lula ali. Se ainda assim sobrar vantagem, a prorrogação não decidiu a eleição.
 */
export function provaNacional(): ProvaNacional {
  const conferidos = LUGARES.filter(conferido)
  const pendentes = LUGARES.filter((uf) => !conferido(uf))
  const perdaConferidos = conferidos.reduce((n, uf) => n + LUGARES_EXPORTADOS[uf].perdaMaxLula, 0)
  const lulaPendentes = pendentes.reduce((n, uf) => n + votosLulaEm(uf), 0)
  const vantagemFinal = tseBrasil.brasil.lula - tseBrasil.brasil.flavio
  const vantagemMinima = vantagemFinal - perdaConferidos - lulaPendentes
  return {
    vantagemFinal,
    conferidos,
    pendentes,
    perdaConferidos,
    lulaPendentes,
    vantagemMinima,
    provado: vantagemMinima > 0
  }
}

export interface ProrrogacaoNoLugar {
  /** UF, "ZZ" ou código da cidade */
  chave: string
  nome: string
  apos17h: number
  ate17h: number
  /** % dos votos do lugar que foram dados após as 17h */
  percentualApos: number
}

/** Lugares conferidos, do que mais teve votos após as 17h para o que menos teve. */
export function prorrogacaoPorLugar(): ProrrogacaoNoLugar[] {
  return LUGARES.filter(conferido)
    .map((uf) => {
      const l = LUGARES_EXPORTADOS[uf]
      return {
        chave: uf,
        nome: nomeDoLugar(uf),
        apos17h: l.votosDepoisDas17h,
        ate17h: l.comparecimentoOficial - l.votosDepoisDas17h,
        percentualApos: proporcao(l.votosDepoisDas17h, l.comparecimentoOficial)
      }
    })
    .sort((a, b) => b.apos17h - a.apos17h)
}

/** As `limite` cidades com mais votos após as 17h. */
export function prorrogacaoNasCidades(cidades: Cidade[], limite = 15): ProrrogacaoNoLugar[] {
  return [...cidades]
    .sort((a, b) => b.votosDepoisDas17h - a.votosDepoisDas17h)
    .slice(0, limite)
    .map((c) => ({
      chave: c.codigo,
      nome: `${c.nome} (${siglaDoLugar(c.uf)})`,
      apos17h: c.votosDepoisDas17h,
      ate17h: c.comparecimento - c.votosDepoisDas17h,
      percentualApos: proporcao(c.votosDepoisDas17h, c.comparecimento)
    }))
}

/**
 * Cidades onde os votos após as 17h (incluindo os sem horário, que contamos como após 17h) somam pelo menos a
 * diferença entre os dois candidatos ali: sem eles, o resultado da cidade poderia empatar ou virar.
 */
export function cidadesQuePodiamMudar(cidades: Cidade[]): Cidade[] {
  return (
    cidades
      .filter(
        (c) =>
          c.votosDepoisDas17h > 0 && c.votosDepoisDas17h >= Math.abs(c.votos.cand1 - c.votos.cand2)
      )
      // Brasil primeiro, depois o exterior; dentro de cada um, por nome
      .sort(
        (a, b) =>
          Number(a.uf === EXTERIOR) - Number(b.uf === EXTERIOR) || a.nome.localeCompare(b.nome)
      )
  )
}
