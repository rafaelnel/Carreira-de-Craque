import React from 'react';
import { User, Dumbbell, Users, Flag, FileText, Trophy } from 'lucide-react';
import { GameState } from '../types/game';
import { playTacticalClick } from '../utils/audio';

interface BottomNavProps {
  currentScreen: GameState['screen'];
  onSelectScreen: (screen: GameState['screen']) => void;
  hasUnreadTransfer?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  hasUnreadTransfer = false,
}) => {
  const tabs = [
    { id: 'DASHBOARD' as const, label: 'PERFIL', icon: User },
    { id: 'TRAINING' as const, label: 'TREINO', icon: Dumbbell },
    { id: 'SQUAD' as const, label: 'ELENCO', icon: Users },
    { id: 'MATCH_PRE' as const, label: 'JOGO', icon: Flag },
    { id: 'CONTRACT' as const, label: 'CONTRATO', icon: FileText, badge: hasUnreadTransfer },
    { id: 'CAREER' as const, label: 'HISTÓRICO', icon: Trophy },
  ];

  const isMatchActive = currentScreen === 'MATCH_PRE' || currentScreen === 'MATCH_LIVE' || currentScreen === 'MATCH_POST';

  return (
    <nav className="w-full bg-white border-t-[2.5px] border-black px-2 py-2 flex items-center justify-between gap-1 select-none shrink-0 shadow-lg z-30">
      {tabs.map((tab) => {
        const isActive =
          currentScreen === tab.id || (tab.id === 'MATCH_PRE' && isMatchActive);

        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              playTacticalClick();
              onSelectScreen(tab.id);
            }}
            className={`relative flex-1 py-1.5 px-1 rounded-xl border-2 border-black flex flex-col items-center justify-center transition-all ${
              isActive
                ? 'bg-[#FFCC00] shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white hover:bg-stone-50 active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            {tab.badge && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-black animate-pulse" />
            )}
            <Icon className="w-4 h-4 text-black stroke-[2.2]" />
            <span className="text-[9px] font-black uppercase tracking-tight text-black mt-0.5 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
