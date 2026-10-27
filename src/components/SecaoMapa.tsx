import { ReactNode, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Cidade } from '../data/cidades'
import { METRICAS, MetricaId } from '../services/metricas'
import { SeletorMetrica } from './mapa/SeletorMetrica'
import { MapaInterativo } from './mapa/MapaInterativo'
import { MapaTelaCheia } from './mapa/MapaTelaCheia'
import { Secao } from './ui/Secao'

interface SecaoMapaProps {
  filtroUf: string | null
  onSelectUf: (uf: string | null) => void
  onSelectRegiao: (reg: string | null) => void
  cidades: Cidade[] | null
  cidade: Cidade | null
  onSelectCidade: (c: Cidade | null) => void
  /** conteúdo acima do mapa (ex.: seletor de região/estado) */
  children?: ReactNode
}

export function SecaoMapa({ children, ...lugar }: SecaoMapaProps) {
  const [telaCheia, setTelaCheia] = useState(false)
  const [modo, setModo] = useState<MetricaId>('margem')
  const metrica = METRICAS[modo]
  const soPorCidade = modo === 'agroPct' && !lugar.filtroUf

  return (
    <Secao
      id="mapa"
      titulo="Mapa do Brasil"
      subtitulo="Toque em um estado para ver as cidades dele"
      acao={
        <button
          type="button"
          onClick={() => setTelaCheia(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-linha bg-superficie px-4 text-sm font-bold text-tinta-2 transition hover:text-tinta"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Tela cheia
        </button>
      }
    >
      {children && <div className="mb-6">{children}</div>}
      <div className="mb-3">
        <SeletorMetrica valor={modo} onChange={setModo} />
        {soPorCidade && (
          <p className="mt-2 text-sm text-tinta-2">
            Esse dado só existe por cidade: escolha um estado ou abra a tela cheia em “Brasil por
            cidade”.
          </p>
        )}
      </div>
      {!telaCheia && <MapaInterativo {...lugar} metrica={metrica} />}
      <MapaTelaCheia
        aberto={telaCheia}
        onFechar={() => setTelaCheia(false)}
        modo={modo}
        onModo={setModo}
        {...lugar}
      />
    </Secao>
  )
}
