import { lazy, Suspense, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Cabecalho } from './components/Cabecalho'
import { SecaoResultado } from './components/SecaoResultado'
import { SecaoMapa } from './components/SecaoMapa'
import { SeletorLugar } from './components/SeletorLugar'
import { SecaoProrrogacao } from './components/SecaoProrrogacao'
import { ModalConferir } from './components/ModalConferir'
import { calcularResultado, Cenario } from './services/resultados'
import { useTema } from './hooks/useTema'
import { useCidades } from './hooks/useCidades'
import { Cidade } from './data/cidades'
import { ESTADOS_BRASIL } from './data/geografia'

// Seções mais abaixo (gráficos, d3, mapas de cidades) chegam em arquivos à parte: a abertura fica leve.
const SecaoAnalises = lazy(() =>
  import('./components/SecaoAnalises').then((m) => ({ default: m.SecaoAnalises }))
)
const SecaoExplorar = lazy(() =>
  import('./components/SecaoExplorar').then((m) => ({ default: m.SecaoExplorar }))
)

/** Lugar reservado enquanto uma seção carrega (mantém a âncora do menu funcionando). */
const Carregando = ({ id }: { id: string }) => (
  <div id={id} className="cartao grid min-h-[320px] place-items-center p-6 text-sm text-tinta-2">
    Carregando…
  </div>
)

export function App() {
  const { tema, alternar } = useTema()
  // Com prorrogação = resultado oficial; sem = só os votos até as 17h (pior caso para Lula)
  const [cenario, setCenario] = useState<Cenario>('com_prorrogacao')
  const [filtroRegiao, setFiltroRegiao] = useState<string | null>(null)
  const [filtroUf, setFiltroUf] = useState<string | null>(null)
  const [cidade, setCidade] = useState<Cidade | null>(null)
  const [fontesAbertas, setFontesAbertas] = useState(false)
  const dadosCidades = useCidades()
  const cidades = dadosCidades?.cidades ?? null

  const resultado = useMemo(
    () => calcularResultado({ filtroUf, filtroRegiao, cidade, cenario }),
    [filtroRegiao, filtroUf, cidade, cenario]
  )
  const limpar = () => {
    setFiltroRegiao(null)
    setFiltroUf(null)
    setCidade(null)
  }
  // Trocar de estado ou região sai da cidade escolhida (se ela não for de lá).
  const escolherUf = (uf: string | null) => {
    setFiltroUf(uf)
    if (cidade && cidade.uf !== uf) setCidade(null)
  }
  const escolherRegiao = (regiao: string | null) => {
    setFiltroRegiao(regiao)
    if (cidade && ESTADOS_BRASIL[cidade.uf]?.regiao !== regiao) setCidade(null)
  }
  // A cidade leva junto o estado e a região dela (o mapa aproxima o estado). Exterior: sem estado.
  const escolherCidade = (c: Cidade | null) => {
    setCidade(c)
    if (!c) return
    setFiltroUf(ESTADOS_BRASIL[c.uf] ? c.uf : null)
    setFiltroRegiao(ESTADOS_BRASIL[c.uf]?.regiao ?? null)
  }
  const nivel = cidade ? 'Cidade' : filtroUf ? 'Estado' : filtroRegiao ? 'Região' : 'Brasil'

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Brilhos de fundo (decorativos) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brilho-1/25 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brilho-3/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/4 h-[30rem] w-[30rem] rounded-full bg-brilho-2/20 blur-3xl" />
      </div>

      <Cabecalho
        tema={tema}
        onAlternarTema={alternar}
        onAbrirFontes={() => setFontesAbertas(true)}
      />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <SecaoResultado
          resultado={resultado}
          cenario={cenario}
          onCenario={setCenario}
          nivel={nivel}
        />

        <SecaoMapa
          filtroUf={filtroUf}
          onSelectUf={escolherUf}
          onSelectRegiao={escolherRegiao}
          cidades={cidades}
          cidade={cidade}
          onSelectCidade={escolherCidade}
        >
          <SeletorLugar
            filtroRegiao={filtroRegiao}
            filtroUf={filtroUf}
            cidade={cidade}
            cidades={cidades}
            onSelectCidade={escolherCidade}
            onSelectRegiao={escolherRegiao}
            onSelectUf={escolherUf}
            onReset={limpar}
          />
        </SecaoMapa>

        <Suspense fallback={<Carregando id="analises" />}>
          <SecaoAnalises
            fontesIbge={dadosCidades?.fontesIbge ?? null}
            resultado={resultado}
            filtroRegiao={filtroRegiao}
            filtroUf={filtroUf}
            cidade={cidade}
            cidades={cidades}
            onSelectRegiao={escolherRegiao}
            onSelectUf={escolherUf}
            onSelectCidade={escolherCidade}
          />
        </Suspense>

        <SecaoProrrogacao cidades={cidades} />

        <Suspense fallback={<Carregando id="explorar" />}>
          <SecaoExplorar
            cidades={cidades}
            cidade={cidade}
            onSelectCidade={escolherCidade}
            onSelectUf={escolherUf}
            onSelectRegiao={escolherRegiao}
          />
        </Suspense>
      </main>

      <footer className="border-t border-linha/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-tinta-3 sm:flex-row sm:px-6">
          <p>Resultado da eleição para presidente · 2º turno · dados oficiais do TSE</p>
          <button
            type="button"
            onClick={() => setFontesAbertas(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-tinta-2 hover:text-tinta"
          >
            <ShieldCheck className="h-4 w-4 text-destaque" aria-hidden="true" />
            Como conferir os números
          </button>
        </div>
      </footer>

      <ModalConferir aberto={fontesAbertas} onFechar={() => setFontesAbertas(false)} />
    </div>
  )
}
