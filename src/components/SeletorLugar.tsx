import { ChevronRight, Globe2, X } from 'lucide-react'
import { ESTADOS_BRASIL, REGIOES_BRASIL } from '../data/geografia'
import { Cidade } from '../data/cidades'
import { EXTERIOR } from '../data/lugares'
import { BuscaCidade } from './BuscaCidade'

interface Props {
  filtroRegiao: string | null
  filtroUf: string | null
  cidade: Cidade | null
  cidades: Cidade[] | null
  onSelectCidade: (cidade: Cidade | null) => void
  onSelectRegiao: (regiao: string | null) => void
  onSelectUf: (uf: string | null) => void
  onReset: () => void
}

const migalha = (ativa: boolean) =>
  `inline-flex min-h-[40px] items-center rounded-xl px-3 font-bold transition ${
    ativa ? 'bg-tinta text-fundo' : 'text-tinta-2 hover:bg-superficie-2'
  }`

/** Onde olhar: Brasil, uma região, um estado ou uma cidade. */
export function SeletorLugar({
  filtroRegiao,
  filtroUf,
  cidade,
  cidades,
  onSelectCidade,
  onSelectRegiao,
  onSelectUf,
  onReset
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={onReset}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 font-bold transition ${
            !filtroRegiao && !filtroUf && !cidade
              ? 'bg-tinta text-fundo'
              : 'text-tinta-2 hover:bg-superficie-2'
          }`}
        >
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          Brasil todo
        </button>
        {filtroRegiao && (
          <>
            <ChevronRight className="h-4 w-4 text-tinta-3" aria-hidden="true" />
            <button
              type="button"
              onClick={() => onSelectUf(null)}
              className={migalha(!filtroUf && !cidade)}
            >
              Região {filtroRegiao}
            </button>
          </>
        )}
        {filtroUf && (
          <>
            <ChevronRight className="h-4 w-4 text-tinta-3" aria-hidden="true" />
            {cidade ? (
              <button type="button" onClick={() => onSelectCidade(null)} className={migalha(false)}>
                {ESTADOS_BRASIL[filtroUf]?.nome ?? filtroUf}
              </button>
            ) : (
              <span className={migalha(true)}>{ESTADOS_BRASIL[filtroUf]?.nome ?? filtroUf}</span>
            )}
          </>
        )}
        {cidade && (
          <>
            <ChevronRight className="h-4 w-4 text-tinta-3" aria-hidden="true" />
            {cidade.uf === EXTERIOR && (
              <>
                <span className={migalha(false)}>Exterior</span>
                <ChevronRight className="h-4 w-4 text-tinta-3" aria-hidden="true" />
              </>
            )}
            <span className={migalha(true)}>{cidade.nome}</span>
          </>
        )}
        {(filtroRegiao || filtroUf || cidade) && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-sm font-semibold text-tinta-2 hover:bg-superficie-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Limpar
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="rotulo mb-2">Escolha uma região</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(REGIOES_BRASIL).map((reg) => {
              const ativo = filtroRegiao === reg
              return (
                <button
                  key={reg}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => {
                    onSelectUf(null)
                    onSelectRegiao(ativo ? null : reg)
                  }}
                  className={`min-h-[44px] shrink-0 rounded-2xl border px-4 text-sm font-bold transition ${
                    ativo
                      ? 'border-transparent bg-gradient-to-r from-brilho-1 to-brilho-3 text-white shadow-md'
                      : 'border-linha bg-superficie text-tinta-2 hover:text-tinta'
                  }`}
                >
                  {reg}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="escolha-estado" className="rotulo mb-2 block">
              Ou escolha um estado
            </label>
            <select
              id="escolha-estado"
              value={filtroUf ?? ''}
              onChange={(e) => {
                const uf = e.target.value || null
                onSelectUf(uf)
                onSelectRegiao(uf ? (ESTADOS_BRASIL[uf]?.regiao ?? null) : null)
              }}
              className="min-h-[44px] w-full rounded-2xl border border-linha bg-superficie px-4 text-sm font-semibold text-tinta focus:outline-none focus:ring-2 focus:ring-cat-1"
            >
              <option value="">Todos os estados</option>
              {Object.values(ESTADOS_BRASIL)
                .filter((est) => !filtroRegiao || est.regiao === filtroRegiao)
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((est) => (
                  <option key={est.sigla} value={est.sigla}>
                    {est.nome}
                  </option>
                ))}
            </select>
          </div>
          <BuscaCidade cidades={cidades} onEscolher={onSelectCidade} />
        </div>
      </div>
    </div>
  )
}
