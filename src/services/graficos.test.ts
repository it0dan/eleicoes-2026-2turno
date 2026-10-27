import { describe, expect, it } from 'vitest'
import { calcularResultado } from './resultados'
import { composicaoVotos, confrontoEstados, confrontoRegioes } from './graficos'
import { prorrogacaoPorLugar } from './prorrogacao'
import { VOTOS_ESTADOS_2T } from '../data/votos'

describe('gráficos', () => {
  it('composição soma 100% do eleitorado com votos registrados', () => {
    const fatias = composicaoVotos(calcularResultado({ filtroUf: null, filtroRegiao: null }))
    expect(fatias.map((f) => f.chave)).toEqual(['lula', 'flavio', 'brancos', 'nulos', 'abstencao'])
    expect(fatias.reduce((n, f) => n + f.percentual, 0)).toBeCloseTo(100, 6)
  })

  it('regiões: 5, com percentuais que somam 100', () => {
    const r = confrontoRegioes()
    expect(r).toHaveLength(5)
    for (const c of r) expect(c.percLula + c.percFlavio).toBeCloseTo(100, 6)
  })

  it('estados: 27 e cada ordem funciona', () => {
    const v = confrontoEstados('vantagem')
    expect(v).toHaveLength(27)
    expect(v[0].margem).toBeGreaterThanOrEqual(v[26].margem)
    const az = confrontoEstados('az')
    expect(az[0].nome.localeCompare(az[1].nome)).toBeLessThanOrEqual(0)
    const el = confrontoEstados('eleitorado')
    expect(el[0].eleitorado).toBeGreaterThanOrEqual(el[1].eleitorado)
    expect(v.find((c) => c.chave === 'MG')?.lula).toBe(VOTOS_ESTADOS_2T.MG.cand1)
  })

  it('prorrogação: só lugares conferidos, ordenados pelos votos após 17h', () => {
    const p = prorrogacaoPorLugar()
    for (let i = 1; i < p.length; i++) expect(p[i - 1].apos17h).toBeGreaterThanOrEqual(p[i].apos17h)
    for (const e of p) expect(e.percentualApos).toBeLessThan(100)
  })
})
