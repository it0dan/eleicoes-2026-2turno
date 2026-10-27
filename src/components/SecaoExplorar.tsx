import { useCallback, useId, useMemo, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Cidade } from '../data/cidades'
import { ESTADOS_BRASIL } from '../data/geografia'
import { siglaDoLugar } from '../data/lugares'
import { UFS_COM_MALHA } from '../data/malhas'
import { numero, numeroCompacto } from '../lib/formato'
import { histograma, semExterior } from '../services/analises'
import {
  LISTA_METRICAS,
  METRICAS,
  Metrica,
  MetricaId,
  quintos,
  Territorio,
  territorioDaCidade,
  territoriosEstados
} from '../services/metricas'
import { corDaMargem, corDoTerritorio } from './mapa/cores'
import { LegendaMapa } from './mapa/LegendaMapa'
import { MapaMunicipios } from './mapa/MapaMunicipios'
import { ResumoTerritorio } from './mapa/ResumoTerritorio'
import { TelaCheia } from './ui/TelaCheia'
import { Secao } from './ui/Secao'
import { ControleSegmentado } from './ui/ControleSegmentado'
import { Dispersao } from './graficos/Dispersao'
import { Histograma } from './graficos/Histograma'
import { Ranking } from './graficos/Ranking'
import { Tabela } from './graficos/Tabela'

type Tipo = 'pontos' | 'barras' | 'ranking' | 'mapa' | 'tabela'
type Unidade = 'cidades' | 'estados'

interface Props {
  cidades: Cidade[] | null
  cidade: Cidade | null
  onSelectCidade: (c: Cidade | null) => void
  onSelectUf: (uf: string | null) => void
  onSelectRegiao: (r: string | null) => void
}

const formatarEixo = (m: Metrica) => (n: number) =>
  m.porcentagem ? `${numero(n)}%` : (m.id === 'pibPorPessoa' ? 'R$ ' : '') + numeroCompacto(n)

function Escolha<T extends string>({
  rotulo,
  valor,
  onChange,
  opcoes
}: {
  rotulo: string
  valor: T
  onChange: (v: T) => void
  opcoes: { valor: T; rotulo: string }[]
}) {
  const id = useId()
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="rotulo mb-1.5 block">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-[44px] w-full rounded-2xl border border-linha bg-superficie px-3 text-sm font-semibold text-tinta focus:outline-none focus:ring-2 focus:ring-cat-1"
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Explorador livre: escolha onde, o que comparar e o tipo de gráfico. */
export function SecaoExplorar({
  cidades,
  cidade,
  onSelectCidade,
  onSelectUf,
  onSelectRegiao
}: Props) {
  const [onde, setOnde] = useState<string>('BR')
  const [unidade, setUnidade] = useState<Unidade>('cidades')
  const [tipo, setTipo] = useState<Tipo>('pontos')
  const [idX, setIdX] = useState<MetricaId>('pibPorPessoa')
  const [idY, setIdY] = useState<MetricaId>('pctLula')
  const [ordem, setOrdem] = useState<'maiores' | 'menores'>('maiores')
  const [telaCheia, setTelaCheia] = useState(false)
  const [sobre, setSobre] = useState<Cidade | null>(null)
  const mx = METRICAS[idX]
  const my = METRICAS[idY]
  const porEstado = onde === 'BR' && unidade === 'estados'

  const lugares: Territorio[] = useMemo(() => {
    if (porEstado) return territoriosEstados(cidades)
    const todas = semExterior((cidades ?? []).map(territorioDaCidade))
    return onde === 'BR' ? todas : todas.filter((t) => t.uf === onde)
  }, [cidades, onde, porEstado])

  const escolher = useCallback(
    (chave: string) => {
      if (porEstado) {
        onSelectUf(chave)
        onSelectRegiao(ESTADOS_BRASIL[chave]?.regiao ?? null)
        return
      }
      const c = cidades?.find((x) => x.codigo === chave)
      if (c) onSelectCidade(c)
    },
    [porEstado, cidades, onSelectCidade, onSelectUf, onSelectRegiao]
  )

  const nomeDe = (t: Territorio) => (porEstado ? t.nome : `${t.nome} (${siglaDoLugar(t.uf)})`)
  const comX = lugares.filter((t) => mx.ler(t) !== null)

  const opcoesMetrica = LISTA_METRICAS.filter((m) => !(porEstado && m.id === 'agroPct')).map(
    (m) => ({
      valor: m.id,
      rotulo: `${m.rotulo} (${m.fonte === 'IBGE' ? 'IBGE' : 'TSE'})`
    })
  )

  const cortesMapa = useMemo(() => quintos(comX.map((t) => mx.ler(t)!)), [comX, mx])
  const corMapa = useCallback(
    (c: Cidade) => corDoTerritorio(territorioDaCidade(c), mx, cortesMapa),
    [mx, cortesMapa]
  )
  const valorMapa = useCallback(
    (c: Cidade) => {
      const v = mx.ler(territorioDaCidade(c))
      return `${mx.rotulo}: ${v === null ? 'sem dado' : mx.formatar(v)}`
    },
    [mx]
  )

  const ufsMapa = onde === 'BR' ? UFS_COM_MALHA : [onde]
  const cidadesMapa = useMemo(
    () => (cidades ?? []).filter((c) => ufsMapa.includes(c.uf)),
    // ufsMapa muda junto com `onde`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cidades, onde]
  )
  const mapaCidades = (livre: boolean) => (
    <MapaMunicipios
      ufs={ufsMapa}
      cidades={cidadesMapa}
      corDe={corMapa}
      valorDe={valorMapa}
      selecionada={cidade?.codigo ?? null}
      onEscolher={(c) => onSelectCidade(c)}
      onSobre={setSobre}
      livre={livre}
      className="h-full w-full"
    />
  )
  const emFoco = sobre ?? (cidade && ufsMapa.includes(cidade.uf) ? cidade : null)

  let grafico: React.ReactNode = null
  if (!cidades) {
    grafico = <p className="text-sm text-tinta-2">Carregando as cidades…</p>
  } else if (tipo === 'pontos') {
    const pontos = lugares.flatMap((t) => {
      const x = mx.ler(t)
      const y = my.ler(t)
      if (x === null || y === null) return []
      return [
        {
          chave: t.chave,
          nome: nomeDe(t),
          x,
          y,
          peso: t.votos.eleitorado,
          cor: corDaMargem(METRICAS.margem.ler(t) ?? 0)
        }
      ]
    })
    grafico = (
      <Dispersao
        pontos={pontos}
        x={{
          rotulo: mx.rotulo,
          formatar: mx.formatar,
          formatarEixo: formatarEixo(mx),
          log: mx.log
        }}
        y={{
          rotulo: my.rotulo,
          formatar: my.formatar,
          formatarEixo: formatarEixo(my),
          log: my.log,
          dominio: my.porcentagem && my.id !== 'apos17h' ? [0, 100] : undefined
        }}
        referenciaY={
          my.id === 'pctLula' || my.id === 'pctFlavio' ? { valor: 50, texto: 'metade' } : undefined
        }
        destacado={porEstado ? null : (cidade?.codigo ?? null)}
        onSelecionar={escolher}
        descricao={`${pontos.length} ${porEstado ? 'estados' : 'cidades'}: ${mx.rotulo} contra ${my.rotulo}.`}
      />
    )
  } else if (tipo === 'barras') {
    if (!mx.porcentagem) {
      grafico = (
        <p className="text-sm text-tinta-2">
          Este tipo de gráfico só funciona com medidas “de cada 100”. Escolha outra medida, ou use
          Bolinhas ou Ranking.
        </p>
      )
    } else {
      const valores = comX.map((t) => mx.ler(t)!)
      const max = Math.max(5, Math.ceil(Math.max(...valores) / 5) * 5)
      const barras = histograma(comX, mx.ler, { min: 0, max, largura: max / 20 })
      grafico = (
        <Histograma
          barras={barras}
          corDe={() => 'rgb(var(--cat-1))'}
          faixa={(b) => `${mx.rotulo}: ${mx.formatar(b.de)} a ${mx.formatar(b.ate)}`}
          cadaRotulo={4}
          rotuloEixo={(b) => formatarEixo(mx)(b.de)}
          unidade={porEstado ? 'estados' : 'cidades'}
        />
      )
    }
  } else if (tipo === 'ranking') {
    const ordenados = [...comX].sort((a, b) =>
      ordem === 'maiores' ? mx.ler(b)! - mx.ler(a)! : mx.ler(a)! - mx.ler(b)!
    )
    grafico = (
      <>
        <ControleSegmentado
          rotuloGrupo="Ordem do ranking"
          valor={ordem}
          onChange={setOrdem}
          className="mb-3 w-full sm:w-72"
          opcoes={[
            { valor: 'maiores', rotulo: 'Maiores' },
            { valor: 'menores', rotulo: 'Menores' }
          ]}
        />
        <Ranking
          itens={ordenados.slice(0, 20).map((t) => ({
            chave: t.chave,
            nome: nomeDe(t),
            valor: mx.ler(t)!,
            texto: mx.formatar(mx.ler(t)!)
          }))}
          onSelecionar={escolher}
          selecionado={porEstado ? null : (cidade?.codigo ?? null)}
        />
      </>
    )
  } else if (tipo === 'mapa') {
    grafico = (
      <>
        <button
          type="button"
          onClick={() => setTelaCheia(true)}
          className="mb-3 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-linha bg-superficie px-4 text-sm font-bold text-tinta-2 transition hover:text-tinta"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Tela cheia
        </button>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="aspect-square overflow-hidden rounded-xl border border-linha bg-superficie-2/60">
            {!telaCheia && mapaCidades(false)}
          </div>
          <LegendaMapa metrica={mx} cortes={cortesMapa} />
        </div>
      </>
    )
  } else {
    const ordenados = [...lugares].sort((a, b) => a.nome.localeCompare(b.nome))
    grafico = (
      <Tabela
        chave={(t) => t.chave}
        linhas={ordenados}
        colunas={[
          { titulo: porEstado ? 'Estado' : 'Cidade', valor: nomeDe },
          ...[mx, my].map((m) => ({
            titulo: m.rotulo,
            valor: (t: Territorio) => {
              const v = m.ler(t)
              return v === null ? '—' : m.formatar(v)
            },
            numero: true
          }))
        ]}
      />
    )
  }

  const tipos: { valor: Tipo; rotulo: string }[] = [
    { valor: 'pontos', rotulo: 'Bolinhas (comparar duas medidas)' },
    { valor: 'barras', rotulo: 'Barras (quantas cidades em cada faixa)' },
    { valor: 'ranking', rotulo: 'Ranking (maiores e menores)' },
    ...(porEstado ? [] : [{ valor: 'mapa' as Tipo, rotulo: 'Mapa' }]),
    { valor: 'tabela', rotulo: 'Tabela' }
  ]

  // Usadas no formulário e na tela cheia do mapa.
  const escolhaOnde = (
    <Escolha
      rotulo="Onde"
      valor={onde}
      onChange={(v) => {
        setOnde(v)
        if (v !== 'BR') setUnidade('cidades')
      }}
      opcoes={[
        { valor: 'BR', rotulo: 'Brasil inteiro' },
        ...Object.values(ESTADOS_BRASIL)
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((e) => ({ valor: e.sigla, rotulo: e.nome }))
      ]}
    />
  )
  const escolhaMedida = (
    <Escolha
      rotulo={tipo === 'pontos' ? 'Medida 1 (na linha de baixo)' : 'O que medir'}
      valor={idX}
      onChange={setIdX}
      opcoes={opcoesMetrica}
    />
  )

  return (
    <Secao
      id="explorar"
      titulo="Explore você mesmo"
      subtitulo="Monte o seu gráfico: escolha o lugar, o que medir e o tipo de gráfico. Tocar numa cidade leva o painel até ela."
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {escolhaOnde}
        <Escolha
          rotulo="Mostrar"
          valor={unidade}
          onChange={(v) => {
            setUnidade(v)
            if (v === 'estados' && tipo === 'mapa') setTipo('pontos')
            if (v === 'estados' && idX === 'agroPct') setIdX('pibPorPessoa')
          }}
          opcoes={
            onde === 'BR'
              ? [
                  { valor: 'cidades', rotulo: 'Cidades' },
                  { valor: 'estados', rotulo: 'Estados' }
                ]
              : [{ valor: 'cidades', rotulo: 'Cidades' }]
          }
        />
        <Escolha rotulo="Tipo de gráfico" valor={tipo} onChange={setTipo} opcoes={tipos} />
        {escolhaMedida}
        {(tipo === 'pontos' || tipo === 'tabela') && (
          <Escolha
            rotulo={tipo === 'pontos' ? 'Medida 2 (na linha do lado)' : 'Segunda medida'}
            valor={idY}
            onChange={setIdY}
            opcoes={opcoesMetrica}
          />
        )}
      </div>
      {grafico}
      <p className="mt-4 text-xs text-tinta-3">
        {tipo === 'pontos' &&
          'Cor = quem ganhou ali (vermelho Lula, azul Flávio); tamanho = eleitores. '}
        {(tipo === 'pontos' || tipo === 'tabela' ? [mx, my] : [mx])
          .map((m) => `${m.rotulo}: ${m.explicacao} (fonte: ${m.fonte})`)
          .join('. ')}
        . Atenção: duas coisas acontecerem juntas não quer dizer que uma causa a outra.
      </p>
      <TelaCheia
        aberto={telaCheia}
        onFechar={() => {
          setTelaCheia(false)
          setSobre(null)
        }}
        titulo={`Mapa: ${mx.rotulo}`}
        barra={
          <div className="grid gap-3 sm:max-w-2xl sm:grid-cols-2">
            {escolhaOnde}
            {escolhaMedida}
          </div>
        }
      >
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-h-[65vh] overflow-hidden rounded-xl border border-linha bg-superficie-2/60 lg:min-h-0">
            {cidades && mapaCidades(true)}
          </div>
          <div className="space-y-4 overflow-y-auto rounded-xl border border-linha bg-superficie p-4">
            <ResumoTerritorio
              territorio={emFoco ? territorioDaCidade(emFoco) : null}
              tipo="cidade"
              metrica={mx}
            />
            <div className="border-t border-linha pt-3">
              <LegendaMapa metrica={mx} cortes={cortesMapa} />
            </div>
          </div>
        </div>
      </TelaCheia>
    </Secao>
  )
}
