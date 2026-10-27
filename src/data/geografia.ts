import brazilGeoPaths from './brazil_geo_paths.json'

export type NomeRegiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export interface EstadoInfo {
  sigla: string
  nome: string
  regiao: NomeRegiao
  /** contorno do estado no SVG do mapa (brazil_geo_paths.json) */
  svgPath: string
  labelX: number
  labelY: number
}

export interface RegiaoInfo {
  nome: NomeRegiao
  estados: string[]
}

export const REGIOES_BRASIL: Record<string, RegiaoInfo> = {
  Sudeste: { nome: 'Sudeste', estados: ['SP', 'MG', 'RJ', 'ES'] },
  Nordeste: { nome: 'Nordeste', estados: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'PI', 'SE'] },
  Sul: { nome: 'Sul', estados: ['RS', 'PR', 'SC'] },
  Norte: { nome: 'Norte', estados: ['PA', 'AM', 'RO', 'TO', 'AC', 'AP', 'RR'] },
  'Centro-Oeste': { nome: 'Centro-Oeste', estados: ['GO', 'MT', 'MS', 'DF'] }
}

const geo = brazilGeoPaths as Record<string, { path: string; labelX: number; labelY: number }>

// [sigla, nome, região] — o contorno e a posição do rótulo vêm de brazil_geo_paths.json
const ESTADOS: [string, string, NomeRegiao][] = [
  ['AC', 'Acre', 'Norte'],
  ['AL', 'Alagoas', 'Nordeste'],
  ['AP', 'Amapá', 'Norte'],
  ['AM', 'Amazonas', 'Norte'],
  ['BA', 'Bahia', 'Nordeste'],
  ['CE', 'Ceará', 'Nordeste'],
  ['DF', 'Distrito Federal', 'Centro-Oeste'],
  ['ES', 'Espírito Santo', 'Sudeste'],
  ['GO', 'Goiás', 'Centro-Oeste'],
  ['MA', 'Maranhão', 'Nordeste'],
  ['MT', 'Mato Grosso', 'Centro-Oeste'],
  ['MS', 'Mato Grosso do Sul', 'Centro-Oeste'],
  ['MG', 'Minas Gerais', 'Sudeste'],
  ['PA', 'Pará', 'Norte'],
  ['PB', 'Paraíba', 'Nordeste'],
  ['PR', 'Paraná', 'Sul'],
  ['PE', 'Pernambuco', 'Nordeste'],
  ['PI', 'Piauí', 'Nordeste'],
  ['RJ', 'Rio de Janeiro', 'Sudeste'],
  ['RN', 'Rio Grande do Norte', 'Nordeste'],
  ['RS', 'Rio Grande do Sul', 'Sul'],
  ['RO', 'Rondônia', 'Norte'],
  ['RR', 'Roraima', 'Norte'],
  ['SC', 'Santa Catarina', 'Sul'],
  ['SP', 'São Paulo', 'Sudeste'],
  ['SE', 'Sergipe', 'Nordeste'],
  ['TO', 'Tocantins', 'Norte']
]

export const ESTADOS_BRASIL: Record<string, EstadoInfo> = Object.fromEntries(
  ESTADOS.map(([sigla, nome, regiao]) => [
    sigla,
    {
      sigla,
      nome,
      regiao,
      svgPath: geo[sigla].path,
      labelX: geo[sigla].labelX,
      labelY: geo[sigla].labelY
    }
  ])
)
