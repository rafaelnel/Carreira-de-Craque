import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Shield,
  Zap,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  ChevronLeft,
  Building2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Club, PlayerCharacter, PositionCode } from '../types/game';
import {
  POSITIONS_INFO,
  getClubsForStartingPropositions,
  getClubAverageOvr,
} from '../utils/constants';
import { calculateCurrentAbility } from '../utils/simulation';
import { playTacticalClick, playWhistle } from '../utils/audio';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlayer: (player: PlayerCharacter, startingClub: Club) => void;
}

export const CreatePlayerModal: React.FC<CreatePlayerModalProps> = ({
  isOpen,
  onClose,
  onCreatePlayer,
}) => {
  // Step 1: Create Player Profile; Step 2: Choose Starting Club
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState('Lucas Silveira');
  const [age, setAge] = useState(18);
  const [position, setPosition] = useState<PositionCode>('ST');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [archetype, setArchetype] = useState<string>('TECNICO');

  // Generate starting attributes strictly in the 60 to 99 range
  const getStartingAttributes = () => {
    let phys = {
      velocidade: 64,
      resistencia: 62,
      forca: 61,
      impulsao: 62,
      agilidade: 65,
    };

    let tech = {
      finalizacao: 63,
      passeCurto: 62,
      passeLongo: 60,
      drible: 64,
      desarme: 60,
      marcacao: 60,
      cabeceio: 61,
      bolasParadas: 60,
      reflexos: 60,
      elasticidade: 60,
      segurancaMao: 60,
      jogoComPes: 60,
      saidaDoGol: 60,
    };

    let ment = {
      visaoDeJogo: 62,
      posicionamento: 63,
      decisao: 61,
      compostura: 62,
      trabalhoEmEquipe: 64,
      determinacao: 66,
    };

    // Position adjustments (always >= 60 and <= 99)
    if (position === 'GK') {
      phys.impulsao = 68;
      phys.agilidade = 66;
      phys.forca = 64;
      ment.posicionamento = 67;
      ment.compostura = 66;
      ment.decisao = 64;
      tech.reflexos = 68;
      tech.elasticidade = 67;
      tech.segurancaMao = 66;
      tech.jogoComPes = 63;
      tech.saidaDoGol = 65;
      tech.bolasParadas = 62;
      tech.passeCurto = 62;
      tech.passeLongo = 64;

      // Archetype modifier for GK
      if (archetype === 'REFLEXO' || archetype === 'EXPLOSIVO') {
        tech.reflexos += 5;
        phys.agilidade += 4;
        tech.elasticidade += 3;
      } else if (archetype === 'MURALHA' || archetype === 'EQUILIBRADO') {
        tech.segurancaMao += 5;
        ment.posicionamento += 4;
        ment.compostura += 3;
      } else {
        // LIBERO / TECNICO
        tech.jogoComPes += 5;
        tech.saidaDoGol += 4;
        ment.decisao += 3;
      }
    } else if (position === 'ST') {
      tech.finalizacao += 8;
      ment.posicionamento += 6;
      ment.compostura += 4;
      phys.velocidade += 3;
    } else if (position === 'LW' || position === 'RW') {
      phys.velocidade += 9;
      phys.agilidade += 7;
      tech.drible += 6;
      tech.finalizacao += 3;
    } else if (position === 'CAM') {
      ment.visaoDeJogo += 9;
      tech.passeCurto += 8;
      tech.drible += 5;
      ment.decisao += 5;
    } else if (position === 'CM') {
      tech.passeCurto += 7;
      tech.passeLongo += 6;
      phys.resistencia += 7;
      ment.visaoDeJogo += 5;
    } else if (position === 'CDM') {
      tech.desarme += 10;
      tech.marcacao += 9;
      phys.forca += 7;
      ment.posicionamento += 6;
    } else if (position === 'CB') {
      tech.desarme += 11;
      tech.marcacao += 10;
      tech.cabeceio += 9;
      phys.forca += 9;
      phys.impulsao += 8;
    } else if (position === 'LB' || position === 'RB') {
      phys.velocidade += 7;
      phys.resistencia += 8;
      tech.desarme += 6;
      tech.passeCurto += 5;
    }

    // Archetype modifier for outfield
    if (position !== 'GK') {
      if (archetype === 'EXPLOSIVO' || archetype === 'REFLEXO') {
        phys.velocidade += 4;
        phys.agilidade += 3;
        phys.forca += 3;
      } else if (archetype === 'TECNICO' || archetype === 'LIBERO') {
        tech.drible += 3;
        tech.passeCurto += 3;
        ment.visaoDeJogo += 3;
      } else {
        ment.determinacao += 4;
        phys.resistencia += 3;
        ment.trabalhoEmEquipe += 4;
      }
    }

    // Clamp every attribute between 60 and 99
    const clamp6099 = (val: number) => Math.max(60, Math.min(99, val));

    const clampedPhys = Object.fromEntries(
      Object.entries(phys).map(([k, v]) => [k, clamp6099(v)])
    ) as typeof phys;

    const clampedTech = Object.fromEntries(
      Object.entries(tech).map(([k, v]) => [k, clamp6099(v)])
    ) as typeof tech;

    const clampedMent = Object.fromEntries(
      Object.entries(ment).map(([k, v]) => [k, clamp6099(v)])
    ) as typeof ment;

    return { phys: clampedPhys, tech: clampedTech, ment: clampedMent };
  };

  const { phys, tech, ment } = getStartingAttributes();
  const currentAbility = calculateCurrentAbility(position, phys, tech, ment);

  // 5 Initial club propositions based on player's rookie OVR
  const suggestedClubs = useMemo(() => {
    return getClubsForStartingPropositions(currentAbility);
  }, [currentAbility]);

  // Sync selected club with suggested propositions
  useEffect(() => {
    if (suggestedClubs.length > 0 && (!selectedClubId || !suggestedClubs.some((c) => c.id === selectedClubId))) {
      setSelectedClubId(suggestedClubs[0].id);
    }
  }, [suggestedClubs, selectedClubId]);

  // Advance to Step 2: Club Selection
  const handleProceedToClubSelection = () => {
    playTacticalClick();
    setStep(2);
  };

  const selectedClub = suggestedClubs.find((c) => c.id === selectedClubId) || suggestedClubs[0];

  // Finish Setup: Create Player and Start Career
  const handleFinalizeContract = () => {
    playWhistle('short');

    const newPlayer: PlayerCharacter = {
      id: `player_${Date.now()}`,
      name: name.trim() || (position === 'GK' ? 'Goleiro Titular' : 'Atleta Profissional'),
      age,
      nationality: 'Brasil',
      position,
      physical: phys,
      technical: tech,
      mental: ment,
      state: {
        fitness: 95,
        matchSharpness: 70,
        injuryRisk: 10,
        moral: 85,
      },
      hidden: {
        potentialAbility: Math.floor(Math.random() * 8) + 86, // 86-93 PA (teto 60-99)
        professionalism: Math.floor(Math.random() * 6) + 14,
        injuryProne: Math.floor(Math.random() * 5) + 4,
      },
      attributeXP: {},
      currentAbility,
      hype: 250,
      coachTrust: 60,
      recentRatings: [6.6, 6.8],
      contract: {
        clubId: selectedClub.id,
        clubName: selectedClub.name,
        wageWeekly:
          selectedClub.tier === 1
            ? 5500
            : selectedClub.tier === 2
            ? 2200
            : selectedClub.tier === 4
            ? 1200
            : 650,
        yearsRemaining: 2,
        promisedRole: 'JOVEM_DESENVOLVIMENTO',
        goalBonus:
          selectedClub.tier === 1
            ? 1200
            : selectedClub.tier === 2
            ? 600
            : selectedClub.tier === 4
            ? 300
            : 150,
        appearanceBonus:
          selectedClub.tier === 1
            ? 800
            : selectedClub.tier === 2
            ? 400
            : selectedClub.tier === 4
            ? 200
            : 100,
        cleanSheetBonus:
          selectedClub.tier === 1
            ? 1500
            : selectedClub.tier === 2
            ? 700
            : selectedClub.tier === 4
            ? 350
            : 200,
        releaseClause:
          selectedClub.tier === 1
            ? 15000000
            : selectedClub.tier === 2
            ? 4500000
            : selectedClub.tier === 4
            ? 1200000
            : 400000,
        relegationClause: true,
        higherTierReleaseClause: true,
        unfulfilledMatchesStreak: 0,
        transferRequested: false,
      },
      careerStats: {
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        avgRating: 6.5,
        trophies: [],
      },
      history: [],
      trophiesGallery: [],
    };

    onCreatePlayer(newPlayer, selectedClub);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm">
      {/* Device Card Shell with Neo-Brutalist styling */}
      <div className="w-full max-w-md bg-[#FBFBFA] border-[2.5px] border-black rounded-[28px] shadow-brutal-lg overflow-hidden flex flex-col h-[94vh] max-h-[820px] justify-between text-black">
        {/* Top Header Bar */}
        <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b-[2px] border-black bg-white shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => {
                  playTacticalClick();
                  setStep(1);
                }}
                className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-white hover:bg-stone-100 shadow-brutal-sm transition-all"
                title="Voltar ao Passo 1"
              >
                <ChevronLeft className="w-4 h-4 text-black" />
              </button>
            )}
            <span className="font-extrabold tracking-wider text-xs uppercase font-mono">
              {step === 1 ? 'PASSO 1/2 · FICHA DO ATLETA' : 'PASSO 2/2 · ESCOLHA DO CLUBE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-stone-500">OVR:</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFCC00] border-2 border-black flex items-center justify-center font-black text-xs font-mono shadow-brutal-sm">
              {currentAbility}
            </div>
          </div>
        </div>

        {/* STEP 1: CREATE PLAYER PROFILE */}
        {step === 1 && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {/* Headline Section */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-none">
                CRIE SEU JOGADOR
              </h1>
              <p className="text-xs text-stone-600 mt-1 leading-snug font-medium">
                Escolha a posição (inclusive <strong>Goleiro</strong>), nome, idade e arquétipo. O OVR é calculado fielmente a partir dos seus atributos.
              </p>
            </div>

            {/* Graphic Avatar Centerpiece with OVR Badge */}
            <div className="relative flex items-center justify-center py-1">
              <div className="relative">
                <div className="absolute -inset-1.5 bg-[#FFCC00] border-2 border-black rounded-2xl transform translate-x-1.5 translate-y-1.5" />
                <div className="relative w-20 h-20 rounded-2xl border-[2.5px] border-black bg-white flex flex-col items-center justify-center shadow-brutal-sm">
                  {position === 'GK' ? (
                    <Shield className="w-9 h-9 text-black" />
                  ) : (
                    <User className="w-9 h-9 text-black" />
                  )}
                  <span className="font-black font-mono text-[11px] bg-[#FFCC00] px-1.5 py-0.2 rounded border border-black mt-0.5">
                    {position} · {currentAbility}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields: Name & Age */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Nome do Atleta
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={position === 'GK' ? 'Ex: Dida Silveira' : 'Ex: Lucas Silveira'}
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black focus:bg-yellow-50 focus:outline-none shadow-brutal-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                  Idade
                </label>
                <select
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold font-mono text-black shadow-brutal-sm focus:outline-none"
                >
                  <option value={17}>17 anos</option>
                  <option value={18}>18 anos</option>
                  <option value={19}>19 anos</option>
                  <option value={20}>20 anos</option>
                </select>
              </div>
            </div>

            {/* Position Selector (Including GK / Goleiro!) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-black">
                  Posição em Campo
                </label>
                <span className="text-[9px] font-mono font-bold text-stone-500">
                  {position === 'GK' ? 'GUARDIAO DAS REDES' : 'JOGADOR DE LINHA'}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {(['GK', 'ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB'] as PositionCode[]).map((posCode) => {
                  const isSelected = position === posCode;
                  const isGoalkeeper = posCode === 'GK';

                  return (
                    <button
                      key={posCode}
                      type="button"
                      onClick={() => {
                        playTacticalClick();
                        setPosition(posCode);
                        if (posCode === 'GK') {
                          setArchetype('REFLEXO');
                        } else if (archetype === 'REFLEXO' || archetype === 'MURALHA' || archetype === 'LIBERO') {
                          setArchetype('TECNICO');
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg border-2 border-black text-center transition-all ${
                        isSelected
                          ? 'bg-[#FFCC00] font-black shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]'
                          : isGoalkeeper
                          ? 'bg-amber-100 font-extrabold text-black hover:bg-amber-200'
                          : 'bg-white font-bold text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-mono text-xs flex items-center justify-center gap-0.5">
                        {isGoalkeeper && <Shield className="w-3 h-3 text-black" />}
                        <span>{posCode}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Archetype Selector (Customized for GK or Outfield) */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-black mb-1">
                Arquétipo Tático Inicial
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {position === 'GK'
                  ? [
                      { id: 'REFLEXO', name: 'Reflexos', desc: 'Reflexos & Salto' },
                      { id: 'MURALHA', name: 'Muralha', desc: 'Firmeza & Posic.' },
                      { id: 'LIBERO', name: 'Líbero', desc: 'Pés & Saída 1x1' },
                    ].map((arch) => (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => {
                          playTacticalClick();
                          setArchetype(arch.id);
                        }}
                        className={`p-2 rounded-xl border-2 border-black text-left transition-all ${
                          archetype === arch.id
                            ? 'bg-[#FFCC00] shadow-brutal-sm'
                            : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-extrabold text-[11px] uppercase leading-tight">{arch.name}</div>
                        <div className="text-[9px] text-stone-700 mt-0.5">{arch.desc}</div>
                      </button>
                    ))
                  : [
                      { id: 'EXPLOSIVO', name: 'Explosivo', desc: 'Ritmo & Força' },
                      { id: 'TECNICO', name: 'Técnico', desc: 'Drible & Passe' },
                      { id: 'EQUILIBRADO', name: 'Operário', desc: 'Foco & Equipe' },
                    ].map((arch) => (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => {
                          playTacticalClick();
                          setArchetype(arch.id);
                        }}
                        className={`p-2 rounded-xl border-2 border-black text-left transition-all ${
                          archetype === arch.id
                            ? 'bg-[#FFCC00] shadow-brutal-sm'
                            : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-extrabold text-[11px] uppercase leading-tight">{arch.name}</div>
                        <div className="text-[9px] text-stone-700 mt-0.5">{arch.desc}</div>
                      </button>
                    ))}
              </div>
            </div>

            {/* Live Attribute Preview Table */}
            <div className="p-2.5 rounded-xl border-2 border-black bg-stone-50 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5 font-black text-[10px] uppercase">
                <span>ATRIBUTOS GERADOS EM TEMPO REAL</span>
                <span className="text-[#FFCC00] bg-black px-1.5 py-0.2 rounded font-mono">
                  {currentAbility} OVR
                </span>
              </div>

              {position === 'GK' ? (
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">REFLEXOS:</span>
                    <span className="font-black text-black">{tech.reflexos}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">ELASTICIDADE:</span>
                    <span className="font-black text-black">{tech.elasticidade}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">SEGURANÇA:</span>
                    <span className="font-black text-black">{tech.segurancaMao}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">POSICIONAMENTO:</span>
                    <span className="font-black text-black">{ment.posicionamento}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">SAÍDA DO GOL:</span>
                    <span className="font-black text-black">{tech.saidaDoGol}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">JOGO COM PÉS:</span>
                    <span className="font-black text-black">{tech.jogoComPes}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">FINALIZAÇÃO:</span>
                    <span className="font-black text-black">{tech.finalizacao}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">VELOCIDADE:</span>
                    <span className="font-black text-black">{phys.velocidade}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">PASSE CURTO:</span>
                    <span className="font-black text-black">{tech.passeCurto}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">DESARME:</span>
                    <span className="font-black text-black">{tech.desarme}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">VISÃO DE JOGO:</span>
                    <span className="font-black text-black">{ment.visaoDeJogo}</span>
                  </div>
                  <div className="flex items-center justify-between p-1 bg-white rounded border border-black">
                    <span className="text-stone-600 font-bold">COMPOSTURA:</span>
                    <span className="font-black text-black">{ment.compostura}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE STARTING CLUB */}
        {step === 2 && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {/* Player Profile Summary Banner */}
            <div className="p-3 rounded-2xl bg-[#FFCC00]/30 border-2 border-black shadow-brutal-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm">
                  {position === 'GK' ? <Shield className="w-5 h-5 text-black" /> : <User className="w-5 h-5 text-black" />}
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-stone-700">
                    ATLETA PRONTO
                  </div>
                  <div className="text-sm font-black uppercase text-black leading-tight">
                    {name} ({position})
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-lg font-black text-black bg-[#FFCC00] px-2 py-0.5 rounded-lg border border-black">
                  {currentAbility} OVR
                </span>
              </div>
            </div>

            {/* Instruction Headline */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tight text-black leading-none">
                  5 PROPOSTAS INICIAIS RECEBIDAS
                </h2>
                <span className="text-[10px] font-mono font-black bg-[#FFCC00] px-2 py-0.5 rounded border border-black">
                  5 CLUBES
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-snug font-medium">
                Por ser um jovem recruta ({currentAbility} OVR), clubes de elite ainda não oferecem contratos. Estes <strong>5 clubes de rating compatível</strong> formalizaram propostas oficiais:
              </p>
            </div>

            {/* 5 Club Proposition Cards */}
            <div className="space-y-2 max-h-[330px] overflow-y-auto custom-scrollbar pr-0.5">
              {suggestedClubs.map((club, idx) => {
                const isSelected = selectedClubId === club.id;
                const clubOvr = getClubAverageOvr(club);
                const weeklyWage =
                  club.tier === 2 ? '2.200' : club.tier === 4 ? '1.200' : '650';

                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => {
                      playTacticalClick();
                      setSelectedClubId(club.id);
                    }}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 border-black text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#FFCC00] shadow-brutal translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-stone-50 shadow-brutal-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Proposition Number & Club Badge */}
                      <div className="relative shrink-0">
                        <div
                          className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-black font-mono text-xs shadow-brutal-sm"
                          style={{ backgroundColor: club.color, color: club.accentColor }}
                        >
                          {club.shortName}
                        </div>
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-black text-[#FFCC00] border border-white text-[9px] font-mono font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-black text-xs uppercase text-black flex items-center gap-1.5 truncate">
                          <span className="truncate">{club.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-black shrink-0">
                            Tier {club.tier}
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-stone-700 font-mono mt-0.5 truncate flex items-center gap-2">
                          <span>{club.league}</span>
                          <span>·</span>
                          <span className="font-bold text-black">Média: ~{clubOvr} OVR</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px] shrink-0 pl-2">
                      <div className="font-black text-black">
                        €{weeklyWage}/sem
                      </div>
                      <div className="text-stone-600 text-[9px] font-bold">2 ANOS · BASE</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Contract Terms Box for Selected Club */}
            <div className="p-3 rounded-2xl border-2 border-black bg-stone-50 font-mono text-[10px] space-y-1 shrink-0">
              <div className="font-black border-b border-black pb-1 flex items-center justify-between">
                <span>TERMOS DA PROPOSTA: {selectedClub.name}</span>
                <span className="text-emerald-700">VÍNCULO OFICIAL</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-stone-700 pt-1">
                <div>
                  Salário Semanal:{' '}
                  <strong>
                    €
                    {selectedClub.tier === 1
                      ? '5.500'
                      : selectedClub.tier === 2
                      ? '2.200'
                      : selectedClub.tier === 4
                      ? '1.200'
                      : '650'}
                  </strong>
                </div>
                <div>Papel Prometido: <strong>Jovem Desenv.</strong></div>
                <div>
                  Multa Rescisória:{' '}
                  <strong>
                    €
                    {selectedClub.tier === 1
                      ? '15.000.000'
                      : selectedClub.tier === 2
                      ? '4.500.000'
                      : selectedClub.tier === 4
                      ? '1.200.000'
                      : '400.000'}
                  </strong>
                </div>
                <div>
                  Bônus por Partida:{' '}
                  <strong>
                    €
                    {selectedClub.tier === 1
                      ? '800'
                      : selectedClub.tier === 2
                      ? '400'
                      : selectedClub.tier === 4
                      ? '200'
                      : '100'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Block */}
        <div className="p-4 pt-2.5 bg-white border-t-[2px] border-black space-y-2 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToClubSelection}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-[2.5px] border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-brutal text-black font-black text-xs uppercase tracking-wide transition-all"
            >
              <span>AVANÇAR PARA ESCOLHA DO CLUBE (Passo 1/2)</span>
              <div className="w-7 h-7 rounded-lg border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFinalizeContract}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-[2.5px] border-black bg-[#FFCC00] hover:bg-[#ffdb33] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-brutal text-black font-black text-xs uppercase tracking-wide transition-all"
              >
                <span>ASSINAR COM {selectedClub.shortName} & INICIAR ({currentAbility} OVR)</span>
                <div className="w-7 h-7 rounded-lg border-2 border-black bg-black text-[#FFCC00] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-1 text-center font-mono font-bold text-[10px] text-stone-500 hover:text-black uppercase underline"
              >
                ← Voltar e ajustar características do atleta
              </button>
            </div>
          )}

          {/* Diagonal Hazard Stripes Bottom Border Accent */}
          <div className="w-full h-2.5 rounded-full border border-black bg-hazard-stripes" />
        </div>
      </div>
    </div>
  );
};
