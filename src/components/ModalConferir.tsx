import { useModal } from '../hooks/useModal'
import { X, ExternalLink, CheckCircle2, FileSearch } from 'lucide-react'

interface ModalConferirProps {
  aberto: boolean
  onFechar: () => void
}

const LINKS = [
  {
    nome: 'Resultado oficial no site do TSE',
    url: 'https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados',
    texto: 'A contagem de todas as urnas do 2º turno.'
  },
  {
    nome: 'Dados abertos do TSE',
    url: 'https://dadosabertos.tse.jus.br',
    texto: 'Tabelas com os votos de cada seção do país, para quem quiser conferir a fundo.'
  },
  {
    nome: 'IBGE (população e riqueza das cidades)',
    url: 'https://sidra.ibge.gov.br',
    texto: 'De onde vêm os números de moradores, riqueza e agro usados nos gráficos.'
  },
  {
    nome: 'Candidatos e partidos',
    url: 'https://divulgacandcontas.tse.jus.br',
    texto: 'Quem são os candidatos, seus números e suas contas de campanha.'
  }
]

const PASSOS = [
  <>
    Entre em <strong className="text-tinta">resultados.tse.jus.br</strong> e procure por{' '}
    <em>&ldquo;Dados de urna&rdquo;</em>.
  </>,
  'Escolha o seu estado, a cidade, a zona e a seção. Esses números estão no seu título de eleitor.',
  'Você vai ver o boletim da sua urna, o mesmo que foi impresso na porta da sua seção quando a votação fechou.',
  'Compare com o que está neste painel.'
]

export function ModalConferir({ aberto, onFechar }: ModalConferirProps) {
  const caixa = useModal(aberto, onFechar)

  if (!aberto) return null

  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-conferir"
        onClick={(e) => e.stopPropagation()}
        className="bg-superficie border border-linha w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] my-auto"
      >
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-linha flex items-center justify-between gap-3">
          <h2 id="titulo-conferir" className="text-lg font-extrabold text-tinta">
            Como conferir os números
          </h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="p-2 rounded-lg text-tinta-2 hover:text-tinta hover:bg-superficie-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-tinta">
          <div className="flex items-start gap-3 bg-superficie-2 border border-linha rounded-xl p-4">
            <CheckCircle2 className="w-6 h-6 text-destaque shrink-0" aria-hidden="true" />
            <p>
              Os votos vêm do <strong className="text-tinta">TSE</strong>, a Justiça Eleitoral.
              Moradores e riqueza das cidades vêm do <strong className="text-tinta">IBGE</strong>.
              Qualquer pessoa pode conferir nos sites oficiais. Nenhum número foi inventado ou
              estimado.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-tinta">Sites oficiais</h3>
            {LINKS.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-linha bg-superficie-2 p-4 hover:border-emerald-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="flex items-center gap-2 font-bold text-tinta">
                  {l.nome}
                  <ExternalLink className="w-4 h-4 text-tinta-3" aria-hidden="true" />
                </span>
                <span className="block text-tinta-2 mt-1">{l.texto}</span>
              </a>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-tinta flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-cat-3" aria-hidden="true" />
              Como ver a urna da sua seção
            </h3>
            <ol className="space-y-2.5">
              {PASSOS.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-amber-400 text-zinc-950 font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 border-t border-linha flex justify-end">
          <button
            onClick={onFechar}
            className="rounded-lg bg-superficie-2 hover:bg-superficie-2 text-tinta text-sm font-bold px-5 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
