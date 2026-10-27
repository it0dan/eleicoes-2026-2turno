import { describe, expect, it } from 'vitest'
import tseEstados from '../data/tse_6258_real_states.json'
import { REGIOES_BRASIL } from '../data/geografia'
import tseBrasil from '../data/tse_6258_brasil.json'
import semProrrogacao from '../data/sem_prorrogacao.json'
import { VOTOS_ESTADOS_2T, VOTOS_REGIOES_2T } from '../data/votos'
import { CANDIDATOS_DETALHES_2T } from '../data/candidatos'
import { calcularResultado } from './resultados'
import { provaNacional } from './prorrogacao'

const UFS = Object.keys(tseEstados)

describe('dados oficiais (TSE 6258)', () => {
  it('cobre as 27 UFs e todas pertencem a uma região', () => {
    expect(UFS).toHaveLength(27)
    const emRegioes = Object.values(REGIOES_BRASIL).flatMap((r) => r.estados)
    expect([...emRegioes].sort()).toEqual([...UFS].sort())
  })

  it.each(UFS)('%s: votos dos candidatos somam os votos válidos', (uf) => {
    const v = VOTOS_ESTADOS_2T[uf]
    expect(v.cand1 + v.cand2).toBe(v.totalValidos)
  })

  it.each(UFS)('%s: comparecimento = válidos + brancos + nulos', (uf) => {
    const e = tseEstados[uf as keyof typeof tseEstados]
    expect(e.votosValidos + e.brancos + e.nulos).toBe(e.comparecimento)
    expect(e.comparecimento + e.abstencao).toBe(e.eleitorado)
  })

  it('cada região é a soma das suas UFs', () => {
    for (const r of Object.values(REGIOES_BRASIL)) {
      const soma = r.estados.reduce((n, uf) => n + VOTOS_ESTADOS_2T[uf].cand1, 0)
      expect(VOTOS_REGIOES_2T[r.nome].cand1).toBe(soma)
    }
  })
})

describe('total nacional (TSE)', () => {
  const { brasil, exterior } = tseBrasil
  const somaUfs = (
    k:
      | 'cand1'
      | 'cand2'
      | 'totalValidos'
      | 'brancos'
      | 'nulos'
      | 'eleitorado'
      | 'totalSecoes'
      | 'abstencao'
  ) => Object.values(VOTOS_ESTADOS_2T).reduce((n, v) => n + v[k], 0)

  it('27 UFs + exterior = total do Brasil', () => {
    expect(somaUfs('cand1') + exterior.lula).toBe(brasil.lula)
    expect(somaUfs('cand2') + exterior.flavio).toBe(brasil.flavio)
    expect(somaUfs('totalValidos') + exterior.votosValidos).toBe(brasil.votosValidos)
    expect(somaUfs('brancos') + exterior.brancos).toBe(brasil.brancos)
    expect(somaUfs('nulos') + exterior.nulos).toBe(brasil.nulos)
    expect(somaUfs('abstencao') + exterior.abstencao).toBe(brasil.abstencao)
    expect(somaUfs('eleitorado') + exterior.eleitorado).toBe(brasil.eleitorado)
    expect(somaUfs('totalSecoes') + exterior.totalSecoes).toBe(brasil.totalSecoes)
  })

  it('Brasil fecha as contas e todas as seções foram totalizadas', () => {
    expect(brasil.lula + brasil.flavio).toBe(brasil.votosValidos)
    expect(brasil.votosValidos + brasil.brancos + brasil.nulos).toBe(brasil.comparecimento)
    // O TSE não informa comparecimento/abstenção de 41 seções (423 eleitores): ficam fora das duas contas.
    expect(brasil.comparecimento + brasil.abstencao + brasil.eleitoresSecoesNaoInformadas).toBe(
      brasil.eleitorado
    )
    expect(brasil.secoesTotalizadas).toBe(brasil.totalSecoes)
  })
})

describe('calcularResultado', () => {
  it('Brasil: Lula 51,79% x Flávio 48,21%, sem nenhum valor estimado', () => {
    const r = calcularResultado({ filtroUf: null, filtroRegiao: null })
    expect(r.candidatos.map((c) => c.percentual)).toEqual([51.79, 48.21])
    expect(r.candidatos[0].votos + r.candidatos[1].votos).toBe(r.votosValidos)
    expect(r.secoesApuradas).toBe(499248)
  })

  it('UF usa os números reais do estado', () => {
    const r = calcularResultado({ filtroUf: 'MG', filtroRegiao: null })
    expect(r.candidatos[0].votos).toBe(VOTOS_ESTADOS_2T.MG.cand1)
    expect(r.votosBrancos).toBe(VOTOS_ESTADOS_2T.MG.brancos)
    expect(r.abstencao).toBe(VOTOS_ESTADOS_2T.MG.abstencao)
  })

  it('região usa a soma real das UFs', () => {
    const r = calcularResultado({ filtroUf: null, filtroRegiao: 'Sul' })
    expect(r.eleitoradoApto).toBe(VOTOS_REGIOES_2T.Sul.eleitorado)
  })

  it('UF tem precedência sobre região', () => {
    expect(calcularResultado({ filtroUf: 'SP', filtroRegiao: 'Sul' }).titulo).toMatch(/SP/)
  })
})

describe('estados vencidos em CANDIDATOS_DETALHES_2T', () => {
  it('batem com os votos reais de cada UF', () => {
    const venceu = (id: 'cand-1' | 'cand-2') =>
      Object.entries(VOTOS_ESTADOS_2T)
        .filter(([, v]) => (id === 'cand-1' ? v.cand1 > v.cand2 : v.cand2 > v.cand1))
        .map(([uf]) => uf)
        .sort()
    for (const id of ['cand-1', 'cand-2'] as const) {
      const lista = CANDIDATOS_DETALHES_2T[id].estatisticas.estadosVencidos
        .filter((uf) => uf !== 'ZZ')
        .sort()
      expect(lista).toEqual(venceu(id))
    }
  })
})

describe('cenário sem prorrogação (pior caso para Lula)', () => {
  const conferidos = semProrrogacao.estados as Record<
    string,
    { votosDepoisDas17h: number; perdaMaxLula: number }
  >

  it('estado conferido: tira de Lula os votos depois das 17h e conta esses eleitores como ausentes', () => {
    const uf = Object.keys(conferidos)[0]
    const com = calcularResultado({ filtroUf: uf, filtroRegiao: null })
    const sem = calcularResultado({ filtroUf: uf, filtroRegiao: null, cenario: 'sem_prorrogacao' })
    expect(sem.disponivel).toBe(true)
    expect(sem.candidatos[0].votos).toBe(com.candidatos[0].votos - conferidos[uf].perdaMaxLula)
    expect(sem.candidatos[1].votos).toBe(com.candidatos[1].votos)
    expect(sem.abstencao).toBe(com.abstencao + conferidos[uf].votosDepoisDas17h)
  })

  it('estado ainda não conferido: não inventa número, mostra o oficial e avisa', () => {
    const naoConferido = Object.keys(VOTOS_ESTADOS_2T).find((uf) => !conferidos[uf])
    if (!naoConferido) return
    const sem = calcularResultado({
      filtroUf: naoConferido,
      filtroRegiao: null,
      cenario: 'sem_prorrogacao'
    })
    expect(sem.disponivel).toBe(false)
    expect(sem.candidatos[0].votos).toBe(VOTOS_ESTADOS_2T[naoConferido].cand1)
  })

  it('Brasil: só mostra o cenário sem prorrogação quando todos os 28 lugares foram conferidos', () => {
    const sem = calcularResultado({
      filtroUf: null,
      filtroRegiao: null,
      cenario: 'sem_prorrogacao'
    })
    const todos = [...Object.keys(VOTOS_ESTADOS_2T), 'ZZ'].every((uf) => uf in conferidos)
    expect(sem.disponivel).toBe(todos)
    if (todos) {
      expect(sem.candidatos[0].votos).toBeGreaterThan(sem.candidatos[1].votos)
      expect(sem.candidatos[0].votos + sem.candidatos[1].votos).toBe(sem.votosValidos)
    } else {
      expect(sem.candidatos[0].votos).toBe(tseBrasil.brasil.lula)
    }
  })
})

describe('prova nacional (pior caso, só dados oficiais)', () => {
  it('vantagem mínima = vantagem final − perdas nos conferidos − todos os votos de Lula nos pendentes', () => {
    const p = provaNacional()
    expect(p.conferidos.length + p.pendentes.length).toBe(28)
    const lulaPend = p.pendentes.reduce(
      (n: number, uf: string) =>
        n + (uf === 'ZZ' ? tseBrasil.exterior.lula : VOTOS_ESTADOS_2T[uf].cand1),
      0
    )
    expect(p.lulaPendentes).toBe(lulaPend)
    expect(p.vantagemMinima).toBe(p.vantagemFinal - p.perdaConferidos - lulaPend)
    expect(p.provado).toBe(p.vantagemMinima > 0)
  })
})
