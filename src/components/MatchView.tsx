import React, { useState } from 'react';
import {
  Play,
  FastForward,
  Calendar,
  Award,
  TrendingUp,
  Activity,
  Shield,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { BatchSimulationResult, GameState, SquadRoleStatus } from '../types/game';
import { simulateFastBatch } from '../utils/simulation';
import { playBallKick, playGoalCheer, playTacticalClick, playWhistle } from '../utils/audio';

interface MatchViewProps {
  state: GameState;
  playerStatus: SquadRoleStatus;
  onFinishMatch: (updatedState: Partial<GameState>) => void;
  onNavigate: (screen: GameState['screen']) => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  state,
  playerStatus,
  onFinishMatch,
  onNavigate,
}) => {
  const { player, currentClub, currentMatch, fixtures, currentWeek, totalWeeksInSeason } = state;

  const [latestBatchResult, setLatestBatchResult] = useState<BatchSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const getRoleLabel = (status: SquadRoleStatus) => {
    switch (status) {
      case 'TITULAR_ABSOLUTO':
        return { label: 'Titular Absoluto (90 min)', bg: 'bg-[#FFCC00]' };
      case 'TITULAR_ROTATIVO':
        return { label: 'Titular Rotativo (~65 min)', bg: 'bg-sky-200' };
      case 'RESERVA':
        return { label: 'Banco de Reservas (~25 min)', bg: 'bg-amber-100' };
      case 'NAO_RELACIONADO':
        return { label: 'Não Relacionado (0 min)', bg: 'bg-rose-200' };
    }
  };

  const roleInfo = getRoleLabel(playerStatus);

  // Fast simulation runner
  const handleSimulate = (mode: '1_MATCH' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'SEASON') => {
    playTacticalClick();
    setIsSimulating(true);

    // Run synchronous fast simulation
    const { updatedState, batchResult } = simulateFastBatch(state, mode);

    if (batchResult.playerGoals > 0) {
      playGoalCheer();
    } else {
      playWhistle('final');
    }

    setLatestBatchResult(batchResult);
    setIsSimulating(false);

    // Update parent state
    onFinishMatch(updatedState);
  };

  const isHome = currentMatch?.homeClub.id === currentClub.id;
  const opponentClub = currentMatch ? (isHome ? currentMatch.awayClub : currentMatch.homeClub) : null;

  return (
    <div className="h-full w-full p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2">
      {/* Top Banner (Static) */}
      <div className="p-3 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono">
            PILAR 4 · SIMULAÇÃO RÁPIDA DE PARTIDAS
          </div>
          <h1 className="text-sm sm:text-base font-black uppercase text-black leading-none mt-0.5">
            {currentMatch ? (
              <span>
                {currentMatch.homeClub.shortName} VS {currentMatch.awayClub.shortName}
              </span>
            ) : (
              <span>TEMPORADA CONCLUÍDA</span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span className="px-2 py-1 rounded-lg border-2 border-black bg-[#FFCC00] font-black text-xs shadow-brutal-sm">
            RODADA {currentWeek} / {totalWeeksInSeason}
          </span>
        </div>
      </div>

      {/* Main Interactive Stage (Static Container with internal scroll where appropriate) */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border-[2.5px] border-black shadow-brutal p-2 sm:p-3 flex flex-col justify-between overflow-hidden space-y-2">
        {/* Next Match Context Pill */}
        {currentMatch && opponentClub && (
          <div className="p-2 sm:p-2.5 rounded-xl border-2 border-black bg-[#FBFBFA] flex items-center justify-between gap-2 shrink-0 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border border-black ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
              <span className="font-bold text-stone-600 hidden sm:inline">
                Adversário: <strong>{opponentClub.name}</strong> ({opponentClub.reputation}/100)
              </span>
            </div>

            <div className="flex items-center gap-2 text-right">
              <span className="font-black text-black">{player.currentAbility} OVR</span>
              <span className="text-[10px] text-stone-500 font-bold">FITNESS: {player.state.fitness}%</span>
            </div>
          </div>
        )}

        {/* RESULTS OF LATEST SIMULATION OR UPCOMING FIXTURES */}
        {latestBatchResult ? (
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden space-y-2">
            {/* Batch summary cards */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-center shrink-0">
              <div className="p-1.5 rounded-xl border-2 border-black bg-[#FFCC00] shadow-brutal-sm">
                <div className="text-[9px] font-black uppercase text-black">DESEMPENHO</div>
                <div className="text-xs sm:text-sm font-black text-black">
                  {latestBatchResult.wins}V {latestBatchResult.draws}E {latestBatchResult.losses}D
                </div>
              </div>

              <div className="p-1.5 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                <div className="text-[9px] font-black uppercase text-stone-600">
                  {player.position === 'GK' ? 'DEFESAS' : 'SEUS GOLS'}
                </div>
                <div className="text-xs sm:text-sm font-black text-black">
                  {player.position === 'GK' ? (latestBatchResult.playerSaves || 0) : latestBatchResult.playerGoals}
                </div>
              </div>

              <div className="p-1.5 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                <div className="text-[9px] font-black uppercase text-stone-600">
                  {player.position === 'GK' ? 'JOGOS SG' : 'ASSISTÊNCIAS'}
                </div>
                <div className="text-xs sm:text-sm font-black text-black">
                  {player.position === 'GK' ? (latestBatchResult.playerCleanSheets || 0) : latestBatchResult.playerAssists}
                </div>
              </div>

              <div className="p-1.5 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
                <div className="text-[9px] font-black uppercase text-stone-600">MÉDIA NOTA</div>
                <div className="text-xs sm:text-sm font-black text-black">
                  {latestBatchResult.averageRating > 0 ? `${latestBatchResult.averageRating} ★` : '-'}
                </div>
              </div>
            </div>

            {/* Simulated Matches Log with internal scroll */}
            <div className="flex-1 min-h-0 border-2 border-black rounded-xl p-2 bg-[#FBFBFA] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-black pb-1 mb-1 font-mono text-[10px] font-black shrink-0">
                <span>{latestBatchResult.periodLabel} ({latestBatchResult.matchesSimulated} Jogos)</span>
                <span className="text-stone-500">RELATÓRIO OFICIAL</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {latestBatchResult.matchResults.map((m) => (
                  <div
                    key={`res_w${m.week}`}
                    className={`p-1.5 rounded-lg border border-black flex items-center justify-between gap-1 text-[11px] ${
                      m.isWin
                        ? 'bg-emerald-50 border-emerald-900'
                        : m.homeScore === m.awayScore
                        ? 'bg-amber-50'
                        : 'bg-rose-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-black w-7 text-stone-500 text-[10px]">R{m.week}</span>
                      <span className="font-bold">
                        {m.homeClub} <strong>{m.homeScore} - {m.awayScore}</strong> {m.awayClub}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.minutesPlayed > 0 ? (
                        <>
                          {player.position === 'GK' ? (
                            <>
                              {(m.playerSaves || 0) > 0 && (
                                <span className="bg-amber-200 text-black font-black px-1 rounded text-[9px]">
                                  {m.playerSaves} def
                                </span>
                              )}
                              {((m.homeClub === currentClub.shortName && m.awayScore === 0) ||
                                (m.awayClub === currentClub.shortName && m.homeScore === 0)) && (
                                <span className="bg-emerald-200 text-black font-black px-1 rounded text-[9px]">
                                  SG
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {m.playerGoals > 0 && (
                                <span className="bg-[#FFCC00] text-black font-black px-1 rounded text-[9px]">
                                  {m.playerGoals} {m.playerGoals > 1 ? 'gols' : 'gol'}
                                </span>
                              )}
                              {m.playerAssists > 0 && (
                                <span className="bg-sky-200 text-black font-black px-1 rounded text-[9px]">
                                  {m.playerAssists} ast
                                </span>
                              )}
                            </>
                          )}
                          <span className="font-black text-black">
                            {m.playerRating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-stone-400">Banco</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact strip */}
            <div className="p-2 rounded-xl bg-stone-100 border border-black flex items-center justify-between font-mono text-[10px] shrink-0">
              <div>
                Confiança: <strong>{latestBatchResult.coachTrustChange >= 0 ? `+${latestBatchResult.coachTrustChange}` : latestBatchResult.coachTrustChange}</strong> · Hype: <strong>+{latestBatchResult.hypeGained}</strong>
              </div>
              <div>
                Fadiga Atual: <strong>{latestBatchResult.fitnessCurrent}%</strong>
              </div>
            </div>
          </div>
        ) : (
          /* Welcome state before first simulation */
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden p-2 bg-[#FBFBFA] rounded-xl border-2 border-black">
            <div className="font-mono text-center my-auto space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFCC00] border-2 border-black flex items-center justify-center shadow-brutal-sm">
                <Play className="w-6 h-6 fill-black text-black" />
              </div>
              <h2 className="text-sm font-black uppercase text-black font-mono">
                SIMULAÇÃO RÁPIDA DE PARTIDAS
              </h2>
              <p className="text-xs text-stone-600 max-w-xs mx-auto font-bold leading-relaxed">
                Escolha o período abaixo para simular instantaneamente. Todos os jogos, gols, notas e bônus de treino serão processados matematicamente.
              </p>
            </div>

            {/* Up next preview */}
            <div className="p-2 bg-white rounded-lg border border-black font-mono text-[11px] flex items-center justify-between shrink-0">
              <span>PRÓXIMAS RODADAS DISPONÍVEIS:</span>
              <span className="font-black text-[#15803d]">
                {fixtures.filter((f) => !f.played).length} JOGOS RESTANTES
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FAST SIMULATION ACTION BUTTONS (Static Bottom Panel) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal shrink-0 space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase text-black border-b border-black pb-1">
          <span>ESCOLHA O PERÍODO DE SIMULAÇÃO RÁPIDA</span>
          <span className="text-stone-500">SEM ANIMAÇÃO LONGA</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-mono">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('1_MATCH')}
            className="p-2 rounded-xl border-2 border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase flex flex-col items-center justify-center transition-all"
          >
            <span>1 JOGO</span>
            <span className="text-[9px] font-bold text-stone-700">1 Rodada</span>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('1_MONTH')}
            className="p-2 rounded-xl border-2 border-black bg-white hover:bg-stone-100 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase flex flex-col items-center justify-center transition-all"
          >
            <span>1 MÊS</span>
            <span className="text-[9px] font-bold text-stone-500">~4 Rodadas</span>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('3_MONTHS')}
            className="p-2 rounded-xl border-2 border-black bg-white hover:bg-stone-100 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase flex flex-col items-center justify-center transition-all"
          >
            <span>3 MESES</span>
            <span className="text-[9px] font-bold text-stone-500">~12 Rodadas</span>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('6_MONTHS')}
            className="p-2 rounded-xl border-2 border-black bg-white hover:bg-stone-100 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm text-black font-black text-xs uppercase flex flex-col items-center justify-center transition-all"
          >
            <span>6 MESES</span>
            <span className="text-[9px] font-bold text-stone-500">~24 Rodadas</span>
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleSimulate('SEASON')}
            className="p-2 rounded-xl border-2 border-black bg-black text-[#FFCC00] hover:bg-stone-800 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal-sm font-black text-xs uppercase flex flex-col items-center justify-center transition-all col-span-2 sm:col-span-1"
          >
            <span>TEMPORADA</span>
            <span className="text-[9px] font-bold text-yellow-300">Até Rodada 38</span>
          </button>
        </div>
      </div>
    </div>
  );
};
