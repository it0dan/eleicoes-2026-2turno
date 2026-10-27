import { useState } from 'react'
import { Cidade } from '../../data/cidades'
import { METRICAS, MetricaId } from '../../services/metricas'
import { ControleSegmentado } from '../ui/ControleSegmentado'
import { TelaCheia } from '../ui/TelaCheia'
import { SeletorMetrica } from './SeletorMetrica'
import { MapaInterativo } from './MapaInterativo'

interface Props {
  aberto: boolean
  onFechar: () => void
  filtroUf: string | null
  onSelectUf: (uf: string | null) => void
  onSelectRegiao: (regiao: string | null) => void
  cidades: Cidade[] | null
  cidade: Cidade | null
  onSelectCidade: (c: Cidade | null) => void
  modo: MetricaId
  onModo: (m: MetricaId) => void
}

export function MapaTelaCheia({ aberto, onFechar, modo, onModo, ...mapa }: Props) {
  const [visao, setVisao] = useState<'estados' | 'cidades'>('estados')
  return (
    <TelaCheia
      aberto={aberto}
      onFechar={onFechar}
      titulo="Mapa do Brasil"
      acoes={
        <ControleSegmentado
          rotuloGrupo="Ver o Brasil por estado ou por cidade"
          valor={visao}
          onChange={setVisao}
          opcoes={[
            { valor: 'estados', rotulo: 'Por estado' },
            { valor: 'cidades', rotulo: 'Brasil por cidade' }
          ]}
        />
      }
      barra={<SeletorMetrica valor={modo} onChange={onModo} />}
    >
      <MapaInterativo
        {...mapa}
        metrica={METRICAS[modo]}
        grande
        brasilPorCidade={visao === 'cidades'}
      />
    </TelaCheia>
  )
}
