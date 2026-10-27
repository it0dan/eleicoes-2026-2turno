/** Formatação de números no padrão brasileiro (1.234.567 · 51,79). */
export function numero(n: number, casas = 0): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

/** Quanto `parte` representa de `total`, em % (0 quando o total é 0). Sem arredondar. */
export function proporcao(parte: number, total: number): number {
  return total > 0 ? (parte / total) * 100 : 0
}

/** Percentual arredondado a 2 casas, para exibir como dado oficial (ex.: 51,79). */
export function percentual2(parte: number, total: number): number {
  return Number(proporcao(parte, total).toFixed(2))
}

/** Uma casa decimal; duas quando o arredondamento empataria os dois lados (ex.: 50,01 × 49,99). */
export function casasParaDesempatar(a: number, b: number): 1 | 2 {
  return numero(a, 1) === numero(b, 1) ? 2 : 1
}

/** Forma curta para eixos: 950 · 12 mil · 1,5 mi. */
export function numeroCompacto(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${numero(n / 1_000_000, a % 1_000_000 ? 1 : 0)} mi`
  if (a >= 1_000) return `${numero(n / 1_000, a % 1_000 && a < 10_000 ? 1 : 0)} mil`
  return numero(n)
}

/** Porcentagem em palavras do dia a dia: 51,8 → "52 de cada 100"; abaixo de 1 → "menos de 1 de cada 100". */
export function deCada100(percentual: number): string {
  if (percentual > 0 && percentual < 1) return 'menos de 1 de cada 100'
  return `${Math.round(percentual)} de cada 100`
}
