import React, { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerCharacter, Club, SquadCompetitor, MatchFixture, TransferOffer, SquadRoleStatus, WeeklyTrainingPlan } from './types/game';
import { CLUBS_DATABASE } from './utils/constants';
import { evaluateSquadHierarchy, checkTransferOffers, calculateCurrentAbility } from './utils/simulation';
import { getMuted, setMuted, playWhistle, playTacticalClick } from './utils/audio';

import { TitleScreen } from './components/TitleScreen';
import { CreatePlayerModal } from './components/CreatePlayerModal';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TrainingView } from './components/TrainingView';
import { SquadHierarchyView } from './components/SquadHierarchyView';
import { MatchView } from './components/MatchView';
import { ContractMarketView } from './components/ContractMarketView';
import { CareerHistoryView } from './components/CareerHistoryView';
import { RetirementModal } from './components/RetirementModal';

const SAVE_KEY = 'pro_path_career_save_v2';

// Helper to generate realistic competitors in the player's position (60-99 OVR)
function generateCompetitors(club: Club, position: string, playerCA: number): SquadCompetitor[] {
  const competitorNames = [
    'Matheus Nascimento',
    'Rodrigo Garro',
    'Gabriel Pires',
    'Felipe Augusto',
    'Lucas Evangelista',
    'Danilo Boza',
    'Bruno Tubarão',
    'Vinicius Souza',
    'Luan Santos',
    'Kauã Elias',
  ];

  const clampedPlayerCA = Math.max(60, Math.min(99, playerCA));

  return [
    {
      id: `comp_1_${club.id}`,
      name: competitorNames[0],
      age: 27,
      position: position as any,
      ca: Math.max(60, Math.min(99, clampedPlayerCA + 2)),
      fitness: 89,
      sharpness: 84,
      recentForm: [7.1, 6.9, 7.3],
      coachTrust: 78,
      isPlayer: false,
    },
    {
      id: `comp_2_${club.id}`,
      name: competitorNames[1],
      age: 23,
      position: position as any,
      ca: Math.max(60, Math.min(99, clampedPlayerCA - 1)),
      fitness: 94,
      sharpness: 72,
      recentForm: [6.6, 6.7],
      coachTrust: 64,
      isPlayer: false,
    },
    {
      id: `comp_3_${club.id}`,
      name: competitorNames[2],
      age: 31,
      position: position as any,
      ca: Math.max(60, Math.min(99, clampedPlayerCA - 3)),
      fitness: 82,
      sharpness: 60,
      recentForm: [6.3, 6.5],
      coachTrust: 55,
      isPlayer: false,
    },
    {
      id: `comp_4_${club.id}`,
      name: competitorNames[3],
      age: 18,
      position: position as any,
      ca: Math.max(60, Math.min(99, clampedPlayerCA - 5)),
      fitness: 96,
      sharpness: 48,
      recentForm: [6.1],
      coachTrust: 42,
      isPlayer: false,
    },
  ];
}

// Helper to generate 38 fixtures for the league season
function generateFixtures(currentClub: Club): MatchFixture[] {
  const sameLeagueClubs = CLUBS_DATABASE.filter(
    (c) => c.league === currentClub.league && c.id !== currentClub.id
  );
  const otherClubs =
    sameLeagueClubs.length > 0
      ? sameLeagueClubs
      : CLUBS_DATABASE.filter((c) => c.tier === currentClub.tier && c.id !== currentClub.id);

  const fixtures: MatchFixture[] = [];
  const totalWeeks = 38;

  for (let w = 1; w <= totalWeeks; w++) {
    const opp = otherClubs[(w - 1) % otherClubs.length] || otherClubs[0] || CLUBS_DATABASE[0];
    const isHome = w % 2 === 1;

    fixtures.push({
      id: `fix_w${w}`,
      week: w,
      homeClub: isHome ? currentClub : opp,
      awayClub: isHome ? opp : currentClub,
      played: false,
    });
  }

  return fixtures;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manualRetirementModalOpen, setManualRetirementModalOpen] = useState(false);

  // Initialize audio preference and check save game
  useEffect(() => {
    setIsMutedState(getMuted());
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        setHasSavedGame(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMutedState(next);
    setMuted(next);
  };

  // Save current game state
  const handleSaveGame = useCallback(() => {
    if (!gameState) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      setHasSavedGame(true);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              notification: {
                title: 'JOGO SALVO',
                message: 'Progresso da carreira gravado com sucesso.',
                type: 'info',
              },
            }
          : null
      );
    } catch {
      // Storage error
    }
  }, [gameState]);

  // Load saved game
  const handleResumeGame = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const loadedState = JSON.parse(saved) as GameState;
        // Strict dynamic OVR calculation directly from stats
        const realCA = calculateCurrentAbility(
          loadedState.player.position,
          loadedState.player.physical,
          loadedState.player.technical,
          loadedState.player.mental
        );
        loadedState.player.currentAbility = realCA;
        loadedState.competitors = loadedState.competitors.map((c) => ({
          ...c,
          ca: Math.max(60, Math.min(99, c.ca)),
        }));

        setGameState({
          ...loadedState,
          screen: 'DASHBOARD',
        });
      }
    } catch {
      handleNewGamePrompt();
    }
  };

  // Open creation modal
  const handleNewGamePrompt = () => {
    setShowCreateModal(true);
  };

  // Initialize fresh game session
  const handleCreatePlayer = (player: PlayerCharacter, startingClub: Club) => {
    setShowCreateModal(false);

    // Dynamic OVR strictly computed from stats
    player.currentAbility = calculateCurrentAbility(
      player.position,
      player.physical,
      player.technical,
      player.mental
    );

    const competitors = generateCompetitors(startingClub, player.position, player.currentAbility);
    const fixtures = generateFixtures(startingClub);

    const initialWeeklyPlan: WeeklyTrainingPlan = {
      selectedAreas:
        player.position === 'GK'
          ? ['DEFESAS_REFLEXOS', 'ELASTICIDADE_SALTO']
          : ['CHUTE', 'CORRIDA'],
      intensity: 'PADRAO',
    };

    const newState: GameState = {
      screen: 'DASHBOARD',
      season: 1,
      currentYear: 2026,
      currentWeek: 1,
      totalWeeksInSeason: 38,
      player,
      currentClub: startingClub,
      competitors,
      standings: [],
      fixtures,
      currentMatch: fixtures[0],
      activeTrainingPlan: initialWeeklyPlan,
      trainingDoneThisWeek: false,
      incomingOffers: [],
      transferWindowOpen: true,
      notification: {
        title: 'NOVO CONTRATO',
        message: `Vínculo assinado com ${startingClub.name} (${player.currentAbility} OVR).`,
        type: 'info',
      },
    };

    setGameState(newState);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(newState));
      setHasSavedGame(true);
    } catch {
      // Storage error
    }
  };

  // Calculate current squad status
  const currentHierarchy = gameState
    ? evaluateSquadHierarchy(gameState.player, gameState.competitors)
    : { updatedCompetitors: [], playerStatus: 'RESERVA' as SquadRoleStatus };

  // Handle Match Finish & State Update (from Fast Simulation or Match Engine)
  const handleFinishMatch = (updated: Partial<GameState>) => {
    if (!gameState) return;

    setGameState((prev) => {
      if (!prev) return null;

      const nextState: GameState = {
        ...prev,
        ...updated,
      };

      // Ensure player CA and competitor CA are bounded strictly 60-99
      nextState.player.currentAbility = Math.max(60, Math.min(99, nextState.player.currentAbility));
      if (nextState.competitors) {
        nextState.competitors = nextState.competitors.map((c) => ({
          ...c,
          ca: Math.max(60, Math.min(99, c.ca)),
        }));
      }

      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(nextState));
        setHasSavedGame(true);
      } catch {
        // storage error
      }

      return nextState;
    });
  };

  // Transfer acceptance
  const handleAcceptTransfer = (offer: TransferOffer) => {
    if (!gameState) return;

    playWhistle('double');
    const newClub = offer.club;
    const newCompetitors = generateCompetitors(newClub, gameState.player.position, gameState.player.currentAbility);
    const newFixtures = generateFixtures(newClub);

    const updatedContract = {
      clubId: newClub.id,
      clubName: newClub.name,
      wageWeekly: offer.wageWeekly,
      yearsRemaining: 3,
      promisedRole: offer.promisedRole,
      goalBonus: offer.goalBonus,
      appearanceBonus: offer.appearanceBonus,
      cleanSheetBonus: Math.round(offer.goalBonus * 0.8),
      releaseClause: offer.releaseClause,
      relegationClause: true,
      higherTierReleaseClause: true,
      unfulfilledMatchesStreak: 0,
      transferRequested: false,
    };

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentClub: newClub,
        player: {
          ...prev.player,
          contract: updatedContract,
        },
        competitors: newCompetitors,
        fixtures: newFixtures,
        currentMatch: newFixtures[prev.currentWeek - 1] || newFixtures[0],
        incomingOffers: [],
        screen: 'DASHBOARD',
        notification: {
          title: 'TRANSFERÊNCIA ASSINADA',
          message: `Você agora defende o ${newClub.name} (Tier ${newClub.tier}).`,
          type: 'success',
        },
      };
    });
  };

  // Request transfer list
  const handleRequestTransferList = () => {
    if (!gameState) return;
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        player: {
          ...prev.player,
          contract: {
            ...prev.player.contract,
            transferRequested: true,
          },
        },
        notification: {
          title: 'LISTA DE TRANSFERÊNCIAS',
          message: 'Solicitação protocolada. O clube ouvirá propostas na janela.',
          type: 'info',
        },
      };
    });
  };

  // Retirement decision handlers
  const handleRetireNow = () => {
    if (!gameState) return;
    playWhistle('final');
    setGameState((prev) => {
      if (!prev) return null;
      const updatedPlayer: PlayerCharacter = {
        ...prev.player,
        isRetired: true,
        retiredAtSeason: prev.season,
        retirementAnnounced: true,
      };
      const updatedState: GameState = {
        ...prev,
        player: updatedPlayer,
        pendingRetirementDecision: false,
        notification: {
          title: 'APOSENTADORIA OFICIAL',
          message: `Você encerrou oficialmente sua carreira aos ${prev.player.age} anos.`,
          type: 'success',
        },
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(updatedState));
      } catch {
        // ignore
      }
      return updatedState;
    });
    setManualRetirementModalOpen(false);
  };

  const handleContinueSeason = () => {
    if (!gameState) return;
    playTacticalClick();
    setGameState((prev) => {
      if (!prev) return null;
      const updatedState: GameState = {
        ...prev,
        pendingRetirementDecision: false,
        notification: {
          title: 'MAIS UM ANO',
          message: `Decisão confirmada: você jogará a Temporada ${prev.season} como atleta profissional.`,
          type: 'info',
        },
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(updatedState));
      } catch {
        // ignore
      }
      return updatedState;
    });
    setManualRetirementModalOpen(false);
  };

  const handleStartNewCareer = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
    setGameState(null);
    setManualRetirementModalOpen(false);
    setShowCreateModal(true);
  };

  // If on Title Screen or no game loaded
  if (!gameState || gameState.screen === 'TITLE') {
    return (
      <>
        <TitleScreen
          hasSaveGame={hasSavedGame}
          onNewGame={handleNewGamePrompt}
          onResumeGame={handleResumeGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
        <CreatePlayerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreatePlayer={handleCreatePlayer}
        />
      </>
    );
  }

  return (
    <div className="w-screen h-[100dvh] max-h-screen overflow-hidden bg-[#ECECE8] flex items-center justify-center p-0 sm:p-3 select-none">
      {/* Device Shell: Single page view without vertical page scrolling */}
      <div className="w-full sm:max-w-md md:max-w-lg h-full sm:h-[98dvh] sm:max-h-[850px] bg-[#F7F7F5] sm:border-[3px] border-black sm:rounded-[30px] sm:shadow-brutal-lg overflow-hidden flex flex-col justify-between text-black">
        {/* Fixed Top Bar */}
        <TopBar
          state={gameState}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSaveGame={handleSaveGame}
        />

        {/* Global Notification Toast */}
        {gameState.notification && (
          <div className="bg-[#FFCC00] border-b-2 border-black px-3 py-1.5 text-xs text-black font-mono font-bold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-black">[{gameState.notification.title}]</span>
              <span className="truncate">{gameState.notification.message}</span>
            </div>
            <button
              onClick={() => setGameState((prev) => (prev ? { ...prev, notification: null } : null))}
              className="font-black text-xs ml-2 text-black hover:opacity-70"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Viewport Container (Zero Scroll, Flex-1) */}
        <main className="flex-1 overflow-hidden relative">
          {gameState.screen === 'DASHBOARD' && (
            <DashboardView
              state={gameState}
              onNavigate={(screen) => setGameState((prev) => (prev ? { ...prev, screen } : null))}
              playerStatus={currentHierarchy.playerStatus}
              onOpenRetirement={() => setManualRetirementModalOpen(true)}
            />
          )}

          {gameState.screen === 'TRAINING' && (
            <TrainingView
              state={gameState}
              onUpdatePlayer={(updated) => setGameState((prev) => (prev ? { ...prev, ...updated } : null))}
              onNavigateToMatch={() => setGameState((prev) => (prev ? { ...prev, screen: 'MATCH_PRE' } : null))}
            />
          )}

          {gameState.screen === 'SQUAD' && (
            <SquadHierarchyView
              state={gameState}
              onNavigateToMatch={() => setGameState((prev) => (prev ? { ...prev, screen: 'MATCH_PRE' } : null))}
            />
          )}

          {(gameState.screen === 'MATCH_PRE' || gameState.screen === 'MATCH_LIVE' || gameState.screen === 'MATCH_POST') && (
            <MatchView
              state={gameState}
              playerStatus={currentHierarchy.playerStatus}
              onFinishMatch={handleFinishMatch}
              onNavigate={(screen) => setGameState((prev) => (prev ? { ...prev, screen } : null))}
            />
          )}

          {gameState.screen === 'CONTRACT' && (
            <ContractMarketView
              state={gameState}
              onAcceptTransfer={handleAcceptTransfer}
              onRequestTransferList={handleRequestTransferList}
              onUpdateState={(updated) => setGameState((prev) => (prev ? { ...prev, ...updated } : null))}
            />
          )}

          {gameState.screen === 'CAREER' && (
            <CareerHistoryView state={gameState} />
          )}
        </main>

        {/* Fixed Bottom Navigation Bar (Switchable Pages via Bottom Buttons) */}
        <BottomNav
          currentScreen={gameState.screen}
          onSelectScreen={(screen) => setGameState((prev) => (prev ? { ...prev, screen } : null))}
          hasUnreadTransfer={gameState.incomingOffers.length > 0}
        />
      </div>

      {/* Creation Modal */}
      <CreatePlayerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePlayer={handleCreatePlayer}
      />

      {/* Retirement & Memorial Modal */}
      <RetirementModal
        isOpen={manualRetirementModalOpen || !!gameState.pendingRetirementDecision || !!gameState.player.isRetired}
        player={gameState.player}
        currentSeason={gameState.season}
        onRetireNow={handleRetireNow}
        onContinueSeason={handleContinueSeason}
        onStartNewCareer={handleStartNewCareer}
      />
    </div>
  );
}
