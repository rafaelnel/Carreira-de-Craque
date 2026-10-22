/**
 * PRO PATH: Carreira Profissional
 * Complete Type Definitions aligned with the Game Design Document
 */

export type PositionCode = 'GK' | 'ST' | 'LW' | 'RW' | 'CAM' | 'CM' | 'CDM' | 'CB' | 'LB' | 'RB';

export interface PositionInfo {
  code: PositionCode;
  name: string;
  category: 'GOLEIRO' | 'ATAQUE' | 'MEIO' | 'DEFESA';
  primaryAttributes: (keyof TechnicalAttributes | keyof PhysicalAttributes | keyof MentalAttributes)[];
}

export interface PhysicalAttributes {
  velocidade: number;
  resistencia: number;
  forca: number;
  impulsao: number;
  agilidade: number;
}

export interface TechnicalAttributes {
  finalizacao: number;
  passeCurto: number;
  passeLongo: number;
  drible: number;
  desarme: number;
  marcacao: number;
  cabeceio: number;
  bolasParadas: number;
  // Atributos Específicos de Goleiro (GK)
  reflexos?: number;
  elasticidade?: number;
  segurancaMao?: number;
  jogoComPes?: number;
  saidaDoGol?: number;
}

export interface MentalAttributes {
  visaoDeJogo: number;
  posicionamento: number;
  decisao: number;
  compostura: number;
  trabalhoEmEquipe: number;
  determinacao: number;
}

export interface DynamicState {
  fitness: number;          // 0-100% (energia física atual)
  matchSharpness: number;   // 0-100% (ritmo de jogo)
  injuryRisk: number;       // 0-100% (risco de lesão)
  moral: number;            // 0-100% (moral profissional)
}

export interface HiddenAttributes {
  potentialAbility: number; // PA: 1-99 (teto máximo)
  professionalism: number;  // 1-20 (afeta ganho de XP e disciplina)
  injuryProne: number;      // 1-20 (suscetibilidade a lesões)
}

export type SquadRoleStatus = 
  | 'TITULAR_ABSOLUTO' 
  | 'TITULAR_ROTATIVO' 
  | 'RESERVA' 
  | 'NAO_RELACIONADO';

export type PromisedRole = 
  | 'JOGADOR_CHAVE' 
  | 'TITULAR' 
  | 'ROTATIVO' 
  | 'JOVEM_DESENVOLVIMENTO';

export interface PlayerContract {
  clubId: string;
  clubName: string;
  wageWeekly: number; // em Euros (€)
  yearsRemaining: number;
  promisedRole: PromisedRole;
  goalBonus: number;
  appearanceBonus: number;
  cleanSheetBonus: number;
  releaseClause: number;
  relegationClause: boolean;
  higherTierReleaseClause: boolean;
  unfulfilledMatchesStreak: number;
  transferRequested: boolean;
}

export interface SquadCompetitor {
  id: string;
  name: string;
  age: number;
  position: PositionCode;
  ca: number;
  fitness: number;
  sharpness: number;
  recentForm: number[]; // notas dos últimos jogos
  coachTrust: number; // 0-100
  isPlayer?: boolean;
  selectionScore?: number;
  status?: SquadRoleStatus;
}

export type TrainingIntensity = 'BAIXA' | 'PADRAO' | 'INTENSA';

export type TrainingAreaId =
  | 'CORRIDA'
  | 'CHUTE'
  | 'CRUZAMENTO'
  | 'PENALTY'
  | 'FALTA'
  | 'PASSE'
  | 'TRABALHO_EQUIPE'
  | 'RESISTENCIA'
  | 'DESARME'
  | 'DEFESAS_REFLEXOS'
  | 'ELASTICIDADE_SALTO'
  | 'SAIDA_GOL'
  | 'REPOSICAO_PES'
  | 'SEGURANCA_MAO';

export interface TrainingAreaInfo {
  id: TrainingAreaId;
  name: string;
  category: string;
  targetAttributes: string[];
  description: string;
}

export type TrainingFocus = TrainingAreaId;

export interface WeeklyTrainingPlan {
  selectedAreas: [TrainingAreaId, TrainingAreaId]; // Exact 2 areas chosen
  intensity: TrainingIntensity;
  slots?: TrainingFocus[]; // Backwards-compatible
}

export interface BatchSimulationResult {
  periodLabel: string;
  matchesSimulated: number;
  wins: number;
  draws: number;
  losses: number;
  playerMatches: number;
  playerGoals: number;
  playerAssists: number;
  playerSaves?: number;
  playerCleanSheets?: number;
  averageRating: number;
  improvedAttributes: string[];
  coachTrustChange: number;
  hypeGained: number;
  fitnessCurrent: number;
  sharpnessCurrent: number;
  seasonEnded?: boolean;
  matchResults: {
    week: number;
    homeClub: string;
    awayClub: string;
    homeScore: number;
    awayScore: number;
    playerRating: number;
    playerGoals: number;
    playerAssists: number;
    playerSaves?: number;
    minutesPlayed: number;
    isWin: boolean;
  }[];
}

export type ClubTier = 1 | 2 | 3 | 4 | 5;

export interface SquadPlayer {
  id: string;
  name: string;
  age: number;
  position: PositionCode;
  overall: number; // 60-99
  nationality: string;
}

export interface LeagueDefinition {
  id: string;
  name: string;
  shortName: string;
  country: string;
  tier: ClubTier;
  reputation: number;
  clubsCount: number;
  clubs: ClubDatabaseEntry[];
}

export type ScoutingFocus = 'HIGHER_TIER' | 'BETTER_WAGE' | 'SIMILAR_TIER_ROLE' | 'EUROPE_GLOBAL';

export interface ScoutingProbabilityBreakdown {
  probability: number;
  factors: { label: string; delta: number; positive: boolean }[];
}

export interface ScoutingReportResult {
  success: boolean;
  focus: ScoutingFocus;
  probability: number;
  factors: { label: string; delta: number; positive: boolean }[];
  feedbackMessage: string;
  offersFound: TransferOffer[];
  hypeGained: number;
  fitnessConsumed: number;
  scoutedAtWeek: number;
}

export interface ClubDatabaseEntry {
  id: string;
  name: string;
  shortName: string;
  tier: ClubTier;
  league: string;
  reputation: number;
  budget: number;
  primaryColor: string;
  secondaryColor: string;
  formation: string;
  keyPlayers: SquadPlayer[];
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  tier: ClubTier;
  league: string;
  reputation: number; // 1-100
  budget: number;
  color: string;
  accentColor: string;
  primaryColor?: string;
  secondaryColor?: string;
  formation: string; // ex: '4-3-3', '4-2-3-1', '4-4-2'
  keyPlayers?: SquadPlayer[];
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'PASS' | 'DRIBBLE' | 'SHOT' | 'TACKLE' | 'GOAL' | 'SAVE' | 'FOUL' | 'YELLOW_CARD' | 'RED_CARD' | 'TACTICAL_NOTE';
  description: string;
  isPlayerInvolved: boolean;
  success: boolean;
  scoreChange?: { home: number; away: number };
  pitchCoords: { x: number; y: number }; // 0 to 100 on the 2D pitch
  ratingDelta?: number;
}

export interface MatchStats {
  minutesPlayed: number;
  goals: number;
  assists: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  completedPasses: number;
  totalPasses: number;
  keyPasses: number;
  successfulTackles: number;
  tacklesAttempted: number;
  foulsCommitted: number;
  yellowCards: number;
  redCards: number;
  matchRating: number; // 1.0 - 10.0
  // Goalkeeper Specific Stats
  saves?: number;
  savesDifficult?: number;
  goalsConceded?: number;
  cleanSheet?: boolean;
}

export interface MatchFixture {
  id: string;
  week: number;
  homeClub: Club;
  awayClub: Club;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  playerMatchStats?: MatchStats;
  playerStatusForMatch?: SquadRoleStatus;
}

export interface LeagueStanding {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TransferOffer {
  id: string;
  club: Club;
  wageWeekly: number;
  promisedRole: PromisedRole;
  goalBonus: number;
  appearanceBonus: number;
  releaseClause: number;
  expiresInWeeks: number;
}

export type TrophyCategory = 'COLLECTIVE' | 'INDIVIDUAL';
export type TrophyRarity = 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGENDARY';

export interface TrophyAward {
  id: string;
  code: string;
  title: string;
  category: TrophyCategory;
  season: number;
  year: number;
  clubName: string;
  description: string;
  rarity: TrophyRarity;
  unlockedAtWeek?: number;
  iconName?: string;
}

export interface TrophyDefinition {
  code: string;
  title: string;
  category: TrophyCategory;
  rarity: TrophyRarity;
  description: string;
  iconName: string;
}

export interface SeasonAwardNomination {
  id: string;
  code: string;
  title: string;
  category: TrophyCategory;
  rarity: TrophyRarity;
  iconName: string;
  description: string;
  won: boolean;
  statusBadge: string; // e.g., 'VENCEDOR OFICIAL', 'INDICADO (TOP 3)', 'FAVORITO'
  criteriaMetric: string;
  statValue: number | string;
  rivalComparison?: string; // e.g., 'Vice: Pedro (FLA) - 21 gols'
  hypeReward: number;
}

export interface SeasonAwardsCeremonyData {
  seasonNumber: number;
  year: number;
  clubName: string;
  leagueName: string;
  isCompletedSeason: boolean; // true if finalized season, false if live projection
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  saves?: number;
  cleanSheets?: number;
  awards: SeasonAwardNomination[];
  totalTrophiesWon: number;
  ceremonyHypeGained: number;
  dateTimestamp: number;
}

export interface SeasonHistory {
  seasonNumber: number;
  year: number;
  clubName: string;
  leagueName: string;
  tier: ClubTier;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  cleanSheets?: number;
  saves?: number;
  trophies: string[];
}

export interface PlayerCharacter {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: PositionCode;
  secondaryPosition?: PositionCode;
  
  physical: PhysicalAttributes;
  technical: TechnicalAttributes;
  mental: MentalAttributes;
  
  state: DynamicState;
  hidden: HiddenAttributes;
  
  attributeXP: Record<string, number>; // XP acumulado por atributo
  
  currentAbility: number; // CA 1-99
  hype: number;           // 0 - 10.000
  coachTrust: number;     // 0 - 100
  recentRatings: number[];// Últimas 5 notas
  
  contract: PlayerContract;
  careerStats: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalCleanSheets?: number;
    totalSaves?: number;
    avgRating: number;
    trophies: string[];
  };
  history: SeasonHistory[];
  isRetired?: boolean;
  retirementAnnounced?: boolean;
  peakAbility?: number;
  retiredAtSeason?: number;
  attributeTrends?: Record<string, 'UP' | 'DOWN' | 'STABLE'>;
  trophiesGallery?: TrophyAward[];
}

export interface GameState {
  screen: 'TITLE' | 'DASHBOARD' | 'TRAINING' | 'SQUAD' | 'MATCH_PRE' | 'MATCH_LIVE' | 'MATCH_POST' | 'CONTRACT' | 'CAREER';
  season: number;
  currentYear: number;
  currentWeek: number; // 1 to 38
  totalWeeksInSeason: number;
  
  player: PlayerCharacter;
  currentClub: Club;
  competitors: SquadCompetitor[];
  
  standings: LeagueStanding[];
  fixtures: MatchFixture[];
  currentMatch: MatchFixture | null;
  
  activeTrainingPlan: WeeklyTrainingPlan;
  trainingDoneThisWeek: boolean;
  
  incomingOffers: TransferOffer[];
  transferWindowOpen: boolean;
  pendingRetirementDecision?: boolean;
  lastScoutingReport?: ScoutingReportResult | null;
  
  liveMatchState?: {
    minute: number;
    homeScore: number;
    awayScore: number;
    events: MatchEvent[];
    playerStats: MatchStats;
    ballCoords: { x: number; y: number };
    isFinished: boolean;
    speed: number; // ms per match minute
    playerRatingHistory: { minute: number; rating: number }[];
  };

  notification?: {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null;
}
