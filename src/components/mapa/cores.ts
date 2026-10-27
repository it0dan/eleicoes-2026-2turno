import { faixaDe, Metrica, Territorio } from '../../services/metricas'

const VERMELHOS = ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b'] // Lula: do mais claro ao mais forte
const AZUIS = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e40af'] // Flávio
// Métricas de "quanto": um tom só (violeta, que não é cor de candidato), do menor para o maior valor.
// Os tons mudam com o tema (index.css, --seq-1..5): no escuro, mais = mais claro.
const VIOLETAS = [1, 2, 3, 4, 5].map((i) => `rgb(var(--seq-${i}))`)

export const ESCALA_LULA = VERMELHOS
export const ESCALA_FLAVIO = AZUIS
export const ESCALA_SEQUENCIAL = VIOLETAS
export const SEM_DADO = '#a1a1aa'
export const EMPATE = '#d4d4d8'

/** Cortes da margem do vencedor, em % dos válidos: até 52%, 55%, 60%, 68% e acima. */
export const CORTES_VENCEDOR = [52, 55, 60, 68]

/** Quanto maior a vantagem do vencedor, mais escura a cor. `margem` = % Lula − % Flávio. */
export function corDaMargem(margem: number): string {
  if (margem === 0) return EMPATE
  const vencedor = 50 + Math.abs(margem) / 2
  const escala = margem > 0 ? VERMELHOS : AZUIS
  return escala[faixaDe(vencedor, CORTES_VENCEDOR)]
}

/** Cor de um lugar para a métrica escolhida; `cortes` = quintos dos valores mostrados (métricas sequenciais). */
export function corDoTerritorio(t: Territorio, metrica: Metrica, cortes: number[]): string {
  const v = metrica.ler(t)
  if (v === null) return SEM_DADO
  return metrica.escala === 'divergente' ? corDaMargem(v) : VIOLETAS[faixaDe(v, cortes)]
}
