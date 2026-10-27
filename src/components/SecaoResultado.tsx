import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, ChevronRight, MapPin, Globe2, Info } from 'lucide-react'
import { Cenario, ResultadoPainel } from '../services/resultados'
import { Secao } from './ui/Secao'
import { ControleSegmentado } from './ui/ControleSegmentado'
import { BarraConfronto } from './graficos/BarraConfronto'
import { ModalCandidato } from './ModalCandidato'
import { numero as num } from '../lib/formato'
import { coresDo, nomeCurto } from '../lib/candidatos'

interface Props {
  resultado: ResultadoPainel
  cenario: Cenario
  onCenario: (c: Cenario) => void
  nivel: 'Brasil' | 'Região' | 'Estado' | 'Cidade'
}

export function SecaoResultado({ resultado, cenario, onCenario, nivel }: Props) {
  const [candidatoAberto, setCandidatoAberto] = useState<string | null>(null)
  const [lula, flavio] = resultado.candidatos
  const lider = lula.votos >= flavio.votos ? lula : flavio
  const diferenca = Math.abs(lula.votos - flavio.votos)
  const IconeLocal = nivel === 'Cidade' ? Building2 : nivel === 'Estado' ? MapPin : Globe2

  return (
    <Secao id="resultado" className="overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-2 px-3 py-1 text-xs font-bold text-tinta-2">
              <IconeLocal className="h-3.5 w-3.5" aria-hidden="true" />
              {nivel}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                cenario === 'com_prorrogacao'
                  ? 'bg-destaque/15 text-tinta'
                  : 'bg-cat-3/15 text-tinta'
              }`}
            >
              {cenario === 'com_prorrogacao'
                ? 'Com prorrogação (oficial)'
                : 'Sem prorrogação (até 17h)'}
            </span>
          </div>
          {/* A key troca a cada lugar/cenário: o texto novo entra na hora, com um fade curto (sem esperar saída). */}
          <motion.div
            key={resultado.titulo + resultado.subtitulo}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-tinta">
              {resultado.titulo}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-tinta-2">{resultado.subtitulo}</p>
          </motion.div>
          {resultado.nota && (
            <p role="note" className="mt-2 flex items-start gap-1.5 text-sm text-tinta-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cat-3" aria-hidden="true" />
              {resultado.nota}
            </p>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-[26rem]">
          <ControleSegmentado
            rotuloGrupo="Escolha o cenário"
            valor={cenario}
            onChange={onCenario}
            className="w-full"
            opcoes={[
              { valor: 'com_prorrogacao', rotulo: 'Com prorrogação', cor: 'bg-destaque' },
              { valor: 'sem_prorrogacao', rotulo: 'Sem prorrogação', cor: 'bg-cat-3' }
            ]}
          />
          <p className="mt-2 text-xs text-tinta-2 sm:text-sm">
            {cenario === 'com_prorrogacao'
              ? 'Com prorrogação: o resultado oficial, com todos os votos. Toque em “Sem prorrogação” para ver como seria só até as 17h.'
              : 'Sem prorrogação: só os votos dados até as 17h, como se a votação tivesse fechado na hora certa.'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BarraConfronto
          lula={{ nome: 'Lula', votos: lula.votos, percentual: lula.percentual }}
          flavio={{ nome: 'Flávio Bolsonaro', votos: flavio.votos, percentual: flavio.percentual }}
        />
        <p className="mt-4 text-center text-base sm:text-lg font-bold text-tinta">
          {nomeCurto(lider)} na frente por <span className="text-destaque">{num(diferenca)}</span>{' '}
          votos
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[lula, flavio].map((c) => (
          <motion.button
            key={c.id}
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCandidatoAberto(c.id)}
            className="group flex items-center gap-4 rounded-2xl border border-linha bg-superficie-2/60 p-3 text-left transition hover:shadow-lg"
          >
            <span className="relative shrink-0">
              <img
                src={c.foto}
                alt={c.nome}
                className={`h-16 w-16 rounded-2xl object-cover ring-2 ${coresDo(c).anel}`}
              />
              <span
                className={`absolute -bottom-1.5 -right-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold text-white ${coresDo(c).selo}`}
              >
                {c.numero}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm sm:text-base font-extrabold leading-tight text-tinta">
                {c.nome}
              </span>
              <span className="block text-xs text-tinta-2">
                Vice: {c.nomeVice} · {c.partido}
              </span>
              {c.eleito && (
                <span className="mt-1 inline-block rounded-full bg-destaque/15 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-tinta">
                  Eleito presidente
                </span>
              )}
            </span>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-tinta-3 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
            <span className="sr-only">Ver mais sobre {c.nome}</span>
          </motion.button>
        ))}
      </div>

      <ModalCandidato
        candidatoId={candidatoAberto}
        aberto={candidatoAberto !== null}
        onFechar={() => setCandidatoAberto(null)}
      />
    </Secao>
  )
}
