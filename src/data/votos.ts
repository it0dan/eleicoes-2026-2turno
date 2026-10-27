import tseEstadosReal from './tse_6258_real_states.json'
import { REGIOES_BRASIL } from './geografia'

// Votação oficial por UF e por região (Eleição TSE 6258).
// Fonte única: tse_6258_real_states.json (API do TSE). Nada aqui é digitado à mão;
// as regiões são a soma das UFs conforme REGIOES_BRASIL.
export interface VotosTerritorio {
  cand1: number
  cand2: number
  totalValidos: number
  brancos: number
  nulos: number
  eleitorado: number
  totalSecoes: number
  abstencao: number
}

interface TseEstadoReal {
  totalSecoes: number
  eleitorado: number
  comparecimento: number
  abstencao: number
  votosValidos: number
  brancos: number
  nulos: number
  cand1_lula: number
  cand2_flavio: number
}

const TSE_ESTADOS = tseEstadosReal as Record<string, TseEstadoReal>

export const VOTOS_ESTADOS_2T: Record<string, VotosTerritorio> = Object.fromEntries(
  Object.entries(TSE_ESTADOS).map(([uf, e]) => [
    uf,
    {
      cand1: e.cand1_lula,
      cand2: e.cand2_flavio,
      totalValidos: e.votosValidos,
      brancos: e.brancos,
      nulos: e.nulos,
      eleitorado: e.eleitorado,
      totalSecoes: e.totalSecoes,
      abstencao: e.abstencao
    }
  ])
)

export const VOTOS_REGIOES_2T: Record<string, VotosTerritorio> = Object.fromEntries(
  Object.values(REGIOES_BRASIL).map((regiao) => {
    const soma = regiao.estados.reduce<VotosTerritorio>(
      (acc, uf) => {
        const v = VOTOS_ESTADOS_2T[uf]
        return {
          cand1: acc.cand1 + v.cand1,
          cand2: acc.cand2 + v.cand2,
          totalValidos: acc.totalValidos + v.totalValidos,
          brancos: acc.brancos + v.brancos,
          nulos: acc.nulos + v.nulos,
          eleitorado: acc.eleitorado + v.eleitorado,
          totalSecoes: acc.totalSecoes + v.totalSecoes,
          abstencao: acc.abstencao + v.abstencao
        }
      },
      {
        cand1: 0,
        cand2: 0,
        totalValidos: 0,
        brancos: 0,
        nulos: 0,
        eleitorado: 0,
        totalSecoes: 0,
        abstencao: 0
      }
    )
    return [regiao.nome, soma]
  })
)
