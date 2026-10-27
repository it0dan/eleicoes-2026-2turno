import { describe, expect, it } from 'vitest'
import cidadesJson from '../data/cidades.json'
import tseBrasil from '../data/tse_6258_brasil.json'
import semProrrogacao from '../data/sem_prorrogacao.json'
import { INICIO_MIN, LINHA_DO_TEMPO } from '../data/linhaDoTempo'
import { naCidade, noLugar } from '../data/lugares'
import { lerCidades } from '../data/cidades'
import { VOTOS_ESTADOS_2T } from '../data/votos'
import {
  acumulado,
  votosEmPalavras,
  emPorcentagem,
  pico,
  porHora,
  capitalEInterior,
  cascata,
  cidadesDoLugar,
  confrontoDoGrupo,
  gruposPorPorte,
  gruposPorQuinto,
  histograma,
  placarDeCidades,
  semExterior,
  somar
} from './analises'
import { METRICAS, territorioDaCidade, territoriosEstados } from './metricas'

const CIDADES = lerCidades(cidadesJson)
const TODAS = CIDADES.map(territorioDaCidade)
const ESTADOS = territoriosEstados(CIDADES)

describe('somas e grupos', () => {
  it('as cidades somam o Brasil (com exterior)', () => {
    const s = somar(TODAS)
    expect(s.votos.cand1).toBe(tseBrasil.brasil.lula)
    expect(s.votos.cand2).toBe(tseBrasil.brasil.flavio)
  })

  it('estados: população e PIB somados das cidades', () => {
    const mg = ESTADOS.find((e) => e.chave === 'MG')!
    expect(mg.populacao).toBeGreaterThan(20_000_000)
    expect(mg.votos.cand1).toBe(VOTOS_ESTADOS_2T.MG.cand1)
  })

  it('cidadesDoLugar: estado, região e Brasil', () => {
    expect(cidadesDoLugar(TODAS, 'MG', 'Sudeste').every((c) => c.uf === 'MG')).toBe(true)
    const sudeste = cidadesDoLugar(TODAS, null, 'Sudeste')
    expect(new Set(sudeste.map((c) => c.uf))).toEqual(new Set(['MG', 'SP', 'RJ', 'ES']))
    expect(cidadesDoLugar(TODAS, null, null)).toHaveLength(TODAS.length)
  })

  it('placar de cidades soma todas as cidades e todos os eleitores', () => {
    const lista = semExterior(TODAS)
    const p = placarDeCidades(lista)
    expect(p.lula.cidades + p.flavio.cidades + p.empate.cidades).toBe(lista.length)
    expect(p.lula.eleitores + p.flavio.eleitores + p.empate.eleitores).toBe(
      somar(lista).votos.eleitorado
    )
  })

  it('porte e capital/interior dividem as cidades sem sobrar nem repetir', () => {
    const lista = semExterior(TODAS)
    expect(gruposPorPorte(lista).reduce((n, g) => n + g.lugares.length, 0)).toBe(lista.length)
    expect(capitalEInterior(lista).reduce((n, g) => n + g.lugares.length, 0)).toBe(lista.length)
  })

  it('quintos de riqueza: 5 grupos com todas as cidades que têm o dado', () => {
    const lista = semExterior(TODAS)
    const grupos = gruposPorQuinto(lista, METRICAS.pibPorPessoa, ['1', '2', '3', '4', '5'])
    expect(grupos).toHaveLength(5)
    const comDado = lista.filter((t) => METRICAS.pibPorPessoa.ler(t) !== null).length
    expect(grupos.reduce((n, g) => n + g.lugares.length, 0)).toBe(comDado)
  })

  it('confronto do grupo usa a soma dos votos (não a média das porcentagens)', () => {
    const c = confrontoDoGrupo('x', 'Brasil', TODAS)
    expect(c.lula).toBe(tseBrasil.brasil.lula)
    expect(c.percLula + c.percFlavio).toBeCloseTo(100, 6)
  })
})

describe('cascata e histograma', () => {
  it('a cascata termina exatamente na vantagem de Lula', () => {
    const passos = cascata(ESTADOS, 12)
    const total = ESTADOS.reduce((n, e) => n + e.votos.cand1 - e.votos.cand2, 0)
    expect(passos[passos.length - 1].fim).toBe(total)
    for (const p of passos) expect(p.fim - p.inicio).toBe(p.saldo)
  })

  it('cascata das cidades de um estado', () => {
    const mg = cidadesDoLugar(TODAS, 'MG', null)
    const passos = cascata(mg, 10)
    expect(passos.length).toBeLessThanOrEqual(12)
    expect(passos[passos.length - 1].fim).toBe(
      VOTOS_ESTADOS_2T.MG.cand1 - VOTOS_ESTADOS_2T.MG.cand2
    )
  })

  it('histograma conta cada cidade uma vez', () => {
    const lista = semExterior(TODAS)
    const barras = histograma(lista, METRICAS.pctLula.ler, { min: 0, max: 100, largura: 5 })
    expect(barras).toHaveLength(20)
    expect(barras.reduce((n, b) => n + b.quantos, 0)).toBe(lista.length)
  })
})

describe('linha do tempo', () => {
  it('por hora, porcentagem e acumulado', () => {
    const v = [1, 2, 3, 4, 5, 6, 10, 0, 0, 0, 0, 9]
    expect(porHora(v, 10)).toEqual([21, 19])
    expect(emPorcentagem([1, 3]).map((x) => Math.round(x))).toEqual([25, 75])
    expect(acumulado([1, 1, 2]).map((x) => Math.round(x))).toEqual([25, 50, 100])
    expect(pico(v)).toBe(6)
  })

  it('arquivo: cada estado pronto confere com os votos após 17h da análise urna a urna', () => {
    for (const [uf, serie] of Object.entries(LINHA_DO_TEMPO.estados)) {
      const k17 = (17 * 60 - INICIO_MIN) / LINHA_DO_TEMPO.passoMin
      const apos = serie.slice(k17).reduce((a, b) => a + b, 0)
      const e = semProrrogacao.estados[uf as keyof typeof semProrrogacao.estados]
      expect(apos).toBeGreaterThanOrEqual(e.votosDepoisDas17h - e.votosSemHorario)
    }
  })
})

describe('preposições', () => {
  it('na Bahia, no Pará, em São Paulo, no Rio de Janeiro', () => {
    expect(noLugar('BA')).toBe('na Bahia')
    expect(noLugar('PA')).toBe('no Pará')
    expect(noLugar('SP')).toBe('em São Paulo')
    expect(naCidade('Rio de Janeiro')).toBe('no Rio de Janeiro')
    expect(naCidade('Salvador')).toBe('em Salvador')
  })
})

describe('votos em palavras', () => {
  it('milhões levam "de"; mil e unidades não', () => {
    expect(votosEmPalavras(4_430_191)).toBe('4,4 milhões de votos')
    expect(votosEmPalavras(109_400)).toBe('109 mil votos')
    expect(votosEmPalavras(1)).toBe('1 voto')
    expect(votosEmPalavras(-950)).toBe('950 votos')
  })
})
