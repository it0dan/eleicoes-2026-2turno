import { ESTADOS_BRASIL } from './geografia'

export interface Caixa {
  x: number
  y: number
  w: number
  h: number
}

// Os caminhos de brazil_geo_paths.json são polilinhas (M/L/Z): basta ler os pares x,y.
function caixaDoCaminho(path: string): Caixa {
  const n = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i])
    x1 = Math.max(x1, n[i])
    y0 = Math.min(y0, n[i + 1])
    y1 = Math.max(y1, n[i + 1])
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const CAIXA_ESTADO: Record<string, Caixa> = Object.fromEntries(
  Object.values(ESTADOS_BRASIL).map((e) => [e.sigla, caixaDoCaminho(e.svgPath)])
)

const MARGEM_BRASIL = 8
const ESPACO_ROTULOS_LESTE = 32 // sobra à direita para os rótulos do litoral
export const CAIXA_BRASIL: Caixa = (() => {
  const caixas = Object.values(CAIXA_ESTADO)
  const x0 = Math.min(...caixas.map((c) => c.x))
  const y0 = Math.min(...caixas.map((c) => c.y))
  const x1 = Math.max(...caixas.map((c) => c.x + c.w))
  const y1 = Math.max(...caixas.map((c) => c.y + c.h))
  return {
    x: x0 - MARGEM_BRASIL,
    y: y0 - MARGEM_BRASIL,
    w: x1 - x0 + 2 * MARGEM_BRASIL + ESPACO_ROTULOS_LESTE,
    h: y1 - y0 + 2 * MARGEM_BRASIL
  }
})()

// Caixa de zoom de um estado: o estado com uma folga proporcional ao seu tamanho.
export function caixaDeZoom(uf: string): Caixa {
  const c = CAIXA_ESTADO[uf]
  const folga = Math.max(c.w, c.h) * 0.18 + 4
  return { x: c.x - folga, y: c.y - folga, w: c.w + 2 * folga, h: c.h + 2 * folga }
}

type Ponto = [number, number]

function simplificar(pts: Ponto[], tolerancia: number): Ponto[] {
  if (pts.length < 3) return pts
  const [a, b] = [pts[0], pts[pts.length - 1]]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const norma = Math.hypot(dx, dy) || 1
  let maior = 0
  let idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / norma
    if (d > maior) {
      maior = d
      idx = i
    }
  }
  if (maior <= tolerancia) return [a, b]
  return [
    ...simplificar(pts.slice(0, idx + 1), tolerancia).slice(0, -1),
    ...simplificar(pts.slice(idx), tolerancia)
  ]
}

// Os contornos vêm de uma imagem de baixa resolução e ficam "em escadinha" quando ampliados.
// Simplifica a escadinha e arredonda os cantos (Chaikin) só para a visão ampliada.
export function caminhoSuave(path: string): string {
  const n = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  let pts: Ponto[] = []
  for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]])
  if (pts.length < 4) return path
  const fechado = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]
  if (fechado) pts = pts.slice(0, -1)
  // Fecha o anel antes de simplificar para o ponto de partida não ficar sempre fixo.
  const meio = Math.floor(pts.length / 2)
  const anel = [
    ...simplificar([...pts.slice(0, meio + 1)], 0.9).slice(0, -1),
    ...simplificar([...pts.slice(meio), pts[0]], 0.9).slice(0, -1)
  ]
  let atual = anel
  for (let it = 0; it < 3; it++) {
    const prox: Ponto[] = []
    for (let i = 0; i < atual.length; i++) {
      const p = atual[i]
      const q = atual[(i + 1) % atual.length]
      prox.push(
        [0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]],
        [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]
      )
    }
    atual = prox
  }
  return 'M ' + atual.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ') + ' Z'
}

export const CAMINHO_SUAVE: Record<string, string> = Object.fromEntries(
  Object.values(ESTADOS_BRASIL).map((e) => [e.sigla, caminhoSuave(e.svgPath)])
)

// Centroide (ponderado pela área) do polígono: onde a sigla fica melhor do que no centro da caixa.
export const CENTROIDE: Record<string, { x: number; y: number }> = Object.fromEntries(
  Object.values(ESTADOS_BRASIL).map((e) => {
    const n = e.svgPath.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
    const pts: Ponto[] = []
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]])
    let a = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[(i + 1) % pts.length]
      const f = x0 * y1 - x1 * y0
      a += f
      cx += (x0 + x1) * f
      cy += (y0 + y1) * f
    }
    if (Math.abs(a) < 1e-6) return [e.sigla, { x: e.labelX, y: e.labelY }]
    return [e.sigla, { x: cx / (3 * a), y: cy / (3 * a) }]
  })
)
