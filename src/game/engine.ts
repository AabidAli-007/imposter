import type { GenrePack, WordEntry } from '../data/genres';
import { CUSTOM_GENRE_ID } from '../data/genres';

export const MAX_CHANCES = 3;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type PlayPhase = 'SETUP' | 'REVEAL' | 'DISCUSS' | 'VOTE' | 'STRIKE_RESULT';

export type ImposterMode = 'WORD_AND_HINT' | 'HINT_ONLY' | 'WORD_ONLY';

export type RoundOutcome = 'TEAM_WIN' | 'IMPOSTER_WIN' | null;

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  hasSeenCard: boolean;
  status: 'ACTIVE' | 'CLEARED' | 'CAUGHT';
}

export interface AccusationRecord {
  playerId: string;
  playerName: string;
  wasImposter: boolean;
  chancesRemainingAfter: number;
}

export interface RoundState {
  players: Player[];
  genreId: string;
  genreName: string;
  entry: WordEntry;
  imposterMode: ImposterMode;
  revealIndex: number;
  startingSpeakerIndex: number;
  chancesLeft: number;
  maxChances: number;
  accusations: AccusationRecord[];
  lastAccusation: AccusationRecord | null;
  outcome: RoundOutcome;
}

export interface GameConfig {
  playerNames: string[];
  imposterCount: number;
  imposterMode: ImposterMode;
  selectedGenreIds: string[];
  discussionSeconds: number; // 0 = untimed
}

export function buildDefaultPlayerNames(count = 4): string[] {
  return Array.from({ length: count }, (_, idx) => `Player ${idx + 1}`);
}

export function sanitizePlayerNames(names: string[]): string[] {
  return names
    .map((name, idx) => {
      const trimmed = name.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 22) : `Player ${idx + 1}`;
    })
    .slice(0, MAX_PLAYERS);
}

export function getMaxImpostersForPlayerCount(playerCount: number): number {
  if (playerCount >= 7) return 2;
  return 1;
}

export function collectWordPool(
  genrePacks: GenrePack[],
  selectedGenreIds: string[],
  customEntries: WordEntry[]
): Array<{ genreId: string; genreName: string; entry: WordEntry }> {
  const pool: Array<{ genreId: string; genreName: string; entry: WordEntry }> = [];
  const activeIds = new Set(selectedGenreIds);

  for (const pack of genrePacks) {
    if (activeIds.has(pack.id)) {
      for (const entry of pack.entries) {
        pool.push({ genreId: pack.id, genreName: pack.name, entry });
      }
    }
  }

  if (activeIds.has(CUSTOM_GENRE_ID)) {
    for (const entry of customEntries) {
      pool.push({ genreId: CUSTOM_GENRE_ID, genreName: 'Custom Pack', entry });
    }
  }

  return pool;
}

export function canStartRound(
  config: GameConfig,
  genrePacks: GenrePack[],
  customEntries: WordEntry[]
): { ok: boolean; reason?: string } {
  if (config.playerNames.length < MIN_PLAYERS) {
    return { ok: false, reason: `Add at least ${MIN_PLAYERS} players to start.` };
  }
  if (config.playerNames.length > MAX_PLAYERS) {
    return { ok: false, reason: `Maximum ${MAX_PLAYERS} players supported.` };
  }
  const pool = collectWordPool(genrePacks, config.selectedGenreIds, customEntries);
  if (pool.length === 0) {
    return { ok: false, reason: 'Select at least one genre with words.' };
  }
  return { ok: true };
}

export function dealNewRound(
  config: GameConfig,
  genrePacks: GenrePack[],
  customEntries: WordEntry[],
  usedEntryIds: string[] = [],
  rng: () => number = Math.random
): RoundState {
  const names = sanitizePlayerNames(config.playerNames);
  if (names.length < MIN_PLAYERS) {
    throw new Error(`At least ${MIN_PLAYERS} players are required.`);
  }

  const allPool = collectWordPool(genrePacks, config.selectedGenreIds, customEntries);
  if (allPool.length === 0) {
    throw new Error('No word entries available for the selected genres.');
  }

  const usedSet = new Set(usedEntryIds);
  const freshPool = allPool.filter((item) => !usedSet.has(item.entry.id));
  const activePool = freshPool.length > 0 ? freshPool : allPool;

  const picked = activePool[Math.floor(rng() * activePool.length)];

  const clampedImposters = Math.min(
    Math.max(1, config.imposterCount),
    getMaxImpostersForPlayerCount(names.length)
  );

  // Pick unique imposter indices using Fisher-Yates partial shuffle
  const indices = names.map((_, idx) => idx);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const imposterIndexSet = new Set(indices.slice(0, clampedImposters));

  const players: Player[] = names.map((name, idx) => ({
    id: `p-${idx + 1}`,
    name,
    isImposter: imposterIndexSet.has(idx),
    hasSeenCard: false,
    status: 'ACTIVE',
  }));

  const startingSpeakerIndex = Math.floor(rng() * players.length);

  return {
    players,
    genreId: picked.genreId,
    genreName: picked.genreName,
    entry: picked.entry,
    imposterMode: config.imposterMode,
    revealIndex: 0,
    startingSpeakerIndex,
    chancesLeft: MAX_CHANCES,
    maxChances: MAX_CHANCES,
    accusations: [],
    lastAccusation: null,
    outcome: null,
  };
}

export function getPlayerSecretView(
  player: Player,
  round: RoundState
): {
  roleLabel: 'IMPOSTER' | 'TEAM';
  primaryWord: string | null;
  hintText: string | null;
} {
  if (!player.isImposter) {
    return {
      roleLabel: 'TEAM',
      primaryWord: round.entry.teamWord,
      hintText: null,
    };
  }

  switch (round.imposterMode) {
    case 'WORD_AND_HINT':
      return {
        roleLabel: 'IMPOSTER',
        primaryWord: round.entry.imposterWord,
        hintText: round.entry.hint,
      };
    case 'WORD_ONLY':
      return {
        roleLabel: 'IMPOSTER',
        primaryWord: round.entry.imposterWord,
        hintText: null,
      };
    case 'HINT_ONLY':
      return {
        roleLabel: 'IMPOSTER',
        primaryWord: null,
        hintText: round.entry.hint,
      };
  }
}

export function markCurrentPlayerSeenAndAdvance(round: RoundState): {
  nextRound: RoundState;
  allRevealed: boolean;
} {
  const updatedPlayers = round.players.map((p, idx) =>
    idx === round.revealIndex ? { ...p, hasSeenCard: true } : p
  );
  const nextIndex = round.revealIndex + 1;
  const allRevealed = nextIndex >= updatedPlayers.length;

  return {
    nextRound: {
      ...round,
      players: updatedPlayers,
      revealIndex: allRevealed ? round.revealIndex : nextIndex,
    },
    allRevealed,
  };
}

export function accuseSuspect(round: RoundState, targetPlayerId: string): RoundState {
  if (round.outcome !== null || round.chancesLeft <= 0) {
    return round;
  }

  const target = round.players.find((p) => p.id === targetPlayerId);
  if (!target || target.status !== 'ACTIVE') {
    return round;
  }

  const wasImposter = target.isImposter;
  const nextChances = wasImposter ? round.chancesLeft : Math.max(0, round.chancesLeft - 1);

  const updatedPlayers = round.players.map((p) => {
    if (p.id !== targetPlayerId) return p;
    return {
      ...p,
      status: wasImposter ? ('CAUGHT' as const) : ('CLEARED' as const),
    };
  });

  const remainingImposters = updatedPlayers.filter(
    (p) => p.isImposter && p.status === 'ACTIVE'
  ).length;

  let outcome: RoundOutcome = null;
  if (remainingImposters === 0) {
    outcome = 'TEAM_WIN';
  } else if (nextChances === 0) {
    outcome = 'IMPOSTER_WIN';
  }

  const record: AccusationRecord = {
    playerId: target.id,
    playerName: target.name,
    wasImposter,
    chancesRemainingAfter: nextChances,
  };

  return {
    ...round,
    players: updatedPlayers,
    chancesLeft: nextChances,
    accusations: [...round.accusations, record],
    lastAccusation: record,
    outcome,
  };
}

export function validateCustomWordInput(
  teamWord: string,
  imposterWord: string,
  hint: string
): { valid: boolean; error?: string; entry?: WordEntry } {
  const cleanTeam = teamWord.trim();
  const cleanImposter = imposterWord.trim();
  const cleanHint = hint.trim();

  if (cleanTeam.length < 2) {
    return { valid: false, error: 'Team word must be at least 2 characters.' };
  }
  if (cleanImposter.length < 2) {
    return { valid: false, error: 'Imposter word must be at least 2 characters.' };
  }
  if (cleanTeam.toLowerCase() === cleanImposter.toLowerCase()) {
    return { valid: false, error: 'Imposter word must be different from the Team word.' };
  }
  if (cleanHint.length < 4) {
    return { valid: false, error: 'Hint must be at least 4 characters.' };
  }

  return {
    valid: true,
    entry: {
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teamWord: cleanTeam,
      imposterWord: cleanImposter,
      hint: cleanHint,
    },
  };
}
