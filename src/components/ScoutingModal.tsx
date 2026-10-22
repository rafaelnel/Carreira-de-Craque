import React, { useState, useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  DollarSign,
  Globe,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  UserCheck,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import {
  GameState,
  ScoutingFocus,
  ScoutingReportResult,
  TransferOffer,
} from '../types/game';
import {
  calculateScoutingProbability,
  executeScoutingSearch,
} from '../utils/simulation';
import { playTacticalClick, playWhistle, playBallKick } from '../utils/audio';

interface ScoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onScoutingCompleted: (updatedState: GameState, report: ScoutingReportResult) => void;
  onAcceptTransfer?: (offer: TransferOffer) => void;
}

export const ScoutingModal: React.FC<ScoutingModalProps> = ({
  isOpen,
  onClose,
  state,
  onScoutingCompleted,
  onAcceptTransfer,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<ScoutingFocus>('HIGHER_TIER');
  const [activeReport, setActiveReport] = useState<ScoutingReportResult | null>(
    state.lastScoutingReport || null
  );
  const [isSearching, setIsSearching] = useState(false);

  const { player, currentClub, trainingDoneThisWeek } = state;

  const breakdown = useMemo(() => {
    return calculateScoutingProbability(player, currentClub, selectedFocus);
  }, [player, currentClub, selectedFocus]);

  if (!isOpen) return null;

  const handleStartScouting = () => {
    if (trainingDoneThisWeek) return;

    playTacticalClick();
    setIsSearching(true);

    setTimeout(() => {
      const { updatedState, report } = executeScoutingSearch(state, selectedFocus);
      setIsSearching(false);
      setActiveReport(report);
      onScoutingCompleted(updatedState, report);

      if (report.success) {
        playWhistle('short');
      } else {
        playBallKick();
      }
    }, 700);
  };

  const focusOptions: {
    id: ScoutingFocus;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    tag: string;
  }[] = [
    {
      id: 'HIGHER_TIER',
      title: 'Subir de Divisão',
      subtitle: 'Sondar clubes de patamar superior (ex: Série B → Série A ou Elite)',
      icon: TrendingUp,
      accentColor: '#3b82f6',
      tag: 'SALTO NA CARREIRA',
    },
    {
      id: 'BETTER_WAGE',
      title: 'Melhor Salário',
      subtitle: 'Buscar clubes de maior orçamento dispostos a valorizar vencimentos (+50%)',
      icon: DollarSign,
      accentColor: '#10b981',
      tag: 'VALORIZAÇÃO',
    },
    {
      id: 'SIMILAR_TIER_ROLE',
      title: 'Garantia de Titularidade',
      subtitle: 'Mesma divisão com promessa contratual de titularidade imediata',
      icon: UserCheck,
      accentColor: '#f59e0b',
      tag: 'MAIS MINUTOS',
    },
    {
      id: 'EUROPE_GLOBAL',
      title: 'Radar Europeu / Exterior',
      subtitle: 'Atrair scouts das 5 grandes ligas europeias com contratos em euros',
      icon: Globe,
      accentColor: '#8b5cf6',
      tag: 'INTERNACIONAL',
    },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#FBFBFA] border-[2.5px] border-black rounded-[28px] shadow-brutal-lg overflow-hidden flex flex-col max-h-[92vh] justify-between text-black">
        {/* Top Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b-[2px] border-black bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFCC00] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Compass className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-[10px] uppercase font-mono text-stone-600 block leading-tight">
                MERCADO & BASTIDORES
              </span>
              <h2 className="font-black text-sm uppercase text-black leading-tight">
                SONDAGEM DE MERCADO (SCOUTING)
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playTacticalClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-white hover:bg-stone-100 shadow-brutal-sm transition-all"
            title="Fechar"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar space-y-3.5">
          {/* Active Report Banner if just completed */}
          {activeReport && (
            <div
              className={`p-3.5 rounded-2xl border-2 border-black shadow-brutal-sm ${
                activeReport.success ? 'bg-emerald-50 border-emerald-900' : 'bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-black/20 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  {activeReport.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-black text-xs uppercase font-mono text-black">
                      {activeReport.success ? 'SONDAGEM COM SUCESSO' : 'FEEDBACK DOS OLHEIROS'}
                    </span>
                    <div className="text-[10px] font-mono text-stone-600">
                      Semana {activeReport.scoutedAtWeek} · Chance: {activeReport.probability}%
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-white border border-black">
                  +{activeReport.hypeGained} HYPE
                </span>
              </div>

              <p className="text-xs font-medium text-stone-800 leading-snug">
                {activeReport.feedbackMessage}
              </p>

              {/* Display generated offers */}
              {activeReport.offersFound && activeReport.offersFound.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-[10px] font-mono font-black uppercase text-emerald-800 block">
                    PROPOSTA(S) RECEBIDA(S):
                  </span>
                  {activeReport.offersFound.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-2.5 rounded-xl border-2 border-black bg-[#FFCC00] flex items-center justify-between gap-2 shadow-brutal-sm"
                    >
                      <div>
                        <div className="font-black text-xs uppercase text-black">
                          {offer.club.name} (Tier {offer.club.tier})
                        </div>
                        <div className="text-[10px] font-mono font-bold text-stone-900">
                          {formatCurrency(offer.wageWeekly)}/sem · {offer.promisedRole}
                        </div>
                      </div>

                      {onAcceptTransfer && (
                        <button
                          type="button"
                          onClick={() => {
                            playWhistle('short');
                            onAcceptTransfer(offer);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-[#FFCC00] font-black text-[10px] uppercase shadow-brutal-sm hover:bg-stone-800 shrink-0"
                        >
                          ASSINAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Explanation & Rules */}
          <div className="p-3 rounded-2xl bg-white border-2 border-black shadow-brutal-sm space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#FFCC00] fill-current" />
              <span>COMO FUNCIONA O SCOUTING SEMANAL</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
              Seu empresário dedica a semana inteira a <strong>reuniões presenciais e sondagens diretas com diretores de futebol</strong>. Isso consome a cota de treino da semana (-6% energia, +50 Hype), mas gera propostas concretas de transferência com base na sua probabilidade real de mercado.
            </p>
          </div>

          {/* Focus Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-xs uppercase text-black">
                1. ESCOLHA O FOCO DA SONDAGEM
              </span>
              <span className="text-[10px] font-mono text-stone-500 font-bold">4 OPÇÕES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {focusOptions.map((opt) => {
                const isSelected = selectedFocus === opt.id;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      playTacticalClick();
                      setSelectedFocus(opt.id);
                    }}
                    className={`p-2.5 rounded-2xl border-2 border-black text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-[#FFCC00] shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-stone-50 shadow-brutal-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="w-7 h-7 rounded-lg border border-black bg-white flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-black" />
                      </div>
                      <span className="text-[8.5px] font-mono font-black px-1.5 py-0.2 rounded bg-black text-[#FFCC00]">
                        {opt.tag}
                      </span>
                    </div>

                    <div>
                      <div className="font-black text-xs uppercase text-black leading-tight">
                        {opt.title}
                      </div>
                      <div className="text-[9.5px] text-stone-700 font-medium leading-snug mt-0.5">
                        {opt.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Probability Layer & Factor Breakdown */}
          <div className="p-3.5 rounded-2xl bg-white border-2 border-black shadow-brutal-sm space-y-2.5">
            <div className="flex items-center justify-between font-mono">
              <span className="font-black text-xs uppercase text-black">
                2. PROBABILIDADE ESTIMADA
              </span>
              <span className="text-base font-black px-2 py-0.5 rounded-lg border border-black bg-[#FFCC00] text-black">
                {breakdown.probability}%
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full h-3 rounded-full border border-black bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${breakdown.probability}%` }}
              />
            </div>

            {/* Factor breakdown chips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase text-stone-500 block">
                FATORES DE MERCADO AVALIADOS:
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-0.5">
                {breakdown.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[10px] font-mono p-1 rounded bg-[#FBFBFA] border border-stone-300"
                  >
                    <span className="truncate pr-1 text-stone-800">{f.label}</span>
                    <span
                      className={`font-black shrink-0 ${
                        f.positive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {f.positive ? `+${f.delta}%` : `${f.delta}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning if training already consumed */}
          {trainingDoneThisWeek && (
            <div className="p-2.5 rounded-xl border-2 border-black bg-amber-100 flex items-center gap-2 font-mono text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Você já realizou o treino ou sondagem desta semana. Avance para a rodada de jogos para liberar nova sondagem!
              </span>
            </div>
          )}
        </div>

        {/* Bottom CTA Button */}
        <div className="p-4 pt-2.5 bg-white border-t-[2px] border-black space-y-2 shrink-0">
          <button
            type="button"
            disabled={trainingDoneThisWeek || isSearching}
            onClick={handleStartScouting}
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-[2.5px] border-black shadow-brutal text-black font-black text-xs uppercase tracking-wide transition-all ${
              trainingDoneThisWeek
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none border-stone-400'
                : 'bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[2px] active:translate-y-[2px]'
            }`}
          >
            <span>
              {isSearching
                ? 'AGENTE EM REUNIÃO COM CLUBES...'
                : trainingDoneThisWeek
                ? 'TREINO DA SEMANA JÁ CONCLUÍDO'
                : `SONDAR MERCADO (${breakdown.probability}% CHANCE)`}
            </span>
            <div className="w-7 h-7 rounded-lg border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>

          <div className="w-full h-2 rounded-full border border-black bg-hazard-stripes" />
        </div>
      </div>
    </div>
  );
};
