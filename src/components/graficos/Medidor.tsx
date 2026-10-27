import { motion, useReducedMotion } from 'framer-motion'
import { numero } from '../../lib/formato'

interface Props {
  /** 0 a 100 */
  valor: number
  /** cor da parte preenchida e do restante (CSS) */
  cor: string
  corResto?: string
  /** texto grande no centro (padrão: o valor em %) */
  centro?: string
  /** cor do texto do centro (padrão: cor do texto) */
  corCentro?: string
  /** nome abaixo do número do centro, para dizer de quem é (ex.: "Lula") */
  nomeCentro?: string
  rotulo: string
  /** marca da metade (50%): quem passa dela venceu */
  metade?: boolean
  /** legenda das duas partes, quando o restante também tem significado (ex.: Flávio) */
  partes?: [string, string]
}

const R = 80
const ARCO = `M ${100 - R} 100 A ${R} ${R} 0 0 1 ${100 + R} 100`

/** Meio círculo que enche até o valor: bom para "quanto de 100%". */
export function Medidor({
  valor,
  cor,
  corResto,
  centro,
  corCentro,
  nomeCentro,
  rotulo,
  metade,
  partes
}: Props) {
  const reduzir = useReducedMotion()
  const v = Math.max(0, Math.min(100, valor))
  const textoCentro = centro ?? `${numero(v, 1)}%`
  return (
    <figure className="mx-auto w-full max-w-[280px]">
      <svg
        viewBox="0 0 200 112"
        className="w-full"
        role="img"
        aria-label={`${rotulo}: ${nomeCentro ? `${nomeCentro} ` : ''}${textoCentro}`}
      >
        <path
          d={ARCO}
          fill="none"
          stroke={corResto ?? 'rgb(var(--superficie-2))'}
          strokeWidth={22}
          strokeLinecap="butt"
        />
        <motion.path
          d={ARCO}
          fill="none"
          stroke={cor}
          strokeWidth={22}
          pathLength={1}
          initial={reduzir ? false : { pathLength: 0 }}
          whileInView={{ pathLength: v / 100 }}
          viewport={{ once: true }}
          transition={{ duration: reduzir ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
        {metade && (
          <line
            x1={100}
            y1={100 - R - 16}
            x2={100}
            y2={100 - R + 16}
            stroke="rgb(var(--tinta))"
            strokeWidth={2.5}
          />
        )}
        <text
          x={100}
          y={nomeCentro ? 78 : 88}
          textAnchor="middle"
          fontSize={26}
          fontWeight={800}
          fill={corCentro ?? 'rgb(var(--tinta))'}
        >
          {textoCentro}
        </text>
        {nomeCentro && (
          <text
            x={100}
            y={98}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill={corCentro ?? 'rgb(var(--tinta))'}
          >
            {nomeCentro}
          </text>
        )}
      </svg>
      <figcaption className="mt-1 text-center text-sm font-semibold text-tinta-2">
        {rotulo}
      </figcaption>
      {partes && (
        <div
          className="mt-2 flex justify-center gap-4 text-xs font-semibold text-tinta-2"
          aria-hidden="true"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
            {partes[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: corResto }} />
            {partes[1]}
          </span>
          {metade && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[2px] bg-tinta" />
              metade
            </span>
          )}
        </div>
      )}
    </figure>
  )
}
