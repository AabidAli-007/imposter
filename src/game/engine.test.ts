import test from 'node:test';
import assert from 'node:assert/strict';
import { GENRE_PACKS } from '../data/genres';
import {
  MAX_CHANCES,
  accuseSuspect,
  canStartRound,
  dealNewRound,
  getPlayerSecretView,
  markCurrentPlayerSeenAndAdvance,
  validateCustomWordInput,
} from './engine';

function makeSeededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test('dealNewRound assigns exact imposter count and shared team word', () => {
  const round = dealNewRound(
    {
      playerNames: ['Alice', 'Bob', 'Charlie', 'Dana', 'Eli'],
      imposterCount: 1,
      imposterMode: 'WORD_AND_HINT',
      selectedGenreIds: ['everyday'],
      discussionSeconds: 90,
    },
    GENRE_PACKS,
    [],
    [],
    makeSeededRng(7)
  );

  assert.equal(round.chancesLeft, MAX_CHANCES);
  assert.equal(round.maxChances, 3);
  const imposters = round.players.filter((p) => p.isImposter);
  const team = round.players.filter((p) => !p.isImposter);
  assert.equal(imposters.length, 1);
  assert.equal(team.length, 4);

  const impView = getPlayerSecretView(imposters[0], round);
  assert.equal(impView.roleLabel, 'IMPOSTER');
  assert.equal(impView.primaryWord, round.entry.imposterWord);
  assert.equal(impView.hintText, round.entry.hint);
  assert.notEqual(impView.primaryWord, round.entry.teamWord);

  for (const member of team) {
    const view = getPlayerSecretView(member, round);
    assert.equal(view.roleLabel, 'TEAM');
    assert.equal(view.primaryWord, round.entry.teamWord);
    assert.equal(view.hintText, null);
  }
});

test('team has strictly 3 chances: 3 wrong accusations lose the round', () => {
  let round = dealNewRound(
    {
      playerNames: ['P1', 'P2', 'P3', 'P4', 'P5'],
      imposterCount: 1,
      imposterMode: 'HINT_ONLY',
      selectedGenreIds: ['cinema'],
      discussionSeconds: 0,
    },
    GENRE_PACKS,
    [],
    [],
    makeSeededRng(99)
  );

  const innocents = round.players.filter((p) => !p.isImposter);
  assert.ok(innocents.length >= 3);

  round = accuseSuspect(round, innocents[0].id);
  assert.equal(round.chancesLeft, 2);
  assert.equal(round.outcome, null);
  assert.equal(round.players.find((p) => p.id === innocents[0].id)?.status, 'CLEARED');

  round = accuseSuspect(round, innocents[1].id);
  assert.equal(round.chancesLeft, 1);
  assert.equal(round.outcome, null);

  round = accuseSuspect(round, innocents[2].id);
  assert.equal(round.chancesLeft, 0);
  assert.equal(round.outcome, 'IMPOSTER_WIN');
});

test('catching the imposter on the 3rd chance triggers TEAM_WIN', () => {
  let round = dealNewRound(
    {
      playerNames: ['P1', 'P2', 'P3', 'P4'],
      imposterCount: 1,
      imposterMode: 'WORD_ONLY',
      selectedGenreIds: ['gaming'],
      discussionSeconds: 60,
    },
    GENRE_PACKS,
    [],
    [],
    makeSeededRng(12)
  );

  const innocents = round.players.filter((p) => !p.isImposter);
  const imposter = round.players.find((p) => p.isImposter)!;

  round = accuseSuspect(round, innocents[0].id);
  round = accuseSuspect(round, innocents[1].id);
  assert.equal(round.chancesLeft, 1);
  assert.equal(round.outcome, null);

  round = accuseSuspect(round, imposter.id);
  assert.equal(round.chancesLeft, 1);
  assert.equal(round.outcome, 'TEAM_WIN');
  assert.equal(round.players.find((p) => p.id === imposter.id)?.status, 'CAUGHT');
});

test('2-imposter mode requires catching both imposters to win', () => {
  let round = dealNewRound(
    {
      playerNames: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
      imposterCount: 2,
      imposterMode: 'WORD_AND_HINT',
      selectedGenreIds: ['scifi'],
      discussionSeconds: 60,
    },
    GENRE_PACKS,
    [],
    [],
    makeSeededRng(2026)
  );

  const imposters = round.players.filter((p) => p.isImposter);
  assert.equal(imposters.length, 2);

  round = accuseSuspect(round, imposters[0].id);
  assert.equal(round.chancesLeft, 3);
  assert.equal(round.outcome, null);

  round = accuseSuspect(round, imposters[1].id);
  assert.equal(round.outcome, 'TEAM_WIN');
});

test('pass-and-play reveal advances through all players sequentially', () => {
  let round = dealNewRound(
    {
      playerNames: ['A', 'B', 'C'],
      imposterCount: 1,
      imposterMode: 'WORD_AND_HINT',
      selectedGenreIds: ['everyday'],
      discussionSeconds: 0,
    },
    GENRE_PACKS,
    [],
    [],
    makeSeededRng(3)
  );

  let step = markCurrentPlayerSeenAndAdvance(round);
  assert.equal(step.allRevealed, false);
  assert.equal(step.nextRound.revealIndex, 1);

  step = markCurrentPlayerSeenAndAdvance(step.nextRound);
  assert.equal(step.allRevealed, false);
  assert.equal(step.nextRound.revealIndex, 2);

  step = markCurrentPlayerSeenAndAdvance(step.nextRound);
  assert.equal(step.allRevealed, true);
  assert.ok(step.nextRound.players.every((p) => p.hasSeenCard));
});

test('canStartRound and validateCustomWordInput enforce valid configurations', () => {
  const badStart = canStartRound(
    {
      playerNames: ['One', 'Two'],
      imposterCount: 1,
      imposterMode: 'WORD_AND_HINT',
      selectedGenreIds: ['everyday'],
      discussionSeconds: 60,
    },
    GENRE_PACKS,
    []
  );
  assert.equal(badStart.ok, false);

  const sameWord = validateCustomWordInput('Pizza', 'pizza', 'Cheesy slice');
  assert.equal(sameWord.valid, false);

  const validWord = validateCustomWordInput('Pizza', 'Calzone', 'Folded or flat baked crust');
  assert.equal(validWord.valid, true);
  assert.equal(validWord.entry?.teamWord, 'Pizza');
});

test('all 18 curated genres have unique IDs and distinct team/imposter words', () => {
  const expectedNewIds = [
    'after_dark',
    'everyday_objects',
    'food_drinks',
    'sports_games',
    'tamil_movies',
    'jobs_roles',
    'transport',
    'indian_holidays',
  ];

  assert.equal(GENRE_PACKS.length, 18);
  const seenIds = new Set<string>();

  for (const pack of GENRE_PACKS) {
    assert.ok(pack.entries.length >= 26, `${pack.name} should have at least 26 entries`);
    for (const entry of pack.entries) {
      assert.ok(!seenIds.has(entry.id), `Duplicate entry id: ${entry.id}`);
      seenIds.add(entry.id);
      assert.ok(entry.teamWord.trim().length >= 2);
      assert.ok(entry.imposterWord.trim().length >= 2);
      assert.ok(entry.hint.trim().length >= 6);
      assert.notEqual(
        entry.teamWord.trim().toLowerCase(),
        entry.imposterWord.trim().toLowerCase(),
        `Entry ${entry.id} has matching team & imposter words`
      );
    }
  }

  for (const id of expectedNewIds) {
    const round = dealNewRound(
      {
        playerNames: ['A', 'B', 'C', 'D'],
        imposterCount: 1,
        imposterMode: 'WORD_AND_HINT',
        selectedGenreIds: [id],
        discussionSeconds: 90,
      },
      GENRE_PACKS,
      [],
      [],
      makeSeededRng(101)
    );
    assert.equal(round.genreId, id);
    assert.notEqual(round.entry.teamWord, round.entry.imposterWord);
  }
});

