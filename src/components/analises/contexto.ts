import { useMemo } from 'react'
import { Cidade } from '../../data/cidades'
import { ESTADOS_BRASIL, REGIOES_BRASIL } from '../../data/geografia'
import { naCidade, noLugar } from '../../data/lugares'
import { cidadesDoLugar, semExterior } from '../../services/analises'
import {
  Territorio,
  territorioDaCidade,
  territorioExterior,
  territoriosEstados
} from '../../services/metricas'
import { ResultadoPainel } from '../../services/resultados'

/** O que todo cartão de análise recebe: o lugar escolhido no painel e como mudar a escolha. */
export interface PropsAnalise {
  resultado: ResultadoPainel
  cidades: Cidade[] | null
  filtroUf: string | null
  filtroRegiao: string | null
  cidade: Cidade | null
  onSelectUf: (uf: string | null) => void
  onSelectRegiao: (r: string | null) => void
  onSelectCidade: (c: Cidade | null) => void
}

export interface Lugar {
  /** "no Brasil", "em Minas Gerais", "na Região Sudeste" */
  onde: string
  /** como `onde`, mas com a cidade quando há uma escolhida ("em Belo Horizonte") */
  ondeExato: string
  /** cidades do lugar (sem o exterior), já como Territorio */
  cidades: Territorio[]
  /** as partes do lugar: estados (+ exterior) no Brasil, estados na região, cidades no estado */
  partes: Territorio[]
  /** que tipo de parte: para textos ("estados", "cidades") */
  tipoPartes: 'estados' | 'cidades'
  /** escolher uma parte no painel (estado ou cidade) */
  escolherParte: (chave: string) => void
  /** parte em destaque (estado ou cidade escolhidos) */
  parteEscolhida: string | null
  /** escolher (ou desfazer a escolha de) uma cidade pelo código */
  escolherCidade: (codigo: string) => void
}

export function useLugar(p: PropsAnalise): Lugar {
  const { cidades, filtroUf, filtroRegiao, cidade } = p
  const estados = useMemo(() => territoriosEstados(cidades), [cidades])
  const todas = useMemo(() => (cidades ?? []).map(territorioDaCidade), [cidades])

  return useMemo(() => {
    const doLugar = semExterior(cidadesDoLugar(todas, filtroUf, filtroRegiao))
    const escolherCidade = (chave: string) => {
      const c = cidades?.find((x) => x.codigo === chave)
      if (c) p.onSelectCidade(cidade?.codigo === chave ? null : c)
    }
    const escolherEstado = (uf: string) => {
      if (!ESTADOS_BRASIL[uf]) return
      p.onSelectUf(uf)
      p.onSelectRegiao(ESTADOS_BRASIL[uf].regiao)
    }
    if (filtroUf) {
      return {
        onde: noLugar(filtroUf),
        ondeExato: cidade ? naCidade(cidade.nome) : noLugar(filtroUf),
        cidades: doLugar,
        partes: doLugar,
        tipoPartes: 'cidades',
        escolherParte: escolherCidade,
        parteEscolhida: cidade?.codigo ?? null,
        escolherCidade
      }
    }
    if (filtroRegiao && REGIOES_BRASIL[filtroRegiao]) {
      const ufs = REGIOES_BRASIL[filtroRegiao].estados
      return {
        onde: `na Região ${filtroRegiao}`,
        ondeExato: `na Região ${filtroRegiao}`,
        cidades: doLugar,
        partes: estados.filter((e) => ufs.includes(e.uf)),
        tipoPartes: 'estados',
        escolherParte: escolherEstado,
        parteEscolhida: null,
        escolherCidade
      }
    }
    return {
      onde: 'no Brasil',
      ondeExato: cidade ? naCidade(cidade.nome) : 'no Brasil',
      cidades: doLugar,
      partes: [...estados, territorioExterior()],
      tipoPartes: 'estados',
      escolherParte: escolherEstado,
      parteEscolhida: null,
      escolherCidade
    }
    // p.on* são estáveis o bastante (vêm do App); recalcula quando o lugar muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todas, estados, cidades, filtroUf, filtroRegiao, cidade])
}
