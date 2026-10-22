import React from 'react';
import { Volume2, VolumeX, Save, Shield, Calendar } from 'lucide-react';
import { GameState } from '../types/game';
import { playTacticalClick } from '../utils/audio';

interface TopBarProps {
  state: GameState;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveGame: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  isMuted,
  onToggleMute,
  onSaveGame,
}) => {
  const { player, currentClub, currentWeek, totalWeeksInSeason, season } = state;

  return (
    <header className="w-full bg-white border-b-[2.5px] border-black px-4 py-2.5 flex items-center justify-between gap-2 select-none shrink-0 z-30">
      {/* Left: Player OVR Badge & Identity */}
      <div className="flex items-center gap-2.5">
        {/* OVR Badge (60-99) */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFCC00] border-2 border-black shadow-brutal-sm">
          <span className="font-mono font-black text-sm text-black leading-none">
            {player.currentAbility}
          </span>
        </div>

        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xs text-black uppercase tracking-tight truncate max-w-[130px] sm:max-w-[200px]">
              {player.name}
            </span>
            <span className="font-mono text-[10px] font-extrabold px-1 py-0.2 rounded border border-black bg-stone-100">
              {player.position}
            </span>
          </div>
          <div className="text-[10px] text-stone-600 font-bold truncate">
            {currentClub.name} · T{currentClub.tier}
          </div>
        </div>
      </div>

      {/* Center: Week / Season Info */}
      <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-bold bg-stone-100 px-2.5 py-1 rounded-lg border border-black">
        <span>T{season}</span>
        <span className="text-stone-400">/</span>
        <span>SEM {currentWeek}/{totalWeeksInSeason}</span>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            playTacticalClick();
            onSaveGame();
          }}
          className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-stone-100 shadow-brutal-sm text-black transition-all"
          title="Salvar"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            playTacticalClick();
            onToggleMute();
          }}
          className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-stone-100 shadow-brutal-sm text-black transition-all"
          title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-black" />}
        </button>
      </div>
    </header>
  );
};
