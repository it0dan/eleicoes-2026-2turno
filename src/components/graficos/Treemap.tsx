import { useMemo, useState } from 'react'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import { motion, useReducedMotion } from 'framer-motion'
import { numero as fmt } from '../../lib/formato'

export interface Bloco {
  chave: string
  nome: string
  /** rótulo para blocos pequenos (ex.: sigla do estado) */
  curto?: string
  /** tamanho do bloco */
  valor: number
  cor: string
  /** linhas da dica */
  detalhes: string[]
}

const W = 600
const H = 360
const PX_POR_LETRA = 7.5

/** Nome inteiro se couber; senão o rótulo curto; senão o nome cortado com reticências. */
function rotuloQueCabe(b: Bloco, largura: number): string {
  const cabe = (t: string) => t.length * PX_POR_LETRA <= largura - 8
  if (cabe(b.nome)) return b.nome
  if (b.curto && cabe(b.curto)) return b.curto
  return b.nome.slice(0, Math.max(2, Math.floor((largura - 8) / PX_POR_LETRA) - 1)) + '…'
}

/** Retângulos proporcionais ao tamanho (ex.: eleitores), pintados pela cor do lugar. Tocar seleciona. */
export function Treemap({
  blocos,
  onSelecionar,
  unidade
}: {
  blocos: Bloco[]
  onSelecionar?: (chave: string) => void
  unidade: string
}) {
  const reduzir = useReducedMotion()
  const [ativo, setAtivo] = useState<string | null>(null)
  const folhas = useMemo(() => {
    const raiz = hierarchy<{ filhos?: Bloco[] } & Partial<Bloco>>(
      { filhos: blocos },
      (d) => d.filhos
    )
      .sum((d) => d.valor ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    return treemap<{ filhos?: Bloco[] } & Partial<Bloco>>()
      .tile(treemapSquarify)
      .size([W, H])
      .paddingInner(2)(raiz)
      .leaves()
  }, [blocos])
  const foco = folhas.find((f) => (f.data as Bloco).chave === ativo)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        {folhas.map((f, i) => {
          const b = f.data as Bloco
          const w = f.x1 - f.x0
          const h = f.y1 - f.y0
          const cabe = w > 44 && h > 22
          return (
            <motion.g
              key={b.chave}
              initial={reduzir ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduzir ? 0 : 0.4,
                delay: reduzir ? 0 : Math.min(i, 30) * 0.02
              }}
              onMouseEnter={() => setAtivo(b.chave)}
              onMouseLeave={() => setAtivo(null)}
              onClick={() => onSelecionar?.(b.chave)}
              style={{ cursor: onSelecionar ? 'pointer' : 'default' }}
            >
              <rect
                x={f.x0}
                y={f.y0}
                width={w}
                height={h}
                rx={Math.min(4, w / 4, h / 4)}
                fill={b.cor}
                stroke={ativo === b.chave ? 'rgb(var(--tinta))' : 'none'}
                strokeWidth={2}
              />
              {cabe && (
                <text
                  x={f.x0 + 6}
                  y={f.y0 + 15}
                  fontSize={Math.min(13, Math.max(9, w / 8))}
                  fontWeight={800}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeOpacity={0.45}
                  paintOrder="stroke"
                >
                  {rotuloQueCabe(b, w)}
                </text>
              )}
            </motion.g>
          )
        })}
      </svg>
      {foco && (
        // Dica logo acima do bloco (ou abaixo, se o bloco está no alto)
        <div
          role="status"
          className={`pointer-events-none absolute z-20 w-max max-w-[16rem] -translate-x-1/2 rounded-xl border border-linha bg-superficie px-3 py-2 text-xs text-tinta shadow-xl ${
            foco.y0 < H * 0.3 ? '' : '-translate-y-full'
          }`}
          style={{
            left: `${Math.min(85, Math.max(15, ((foco.x0 + foco.x1) / 2 / W) * 100))}%`,
            top: `${((foco.y0 < H * 0.3 ? foco.y1 + 6 : foco.y0 - 6) / H) * 100}%`
          }}
        >
          <span className="block font-bold">{(foco.data as Bloco).nome}</span>
          <span className="block">
            {fmt((foco.data as Bloco).valor)} {unidade}
          </span>
          {(foco.data as Bloco).detalhes.map((d) => (
            <span key={d} className="block text-tinta-3">
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
