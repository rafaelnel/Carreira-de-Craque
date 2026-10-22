import React, { useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Award, Activity, ArrowRight, User } from 'lucide-react';
import { playTacticalClick, playWhistle } from '../utils/audio';

interface TitleScreenProps {
  hasSaveGame: boolean;
  onNewGame: () => void;
  onResumeGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSaveGame,
  onNewGame,
  onResumeGame,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playWhistle('short');
        if (hasSaveGame) {
          onResumeGame();
        } else {
          onNewGame();
        }
      } else if (e.key.toLowerCase() === 'm') {
        onToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasSaveGame, onNewGame, onResumeGame, onToggleMute]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#ECECE8] flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Device Card Frame matching the reference design */}
      <div className="w-full max-w-md h-[96vh] max-h-[820px] bg-[#FBFBFA] border-[2.5px] border-black rounded-[28px] shadow-brutal-lg overflow-hidden flex flex-col justify-between text-black">
        {/* Top Mini Header / Status Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b-[2px] border-black bg-white">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black" />
            <span className="font-extrabold text-xs uppercase tracking-wider font-mono">
              PRO PATH · SIMULATOR
            </span>
          </div>

          <button
            onClick={() => {
              playTacticalClick();
              onToggleMute();
            }}
            className="px-2.5 py-1 rounded-lg border-2 border-black bg-white hover:bg-[#FFCC00] font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-brutal-sm transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-black" />}
            <span>{isMuted ? 'MUDO' : 'SOM'}</span>
          </button>
        </div>

        {/* Center Main Content (Zero-Scroll Viewport) */}
        <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
          {/* Headline Lockup */}
          <div className="space-y-1">
            <div className="inline-block bg-[#FFCC00] px-2 py-0.5 rounded border border-black font-mono text-[10px] font-black uppercase tracking-wider">
              CARREIRA PROFISSIONAL · OVER 60 A 99
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">
              PRO PATH
            </h1>
            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Gestão estratégica de carreira do atleta: treinos, briga por posição, contratos profissionais e simulação tática.
            </p>
          </div>

          {/* Graphic Artwork: Yellow offset card with Player Icon and Dot Matrix */}
          <div className="relative my-auto flex items-center justify-center py-4">
            {/* Dot Matrix Patterns */}
            <div className="absolute left-6 top-3 w-12 h-12 bg-dot-matrix opacity-40 pointer-events-none" />
            <div className="absolute right-6 bottom-3 w-10 h-10 bg-dot-matrix opacity-40 pointer-events-none" />
            <div className="absolute top-1 right-10 w-4 h-4 bg-black" />
            <div className="absolute bottom-2 left-10 w-4 h-4 bg-[#FFCC00] border-2 border-black" />

            {/* Central Graphic Badge */}
            <div className="relative">
              <div className="absolute -inset-2 bg-[#FFCC00] border-2 border-black rounded-3xl transform translate-x-2 translate-y-2 shadow-brutal" />
              <div className="relative w-36 h-36 rounded-3xl border-[2.5px] border-black bg-white flex flex-col items-center justify-center p-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FFCC00] border-2 border-black flex items-center justify-center mb-1">
                  <User className="w-8 h-8 text-black" />
                </div>
                <span className="font-black text-sm uppercase tracking-tight">O ATLETA</span>
                <span className="font-mono text-[10px] font-bold text-stone-600">OVER 60 – 99</span>
              </div>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
              <div className="font-black text-[11px] uppercase">100% FUTEBOL</div>
              <div className="text-[9px] text-stone-600 mt-0.5">Sem futilidades sociais</div>
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
              <div className="font-black text-[11px] uppercase">SELEÇÃO S</div>
              <div className="text-[9px] text-stone-600 mt-0.5">Hierarquia matemática</div>
            </div>
            <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
              <div className="font-black text-[11px] uppercase">TIERS 1 A 5</div>
              <div className="text-[9px] text-stone-600 mt-0.5">Do acesso à Europa</div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Block with Yellow Buttons & Hazard Stripes */}
        <div className="p-5 pt-3 bg-white border-t-[2px] border-black space-y-2.5">
          {hasSaveGame && (
            <button
              onClick={() => {
                playWhistle('short');
                onResumeGame();
              }}
              className="w-full flex items-center justify-between px-5 py-3 rounded-xl border-[2.5px] border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-brutal text-black font-black text-xs uppercase tracking-wider transition-all"
            >
              <span>CONTINUAR CARREIRA</span>
              <div className="w-6 h-6 rounded-md border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          )}

          <button
            onClick={() => {
              playTacticalClick();
              onNewGame();
            }}
            className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border-[2.5px] border-black text-black font-black text-xs uppercase tracking-wider transition-all ${
              hasSaveGame
                ? 'bg-white hover:bg-stone-50 shadow-brutal'
                : 'bg-[#FFCC00] hover:bg-[#ffdb33] shadow-brutal'
            }`}
          >
            <span>NOVO ATLETA</span>
            <div className="w-6 h-6 rounded-md border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>

          {/* Bottom Hazard Stripes Accent */}
          <div className="w-full h-3 rounded-full border border-black bg-hazard-stripes mt-1" />
        </div>
      </div>
    </div>
  );
};
