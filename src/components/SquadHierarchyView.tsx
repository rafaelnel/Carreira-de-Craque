import React, { useState } from 'react';
import { Users, ShieldCheck, ArrowRight, Info, UserCheck } from 'lucide-react';
import { GameState, SquadCompetitor, SquadRoleStatus } from '../types/game';
import { calculateSelectionScore } from '../utils/simulation';
import { playTacticalClick, playWhistle } from '../utils/audio';

interface SquadHierarchyViewProps {
  state: GameState;
  onNavigateToMatch: () => void;
}

export const SquadHierarchyView: React.FC<SquadHierarchyViewProps> = ({
  state,
  onNavigateToMatch,
}) => {
  const { player, currentClub, competitors } = state;
  const [viewFilter, setViewFilter] = useState<'POSICAO' | 'COMPLETO'>('POSICAO');

  const playerCompetitor: SquadCompetitor = {
    id: player.id,
    name: `${player.name} (Você)`,
    age: player.age,
    position: player.position,
    ca: player.currentAbility,
    fitness: player.state.fitness,
    sharpness: player.state.matchSharpness,
    recentForm: player.recentRatings,
    coachTrust: player.coachTrust,
    isPlayer: true,
  };

  const allInPosition = [
    playerCompetitor,
    ...competitors.filter((c) => !c.isPlayer),
  ].map((c) => ({
    ...c,
    selectionScore: calculateSelectionScore(c),
  }));

  allInPosition.sort((a, b) => (b.selectionScore ?? 0) - (a.selectionScore ?? 0));

  allInPosition.forEach((comp, idx) => {
    if (idx === 0) {
      comp.status = comp.fitness >= 75 ? 'TITULAR_ABSOLUTO' : 'TITULAR_ROTATIVO';
    } else if (idx === 1) {
      comp.status = 'TITULAR_ROTATIVO';
    } else if (idx === 2) {
      comp.status = 'RESERVA';
    } else {
      comp.status = 'NAO_RELACIONADO';
    }
  });

  const playerRank = (allInPosition.findIndex((c) => c.isPlayer) ?? 0) + 1;
  const playerObj = allInPosition.find((c) => c.isPlayer);
  const playerStatus = playerObj?.status || 'RESERVA';

  const getStatusBadge = (status?: SquadRoleStatus) => {
    switch (status) {
      case 'TITULAR_ABSOLUTO':
        return { label: 'TITULAR', bg: 'bg-[#FFCC00]' };
      case 'TITULAR_ROTATIVO':
        return { label: 'ROTATIVO', bg: 'bg-sky-200' };
      case 'RESERVA':
        return { label: 'BANCO', bg: 'bg-amber-100' };
      case 'NAO_RELACIONADO':
        return { label: 'FORA', bg: 'bg-rose-200' };
      default:
        return { label: 'AVALIAÇÃO', bg: 'bg-stone-200' };
    }
  };

  // Additional mock players for the full squad view
  const fullClubSquad = [
    ...allInPosition,
    { id: 'sq_gk', name: 'Júlio César', age: 29, position: 'GK' as any, ca: 68, fitness: 92, sharpness: 80, recentForm: [7.0], coachTrust: 80, status: 'TITULAR_ABSOLUTO' as SquadRoleStatus, selectionScore: 78.4, isPlayer: false },
    { id: 'sq_cb1', name: 'Danilo Boza', age: 26, position: 'CB' as any, ca: 67, fitness: 88, sharpness: 78, recentForm: [6.8], coachTrust: 75, status: 'TITULAR_ABSOLUTO' as SquadRoleStatus, selectionScore: 76.2, isPlayer: false },
    { id: 'sq_cb2', name: 'Bruno Tubarão', age: 28, position: 'CB' as any, ca: 65, fitness: 85, sharpness: 74, recentForm: [6.6], coachTrust: 70, status: 'TITULAR_ABSOLUTO' as SquadRoleStatus, selectionScore: 73.1, isPlayer: false },
    { id: 'sq_cm', name: 'Lucas Evangelista', age: 25, position: 'CM' as any, ca: 69, fitness: 90, sharpness: 82, recentForm: [7.2], coachTrust: 82, status: 'TITULAR_ABSOLUTO' as SquadRoleStatus, selectionScore: 80.5, isPlayer: false },
  ];

  const displayedList = viewFilter === 'POSICAO' ? allInPosition : fullClubSquad;

  return (
    <div className="h-full w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2.5">
      {/* Static Top Banner */}
      <div className="p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-3 shrink-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono">
            PILAR 2 · DISPUTA DE ELENCO E HIERARQUIA
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-black leading-none mt-0.5">
            {currentClub.name} · {player.position}
          </h1>
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => {
              playTacticalClick();
              setViewFilter('POSICAO');
            }}
            className={`px-2 py-1 rounded-lg border-2 border-black font-black uppercase transition-all ${
              viewFilter === 'POSICAO'
                ? 'bg-[#FFCC00] shadow-brutal-sm'
                : 'bg-white hover:bg-stone-50'
            }`}
          >
            POSIÇÃO ({allInPosition.length})
          </button>
          <button
            onClick={() => {
              playTacticalClick();
              setViewFilter('COMPLETO');
            }}
            className={`px-2 py-1 rounded-lg border-2 border-black font-black uppercase transition-all ${
              viewFilter === 'COMPLETO'
                ? 'bg-[#FFCC00] shadow-brutal-sm'
                : 'bg-white hover:bg-stone-50'
            }`}
          >
            ELENCO GERAL
          </button>
        </div>
      </div>

      {/* Static Formula Strip */}
      <div className="p-2.5 rounded-xl bg-white border-2 border-black shadow-brutal-sm text-[10px] font-mono flex items-center justify-between shrink-0">
        <span className="font-extrabold uppercase text-stone-700">ÍNDICE DE SELEÇÃO ($S$):</span>
        <span className="font-black text-black">CA (40%) + RITMO (20%) + FORMA (20%) + CONFIANÇA (20%)</span>
      </div>

      {/* Scrollable Inner Squad Container with Static Borders */}
      <div className="flex-1 p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1 shrink-0">
          <span className="font-black text-xs uppercase font-mono">
            {viewFilter === 'POSICAO' ? `CONCORRENTES DIRETOS EM ${player.position}` : 'JOGADORES DO ELENCO'}
          </span>
          <span className="font-mono text-[10px] text-stone-500 font-bold">ROLE INTERNO</span>
        </div>

        {/* Scrollable list of players */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1.5 my-1">
          {displayedList.map((comp, idx) => {
            const isUser = comp.isPlayer;
            const badge = getStatusBadge(comp.status);
            const avgForm =
              comp.recentForm && comp.recentForm.length > 0
                ? (comp.recentForm.reduce((a, b) => a + b, 0) / comp.recentForm.length).toFixed(1)
                : '6.5';

            return (
              <div
                key={comp.id}
                className={`p-2.5 rounded-xl border-2 border-black transition-all flex items-center justify-between gap-2 ${
                  isUser
                    ? 'bg-[#FFCC00] shadow-brutal-sm'
                    : 'bg-[#FBFBFA] hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-black text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-black text-xs uppercase text-black leading-tight flex items-center gap-1.5">
                      <span>{comp.name}</span>
                      {isUser && (
                        <span className="text-[9px] font-extrabold bg-black text-[#FFCC00] px-1 rounded">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-stone-700 font-bold mt-0.5">
                      {comp.position} · {comp.age} ANOS · RITMO: {comp.sharpness}% · FORMA: {avgForm}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right shrink-0">
                  <div className="font-mono leading-none">
                    <div className="text-sm font-black text-black">{comp.ca} OVR</div>
                    <div className="text-[9px] font-bold text-stone-700">SCORE: {comp.selectionScore}</div>
                  </div>
                  <span className={`text-[9px] font-mono font-black px-2 py-1 rounded-lg border border-black ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Static Coach Opinion Box */}
        <div className="p-2 rounded-xl border-2 border-black bg-stone-50 text-[10px] font-mono leading-tight shrink-0 mt-1">
          <strong>PARECER DO TREINADOR:</strong>{' '}
          {playerRank === 1
            ? 'Você é o titular absoluto da posição. Mantenha as boas atuações para assegurar os 90 minutos.'
            : 'Mantenha o foco em treinos de intensidade padrão ou intensa para ultrapassar o concorrente no índice de seleção.'}
        </div>
      </div>

      {/* Static Bottom CTA Block */}
      <div className="p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex flex-col justify-between space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            playWhistle('short');
            onNavigateToMatch();
          }}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-[2.5px] border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-brutal text-black font-black text-xs sm:text-sm uppercase tracking-wide transition-all"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>CONFIRMAR ESCALAÇÃO & IR PARA O JOGO</span>
          </div>
          <div className="w-6 h-6 rounded-md border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </button>

        {/* Hazard Stripes Footer Bar */}
        <div className="w-full h-2.5 rounded-full border border-black bg-hazard-stripes" />
      </div>
    </div>
  );
};
