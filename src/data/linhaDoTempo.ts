import dados from './linha_do_tempo.json'
import { REGIOES_BRASIL } from './geografia'

/**
 * Votos ao longo do dia, em hora de Brasília (analise/exportar_linha_do_tempo.py, a partir dos logs das urnas).
 * Brasil e estados a cada 10 minutos; cidades por hora, em arquivo à parte.
 */
export const LINHA_DO_TEMPO = dados as {
  inicio: string
  passoMin: number
  completo: boolean
  estadosConferidos: number
  foraDoHorario: number
  brasil: number[]
  estados: Record<string, number[]>
}

/** Minuto do dia da primeira faixa (8h = 480). */
export const INICIO_MIN =
  Number(LINHA_DO_TEMPO.inicio.slice(0, 2)) * 60 + Number(LINHA_DO_TEMPO.inicio.slice(3, 5))

const somarSeries = (lista: number[][]) =>
  lista[0].map((_, i) => lista.reduce((n, s) => n + s[i], 0))

/** Série do lugar (estado, região ou Brasil); null se algum estado ainda não foi conferido. */
export function serieDoLugar(
  filtroUf: string | null,
  filtroRegiao: string | null
): number[] | null {
  const est = LINHA_DO_TEMPO.estados
  if (filtroUf) return est[filtroUf] ?? null
  if (filtroRegiao) {
    const ufs = REGIOES_BRASIL[filtroRegiao]?.estados ?? []
    return ufs.every((uf) => est[uf]) ? somarSeries(ufs.map((uf) => est[uf])) : null
  }
  return LINHA_DO_TEMPO.completo ? LINHA_DO_TEMPO.brasil : null
}

let cidades: Promise<Record<string, number[]>> | null = null

/** Votos por hora (8h, 9h, … 19h) de cada cidade, carregado sob demanda. */
export function carregarHorasDasCidades(): Promise<Record<string, number[]>> {
  cidades ??= import('./linha_do_tempo_cidades.json').then((m) => m.default.cidades)
  return cidades
}
