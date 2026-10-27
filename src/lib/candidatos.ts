/** Identidade visual e nome curto de cada candidato, a partir do número na urna. */
export const NUMERO_LULA = '13'

export const ehLula = (c: { numero: string }) => c.numero === NUMERO_LULA

export const nomeCurto = (c: { numero: string }) => (ehLula(c) ? 'Lula' : 'Flávio')

/** Nome como o eleitor conhece: "Lula", "Flávio Bolsonaro". */
export const nomePopular = (c: { numero: string }) => (ehLula(c) ? 'Lula' : 'Flávio Bolsonaro')

/** Classes Tailwind de cor (tokens do tema) do candidato. */
export function coresDo(c: { numero: string }) {
  return ehLula(c)
    ? { fundo: 'bg-lula', anel: 'ring-lula', selo: 'bg-red-700' }
    : { fundo: 'bg-flavio', anel: 'ring-flavio', selo: 'bg-blue-700' }
}
// "selo": tom mais escuro e fixo para texto branco pequeno (contraste ≥ 6:1 nos dois temas).
