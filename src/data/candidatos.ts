import tseBrasil from './tse_6258_brasil.json'
import { percentual2 } from '../lib/formato'

// Fotos em public/candidates. BASE_URL acompanha o endereço publicado (ex.: usuario.github.io/repositorio/).
const FOTOS = `${import.meta.env.BASE_URL}candidates/`

export interface CandidatoResult {
  id: string
  nome: string
  nomeVice: string
  numero: string
  partido: string
  coligacao: string
  cor: string
  foto: string
  votos: number
  percentual: number
  eleito?: boolean
  segundoTurno?: boolean
}

export interface PropostaEixo {
  eixo: string
  titulo: string
  descricao: string
}

export interface CandidatoDetalhes {
  id: string
  nomeUrna: string
  nomeCompleto: string
  numero: string
  partido: string
  siglaPartido: string
  coligacao: string
  cor: string
  foto: string
  fotoVice: string
  nomeVice: string
  partidoVice: string
  cargoVice: string
  dataNascimento: string
  naturalidade: string
  profissao: string
  resumoBiografico: string
  propostas: PropostaEixo[]
  estatisticas: {
    votosTotal: number
    percentualTotal: number
    totalEstadosVencidos: number
    estadosVencidos: string[]
  }
}

// Candidatos Oficiais - 2º Turno (Eleição TSE 6258 - 25/10/2026). Votos: tse_6258_brasil.json
const pctValidos = (v: number) => percentual2(v, tseBrasil.brasil.votosValidos)

export const CANDIDATOS_2T: CandidatoResult[] = [
  {
    id: 'cand-1',
    nome: 'LUIZ INÁCIO LULA DA SILVA',
    nomeVice: 'GERALDO ALCKMIN',
    numero: '13',
    partido: 'PT',
    coligacao:
      'Brasil da Esperança (FE BRASIL / PSB / SOLIDARIEDADE / FEDERAÇÃO PSOL REDE / AVANTE / AGIR)',
    cor: '#dc2626',
    foto: `${FOTOS}lula_sq.jpg`,
    votos: tseBrasil.brasil.lula,
    percentual: pctValidos(tseBrasil.brasil.lula),
    eleito: true
  },
  {
    id: 'cand-2',
    nome: 'FLAVIO NANTES BOLSONARO',
    nomeVice: 'ALFREDO GASPAR',
    numero: '22',
    partido: 'PL',
    coligacao: 'Pelo Bem do Brasil (PL / PP / REPUBLICANOS)',
    cor: '#2563eb',
    foto: `${FOTOS}flavio_sq.jpg`,
    votos: tseBrasil.brasil.flavio,
    percentual: pctValidos(tseBrasil.brasil.flavio),
    eleito: false
  }
]

// Detalhes Completos dos Candidatos (Biografia, Vice em HD, Propostas Oficiais e Estatísticas)
export const CANDIDATOS_DETALHES_2T: Record<string, CandidatoDetalhes> = {
  'cand-1': {
    id: 'cand-1',
    nomeUrna: 'LULA',
    nomeCompleto: 'Luiz Inácio Lula da Silva',
    numero: '13',
    partido: 'Partido dos Trabalhadores',
    siglaPartido: 'PT',
    coligacao:
      'Brasil da Esperança (FE BRASIL [PT/PCdoB/PV] / PSB / SOLIDARIEDADE / FEDERAÇÃO PSOL REDE / AVANTE / AGIR)',
    cor: '#dc2626',
    foto: `${FOTOS}lula_sq.jpg`,
    fotoVice: `${FOTOS}alckmin_sq.jpg`,
    nomeVice: 'Geraldo Alckmin',
    partidoVice: 'PSB',
    cargoVice: 'Ex-Governador de SP e Atual Vice-Presidente da República',
    dataNascimento: '27/10/1945 (Caetés / Garanhuns - PE)',
    naturalidade: 'Caetés - Pernambuco',
    profissao: 'Metalúrgico e Líder Sindical',
    resumoBiografico:
      'Líder sindical no ABC paulista na década de 1970, cofundador do Partido dos Trabalhadores (PT) em 1980 e da CUT em 1983. Foi deputado federal constituinte (1987-1988) e presidente da República por três mandatos históricos (2003-2010 e reeleito). Sua trajetória é marcada pela expansão de programas sociais, redução da miséria, fortalecimento do mercado consumidor interno e inserção internacional soberana do Brasil.',
    propostas: [
      {
        eixo: 'Economia & Reindustrialização',
        titulo: 'Nova Indústria Brasil e Transição Energética',
        descricao:
          'Fomento a projetos de reindustrialização com base em inovação verde, energia limpa (solar, eólica e hidrogênio verde), fortalecimento de bancos públicos como BNDES e investimentos estruturantes do Novo PAC.'
      },
      {
        eixo: 'Social & Distribuição de Renda',
        titulo: 'Valorização Salarial e Isenção de IR',
        descricao:
          'Continuidade da política de valorização do salário mínimo acima da inflação, consolidação do Bolsa Família com adicional para primeira infância e ampliação progressiva da faixa de isenção do Imposto de Renda.'
      },
      {
        eixo: 'Educação & Juventude',
        titulo: 'Expansão do Pé-de-Meia e Ensino Integral',
        descricao:
          'Incentivo financeiro mensal para permanência de estudantes no ensino médio público (Pé-de-Meia), expansão de vagas em escolas de tempo integral e ampliação de universidades e institutos federais.'
      },
      {
        eixo: 'Saúde & SUS',
        titulo: 'Mais Especialistas e Farmácia Popular',
        descricao:
          'Redução de tempo de espera em exames e consultas no SUS através de mutirões de telessaúde e expansão de medicamentos 100% gratuitos na rede credenciada do Farmácia Popular.'
      },
      {
        eixo: 'Meio Ambiente & Amazônia',
        titulo: 'Desmatamento Zero e Protagonismo na COP30',
        descricao:
          'Fiscalização rigorosa contra o desmatamento ilegal, desenvolvimento da bioeconomia na Amazônia com valorização dos povos tradicionais e liderança internacional na agenda climática global.'
      }
    ],
    estatisticas: {
      votosTotal: tseBrasil.brasil.lula,
      percentualTotal: pctValidos(tseBrasil.brasil.lula),
      totalEstadosVencidos: 13,
      estadosVencidos: [
        'BA',
        'CE',
        'PE',
        'MA',
        'PB',
        'RN',
        'PI',
        'AL',
        'SE',
        'PA',
        'AM',
        'AP',
        'MG',
        'ZZ'
      ]
    }
  },
  'cand-2': {
    id: 'cand-2',
    nomeUrna: 'FLÁVIO BOLSONARO',
    nomeCompleto: 'Flávio Nantes Bolsonaro',
    numero: '22',
    partido: 'Partido Liberal',
    siglaPartido: 'PL',
    coligacao: 'Pelo Bem do Brasil (PL / PP / REPUBLICANOS)',
    cor: '#2563eb',
    foto: `${FOTOS}flavio_sq.jpg`,
    fotoVice: `${FOTOS}alfredogaspar_sq.jpg`,
    nomeVice: 'Alfredo Gaspar',
    partidoVice: 'PL',
    cargoVice:
      'Deputado Federal por AL, Ex-Procurador-Geral de Justiça (MPE-AL) e Ex-Secretário de Segurança Pública',
    dataNascimento: '30/04/1981 (Resende - RJ)',
    naturalidade: 'Resende - Rio de Janeiro',
    profissao: 'Advogado, Empresário e Senador da República',
    resumoBiografico:
      'Advogado e empresário, iniciou sua vida pública elegendo-se deputado estadual pelo Rio de Janeiro em 2002, exercendo quatro mandatos consecutivos na ALERJ (2003-2019). Em 2018, foi eleito Senador da República pelo Rio de Janeiro com mais de 4,38 milhões de votos. Filho primogênito do ex-presidente Jair Bolsonaro, atua como uma das principais lideranças conservadoras do país com foco em pautas liberais na economia e rigidez na segurança.',
    propostas: [
      {
        eixo: 'Economia & Liberdade Empreendedora',
        titulo: 'Desregulamentação e Redução da Carga Tributária',
        descricao:
          'Corte de tributos sobre produção e consumo, redução do tamanho do Estado com privatizações de estatais deficitárias, desburocratização de licenças e incentivo à livre iniciativa e empreendedorismo.'
      },
      {
        eixo: 'Segurança Pública & Justiça',
        titulo: 'Endurecimento Penal e Apoio aos Policiais',
        descricao:
          'Tipificação mais severa contra facções criminosas e narcotráfico, fim de saidinhas para condenados por crimes hediondos, retaguarda jurídica para policiais em serviço e preservação do direito à legítima defesa.'
      },
      {
        eixo: 'Agronegócio & Exportações',
        titulo: 'Segurança Jurídica no Campo e Foco no Agro',
        descricao:
          'Garantia inviolável do direito de propriedade rural, combate a invasões de terras, modernização de infraestrutura de escoamento da safra e ampliação de novos mercados para o agro brasileiro.'
      },
      {
        eixo: 'Infraestrutura & Concessões',
        titulo: 'Ferrovias e Parcerias Privadas',
        descricao:
          'Expansão de ferrovias e portos via autorizações privadas e concessões rodoviárias, reduzindo o custo logístico Brasil e acelerando investimentos sem endividamento público.'
      },
      {
        eixo: 'Valores, Família e Liberdades',
        titulo: 'Liberdade de Expressão e Educação com Mérito',
        descricao:
          'Defesa das garantias constitucionais de livre manifestação, combate à censura em plataformas digitais, valorização dos princípios da família e incentivo a escolas cívico-militares e ensino técnico.'
      }
    ],
    estatisticas: {
      votosTotal: tseBrasil.brasil.flavio,
      percentualTotal: pctValidos(tseBrasil.brasil.flavio),
      totalEstadosVencidos: 14,
      estadosVencidos: [
        'SP',
        'RJ',
        'RS',
        'PR',
        'SC',
        'GO',
        'MT',
        'MS',
        'DF',
        'ES',
        'RO',
        'AC',
        'TO',
        'RR'
      ]
    }
  }
}
