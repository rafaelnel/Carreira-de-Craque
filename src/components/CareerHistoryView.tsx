import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Flame,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Calendar,
  Lock,
  BarChart3,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { GameState, TrophyAward } from '../types/game';
import { TROPHIES_CATALOGUE } from '../utils/constants';
import { SeasonAwardsModal } from './SeasonAwardsModal';

interface CareerHistoryViewProps {
  state: GameState;
}

type TabType = 'CHART' | 'TROPHIES' | 'SEASONS';

export const CareerHistoryView: React.FC<CareerHistoryViewProps> = ({ state }) => {
  const { player, currentClub, season, currentYear, fixtures } = state;
  const career = player.careerStats;

  const [activeTab, setActiveTab] = useState<TabType>('CHART');
  const [trophyFilter, setTrophyFilter] = useState<'ALL' | 'COLLECTIVE' | 'INDIVIDUAL' | 'UNLOCKED'>('ALL');
  const [chartMetric, setChartMetric] = useState<'RATINGS' | 'GOALS'>('RATINGS');
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);
  const [awardsModalSeason, setAwardsModalSeason] = useState(season);

  // Prepare current season match-by-match trajectory data for Recharts
  const chartData = useMemo(() => {
    const playedFixtures = fixtures
      .filter((f) => f.played && f.playerMatchStats)
      .sort((a, b) => a.week - b.week);

    let cumulativeRatingSum = 0;
    let playedMatchCount = 0;

    return playedFixtures.map((f) => {
      const stats = f.playerMatchStats!;
      const isHome = f.homeClub.id === currentClub.id;
      const opponent = isHome ? f.awayClub : f.homeClub;
      const myScore = isHome ? f.homeScore : f.awayScore;
      const oppScore = isHome ? f.awayScore : f.homeScore;

      const result = myScore! > oppScore! ? 'V' : myScore! === oppScore! ? 'E' : 'D';

      if (stats.minutesPlayed > 0) {
        playedMatchCount++;
        cumulativeRatingSum += stats.matchRating;
      }

      const runningAverage =
        playedMatchCount > 0 ? Math.round((cumulativeRatingSum / playedMatchCount) * 10) / 10 : 0;

      return {
        rodada: `R${f.week}`,
        week: f.week,
        rating: stats.minutesPlayed > 0 ? stats.matchRating : null,
        mediaAcumulada: stats.minutesPlayed > 0 ? runningAverage : null,
        gols: stats.goals,
        assists: stats.assists,
        defesas: stats.saves || 0,
        cleanSheet: Boolean(stats.cleanSheet),
        minutos: stats.minutesPlayed,
        adversario: opponent.shortName,
        placar: `${f.homeScore}x${f.awayScore}`,
        resultado: result,
      };
    });
  }, [fixtures, currentClub.id]);

  // Current season performance metrics
  const seasonStats = useMemo(() => {
    const validRatings = chartData
      .filter((d) => d.rating !== null && d.rating > 0)
      .map((d) => d.rating as number);

    const maxRating = validRatings.length > 0 ? Math.max(...validRatings) : 0;
    const minRating = validRatings.length > 0 ? Math.min(...validRatings) : 0;
    const seasonAvg =
      validRatings.length > 0
        ? Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 10) / 10
        : 0;

    const seasonGoals = chartData.reduce((acc, d) => acc + d.gols, 0);
    const seasonAssists = chartData.reduce((acc, d) => acc + d.assists, 0);
    const seasonSaves = chartData.reduce((acc, d) => acc + (d.defesas || 0), 0);
    const seasonCleanSheets = chartData.filter((d) => d.cleanSheet).length;

    return {
      played: validRatings.length,
      maxRating,
      minRating,
      seasonAvg,
      seasonGoals,
      seasonAssists,
      seasonSaves,
      seasonCleanSheets,
    };
  }, [chartData]);

  // Player's trophies gallery
  const unlockedTrophies: TrophyAward[] = useMemo(() => {
    return player.trophiesGallery || [];
  }, [player.trophiesGallery]);

  // Filter trophies for the Trophy Cabinet
  const filteredTrophiesCatalogue = useMemo(() => {
    return TROPHIES_CATALOGUE.filter((item) => {
      const isUnlocked = unlockedTrophies.some((t) => t.code === item.code);
      if (trophyFilter === 'UNLOCKED') return isUnlocked;
      if (trophyFilter === 'COLLECTIVE') return item.category === 'COLLECTIVE';
      if (trophyFilter === 'INDIVIDUAL') return item.category === 'INDIVIDUAL';
      return true;
    });
  }, [trophyFilter, unlockedTrophies]);

  // Render Icon according to Trophy Definition
  const renderTrophyIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      default:
        return <Trophy className={className} />;
    }
  };

  const isGK = player.position === 'GK';
  const totalCareerCleanSheets =
    (player.careerStats.totalCleanSheets || 0) +
    player.history.reduce((acc, h) => acc + (h.cleanSheets || 0), 0) +
    seasonStats.seasonCleanSheets;
  const totalCareerSaves =
    (player.careerStats.totalSaves || 0) +
    player.history.reduce((acc, h) => acc + (h.saves || 0), 0) +
    seasonStats.seasonSaves;

  return (
    <div className="h-full w-full p-2.5 sm:p-4 flex flex-col justify-between overflow-hidden select-none space-y-2">
      {/* Top Banner (Static) */}
      <div className="p-3 rounded-2xl bg-white border-[2.5px] border-black shadow-brutal flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-black font-mono flex items-center gap-1.5 flex-wrap">
            <span>MEMORIAL & CARREIRA PROFISSIONAL</span>
            {player.isRetired ? (
              <span className="px-1.5 py-0.5 rounded bg-black text-[#FFCC00] font-black text-[9px]">
                APOSENTADO ({player.age}a)
              </span>
            ) : player.age >= 35 ? (
              <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-950 font-black text-[9px]">
                VETERANO ({player.age}a)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[9px]">
                EM ATIVIDADE ({player.age}a)
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-black leading-tight mt-0.5">
            {player.name} · {player.currentAbility} OVR
          </h1>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-black shrink-0">
          <button
            onClick={() => {
              setAwardsModalSeason(season);
              setIsAwardsModalOpen(true);
            }}
            className="p-1 px-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#FFCC00] text-black border-2 border-black shadow-brutal-sm flex items-center gap-1 hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-[10px] sm:text-xs"
            title="Abrir Cerimônia de Premiações da Temporada"
          >
            <Award className="w-3.5 h-3.5" />
            <span>GALA DE PRÊMIOS</span>
          </button>
          <div className="p-1 px-2 rounded-xl bg-black text-[#FFCC00] border-2 border-black shadow-brutal-sm text-[10px] hidden sm:block">
            AUGE: {player.peakAbility || player.currentAbility}
          </div>
          <div className="p-1 px-2.5 rounded-xl bg-[#FFCC00] text-black border-2 border-black shadow-brutal-sm flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>{unlockedTrophies.length} CONQUISTAS</span>
          </div>
        </div>
      </div>

      {/* Career KPI Grid (Static) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center font-mono shrink-0">
        <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
          <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-600">JOGOS</div>
          <div className="text-base sm:text-lg font-black text-black leading-none mt-0.5">{career.totalMatches}</div>
        </div>

        <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
          <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-600">
            {isGK ? 'DEFESAS' : 'GOLS'}
          </div>
          <div className="text-base sm:text-lg font-black text-black leading-none mt-0.5">
            {isGK ? totalCareerSaves : career.totalGoals}
          </div>
        </div>

        <div className="p-2 rounded-xl border-2 border-black bg-white shadow-brutal-sm">
          <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-600">
            {isGK ? 'JOGOS SG' : 'ASSIST'}
          </div>
          <div className="text-base sm:text-lg font-black text-black leading-none mt-0.5">
            {isGK ? totalCareerCleanSheets : career.totalAssists}
          </div>
        </div>

        <div className="p-2 rounded-xl border-2 border-black bg-[#FFCC00]/40 shadow-brutal-sm">
          <div className="text-[8px] sm:text-[9px] font-black uppercase text-stone-700">MÉDIA CARREIRA</div>
          <div className="text-base sm:text-lg font-black text-black leading-none mt-0.5">
            {career.avgRating > 0 ? career.avgRating.toFixed(1) : '-'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Static) */}
      <div className="flex items-center gap-1.5 border-b-2 border-black pb-1 shrink-0 font-mono text-[11px] font-black">
        <button
          onClick={() => setActiveTab('CHART')}
          className={`flex-1 py-1.5 px-2 rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'CHART'
              ? 'bg-[#FFCC00] text-black shadow-brutal-sm translate-y-[-1px]'
              : 'bg-white text-stone-700 hover:bg-stone-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>EVOLUÇÃO T{season}</span>
        </button>

        <button
          onClick={() => setActiveTab('TROPHIES')}
          className={`flex-1 py-1.5 px-2 rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'TROPHIES'
              ? 'bg-[#FFCC00] text-black shadow-brutal-sm translate-y-[-1px]'
              : 'bg-white text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>GALERIA DE TROFÉUS ({unlockedTrophies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SEASONS')}
          className={`flex-1 py-1.5 px-2 rounded-xl border-2 border-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'SEASONS'
              ? 'bg-[#FFCC00] text-black shadow-brutal-sm translate-y-[-1px]'
              : 'bg-white text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>HISTÓRICO</span>
        </button>
      </div>

      {/* Main Content Area (Strictly Scrollable Internally) */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border-[2.5px] border-black shadow-brutal p-3 flex flex-col overflow-hidden">
        {/* TAB 1: RECHARTS EVOLUTION TRAJECTORY */}
        {activeTab === 'CHART' && (
          <div className="h-full flex flex-col justify-between overflow-hidden space-y-2">
            {/* Chart Subheader & Controls */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-1.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FFCC00]" />
                  TRAJETÓRIA DE DESEMPENHO · TEMPORADA {season}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 border border-black">
                  {currentClub.shortName}
                </span>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 font-mono text-[10px] font-black">
                <button
                  onClick={() => setChartMetric('RATINGS')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    chartMetric === 'RATINGS' ? 'bg-black text-[#FFCC00]' : 'bg-white text-stone-700'
                  }`}
                >
                  NOTAS & MÉDIA
                </button>
                <button
                  onClick={() => setChartMetric('GOALS')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    chartMetric === 'GOALS' ? 'bg-black text-[#FFCC00]' : 'bg-white text-stone-700'
                  }`}
                >
                  GOLS & ASSIST
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px] shrink-0">
              <div className="p-1 rounded-lg border border-black bg-stone-50">
                <div className="text-[8px] font-bold text-stone-500 uppercase">JOGOS T{season}</div>
                <div className="font-black text-black">{seasonStats.played} / 38</div>
              </div>
              <div className="p-1 rounded-lg border border-black bg-[#FFCC00]/30">
                <div className="text-[8px] font-bold text-stone-700 uppercase">MÉDIA T{season}</div>
                <div className="font-black text-black">{seasonStats.seasonAvg > 0 ? seasonStats.seasonAvg.toFixed(1) : '-'}</div>
              </div>
              <div className="p-1 rounded-lg border border-black bg-emerald-50">
                <div className="text-[8px] font-bold text-emerald-800 uppercase">MAIOR NOTA</div>
                <div className="font-black text-emerald-900">{seasonStats.maxRating > 0 ? seasonStats.maxRating.toFixed(1) : '-'}</div>
              </div>
              <div className="p-1 rounded-lg border border-black bg-rose-50">
                <div className="text-[8px] font-bold text-rose-800 uppercase">MENOR NOTA</div>
                <div className="font-black text-rose-900">{seasonStats.minRating > 0 ? seasonStats.minRating.toFixed(1) : '-'}</div>
              </div>
              <div className="p-1 rounded-lg border border-black bg-stone-50">
                <div className="text-[8px] font-bold text-stone-500 uppercase">GOLS / ASSIST</div>
                <div className="font-black text-black">{seasonStats.seasonGoals} / {seasonStats.seasonAssists}</div>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="flex-1 min-h-[160px] w-full pt-1">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-stone-300 rounded-xl font-mono">
                  <BarChart3 className="w-8 h-8 text-stone-400 mb-1" />
                  <div className="font-black text-xs text-black uppercase">NENHUMA PARTIDA DISPUTADA NA TEMPORADA</div>
                  <div className="text-[10px] text-stone-500 max-w-sm mt-0.5">
                    Simule jogos na aba JOGO (rodada por rodada ou em lote) para gerar a trajetória de notas e evolução gráfica.
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="rodada"
                      tick={{ fill: '#000000', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                      tickLine={{ stroke: '#000000' }}
                    />
                    <YAxis
                      domain={chartMetric === 'RATINGS' ? [4.5, 10] : [0, 'dataMax + 1']}
                      tick={{ fill: '#000000', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                      tickLine={{ stroke: '#000000' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 rounded-xl bg-white border-2 border-black shadow-brutal-sm font-mono text-[10px]">
                              <div className="font-black border-b border-black pb-0.5 flex items-center justify-between gap-3">
                                <span>{label} vs {data.adversario}</span>
                                <span className="px-1 py-0.2 rounded bg-[#FFCC00] font-black">{data.placar} ({data.resultado})</span>
                              </div>
                              <div className="mt-1 space-y-0.5 text-black">
                                <div>Nota da Partida: <strong>{data.rating ?? 'Não atuou'}</strong></div>
                                <div>Média Acumulada: <strong>{data.mediaAcumulada ?? '-'}</strong></div>
                                <div>Gols / Assist: <strong>{data.gols}G / {data.assists}A</strong></div>
                                <div>Minutos: <strong>{data.minutos}&apos;</strong></div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}
                    />

                    {chartMetric === 'RATINGS' ? (
                      <>
                        <ReferenceLine
                          y={7.0}
                          stroke="#16a34a"
                          strokeDasharray="4 4"
                          label={{ value: 'Meta de Elite (7.0)', fill: '#16a34a', fontSize: 9, fontFamily: 'monospace' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          name="Nota na Rodada"
                          stroke="#FFCC00"
                          strokeWidth={2.5}
                          dot={{ fill: '#FFCC00', stroke: '#000000', strokeWidth: 1.5, r: 3.5 }}
                          activeDot={{ r: 5, stroke: '#000000', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="mediaAcumulada"
                          name="Média Acumulada"
                          stroke="#000000"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey="gols"
                          name="Gols Marcados"
                          stroke="#dc2626"
                          strokeWidth={2.5}
                          dot={{ fill: '#dc2626', stroke: '#000000', strokeWidth: 1.5, r: 3.5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="assists"
                          name="Assistências"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={{ fill: '#2563eb', stroke: '#000000', strokeWidth: 1.5, r: 3.5 }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="p-1.5 rounded-xl border border-black bg-stone-50 font-mono text-[9px] flex items-center justify-between text-stone-600 shrink-0">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-stone-500" />
                Notas acima de 7.0 aceleram convocação para a Seleção do Campeonato e prêmio de Bola de Ouro.
              </span>
              <span className="font-bold text-black uppercase">TEMPORADA REGULAR {season}</span>
            </div>
          </div>
        )}

        {/* TAB 2: TROPHIES & ACHIEVEMENTS CABINET */}
        {activeTab === 'TROPHIES' && (
          <div className="h-full flex flex-col justify-between overflow-hidden space-y-2">
            {/* Filter buttons */}
            <div className="flex items-center justify-between gap-1 border-b-2 border-black pb-1.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-1 font-mono text-[10px] font-black">
                <button
                  onClick={() => setTrophyFilter('ALL')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    trophyFilter === 'ALL' ? 'bg-[#FFCC00] text-black font-black' : 'bg-white text-stone-700'
                  }`}
                >
                  TODOS ({TROPHIES_CATALOGUE.length})
                </button>
                <button
                  onClick={() => setTrophyFilter('UNLOCKED')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    trophyFilter === 'UNLOCKED' ? 'bg-[#FFCC00] text-black font-black' : 'bg-white text-stone-700'
                  }`}
                >
                  CONQUISTADOS ({unlockedTrophies.length})
                </button>
                <button
                  onClick={() => setTrophyFilter('COLLECTIVE')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    trophyFilter === 'COLLECTIVE' ? 'bg-[#FFCC00] text-black font-black' : 'bg-white text-stone-700'
                  }`}
                >
                  COLETIVOS
                </button>
                <button
                  onClick={() => setTrophyFilter('INDIVIDUAL')}
                  className={`px-2 py-0.5 rounded-lg border border-black transition-all ${
                    trophyFilter === 'INDIVIDUAL' ? 'bg-[#FFCC00] text-black font-black' : 'bg-white text-stone-700'
                  }`}
                >
                  INDIVIDUAIS
                </button>
              </div>

              <div className="font-mono text-[10px] font-black text-black">
                SALA DE TROFÉUS OFICIAL
              </div>
            </div>

            {/* Scrollable Trophy Grid (Internal Scroll Only) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredTrophiesCatalogue.map((trophyDef) => {
                  const wonAwards = unlockedTrophies.filter((t) => t.code === trophyDef.code);
                  const isUnlocked = wonAwards.length > 0;

                  return (
                    <div
                      key={trophyDef.code}
                      className={`p-2.5 rounded-xl border-2 border-black transition-all font-mono flex items-start gap-2.5 ${
                        isUnlocked
                          ? trophyDef.rarity === 'LEGENDARY'
                            ? 'bg-amber-100 shadow-brutal-sm'
                            : trophyDef.rarity === 'GOLD'
                            ? 'bg-[#FFCC00]/25 shadow-brutal-sm'
                            : 'bg-stone-50 shadow-brutal-sm'
                          : 'bg-stone-100/60 opacity-60 border-dashed'
                      }`}
                    >
                      {/* Trophy Icon Box */}
                      <div
                        className={`p-2 rounded-xl border-2 border-black shrink-0 ${
                          isUnlocked
                            ? trophyDef.rarity === 'LEGENDARY'
                              ? 'bg-black text-[#FFCC00]'
                              : trophyDef.rarity === 'GOLD'
                              ? 'bg-[#FFCC00] text-black'
                              : 'bg-white text-black'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {isUnlocked ? (
                          renderTrophyIcon(trophyDef.iconName, 'w-5 h-5')
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-black text-xs uppercase text-black truncate">
                            {trophyDef.title}
                          </h4>
                          {isUnlocked ? (
                            <span className="px-1.5 py-0.2 rounded bg-black text-[#FFCC00] font-black text-[9px] shrink-0">
                              {wonAwards.length > 1 ? `x${wonAwards.length}` : 'CONQUISTADO'}
                            </span>
                          ) : (
                            <span className="text-[9px] text-stone-500 font-bold uppercase shrink-0">
                              BLOQUEADO
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-stone-600 line-clamp-2 mt-0.5 leading-snug">
                          {trophyDef.description}
                        </p>

                        {/* Badges of when won */}
                        {isUnlocked && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {wonAwards.map((a, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-white border border-black font-bold text-[8.5px] text-black truncate max-w-full"
                              >
                                T{a.season} · {a.clubName} ({a.year})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trophy Cabinet Footer */}
            <div className="p-2 rounded-xl border border-black bg-stone-50 font-mono text-[9px] flex items-center justify-between text-stone-700 shrink-0 gap-2 flex-wrap">
              <span>
                <strong>PROBABILIDADES:</strong> Títulos e prêmios são decididos ao fim de cada temporada pelas probabilidades do seu nível e do seu time.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAwardsModalSeason(season);
                    setIsAwardsModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-black text-[#FFCC00] font-black text-[9px] hover:bg-stone-800 transition-all cursor-pointer shadow-brutal-sm flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>GALA DA TEMPORADA</span>
                </button>
                <span className="font-bold text-black uppercase">
                  {unlockedTrophies.length} / {TROPHIES_CATALOGUE.length} TOTAL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEASONS HISTORY TABLE */}
        {activeTab === 'SEASONS' && (
          <div className="h-full flex flex-col justify-between overflow-hidden space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-1.5 shrink-0">
              <span className="font-black text-xs uppercase font-mono text-black">
                TABELA HISTÓRICA POR TEMPORADA
              </span>
              <span className="font-mono text-[10px] text-stone-500 font-bold">
                ANO BASE: {currentYear} · TEMPORADA ATUAL: T{season}
              </span>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 my-0.5">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-black text-stone-600 text-[10px] font-black">
                    <th className="py-1 px-1">TEMPORADA</th>
                    <th className="py-1 px-2">CLUBE / LIGA</th>
                    <th className="py-1 px-1 text-center">JOGOS</th>
                    <th className="py-1 px-1 text-center">{isGK ? 'DEFESAS' : 'GOLS'}</th>
                    <th className="py-1 px-1 text-center">{isGK ? 'JOGOS SG' : 'ASSIST'}</th>
                    <th className="py-1 px-1 text-center">NOTA</th>
                    <th className="py-1 px-2 text-right">TÍTULOS / PRÊMIOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {/* Current Season in Progress */}
                  <tr className="bg-[#FFCC00]/25 font-bold">
                    <td className="py-2 px-1 font-black">T{season} (Atual)</td>
                    <td className="py-2 px-2 truncate max-w-[140px]">
                      {currentClub.name}
                      <span className="block text-[9px] text-stone-500 font-normal">{currentClub.league}</span>
                    </td>
                    <td className="py-2 px-1 text-center font-black">{seasonStats.played}</td>
                    <td className="py-2 px-1 text-center font-black">
                      {isGK ? seasonStats.seasonSaves : seasonStats.seasonGoals}
                    </td>
                    <td className="py-2 px-1 text-center font-black">
                      {isGK ? seasonStats.seasonCleanSheets : seasonStats.seasonAssists}
                    </td>
                    <td className="py-2 px-1 text-center font-black">
                      {seasonStats.seasonAvg > 0 ? seasonStats.seasonAvg.toFixed(1) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-stone-600 font-bold">Disputando título...</span>
                        <button
                          onClick={() => {
                            setAwardsModalSeason(season);
                            setIsAwardsModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded bg-black hover:bg-stone-800 text-[#FFCC00] font-black text-[9px] transition-all cursor-pointer shadow-brutal-sm flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px]"
                        >
                          <Award className="w-2.5 h-2.5" />
                          <span>GALA T{season}</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Past Seasons */}
                  {player.history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-stone-500 font-mono text-xs">
                        Nenhuma temporada anterior concluída ainda.
                      </td>
                    </tr>
                  ) : (
                    player.history.map((hist, i) => (
                      <tr key={i} className="font-medium text-stone-800 hover:bg-stone-50">
                        <td className="py-2 px-1 font-bold">T{hist.seasonNumber}</td>
                        <td className="py-2 px-2 truncate max-w-[140px]">
                          {hist.clubName}
                          <span className="block text-[9px] text-stone-500">{hist.leagueName}</span>
                        </td>
                        <td className="py-2 px-1 text-center">{hist.matchesPlayed}</td>
                        <td className="py-2 px-1 text-center font-bold">
                          {isGK ? (hist.saves || 0) : hist.goals}
                        </td>
                        <td className="py-2 px-1 text-center font-bold">
                          {isGK ? (hist.cleanSheets || 0) : hist.assists}
                        </td>
                        <td className="py-2 px-1 text-center font-bold">
                          {hist.averageRating > 0 ? hist.averageRating.toFixed(1) : '-'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {hist.trophies && hist.trophies.length > 0 ? (
                              hist.trophies.map((tr, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded bg-amber-100 border border-amber-400 text-amber-950 font-bold text-[9px]"
                                >
                                  🏆 {tr}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 text-[10px]">-</span>
                            )}
                            <button
                              onClick={() => {
                                setAwardsModalSeason(hist.seasonNumber);
                                setIsAwardsModalOpen(true);
                              }}
                              className="px-1.5 py-0.5 rounded border border-black bg-white hover:bg-stone-100 text-black font-black text-[8.5px] transition-all cursor-pointer shadow-brutal-sm flex items-center gap-0.5 active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <Award className="w-2.5 h-2.5" />
                              <span>VER PRÊMIOS</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Milestone Summary Footer */}
            <div className="p-2 rounded-xl border border-black bg-stone-50 font-mono text-[9px] flex items-center justify-between shrink-0">
              <span>
                <strong>HISTÓRICO OFICIAL:</strong> Registro ininterrupto de participações e títulos na carreira de atleta.
              </span>
              <span className="font-bold text-black uppercase">
                {career.totalMatches} PARTIDAS OFICIAIS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Accent (Zero Scroll Strip) */}
      <div className="p-1.5 rounded-xl bg-white border-2 border-black shadow-brutal shrink-0">
        <div className="w-full h-2 rounded-full border border-black bg-hazard-stripes" />
      </div>

      {/* Season End Awards Ceremony Modal */}
      <SeasonAwardsModal
        isOpen={isAwardsModalOpen}
        onClose={() => setIsAwardsModalOpen(false)}
        state={state}
        initialSeasonNumber={awardsModalSeason}
      />
    </div>
  );
};
