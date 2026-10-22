import React from 'react';
import { Trophy, Award, Medal, Crown, Star, RefreshCw, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { PlayerCharacter } from '../types/game';
import { playWhistle, playGoalCheer, playTacticalClick } from '../utils/audio';

interface RetirementModalProps {
  isOpen: boolean;
  player: PlayerCharacter;
  currentSeason: number;
  onRetireNow: () => void;
  onContinueSeason: () => void;
  onStartNewCareer: () => void;
}

export const RetirementModal: React.FC<RetirementModalProps> = ({
  isOpen,
  player,
  currentSeason,
  onRetireNow,
  onContinueSeason,
  onStartNewCareer,
}) => {
  if (!isOpen) return null;

  const isCompulsory = player.age >= 40 || !!player.isRetired;
  const career = player.careerStats;
  const peakOVR = player.peakAbility || player.currentAbility;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-lg bg-[#F7F7F5] border-[3px] border-black rounded-3xl shadow-brutal-lg overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="bg-[#FFCC00] border-b-[2.5px] border-black p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-[#FFCC00] flex items-center justify-center border border-black shadow-brutal-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase font-mono tracking-wider text-black">
                {isCompulsory ? 'APITO FINAL · APOSENTADORIA OFICIAL' : 'DECISÃO DE FIM DE TEMPORADA'}
              </div>
              <h2 className="text-sm sm:text-base font-black uppercase text-black leading-none mt-0.5">
                {isCompulsory ? 'MEMORIAL & HALL DA FAMA' : `${player.name} · ${player.age} ANOS`}
              </h2>
            </div>
          </div>

          <span className="font-mono font-black text-xs px-2 py-1 bg-black text-[#FFCC00] rounded-lg border border-black shadow-brutal-sm">
            {player.age} ANOS
          </span>
        </div>

        {/* Modal Body with internal scroll */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 font-mono flex-1 text-black">
          {isCompulsory ? (
            /* COMPULSORY RETIREMENT AT 40 OR CONFIRMED RETIREMENT */
            <>
              {/* Solemn tribute banner */}
              <div className="p-3 rounded-2xl bg-black text-[#FFCC00] border-2 border-black text-center space-y-1 shadow-brutal-sm">
                <Crown className="w-6 h-6 mx-auto text-[#FFCC00]" />
                <div className="text-xs font-black uppercase tracking-wide">
                  CARREIRA CONSAGRADA NOS GRAMADOS
                </div>
                <p className="text-[11px] text-stone-300 font-medium leading-relaxed max-w-sm mx-auto">
                  Aos {player.age} anos, você encerra oficialmente sua trajetória como atleta profissional. Um legado construído com dedicação, gols e respeito no vestiário.
                </p>
              </div>

              {/* Career Ledger Numbers */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">JOGOS</div>
                  <div className="text-base font-black text-black">{career.totalMatches}</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">GOLS</div>
                  <div className="text-base font-black text-black">{career.totalGoals}</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">ASSIST</div>
                  <div className="text-base font-black text-black">{career.totalAssists}</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">MÉDIA NOTA</div>
                  <div className="text-base font-black text-black">{career.avgRating > 0 ? career.avgRating.toFixed(1) : '-'}</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-[#FFCC00] shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-black">AUGE (PEAK)</div>
                  <div className="text-base font-black text-black">{peakOVR} OVR</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">TEMPORADAS</div>
                  <div className="text-base font-black text-black">{player.history.length + 1}</div>
                </div>
              </div>

              {/* History highlights */}
              <div className="p-3 rounded-2xl bg-white border-2 border-black shadow-brutal-sm space-y-1.5 text-xs">
                <div className="font-black uppercase text-[10px] text-stone-600 border-b border-black pb-1">
                  HISTÓRICO DE CLUBES DEFENDIDOS
                </div>
                <div className="space-y-1 text-[11px] max-h-32 overflow-y-auto pr-1">
                  {player.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-stone-200">
                      <span>T{h.seasonNumber} · {h.clubName} ({h.leagueName})</span>
                      <span className="font-black">{h.matchesPlayed}j · {h.goals}g · {h.averageRating.toFixed(1)} ★</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* VOLUNTARY RETIREMENT DECISION (35 to 39 YEARS) */
            <>
              <div className="p-3 rounded-2xl bg-[#FFCC00]/25 border-2 border-black space-y-1.5 text-xs">
                <div className="font-black text-black uppercase flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  MOMENTO DE DECISÃO NA CARREIRA
                </div>
                <p className="text-[11px] text-stone-700 font-bold leading-relaxed">
                  Você atingiu {player.age} anos. A partir desta faixa etária, você pode optar por se aposentar em alta no fim desta temporada, ou continuar competindo por mais um ano até o limite compulsório de 40 anos.
                </p>
              </div>

              {/* Current stats snapshot */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">OVERALL ATUAL</div>
                  <div className="text-base font-black text-black">{player.currentAbility} OVR</div>
                  <div className="text-[9px] text-stone-500 font-bold">Auge: {peakOVR}</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">JOGOS / GOLS</div>
                  <div className="text-base font-black text-black">{career.totalMatches} / {career.totalGoals}</div>
                  <div className="text-[9px] text-stone-500 font-bold">{career.totalAssists} assist</div>
                </div>

                <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                  <div className="text-[9px] font-black uppercase text-stone-600">CONTRATO</div>
                  <div className="text-base font-black text-black">{player.contract.yearsRemaining} ANOS</div>
                  <div className="text-[9px] text-stone-500 font-bold">{player.contract.clubName}</div>
                </div>
              </div>

              {/* Informative advice */}
              <div className="p-2.5 rounded-xl bg-stone-100 border border-black text-[11px] text-stone-700 leading-snug">
                <strong>CURVA BIOLÓGICA:</strong> Seus atributos físicos declinam naturalmente com a idade, enquanto sua experiência tática sustenta sua tomada de decisão. Aos 40 anos, a aposentadoria será definitiva.
              </div>
            </>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3.5 bg-white border-t-[2.5px] border-black shrink-0 space-y-2">
          {isCompulsory ? (
            <button
              type="button"
              onClick={() => {
                playGoalCheer();
                onStartNewCareer();
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[1px] active:translate-y-[1px] shadow-brutal font-mono font-black text-xs uppercase flex items-center justify-center gap-2 transition-all text-black"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>INICIAR NOVA CARREIRA (PROMESSA DE 18 ANOS)</span>
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              <button
                type="button"
                onClick={() => {
                  playTacticalClick();
                  onRetireNow();
                }}
                className="py-2.5 px-3 rounded-xl border-2 border-black bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-brutal transition-all"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>PENDURAR AS CHUTEIRAS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playWhistle('short');
                  onContinueSeason();
                }}
                className="py-2.5 px-3 rounded-xl border-2 border-black bg-[#FFCC00] hover:bg-[#ffdb33] text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-brutal transition-all"
              >
                <span>JOGAR MAIS 1 TEMPORADA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
