import { useCallback, useEffect, useState } from 'react';
import {
  CUSTOM_GENRE_ID,
  GENRE_PACKS,
  PLAYER_PRESETS_STORAGE_KEY,
  type WordEntry,
  loadCustomEntries,
  saveCustomEntries,
} from './data/genres';
import {
  type GameConfig,
  type GameScreen,
  type PlayPhase,
  type RoundState,
  accuseSuspect,
  buildDefaultPlayerNames,
  dealNewRound,
  markCurrentPlayerSeenAndAdvance,
} from './game/engine';
import { sfx } from './utils/audio';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TitleScreen } from './components/TitleScreen';
import { HudBar } from './components/HudBar';
import { SetupScreen } from './components/SetupScreen';
import { RevealScreen } from './components/RevealScreen';
import { DiscussVoteScreen } from './components/DiscussVoteScreen';
import { GameOverModal } from './components/GameOverModal';
import { CustomPackModal, PauseModal, RulesModal } from './components/Modals';

function loadSavedPlayerNames(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return buildDefaultPlayerNames(4);
    }
    const raw = window.localStorage.getItem(PLAYER_PRESETS_STORAGE_KEY);
    if (!raw) return buildDefaultPlayerNames(4);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.filter((x): x is string => typeof x === 'string').slice(0, 12);
    }
  } catch {
    // ignore
  }
  return buildDefaultPlayerNames(4);
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [swReady, setSwReady] = useState(false);

  const [screen, setScreen] = useState<GameScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'PLAYING';
    }
    return 'TITLE';
  });

  const [playPhase, setPlayPhase] = useState<PlayPhase>('SETUP');
  const [showRules, setShowRules] = useState(false);
  const [showCustomPack, setShowCustomPack] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [customEntries, setCustomEntries] = useState<WordEntry[]>(() => loadCustomEntries());
  const [usedEntryIds, setUsedEntryIds] = useState<string[]>([]);

  const [config, setConfig] = useState<GameConfig>(() => ({
    playerNames: loadSavedPlayerNames(),
    imposterCount: 1,
    imposterMode: 'WORD_AND_HINT',
    selectedGenreIds: GENRE_PACKS.map((g) => g.id),
    discussionSeconds: 90,
  }));

  const [round, setRound] = useState<RoundState | null>(null);

  // Register offline service worker listener flag
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => setSwReady(true))
        .catch(() => {});
    }
  }, []);

  // Mirror game state onto document.body.dataset.state
  useEffect(() => {
    const stateMap: Record<GameScreen, string> = {
      TITLE: 'title',
      PLAYING: 'playing',
      PAUSED: 'paused',
      GAMEOVER: 'gameover',
    };
    document.body.dataset.state = stateMap[screen];
  }, [screen]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sfx.setMuted(next);
      return next;
    });
  }, []);

  const handleChangeConfig = useCallback((next: GameConfig) => {
    setConfig(next);
    try {
      window.localStorage.setItem(PLAYER_PRESETS_STORAGE_KEY, JSON.stringify(next.playerNames));
    } catch {
      // ignore
    }
  }, []);

  const handleStartFromTitle = useCallback(() => {
    sfx.playTick(1.1);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPlayPhase('SETUP');
    setScreen('PLAYING');
  }, []);

  const handleDealRound = useCallback(() => {
    const newRound = dealNewRound(config, GENRE_PACKS, customEntries, usedEntryIds);
    setRound(newRound);
    setUsedEntryIds((prev) => [...prev.slice(-40), newRound.entry.id]);
    setPlayPhase('REVEAL');
    setScreen('PLAYING');
    sfx.playCardFlip();
  }, [config, customEntries, usedEntryIds]);

  const handleNextReveal = useCallback(() => {
    if (!round) return;
    const { nextRound, allRevealed } = markCurrentPlayerSeenAndAdvance(round);
    setRound(nextRound);
    if (allRevealed) {
      setPlayPhase('DISCUSS');
    }
  }, [round]);

  const handleCardFlipSound = useCallback((isRevealing: boolean, isImposter: boolean) => {
    if (isRevealing) {
      sfx.playRevealRole(isImposter);
    } else {
      sfx.playCardFlip();
    }
  }, []);

  const handleConfirmAccusation = useCallback(
    (targetPlayerId: string) => {
      if (!round) return;
      const updated = accuseSuspect(round, targetPlayerId);
      setRound(updated);

      if (updated.outcome === 'TEAM_WIN') {
        sfx.playVictory();
        setScreen('GAMEOVER');
      } else if (updated.outcome === 'IMPOSTER_WIN') {
        sfx.playDefeat();
        setScreen('GAMEOVER');
      } else {
        if (updated.lastAccusation?.wasImposter) {
          sfx.playVictory();
        } else {
          sfx.playStrikeLose();
        }
        setPlayPhase('STRIKE_RESULT');
      }
    },
    [round]
  );

  const handleAddCustomEntry = useCallback(
    (entry: WordEntry) => {
      const next = [entry, ...customEntries];
      setCustomEntries(next);
      saveCustomEntries(next);
      if (!config.selectedGenreIds.includes(CUSTOM_GENRE_ID)) {
        handleChangeConfig({
          ...config,
          selectedGenreIds: [...config.selectedGenreIds, CUSTOM_GENRE_ID],
        });
      }
      sfx.playTick(1.2);
    },
    [customEntries, config, handleChangeConfig]
  );

  const handleRemoveCustomEntry = useCallback(
    (id: string) => {
      const next = customEntries.filter((e) => e.id !== id);
      setCustomEntries(next);
      saveCustomEntries(next);
      if (next.length === 0 && config.selectedGenreIds.includes(CUSTOM_GENRE_ID)) {
        handleChangeConfig({
          ...config,
          selectedGenreIds: config.selectedGenreIds.filter((gid) => gid !== CUSTOM_GENRE_ID),
        });
      }
      sfx.playTick(0.9);
    },
    [customEntries, config, handleChangeConfig]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      if (screen === 'TITLE' && !showRules && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleStartFromTitle();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowRules((r) => !r);
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (showRules) {
          setShowRules(false);
          return;
        }
        if (showCustomPack) {
          setShowCustomPack(false);
          return;
        }
        if (screen === 'PLAYING') {
          e.preventDefault();
          setScreen('PAUSED');
        } else if (screen === 'PAUSED') {
          e.preventDefault();
          setScreen('PLAYING');
        }
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && screen === 'PLAYING' && playPhase !== 'SETUP') {
        e.preventDefault();
        handleDealRound();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    playPhase,
    showRules,
    showCustomPack,
    handleStartFromTitle,
    handleToggleMute,
    handleDealRound,
  ]);

  if (screen === 'TITLE') {
    return (
      <>
        <TitleScreen
          onStart={handleStartFromTitle}
          onOpenRules={() => {
            sfx.playTick();
            setShowRules(true);
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isOnline={isOnline}
          swReady={swReady}
        />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </>
    );
  }

  return (
    <div className="felt-surface flex min-h-screen w-full flex-col text-[#F3EFE6]">
      <HudBar
        phase={playPhase}
        genreName={round?.genreName}
        chancesLeft={round?.chancesLeft}
        maxChances={round?.maxChances}
        isMuted={isMuted}
        isOnline={isOnline}
        onToggleMute={handleToggleMute}
        onOpenRules={() => {
          sfx.playTick();
          setShowRules(true);
        }}
        onOpenPause={() => {
          sfx.playTick();
          setScreen('PAUSED');
        }}
        onQuickRestart={playPhase !== 'SETUP' ? handleDealRound : undefined}
      />

      <main className="flex flex-1 flex-col">
        {playPhase === 'SETUP' && (
          <SetupScreen
            config={config}
            genrePacks={GENRE_PACKS}
            customEntries={customEntries}
            onChangeConfig={handleChangeConfig}
            onStartRound={handleDealRound}
            onOpenCustomPack={() => {
              sfx.playTick();
              setShowCustomPack(true);
            }}
          />
        )}

        {playPhase === 'REVEAL' && round && (
          <RevealScreen
            round={round}
            onCardFlipSound={handleCardFlipSound}
            onNextPlayer={handleNextReveal}
          />
        )}

        {(playPhase === 'DISCUSS' || playPhase === 'VOTE' || playPhase === 'STRIKE_RESULT') &&
          round && (
            <DiscussVoteScreen
              phase={playPhase}
              round={round}
              discussionSeconds={config.discussionSeconds}
              onStartVote={() => {
                sfx.playTick();
                setPlayPhase('VOTE');
              }}
              onBackToDiscuss={() => {
                sfx.playTick();
                setPlayPhase('DISCUSS');
              }}
              onConfirmAccusation={handleConfirmAccusation}
              onContinueAfterStrike={() => {
                sfx.playTick();
                setPlayPhase('DISCUSS');
              }}
            />
          )}
      </main>

      {screen === 'PAUSED' && (
        <PauseModal
          inActiveRound={playPhase !== 'SETUP'}
          onResume={() => {
            sfx.playTick();
            setScreen('PLAYING');
          }}
          onRestartRound={handleDealRound}
          onReturnToSetup={() => {
            sfx.playTick();
            setPlayPhase('SETUP');
            setScreen('PLAYING');
          }}
          onReturnToTitle={() => {
            sfx.playTick();
            setPlayPhase('SETUP');
            setRound(null);
            setScreen('TITLE');
          }}
        />
      )}

      {screen === 'GAMEOVER' && round && (
        <GameOverModal
          round={round}
          onPlayAgain={handleDealRound}
          onBackToSetup={() => {
            sfx.playTick();
            setPlayPhase('SETUP');
            setScreen('PLAYING');
          }}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {showCustomPack && (
        <CustomPackModal
          entries={customEntries}
          onAddEntry={handleAddCustomEntry}
          onRemoveEntry={handleRemoveCustomEntry}
          onClose={() => setShowCustomPack(false)}
        />
      )}
    </div>
  );
}
