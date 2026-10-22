import {
  BatchSimulationResult,
  Club,
  GameState,
  MatchEvent,
  MatchFixture,
  MatchStats,
  MentalAttributes,
  PhysicalAttributes,
  PlayerCharacter,
  PositionCode,
  PromisedRole,
  SquadCompetitor,
  SquadRoleStatus,
  TechnicalAttributes,
  TrainingAreaId,
  TrainingFocus,
  TrainingIntensity,
  TransferOffer,
  TrophyAward,
  WeeklyTrainingPlan,
  ScoutingFocus,
  ScoutingProbabilityBreakdown,
  ScoutingReportResult,
} from '../types/game';
import { CLUBS_DATABASE, POSITIONS_INFO, TRAINING_AREAS_CATALOGUE, TROPHIES_CATALOGUE } from './constants';

/**
 * Calculate Current Ability (CA / OVR) based on position-weighted attributes
 * If attributes increase, OVR increases. If attributes decrease, OVR decreases.
 */
export function calculateCurrentAbility(
  position: PositionCode,
  phys: PhysicalAttributes,
  tech: TechnicalAttributes,
  ment: MentalAttributes | Record<string, number>
): number {
  if (position === 'GK') {
    // For Goalkeepers, primary GK stats define 75% of OVR, physical & mental 25%
    const reflexos = tech.reflexos ?? 64;
    const elasticidade = tech.elasticidade ?? 64;
    const seguranca = tech.segurancaMao ?? 63;
    const saida = tech.saidaDoGol ?? 62;
    const reposicao = tech.jogoComPes ?? 62;
    const pos = ment.posicionamento ?? 64;
    const agilidade = phys.agilidade ?? 64;
    const impulsao = phys.impulsao ?? 64;
    const compostura = ment.compostura ?? 62;
    const decisao = ment.decisao ?? 62;

    const gkCore =
      (reflexos * 1.6 +
        elasticidade * 1.4 +
        seguranca * 1.3 +
        pos * 1.3 +
        saida * 1.1 +
        reposicao * 0.9 +
        agilidade * 1.0 +
        impulsao * 1.0 +
        compostura * 0.8 +
        decisao * 0.8) /
      11.2;

    return Math.max(60, Math.min(99, Math.round(gkCore)));
  }

  const info = POSITIONS_INFO[position] || POSITIONS_INFO.ST;
  const primaryKeys = info.primaryAttributes;

  let primarySum = 0;
  primaryKeys.forEach((key) => {
    const val =
      (phys as unknown as Record<string, number>)[key] ??
      (tech as unknown as Record<string, number>)[key] ??
      (ment as unknown as Record<string, number>)[key] ??
      60;
    primarySum += val;
  });

  const primaryAvg = primarySum / primaryKeys.length;

  // Secondary attributes average
  const allPhys = (phys.velocidade + phys.resistencia + phys.forca + phys.impulsao + phys.agilidade) / 5;
  const techBaseList = [
    tech.finalizacao,
    tech.passeCurto,
    tech.passeLongo,
    tech.drible,
    tech.desarme,
    tech.marcacao,
    tech.cabeceio,
    tech.bolasParadas,
  ];
  const allTech = techBaseList.reduce((a, b) => a + b, 0) / techBaseList.length;
  const mentBaseList = [
    ment.visaoDeJogo ?? 60,
    ment.posicionamento ?? 60,
    ment.decisao ?? 60,
    ment.compostura ?? 60,
    ment.trabalhoEmEquipe ?? 60,
    ment.determinacao ?? 60,
  ];
  const allMent = mentBaseList.reduce((a, b) => a + b, 0) / mentBaseList.length;
  const generalAvg = (allPhys + allTech + allMent) / 3;

  const rawCA = Math.round(primaryAvg * 0.7 + generalAvg * 0.3);
  return Math.max(60, Math.min(99, rawCA));
}

/**
 * PILAR 2: Algoritmo de Seleção para a Partida
 * S = (CA * 0.40) + (Sharpness * 0.20) + (FormaRecente * 0.20) + (ConfiançaTécnico * 0.20)
 */
export function calculateSelectionScore(competitor: {
  ca: number;
  sharpness: number;
  recentForm: number[];
  coachTrust: number;
}): number {
  const formAvg =
    competitor.recentForm.length > 0
      ? (competitor.recentForm.reduce((a, b) => a + b, 0) / competitor.recentForm.length) * 10
      : 65; // default 6.5 * 10 = 65

  const score =
    competitor.ca * 0.4 +
    competitor.sharpness * 0.2 +
    formAvg * 0.2 +
    competitor.coachTrust * 0.2;

  return Math.round(score * 10) / 10;
}

/**
 * Updates squad ranking for position competitors and assigns status
 */
export function evaluateSquadHierarchy(
  player: PlayerCharacter,
  competitors: SquadCompetitor[]
): { updatedCompetitors: SquadCompetitor[]; playerStatus: SquadRoleStatus } {
  // Add player as a competitor for sorting
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

  const allCompetitors = [
    playerCompetitor,
    ...competitors.filter((c) => !c.isPlayer),
  ];

  // Calculate scores
  const scored = allCompetitors.map((c) => ({
    ...c,
    selectionScore: calculateSelectionScore(c),
  }));

  // Sort descending by selection score
  scored.sort((a, b) => (b.selectionScore ?? 0) - (a.selectionScore ?? 0));

  // Determine role status based on rank and fitness
  scored.forEach((comp, index) => {
    if (index === 0) {
      comp.status = comp.fitness >= 75 ? 'TITULAR_ABSOLUTO' : 'TITULAR_ROTATIVO';
    } else if (index === 1) {
      comp.status = 'TITULAR_ROTATIVO';
    } else if (index === 2) {
      comp.status = 'RESERVA';
    } else {
      comp.status = 'NAO_RELACIONADO';
    }
  });

  const playerObj = scored.find((c) => c.isPlayer);
  const playerStatus = playerObj?.status || 'RESERVA';

  return {
    updatedCompetitors: scored,
    playerStatus,
  };
}


/**
 * PILAR 3: Execução Semanal do Treino com as 2 Áreas Escolhidas
 * Concede bônus direcionado nos atributos específicos selecionados
 */
export function executeWeeklyTraining(
  player: PlayerCharacter,
  plan: WeeklyTrainingPlan
): {
  updatedPlayer: PlayerCharacter;
  summary: {
    fitnessDelta: number;
    sharpnessDelta: number;
    coachTrustDelta: number;
    improvedAttributes: string[];
  };
} {
  const intensityMult =
    plan.intensity === 'BAIXA' ? 0.6 : plan.intensity === 'INTENSA' ? 1.5 : 1.0;

  // Selected 2 areas (defaults to CHUTE and CORRIDA if not set)
  const areas: TrainingAreaId[] =
    plan.selectedAreas && plan.selectedAreas.length === 2
      ? plan.selectedAreas
      : ['CHUTE', 'CORRIDA'];

  const attributeGains: Record<string, number> = {};
  let totalFitnessCost = 6 * intensityMult;
  let totalCoachTrust = 1.5 * intensityMult;

  areas.forEach((areaId) => {
    const areaData = TRAINING_AREAS_CATALOGUE[areaId];
    if (!areaData) return;

    areaData.affectedAttributes.forEach((attrKey) => {
      const profBonus = 1 + player.hidden.professionalism * 0.02;
      const agePenalty = player.age > 30 ? 0.7 : player.age < 22 ? 1.3 : 1.0;
      // High focused gain for the 2 selected areas!
      const xpAmount = Math.round(38 * intensityMult * profBonus * agePenalty);
      attributeGains[attrKey] = (attributeGains[attrKey] || 0) + xpAmount;
    });
  });

  // Apply XP and check for level ups (clamped 60 to 99)
  const updatedPhysical = { ...player.physical };
  const updatedTechnical = { ...player.technical };
  const updatedMental = { ...player.mental };
  const updatedXP = { ...player.attributeXP };
  const improvedAttributes: string[] = [];

  Object.entries(attributeGains).forEach(([key, gainXP]) => {
    const currentVal =
      (updatedPhysical as Record<string, number>)[key] ??
      (updatedTechnical as Record<string, number>)[key] ??
      (updatedMental as Record<string, number>)[key] ??
      60;

    // Hard limit: potentialAbility (up to 99)
    if (currentVal >= player.hidden.potentialAbility) return;

    const currentXP = (updatedXP[key] || 0) + gainXP;
    const xpThreshold = Math.round(45 + currentVal * 1.8);

    if (currentXP >= xpThreshold && currentVal < 99) {
      const isTechKey = ['finalizacao', 'passeCurto', 'passeLongo', 'drible', 'desarme', 'marcacao', 'cabeceio', 'bolasParadas', 'reflexos', 'elasticidade', 'segurancaMao', 'jogoComPes', 'saidaDoGol'].includes(key);
      const isPhysKey = ['velocidade', 'resistencia', 'forca', 'impulsao', 'agilidade'].includes(key);
      const isMentKey = ['visaoDeJogo', 'posicionamento', 'decisao', 'compostura', 'trabalhoEmEquipe', 'determinacao'].includes(key);

      if (isPhysKey) {
        (updatedPhysical as Record<string, number>)[key] = Math.min(99, ((updatedPhysical as Record<string, number>)[key] ?? 60) + 1);
      } else if (isTechKey) {
        (updatedTechnical as Record<string, number>)[key] = Math.min(99, ((updatedTechnical as Record<string, number>)[key] ?? 60) + 1);
      } else if (isMentKey) {
        (updatedMental as Record<string, number>)[key] = Math.min(99, ((updatedMental as Record<string, number>)[key] ?? 60) + 1);
      }
      updatedXP[key] = currentXP - xpThreshold;
      improvedAttributes.push(key);
    } else {
      updatedXP[key] = currentXP;
    }
  });

  const newFitness = Math.max(
    15,
    Math.min(100, Math.round(player.state.fitness - totalFitnessCost))
  );

  const fatigueFactor = (100 - newFitness) * 0.5;
  const proneFactor = player.hidden.injuryProne * 1.4;
  const intensityRisk = plan.intensity === 'INTENSA' ? 18 : plan.intensity === 'BAIXA' ? 3 : 8;
  const newInjuryRisk = Math.min(90, Math.round(fatigueFactor * 0.4 + proneFactor + intensityRisk));

  const newSharpness = Math.max(20, player.state.matchSharpness - 1);
  const newCoachTrust = Math.min(100, Math.round(player.coachTrust + totalCoachTrust));
  const newCA = calculateCurrentAbility(
    player.position,
    updatedPhysical,
    updatedTechnical,
    updatedMental
  );

  const updatedPlayer: PlayerCharacter = {
    ...player,
    physical: updatedPhysical,
    technical: updatedTechnical,
    mental: updatedMental,
    attributeXP: updatedXP,
    currentAbility: newCA,
    coachTrust: newCoachTrust,
    state: {
      ...player.state,
      fitness: newFitness,
      injuryRisk: newInjuryRisk,
      matchSharpness: newSharpness,
    },
  };

  return {
    updatedPlayer,
    summary: {
      fitnessDelta: -Math.round(totalFitnessCost),
      sharpnessDelta: -1,
      coachTrustDelta: Math.round(totalCoachTrust * 10) / 10,
      improvedAttributes,
    },
  };
}

/**
 * PILAR 4: SIMULAÇÃO DA PARTIDA (Match Engine)
 * Generates match timeline with authentic duels and stats
 */
export function generateFullMatchSimulation(
  player: PlayerCharacter,
  playerStatus: SquadRoleStatus,
  homeClub: Club,
  awayClub: Club,
  isHome: boolean
): {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerStats: MatchStats;
} {
  const events: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;

  // Minutes played based on squad status
  let minutesToPlay = 0;
  if (playerStatus === 'TITULAR_ABSOLUTO') {
    minutesToPlay = player.state.fitness > 60 ? 90 : 70;
  } else if (playerStatus === 'TITULAR_ROTATIVO') {
    minutesToPlay = Math.random() > 0.4 ? 65 : 45;
  } else if (playerStatus === 'RESERVA') {
    minutesToPlay = Math.random() > 0.45 ? 25 : 0;
  } else {
    minutesToPlay = 0;
  }

  const startMinute = minutesToPlay === 90 ? 1 : minutesToPlay > 0 ? 90 - minutesToPlay : 999;

  // Initialize stats with 6.0 rating
  const stats: MatchStats = {
    minutesPlayed: minutesToPlay,
    goals: 0,
    assists: 0,
    shotsOnTarget: 0,
    shotsOffTarget: 0,
    completedPasses: 0,
    totalPasses: 0,
    keyPasses: 0,
    successfulTackles: 0,
    tacklesAttempted: 0,
    foulsCommitted: 0,
    yellowCards: 0,
    redCards: 0,
    matchRating: minutesToPlay > 0 ? 6.0 : 0,
  };

  const opponentClub = isHome ? awayClub : homeClub;
  const currentClub = isHome ? homeClub : awayClub;

  // Club strength disparity
  const teamPowerDelta = (currentClub.reputation - opponentClub.reputation) / 100;

  // Generate 20-26 key moment iterations
  const totalMoments = Math.floor(Math.random() * 6) + 20;

  for (let i = 0; i < totalMoments; i++) {
    const minute = Math.min(90, Math.max(2, Math.round(((i + 1) / totalMoments) * 90 + (Math.random() * 4 - 2))));
    const isPlayerOnPitch = minute >= startMinute && stats.redCards === 0;

    // Pitch coordinates for visualizer (0-100)
    // Team attacks towards right (x > 50), opponent towards left (x < 50)
    const teamAttacking = Math.random() < 0.5 + teamPowerDelta * 0.2;

    if (teamAttacking) {
      // Chance for our team
      const isPlayerInvolved =
        isPlayerOnPitch &&
        (player.position === 'ST' || player.position === 'LW' || player.position === 'RW'
          ? Math.random() < 0.45
          : player.position === 'CAM' || player.position === 'CM'
          ? Math.random() < 0.4
          : Math.random() < 0.2);

      const targetX = 55 + Math.random() * 40;
      const targetY = 15 + Math.random() * 70;

      if (isPlayerInvolved) {
        // Player action duel
        const roll = Math.random();

        if (roll < 0.35 && (player.position === 'ST' || player.position === 'LW' || player.position === 'RW' || player.position === 'CAM')) {
          // Finalização / Chute a gol
          const shotPower =
            player.technical.finalizacao * 0.45 +
            player.mental.compostura * 0.3 +
            player.state.fitness * 0.25;
          const defenseResistance = opponentClub.reputation * 0.8 + Math.random() * 30;

          stats.totalPasses += 1;
          stats.completedPasses += 1;

          if (shotPower > defenseResistance) {
            // GOOOOL DO JOGADOR!
            if (isHome) homeScore++;
            else awayScore++;

            stats.goals += 1;
            stats.shotsOnTarget += 1;
            stats.matchRating = Math.min(10.0, stats.matchRating + 1.1);

            events.push({
              id: `evt_${i}`,
              minute,
              type: 'GOAL',
              description: `⚽ GOLAÇO! ${player.name} fuzila na gaveta do goleiro adversário sem chances de defesa!`,
              isPlayerInvolved: true,
              success: true,
              scoreChange: { home: homeScore, away: awayScore },
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: +1.1,
            });
          } else if (shotPower > defenseResistance * 0.75) {
            // Defesa do goleiro (no alvo)
            stats.shotsOnTarget += 1;
            stats.matchRating = Math.min(10.0, stats.matchRating + 0.2);

            events.push({
              id: `evt_${i}`,
              minute,
              type: 'SHOT',
              description: `${player.name} arrisca chute firme colocado, mas o goleiro faz boa defesa espalmando!`,
              isPlayerInvolved: true,
              success: true,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: +0.2,
            });
          } else {
            // Para fora
            stats.shotsOffTarget += 1;
            stats.matchRating = Math.max(3.0, stats.matchRating - 0.1);

            events.push({
              id: `evt_${i}`,
              minute,
              type: 'SHOT',
              description: `${player.name} tenta finalização de primeira, mas a bola sobe demais e vai para fora.`,
              isPlayerInvolved: true,
              success: false,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: -0.1,
            });
          }
        } else if (roll < 0.7) {
          // Passe / Passe Chave
          const passSkill =
            player.technical.passeCurto * 0.4 +
            player.mental.visaoDeJogo * 0.4 +
            player.mental.decisao * 0.2;
          const passSuccess = passSkill + (Math.random() * 30 - 15) > 55;

          stats.totalPasses += 1;
          if (passSuccess) {
            stats.completedPasses += 1;
            if (Math.random() < 0.28) {
              // Assistência ou passe chave!
              stats.keyPasses += 1;
              if (Math.random() < 0.45) {
                // Gol do companheiro com assistência do jogador
                if (isHome) homeScore++;
                else awayScore++;
                stats.assists += 1;
                stats.matchRating = Math.min(10.0, stats.matchRating + 0.7);

                events.push({
                  id: `evt_${i}`,
                  minute,
                  type: 'GOAL',
                  description: `🎯 ASSISTÊNCIA! ${player.name} descola passe magistral milimétrico e o companheiro só empurra pras redes!`,
                  isPlayerInvolved: true,
                  success: true,
                  scoreChange: { home: homeScore, away: awayScore },
                  pitchCoords: { x: targetX, y: targetY },
                  ratingDelta: +0.7,
                });
              } else {
                stats.matchRating = Math.min(10.0, stats.matchRating + 0.2);
                events.push({
                  id: `evt_${i}`,
                  minute,
                  type: 'PASS',
                  description: `${player.name} acha passe excelente quebrando as linhas e cria chance perigosa!`,
                  isPlayerInvolved: true,
                  success: true,
                  pitchCoords: { x: targetX, y: targetY },
                  ratingDelta: +0.2,
                });
              }
            } else {
              stats.matchRating = Math.min(10.0, stats.matchRating + 0.05);
              events.push({
                id: `evt_${i}`,
                minute,
                type: 'PASS',
                description: `${player.name} mantém a circulação de bola com passe curto seguro.`,
                isPlayerInvolved: true,
                success: true,
                pitchCoords: { x: targetX, y: targetY },
              });
            }
          } else {
            stats.matchRating = Math.max(3.0, stats.matchRating - 0.2);
            events.push({
              id: `evt_${i}`,
              minute,
              type: 'PASS',
              description: `${player.name} erra a inversão de bola sob marcação pressão.`,
              isPlayerInvolved: true,
              success: false,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: -0.2,
            });
          }
        } else {
          // Drible no mano a mano
          const dribblePower =
            player.technical.drible * 0.5 +
            player.physical.agilidade * 0.3 +
            player.physical.velocidade * 0.2;
          const dribbleSuccess = dribblePower + (Math.random() * 26 - 13) > 60;

          if (dribbleSuccess) {
            stats.matchRating = Math.min(10.0, stats.matchRating + 0.2);
            events.push({
              id: `evt_${i}`,
              minute,
              type: 'DRIBBLE',
              description: `✨ BELO DRIBLE! ${player.name} deixa o marcador na saudade com finta rápida de corpo.`,
              isPlayerInvolved: true,
              success: true,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: +0.2,
            });
          } else {
            stats.matchRating = Math.max(3.0, stats.matchRating - 0.2);
            events.push({
              id: `evt_${i}`,
              minute,
              type: 'DRIBBLE',
              description: `${player.name} tenta a jogada individual mas é desarmado na entrada da área.`,
              isPlayerInvolved: true,
              success: false,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: -0.2,
            });
          }
        }
      } else {
        // Equipe atacando sem envolvimento direto do jogador
        const teamScoreGoal = Math.random() < 0.12 + teamPowerDelta * 0.08;
        if (teamScoreGoal) {
          if (isHome) homeScore++;
          else awayScore++;
          events.push({
            id: `evt_${i}`,
            minute,
            type: 'GOAL',
            description: `⚽ GOL DO ${currentClub.shortName}! Jogada coletiva bem trabalhada concluída no canto!`,
            isPlayerInvolved: false,
            success: true,
            scoreChange: { home: homeScore, away: awayScore },
            pitchCoords: { x: targetX, y: targetY },
          });
        }
      }
    } else {
      // Adversário atacando (zona defensiva: x < 50)
      const targetX = 10 + Math.random() * 40;
      const targetY = 15 + Math.random() * 70;

      const isGK = player.position === 'GK';
      const isDefensivePlayerInvolved =
        isPlayerOnPitch &&
        (player.position === 'CB' || player.position === 'CDM' || player.position === 'LB' || player.position === 'RB'
          ? Math.random() < 0.45
          : Math.random() < 0.15);
      const isGoalkeeperDuel = isPlayerOnPitch && isGK && Math.random() < 0.55;

      if (isGoalkeeperDuel) {
        // Goalkeeper Duel: reflexos, elasticidade, segurancaMao, saidaDoGol
        const reflexos = player.technical.reflexos ?? 65;
        const elasticidade = player.technical.elasticidade ?? 65;
        const seguranca = player.technical.segurancaMao ?? 65;
        const saida = player.technical.saidaDoGol ?? 63;
        const agilidade = player.physical.agilidade ?? 64;

        const saveSkill = reflexos * 0.4 + elasticidade * 0.3 + seguranca * 0.15 + saida * 0.15;
        const shotDifficulty = opponentClub.reputation * 0.75 + Math.random() * 28;

        if (saveSkill > shotDifficulty) {
          // SAVE!
          stats.saves = (stats.saves || 0) + 1;
          const isDifficult = Math.random() < (reflexos / 100) * 0.4;
          if (isDifficult) {
            stats.savesDifficult = (stats.savesDifficult || 0) + 1;
          }
          const delta = isDifficult ? +0.6 : +0.3;
          stats.matchRating = Math.min(10.0, stats.matchRating + delta);

          const saveDesc = isDifficult
            ? `🧤 DEFESASSA ESPETACULAR! ${player.name} voa no ângulo e espalma com a ponta dos dedos uma bola que entrava na gaveta!`
            : Math.random() < 0.5
            ? `🛑 DEFESA SEGURA! ${player.name} se posiciona com maestria e encaixa o arremate sem dar rebote!`
            : `🥊 SAI DO GOL! ${player.name} sobe soberano entre os atacantes e afasta o perigo de soco com autoridade!`;

          events.push({
            id: `evt_${i}`,
            minute,
            type: 'SAVE',
            description: saveDesc,
            isPlayerInvolved: true,
            success: true,
            pitchCoords: { x: targetX, y: targetY },
            ratingDelta: delta,
          });
        } else {
          // GOL ADVERSÁRIO
          if (isHome) awayScore++;
          else homeScore++;
          stats.goalsConceded = (stats.goalsConceded || 0) + 1;
          stats.matchRating = Math.max(3.0, stats.matchRating - 0.4);

          events.push({
            id: `evt_${i}`,
            minute,
            type: 'GOAL',
            description: `⚽ GOL DO ${opponentClub.shortName}! Chute cruzado forte no cantinho sem chances de defesa para ${player.name}.`,
            isPlayerInvolved: true,
            success: false,
            scoreChange: { home: homeScore, away: awayScore },
            pitchCoords: { x: targetX, y: targetY },
            ratingDelta: -0.4,
          });
        }
      } else if (isDefensivePlayerInvolved && !isGK) {
        stats.tacklesAttempted += 1;
        const tackleSkill =
          player.technical.desarme * 0.45 +
          player.mental.posicionamento * 0.35 +
          player.physical.forca * 0.2;
        const tackleSuccess = tackleSkill + (Math.random() * 26 - 13) > 55;

        if (tackleSuccess) {
          stats.successfulTackles += 1;
          stats.matchRating = Math.min(10.0, stats.matchRating + 0.3);
          events.push({
            id: `evt_${i}`,
            minute,
            type: 'TACKLE',
            description: `🛡️ DESARME CIRÚRGICO! ${player.name} desarma o atacante adversário de forma limpa na bola!`,
            isPlayerInvolved: true,
            success: true,
            pitchCoords: { x: targetX, y: targetY },
            ratingDelta: +0.3,
          });
        } else {
          // Falha ou falta
          if (Math.random() < 0.3) {
            stats.foulsCommitted += 1;
            stats.matchRating = Math.max(3.0, stats.matchRating - 0.3);
            const getCard = Math.random() < 0.35 && stats.yellowCards === 0;
            if (getCard) {
              stats.yellowCards += 1;
              events.push({
                id: `evt_${i}`,
                minute,
                type: 'YELLOW_CARD',
                description: `🟨 CARTÃO AMARELO! ${player.name} comete falta tática para matar contra-ataque promissor.`,
                isPlayerInvolved: true,
                success: false,
                pitchCoords: { x: targetX, y: targetY },
                ratingDelta: -0.4,
              });
            } else {
              events.push({
                id: `evt_${i}`,
                minute,
                type: 'FOUL',
                description: `${player.name} chega atrasado na disputa e o árbitro marca falta perigosa.`,
                isPlayerInvolved: true,
                success: false,
                pitchCoords: { x: targetX, y: targetY },
                ratingDelta: -0.2,
              });
            }
          } else {
            stats.matchRating = Math.max(3.0, stats.matchRating - 0.2);
            events.push({
              id: `evt_${i}`,
              minute,
              type: 'TACKLE',
              description: `${player.name} é ultrapassado na corrida pelo ponta adversário.`,
              isPlayerInvolved: true,
              success: false,
              pitchCoords: { x: targetX, y: targetY },
              ratingDelta: -0.2,
            });
          }
        }
      } else {
        // Adversário finaliza sem envolvimento do jogador
        const oppGoal = Math.random() < 0.11 - teamPowerDelta * 0.08;
        if (oppGoal) {
          if (isHome) awayScore++;
          else homeScore++;
          events.push({
            id: `evt_${i}`,
            minute,
            type: 'GOAL',
            description: `⚽ GOL DO ${opponentClub.shortName}! Finalização certeira vence o nosso goleiro.`,
            isPlayerInvolved: false,
            success: true,
            scoreChange: { home: homeScore, away: awayScore },
            pitchCoords: { x: targetX, y: targetY },
          });
        }
      }
    }
  }

  // Goalkeeper clean sheet calculation
  const opponentScore = isHome ? awayScore : homeScore;
  if (player.position === 'GK' && minutesToPlay >= 60 && opponentScore === 0) {
    stats.cleanSheet = true;
    stats.matchRating = Math.min(10.0, stats.matchRating + 0.8);
  }

  // Final rounding of match rating
  stats.matchRating = Math.round(stats.matchRating * 10) / 10;
  if (minutesToPlay === 0) stats.matchRating = 0;

  return {
    homeScore,
    awayScore,
    events,
    playerStats: stats,
  };
}

/**
 * PILAR 4: Repercussão Pós-Partida (Confiança do Técnico, Hype, Condição Física)
 */
export function processPostMatchEffects(
  player: PlayerCharacter,
  matchStats: MatchStats,
  currentClub: Club,
  wonMatch: boolean
): {
  updatedPlayer: PlayerCharacter;
  summary: {
    coachTrustDelta: number;
    hypeDelta: number;
    fitnessDelta: number;
    sharpnessDelta: number;
    notes: string;
  };
} {
  let coachTrustDelta = 0;
  let hypeDelta = 0;
  let fitnessCost = 0;
  let sharpnessDelta = 0;
  let notes = '';

  if (matchStats.minutesPlayed > 0) {
    // Fitness drain based on minutes played and physical stamina
    const staminaDefense = player.physical.resistencia * 0.15;
    fitnessCost = Math.round((matchStats.minutesPlayed / 90) * (34 - staminaDefense));

    // Sharpness boost
    sharpnessDelta = Math.min(15, Math.round((matchStats.minutesPlayed / 90) * 14));

    // Rating feedback
    const rating = matchStats.matchRating;
    if (rating >= 8.0) {
      coachTrustDelta = Math.floor(Math.random() * 3) + 4; // +4 to +6
      notes = 'Atuação de gala! O treinador e a comissão técnica elogiaram sua dedicação e liderança.';
    } else if (rating >= 7.0) {
      coachTrustDelta = Math.floor(Math.random() * 2) + 2; // +2 to +3
      notes = 'Boa partida profissional e consistente. Cumprimento seguro das orientações táticas.';
    } else if (rating >= 6.0) {
      coachTrustDelta = Math.random() > 0.5 ? 1 : 0;
      notes = 'Atuação protocolar e discreta dentro da média exigida.';
    } else {
      coachTrustDelta = -(Math.floor(Math.random() * 3) + 3); // -3 to -5
      notes = 'Desempenho abaixo do esperado pelo corpo técnico com perdas de posse e falhas táticas.';
    }

    // Hype calculation: boosted by goals, assists, rating, and competition tier
    // Tier 1 gives 4x, Tier 2 3x, Tier 3 2x, Tier 4 1.4x, Tier 5 1x
    const tierMultiplier =
      currentClub.tier === 1
        ? 4.0
        : currentClub.tier === 2
        ? 3.0
        : currentClub.tier === 3
        ? 2.0
        : currentClub.tier === 4
        ? 1.4
        : 1.0;

    const baseHype =
      (rating - 5.5) * 45 +
      matchStats.goals * 120 +
      matchStats.assists * 70 +
      (wonMatch ? 30 : 0);

    hypeDelta = Math.max(0, Math.round(baseHype * tierMultiplier));
  } else {
    // Player did not play
    sharpnessDelta = -4;
    fitnessCost = -6; // Resting slightly recovers energy
    coachTrustDelta = 0;
    notes = 'O jogador não foi utilizado nesta partida e realizou apenas trabalho regenerativo.';
  }

  const newFitness = Math.max(10, Math.min(100, player.state.fitness - fitnessCost));
  const newSharpness = Math.max(0, Math.min(100, player.state.matchSharpness + sharpnessDelta));
  const newCoachTrust = Math.max(0, Math.min(100, player.coachTrust + coachTrustDelta));
  const newHype = Math.min(10000, player.hype + hypeDelta);

  const newRecentRatings =
    matchStats.minutesPlayed > 0
      ? [matchStats.matchRating, ...player.recentRatings.slice(0, 4)]
      : player.recentRatings;

  // Moral calculation
  let moralDelta = 0;
  if (matchStats.minutesPlayed > 45 && matchStats.matchRating >= 6.8) moralDelta += 5;
  if (matchStats.minutesPlayed === 0 && player.contract.promisedRole === 'TITULAR') moralDelta -= 6;
  if (wonMatch) moralDelta += 4;
  const newMoral = Math.max(10, Math.min(100, player.state.moral + moralDelta));

  // Career stats update
  const newCareerStats = {
    ...player.careerStats,
    totalMatches: player.careerStats.totalMatches + (matchStats.minutesPlayed > 0 ? 1 : 0),
    totalGoals: player.careerStats.totalGoals + matchStats.goals,
    totalAssists: player.careerStats.totalAssists + matchStats.assists,
    avgRating:
      matchStats.minutesPlayed > 0
        ? Math.round(
            ((player.careerStats.avgRating * player.careerStats.totalMatches + matchStats.matchRating) /
              (player.careerStats.totalMatches + 1)) *
              10
          ) / 10
        : player.careerStats.avgRating,
  };

  // Organic Attribute Evolution from match actions
  const updatedPhysical = { ...player.physical };
  const updatedTechnical = { ...player.technical };
  const updatedMental = { ...player.mental };
  const updatedXP = { ...player.attributeXP };
  const attributeTrends: Record<string, 'UP' | 'DOWN' | 'STABLE'> = { ...(player.attributeTrends || {}) };
  const organicImproved: string[] = [];

  if (matchStats.minutesPlayed > 0) {
    const organicXP: Record<string, number> = {};
    const ratingMult = matchStats.matchRating >= 7.5 ? 1.6 : matchStats.matchRating >= 6.5 ? 1.1 : 0.6;
    const fraction = matchStats.minutesPlayed / 90;

    // Goals & Shots on target -> Finalização & Compostura
    if (matchStats.goals > 0) {
      organicXP['finalizacao'] = (organicXP['finalizacao'] || 0) + matchStats.goals * 32 * ratingMult;
      organicXP['compostura'] = (organicXP['compostura'] || 0) + matchStats.goals * 20 * ratingMult;
    }
    if (matchStats.shotsOnTarget > 0) {
      organicXP['finalizacao'] = (organicXP['finalizacao'] || 0) + matchStats.shotsOnTarget * 12;
    }

    // Assists & Key Passes -> Visão de Jogo, Passe Curto, Passe Longo
    if (matchStats.assists > 0) {
      organicXP['visaoDeJogo'] = (organicXP['visaoDeJogo'] || 0) + matchStats.assists * 28 * ratingMult;
      organicXP['passeCurto'] = (organicXP['passeCurto'] || 0) + matchStats.assists * 22 * ratingMult;
      organicXP['passeLongo'] = (organicXP['passeLongo'] || 0) + matchStats.assists * 16 * ratingMult;
    }
    if (matchStats.completedPasses > 12) {
      organicXP['passeCurto'] = (organicXP['passeCurto'] || 0) + Math.min(24, Math.round(matchStats.completedPasses * 0.6));
    }

    // Tackles -> Desarme & Marcação
    if (matchStats.successfulTackles > 0) {
      organicXP['desarme'] = (organicXP['desarme'] || 0) + matchStats.successfulTackles * 14 * ratingMult;
      organicXP['marcacao'] = (organicXP['marcacao'] || 0) + matchStats.successfulTackles * 10 * ratingMult;
    }

    // Minutes on pitch develop key positional attributes
    const posInfo = POSITIONS_INFO[player.position] || POSITIONS_INFO.ST;
    posInfo.primaryAttributes.forEach((attrKey) => {
      organicXP[attrKey as string] = (organicXP[attrKey as string] || 0) + Math.round(10 * fraction * ratingMult);
    });

    // Apply XP & check for level-ups (bounded strictly 60 to 99)
    Object.entries(organicXP).forEach(([key, gainXP]) => {
      const currentVal =
        (updatedPhysical as Record<string, number>)[key] ??
        (updatedTechnical as Record<string, number>)[key] ??
        (updatedMental as Record<string, number>)[key] ??
        60;

      if (currentVal >= 99) return;
      if (currentVal >= player.hidden.potentialAbility && player.age < 28) return;

      const currentXP = (updatedXP[key] || 0) + gainXP;
      const xpThreshold = Math.round(55 + currentVal * 1.8);

      if (currentXP >= xpThreshold) {
        if (key in updatedPhysical) {
          (updatedPhysical as Record<string, number>)[key] = Math.min(99, (updatedPhysical as Record<string, number>)[key] + 1);
        } else if (key in updatedTechnical) {
          (updatedTechnical as Record<string, number>)[key] = Math.min(99, (updatedTechnical as Record<string, number>)[key] + 1);
        } else if (key in updatedMental) {
          (updatedMental as Record<string, number>)[key] = Math.min(99, (updatedMental as Record<string, number>)[key] + 1);
        }
        updatedXP[key] = currentXP - xpThreshold;
        attributeTrends[key] = 'UP';
        organicImproved.push(key);
      } else {
        updatedXP[key] = currentXP;
      }
    });
  }

  const newCA = calculateCurrentAbility(
    player.position,
    updatedPhysical,
    updatedTechnical,
    updatedMental
  );

  const updatedPlayer: PlayerCharacter = {
    ...player,
    physical: updatedPhysical,
    technical: updatedTechnical,
    mental: updatedMental,
    attributeXP: updatedXP,
    currentAbility: Math.max(60, Math.min(99, newCA)),
    peakAbility: Math.max(player.peakAbility || newCA, newCA),
    attributeTrends,
    coachTrust: newCoachTrust,
    hype: newHype,
    recentRatings: newRecentRatings,
    careerStats: newCareerStats,
    state: {
      ...player.state,
      fitness: newFitness,
      matchSharpness: newSharpness,
      moral: newMoral,
    },
  };

  return {
    updatedPlayer,
    summary: {
      coachTrustDelta,
      hypeDelta,
      fitnessDelta: -fitnessCost,
      sharpnessDelta,
      notes,
    },
  };
}

/**
 * Natural physiological age degradation & tactical maturity curve
 * - Physical attributes drop after age 31 (-1 to -2 points per year, clamped >= 60)
 * - Mental attributes gain wisdom (+1 in decision/composure/positioning)
 * - Technical attributes hold longer (dropping slightly only after age 35)
 */
export function applyAgeDegradation(player: PlayerCharacter): {
  updatedPlayer: PlayerCharacter;
  degradedAttributes: string[];
  maturedAttributes: string[];
} {
  const age = player.age;
  const updatedPhysical = { ...player.physical };
  const updatedTechnical = { ...player.technical };
  const updatedMental = { ...player.mental };
  const trends: Record<string, 'UP' | 'DOWN' | 'STABLE'> = { ...(player.attributeTrends || {}) };
  const degradedAttributes: string[] = [];
  const maturedAttributes: string[] = [];

  if (age >= 31) {
    const physKeys: (keyof PhysicalAttributes)[] = ['velocidade', 'agilidade', 'resistencia', 'impulsao'];
    
    physKeys.forEach((key) => {
      const dropProb = age >= 37 ? 0.95 : age >= 34 ? 0.8 : 0.6;
      if (Math.random() < dropProb) {
        const dropAmount = age >= 37 ? 2 : age >= 34 ? (Math.random() < 0.5 ? 2 : 1) : 1;
        const currentVal = updatedPhysical[key];
        const nextVal = Math.max(60, currentVal - dropAmount);
        if (nextVal < currentVal) {
          updatedPhysical[key] = nextVal;
          trends[key] = 'DOWN';
          degradedAttributes.push(key);
        }
      }
    });

    // Technical attributes decline only gently after 35
    if (age >= 35) {
      if (player.position === 'GK') {
        const gkTechKeys: (keyof TechnicalAttributes)[] = ['reflexos', 'elasticidade', 'saidaDoGol', 'segurancaMao'];
        gkTechKeys.forEach((key) => {
          if (Math.random() < 0.6 && (updatedTechnical[key] ?? 60) > 60) {
            const drop = age >= 38 ? 2 : 1;
            updatedTechnical[key] = Math.max(60, (updatedTechnical[key] ?? 60) - drop);
            trends[key] = 'DOWN';
            degradedAttributes.push(key);
          }
        });
      } else {
        if (Math.random() < 0.5 && updatedTechnical.drible > 60) {
          updatedTechnical.drible = Math.max(60, updatedTechnical.drible - 1);
          trends['drible'] = 'DOWN';
          degradedAttributes.push('drible');
        }
        if (Math.random() < 0.4 && updatedTechnical.finalizacao > 60) {
          updatedTechnical.finalizacao = Math.max(60, updatedTechnical.finalizacao - 1);
          trends['finalizacao'] = 'DOWN';
          degradedAttributes.push('finalizacao');
        }
      }
    }

    // Mental attributes: mature wisdom
    const mentalKeys: (keyof MentalAttributes)[] = ['compostura', 'decisao', 'posicionamento', 'visaoDeJogo'];
    const matureKey = mentalKeys[Math.floor(Math.random() * mentalKeys.length)];
    if (updatedMental[matureKey] < 99 && Math.random() < 0.75) {
      updatedMental[matureKey] = Math.min(99, updatedMental[matureKey] + 1);
      trends[matureKey] = 'UP';
      maturedAttributes.push(matureKey);
    }
  }

  const newCA = calculateCurrentAbility(player.position, updatedPhysical, updatedTechnical, updatedMental);

  const updatedPlayer: PlayerCharacter = {
    ...player,
    physical: updatedPhysical,
    technical: updatedTechnical,
    mental: updatedMental,
    currentAbility: Math.max(60, Math.min(99, newCA)),
    peakAbility: Math.max(player.peakAbility || newCA, newCA),
    attributeTrends: trends,
  };

  return {
    updatedPlayer,
    degradedAttributes,
    maturedAttributes,
  };
}

/**
 * PILAR 5: Geração de Ofertas de Transferência
 */
export function checkTransferOffers(
  player: PlayerCharacter,
  currentClub: Club,
  currentWeek: number
): TransferOffer[] {
  // Transfer windows: weeks 1-4 (summer/opening) or weeks 18-22 (mid-season)
  const isWindowOpen =
    (currentWeek >= 1 && currentWeek <= 4) || (currentWeek >= 18 && currentWeek <= 22);

  if (!isWindowOpen) return [];

  // Chances scale with player Hype and recent ratings
  const avgRating =
    player.recentRatings.length > 0
      ? player.recentRatings.reduce((a, b) => a + b, 0) / player.recentRatings.length
      : 6.5;

  if (player.hype < 300 && avgRating < 6.8) return [];

  // Determine eligible tiers
  let targetTier = currentClub.tier;
  if (player.hype > 3500 && currentClub.tier > 1) {
    targetTier = (currentClub.tier - 1) as 1 | 2 | 3 | 4;
  } else if (player.hype > 1500 && currentClub.tier > 2) {
    targetTier = (currentClub.tier - 1) as 1 | 2 | 3 | 4;
  }

  const eligibleClubs = CLUBS_DATABASE.filter(
    (c) => c.id !== currentClub.id && c.tier === targetTier
  );

  if (eligibleClubs.length === 0) return [];

  // Generate 1 offer randomly
  if (Math.random() < 0.35 || player.contract.transferRequested) {
    const offeringClub = eligibleClubs[Math.floor(Math.random() * eligibleClubs.length)];
    const wageMultiplier = offeringClub.tier === 1 ? 14 : offeringClub.tier === 2 ? 6 : offeringClub.tier === 3 ? 2.5 : 1.2;

    const offer: TransferOffer = {
      id: `offer_${Date.now()}_${offeringClub.id}`,
      club: offeringClub,
      wageWeekly: Math.round(player.contract.wageWeekly * wageMultiplier + 800),
      promisedRole:
        player.currentAbility > 75
          ? 'TITULAR'
          : player.age < 21
          ? 'JOVEM_DESENVOLVIMENTO'
          : 'ROTATIVO',
      goalBonus: Math.round(player.contract.goalBonus * 1.5),
      appearanceBonus: Math.round(player.contract.appearanceBonus * 1.3),
      releaseClause: Math.round(player.contract.releaseClause * 2.2),
      expiresInWeeks: 2,
    };

    return [offer];
  }

  return [];
}

/**
 * PILAR 5 & SONDAGEM: Probabilidade de Sondagem de Mercado (Scouting)
 * Calculates the realistic probability and breakdown factors for scouting a club move or better contract.
 */
export function calculateScoutingProbability(
  player: PlayerCharacter,
  currentClub: Club,
  focus: ScoutingFocus
): ScoutingProbabilityBreakdown {
  let probability = 38; // base probability
  const factors: { label: string; delta: number; positive: boolean }[] = [];

  // 1. Form & Recent Ratings
  const avgRating =
    player.recentRatings && player.recentRatings.length > 0
      ? player.recentRatings.reduce((a, b) => a + b, 0) / player.recentRatings.length
      : 6.5;

  if (avgRating >= 7.5) {
    probability += 22;
    factors.push({ label: 'Fase espetacular em campo (Média >= 7.5)', delta: 22, positive: true });
  } else if (avgRating >= 7.0) {
    probability += 12;
    factors.push({ label: 'Desempenho consistente (Média >= 7.0)', delta: 12, positive: true });
  } else if (avgRating < 6.4) {
    probability -= 14;
    factors.push({ label: 'Oscilação recente de rendimento (Média < 6.4)', delta: -14, positive: false });
  }

  // 2. Hype & Notoriety
  if (player.hype >= 3000) {
    probability += 18;
    factors.push({ label: 'Atleta com forte apelo de mídia e torcida (Hype 3k+)', delta: 18, positive: true });
  } else if (player.hype >= 1200) {
    probability += 10;
    factors.push({ label: 'Boa visibilidade no mercado (Hype 1.2k+)', delta: 10, positive: true });
  } else if (player.hype < 400) {
    probability -= 6;
    factors.push({ label: 'Pouca repercussão de mercado no momento', delta: -6, positive: false });
  }

  // 3. Current Ability (CA/OVR)
  if (player.currentAbility >= 78) {
    probability += 16;
    factors.push({ label: 'Nível técnico comprovado de elite (OVR 78+)', delta: 16, positive: true });
  } else if (player.currentAbility >= 70) {
    probability += 8;
    factors.push({ label: 'Atleta pronto para ligas competitivas (OVR 70+)', delta: 8, positive: true });
  } else if (player.currentAbility < 64) {
    probability -= 10;
    factors.push({ label: 'Atributos ainda em fase inicial de desenvolvimento', delta: -10, positive: false });
  }

  // 4. Young Prospect / Age bonus
  if (player.age <= 21) {
    probability += 12;
    factors.push({ label: 'Perfil jovem com margem de revenda futura (Sub-21)', delta: 12, positive: true });
  } else if (player.age >= 32) {
    probability -= 8;
    factors.push({ label: 'Idade avançada reduz interesse de longo prazo', delta: -8, positive: false });
  }

  // 5. Transfer request active
  if (player.contract.transferRequested) {
    probability += 15;
    factors.push({ label: 'Agente ativo e atleta formalmente no mercado', delta: 15, positive: true });
  }

  // 6. Focus specifics
  switch (focus) {
    case 'HIGHER_TIER':
      if (currentClub.tier <= 1) {
        probability -= 20;
        factors.push({ label: 'Salto continental/elite europeia exige perfeição', delta: -20, positive: false });
      } else {
        probability -= 16;
        factors.push({ label: 'Clubes de divisão superior são mais seletivos', delta: -16, positive: false });
      }
      break;
    case 'BETTER_WAGE':
      probability -= 8;
      factors.push({ label: 'Exigência de aumento salarial significativo', delta: -8, positive: false });
      break;
    case 'SIMILAR_TIER_ROLE':
      probability += 16;
      factors.push({ label: 'Procura elevada por reforços do mesmo nível', delta: 16, positive: true });
      break;
    case 'EUROPE_GLOBAL':
      probability -= 25;
      factors.push({ label: 'Scouts internacionais avaliam com rigor máximo', delta: -25, positive: false });
      break;
  }

  const clampedProbability = Math.max(10, Math.min(92, probability));
  return {
    probability: clampedProbability,
    factors,
  };
}

/**
 * Execute Scouting Search by spending the week's training slot
 */
export function executeScoutingSearch(
  state: GameState,
  focus: ScoutingFocus
): { updatedState: GameState; report: ScoutingReportResult } {
  const { player, currentClub, currentWeek } = state;
  const breakdown = calculateScoutingProbability(player, currentClub, focus);
  const roll = Math.floor(Math.random() * 100) + 1;
  const success = roll <= breakdown.probability;

  const fitnessCost = 6; // meetings, travel, fitness dedication
  const hypeGain = 50;   // market rumors in sports press

  let feedback = '';
  const newOffers: TransferOffer[] = [];

  if (success) {
    // Generate 1-2 offers aligned with chosen focus
    let candidates: Club[] = [];

    if (focus === 'HIGHER_TIER') {
      const targetTier = Math.max(1, currentClub.tier - 1) as 1 | 2 | 3 | 4;
      candidates = CLUBS_DATABASE.filter((c) => c.id !== currentClub.id && c.tier === targetTier);
      if (candidates.length === 0) {
        candidates = CLUBS_DATABASE.filter((c) => c.id !== currentClub.id && c.reputation > currentClub.reputation);
      }
      feedback = 'Sondagem bem-sucedida! Clubes de divisão superior identificaram seu potencial e enviaram uma proposta oficial.';
    } else if (focus === 'BETTER_WAGE') {
      candidates = CLUBS_DATABASE.filter(
        (c) => c.id !== currentClub.id && (c.budget >= currentClub.budget || c.reputation >= currentClub.reputation)
      );
      feedback = 'Seu empresário encontrou um clube disposto a valorizar seus vencimentos com aumento salarial expressivo!';
    } else if (focus === 'SIMILAR_TIER_ROLE') {
      candidates = CLUBS_DATABASE.filter(
        (c) => c.id !== currentClub.id && c.tier === currentClub.tier
      );
      feedback = 'Clube do mesmo patamar busca um atleta do seu perfil e garante status imediato de titular na equipe!';
    } else if (focus === 'EUROPE_GLOBAL') {
      candidates = CLUBS_DATABASE.filter(
        (c) =>
          c.id !== currentClub.id &&
          (c.league.includes('Premier') ||
            c.league.includes('La Liga') ||
            c.league.includes('Serie A') ||
            c.league.includes('Bundesliga') ||
            c.league.includes('Ligue 1'))
      );
      if (candidates.length === 0) {
        candidates = CLUBS_DATABASE.filter((c) => c.tier === 1 && c.id !== currentClub.id);
      }
      feedback = 'Olheiros europeus aprovaram seu relatório e um clube tradicional formalizou proposta com contrato em euros!';
    }

    // Select up to 2 distinct clubs
    if (candidates.length > 0) {
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const chosenClubs = shuffled.slice(0, Math.min(2, shuffled.length));

      chosenClubs.forEach((offeringClub, idx) => {
        let wage = player.contract.wageWeekly;
        if (focus === 'BETTER_WAGE') {
          wage = Math.round(wage * 1.55 + 900);
        } else if (focus === 'HIGHER_TIER') {
          wage = Math.round(wage * (offeringClub.tier === 1 ? 2.8 : 1.8) + 800);
        } else if (focus === 'EUROPE_GLOBAL') {
          wage = Math.max(7500, Math.round(wage * 3.5 + 2000));
        } else {
          wage = Math.round(wage * 1.25 + 400);
        }

        const promisedRole: PromisedRole =
          focus === 'SIMILAR_TIER_ROLE'
            ? 'TITULAR'
            : player.currentAbility >= 76
            ? 'TITULAR'
            : player.age <= 21
            ? 'JOVEM_DESENVOLVIMENTO'
            : 'ROTATIVO';

        const offer: TransferOffer = {
          id: `scout_offer_${Date.now()}_${offeringClub.id}_${idx}`,
          club: offeringClub,
          wageWeekly: wage,
          promisedRole,
          goalBonus: Math.round(player.contract.goalBonus * 1.4 + 200),
          appearanceBonus: Math.round(player.contract.appearanceBonus * 1.3 + 150),
          releaseClause: Math.round(player.contract.releaseClause * 1.8),
          expiresInWeeks: 3,
        };
        newOffers.push(offer);
      });
    }
  } else {
    // Unsuccessful scouting feedback
    if (focus === 'HIGHER_TIER') {
      feedback = 'Clubes de divisão superior monitoraram suas estatísticas, mas exigem média de nota mais alta (7.2+) e mais regularidade.';
    } else if (focus === 'BETTER_WAGE') {
      feedback = 'As equipes consultadas acharam a pedida salarial do seu empresário elevada para o momento financeiro atual.';
    } else if (focus === 'EUROPE_GLOBAL') {
      feedback = 'Olheiros do exterior arquivaram o relatório por enquanto. Eles solicitam destaque nacional comprovado antes de uma investida.';
    } else {
      feedback = 'A sondagem não converteu em propostas formais esta semana. Os elencos consultados estão com vagas fechadas no setor.';
    }
  }

  const updatedFitness = Math.max(10, player.state.fitness - fitnessCost);
  const updatedHype = player.hype + hypeGain;

  // Append new offers to incomingOffers without duplicate club proposals
  const existingClubIds = new Set(newOffers.map((o) => o.club.id));
  const mergedOffers = [
    ...newOffers,
    ...state.incomingOffers.filter((o) => !existingClubIds.has(o.club.id)),
  ];

  const report: ScoutingReportResult = {
    success,
    focus,
    probability: breakdown.probability,
    factors: breakdown.factors,
    feedbackMessage: feedback,
    offersFound: newOffers,
    hypeGained: hypeGain,
    fitnessConsumed: fitnessCost,
    scoutedAtWeek: currentWeek,
  };

  const updatedState: GameState = {
    ...state,
    player: {
      ...player,
      hype: updatedHype,
      state: {
        ...player.state,
        fitness: updatedFitness,
      },
    },
    trainingDoneThisWeek: true,
    incomingOffers: mergedOffers,
    lastScoutingReport: report,
    notification: {
      title: success ? '🎯 SONDAGEM COM PROPOSTA!' : '📋 RELATÓRIO DE SONDAGEM',
      message: success
        ? `${newOffers.length} nova(s) proposta(s) recebida(s) no mercado!`
        : 'Nenhum clube formalizou oferta esta semana. Oportunidade gerou +50 Hype.',
      type: success ? 'success' : 'info',
    },
  };

  return { updatedState, report };
}

/**
 * Check and grant in-match milestone achievements
 */
export function checkInMatchAchievements(
  player: PlayerCharacter,
  matchStats: MatchStats,
  season: number,
  currentYear: number,
  currentClub: Club,
  week: number
): { updatedPlayer: PlayerCharacter; newAwards: TrophyAward[] } {
  const gallery = [...(player.trophiesGallery || [])];
  const newAwards: TrophyAward[] = [];

  const addAwardIfNotPresent = (code: string, allowMultiple = false) => {
    if (!allowMultiple && gallery.some((t) => t.code === code)) return;
    const def = TROPHIES_CATALOGUE.find((t) => t.code === code);
    if (!def) return;

    const award: TrophyAward = {
      id: `trophy_${code}_s${season}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code: def.code,
      title: def.title,
      category: def.category,
      season,
      year: currentYear,
      clubName: currentClub.name,
      description: def.description,
      rarity: def.rarity,
      unlockedAtWeek: week,
      iconName: def.iconName,
    };
    gallery.push(award);
    newAwards.push(award);
  };

  // Hat-trick check (can be earned multiple times across career!)
  if (matchStats.goals >= 3) {
    const def = TROPHIES_CATALOGUE.find((t) => t.code === 'HAT_TRICK');
    if (def) {
      const award: TrophyAward = {
        id: `trophy_HAT_TRICK_s${season}_w${week}_${Date.now()}`,
        code: def.code,
        title: `Hat-Trick Heroico (${matchStats.goals} Gols)`,
        category: 'INDIVIDUAL',
        season,
        year: currentYear,
        clubName: currentClub.name,
        description: `Marcou ${matchStats.goals} gols de forma sublime contra o adversário na rodada ${week}.`,
        rarity: 'SILVER',
        unlockedAtWeek: week,
        iconName: 'Flame',
      };
      gallery.push(award);
      newAwards.push(award);
    }
  }

  // 100 matches milestone
  if (player.careerStats.totalMatches >= 100) {
    addAwardIfNotPresent('CLUBE_DOS_100');
  }

  // 50 goals milestone (for outfield)
  if (player.careerStats.totalGoals >= 50) {
    addAwardIfNotPresent('CLUBE_DOS_50_GOLS');
  }

  // Goalkeeper in-match milestone: 6+ saves in a single match
  if (player.position === 'GK' && (matchStats.saves || 0) >= 6) {
    const def = TROPHIES_CATALOGUE.find((t) => t.code === 'MURALHA_INTRANSPONIVEL');
    if (def) {
      const award: TrophyAward = {
        id: `trophy_MURALHA_s${season}_w${week}_${Date.now()}`,
        code: def.code,
        title: `Muralha Intransponível (${matchStats.saves} Defesas)`,
        category: 'INDIVIDUAL',
        season,
        year: currentYear,
        clubName: currentClub.name,
        description: `Operou ${matchStats.saves} defesas monumentais para fechar o gol na rodada ${week}.`,
        rarity: 'SILVER',
        unlockedAtWeek: week,
        iconName: 'Shield',
      };
      gallery.push(award);
      newAwards.push(award);
    }
  }

  // Goalkeeper career milestone: 50 clean sheets
  const careerCleanSheets = player.history.reduce((acc, h) => acc + (h.cleanSheets || 0), 0) + (matchStats.cleanSheet ? 1 : 0);
  if (player.position === 'GK' && careerCleanSheets >= 50) {
    addAwardIfNotPresent('CLUBE_DOS_50_CLEANSHEETS');
  }

  if (newAwards.length > 0) {
    const updatedTrophiesList = Array.from(new Set([...player.careerStats.trophies, ...newAwards.map((a) => a.title)]));
    return {
      updatedPlayer: {
        ...player,
        trophiesGallery: gallery,
        careerStats: {
          ...player.careerStats,
          trophies: updatedTrophiesList,
        },
      },
      newAwards,
    };
  }

  return { updatedPlayer: { ...player, trophiesGallery: gallery }, newAwards: [] };
}

/**
 * End-of-season awards and championship evaluation via confrontation of probabilities
 */
export function evaluateSeasonTrophiesAndAwards(params: {
  player: PlayerCharacter;
  currentClub: Club;
  season: number;
  currentYear: number;
  seasonWins: number;
  seasonDraws: number;
  seasonLosses: number;
  seasonMatches: number;
  seasonGoals: number;
  seasonAssists: number;
  seasonAvgRating: number;
}): { newAwards: TrophyAward[]; trophyTitles: string[] } {
  const {
    player,
    currentClub,
    season,
    currentYear,
    seasonWins,
    seasonDraws,
    seasonMatches,
    seasonGoals,
    seasonAssists,
    seasonAvgRating,
  } = params;

  const newAwards: TrophyAward[] = [];
  const existingGallery = player.trophiesGallery || [];

  const addTrophy = (code: string, customDesc?: string, customTitle?: string) => {
    const def = TROPHIES_CATALOGUE.find((t) => t.code === code);
    if (!def) return;

    const award: TrophyAward = {
      id: `award_${code}_s${season}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      code: def.code,
      title: customTitle || `${def.title} - ${currentClub.league}`,
      category: def.category,
      season,
      year: currentYear,
      clubName: currentClub.name,
      description: customDesc || def.description,
      rarity: def.rarity,
      iconName: def.iconName,
    };
    newAwards.push(award);
  };

  // Total points earned by the team in the 38 rounds
  const teamPoints = seasonWins * 3 + seasonDraws;
  
  // 1. Confronto de Probabilidades: TÍTULO DA LIGA NACIONAL
  // Expected points benchmark varies by tier and club prestige:
  // Higher club reputation and higher player CA increases chance of beating the threshold
  const teamPowerBonus = (player.currentAbility - 70) * 0.25;
  const championPointsRequired = Math.round(76 + (100 - currentClub.reputation) * 0.12 - teamPowerBonus * 0.1);

  if (teamPoints >= championPointsRequired || teamPoints >= 82) {
    addTrophy(
      'CAMPEAO_NACIONAL',
      `Campeão incontestável da ${currentClub.league} pelo ${currentClub.name} com ${teamPoints} pontos conquistados!`,
      `Campeão: ${currentClub.league}`
    );
  } else if (teamPoints >= championPointsRequired - 8 || teamPoints >= 70) {
    addTrophy(
      'VICE_CAMPEAO_NACIONAL',
      `Vice-Campeão comemorado da ${currentClub.league} pelo ${currentClub.name} com campanha brilhante de ${teamPoints} pontos.`,
      `Vice-Campeão: ${currentClub.league}`
    );
  }

  // 2. Confronto de Probabilidades: COPA NACIONAL (Torneio Eliminatório de Mata-Mata)
  // Confrontation based on team strength + player clutch stats (compostura & determinação)
  const cupWinProbability = Math.min(
    0.65,
    Math.max(
      0.15,
      (currentClub.reputation / 100) * 0.45 +
        (player.currentAbility / 100) * 0.25 +
        (player.mental.compostura / 100) * 0.15 +
        (player.mental.determinacao / 100) * 0.15
    )
  );

  if (Math.random() < cupWinProbability) {
    addTrophy(
      'TACA_DA_COPA',
      `Conquistou a Taça da Copa Nacional com o ${currentClub.name} em uma final histórica de tirar o fôlego!`,
      `Campeão da Taça da Copa Nacional`
    );
  }

  // 3. Confronto de Probabilidades: GLÓRIA CONTINENTAL (Para clubes de Tier 1 ou 2)
  if (currentClub.tier <= 2) {
    const continentalProbability = Math.min(
      0.60,
      Math.max(
        0.10,
        (currentClub.reputation / 100) * 0.40 +
          (player.currentAbility / 100) * 0.35 +
          (player.mental.decisao / 100) * 0.15
      )
    );

    if (Math.random() < continentalProbability) {
      addTrophy(
        'GLORIA_CONTINENTAL',
        `Campeão Continental Máximo pelo ${currentClub.name}! O continente se curva diante do seu futebol.`,
        `Glória Continental / Campeão dos Campeões`
      );
    }
  }

  // 4. Confronto de Probabilidades: PRÊMIOS INDIVIDUAIS
  // A. Chuteira de Ouro / Artilheiro do Campeonato
  if (seasonGoals >= 15) {
    // Higher goals & higher finishing gives higher probability of topping the league scorer charts
    const goldenBootProb = Math.min(0.98, 0.40 + (seasonGoals - 15) * 0.08 + (player.technical.finalizacao / 100) * 0.20);
    if (Math.random() < goldenBootProb) {
      addTrophy(
        'CHUTEIRA_DE_OURO',
        `Artilheiro isolado da ${currentClub.league} com ${seasonGoals} gols anotados na temporada!`,
        `Chuteira de Ouro (${seasonGoals} Gols)`
      );
    }
  }

  // B. Bola de Ouro / Craque da Liga (MVP)
  if (seasonMatches >= 20 && seasonAvgRating >= 7.30) {
    const mvpProb = Math.min(
      0.95,
      (seasonAvgRating - 7.15) / 0.70 + (player.currentAbility / 100) * 0.20 + (teamPoints >= 70 ? 0.15 : 0)
    );
    if (Math.random() < mvpProb) {
      addTrophy(
        'BOLA_DE_OURO',
        `Eleito o Craque do Campeonato com média espetacular de ${seasonAvgRating.toFixed(1)} e liderança absoluta.`,
        `Bola de Ouro / Melhor da Liga (Média ${seasonAvgRating.toFixed(1)})`
      );
    }
  }

  // C. Rei das Assistências
  if (seasonAssists >= 9) {
    const assistKingProb = Math.min(0.95, 0.40 + (seasonAssists - 9) * 0.10 + (player.mental.visaoDeJogo / 100) * 0.20);
    if (Math.random() < assistKingProb) {
      addTrophy(
        'REI_DAS_ASSISTENCIAS',
        `Líder absoluto de assistências do campeonato com ${seasonAssists} passes açucarados para gol!`,
        `Rei das Assistências (${seasonAssists} Assistências)`
      );
    }
  }

  // D. Revelação do Ano (Sub-21)
  if (player.age <= 21 && seasonMatches >= 15 && seasonAvgRating >= 6.95) {
    const hasAlreadyWon = existingGallery.some((t) => t.code === 'REVELACAO_DO_ANO');
    if (!hasAlreadyWon && Math.random() < 0.85) {
      addTrophy(
        'REVELACAO_DO_ANO',
        `Eleito o Jovem Craque / Revelação da Temporada aos ${player.age} anos de idade.`,
        `Revelação do Ano (${player.age} anos)`
      );
    }
  }

  // E. Paredão / Melhor Defensor da Temporada (Zagueiros, Laterais, Volantes e Goleiro)
  if (['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position) && seasonMatches >= 18 && seasonAvgRating >= 7.15) {
    if (Math.random() < 0.85) {
      addTrophy(
        'PAREDAO_DO_ANO',
        `Eleito o Melhor Defensor do Campeonato com solidez tática inabalável na linha de defesa.`,
        `Paredão do Ano / Defensor de Elite`
      );
    }
  }

  // E.2 Luva de Ouro / Melhor Goleiro do Campeonato (Específico de Goleiro)
  if (player.position === 'GK' && seasonMatches >= 18 && seasonAvgRating >= 7.10) {
    const gkProb = Math.min(0.95, 0.45 + (seasonAvgRating - 7.0) * 1.2);
    if (Math.random() < gkProb) {
      addTrophy(
        'LUVA_DE_OURO',
        `Eleito o Melhor Goleiro da ${currentClub.league} com atuações milagrosas e liderança sob as traves.`,
        `Luva de Ouro / Goleiro do Ano (Média ${seasonAvgRating.toFixed(1)})`
      );
    }
  }

  // F. Seleção do Campeonato
  if (seasonMatches >= 20 && seasonAvgRating >= 7.10) {
    if (Math.random() < 0.90) {
      addTrophy(
        'SELECAO_DO_CAMPEONATO',
        `Escalado no Time Ideal do Ano da ${currentClub.league} por mérito e consistência.`,
        `Seleção dos 11 Melhores do Ano`
      );
    }
  }

  // G. Lenda Imortal do Futebol (Aposentadoria gloriosa)
  if (player.isRetired) {
    const totalTrophies = existingGallery.length + newAwards.length;
    if (totalTrophies >= 4 || season >= 12 || player.careerStats.totalMatches >= 300) {
      const hasLegend = existingGallery.some((t) => t.code === 'LEGADO_ETERNO');
      if (!hasLegend) {
        addTrophy(
          'LEGADO_ETERNO',
          `Consagrado como Lenda Imortal do Futebol Mundial ao encerrar sua carreira aos ${player.age} anos.`,
          `Lenda Imortal do Futebol`
        );
      }
    }
  }

  return {
    newAwards,
    trophyTitles: newAwards.map((a) => a.title),
  };
}

/**
 * Fast individual match simulation with probability confrontation
 */
export function simulateSingleMatchFast(
  player: PlayerCharacter,
  currentClub: Club,
  fixture: MatchFixture,
  playerStatus: SquadRoleStatus
): {
  homeScore: number;
  awayScore: number;
  playerStats: MatchStats;
  isWin: boolean;
  isDraw: boolean;
  updatedPlayer: PlayerCharacter;
  summary: {
    coachTrustDelta: number;
    hypeDelta: number;
    fitnessDelta: number;
    sharpnessDelta: number;
    notes: string;
  };
} {
  const isHome = fixture.homeClub.id === currentClub.id;
  const opponentClub = isHome ? fixture.awayClub : fixture.homeClub;

  // Minutes played based on hierarchy status
  let minutesPlayed = 0;
  if (playerStatus === 'TITULAR_ABSOLUTO') {
    minutesPlayed = 90;
  } else if (playerStatus === 'TITULAR_ROTATIVO') {
    minutesPlayed = 60 + Math.floor(Math.random() * 20); // 60-79 min
  } else if (playerStatus === 'RESERVA') {
    minutesPlayed = Math.random() < 0.8 ? 20 + Math.floor(Math.random() * 15) : 0; // 20-35 min
  } else {
    minutesPlayed = 0;
  }

  // CONFRONTO DE PROBABILIDADES:
  // 1. Team level + Player level vs Opponent level
  const playerBonus = minutesPlayed > 0 ? (player.currentAbility - 68) * 0.35 : 0;
  const teamPower = Math.max(15, currentClub.reputation + playerBonus + (isHome ? 5 : -4));
  const oppPower = Math.max(15, opponentClub.reputation + (isHome ? -4 : 5));

  // Dominance ratio reflects true competitive confrontation
  const dominanceRatio = Math.max(0.3, Math.min(3.5, teamPower / oppPower));

  let ourExpected = 1.35 * Math.pow(dominanceRatio, 1.25);
  let oppExpected = 1.25 * Math.pow(1 / dominanceRatio, 1.25);

  ourExpected = Math.max(0.3, ourExpected);
  oppExpected = Math.max(0.3, oppExpected);

  const rollGoals = (lambda: number) => {
    let g = 0;
    while (Math.random() < lambda / (g + 1.35) && g < 6) {
      g++;
    }
    return g;
  };

  const ourGoals = rollGoals(ourExpected);
  const oppGoals = rollGoals(oppExpected);

  const homeScore = isHome ? ourGoals : oppGoals;
  const awayScore = isHome ? oppGoals : ourGoals;
  const isWin = ourGoals > oppGoals;
  const isDraw = ourGoals === oppGoals;

  // 2. CONFRONTO DE PROBABILIDADES DO JOGADOR:
  // Chance creation & conversion directly tied to player's stats & team dominance
  let playerGoals = 0;
  let playerAssists = 0;
  let shotsOnTarget = 0;
  let shotsOffTarget = 0;
  let completedPasses = 0;
  let totalPasses = 0;
  let successfulTackles = 0;
  let tacklesAttempted = 0;
  let yellowCards = 0;
  let redCards = 0;
  let saves = 0;
  let savesDifficult = 0;
  let goalsConceded = 0;
  let cleanSheet = false;

  if (minutesPlayed > 0) {
    const fraction = minutesPlayed / 90;

    if (player.position === 'GK') {
      // Goalkeeper Match Simulation
      goalsConceded = oppGoals;
      cleanSheet = oppGoals === 0;

      const reflexos = player.technical.reflexos ?? 65;
      const elasticidade = player.technical.elasticidade ?? 65;
      const seguranca = player.technical.segurancaMao ?? 65;
      const posGk = player.mental.posicionamento ?? 65;
      const jogoPes = player.technical.jogoComPes ?? 62;

      // Shots on goal by opponent
      const oppChances = Math.round(oppExpected * 2.8 + Math.random() * 3);
      const totalOppShots = Math.max(oppGoals, oppChances);
      const saveChance = (reflexos * 0.4 + elasticidade * 0.3 + seguranca * 0.15 + posGk * 0.15) / 105;

      const potentialSaves = Math.max(0, totalOppShots - oppGoals);
      for (let s = 0; s < potentialSaves; s++) {
        if (Math.random() < saveChance) {
          saves++;
          if (Math.random() < (reflexos / 100) * 0.35) {
            savesDifficult++;
          }
        }
      }

      totalPasses = Math.round(fraction * (16 + (jogoPes / 80) * 8 + Math.random() * 4));
      completedPasses = Math.round(totalPasses * (jogoPes / 105));
    } else if (['ST', 'LW', 'RW'].includes(player.position)) {
      // Strikers / Wingers: Chances scale with team dominance, posicionamento, velocidade
      const chanceCreationBase = (ourExpected * 1.4) * (player.mental.posicionamento / 80) * (player.physical.velocidade / 85);
      const shotsTotal = Math.max(1, Math.round(fraction * (chanceCreationBase + Math.random() * 2)));
      
      // Shot accuracy depends on finalizacao & compostura
      const accuracyRate = (player.technical.finalizacao * 0.6 + player.mental.compostura * 0.4) / 115;
      shotsOnTarget = Math.round(shotsTotal * Math.min(0.85, accuracyRate));
      shotsOffTarget = Math.max(0, shotsTotal - shotsOnTarget);

      // Conversion of team goals into player goals
      if (ourGoals > 0) {
        // Individual conversion probability (high finishing = lethal scorer)
        const finishingQuality = (player.technical.finalizacao * 0.55 + player.mental.compostura * 0.30 + player.mental.posicionamento * 0.15) / 100;
        const goalProbPerTeamGoal = Math.min(0.70, 0.20 + (finishingQuality - 0.6) * 0.9) * fraction;

        for (let i = 0; i < ourGoals; i++) {
          if (Math.random() < goalProbPerTeamGoal && playerGoals < ourGoals) {
            playerGoals++;
          }
        }
      }

      // Assist probability for wingers / secondary strikers
      const remainGoals = ourGoals - playerGoals;
      if (remainGoals > 0) {
        const assistProb = ((player.mental.visaoDeJogo * 0.5 + player.technical.passeCurto * 0.5) / 100) * 0.32 * fraction;
        if (Math.random() < assistProb) {
          playerAssists = 1;
        }
      }

      totalPasses = Math.round(fraction * (20 + (player.technical.passeCurto / 90) * 15 + Math.random() * 8));
      completedPasses = Math.round(totalPasses * (player.technical.passeCurto / 108));
    } else if (['CAM', 'CM'].includes(player.position)) {
      // Midfielders: Masters of assists and playmaking
      totalPasses = Math.round(fraction * (45 + (player.mental.visaoDeJogo / 75) * 25 + Math.random() * 15));
      const passAccuracy = (player.technical.passeCurto * 0.6 + player.technical.passeLongo * 0.4) / 108;
      completedPasses = Math.round(totalPasses * Math.min(0.92, passAccuracy));

      // Assist probability depends on visao de jogo & passes
      if (ourGoals > 0) {
        const assistProb = ((player.mental.visaoDeJogo * 0.6 + player.technical.passeCurto * 0.25 + player.technical.passeLongo * 0.15) / 100) * 0.48 * fraction;
        for (let i = 0; i < ourGoals; i++) {
          if (Math.random() < assistProb && playerAssists < ourGoals) {
            playerAssists++;
          }
        }
      }

      // Midfielder goal arrival
      const remainGoals = ourGoals - playerAssists;
      if (remainGoals > 0 && Math.random() < (player.technical.finalizacao / 100) * 0.28 * fraction) {
        playerGoals = 1;
      }

      tacklesAttempted = Math.round(fraction * (4 + Math.random() * 4));
      successfulTackles = Math.round(tacklesAttempted * (player.technical.desarme / 110));
    } else {
      // Defenders & Defensive Midfielders: Tackles, clearances, interceptions
      tacklesAttempted = Math.round(fraction * (5 + (player.technical.desarme / 70) * 4 + Math.random() * 3));
      const tackleSkill = (player.technical.desarme * 0.6 + player.technical.marcacao * 0.4) / 110;
      successfulTackles = Math.round(tacklesAttempted * Math.min(0.90, tackleSkill));

      totalPasses = Math.round(fraction * (32 + Math.random() * 16));
      completedPasses = Math.round(totalPasses * 0.85);

      // Set piece or corner header goal
      if (ourGoals > 0 && Math.random() < ((player.technical.cabeceio + player.physical.impulsao) / 200) * 0.18 * fraction) {
        playerGoals = 1;
      }

      if (['LB', 'RB'].includes(player.position) && ourGoals > playerGoals && Math.random() < 0.22 * fraction) {
        playerAssists = 1;
      }
    }

    // Disciplines
    if (Math.random() < (player.position === 'GK' ? 0.03 : 0.10) * fraction) {
      yellowCards = 1;
    }
    if (yellowCards > 0 && Math.random() < 0.03) {
      redCards = 1;
    }
  }

  // Calculate Match Rating (60-99 scale -> 5.5 to 9.9 match rating)
  let rating = 6.2;
  if (minutesPlayed > 0) {
    if (player.position === 'GK') {
      rating += saves * 0.30;
      rating += savesDifficult * 0.55;
      if (oppGoals === 0) {
        rating += 1.4; // Clean sheet bonus
      } else {
        rating -= oppGoals * 0.4;
      }
      rating += isWin ? 0.35 : isDraw ? 0.0 : -0.3;
      rating += Math.random() * 0.4 - 0.2;
      rating = Math.max(5.4, Math.min(9.9, Math.round(rating * 10) / 10));
    } else {
      rating += playerGoals * 1.25;
      rating += playerAssists * 0.75;
      rating += isWin ? 0.35 : isDraw ? 0.0 : -0.3;
      if (oppGoals === 0 && ['CB', 'LB', 'RB', 'CDM'].includes(player.position)) {
        rating += 0.55;
      }
      if (redCards > 0) rating -= 1.8;
      else if (yellowCards > 0) rating -= 0.3;
      rating += Math.random() * 0.5 - 0.25;
      rating = Math.max(5.2, Math.min(9.9, Math.round(rating * 10) / 10));
    }
  } else {
    rating = 0;
  }

  const playerStats: MatchStats = {
    minutesPlayed,
    goals: playerGoals,
    assists: playerAssists,
    shotsOnTarget,
    shotsOffTarget,
    completedPasses,
    totalPasses,
    keyPasses: playerAssists > 0 ? playerAssists + 1 : 0,
    successfulTackles,
    tacklesAttempted,
    foulsCommitted: yellowCards > 0 ? 2 : 1,
    yellowCards,
    redCards,
    matchRating: rating,
    saves,
    savesDifficult,
    goalsConceded,
    cleanSheet,
  };

  const { updatedPlayer: postPlayer, summary } = processPostMatchEffects(
    player,
    playerStats,
    currentClub,
    isWin
  );

  // Check in-match milestone achievements (Hat-trick, 100 games, 50 goals)
  const { updatedPlayer } = checkInMatchAchievements(
    postPlayer,
    playerStats,
    fixture.week,
    2026,
    currentClub,
    fixture.week
  );

  return {
    homeScore,
    awayScore,
    playerStats,
    isWin,
    isDraw,
    updatedPlayer,
    summary,
  };
}

/**
 * Fast Simulation of matches in batches
 * (1 Jogo, 1 Mês / 4 Jogos, 3 Meses / 12 Jogos, 6 Meses / 24 Jogos, ou Temporada Completa)
 */
export function simulateFastBatch(
  initialState: GameState,
  mode: '1_MATCH' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'SEASON'
): {
  updatedState: GameState;
  batchResult: BatchSimulationResult;
} {
  let currentState = { ...initialState };
  let player = { ...currentState.player };
  let competitors = [...currentState.competitors];
  let fixtures = [...currentState.fixtures];
  let currentClub = currentState.currentClub;

  const periodLabels: Record<typeof mode, string> = {
    '1_MATCH': '1 Jogo (Próxima Rodada)',
    '1_MONTH': '1 Mês (~4 Rodadas)',
    '3_MONTHS': '3 Meses (~12 Rodadas)',
    '6_MONTHS': '6 Meses (~24 Rodadas)',
    'SEASON': 'Temporada Completa',
  };

  // Determine target matches count
  const unplayedFixtures = fixtures.filter((f) => !f.played);
  let targetCount = 1;
  if (mode === '1_MATCH') targetCount = 1;
  else if (mode === '1_MONTH') targetCount = 4;
  else if (mode === '3_MONTHS') targetCount = 12;
  else if (mode === '6_MONTHS') targetCount = 24;
  else if (mode === 'SEASON') targetCount = unplayedFixtures.length;

  targetCount = Math.min(targetCount, unplayedFixtures.length);
  if (targetCount === 0) {
    targetCount = 1;
  }

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let playerMatches = 0;
  let playerGoals = 0;
  let playerAssists = 0;
  let playerSaves = 0;
  let playerCleanSheets = 0;
  let ratingSum = 0;
  let ratedMatches = 0;
  let coachTrustDeltaTotal = 0;
  let hypeGainedTotal = 0;
  const allImprovedAttrs = new Set<string>();
  const matchResults: BatchSimulationResult['matchResults'] = [];

  let seasonEnded = false;

  for (let step = 0; step < targetCount; step++) {
    const currentWeek = currentState.currentWeek;
    let fixtureIndex = fixtures.findIndex((f) => f.week === currentWeek && !f.played);
    if (fixtureIndex === -1) {
      fixtureIndex = fixtures.findIndex((f) => !f.played);
    }
    if (fixtureIndex === -1) break;

    const fixture = fixtures[fixtureIndex];

    // 1. Weekly Training with the 2 chosen areas
    const trainingResult = executeWeeklyTraining(player, currentState.activeTrainingPlan);
    player = trainingResult.updatedPlayer;
    trainingResult.summary.improvedAttributes.forEach((attr) => allImprovedAttrs.add(attr));

    // 2. Evaluate hierarchy for squad position
    const { updatedCompetitors, playerStatus } = evaluateSquadHierarchy(player, competitors);
    competitors = updatedCompetitors;

    // 3. Fast simulate match with probability confrontation
    const matchOutcome = simulateSingleMatchFast(player, currentClub, fixture, playerStatus);
    player = matchOutcome.updatedPlayer;

    coachTrustDeltaTotal += matchOutcome.summary.coachTrustDelta;
    hypeGainedTotal += matchOutcome.summary.hypeDelta;

    if (matchOutcome.isWin) wins++;
    else if (matchOutcome.isDraw) draws++;
    else losses++;

    if (matchOutcome.playerStats.minutesPlayed > 0) {
      playerMatches++;
      playerGoals += matchOutcome.playerStats.goals;
      playerAssists += matchOutcome.playerStats.assists;
      playerSaves += matchOutcome.playerStats.saves || 0;
      if (matchOutcome.playerStats.cleanSheet) playerCleanSheets++;
      ratingSum += matchOutcome.playerStats.matchRating;
      ratedMatches++;
    }

    // Save fixture outcome
    fixtures[fixtureIndex] = {
      ...fixture,
      played: true,
      homeScore: matchOutcome.homeScore,
      awayScore: matchOutcome.awayScore,
      playerMatchStats: matchOutcome.playerStats,
      playerStatusForMatch: playerStatus,
    };

    matchResults.push({
      week: fixture.week,
      homeClub: fixture.homeClub.shortName,
      awayClub: fixture.awayClub.shortName,
      homeScore: matchOutcome.homeScore,
      awayScore: matchOutcome.awayScore,
      playerRating: matchOutcome.playerStats.matchRating,
      playerGoals: matchOutcome.playerStats.goals,
      playerAssists: matchOutcome.playerStats.assists,
      playerSaves: matchOutcome.playerStats.saves,
      minutesPlayed: matchOutcome.playerStats.minutesPlayed,
      isWin: matchOutcome.isWin,
    });

    // Competitors slight regeneration
    competitors = competitors.map((c) => ({
      ...c,
      fitness: Math.min(100, Math.max(65, c.fitness + (c.isPlayer ? 0 : Math.floor(Math.random() * 8) - 4))),
    }));

    // Check season end (at week 38)
    const nextWeek = currentWeek + 1;
    if (nextWeek > currentState.totalWeeksInSeason) {
      // End of season
      seasonEnded = true;

      // Calculate this season's specific stats from played fixtures
      const seasonPlayedFixtures = fixtures.filter((f) => f.played && f.playerMatchStats);
      const curSeasonMatches = seasonPlayedFixtures.filter((f) => (f.playerMatchStats?.minutesPlayed || 0) > 0).length;
      const curSeasonGoals = seasonPlayedFixtures.reduce((acc, f) => acc + (f.playerMatchStats?.goals || 0), 0);
      const curSeasonAssists = seasonPlayedFixtures.reduce((acc, f) => acc + (f.playerMatchStats?.assists || 0), 0);
      const curSeasonRatings = seasonPlayedFixtures
        .filter((f) => (f.playerMatchStats?.minutesPlayed || 0) > 0)
        .map((f) => f.playerMatchStats?.matchRating || 0);
      const curSeasonAvgRating =
        curSeasonRatings.length > 0
          ? curSeasonRatings.reduce((a, b) => a + b, 0) / curSeasonRatings.length
          : 0;

      const seasonTotalWins = fixtures.filter((f) => f.played && ((f.homeClub.id === currentClub.id && (f.homeScore || 0) > (f.awayScore || 0)) || (f.awayClub.id === currentClub.id && (f.awayScore || 0) > (f.homeScore || 0)))).length;
      const seasonTotalDraws = fixtures.filter((f) => f.played && f.homeScore === f.awayScore).length;
      const seasonTotalLosses = fixtures.filter((f) => f.played).length - seasonTotalWins - seasonTotalDraws;

      // Evaluate Season Titles & Individual Awards via Confrontation of Probabilities
      const { newAwards, trophyTitles } = evaluateSeasonTrophiesAndAwards({
        player,
        currentClub,
        season: currentState.season,
        currentYear: currentState.currentYear,
        seasonWins: seasonTotalWins,
        seasonDraws: seasonTotalDraws,
        seasonLosses: seasonTotalLosses,
        seasonMatches: curSeasonMatches,
        seasonGoals: curSeasonGoals,
        seasonAssists: curSeasonAssists,
        seasonAvgRating: curSeasonAvgRating,
      });

      const updatedGallery = [...(player.trophiesGallery || []), ...newAwards];
      const updatedCareerTrophies = Array.from(new Set([...player.careerStats.trophies, ...trophyTitles]));

      const newHistory = [
        ...player.history,
        {
          seasonNumber: currentState.season,
          year: currentState.currentYear,
          clubName: currentClub.name,
          leagueName: currentClub.league,
          tier: currentClub.tier,
          matchesPlayed: curSeasonMatches,
          goals: curSeasonGoals,
          assists: curSeasonAssists,
          averageRating: Math.round(curSeasonAvgRating * 10) / 10,
          trophies: trophyTitles,
        },
      ];

      // Age progression & physiological degradation
      const agedPlayer: PlayerCharacter = {
        ...player,
        age: player.age + 1,
        contract: {
          ...player.contract,
          yearsRemaining: Math.max(0, player.contract.yearsRemaining - 1),
        },
        trophiesGallery: updatedGallery,
        careerStats: {
          ...player.careerStats,
          trophies: updatedCareerTrophies,
        },
        history: newHistory,
      };

      const { updatedPlayer: degradedPlayer } = applyAgeDegradation(agedPlayer);
      player = degradedPlayer;

      // Retirement logic (35-39 voluntary, 40 compulsory)
      if (player.age >= 40) {
        player.isRetired = true;
        player.retiredAtSeason = currentState.season;
        currentState.pendingRetirementDecision = true;
      } else if (player.age >= 35) {
        if (player.retirementAnnounced) {
          player.isRetired = true;
          player.retiredAtSeason = currentState.season;
          currentState.pendingRetirementDecision = true;
        } else {
          currentState.pendingRetirementDecision = true;
        }
      }

      // Generate fixtures for new season
      const sameLeagueClubs = CLUBS_DATABASE.filter(
        (c) => c.league === currentClub.league && c.id !== currentClub.id
      );
      const otherClubs =
        sameLeagueClubs.length > 0
          ? sameLeagueClubs
          : CLUBS_DATABASE.filter((c) => c.tier === currentClub.tier && c.id !== currentClub.id);
      const newFixtures: MatchFixture[] = [];
      for (let w = 1; w <= 38; w++) {
        const opp = otherClubs[(w - 1) % otherClubs.length] || otherClubs[0] || CLUBS_DATABASE[0];
        const isH = w % 2 === 1;
        newFixtures.push({
          id: `fix_s${currentState.season + 1}_w${w}`,
          week: w,
          homeClub: isH ? currentClub : opp,
          awayClub: isH ? opp : currentClub,
          played: false,
        });
      }

      fixtures = newFixtures;
      currentState.season += 1;
      currentState.currentYear += 1;
      currentState.currentWeek = 1;
      currentState.currentMatch = newFixtures[0];
      break;
    } else {
      currentState.currentWeek = nextWeek;
      currentState.currentMatch = fixtures.find((f) => f.week === nextWeek) || null;
    }
  }

  // Check incoming transfer offers
  const newOffers = checkTransferOffers(player, currentClub, currentState.currentWeek);
  const incomingOffers = [...newOffers, ...currentState.incomingOffers.filter((o: TransferOffer) => o.expiresInWeeks > 1)];

  // Ensure all player attributes and CA stay bounded strictly in 60-99
  player.currentAbility = Math.max(60, Math.min(99, player.currentAbility));

  const avgRating = ratedMatches > 0 ? Math.round((ratingSum / ratedMatches) * 10) / 10 : 0;

  const batchResult: BatchSimulationResult = {
    periodLabel: periodLabels[mode],
    matchesSimulated: matchResults.length,
    wins,
    draws,
    losses,
    playerMatches,
    playerGoals,
    playerAssists,
    playerSaves,
    playerCleanSheets,
    averageRating: avgRating,
    improvedAttributes: Array.from(allImprovedAttrs),
    coachTrustChange: coachTrustDeltaTotal,
    hypeGained: hypeGainedTotal,
    fitnessCurrent: player.state.fitness,
    sharpnessCurrent: player.state.matchSharpness,
    seasonEnded,
    matchResults,
  };

  const statSummary =
    player.position === 'GK'
      ? `${playerSaves} defesas · ${playerCleanSheets} jogos sem sofrer gols`
      : `${playerGoals} gols · ${playerAssists} assist`;

  const updatedState: GameState = {
    ...currentState,
    player,
    competitors,
    fixtures,
    incomingOffers,
    notification: {
      title: seasonEnded ? 'TEMPORADA FINALIZADA' : 'SIMULAÇÃO CONCLUÍDA',
      message: `${batchResult.periodLabel}: ${wins}V ${draws}E ${losses}D | ${statSummary} | Média ${avgRating > 0 ? avgRating : '-'}`,
      type: 'info',
    },
  };

  return {
    updatedState,
    batchResult,
  };
}
