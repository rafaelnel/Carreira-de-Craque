import React, { useState } from 'react';
import {
  Dumbbell,
  Zap,
  Target,
  Compass,
  Crosshair,
  Sparkles,
  Share2,
  Users,
  Shield,
  Activity,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  HeartPulse,
} from 'lucide-react';
import { GameState, TrainingAreaId, TrainingIntensity, WeeklyTrainingPlan } from '../types/game';
import { TRAINING_AREAS_CATALOGUE } from '../utils/constants';
import { executeWeeklyTraining } from '../utils/simulation';
import { playBallKick, playTacticalClick, playWhistle } from '../utils/audio';
import { ScoutingModal } from './ScoutingModal';

interface TrainingViewProps {
  state: GameState;
  onUpdatePlayer: (updatedState: Partial<GameState>) => void;
  onNavigateToMatch: () => void;
}

interface AreaCardDef {
  id: TrainingAreaId;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  attrs: string;
  desc: string;
}

const TRAINING_CARDS: AreaCardDef[] = [
  {
    id: 'CORRIDA',
    name: 'Corrida & Velocidade',
    category: 'FÍSICO',
    icon: Zap,
    attrs: 'Velocidade · Agilidade',
    desc: 'Tiros curtos, arranque de profundidade e aceleração no gramado.',
  },
  {
    id: 'CHUTE',
    name: 'Chute & Finalização',
    category: 'TÉCNICO',
    icon: Target,
    attrs: 'Finalização · Compostura',
    desc: 'Arremates de primeira, finalização de média distância e pontaria.',
  },
  {
    id: 'CRUZAMENTO',
    name: 'Cruzamento & Lançamento',
    category: 'TÉCNICO',
    icon: Compass,
    attrs: 'Passe Longo · Visão de Jogo',
    desc: 'Bolas alçadas na área, viradas de jogo e passes em profundidade.',
  },
  {
    id: 'PENALTY',
    name: 'Pênalti & Frieza',
    category: 'TÉCNICO',
    icon: Crosshair,
    attrs: 'Bolas Paradas · Frieza',
    desc: 'Cobranças na marca da cal, leitura do goleiro e batida firme.',
  },
  {
    id: 'FALTA',
    name: 'Cobrança de Falta',
    category: 'TÉCNICO',
    icon: Sparkles,
    attrs: 'Bolas Paradas · Finalização',
    desc: 'Faltas diretas sobre a barreira, efeito na bola e precisão no ângulo.',
  },
  {
    id: 'PASSE',
    name: 'Passe & Criação',
    category: 'TÉCNICO',
    icon: Share2,
    attrs: 'Passe Curto · Visão de Jogo',
    desc: 'Troca rápida de passes sob pressão e triangulações verticais.',
  },
  {
    id: 'TRABALHO_EQUIPE',
    name: 'Trabalho em Equipe',
    category: 'MENTAL',
    icon: Users,
    attrs: 'Trabalho em Equipe · Posicionamento',
    desc: 'Adesão tática coletiva, recomposição e coberturas defensivas.',
  },
  {
    id: 'RESISTENCIA',
    name: 'Resistência & Força',
    category: 'FÍSICO',
    icon: Activity,
    attrs: 'Resistência · Força Física',
    desc: 'Capacidade aeróbica para suportar 90 minutos e combate corpo a corpo.',
  },
];

const GK_TRAINING_CARDS: AreaCardDef[] = [
  {
    id: 'DEFESAS_REFLEXOS',
    name: 'Reflexos & Queima-Roupa',
    category: 'GOLEIRO',
    icon: Zap,
    attrs: 'Reflexos · Agilidade',
    desc: 'Defesas rápidas à queima-roupa, tempo de reação e agilidade sob as traves.',
  },
  {
    id: 'ELASTICIDADE_SALTO',
    name: 'Elasticidade & Salto',
    category: 'GOLEIRO',
    icon: Sparkles,
    attrs: 'Elasticidade · Impulsão',
    desc: 'Mergulhos no ângulo, pontes acrobáticas e alcance nas extremidades da meta.',
  },
  {
    id: 'SAIDA_GOL',
    name: 'Saída do Gol & 1x1',
    category: 'GOLEIRO',
    icon: Target,
    attrs: 'Saída do Gol · Decisão',
    desc: 'Abafamento nos pés dos atacantes, corte de cruzamentos e autoridade na pequena área.',
  },
  {
    id: 'SEGURANCA_MAO',
    name: 'Firmeza & Segurança de Mãos',
    category: 'GOLEIRO',
    icon: Shield,
    attrs: 'Segurança · Compostura',
    desc: 'Segurança na pegada sem dar rebote, firmeza em chutes potentes e tranquilidade.',
  },
  {
    id: 'REPOSICAO_PES',
    name: 'Reposição & Jogo com os Pés',
    category: 'GOLEIRO',
    icon: Share2,
    attrs: 'Jogo com Pés · Lançamento',
    desc: 'Lançamentos precisos com as mãos e pés para contra-ataques rápidos.',
  },
  {
    id: 'CORRIDA',
    name: 'Agilidade & Deslocamento',
    category: 'FÍSICO',
    icon: Zap,
    attrs: 'Velocidade · Agilidade',
    desc: 'Passadas laterais rápidas na meta e reposicionamento entre as traves.',
  },
  {
    id: 'TRABALHO_EQUIPE',
    name: 'Comunicação & Liderança',
    category: 'MENTAL',
    icon: Users,
    attrs: 'Trabalho em Equipe · Posicionamento',
    desc: 'Comando verbal da linha defensiva e organização das bolas paradas.',
  },
  {
    id: 'RESISTENCIA',
    name: 'Resistência & Força',
    category: 'FÍSICO',
    icon: Activity,
    attrs: 'Resistência · Força Física',
    desc: 'Capacidade física para saltos repetidos e divididas na área.',
  },
];

export const TrainingView: React.FC<TrainingViewProps> = ({
  state,
  onUpdatePlayer,
  onNavigateToMatch,
}) => {
  const { player, activeTrainingPlan, trainingDoneThisWeek } = state;
  const isGK = player.position === 'GK';
  const availableCards = isGK ? GK_TRAINING_CARDS : TRAINING_CARDS;

  // Selected 2 areas state
  const [selectedAreas, setSelectedAreas] = useState<[TrainingAreaId, TrainingAreaId]>(
    activeTrainingPlan.selectedAreas &&
    availableCards.some((c) => c.id === activeTrainingPlan.selectedAreas[0])
      ? activeTrainingPlan.selectedAreas
      : isGK
      ? ['DEFESAS_REFLEXOS', 'ELASTICIDADE_SALTO']
      : ['CHUTE', 'CORRIDA']
  );

  const [intensity, setIntensity] = useState<TrainingIntensity>(
    activeTrainingPlan.intensity || 'PADRAO'
  );

  const [justTrained, setJustTrained] = useState<{
    improved: string[];
    fitnessCost: number;
    coachTrustBoost: number;
  } | null>(null);

  const [isScoutingOpen, setIsScoutingOpen] = useState(false);

  // Toggle area selection (max 2)
  const handleToggleArea = (areaId: TrainingAreaId) => {
    playTacticalClick();
    if (selectedAreas.includes(areaId)) {
      // Cannot unselect if only 1 remains, or swap with another
      if (selectedAreas[0] === areaId) {
        // keep second
        return;
      } else {
        // keep first
        return;
      }
    } else {
      // Replace the oldest selected area (FIFO)
      const nextAreas: [TrainingAreaId, TrainingAreaId] = [selectedAreas[1], areaId];
      setSelectedAreas(nextAreas);

      // Persist plan preference
      const updatedPlan: WeeklyTrainingPlan = {
        ...activeTrainingPlan,
        selectedAreas: nextAreas,
        intensity,
      };
      onUpdatePlayer({ activeTrainingPlan: updatedPlan });
    }
  };

  const handleIntensityChange = (newIntensity: TrainingIntensity) => {
    playTacticalClick();
    setIntensity(newIntensity);
    const updatedPlan: WeeklyTrainingPlan = {
      ...activeTrainingPlan,
      selectedAreas,
      intensity: newIntensity,
    };
    onUpdatePlayer({ activeTrainingPlan: updatedPlan });
  };

  const handleExecuteTraining = () => {
    playBallKick();
    playWhistle('short');

    const currentPlan: WeeklyTrainingPlan = {
      selectedAreas,
      intensity,
    };

    const { updatedPlayer, summary } = executeWeeklyTraining(player, currentPlan);

    setJustTrained({
      improved: summary.improvedAttributes,
      fitnessCost: Math.abs(summary.fitnessDelta),
      coachTrustBoost: summary.coachTrustDelta,
    });

    onUpdatePlayer({
      player: updatedPlayer,
      activeTrainingPlan: currentPlan,
      trainingDoneThisWeek: true,
      notification: {
        title: 'TREINO APLICADO',
        message: `Foco em ${selectedAreas.join(' & ')}. Ganho de XP e atributos atualizados (${updatedPlayer.currentAbility} OVR).`,
        type: 'success',
      },
    });
  };

  return (
    <div className="h-full w-full p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2">
      {/* Top Banner (Static) */}
      <div className="p-3 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono">
            PILAR 3 · FOCO DE TREINAMENTO DO ATLETA
          </div>
          <h1 className="text-sm sm:text-base font-black uppercase text-black leading-none mt-0.5">
            ESCOLHA 2 ÁREAS PARA BONIFICAÇÃO
          </h1>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span className="px-2 py-1 rounded-lg border-2 border-black bg-[#FFCC00] font-black text-xs shadow-brutal-sm">
            2/2 ATIVOS
          </span>
        </div>
      </div>

      {/* Main Grid: 8 Specific Training Drill Cards with internal scroll (Static surroundings) */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border-[2.5px] border-black shadow-brutal p-2 sm:p-3 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1.5 shrink-0 font-mono text-[10px]">
          <span className="font-black text-black uppercase">
            SELECIONE 2 ÁREAS (RECEBERÃO BÔNUS DIRECIONADO)
          </span>
          <span className="text-stone-500 font-bold hidden sm:inline">
            OVERALL ESCALA 60-99
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {availableCards.map((card) => {
            const isSelected = selectedAreas.includes(card.id);
            const Icon = card.icon;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleToggleArea(card.id)}
                className={`p-2 sm:p-2.5 rounded-xl border-2 border-black text-left flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'bg-[#FFCC00] shadow-brutal-sm ring-2 ring-black -translate-y-0.5'
                    : 'bg-[#FBFBFA] hover:bg-stone-100 opacity-90'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 bg-black text-[#FFCC00] text-[8px] font-mono font-black px-1.5 py-0.5 rounded border border-black uppercase flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> BÔNUS
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-black text-[#FFCC00]' : 'bg-white text-black'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-stone-600 uppercase">
                      {card.category}
                    </span>
                  </div>

                  <div className="font-black text-xs sm:text-sm uppercase text-black leading-tight mt-1.5">
                    {card.name}
                  </div>

                  <div className="text-[10px] font-mono font-black text-emerald-800 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                    <span>+{card.attrs}</span>
                  </div>
                </div>

                <div className="text-[9px] text-stone-600 font-mono mt-1.5 line-clamp-2 leading-tight">
                  {card.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary Strip (Static inside panel) */}
        <div className="mt-2 pt-2 border-t-2 border-black shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-black text-stone-700 uppercase text-[10px]">FOCO ATUAL:</span>
            <div className="flex items-center gap-1">
              {selectedAreas.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded-lg border border-black bg-[#FFCC00] font-black text-[10px] text-black"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>

          {/* Intensity selector */}
          <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
            <span className="font-black text-[10px] uppercase mr-1">CARGA:</span>
            {(['BAIXA', 'PADRAO', 'INTENSA'] as TrainingIntensity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleIntensityChange(lvl)}
                className={`px-2 py-0.5 rounded-lg border border-black text-[9px] font-black uppercase transition-all ${
                  intensity === lvl
                    ? 'bg-black text-[#FFCC00] shadow-brutal-sm'
                    : 'bg-white text-black hover:bg-stone-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Cards (Static) */}
      <div className="p-3 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-col font-mono text-xs">
            <span className="text-[10px] text-stone-500 font-bold uppercase">CONDIÇÃO FÍSICA</span>
            <span className="font-black text-black text-sm">{player.state.fitness}%</span>
          </div>
          <div className="h-6 w-px bg-stone-300" />
          <div className="flex flex-col font-mono text-xs">
            <span className="text-[10px] text-stone-500 font-bold uppercase">CONFIANÇA TÉCNICO</span>
            <span className="font-black text-black text-sm">{player.coachTrust}/100</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              playTacticalClick();
              setIsScoutingOpen(true);
            }}
            className="px-3 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-stone-50 active:translate-x-[1px] active:translate-y-[1px] shadow-brutal text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
            title="Gastar treino semanal para sondar propostas de novos clubes"
          >
            <Compass className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">SONDAR MERCADO</span>
            <span className="sm:hidden">SONDAR</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteTraining}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border-2 border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[1px] active:translate-y-[1px] shadow-brutal text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all"
          >
            <Dumbbell className="w-4 h-4 stroke-[2.5]" />
            <span>APLICAR TREINO</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToMatch}
            className="px-3.5 py-2.5 rounded-xl border-2 border-black bg-black text-[#FFCC00] hover:bg-stone-800 shadow-brutal text-xs font-black uppercase flex items-center justify-center gap-1 transition-all"
          >
            <span>SIMULAR JOGOS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scouting Modal */}
      <ScoutingModal
        isOpen={isScoutingOpen}
        onClose={() => setIsScoutingOpen(false)}
        state={state}
        onScoutingCompleted={(updatedState) => onUpdatePlayer(updatedState)}
      />
    </div>
  );
};
