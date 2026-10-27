import type { Topology } from 'topojson-specification'

// Malhas dos municípios do IBGE, uma por estado (analise/baixar_malhas.py), carregadas sob demanda:
// qualidade mínima no mapa da página; intermediária ("detalhe") na tela cheia, para aproximar bem.
const LEVES = import.meta.glob<Topology>('./malhas/*.json', { import: 'default' })
const DETALHADAS = import.meta.glob<Topology>('./malhas-detalhe/*.json', { import: 'default' })

const cache = new Map<string, Promise<Topology>>()

export function carregarMalha(uf: string, detalhe = false): Promise<Topology> {
  const pasta = detalhe ? 'malhas-detalhe' : 'malhas'
  const arquivo = (detalhe ? DETALHADAS : LEVES)[`./${pasta}/${uf.toLowerCase()}.json`]
  if (!arquivo) return Promise.reject(new Error(`sem malha para ${uf}`))
  const chave = `${pasta}/${uf}`
  if (!cache.has(chave)) cache.set(chave, arquivo())
  return cache.get(chave)!
}

export const UFS_COM_MALHA = Object.keys(LEVES).map((f) => f.slice(9, 11).toUpperCase())
