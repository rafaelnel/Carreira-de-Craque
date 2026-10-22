import React, { useState } from 'react';
import { User, Activity, Shield, Award, HeartPulse, ArrowRight, Zap } from 'lucide-react';
import { GameState, SquadRoleStatus } from '../types/game';
import { POSITIONS_INFO } from '../utils/constants';
import { playTacticalClick } from '../utils/audio';

interface DashboardViewProps {
  state: GameState;
  onNavigate: (screen: GameState['screen']) => void;
  playerStatus: SquadRoleStatus;
  onOpenRetirement?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  playerStatus,
  onOpenRetirement,
}) => {
  const { player, currentClub, currentMatch, trainingDoneThisWeek } = state;
  const [activeAttrTab, setActiveAttrTab] = useState<'RESUMO' | 'FISICO' | 'TECNICO' | 'MENTAL'>('RESUMO');

  const getStatusBadge = (status: SquadRoleStatus) => {
    switch (status) {
      case 'TITULAR_ABSOLUTO':
        return { text: 'TITULAR ABSOLUTO', bg: 'bg-[#FFCC00]' };
      case 'TITULAR_ROTATIVO':
        return { text: 'ROTATIVO', bg: 'bg-sky-200' };
      case 'RESERVA':
        return { text: 'BANCO', bg: 'bg-amber-100' };
      case 'NAO_RELACIONADO':
        return { text: 'NÃO RELACIONADO', bg: 'bg-rose-200' };
    }
  };

  const statusBadge = getStatusBadge(playerStatus);

  const isGK = player.position === 'GK';

  // Six Macro Attributes for Resumo (60-99 scale)
  const macroAttrs = isGK
    ? [
        { label: 'REFLEXOS (REF)', val: player.technical.reflexos ?? 66 },
        { label: 'ELASTICIDADE (ELA)', val: player.technical.elasticidade ?? 65 },
        { label: 'SEGURANÇA (SEG)', val: player.technical.segurancaMao ?? 65 },
        { label: 'POSICIONAMENTO (POS)', val: player.mental.posicionamento ?? 66 },
        { label: 'JOGO COM PÉS (PÉS)', val: player.technical.jogoComPes ?? 62 },
        { label: 'SAÍDA DO GOL (SAÍ)', val: player.technical.saidaDoGol ?? 64 },
      ]
    : [
        { label: 'VELOCIDADE (VEL)', val: Math.round((player.physical.velocidade + player.physical.agilidade) / 2) },
        { label: 'FINALIZAÇÃO (FIN)', val: Math.round((player.technical.finalizacao + player.mental.compostura) / 2) },
        { label: 'PASSE & CRIAÇÃO (PAS)', val: Math.round((player.technical.passeCurto + player.mental.visaoDeJogo) / 2) },
        { label: 'DRIBLE & TÉCNICA (DRI)', val: Math.round((player.technical.drible + player.mental.decisao) / 2) },
        { label: 'DESARME & DEFESA (DEF)', val: Math.round((player.technical.desarme + player.mental.posicionamento) / 2) },
        { label: 'FÍSICO & FORÇA (FIS)', val: Math.round((player.physical.forca + player.physical.resistencia) / 2) },
      ];

  return (
    <div className="h-full w-full p-3 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2.5">
      {/* Top Profile Card with Graphic Avatar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-3">
        {/* Left: Avatar with Yellow Box Offset */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#FFCC00] border-2 border-black rounded-xl transform translate-x-1 translate-y-1" />
            <div className="relative w-14 h-14 rounded-xl border-2 border-black bg-white flex flex-col items-center justify-center shadow-brutal-sm">
              {isGK ? <Shield className="w-7 h-7 text-black" /> : <User className="w-7 h-7 text-black" />}
              <span className="font-mono font-black text-[10px] bg-[#FFCC00] px-1 rounded border border-black -mt-1">
                {player.position}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black uppercase text-black leading-tight">
                {player.name}
              </h1>
            </div>
            <div className="text-[11px] font-bold text-stone-600 font-mono mt-0.5">
              {player.age} ANOS · {currentClub.name} (TIER {currentClub.tier})
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-black ${statusBadge.bg}`}>
                {statusBadge.text}
              </span>
              {player.age >= 35 && (
                <button
                  type="button"
                  onClick={() => {
                    playTacticalClick();
                    onOpenRetirement?.();
                  }}
                  className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-black bg-rose-200 text-rose-950 hover:bg-rose-300 transition-all flex items-center gap-1 shadow-brutal-sm"
                  title="Clique para ver status de aposentadoria"
                >
                  <span>{player.age >= 40 || player.isRetired ? 'APOSENTADO' : `VETERANO (${player.age}a) · DECIDIR`}</span>
                </button>
              )}
              {player.peakAbility && player.peakAbility > player.currentAbility && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded border border-black bg-[#FFCC00]/50 text-black">
                  AUGE: {player.peakAbility}
                </span>
              )}
              <span className="text-[10px] font-mono text-stone-500 font-bold">
                PA: {player.hidden.potentialAbility}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Big OVR Stamp (60-99) */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#FFCC00] border-2 border-black shadow-brutal-sm min-w-[62px]">
          <span className="text-[9px] font-black uppercase tracking-wider font-mono">OVER</span>
          <span className="text-2xl font-black font-mono text-black leading-none">
            {player.currentAbility}
          </span>
        </div>
      </div>

      {/* Dynamic State Bar: 4 Meters */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm text-center">
          <div className="text-[9px] font-black uppercase text-stone-600 font-mono">CONDIÇÃO</div>
          <div className="text-base font-black font-mono text-black mt-0.5">
            {player.state.fitness}%
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full border border-black mt-1 overflow-hidden">
            <div className="bg-[#FFCC00] h-full" style={{ width: `${player.state.fitness}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm text-center">
          <div className="text-[9px] font-black uppercase text-stone-600 font-mono">RITMO</div>
          <div className="text-base font-black font-mono text-black mt-0.5">
            {player.state.matchSharpness}%
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full border border-black mt-1 overflow-hidden">
            <div className="bg-[#FFCC00] h-full" style={{ width: `${player.state.matchSharpness}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm text-center">
          <div className="text-[9px] font-black uppercase text-stone-600 font-mono">CONFIANÇA</div>
          <div className="text-base font-black font-mono text-black mt-0.5">
            {player.coachTrust}%
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full border border-black mt-1 overflow-hidden">
            <div className="bg-black h-full" style={{ width: `${player.coachTrust}%` }} />
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm text-center">
          <div className="text-[9px] font-black uppercase text-stone-600 font-mono">HYPE</div>
          <div className="text-base font-black font-mono text-black mt-0.5">
            {player.hype.toLocaleString('pt-BR')}
          </div>
          <div className="text-[9px] font-mono text-stone-500 font-bold mt-1">PTS</div>
        </div>
      </div>

      {/* Attributes Card with Segmented Tabs (Resumo, Físico, Técnico, Mental) */}
      <div className="flex-1 p-3.5 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex flex-col justify-between overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2">
          <span className="font-black text-xs uppercase tracking-tight text-black font-mono">
            ATRIBUTOS (OVER 60–99)
          </span>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(['RESUMO', 'FISICO', 'TECNICO', 'MENTAL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  playTacticalClick();
                  setActiveAttrTab(tab);
                }}
                className={`px-2 py-0.5 rounded border border-black font-bold uppercase transition-all ${
                  activeAttrTab === tab
                    ? 'bg-[#FFCC00] text-black shadow-brutal-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content: Resumo (6 Macro Attributes) */}
        {activeAttrTab === 'RESUMO' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-1">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {macroAttrs.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA] flex items-center justify-between"
                >
                  <span className="font-extrabold text-[10px] text-black truncate pr-1">{item.label}</span>
                  <span className="font-black font-mono text-sm px-1.5 py-0.2 rounded bg-[#FFCC00] border border-black text-black shrink-0">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Físico */}
        {activeAttrTab === 'FISICO' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-1">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {Object.entries(player.physical).map(([key, val]) => (
                <div key={key} className="p-2 rounded-xl border-2 border-black bg-[#FBFBFA] flex items-center justify-between">
                  <span className="font-extrabold text-[10px] uppercase text-black">{key}</span>
                  <div className="flex items-center gap-1">
                    {player.attributeTrends?.[key] === 'UP' && <span className="text-emerald-600 font-black text-xs">▲</span>}
                    {player.attributeTrends?.[key] === 'DOWN' && <span className="text-rose-600 font-black text-xs">▼</span>}
                    <span className="font-black font-mono text-sm px-1.5 py-0.2 rounded bg-[#FFCC00] border border-black text-black">
                      {val}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Técnico (All 8 Attributes with inner scroll) */}
        {activeAttrTab === 'TECNICO' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-1">
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {Object.entries(player.technical).map(([key, val]) => (
                <div key={key} className="p-1.5 rounded-lg border-2 border-black bg-[#FBFBFA] flex items-center justify-between">
                  <span className="font-extrabold text-[9px] uppercase text-black truncate">{key}</span>
                  <div className="flex items-center gap-1">
                    {player.attributeTrends?.[key] === 'UP' && <span className="text-emerald-600 font-black text-xs">▲</span>}
                    {player.attributeTrends?.[key] === 'DOWN' && <span className="text-rose-600 font-black text-xs">▼</span>}
                    <span className="font-black font-mono text-xs px-1.5 py-0.2 rounded bg-[#FFCC00] border border-black text-black">
                      {val}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Mental */}
        {activeAttrTab === 'MENTAL' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-1">
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {Object.entries(player.mental).map(([key, val]) => (
                <div key={key} className="p-1.5 rounded-lg border-2 border-black bg-[#FBFBFA] flex items-center justify-between">
                  <span className="font-extrabold text-[9px] uppercase text-black truncate">{key}</span>
                  <div className="flex items-center gap-1">
                    {player.attributeTrends?.[key] === 'UP' && <span className="text-emerald-600 font-black text-xs">▲</span>}
                    {player.attributeTrends?.[key] === 'DOWN' && <span className="text-rose-600 font-black text-xs">▼</span>}
                    <span className="font-black font-mono text-xs px-1.5 py-0.2 rounded bg-[#FFCC00] border border-black text-black">
                      {val}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Hint */}
        <div className="text-[9px] font-mono text-stone-500 text-center border-t border-stone-300 pt-1">
          Evolua seus atributos na aba de TREINO semanal para atingir 99 OVR.
        </div>
      </div>

      {/* Next Match Quick Action Card */}
      <div className="p-3.5 rounded-2xl bg-[#FFCC00] border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-3">
        <div className="truncate">
          <div className="text-[9px] font-black uppercase tracking-wider text-black font-mono">
            PRÓXIMA PARTIDA · SEMANA {state.currentWeek}
          </div>
          <div className="text-xs font-black uppercase text-black truncate mt-0.5">
            {currentMatch ? `${currentMatch.homeClub.shortName} VS ${currentMatch.awayClub.shortName}` : 'FIM DA TEMPORADA'}
          </div>
        </div>

        {!trainingDoneThisWeek ? (
          <button
            onClick={() => {
              playTacticalClick();
              onNavigate('TRAINING');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black bg-white hover:bg-stone-50 shadow-brutal-sm text-black font-black text-xs uppercase tracking-wide shrink-0 transition-all"
          >
            <span>TREINAR</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        ) : (
          <button
            onClick={() => {
              playTacticalClick();
              onNavigate('MATCH_PRE');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black bg-black text-[#FFCC00] hover:bg-stone-900 shadow-brutal-sm font-black text-xs uppercase tracking-wide shrink-0 transition-all"
          >
            <span>JOGAR</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};
