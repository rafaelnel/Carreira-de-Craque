import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Star,
  Shield,
  Zap,
  Flame,
  X,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { GameState, PositionCode } from '../types/game';
import { playWhistle, playBallKick } from '../utils/audio';

interface SeasonAwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  initialSeasonNumber?: number;
}

interface AwardItem {
  id: string;
  code: string;
  title: string;
  category: 'INDIVIDUAL' | 'COLLECTIVE';
  icon: string;
  status: 'WON' | 'FINALIST' | 'CANDIDATE' | 'LOCKED';
  statusLabel: string;
  metricLabel: string;
  metricValue: string | number;
  thresholdLabel: string;
  progressPercent: number; // 0 to 100
  rivalInfo: string;
  description: string;
  hypeReward: number;
}

export const SeasonAwardsModal: React.FC<SeasonAwardsModalProps> = ({
  isOpen,
  onClose,
  state,
  initialSeasonNumber,
}) => {
  const { player, currentClub, season, fixtures } = state;
  const isGK = player.position === 'GK';

  // Selected season for inspection (either current live season or any past season from player.history)
  const availableSeasons = useMemo(() => {
    const list: { seasonNumber: number; label: string; isCurrent: boolean }[] = [];
    // Current in-progress season
    list.push({ seasonNumber: season, label: `Temporada ${season} (Atual)`, isCurrent: true });
    // Past completed seasons
    player.history.forEach((h) => {
      if (!list.some((item) => item.seasonNumber === h.seasonNumber)) {
        list.push({ seasonNumber: h.seasonNumber, label: `Temporada ${h.seasonNumber} (${h.year})`, isCurrent: false });
      }
    });
    // Sort descending
    return list.sort((a, b) => b.seasonNumber - a.seasonNumber);
  }, [season, player.history]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    initialSeasonNumber ?? season
  );
  const [filter, setFilter] = useState<'ALL' | 'WON' | 'INDIVIDUAL' | 'COLLECTIVE'>('ALL');

  // Compute seasonal statistics for the selected season
  const activeSeasonData = useMemo(() => {
    if (selectedSeasonNumber === season) {
      // Current season calculated from fixtures
      const played = fixtures.filter((f) => f.played && f.playerMatchStats);
      const playedCount = played.filter((f) => f.playerMatchStats!.minutesPlayed > 0).length;
      const goals = played.reduce((acc, f) => acc + f.playerMatchStats!.goals, 0);
      const assists = played.reduce((acc, f) => acc + f.playerMatchStats!.assists, 0);
      const saves = played.reduce((acc, f) => acc + (f.playerMatchStats!.saves || 0), 0);
      const cleanSheets = played.filter((f) => Boolean(f.playerMatchStats!.cleanSheet)).length;
      
      const ratings = played
        .filter((f) => f.playerMatchStats!.minutesPlayed > 0)
        .map((f) => f.playerMatchStats!.matchRating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const teamWins = played.filter(
        (f) =>
          (f.homeClub.id === currentClub.id && f.homeScore! > f.awayScore!) ||
          (f.awayClub.id === currentClub.id && f.awayScore! > f.homeScore!)
      ).length;
      const teamDraws = played.filter((f) => f.homeScore === f.awayScore).length;
      const teamPoints = teamWins * 3 + teamDraws;

      return {
        isLive: true,
        seasonNumber: season,
        year: state.currentYear,
        clubName: currentClub.name,
        leagueName: currentClub.league,
        matchesPlayed: playedCount,
        goals,
        assists,
        saves,
        cleanSheets,
        avgRating: Math.round(avgRating * 10) / 10,
        teamWins,
        teamPoints,
        totalWeeks: state.totalWeeksInSeason,
        currentWeek: state.currentWeek,
      };
    } else {
      // Historical season from player.history
      const hist = player.history.find((h) => h.seasonNumber === selectedSeasonNumber);
      if (hist) {
        return {
          isLive: false,
          seasonNumber: hist.seasonNumber,
          year: hist.year,
          clubName: hist.clubName,
          leagueName: hist.leagueName,
          matchesPlayed: hist.matchesPlayed,
          goals: hist.goals,
          assists: hist.assists,
          saves: hist.saves || 0,
          cleanSheets: hist.cleanSheets || 0,
          avgRating: hist.averageRating,
          teamWins: Math.round(hist.matchesPlayed * 0.55),
          teamPoints: Math.round(hist.matchesPlayed * 1.8),
          totalWeeks: 38,
          currentWeek: 38,
        };
      }
      return null;
    }
  }, [selectedSeasonNumber, season, state.currentYear, currentClub, fixtures, player.history, state.totalWeeksInSeason, state.currentWeek]);

  // Player's won trophies in this specific season
  const seasonWonTrophies = useMemo(() => {
    return (player.trophiesGallery || []).filter((t) => t.season === selectedSeasonNumber);
  }, [player.trophiesGallery, selectedSeasonNumber]);

  // Compute awards criteria and standings
  const awardsList: AwardItem[] = useMemo(() => {
    if (!activeSeasonData) return [];

    const d = activeSeasonData;
    const isLive = d.isLive;
    const list: AwardItem[] = [];

    // Check if player unlocked trophy code in this season
    const hasUnlocked = (code: string) => seasonWonTrophies.some((t) => t.code === code);

    // 1. BOLA DE OURO / CRAQUE DO CAMPEONATO (MVP)
    {
      const won = hasUnlocked('BOLA_DE_OURO');
      const meetsCriteria = d.matchesPlayed >= 18 && d.avgRating >= 7.30;
      const isFinalist = d.matchesPlayed >= 12 && d.avgRating >= 7.15;
      const progress = Math.min(100, Math.round((d.avgRating / 7.30) * 100));

      list.push({
        id: 'award_mvp',
        code: 'BOLA_DE_OURO',
        title: 'Bola de Ouro / Craque da Temporada',
        category: 'INDIVIDUAL',
        icon: 'Crown',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🏆 VENCEDOR OFICIAL'
          : isLive && meetsCriteria
          ? '⭐ FAVORITO AO TÍTULO'
          : isFinalist
          ? '🥈 FINALISTA (TOP 3)'
          : '⏳ EM DISPUTA',
        metricLabel: 'Média de Nota',
        metricValue: d.avgRating > 0 ? d.avgRating.toFixed(1) : '-',
        thresholdLabel: 'Meta: Média ≥ 7.30 (min 18 jogos)',
        progressPercent: progress,
        rivalInfo: 'Concorrentes: Giorgian De Arrascaeta (8.1), Matheus Pereira (7.9)',
        description: 'Concedido ao jogador mais dominante e regular ao longo de todas as rodadas do campeonato.',
        hypeReward: 1200,
      });
    }

    // 2. CHUTEIRA DE OURO / ARTILHEIRO (or LUVA DE OURO for GK)
    if (isGK) {
      // Goalkeeper award: Luva de Ouro
      const won = hasUnlocked('LUVA_DE_OURO');
      const meetsCriteria = d.matchesPlayed >= 16 && (d.cleanSheets >= 10 || d.saves >= 45 || d.avgRating >= 7.10);
      const isFinalist = d.cleanSheets >= 6 || d.saves >= 30;
      const progress = Math.min(100, Math.round((d.cleanSheets / 12) * 100));

      list.push({
        id: 'award_golden_glove',
        code: 'LUVA_DE_OURO',
        title: 'Luva de Ouro / Melhor Goleiro',
        category: 'INDIVIDUAL',
        icon: 'Shield',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🧤 VENCEDOR DA LUVA DE OURO'
          : isLive && meetsCriteria
          ? '⭐ FAVORITO AO TÍTULO'
          : isFinalist
          ? '🥈 FINALISTA (TOP 3)'
          : '⏳ EM DISPUTA',
        metricLabel: 'Jogos sem Sofrer Gols / Defesas',
        metricValue: `${d.cleanSheets} SG · ${d.saves} Defesas`,
        thresholdLabel: 'Meta: 10+ Jogos sem Sofrer Gols',
        progressPercent: progress,
        rivalInfo: 'Rivais: Agustín Rossi (13 SG), Weverton (12 SG), John Victor (11 SG)',
        description: 'Prêmio concedido ao guarda-redes com maior número de partidas invictas e intervenções decisivas.',
        hypeReward: 1000,
      });
    } else {
      // Outfield award: Chuteira de Ouro
      const won = hasUnlocked('CHUTEIRA_DE_OURO');
      const meetsCriteria = d.goals >= 15;
      const isFinalist = d.goals >= 10;
      const progress = Math.min(100, Math.round((d.goals / 16) * 100));

      list.push({
        id: 'award_golden_boot',
        code: 'CHUTEIRA_DE_OURO',
        title: 'Chuteira de Ouro / Artilheiro do Ano',
        category: 'INDIVIDUAL',
        icon: 'Flame',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '⚽ ARTILHEIRO SUPREMO'
          : isLive && meetsCriteria
          ? '⭐ LÍDER DA ARTILHARIA'
          : isFinalist
          ? '🥈 VICE-ARTILHEIRO'
          : '⏳ EM BUSCA DA ARTILHARIA',
        metricLabel: 'Gols Marcados',
        metricValue: `${d.goals} Gols`,
        thresholdLabel: 'Meta: 16+ Gols para título isolado',
        progressPercent: progress,
        rivalInfo: 'Artilharia da Liga: Pedro (18 gols), Paulinho (16 gols), Calleri (15 gols)',
        description: 'Consagra o goleador máximo da liga com o troféu mais cobiçado pelos atacantes mundiais.',
        hypeReward: 1000,
      });
    }

    // 3. REI DAS ASSISTÊNCIAS (Líder em Passes Decisivos)
    if (!isGK) {
      const won = hasUnlocked('REI_DAS_ASSISTENCIAS');
      const meetsCriteria = d.assists >= 9;
      const isFinalist = d.assists >= 6;
      const progress = Math.min(100, Math.round((d.assists / 9) * 100));

      list.push({
        id: 'award_assist_king',
        code: 'REI_DAS_ASSISTENCIAS',
        title: 'Rei das Assistências / Maestro do Ano',
        category: 'INDIVIDUAL',
        icon: 'Zap',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🎯 MAESTRO CONSAGRADO'
          : isLive && meetsCriteria
          ? '⭐ LÍDER DE ASSISTÊNCIAS'
          : isFinalist
          ? '🥈 TOP 3 GARÇOM'
          : '⏳ EM DISPUTA',
        metricLabel: 'Passes para Gol',
        metricValue: `${d.assists} Assistências`,
        thresholdLabel: 'Meta: 9+ Passes para Gol',
        progressPercent: progress,
        rivalInfo: 'Ranking: Gustavo Scarpa (10 ast), Everton Ribeiro (9 ast), Ganso (8 ast)',
        description: 'Reconhece a genialidade dos armadores e a precisão milimétrica em passes para as redes.',
        hypeReward: 800,
      });
    }

    // 4. PAREDÃO DO ANO / MELHOR DEFENSOR (Zagueiros, Laterais, Volantes, Goleiro)
    {
      const won = hasUnlocked('PAREDAO_DO_ANO');
      const isDefensive = ['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position);
      const meetsCriteria = isDefensive && d.matchesPlayed >= 18 && d.avgRating >= 7.15;
      const isFinalist = isDefensive && d.matchesPlayed >= 12 && d.avgRating >= 7.0;
      const progress = isDefensive ? Math.min(100, Math.round((d.avgRating / 7.15) * 100)) : 25;

      list.push({
        id: 'award_best_defender',
        code: 'PAREDAO_DO_ANO',
        title: 'Paredão do Ano / Defensor Inabalável',
        category: 'INDIVIDUAL',
        icon: 'Shield',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🛡️ DEFENSOR DA TEMPORADA'
          : isLive && meetsCriteria
          ? '⭐ FAVORITO DA DEFESA'
          : isFinalist
          ? '🥈 FINALISTA TÁTICO'
          : '⏳ DISPUTANDO',
        metricLabel: isGK ? 'Média & Segurança' : 'Média Defensiva',
        metricValue: d.avgRating > 0 ? `${d.avgRating.toFixed(1)} nota` : '-',
        thresholdLabel: 'Meta: Média ≥ 7.15 em funções de retaguarda',
        progressPercent: progress,
        rivalInfo: 'Concorrentes: Thiago Silva (7.5), Gustavo Gómez (7.4), Vitão (7.3)',
        description: 'Dedicado aos defensores intransponíveis que garantem a segurança do setor recuado.',
        hypeReward: 850,
      });
    }

    // 5. REVELAÇÃO DO ANO (Sub-21)
    if (player.age <= 22) {
      const won = hasUnlocked('REVELACAO_DO_ANO');
      const meetsCriteria = d.matchesPlayed >= 15 && d.avgRating >= 6.95;
      const isFinalist = d.matchesPlayed >= 8 && d.avgRating >= 6.85;
      const progress = Math.min(100, Math.round((d.matchesPlayed / 15) * 100));

      list.push({
        id: 'award_rookie',
        code: 'REVELACAO_DO_ANO',
        title: `Revelação do Ano (${player.age} anos)`,
        category: 'INDIVIDUAL',
        icon: 'Star',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🌟 JOVEM CRAQUE CONSAGRADO'
          : isLive && meetsCriteria
          ? '⭐ FAVORITO A REVELAÇÃO'
          : isFinalist
          ? '🥈 CANDIDATO FORTE'
          : '⏳ EM DESENVOLVIMENTO',
        metricLabel: 'Partidas com Média Sólida',
        metricValue: `${d.matchesPlayed} Jogos · ${d.avgRating.toFixed(1)} Nota`,
        thresholdLabel: 'Meta: 15+ jogos com média ≥ 6.95',
        progressPercent: progress,
        rivalInfo: 'Jovens Prodígios: Estêvão (17a), Kauã Elias (18a), Breno Bidon (19a)',
        description: 'Prêmio concedido ao talento jovem mais impactante que despontou no cenário nacional.',
        hypeReward: 750,
      });
    }

    // 6. SELEÇÃO DO CAMPEONATO (11 Ideais)
    {
      const won = hasUnlocked('SELECAO_DO_CAMPEONATO');
      const meetsCriteria = d.matchesPlayed >= 18 && d.avgRating >= 7.10;
      const isFinalist = d.matchesPlayed >= 12 && d.avgRating >= 6.95;
      const progress = Math.min(100, Math.round((d.avgRating / 7.10) * 100));

      list.push({
        id: 'award_team_of_season',
        code: 'SELECAO_DO_CAMPEONATO',
        title: 'Seleção do Campeonato / 11 Ideais',
        category: 'INDIVIDUAL',
        icon: 'Medal',
        status: won ? 'WON' : isLive && meetsCriteria ? 'WON' : isFinalist ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🥇 ESCALADO NO TIME IDEAL'
          : isLive && meetsCriteria
          ? '⭐ PROJETADO NO 11 TITULAR'
          : isFinalist
          ? '🥈 DISPUTANDO VAGA'
          : '⏳ EM ANÁLISE',
        metricLabel: 'Consistência Tática',
        metricValue: `${d.avgRating.toFixed(1)} Nota (${d.matchesPlayed} Jogos)`,
        thresholdLabel: 'Meta: Média ≥ 7.10 com 18+ partidas',
        progressPercent: progress,
        rivalInfo: 'A votação dos técnicos e capitães elege os melhores de cada setor.',
        description: 'Vaga entre os 11 atletas mais brilhantes do campeonato na sua posição específica.',
        hypeReward: 600,
      });
    }

    // 7. TÍTULO COLETIVO: CAMPEÃO NACIONAL
    {
      const won = hasUnlocked('CAMPEAO_NACIONAL');
      const isChampionTrack = d.teamPoints >= 76;
      const isVice = hasUnlocked('VICE_CAMPEAO_NACIONAL') || (d.teamPoints >= 68 && d.teamPoints < 76);
      const progress = Math.min(100, Math.round((d.teamPoints / 78) * 100));

      list.push({
        id: 'award_champion',
        code: 'CAMPEAO_NACIONAL',
        title: `Título da Liga: ${d.leagueName}`,
        category: 'COLLECTIVE',
        icon: 'Trophy',
        status: won ? 'WON' : isLive && isChampionTrack ? 'WON' : isVice ? 'FINALIST' : 'CANDIDATE',
        statusLabel: won
          ? '🏆 CAMPEÃO INCONTESTÁVEL'
          : isLive && isChampionTrack
          ? '⭐ LÍDER RUMO AO TÍTULO'
          : isVice
          ? '🥈 ZONA DE G-4 / VICE-LIDERANÇA'
          : '⏳ EM DISPUTA',
        metricLabel: 'Pontos do Clube',
        metricValue: `${d.teamPoints} Pontos (${d.teamWins} Vitórias)`,
        thresholdLabel: 'Meta Campeão: ~76 a 82 Pontos',
        progressPercent: progress,
        rivalInfo: 'Disputa de topo: Palmeiras (74 pts), Flamengo (72 pts), Botafogo (71 pts)',
        description: 'A taça mais cobiçada do calendário nacional, coroando a equipe mais regular do país.',
        hypeReward: 1500,
      });
    }

    // 8. TÍTULO COLETIVO: COPA NACIONAL (Mata-mata)
    {
      const won = hasUnlocked('TACA_DA_COPA');
      list.push({
        id: 'award_cup',
        code: 'TACA_DA_COPA',
        title: 'Taça da Copa Nacional (Mata-Mata)',
        category: 'COLLECTIVE',
        icon: 'Award',
        status: won ? 'WON' : 'CANDIDATE',
        statusLabel: won ? '🏆 CAMPEÃO DA COPA' : '⏳ MATA-MATA EM ABERTO',
        metricLabel: 'Fase Eliminatória',
        metricValue: won ? 'Campeão da Final' : 'Fases Eliminatórias',
        thresholdLabel: 'Decidido em confrontos mata-mata com fator decisivo',
        progressPercent: won ? 100 : 50,
        rivalInfo: 'Torneio imprevisível de alta tensão onde cada gol fora de casa conta.',
        description: 'Conquista da taça nacional de mata-mata com drama e glória eterna.',
        hypeReward: 1000,
      });
    }

    return list;
  }, [activeSeasonData, seasonWonTrophies, isGK, player.position, player.age]);

  // Filtered awards
  const filteredAwards = useMemo(() => {
    return awardsList.filter((item) => {
      if (filter === 'WON') return item.status === 'WON';
      if (filter === 'INDIVIDUAL') return item.category === 'INDIVIDUAL';
      if (filter === 'COLLECTIVE') return item.category === 'COLLECTIVE';
      return true;
    });
  }, [awardsList, filter]);

  const wonCount = useMemo(() => {
    return awardsList.filter((a) => a.status === 'WON').length;
  }, [awardsList]);

  if (!isOpen || !activeSeasonData) return null;

  const renderIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'Award':
      default:
        return <Award className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border-4 border-black shadow-brutal-xl rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Gala Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-300 via-[#FFCC00] to-amber-400 border-b-4 border-black flex items-center justify-between shrink-0 relative overflow-hidden">
          {/* Decorative Sparkles / Stripes */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/20 skew-x-12 pointer-events-none" />

          <div className="flex items-center gap-2.5 sm:gap-3 z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black text-[#FFCC00] border-2 border-black flex items-center justify-center shadow-brutal-sm shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono flex items-center gap-1.5 flex-wrap">
                <span className="bg-black text-[#FFCC00] px-1.5 py-0.5 rounded text-[9px] font-black">
                  GALA OFICIAL DE PREMIAÇÕES
                </span>
                <span>{activeSeasonData.leagueName}</span>
              </div>
              <h1 className="text-base sm:text-xl font-black uppercase text-black leading-tight mt-0.5">
                Cerimônia de Prêmios da Temporada
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              playBallKick();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-stone-100 text-black border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all z-10"
            title="Fechar Cerimônia"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Season Selector Bar & Quick Stats Strip */}
        <div className="p-3 bg-white border-b-2 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 font-mono">
          {/* Season Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <span className="text-[10px] font-black uppercase text-stone-600 shrink-0">TEMPORADA:</span>
            {availableSeasons.map((s) => (
              <button
                key={s.seasonNumber}
                onClick={() => {
                  playBallKick();
                  setSelectedSeasonNumber(s.seasonNumber);
                }}
                className={`px-2.5 py-1 rounded-xl border-2 border-black text-xs font-black transition-all shrink-0 ${
                  selectedSeasonNumber === s.seasonNumber
                    ? 'bg-black text-[#FFCC00] shadow-brutal-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                {s.isCurrent ? `T${s.seasonNumber} (Atual)` : `T${s.seasonNumber}`}
              </button>
            ))}
          </div>

          {/* Player Badge */}
          <div className="flex items-center gap-2 text-xs font-black self-end sm:self-auto">
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 border border-black text-black">
              {player.name} ({player.currentAbility} OVR)
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-black text-emerald-950">
              {wonCount} Conquistado{wonCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Seasonal Stat Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2.5 bg-stone-100 border-b-2 border-black font-mono text-center shrink-0">
          <div className="p-1.5 rounded-xl border border-black bg-white">
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500">JOGOS</div>
            <div className="text-sm sm:text-base font-black text-black">{activeSeasonData.matchesPlayed}</div>
          </div>

          <div className="p-1.5 rounded-xl border border-black bg-white">
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500">
              {isGK ? 'DEFESAS' : 'GOLS'}
            </div>
            <div className="text-sm sm:text-base font-black text-black">
              {isGK ? activeSeasonData.saves : activeSeasonData.goals}
            </div>
          </div>

          <div className="p-1.5 rounded-xl border border-black bg-white">
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500">
              {isGK ? 'JOGOS SG' : 'ASSISTÊNCIAS'}
            </div>
            <div className="text-sm sm:text-base font-black text-black">
              {isGK ? activeSeasonData.cleanSheets : activeSeasonData.assists}
            </div>
          </div>

          <div className="p-1.5 rounded-xl border border-black bg-white">
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500">MÉDIA TEMPORADA</div>
            <div className="text-sm sm:text-base font-black text-black">
              {activeSeasonData.avgRating > 0 ? activeSeasonData.avgRating.toFixed(1) : '-'}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-1.5 rounded-xl border border-black bg-[#FFCC00]/30">
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-700">PONTOS DO CLUBE</div>
            <div className="text-sm sm:text-base font-black text-black">
              {activeSeasonData.teamPoints} pts
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="p-2 sm:px-4 bg-white border-b-2 border-black flex items-center justify-between gap-1 shrink-0 font-mono text-[10px] sm:text-xs font-black">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl border-2 border-black transition-all ${
                filter === 'ALL' ? 'bg-[#FFCC00] text-black shadow-brutal-sm' : 'bg-white text-stone-600'
              }`}
            >
              TODOS ({awardsList.length})
            </button>
            <button
              onClick={() => setFilter('WON')}
              className={`px-2.5 py-1 rounded-xl border-2 border-black transition-all ${
                filter === 'WON' ? 'bg-[#FFCC00] text-black shadow-brutal-sm' : 'bg-white text-stone-600'
              }`}
            >
              CONQUISTADOS 🏆 ({wonCount})
            </button>
            <button
              onClick={() => setFilter('INDIVIDUAL')}
              className={`px-2.5 py-1 rounded-xl border-2 border-black transition-all ${
                filter === 'INDIVIDUAL' ? 'bg-[#FFCC00] text-black shadow-brutal-sm' : 'bg-white text-stone-600'
              }`}
            >
              INDIVIDUAIS ⭐
            </button>
            <button
              onClick={() => setFilter('COLLECTIVE')}
              className={`px-2.5 py-1 rounded-xl border-2 border-black transition-all ${
                filter === 'COLLECTIVE' ? 'bg-[#FFCC00] text-black shadow-brutal-sm' : 'bg-white text-stone-600'
              }`}
            >
              TÍTULOS COLETIVOS 🛡️
            </button>
          </div>

          <div className="text-[10px] text-stone-500 font-bold hidden sm:block">
            {activeSeasonData.isLive ? '🔴 PROJEÇÃO AO VIVO' : '📜 REGISTRO OFICIAL'}
          </div>
        </div>

        {/* Awards Cards Grid (Scrollable internally) */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar space-y-2.5 bg-[#FBFBFA]">
          {filteredAwards.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-stone-500 space-y-2">
              <Trophy className="w-8 h-8 mx-auto text-stone-400 stroke-1" />
              <p className="font-bold">Nenhuma premiação encontrada para este filtro nesta temporada.</p>
            </div>
          ) : (
            filteredAwards.map((award) => {
              const isWon = award.status === 'WON';
              const isFinalist = award.status === 'FINALIST';

              return (
                <div
                  key={award.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border-2 border-black font-mono transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isWon
                      ? 'bg-gradient-to-r from-amber-100 via-amber-50 to-white shadow-brutal'
                      : isFinalist
                      ? 'bg-stone-50 border-stone-800 shadow-brutal-sm'
                      : 'bg-white/80 opacity-80'
                  }`}
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl border-2 border-black flex items-center justify-center shrink-0 shadow-brutal-sm ${
                        isWon
                          ? 'bg-[#FFCC00] text-black ring-2 ring-amber-400'
                          : isFinalist
                          ? 'bg-stone-200 text-stone-800'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {renderIcon(award.icon, 'w-5 h-5')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[9px] border border-black ${
                            isWon
                              ? 'bg-black text-[#FFCC00]'
                              : isFinalist
                              ? 'bg-sky-200 text-sky-950'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {award.statusLabel}
                        </span>
                        <span className="text-[9px] text-stone-500 font-bold uppercase">
                          {award.category === 'INDIVIDUAL' ? 'Prêmio Individual' : 'Título de Equipe'}
                        </span>
                      </div>

                      <h3 className="font-black text-sm sm:text-base text-black uppercase mt-0.5 truncate">
                        {award.title}
                      </h3>

                      <p className="text-[10.5px] text-stone-600 leading-snug line-clamp-2 mt-0.5">
                        {award.description}
                      </p>

                      {/* Criterion / Rivals */}
                      <div className="mt-1.5 text-[9.5px] text-stone-500 font-medium">
                        <span className="font-bold text-stone-700">{award.thresholdLabel}</span>
                        {award.rivalInfo && (
                          <span className="block text-stone-500 truncate mt-0.5 italic">
                            {award.rivalInfo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Progress */}
                  <div className="w-full sm:w-56 shrink-0 flex flex-col justify-between items-start sm:items-end border-t sm:border-t-0 sm:border-l-2 border-black/10 pt-2 sm:pt-0 sm:pl-3 space-y-1.5">
                    <div className="w-full text-left sm:text-right">
                      <div className="text-[9px] font-black uppercase text-stone-500">
                        {award.metricLabel}
                      </div>
                      <div className="text-base sm:text-lg font-black text-black leading-tight">
                        {award.metricValue}
                      </div>
                    </div>

                    {/* Progress Bar towards award */}
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-[8.5px] font-black text-stone-600">
                        <span>PROGRESSO</span>
                        <span>{award.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full border border-black bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isWon ? 'bg-[#FFCC00]' : isFinalist ? 'bg-sky-400' : 'bg-stone-400'
                          }`}
                          style={{ width: `${award.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Hype Reward Tag */}
                    <div className="text-[9px] font-bold text-stone-600 self-end">
                      Recompensa:{' '}
                      <span className="font-black text-emerald-700">+{award.hypeReward} Hype</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Strip */}
        <div className="p-3 bg-white border-t-2 border-black flex items-center justify-between font-mono text-[10px] sm:text-xs shrink-0">
          <div className="text-stone-600">
            <strong>GALA DE OURO:</strong> Os prêmios são outorgados com base nas notas médias, estatísticas da temporada e desempenho do clube.
          </div>

          <button
            onClick={() => {
              playWhistle('short');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-black hover:bg-stone-900 text-[#FFCC00] font-black border-2 border-black shadow-brutal-sm uppercase shrink-0 transition-all active:translate-x-[1px] active:translate-y-[1px]"
          >
            FECHAR GALA
          </button>
        </div>
      </div>
    </div>
  );
};
