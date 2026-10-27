import { useId, useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { Cidade, buscarCidades } from '../data/cidades'
import { siglaDoLugar } from '../data/lugares'

interface Props {
  cidades: Cidade[] | null
  onEscolher: (cidade: Cidade) => void
}

/** Campo "procure sua cidade" com lista de sugestões (combobox acessível). */
export function BuscaCidade({ cidades, onEscolher }: Props) {
  const id = useId()
  const [texto, setTexto] = useState('')
  const [aberta, setAberta] = useState(false)
  const [ativa, setAtiva] = useState(0)
  const sugestoes = useMemo(() => (cidades ? buscarCidades(cidades, texto) : []), [cidades, texto])
  const mostrar = aberta && texto.trim() !== ''

  const escolher = (c: Cidade) => {
    onEscolher(c)
    setTexto('')
    setAberta(false)
  }

  return (
    <div className="relative">
      <label htmlFor={`${id}-campo`} className="rotulo mb-2 block">
        Ou procure uma cidade
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-3"
          aria-hidden="true"
        />
        <input
          id={`${id}-campo`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={mostrar}
          aria-controls={`${id}-lista`}
          aria-activedescendant={mostrar && sugestoes[ativa] ? `${id}-${ativa}` : undefined}
          disabled={!cidades}
          placeholder={cidades ? 'Digite o nome da cidade' : 'Carregando cidades…'}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setAtiva(0)
            setAberta(true)
          }}
          onFocus={() => setAberta(true)}
          onBlur={() => setAberta(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const passo = e.key === 'ArrowDown' ? 1 : -1
              setAtiva((i) => (i + passo + sugestoes.length) % Math.max(1, sugestoes.length))
              setAberta(true)
            } else if (e.key === 'Enter' && mostrar && sugestoes[ativa]) {
              e.preventDefault()
              escolher(sugestoes[ativa])
            } else if (e.key === 'Escape') {
              setAberta(false)
            }
          }}
          className="min-h-[44px] w-full rounded-2xl border border-linha bg-superficie pl-10 pr-4 text-sm font-semibold text-tinta placeholder:font-normal placeholder:text-tinta-3 focus:outline-none focus:ring-2 focus:ring-cat-1 disabled:opacity-60"
        />
      </div>

      {mostrar && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label="Cidades encontradas"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-linha bg-superficie p-1 shadow-xl"
        >
          {sugestoes.length === 0 ? (
            <li className="px-3 py-3 text-sm text-tinta-2">Nenhuma cidade com esse nome.</li>
          ) : (
            sugestoes.map((c, i) => (
              <li
                key={c.codigo}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === ativa}
                // mousedown: escolhe antes do blur do campo fechar a lista
                onMouseDown={(e) => {
                  e.preventDefault()
                  escolher(c)
                }}
                onMouseEnter={() => setAtiva(i)}
                className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl px-3 text-sm ${
                  i === ativa ? 'bg-superficie-2 text-tinta' : 'text-tinta-2'
                }`}
              >
                <span className="truncate font-semibold">
                  {c.nome}
                  {c.capital && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-bold text-tinta-3">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      capital
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-bold text-tinta-3">
                  {siglaDoLugar(c.uf)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
