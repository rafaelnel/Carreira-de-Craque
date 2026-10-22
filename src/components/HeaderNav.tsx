import React from 'react';
import { Volume2, VolumeX, Save, Calendar, Shield, Activity, Award } from 'lucide-react';
import { GameState, SquadRoleStatus } from '../types/game';
import { playTacticalClick } from '../utils/audio';

interface HeaderNavProps {
  state: GameState;
  activeScreen: GameState['screen'];
  onSelectScreen: (screen: GameState['screen']) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveGame: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  state,
  activeScreen,
  onSelectScreen,
  isMuted,
  onToggleMute,
  onSaveGame,
}) => {
  const { player, currentClub, currentWeek, totalWeeksInSeason, season } = state;

  const navItems: { id: GameState['screen']; label: string }[] = [
    { id: 'DASHBOARD', label: 'Visão Geral' },
    { id: 'TRAINING', label: 'Treino Semanal' },
    { id: 'SQUAD', label: 'Disputa de Elenco' },
    { id: 'MATCH_PRE', label: 'Dia de Jogo' },
    { id: 'CONTRACT', label: 'Contrato & Mercado' },
    { id: 'CAREER', label: 'Carreira' },
  ];

  const getStatusLabel = (status?: SquadRoleStatus) => {
    switch (status) {
      case 'TITULAR_ABSOLUTO':
        return 'Titular Absoluto';
      case 'TITULAR_ROTATIVO':
        return 'Titular Rotativo';
      case 'RESERVA':
        return 'Banco de Reservas';
      case 'NAO_RELACIONADO':
        return 'Não Relacionado';
      default:
        return 'Em Avaliação';
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800/80 sticky top-0 z-40 select-none">
      {/* Zone 1, 2, 3 Main Nav Bar */}
      <div className="flex items-center justify-between gap-6 px-4 md:px-8 py-3 max-w-7xl mx-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center font-mono font-black text-sky-400 text-xs">
            PP
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            PRO PATH
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playTacticalClick();
                  onSelectScreen(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions Cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              playTacticalClick();
              onSaveGame();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Salvar Carreira"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salvar</span>
          </button>

          <button
            onClick={() => {
              playTacticalClick();
              onToggleMute();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Sub-bar: Clean Unboxed Metadata Strip */}
      <div className="border-t border-slate-800/60 bg-slate-950/60 px-4 md:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-400">
          {/* Athlete & Club */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">{player.name}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-sky-400 font-mono font-medium">{player.position}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">{currentClub.name}</span>
            <span className="text-slate-500 font-mono text-[11px]">(Tier {currentClub.tier})</span>
          </div>

          {/* Calendar & Season */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Temporada {season}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Semana <strong className="text-slate-200 tabular-nums">{currentWeek}</strong>/{totalWeeksInSeason}</span>
          </div>

          {/* Physical & Professional Dynamic State */}
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Condição:</span>
              <span className={`font-bold tabular-nums ${player.state.fitness >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {player.state.fitness}%
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Ritmo:</span>
              <span className="text-sky-400 font-bold tabular-nums">
                {player.state.matchSharpness}%
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Confiança Técnico:</span>
              <span className="text-indigo-400 font-bold tabular-nums">
                {player.coachTrust}%
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Hype:</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {player.hype.toLocaleString('pt-BR')} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
