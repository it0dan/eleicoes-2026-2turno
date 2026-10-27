import { VotosTerritorio } from './votos'

/**
 * Resultado oficial de cada cidade (arquivos por município do TSE) com os votos após as 17h contados urna a
 * urna e indicadores do IBGE. Gerado por analise/exportar_painel.py em cidades.json, em linhas compactas
 * (ver `campos`).
 */
export interface Cidade {
  /** UF + código do município no TSE (ex.: "SP71072", São Paulo) */
  codigo: string
  /** sigla da UF, ou "ZZ" para cidades do exterior */
  uf: string
  nome: string
  capital: boolean
  votos: VotosTerritorio
  comparecimento: number
  votosDepoisDas17h: number
  /** quanto a vantagem de Lula pode cair sem os votos após as 17h (pior caso, urna a urna) */
  perdaMaxLula: number
  /** dos votos após as 17h, quantos não têm horário no arquivo da urna (contados como após 17h por segurança) */
  votosSemHorario: number
  /** código IBGE (7 dígitos), que liga a cidade à malha do mapa; null no exterior */
  ibge: string | null
  /** IBGE: população no Censo 2022; null no exterior e em município criado depois */
  populacao: number | null
  /** IBGE: PIB do município, em mil reais */
  pibMilReais: number | null
  /** PIB ÷ população do Censo, em R$ */
  pibPorPessoa: number | null
  /** IBGE: parte da economia da cidade que vem da agropecuária, em % */
  agroPct: number | null
}

/** De onde vem cada indicador do IBGE (com o ano). */
export interface FontesIbge {
  populacao?: string
  pib?: string
  agroPct?: string
}

type Linha = [
  codigo: string,
  nome: string,
  capital: number,
  eleitores: number,
  comparecimento: number,
  lula: number,
  flavio: number,
  brancos: number,
  nulos: number,
  secoes: number,
  votosDepoisDas17h: number,
  perdaMaxLula: number,
  votosSemHorario: number,
  ibge: string | null,
  populacao: number | null,
  pibMilReais: number | null,
  agroPct: number | null
]

export function lerCidades(dados: { cidades: unknown[] }): Cidade[] {
  return (dados.cidades as Linha[]).map(
    ([
      codigo,
      nome,
      capital,
      eleitores,
      comparecimento,
      lula,
      flavio,
      brancos,
      nulos,
      secoes,
      tardios,
      perda,
      semHorario,
      ibge,
      populacao,
      pibMilReais,
      agroPct
    ]) => ({
      codigo,
      uf: codigo.slice(0, 2),
      nome,
      capital: capital === 1,
      comparecimento,
      votosDepoisDas17h: tardios,
      perdaMaxLula: perda,
      votosSemHorario: semHorario,
      ibge,
      populacao,
      pibMilReais,
      pibPorPessoa: pibMilReais && populacao ? (pibMilReais * 1000) / populacao : null,
      agroPct,
      votos: {
        cand1: lula,
        cand2: flavio,
        totalValidos: lula + flavio,
        brancos,
        nulos,
        eleitorado: eleitores,
        totalSecoes: secoes,
        abstencao: eleitores - comparecimento
      }
    })
  )
}

let carregando: Promise<{ cidades: Cidade[]; fontesIbge: FontesIbge }> | null = null

/** Carrega as cidades sob demanda (arquivo à parte, ~230 KB compactado). */
export function carregarCidades(): Promise<{ cidades: Cidade[]; fontesIbge: FontesIbge }> {
  carregando ??= import('./cidades.json').then((m) => ({
    cidades: lerCidades(m.default),
    fontesIbge: m.default.fontesIbge
  }))
  return carregando
}

/** "são paulo" e "Sao Paulo" acham "São Paulo". */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Até `limite` cidades cujo nome contém a busca: primeiro as que começam por ela, depois as maiores. */
export function buscarCidades(cidades: Cidade[], busca: string, limite = 8): Cidade[] {
  const termo = normalizar(busca)
  if (!termo) return []
  return cidades
    .map((c) => ({ c, pos: normalizar(c.nome).indexOf(termo) }))
    .filter((x) => x.pos >= 0)
    .sort(
      (a, b) =>
        Number(a.pos !== 0) - Number(b.pos !== 0) || b.c.votos.eleitorado - a.c.votos.eleitorado
    )
    .slice(0, limite)
    .map((x) => x.c)
}
