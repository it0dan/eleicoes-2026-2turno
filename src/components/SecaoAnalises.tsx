import { useMemo, useState } from 'react'
import {
  Confronto,
  confrontoCapitais,
  confrontoEstados,
  confrontoRegioes,
  Ordem
} from '../services/graficos'
import { numero as fmt } from '../lib/formato'
import { ESTADOS_BRASIL } from '../data/geografia'
import { FontesIbge } from '../data/cidades'
import { Secao } from './ui/Secao'
import { ControleSegmentado } from './ui/ControleSegmentado'
import { BarrasConfronto } from './graficos/BarrasConfronto'
import { ColunasMargem } from './graficos/ColunasMargem'
import { Tabela } from './graficos/Tabela'
import { CartaoAnalise, Forma } from './ui/CartaoAnalise'
import { PropsAnalise, useLugar } from './analises/contexto'
import {
  CartaoCidadesGanhas,
  CartaoDivisaoCidades,
  CartaoQuemGanhou,
  CartaoVantagem
} from './analises/CartoesVoto'
import {
  CartaoAbstencao,
  CartaoBrancosNulos,
  CartaoPorte,
  CartaoRiqueza
} from './analises/CartoesCruzamentos'
import { CartaoLinhaDoTempo } from './analises/CartaoLinhaDoTempo'

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'vantagem', rotulo: 'Maior vitória' },
  { valor: 'az', rotulo: 'A–Z' },
  { valor: 'eleitorado', rotulo: 'Mais eleitores' }
]

/** "Lula venceu em 15 dos 27 estados." */
const vitorias = (itens: Confronto[], quais: 'estados' | 'capitais') => {
  const dos = quais === 'estados' ? 'dos' : 'das'
  const lula = itens.filter((c) => c.margem > 0).length
  return `Lula venceu em ${lula} ${dos} ${itens.length} ${quais}; Flávio, em ${itens.length - lula}. Toque num lugar para ver os números dele.`
}

/** Colunas (um gráfico só, fácil de comparar), a lista com as porcentagens e a tabela. */
function formasConfronto(
  itens: Confronto[],
  rotulo: (c: Confronto) => string,
  selecionado: string | null,
  onSelecionar: (chave: string) => void
): Forma[] {
  return [
    {
      id: 'colunas',
      rotulo: 'Colunas',
      comoLer:
        'Cada coluna é um lugar. Coluna para cima: Lula ganhou ali. Para baixo: Flávio ganhou. Quanto mais comprida, maior foi a diferença.',
      conteudo: () => (
        <ColunasMargem
          itens={itens}
          rotulo={rotulo}
          selecionado={selecionado}
          onSelecionar={onSelecionar}
        />
      )
    },
    {
      id: 'barras',
      rotulo: 'Barras',
      comoLer:
        'Cada barra é um lugar. Vermelho é a parte de Lula e azul a de Flávio. Quem passa da linha do meio ganhou.',
      conteudo: () => (
        <BarrasConfronto
          compacto
          itens={itens}
          selecionado={selecionado}
          onSelecionar={onSelecionar}
        />
      )
    },
    {
      id: 'tabela',
      rotulo: 'Tabela',
      conteudo: () => (
        <Tabela
          linhas={itens}
          chave={(c) => c.chave}
          colunas={[
            { titulo: 'Lugar', valor: (c) => c.nome },
            { titulo: 'Lula', valor: (c) => `${fmt(c.percLula, 1)}%`, numero: true },
            { titulo: 'Flávio', valor: (c) => `${fmt(c.percFlavio, 1)}%`, numero: true },
            {
              titulo: 'Diferença (votos)',
              valor: (c) => fmt(Math.abs(c.lula - c.flavio)),
              numero: true
            },
            { titulo: 'Quem ganhou', valor: (c) => (c.margem >= 0 ? 'Lula' : 'Flávio') }
          ]}
        />
      )
    }
  ]
}

/** Cartões com perguntas: cada um segue o lugar escolhido no painel e troca o tipo de gráfico. */
export function SecaoAnalises(p: PropsAnalise & { fontesIbge: FontesIbge | null }) {
  const { cidades, cidade, filtroUf, filtroRegiao, onSelectUf, onSelectRegiao, onSelectCidade } = p
  const lugar = useLugar(p)
  const [ordem, setOrdem] = useState<Ordem>('vantagem')
  const [ordemCapitais, setOrdemCapitais] = useState<Ordem>('vantagem')
  const regioes = useMemo(() => confrontoRegioes(), [])
  const estados = useMemo(() => confrontoEstados(ordem), [ordem])
  const capitais = useMemo(
    () => (cidades ? confrontoCapitais(cidades, ordemCapitais) : []),
    [cidades, ordemCapitais]
  )
  const siglaDaCapital = useMemo(
    () => new Map((cidades ?? []).filter((c) => c.capital).map((c) => [c.codigo, c.uf])),
    [cidades]
  )
  const carregando = <p className="text-sm text-tinta-2">Carregando as cidades…</p>
  const comCidades = cidades !== null && lugar.cidades.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div id="analises" className="lg:col-span-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-tinta sm:text-3xl">
          Entenda o resultado {lugar.ondeExato}
        </h2>
        <p className="mt-1 max-w-3xl text-base text-tinta-2">
          Cada quadro responde uma pergunta. A resposta aparece em destaque logo abaixo da pergunta.
          Use os botões de <strong className="text-tinta">“Ver como”</strong> para trocar o tipo de
          gráfico; “Tabela” mostra os números.
        </p>
      </div>
      <CartaoQuemGanhou p={p} lugar={lugar} className="lg:col-span-5" />
      {comCidades ? (
        <CartaoCidadesGanhas lugar={lugar} className="lg:col-span-7" />
      ) : (
        <Secao titulo="Em quantas cidades cada um ganhou?" className="lg:col-span-7">
          {carregando}
        </Secao>
      )}

      {lugar.partes.length > 1 && <CartaoVantagem lugar={lugar} className="lg:col-span-12" />}

      <CartaoLinhaDoTempo p={p} lugar={lugar} className="lg:col-span-12" />

      {comCidades && lugar.cidades.length > 1 && (
        <>
          <CartaoDivisaoCidades lugar={lugar} className="lg:col-span-6" />
          <CartaoAbstencao
            lugar={lugar}
            abstencao={p.resultado.abstencao}
            abstencaoPercentual={p.resultado.abstencaoPercentual}
            className="lg:col-span-6"
          />
          <CartaoPorte lugar={lugar} className="lg:col-span-6" />
          <CartaoRiqueza
            lugar={lugar}
            fonte={[p.fontesIbge?.pib, p.fontesIbge?.populacao, p.fontesIbge?.agroPct]
              .filter(Boolean)
              .join('; ')}
            className="lg:col-span-6"
          />
          <CartaoBrancosNulos lugar={lugar} className="lg:col-span-6" />
        </>
      )}

      <Secao
        titulo="Por região"
        subtitulo="Toque numa região para ver os números dela"
        className={comCidades && lugar.cidades.length > 1 ? 'lg:col-span-6' : 'lg:col-span-12'}
      >
        <BarrasConfronto
          itens={regioes}
          selecionado={filtroUf ? null : filtroRegiao}
          onSelecionar={(r) => {
            onSelectUf(null)
            onSelectRegiao(filtroRegiao === r && !filtroUf ? null : r)
          }}
        />
      </Secao>

      <CartaoAnalise
        pergunta="Por estado"
        resposta={vitorias(estados, 'estados')}
        className="lg:col-span-12"
        acao={
          <ControleSegmentado
            rotuloGrupo="Ordenar estados"
            valor={ordem}
            onChange={setOrdem}
            className="w-full sm:w-auto"
            opcoes={ORDENS}
          />
        }
        formas={formasConfronto(
          estados,
          (c) => c.chave,
          filtroUf,
          (uf) => {
            const novo = filtroUf === uf ? null : uf
            onSelectUf(novo)
            onSelectRegiao(novo ? (ESTADOS_BRASIL[novo]?.regiao ?? null) : null)
          }
        )}
      />

      {cidades ? (
        <CartaoAnalise
          id="capitais"
          pergunta="Nas capitais"
          resposta={vitorias(capitais, 'capitais')}
          className="lg:col-span-12"
          acao={
            <ControleSegmentado
              rotuloGrupo="Ordenar capitais"
              valor={ordemCapitais}
              onChange={setOrdemCapitais}
              className="w-full sm:w-auto"
              opcoes={ORDENS}
            />
          }
          formas={formasConfronto(
            capitais,
            (c) => siglaDaCapital.get(c.chave) ?? c.nome,
            cidade?.codigo ?? null,
            (codigo) =>
              onSelectCidade(
                cidade?.codigo === codigo
                  ? null
                  : (cidades.find((c) => c.codigo === codigo) ?? null)
              )
          )}
        />
      ) : (
        <Secao id="capitais" titulo="Nas capitais" className="lg:col-span-12">
          {carregando}
        </Secao>
      )}
    </div>
  )
}
