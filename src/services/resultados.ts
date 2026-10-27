import { VOTOS_ESTADOS_2T, VOTOS_REGIOES_2T, VotosTerritorio } from '../data/votos'
import { CANDIDATOS_2T, CandidatoResult } from '../data/candidatos'
import { ESTADOS_BRASIL, REGIOES_BRASIL } from '../data/geografia'
import { TOTAL_LUGARES, siglaDoLugar } from '../data/lugares'
import { Cidade } from '../data/cidades'
import tseBrasil from '../data/tse_6258_brasil.json'
import { numero, percentual2 } from '../lib/formato'
import { quantosConferidos, tardiosDe, tardiosDoBrasil } from './prorrogacao'

export type Cenario = 'com_prorrogacao' | 'sem_prorrogacao'

export interface ResultadoPainel {
  titulo: string
  subtitulo: string
  cenario: Cenario
  /** false quando ainda não há dado para o cenário "sem prorrogação" neste lugar */
  disponivel: boolean
  /** de onde vêm os votos após as 17h usados no cenário "sem prorrogação" */
  nota: string | null
  eleitoradoApto: number
  totalSecoes: number
  secoesApuradas: number
  secoesApuradasPercentual: number
  votosValidos: number
  votosBrancos: number
  votosNulos: number
  abstencao: number
  abstencaoPercentual: number
  candidatos: (CandidatoResult & { votos: number; percentual: number })[]
}

// Brasil: arquivo nacional do TSE. Inclui o voto no exterior, por isso é maior que a soma das 27 UFs.
const NACIONAL: VotosTerritorio = {
  cand1: tseBrasil.brasil.lula,
  cand2: tseBrasil.brasil.flavio,
  totalValidos: tseBrasil.brasil.votosValidos,
  brancos: tseBrasil.brasil.brancos,
  nulos: tseBrasil.brasil.nulos,
  eleitorado: tseBrasil.brasil.eleitorado,
  totalSecoes: tseBrasil.brasil.totalSecoes,
  abstencao: tseBrasil.brasil.abstencao
}

const NOTA_CONFERIDO = (tardios: number) =>
  `Tiramos os ${numero(tardios)} votos dados depois das 17h. Para não favorecer Lula, tiramos todos da conta dele.`

/**
 * Sem prorrogação, no pior caso para Lula: todo voto dado após as 17h era dele.
 * Tira esses votos de Lula (nada do Flávio) e conta quem votou após as 17h como ausente.
 */
function semOsTardios(d: VotosTerritorio, tardios: number, perda: number): VotosTerritorio {
  return {
    ...d,
    cand1: d.cand1 - perda,
    totalValidos: d.totalValidos - perda,
    abstencao: d.abstencao + tardios
  }
}

interface Rotulos {
  titulo: string
  subtitulo: string
  cenario?: Cenario
  disponivel?: boolean
  nota?: string | null
}

function montar(
  d: VotosTerritorio,
  { titulo, subtitulo, cenario = 'com_prorrogacao', disponivel = true, nota = null }: Rotulos
): ResultadoPainel {
  return {
    titulo,
    subtitulo,
    cenario,
    disponivel,
    nota,
    eleitoradoApto: d.eleitorado,
    totalSecoes: d.totalSecoes,
    secoesApuradas: d.totalSecoes,
    secoesApuradasPercentual: 100,
    votosValidos: d.totalValidos,
    votosBrancos: d.brancos,
    votosNulos: d.nulos,
    abstencao: d.abstencao,
    abstencaoPercentual: percentual2(d.abstencao, d.eleitorado),
    candidatos: [
      { ...CANDIDATOS_2T[0], votos: d.cand1, percentual: percentual2(d.cand1, d.totalValidos) },
      { ...CANDIDATOS_2T[1], votos: d.cand2, percentual: percentual2(d.cand2, d.totalValidos) }
    ]
  }
}

const SUB_SEM = 'Como teria sido contando só os votos dados até as 17h'

/** Um lugar (cidade, UF ou região) no cenário pedido. Sem conferência completa, mostra o oficial e avisa. */
function lugar(
  d: VotosTerritorio,
  t: { tardios: number; perda: number } | null,
  titulo: string,
  subOficial: string,
  cenario: Cenario
): ResultadoPainel {
  if (cenario === 'com_prorrogacao') return montar(d, { titulo, subtitulo: subOficial })
  if (!t) {
    return montar(d, {
      titulo,
      subtitulo:
        'Ainda estamos conferindo as urnas daqui. Por enquanto, mostramos o resultado oficial.',
      cenario,
      disponivel: false
    })
  }
  return montar(semOsTardios(d, t.tardios, t.perda), {
    titulo,
    subtitulo: SUB_SEM,
    cenario,
    nota: NOTA_CONFERIDO(t.tardios)
  })
}

function brasil(cenario: Cenario): ResultadoPainel {
  if (cenario === 'com_prorrogacao') {
    return montar(NACIONAL, {
      titulo: 'Brasil: resultado final',
      subtitulo: 'Todas as urnas foram contadas. Lula foi eleito presidente.'
    })
  }
  const titulo = 'Brasil: sem prorrogação'
  const t = tardiosDoBrasil()
  if (!t) {
    const subtitulo = `Ainda estamos conferindo as urnas (${quantosConferidos()} de ${TOTAL_LUGARES} lugares). Mostrando o resultado oficial.`
    return montar(NACIONAL, { titulo, subtitulo, cenario, disponivel: false })
  }
  return montar(semOsTardios(NACIONAL, t.tardios, t.perda), {
    titulo,
    subtitulo: SUB_SEM,
    cenario,
    nota: NOTA_CONFERIDO(t.tardios)
  })
}

export function calcularResultado({
  filtroUf,
  filtroRegiao,
  cidade = null,
  cenario = 'com_prorrogacao'
}: {
  filtroUf: string | null
  filtroRegiao: string | null
  cidade?: Cidade | null
  cenario?: Cenario
}): ResultadoPainel {
  if (cidade) {
    return lugar(
      cidade.votos,
      { tardios: cidade.votosDepoisDas17h, perda: cidade.perdaMaxLula },
      `${cidade.nome} (${siglaDoLugar(cidade.uf)})`,
      cidade.capital ? 'Resultado final na capital' : 'Resultado final na cidade',
      cenario
    )
  }
  if (filtroUf && VOTOS_ESTADOS_2T[filtroUf]) {
    const nome = ESTADOS_BRASIL[filtroUf]?.nome ?? filtroUf
    return lugar(
      VOTOS_ESTADOS_2T[filtroUf],
      tardiosDe([filtroUf]),
      `${nome} (${filtroUf})`,
      'Resultado final no estado',
      cenario
    )
  }
  if (filtroRegiao && VOTOS_REGIOES_2T[filtroRegiao]) {
    return lugar(
      VOTOS_REGIOES_2T[filtroRegiao],
      tardiosDe(REGIOES_BRASIL[filtroRegiao].estados),
      `Região ${filtroRegiao}`,
      'Resultado final na região',
      cenario
    )
  }
  return brasil(cenario)
}
