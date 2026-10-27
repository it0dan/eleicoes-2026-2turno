import { ESTADOS_BRASIL } from './geografia'

/** Código que o TSE usa para os eleitores que votam no exterior. */
export const EXTERIOR = 'ZZ'

/** Os lugares da apuração: as 27 UFs e o exterior. */
export const LUGARES = [...Object.keys(ESTADOS_BRASIL), EXTERIOR]

export const TOTAL_LUGARES = LUGARES.length

/** Nome por extenso ("Minas Gerais", "Exterior"). */
export const nomeDoLugar = (uf: string) =>
  uf === EXTERIOR ? 'Exterior' : (ESTADOS_BRASIL[uf]?.nome ?? uf)

/** Rótulo curto ("MG", "Exterior"). */
export const siglaDoLugar = (uf: string) => (uf === EXTERIOR ? 'Exterior' : uf)

// Preposição de cada estado: "na Bahia", "no Pará", "em Minas Gerais".
const NA = ['BA', 'PB']
const NO = ['AC', 'AP', 'AM', 'CE', 'DF', 'ES', 'MA', 'PA', 'PR', 'PI', 'RJ', 'RN', 'RS', 'TO']

/** "na Bahia", "no Rio de Janeiro", "em São Paulo", "no exterior". */
export function noLugar(uf: string): string {
  if (uf === EXTERIOR) return 'no exterior'
  const prep = NA.includes(uf) ? 'na' : NO.includes(uf) ? 'no' : 'em'
  return `${prep} ${nomeDoLugar(uf)}`
}

/** "em Salvador", "no Rio de Janeiro" (a única capital com artigo). */
export const naCidade = (nome: string) => (nome === 'Rio de Janeiro' ? 'no' : 'em') + ` ${nome}`
