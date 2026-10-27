import { describe, expect, it } from 'vitest'
import cidadesJson from '../data/cidades.json'
import semProrrogacao from '../data/sem_prorrogacao.json'
import tseBrasil from '../data/tse_6258_brasil.json'
import { buscarCidades, lerCidades } from '../data/cidades'
import { VOTOS_ESTADOS_2T } from '../data/votos'
import { EXTERIOR, LUGARES } from '../data/lugares'
import { calcularResultado } from './resultados'
import { confrontoCapitais } from './graficos'
import { cidadesQuePodiamMudar, prorrogacaoNasCidades } from './prorrogacao'

const CIDADES = lerCidades(cidadesJson)
const doLugar = (uf: string) => CIDADES.filter((c) => c.uf === uf)
const soma = (uf: string, f: (c: (typeof CIDADES)[number]) => number) =>
  doLugar(uf).reduce((n, c) => n + f(c), 0)

describe('cidades (arquivos por município do TSE)', () => {
  it('uma capital por estado e nenhuma no exterior', () => {
    const capitais = CIDADES.filter((c) => c.capital)
    expect(capitais).toHaveLength(27)
    expect(new Set(capitais.map((c) => c.uf)).size).toBe(27)
    expect(capitais.some((c) => c.uf === EXTERIOR)).toBe(false)
  })

  it('em cada cidade, quem votou = válidos + brancos + nulos', () => {
    for (const c of CIDADES) {
      expect(c.votos.totalValidos + c.votos.brancos + c.votos.nulos).toBe(c.comparecimento)
      expect(c.votos.abstencao).toBeGreaterThanOrEqual(0)
      expect(c.votosDepoisDas17h).toBeLessThanOrEqual(c.comparecimento)
    }
  })

  it.each(Object.keys(VOTOS_ESTADOS_2T))('%s: as cidades somam o total do estado', (uf) => {
    const e = VOTOS_ESTADOS_2T[uf]
    expect(soma(uf, (c) => c.votos.cand1)).toBe(e.cand1)
    expect(soma(uf, (c) => c.votos.cand2)).toBe(e.cand2)
    expect(soma(uf, (c) => c.votos.brancos)).toBe(e.brancos)
    expect(soma(uf, (c) => c.votos.nulos)).toBe(e.nulos)
  })

  it('as cidades do exterior somam os votos do exterior', () => {
    expect(soma(EXTERIOR, (c) => c.votos.cand1)).toBe(tseBrasil.exterior.lula)
    expect(soma(EXTERIOR, (c) => c.votos.cand2)).toBe(tseBrasil.exterior.flavio)
  })

  it.each(LUGARES)('%s: votos após 17h das cidades = os do lugar', (uf) => {
    const lugar = semProrrogacao.estados[uf as keyof typeof semProrrogacao.estados]
    expect(soma(uf, (c) => c.votosDepoisDas17h)).toBe(lugar.votosDepoisDas17h)
  })
})

describe('cidade no painel', () => {
  const bh = CIDADES.find((c) => c.nome === 'Belo Horizonte')!

  it('resultado oficial da cidade', () => {
    const r = calcularResultado({ filtroUf: 'MG', filtroRegiao: 'Sudeste', cidade: bh })
    expect(r.titulo).toBe('Belo Horizonte (MG)')
    expect(r.candidatos[0].votos).toBe(bh.votos.cand1)
    expect(r.candidatos[1].votos).toBe(bh.votos.cand2)
  })

  it('sem prorrogação: tira de Lula a perda máxima da cidade', () => {
    const r = calcularResultado({
      filtroUf: 'MG',
      filtroRegiao: 'Sudeste',
      cidade: bh,
      cenario: 'sem_prorrogacao'
    })
    expect(r.disponivel).toBe(true)
    expect(r.candidatos[0].votos).toBe(bh.votos.cand1 - bh.perdaMaxLula)
    expect(r.abstencao).toBe(bh.votos.abstencao + bh.votosDepoisDas17h)
  })

  it('busca ignora acentos e prioriza o começo do nome', () => {
    expect(buscarCidades(CIDADES, 'sao paulo')[0].nome).toBe('São Paulo')
    expect(buscarCidades(CIDADES, 'BELO')[0].nome).toBe('Belo Horizonte')
    expect(buscarCidades(CIDADES, '')).toEqual([])
  })

  it('cidades onde os votos após 17h bastariam para mudar o resultado local', () => {
    const lista = cidadesQuePodiamMudar(CIDADES)
    for (const c of lista) {
      expect(c.votosDepoisDas17h).toBeGreaterThan(0)
      expect(c.votosDepoisDas17h).toBeGreaterThanOrEqual(Math.abs(c.votos.cand1 - c.votos.cand2))
    }
    // as do Brasil vêm antes das do exterior
    const primeiraFora = lista.findIndex((c) => c.uf === EXTERIOR)
    expect(lista.slice(primeiraFora).every((c) => c.uf === EXTERIOR)).toBe(true)
    expect(lista.length).toBe(28)
  })

  it('capitais e ranking da prorrogação', () => {
    expect(confrontoCapitais(CIDADES)).toHaveLength(27)
    const top = prorrogacaoNasCidades(CIDADES, 5)
    expect(top).toHaveLength(5)
    for (let i = 1; i < top.length; i++)
      expect(top[i - 1].apos17h).toBeGreaterThanOrEqual(top[i].apos17h)
  })
})
