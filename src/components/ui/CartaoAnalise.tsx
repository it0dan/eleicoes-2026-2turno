import { ReactNode, useState } from 'react'
import { Lightbulb, MessageCircle, TriangleAlert } from 'lucide-react'
import { Secao } from './Secao'
import { ControleSegmentado } from './ControleSegmentado'

export interface Forma {
  id: string
  /** nome do tipo de gráfico no botão: "Medidor", "Pizza", "Tabela"… */
  rotulo: string
  /** uma frase curta explicando como ler este gráfico */
  comoLer?: string
  conteudo: () => ReactNode
}

interface Props {
  id?: string
  pergunta: string
  /** a resposta em palavras simples, calculada dos dados */
  resposta?: ReactNode
  formas: Forma[]
  /** cuidado ao entender o gráfico (ex.: "uma coisa acontecer junto com outra não quer dizer que uma causa a outra") */
  nota?: string
  fonte?: string
  /** controle extra no cabeçalho (ex.: ordenar) */
  acao?: ReactNode
  className?: string
}

/** Cartão de análise: pergunta, resposta em palavras simples, gráfico (com troca de tipo) e como lê-lo. */
export function CartaoAnalise({
  id,
  pergunta,
  resposta,
  formas,
  nota,
  fonte,
  acao,
  className = ''
}: Props) {
  const [forma, setForma] = useState(formas[0].id)
  const atual = formas.find((f) => f.id === forma) ?? formas[0]
  return (
    <Secao id={id} titulo={pergunta} acao={acao} className={className}>
      {resposta && (
        <p className="-mt-1 mb-4 flex items-start gap-2 rounded-2xl bg-destaque/10 px-4 py-3 text-base text-tinta sm:text-lg">
          <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-destaque" aria-hidden="true" />
          <span>{resposta}</span>
        </p>
      )}
      {formas.length > 1 && (
        <div className="mb-4">
          <p className="rotulo mb-1.5">Ver como</p>
          <ControleSegmentado
            rotuloGrupo={`Ver como: ${pergunta}`}
            valor={forma}
            onChange={setForma}
            className="w-full sm:w-auto sm:max-w-md"
            opcoes={formas.map((f) => ({ valor: f.id, rotulo: f.rotulo }))}
          />
        </div>
      )}
      {atual.comoLer && (
        <p className="mb-3 flex items-start gap-2 text-sm text-tinta-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cat-3" aria-hidden="true" />
          <span>
            <strong className="text-tinta">Como ler:</strong> {atual.comoLer}
          </span>
        </p>
      )}
      <div>{atual.conteudo()}</div>
      {nota && (
        <p className="mt-4 flex items-start gap-2 text-sm text-tinta-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-cat-3" aria-hidden="true" />
          <span>{nota}</span>
        </p>
      )}
      {fonte && <p className="mt-2 text-xs text-tinta-3">Fonte: {fonte}.</p>}
    </Secao>
  )
}
