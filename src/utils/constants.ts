import {
  Club,
  ClubTier,
  PositionCode,
  PositionInfo,
  TrainingFocus,
  TrophyDefinition,
  ClubDatabaseEntry,
  SquadPlayer,
  LeagueDefinition,
} from '../types/game';
import {
  BRASILEIRAO_SERIE_A,
  BRASILEIRAO_SERIE_B,
} from '../data/brazilSquads';
import {
  PREMIER_LEAGUE,
  LA_LIGA,
  SERIE_A_ITALIA,
  BUNDESLIGA,
  LIGUE_1,
  ALL_EUROPEAN_CLUBS,
} from '../data/europeanSquads';

export {
  PREMIER_LEAGUE,
  LA_LIGA,
  SERIE_A_ITALIA,
  BUNDESLIGA,
  LIGUE_1,
  ALL_EUROPEAN_CLUBS,
};

export const POSITIONS_INFO: Record<PositionCode, PositionInfo> = {
  GK: {
    code: 'GK',
    name: 'Goleiro (Guardião da Meta)',
    category: 'GOLEIRO',
    primaryAttributes: ['reflexos', 'elasticidade', 'segurancaMao', 'posicionamento', 'jogoComPes', 'saidaDoGol', 'agilidade', 'impulsao'],
  },
  ST: {
    code: 'ST',
    name: 'Centroavante (Atacante)',
    category: 'ATAQUE',
    primaryAttributes: ['finalizacao', 'posicionamento', 'compostura', 'cabeceio', 'forca', 'velocidade'],
  },
  LW: {
    code: 'LW',
    name: 'Ponta Esquerda',
    category: 'ATAQUE',
    primaryAttributes: ['velocidade', 'drible', 'agilidade', 'finalizacao', 'decisao'],
  },
  RW: {
    code: 'RW',
    name: 'Ponta Direita',
    category: 'ATAQUE',
    primaryAttributes: ['velocidade', 'drible', 'agilidade', 'finalizacao', 'decisao'],
  },
  CAM: {
    code: 'CAM',
    name: 'Meia Ofensivo (10)',
    category: 'MEIO',
    primaryAttributes: ['visaoDeJogo', 'passeCurto', 'decisao', 'drible', 'compostura', 'finalizacao'],
  },
  CM: {
    code: 'CM',
    name: 'Meio-Campista Central (8)',
    category: 'MEIO',
    primaryAttributes: ['passeCurto', 'passeLongo', 'visaoDeJogo', 'resistencia', 'trabalhoEmEquipe', 'decisao'],
  },
  CDM: {
    code: 'CDM',
    name: 'Volante Marcador (5)',
    category: 'MEIO',
    primaryAttributes: ['desarme', 'marcacao', 'posicionamento', 'forca', 'resistencia', 'trabalhoEmEquipe'],
  },
  CB: {
    code: 'CB',
    name: 'Zagueiro Central',
    category: 'DEFESA',
    primaryAttributes: ['desarme', 'marcacao', 'cabeceio', 'forca', 'posicionamento', 'impulsao'],
  },
  LB: {
    code: 'LB',
    name: 'Lateral Esquerdo',
    category: 'DEFESA',
    primaryAttributes: ['velocidade', 'resistencia', 'desarme', 'passeCurto', 'agilidade'],
  },
  RB: {
    code: 'RB',
    name: 'Lateral Direito',
    category: 'DEFESA',
    primaryAttributes: ['velocidade', 'resistencia', 'desarme', 'passeCurto', 'agilidade'],
  },
};

/**
 * Helper to convert ClubDatabaseEntry into full Club instance
 */
function convertToClub(entry: ClubDatabaseEntry): Club {
  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName,
    tier: entry.tier,
    league: entry.league,
    reputation: entry.reputation,
    budget: entry.budget,
    color: entry.primaryColor,
    accentColor: entry.secondaryColor,
    primaryColor: entry.primaryColor,
    secondaryColor: entry.secondaryColor,
    formation: entry.formation,
    keyPlayers: entry.keyPlayers,
  };
}

/**
 * BRAZILIAN SERIE A (20 official real clubs with real star & starting squads)
 * Tier: 1 (Primeira Divisão / Elite Nacional)
 */
export const BRAZILIAN_SERIE_A: ClubDatabaseEntry[] = BRASILEIRAO_SERIE_A;

/**
 * BRAZILIAN SERIE B (20 official clubs with procedurally generated fictional rosters, overall 62-72)
 * Tier: 2 (Segunda Divisão / Acesso Nacional)
 */
export const BRAZILIAN_SERIE_B: ClubDatabaseEntry[] = BRASILEIRAO_SERIE_B;

export { BRASILEIRAO_SERIE_A, BRASILEIRAO_SERIE_B };

/**
 * Access and regional semi-pro clubs for starting careers (Tier 4 & Tier 5)
 */
export const REGIONAL_ACCESS_CLUBS: Club[] = [
  // Tier 5: Semiprofissional / Acesso Regional
  {
    id: 'club_barra',
    name: 'Barra FC',
    shortName: 'BAR',
    tier: 5,
    league: 'Catarinense & Acesso Regional',
    reputation: 20,
    budget: 45000,
    color: '#0284c7',
    accentColor: '#38bdf8',
    formation: '4-3-3',
  },
  {
    id: 'club_retro',
    name: 'Retrô FC',
    shortName: 'RET',
    tier: 5,
    league: 'Pernambucano & Acesso Regional',
    reputation: 24,
    budget: 55000,
    color: '#eab308',
    accentColor: '#1e293b',
    formation: '4-2-3-1',
  },
  {
    id: 'club_ypiranga',
    name: 'Ypiranga Erechim',
    shortName: 'YPI',
    tier: 5,
    league: 'Gaúcho & Regional Sul',
    reputation: 22,
    budget: 40000,
    color: '#15803d',
    accentColor: '#facc15',
    formation: '4-4-2',
  },
  // Tier 4: Divisões de Acesso Nacional (Série C)
  {
    id: 'club_nautico',
    name: 'Náutico Capibaribe',
    shortName: 'NAU',
    tier: 4,
    league: 'Campeonato Nacional Série C',
    reputation: 40,
    budget: 160000,
    color: '#dc2626',
    accentColor: '#ffffff',
    formation: '4-4-2',
  },
  {
    id: 'club_sampaio_correa',
    name: 'Sampaio Corrêa',
    shortName: 'SAM',
    tier: 4,
    league: 'Campeonato Nacional Série C',
    reputation: 39,
    budget: 150000,
    color: '#006437',
    accentColor: '#f7d117',
    formation: '4-3-3',
  },
];

/**
 * MASTER CLUBS DATABASE
 * Integrates Brazilian Serie A (Tier 1), Brazilian Serie B (Tier 2),
 * Regional & Access clubs (Tier 4 & 5), and Top European Leagues.
 */
export const CLUBS_DATABASE: Club[] = [
  // 1. Brasileirão Série A (20 Clubes Oficiais com Elencos Reais - Tier 1)
  ...BRAZILIAN_SERIE_A.map(convertToClub),

  // 2. Brasileirão Série B (20 Clubes Oficiais com Elencos Fictícios 62-72 OVR - Tier 2)
  ...BRAZILIAN_SERIE_B.map(convertToClub),

  // 3. Clubes de Acesso e Regionais (Tier 4 e Tier 5)
  ...REGIONAL_ACCESS_CLUBS,

  // 4. Elite Global e Grandes da Europa (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)
  ...ALL_EUROPEAN_CLUBS.map(convertToClub),
];

/**
 * ALL OFFICIAL LEAGUES DEFINITIONS
 * Structured leagues catalog covering Brazil & Top 5 European leagues
 */
export const ALL_LEAGUES: LeagueDefinition[] = [
  {
    id: 'brasileirao_serie_a',
    name: 'Brasileirão Série A',
    shortName: 'BRA-A',
    country: 'Brasil',
    tier: 1,
    reputation: 84,
    clubsCount: BRAZILIAN_SERIE_A.length,
    clubs: BRAZILIAN_SERIE_A,
  },
  {
    id: 'brasileirao_serie_b',
    name: 'Brasileirão Série B',
    shortName: 'BRA-B',
    country: 'Brasil',
    tier: 2,
    reputation: 67,
    clubsCount: BRAZILIAN_SERIE_B.length,
    clubs: BRAZILIAN_SERIE_B,
  },
  {
    id: 'premier_league',
    name: 'Premier League',
    shortName: 'EPL',
    country: 'Inglaterra',
    tier: 1,
    reputation: 96,
    clubsCount: PREMIER_LEAGUE.length,
    clubs: PREMIER_LEAGUE,
  },
  {
    id: 'la_liga',
    name: 'La Liga EA Sports',
    shortName: 'ESP',
    country: 'Espanha',
    tier: 1,
    reputation: 93,
    clubsCount: LA_LIGA.length,
    clubs: LA_LIGA,
  },
  {
    id: 'serie_a_italia',
    name: 'Serie A Enilive',
    shortName: 'ITA',
    country: 'Itália',
    tier: 1,
    reputation: 90,
    clubsCount: SERIE_A_ITALIA.length,
    clubs: SERIE_A_ITALIA,
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'GER',
    country: 'Alemanha',
    tier: 1,
    reputation: 91,
    clubsCount: BUNDESLIGA.length,
    clubs: BUNDESLIGA,
  },
  {
    id: 'ligue_1',
    name: 'Ligue 1 McDonald\'s',
    shortName: 'FRA',
    country: 'França',
    tier: 1,
    reputation: 88,
    clubsCount: LIGUE_1.length,
    clubs: LIGUE_1,
  },
  {
    id: 'regional_access',
    name: 'Acesso Regional & Série C/D',
    shortName: 'ACESSO',
    country: 'Brasil',
    tier: 4,
    reputation: 35,
    clubsCount: REGIONAL_ACCESS_CLUBS.length,
    clubs: REGIONAL_ACCESS_CLUBS.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      tier: c.tier,
      league: c.league,
      reputation: c.reputation,
      budget: c.budget,
      primaryColor: c.color,
      secondaryColor: c.accentColor,
      formation: c.formation,
      keyPlayers: [],
    })),
  },
];

/**
 * Calculates the representative squad OVR for any club
 */
export function getClubAverageOvr(club: Club): number {
  if (club.keyPlayers && club.keyPlayers.length > 0) {
    const sum = club.keyPlayers.reduce((acc, p) => acc + p.overall, 0);
    return Math.round(sum / club.keyPlayers.length);
  }
  // Fallbacks by tier
  switch (club.tier) {
    case 1:
      return 80;
    case 2:
      return 67;
    case 3:
      return 65;
    case 4:
      return 64;
    case 5:
    default:
      return 62;
  }
}

/**
 * Initial 5 Club Propositions:
 * Rookies start with weak rating (~60-66 OVR).
 * They CANNOT choose from all clubs (no Serie A or European giants).
 * Instead, exactly 5 realistic clubs of lower rating/tier similar to the player's OVR
 * submit a starting contract proposal.
 */
export function getClubsForStartingPropositions(playerOvr: number): Club[] {
  // Only clubs from Tier 5 (Regional Access), Tier 4 (National Access), or Tier 2 (Série B lower/mid)
  const candidateClubs = CLUBS_DATABASE.filter(
    (c) => c.tier === 5 || c.tier === 4 || (c.tier === 2 && c.reputation <= 68)
  );

  // Score candidate clubs by how close their average OVR is to the player's starting OVR
  const scored = candidateClubs.map((club) => {
    const clubOvr = getClubAverageOvr(club);
    const diff = Math.abs(clubOvr - playerOvr);
    return { club, clubOvr, diff };
  });

  // Sort by closest OVR match, but ensure diverse representation across Tier 5, Tier 4, and Tier 2
  scored.sort((a, b) => a.diff - b.diff || a.club.reputation - b.club.reputation);

  // Ensure selection includes regional semi-pro (Tier 5), Série C/D access (Tier 4), and emerging Série B
  const selected: Club[] = [];
  const pickedIds = new Set<string>();

  // Pick best tier 5 club
  const tier5 = scored.find((s) => s.club.tier === 5);
  if (tier5) {
    selected.push(tier5.club);
    pickedIds.add(tier5.club.id);
  }

  // Pick best tier 4 club
  const tier4 = scored.find((s) => s.club.tier === 4 && !pickedIds.has(s.club.id));
  if (tier4) {
    selected.push(tier4.club);
    pickedIds.add(tier4.club.id);
  }

  // Fill remaining slots with the closest matching clubs
  for (const s of scored) {
    if (selected.length >= 5) break;
    if (!pickedIds.has(s.club.id)) {
      selected.push(s.club);
      pickedIds.add(s.club.id);
    }
  }

  return selected.slice(0, 5);
}

import { TrainingAreaId } from '../types/game';

export const TRAINING_AREAS_CATALOGUE: Record<TrainingAreaId, {
  name: string;
  category: string;
  affectedAttributes: string[];
  description: string;
  bonusDesc: string;
}> = {
  CORRIDA: {
    name: 'Corrida & Velocidade',
    category: 'FÍSICO',
    affectedAttributes: ['velocidade', 'agilidade'],
    description: 'Tiros curtos, arranque de profundidade e aceleração no gramado.',
    bonusDesc: '+Bônus em Velocidade e Agilidade',
  },
  CHUTE: {
    name: 'Chute & Finalização',
    category: 'TÉCNICO',
    affectedAttributes: ['finalizacao', 'compostura'],
    description: 'Arremates de média/curta distância, chapadas e finalização de primeira.',
    bonusDesc: '+Bônus em Finalização e Compostura',
  },
  CRUZAMENTO: {
    name: 'Cruzamento & Lançamento',
    category: 'TÉCNICO',
    affectedAttributes: ['passeLongo', 'visaoDeJogo'],
    description: 'Bolas cruzadas na área, viradas de jogo e passes em profundidade.',
    bonusDesc: '+Bônus em Passe Longo e Visão',
  },
  PENALTY: {
    name: 'Pênalti & Frieza',
    category: 'TÉCNICO',
    affectedAttributes: ['bolasParadas', 'compostura'],
    description: 'Cobranças na marca da cal, leitura do goleiro e batida firme no canto.',
    bonusDesc: '+Bônus em Bolas Paradas e Frieza',
  },
  FALTA: {
    name: 'Cobrança de Faltas',
    category: 'TÉCNICO',
    affectedAttributes: ['bolasParadas', 'finalizacao'],
    description: 'Faltas diretas sobre a barreira, efeito na bola e potência no alvo.',
    bonusDesc: '+Bônus em Bolas Paradas e Precisão',
  },
  PASSE: {
    name: 'Passe & Circulação',
    category: 'TÉCNICO',
    affectedAttributes: ['passeCurto', 'visaoDeJogo'],
    description: 'Troca rápida de passes sob pressão e triangulações curtas.',
    bonusDesc: '+Bônus em Passe Curto e Visão',
  },
  TRABALHO_EQUIPE: {
    name: 'Trabalho em Equipe',
    category: 'MENTAL',
    affectedAttributes: ['trabalhoEmEquipe', 'posicionamento'],
    description: 'Cumprimento de ordens táticas coletivas e coberturas no campo.',
    bonusDesc: '+Bônus em Equipe e Posicionamento',
  },
  RESISTENCIA: {
    name: 'Resistência & Força',
    category: 'FÍSICO',
    affectedAttributes: ['resistencia', 'forca'],
    description: 'Capacidade aeróbica para os 90 minutos e disputa de corpo.',
    bonusDesc: '+Bônus em Resistência e Força',
  },
  DESARME: {
    name: 'Desarme & Bote',
    category: 'DEFENSIVO',
    affectedAttributes: ['desarme', 'marcacao'],
    description: 'Botes precisos no chão, temporização e interceptações de bola.',
    bonusDesc: '+Bônus em Desarme e Marcação',
  },
  DEFESAS_REFLEXOS: {
    name: 'Reflexos & Queima-Roupa',
    category: 'GOLEIRO',
    affectedAttributes: ['reflexos', 'agilidade'],
    description: 'Defesas rápidas à queima-roupa, tempo de reação e agilidade sob as traves.',
    bonusDesc: '+Bônus em Reflexos e Agilidade',
  },
  ELASTICIDADE_SALTO: {
    name: 'Elasticidade & Salto',
    category: 'GOLEIRO',
    affectedAttributes: ['elasticidade', 'impulsao'],
    description: 'Mergulhos no ângulo, pontes acrobáticas e alcance nas extremidades da meta.',
    bonusDesc: '+Bônus em Elasticidade e Impulsão',
  },
  SAIDA_GOL: {
    name: 'Saída do Gol & 1x1',
    category: 'GOLEIRO',
    affectedAttributes: ['saidaDoGol', 'decisao'],
    description: 'Abafamento nos pés dos atacantes, corte de cruzamentos e autoridade na pequena área.',
    bonusDesc: '+Bônus em Saída do Gol e Decisão',
  },
  REPOSICAO_PES: {
    name: 'Reposição & Jogo com os Pés',
    category: 'GOLEIRO',
    affectedAttributes: ['jogoComPes', 'passeLongo'],
    description: 'Lançamentos precisos com as mãos e pés para contra-ataques rápidos.',
    bonusDesc: '+Bônus em Jogo com Pés e Lançamento',
  },
  SEGURANCA_MAO: {
    name: 'Firmeza & Segurança de Mãos',
    category: 'GOLEIRO',
    affectedAttributes: ['segurancaMao', 'compostura'],
    description: 'Segurança na pegada sem dar rebote, firmeza em chutes potentes e tranquilidade.',
    bonusDesc: '+Bônus em Segurança e Compostura',
  },
};

export const TROPHIES_CATALOGUE: TrophyDefinition[] = [
  // Títulos Coletivos
  {
    code: 'CAMPEAO_NACIONAL',
    title: 'Campeão da Liga Nacional',
    category: 'COLLECTIVE',
    rarity: 'GOLD',
    description: 'Levantou a taça de campeão da liga nacional pelo seu clube.',
    iconName: 'Trophy',
  },
  {
    code: 'VICE_CAMPEAO_NACIONAL',
    title: 'Vice-Campeão da Liga',
    category: 'COLLECTIVE',
    rarity: 'SILVER',
    description: 'Campanha de elite terminando no pódio da competição nacional.',
    iconName: 'Medal',
  },
  {
    code: 'TACA_DA_COPA',
    title: 'Taça da Copa Nacional',
    category: 'COLLECTIVE',
    rarity: 'GOLD',
    description: 'Conquistou a copa eliminatória nacional superando os mata-matas.',
    iconName: 'Shield',
  },
  {
    code: 'GLORIA_CONTINENTAL',
    title: 'Glória Continental',
    category: 'COLLECTIVE',
    rarity: 'LEGENDARY',
    description: 'Soberania continental absoluta conquistando o torneio internacional mais cobiçado.',
    iconName: 'Crown',
  },

  // Prêmios Individuais
  {
    code: 'BOLA_DE_OURO',
    title: 'Bola de Ouro / Craque da Liga',
    category: 'INDIVIDUAL',
    rarity: 'LEGENDARY',
    description: 'Eleito o melhor jogador absoluto da temporada com atuações magistrais.',
    iconName: 'Award',
  },
  {
    code: 'CHUTEIRA_DE_OURO',
    title: 'Chuteira de Ouro / Artilheiro',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Goleador máximo do campeonato, balançando as redes como ninguém.',
    iconName: 'Flame',
  },
  {
    code: 'REI_DAS_ASSISTENCIAS',
    title: 'Maestro / Rei das Assistências',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Líder supremo em passes para gol e criação de jogadas decisivas.',
    iconName: 'Zap',
  },
  {
    code: 'REVELACAO_DO_ANO',
    title: 'Revelação do Ano (Sub-21)',
    category: 'INDIVIDUAL',
    rarity: 'SILVER',
    description: 'Jovem promessa que explodiu no cenário profissional com autoridade.',
    iconName: 'Star',
  },
  {
    code: 'PAREDAO_DO_ANO',
    title: 'Paredão / Defensor do Ano',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Pilar defensivo intransponível com maior número de desarmes e jogos sem sofrer gols.',
    iconName: 'Shield',
  },
  {
    code: 'SELECAO_DO_CAMPEONATO',
    title: 'Seleção dos 11 Melhores',
    category: 'INDIVIDUAL',
    rarity: 'SILVER',
    description: 'Eleito para o time ideal dos melhores 11 jogadores do campeonato.',
    iconName: 'Award',
  },
  {
    code: 'HAT_TRICK',
    title: 'Hat-Trick Heroico',
    category: 'INDIVIDUAL',
    rarity: 'SILVER',
    description: 'Anotou 3 ou mais gols em uma única e memorável partida oficial.',
    iconName: 'Flame',
  },
  {
    code: 'CLUBE_DOS_100',
    title: 'Clube dos 100 Jogos',
    category: 'INDIVIDUAL',
    rarity: 'SILVER',
    description: 'Atingiu o marco histórico de 100 partidas oficiais na carreira profissional.',
    iconName: 'Trophy',
  },
  {
    code: 'CLUBE_DOS_50_GOLS',
    title: 'Matador dos 50 Gols',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Alcançou a marca impressionante de 50 gols oficiais como profissional.',
    iconName: 'Flame',
  },
  {
    code: 'LEGADO_ETERNO',
    title: 'Lenda Imortal do Futebol',
    category: 'INDIVIDUAL',
    rarity: 'LEGENDARY',
    description: 'Atingiu a aposentadoria com um currículo glorioso repleto de história e conquistas.',
    iconName: 'Crown',
  },
  {
    code: 'LUVA_DE_OURO',
    title: 'Luva de Ouro / Melhor Goleiro',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Eleito o melhor goleiro da liga com defesas espetaculares e liderança defensiva.',
    iconName: 'Shield',
  },
  {
    code: 'CLUBE_DOS_50_CLEANSHEETS',
    title: 'Muralha dos 50 Clean Sheets',
    category: 'INDIVIDUAL',
    rarity: 'GOLD',
    description: 'Alcançou a marca monumental de 50 partidas sem sofrer gols na carreira.',
    iconName: 'Shield',
  },
  {
    code: 'MURALHA_INTRANSPONIVEL',
    title: 'Muralha Intransponível',
    category: 'INDIVIDUAL',
    rarity: 'SILVER',
    description: 'Realizou 6 ou mais defesas espetaculares na mesma partida garantindo o resultado.',
    iconName: 'Shield',
  },
];

