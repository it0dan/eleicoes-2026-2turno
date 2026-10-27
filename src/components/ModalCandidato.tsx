import { useState, useEffect } from 'react'
import { useModal } from '../hooks/useModal'
import { EXTERIOR, siglaDoLugar } from '../data/lugares'
import { numero } from '../lib/formato'
import { createPortal } from 'react-dom'
import {
  X,
  Users,
  Award,
  FileText,
  Calendar,
  MapPin,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react'
import { CANDIDATOS_DETALHES_2T, CandidatoDetalhes } from '../data/candidatos'

interface ModalCandidatoProps {
  candidatoId: string | null
  aberto: boolean
  onFechar: () => void
}

export function ModalCandidato({ candidatoId, aberto, onFechar }: ModalCandidatoProps) {
  const [activeId, setActiveId] = useState<string>('cand-1')
  const caixa = useModal(aberto, onFechar)

  useEffect(() => {
    if (candidatoId) {
      setActiveId(candidatoId)
    }
  }, [candidatoId])

  if (!aberto) return null

  const candidato: CandidatoDetalhes =
    CANDIDATOS_DETALHES_2T[activeId] || CANDIDATOS_DETALHES_2T['cand-1']
  const isLula = candidato.id === 'cand-1'

  // Portal: as seções animadas usam transform, que prenderia o "fixed" dentro delas.
  return createPortal(
    <div
      onClick={onFechar}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in cursor-pointer"
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da candidatura: ${candidato.nomeUrna}`}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-superficie border border-linha rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-superficie backdrop-blur-md border-b border-linha p-3 sm:p-5 flex items-center justify-between gap-2">
          {/* Candidate Switcher Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-superficie-2 rounded-xl border border-linha min-w-0">
            <button
              onClick={() => setActiveId('cand-1')}
              className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 ${
                activeId === 'cand-1'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-tinta-3 hover:text-tinta'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block shrink-0" />
              <span className="hidden sm:inline">13 • Lula (PT)</span>
              <span className="sm:hidden">13 • Lula</span>
            </button>

            <button
              onClick={() => setActiveId('cand-2')}
              className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 ${
                activeId === 'cand-2'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-tinta-3 hover:text-tinta'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block shrink-0" />
              <span className="hidden sm:inline">22 • Flávio Bolsonaro (PL)</span>
              <span className="sm:hidden">22 • Flávio</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onFechar}
            className="p-1.5 sm:p-2 rounded-xl text-tinta-3 hover:text-tinta bg-superficie-2 hover:bg-superficie-2 border border-linha transition shrink-0"
            aria-label="Fechar detalhes"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          tabIndex={0}
          aria-label="Detalhes do candidato"
          className="p-4 sm:p-6 space-y-6 overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-cat-1"
        >
          {/* Main Candidate Showcase */}
          <div className="bg-superficie-2 border border-linha rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Background Accent Glow */}
            <div
              className="absolute -right-20 -top-20 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: candidato.cor }}
            />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
              {/* Ultra HD Candidate Photo (Square 1:1 crisp portrait) */}
              <div className="relative shrink-0">
                <img
                  src={candidato.foto}
                  alt={candidato.nomeUrna}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover object-center border-2 shadow-2xl bg-superficie ring-2 ring-linha"
                  style={{ borderColor: candidato.cor }}
                />
                <span
                  className="absolute -bottom-2 -right-2 text-xs font-black text-white px-2.5 py-1 rounded-lg shadow-lg border border-white/20"
                  style={{ backgroundColor: candidato.cor }}
                >
                  Nº {candidato.numero}
                </span>
              </div>

              {/* Identity & Status */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-tinta tracking-tight">
                    {candidato.nomeCompleto}
                  </h2>
                  {isLula ? (
                    <span className="flex items-center gap-1 text-xs font-black bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      ELEITO PRESIDENTE • 2º TURNO
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-superficie-2 text-tinta-2 px-2 py-0.5 rounded-full border border-linha">
                      2º LUGAR
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-tinta-2">
                  Nome na urna:{' '}
                  <span className="text-tinta font-extrabold">{candidato.nomeUrna}</span> •{' '}
                  {candidato.partido} ({candidato.siglaPartido})
                </p>

                <p className="text-xs text-tinta-3">
                  <span className="font-semibold text-tinta-2">Coligação:</span>{' '}
                  {candidato.coligacao}
                </p>

                {/* Metadata Pills */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-tinta-2">
                  <div className="bg-superficie-2/60 border border-linha rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-tinta-3" />
                    <span>Nascimento: {candidato.dataNascimento}</span>
                  </div>
                  <div className="bg-superficie-2/60 border border-linha rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-tinta-3" />
                    <span>Origem: {candidato.naturalidade}</span>
                  </div>
                  <div className="bg-superficie-2/60 border border-linha rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-tinta-3" />
                    <span>Profissão: {candidato.profissao}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vice-President Showcase */}
          <div className="bg-superficie-2 border border-linha rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-tinta-3" />
              <h3 className="text-xs font-bold text-tinta-2 uppercase tracking-wider">
                Candidato a vice-presidente
              </h3>
            </div>

            <div className="bg-superficie border border-linha rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={candidato.fotoVice}
                alt={candidato.nomeVice}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-center border-2 border-linha shadow-md bg-superficie-2 shrink-0 ring-1 ring-linha"
              />
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h4 className="text-base font-extrabold text-tinta">{candidato.nomeVice}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-superficie-2 border border-linha text-tinta-2">
                    {candidato.partidoVice}
                  </span>
                </div>
                <p className="text-xs text-tinta-2">{candidato.cargoVice}</p>
                <p className="text-[11px] text-tinta-3 italic">
                  Faz parte da chapa registrada no TSE.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo Biográfico & Trajetória */}
          <div className="bg-superficie-2 border border-linha rounded-2xl p-4 sm:p-5 shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-tinta-3" />
              <h3 className="text-xs font-bold text-tinta-2 uppercase tracking-wider">Quem é</h3>
            </div>
            <p className="text-xs sm:text-sm text-tinta-2 leading-relaxed pt-1">
              {candidato.resumoBiografico}
            </p>
          </div>

          {/* Principais Eixos de Propostas de Governo */}
          <div className="bg-superficie-2 border border-linha rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-tinta-3" />
              <h3 className="text-xs font-bold text-tinta-2 uppercase tracking-wider">
                O que propõe
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {candidato.propostas.map((prop, idx) => (
                <div
                  key={idx}
                  className="bg-superficie border border-linha rounded-xl p-3.5 space-y-1 hover:border-linha transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: candidato.cor }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-tinta-3">
                      {prop.eixo}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-tinta">{prop.titulo}</h4>
                  <p className="text-[11px] text-tinta-3 leading-relaxed">{prop.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estatísticas Oficiais na Eleição 6258 */}
          <div className="bg-superficie-2 border border-linha rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-tinta-3" />
              <h3 className="text-xs font-bold text-tinta-2 uppercase tracking-wider">
                Votos que recebeu
              </h3>
            </div>

            <div className="bg-superficie border border-linha rounded-xl p-3">
              <div className="text-xs text-tinta-3 uppercase font-semibold">
                Total de votos (resultado final)
              </div>
              <div className="text-lg font-black text-tinta mt-0.5">
                {numero(candidato.estatisticas.votosTotal)}
              </div>
              <div className="text-xs font-bold" style={{ color: candidato.cor }}>
                {candidato.estatisticas.percentualTotal}% dos válidos
              </div>
            </div>

            {/* States Won */}
            <div className="bg-superficie-2/60 border border-linha rounded-xl p-3 space-y-1.5">
              <div className="text-[11px] font-semibold text-tinta-2 flex items-center justify-between">
                <span>
                  Onde ganhou: {candidato.estatisticas.totalEstadosVencidos} estados
                  {candidato.estatisticas.estadosVencidos.includes(EXTERIOR) && ' e o exterior'}
                </span>
                <span className="text-xs text-tinta-3 font-normal">
                  Mais da metade dos votos válidos
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {candidato.estatisticas.estadosVencidos.map((uf) => (
                  <span
                    key={uf}
                    className="px-2 py-0.5 text-xs font-black rounded-md text-white shadow-sm"
                    style={{ backgroundColor: candidato.cor }}
                  >
                    {siglaDoLugar(uf)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-superficie border-t border-linha p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-tinta-3">
            <ShieldCheck className="w-4 h-4 text-destaque" />
            <span>Dados oficiais do TSE</span>
          </div>

          <button
            onClick={onFechar}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-superficie-2 hover:bg-superficie-2 text-tinta transition shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
