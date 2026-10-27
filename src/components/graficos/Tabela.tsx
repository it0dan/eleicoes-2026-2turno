import { ReactNode } from 'react'

export interface Coluna<T> {
  titulo: string
  valor: (linha: T) => ReactNode
  /** números à direita */
  numero?: boolean
}

/** Tabela simples: a versão em texto de qualquer gráfico (acessível e fácil de conferir). */
export function Tabela<T>({
  colunas,
  linhas,
  chave,
  legenda
}: {
  colunas: Coluna<T>[]
  linhas: T[]
  chave: (linha: T) => string
  legenda?: string
}) {
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-sm">
        {legenda && <caption className="pb-2 text-left text-xs text-tinta-3">{legenda}</caption>}
        <thead className="sticky top-0 bg-superficie">
          <tr className="border-b border-linha text-left text-tinta-3">
            {colunas.map((c) => (
              <th
                key={c.titulo}
                className={`py-2 pr-3 font-semibold ${c.numero ? 'text-right' : ''}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={chave(l)} className="border-b border-linha/60">
              {colunas.map((c, i) => (
                <td
                  key={c.titulo}
                  className={`py-2 pr-3 ${c.numero ? 'text-right text-tinta-2' : ''} ${i === 0 ? 'font-semibold text-tinta' : ''}`}
                >
                  {c.valor(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
