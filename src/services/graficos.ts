import { VOTOS_ESTADOS_2T, VOTOS_REGIOES_2T } from '../data/votos'
import { ESTADOS_BRASIL, REGIOES_BRASIL } from '../data/geografia'
import { Cidade } from '../data/cidades'
import { proporcao as pct } from '../lib/formato'
import { ResultadoPainel } from './resultados'

// ---- Composição dos votos ---------------------------------------------------
export interface FatiaComposicao {
  chave: 'lula' | 'flavio' | 'brancos' | 'nulos' | 'abstencao'
  rotulo: string
  valor: number
  percentual: number // do eleitorado
}

/** Votos de cada candidato, brancos, nulos e quem não foi votar, como parte do eleitorado do local. */
export function composicaoVotos(r: ResultadoPainel): FatiaComposicao[] {
  const total = r.votosValidos + r.votosBrancos + r.votosNulos + r.abstencao
  const [lula, flavio] = r.candidatos
  const fatias: Omit<FatiaComposicao, 'percentual'>[] = [
    { chave: 'lula', rotulo: 'Lula', valor: lula.votos },
    { chave: 'flavio', rotulo: 'Flávio', valor: flavio.votos },
    { chave: 'brancos', rotulo: 'Em branco', valor: r.votosBrancos },
    { chave: 'nulos', rotulo: 'Nulos', valor: r.votosNulos },
    { chave: 'abstencao', rotulo: 'Não foram votar', valor: r.abstencao }
  ]
  return fatias.map((f) => ({ ...f, percentual: pct(f.valor, total) }))
}

// ---- Confronto por local (regiões e estados) --------------------------------
export interface Confronto {
  chave: string
  nome: string
  lula: number
  flavio: number
  percLula: number
  percFlavio: number
  /** pontos percentuais: positivo = Lula na frente */
  margem: number
  eleitorado: number
}

const confronto = (
  chave: string,
  nome: string,
  v: { cand1: number; cand2: number; totalValidos: number; eleitorado: number }
): Confronto => {
  const percLula = pct(v.cand1, v.totalValidos)
  const percFlavio = pct(v.cand2, v.totalValidos)
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

export function confrontoRegioes(): Confronto[] {
  return Object.values(REGIOES_BRASIL).map((r) =>
    confronto(r.nome, r.nome, VOTOS_REGIOES_2T[r.nome])
  )
}

export type Ordem = 'vantagem' | 'az' | 'eleitorado'

const COMPARAR: Record<Ordem, (a: Confronto, b: Confronto) => number> = {
  vantagem: (a, b) => b.margem - a.margem,
  az: (a, b) => a.nome.localeCompare(b.nome),
  eleitorado: (a, b) => b.eleitorado - a.eleitorado
}

export function confrontoEstados(ordem: Ordem = 'vantagem'): Confronto[] {
  const lista = Object.entries(VOTOS_ESTADOS_2T).map(([uf, v]) =>
    confronto(uf, ESTADOS_BRASIL[uf]?.nome ?? uf, v)
  )
  return lista.sort(COMPARAR[ordem])
}

/** As 27 capitais (chave = código da cidade). */
export function confrontoCapitais(cidades: Cidade[], ordem: Ordem = 'vantagem'): Confronto[] {
  return cidades
    .filter((c) => c.capital)
    .map((c) => confronto(c.codigo, c.nome, c.votos))
    .sort(COMPARAR[ordem])
}
