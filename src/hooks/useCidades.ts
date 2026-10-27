import { useEffect, useState } from 'react'
import { Cidade, carregarCidades, FontesIbge } from '../data/cidades'

/** Cidades e as fontes dos dados do IBGE (null enquanto carrega). */
export function useCidades(): { cidades: Cidade[]; fontesIbge: FontesIbge } | null {
  const [dados, setDados] = useState<{ cidades: Cidade[]; fontesIbge: FontesIbge } | null>(null)
  useEffect(() => {
    let ativo = true
    carregarCidades().then((d) => ativo && setDados(d))
    return () => {
      ativo = false
    }
  }, [])
  return dados
}
