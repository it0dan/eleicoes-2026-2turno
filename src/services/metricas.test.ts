import { describe, expect, it } from 'vitest'
import cidadesJson from '../data/cidades.json'
import tseBrasil from '../data/tse_6258_brasil.json'
import { lerCidades } from '../data/cidades'
import {
  faixaDe,
  LISTA_METRICAS,
  METRICAS,
  quintos,
  territorioDaCidade,
  territorioExterior,
  territoriosEstados
} from './metricas'

const CIDADES = lerCidades(cidadesJson)
const TODAS = CIDADES.map(territorioDaCidade)
const ESTADOS = territoriosEstados(CIDADES)

describe('métricas', () => {
  it.each(LISTA_METRICAS.map((m) => m.id))(
    '%s: número válido ou "sem dado" em toda cidade',
    (id) => {
      const m = METRICAS[id]
      for (const t of TODAS) {
        const v = m.ler(t)
        if (v !== null) expect(Number.isFinite(v)).toBe(true)
        if (v !== null && m.porcentagem) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(100)
        }
      }
    }
  )

  it('margem positiva onde Lula ganhou e negativa onde Flávio ganhou', () => {
    for (const t of TODAS) {
      const m = METRICAS.margem.ler(t)
      if (m === null) continue
      expect(Math.sign(m)).toBe(Math.sign(t.votos.cand1 - t.votos.cand2))
    }
  })

  it('IBGE: toda cidade do Brasil tem população e PIB, menos a criada depois do Censo', () => {
    const semDado = TODAS.filter((t) => t.uf !== 'ZZ' && METRICAS.pibPorPessoa.ler(t) === null)
    expect(semDado.map((t) => t.nome)).toEqual(['Boa Esperança do Norte'])
    expect(TODAS.filter((t) => t.uf === 'ZZ').every((t) => t.populacao === null)).toBe(true)
  })

  it('estados: população é a soma das cidades', () => {
    const pop = ESTADOS.reduce((n, e) => n + (e.populacao ?? 0), 0)
    const somaCidades = TODAS.reduce((n, t) => n + (t.populacao ?? 0), 0)
    expect(pop).toBe(somaCidades)
    expect(pop).toBeGreaterThan(200_000_000) // Censo 2022: 203 milhões
  })

  it('exterior: votos do arquivo nacional do TSE', () => {
    expect(territorioExterior().votos.cand1).toBe(tseBrasil.exterior.lula)
  })

  it('quintos: 4 cortes em ordem e 5 grupos de tamanho parecido', () => {
    const valores = TODAS.map((t) => METRICAS.abstencao.ler(t)!).filter((v) => v !== null)
    const cortes = quintos(valores)
    expect(cortes).toHaveLength(4)
    for (let i = 1; i < 4; i++) expect(cortes[i]).toBeGreaterThanOrEqual(cortes[i - 1])
    const grupos = [0, 0, 0, 0, 0]
    for (const v of valores) grupos[faixaDe(v, cortes)]++
    for (const g of grupos)
      expect(Math.abs(g - valores.length / 5)).toBeLessThan(valores.length * 0.02)
  })
})
