import React from 'react';
import { Plus, Minus, Sparkles, SlidersHorizontal, Check, Shuffle } from 'lucide-react';
import type { GenrePack, WordEntry } from '../data/genres';
import { CUSTOM_GENRE_ID } from '../data/genres';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type GameConfig,
  type ImposterMode,
  canStartRound,
  collectWordPool,
  getMaxImpostersForPlayerCount,
} from '../game/engine';

interface SetupScreenProps {
  config: GameConfig;
  genrePacks: GenrePack[];
  customEntries: WordEntry[];
  onChangeConfig: (next: GameConfig) => void;
  onStartRound: () => void;
  onOpenCustomPack: () => void;
}

const MODE_OPTIONS: Array<{ value: ImposterMode; label: string; desc: string }> = [
  {
    value: 'WORD_AND_HINT',
    label: 'Decoy Word + Hint',
    desc: 'Imposter gets a closely related different word plus a subtle hint.',
  },
  {
    value: 'HINT_ONLY',
    label: 'Hint Only (Classic)',
    desc: 'Imposter sees no word — only a subtle clue to bluff from.',
  },
  {
    value: 'WORD_ONLY',
    label: 'Decoy Word Only',
    desc: 'Imposter gets a different word with no hint at all.',
  },
];

const TIMER_OPTIONS = [
  { value: 0, label: 'Untimed' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '120s' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  config,
  genrePacks,
  customEntries,
  onChangeConfig,
  onStartRound,
  onOpenCustomPack,
}) => {
  const maxImposters = getMaxImpostersForPlayerCount(config.playerNames.length);
  const pool = collectWordPool(genrePacks, config.selectedGenreIds, customEntries);
  const startCheck = canStartRound(config, genrePacks, customEntries);

  const handleAddPlayer = () => {
    if (config.playerNames.length >= MAX_PLAYERS) return;
    const nextNames = [...config.playerNames, `Player ${config.playerNames.length + 1}`];
    onChangeConfig({ ...config, playerNames: nextNames });
  };

  const handleRemovePlayer = (index: number) => {
    if (config.playerNames.length <= MIN_PLAYERS) return;
    const nextNames = config.playerNames.filter((_, idx) => idx !== index);
    const nextMaxImp = getMaxImpostersForPlayerCount(nextNames.length);
    onChangeConfig({
      ...config,
      playerNames: nextNames,
      imposterCount: Math.min(config.imposterCount, nextMaxImp),
    });
  };

  const handleRenamePlayer = (index: number, value: string) => {
    const nextNames = config.playerNames.map((n, idx) => (idx === index ? value : n));
    onChangeConfig({ ...config, playerNames: nextNames });
  };

  const toggleGenre = (genreId: string) => {
    const exists = config.selectedGenreIds.includes(genreId);
    const nextIds = exists
      ? config.selectedGenreIds.filter((id) => id !== genreId)
      : [...config.selectedGenreIds, genreId];
    onChangeConfig({ ...config, selectedGenreIds: nextIds });
  };

  const selectAllFreeGenres = () => {
    const allIds = genrePacks.map((g) => g.id);
    if (customEntries.length > 0) allIds.push(CUSTOM_GENRE_ID);
    onChangeConfig({ ...config, selectedGenreIds: allIds });
  };

  const clearGenres = () => {
    onChangeConfig({ ...config, selectedGenreIds: [] });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#F7F4EC] md:text-3xl">
            Match Setup
          </h2>
          <p className="text-sm text-[#B7B1A4]">
            All {genrePacks.length} genres are 100% free and offline-ready. The team gets 3 chances to catch the imposter.
          </p>
        </div>
        <div className="font-mono-num text-xs font-medium text-[#E5A93C]">
          {pool.length} Active Word Pairs
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Players & Rules */}
        <section className="space-y-6 rounded-xl border border-white/10 bg-[#121C18] p-5 lg:col-span-5">
          {/* Player Roster */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#F7F4EC]">
                  Players ({config.playerNames.length}/{MAX_PLAYERS})
                </h3>
                <p className="text-xs text-[#A9A396]">Pass one device around the circle</p>
              </div>
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={config.playerNames.length >= MAX_PLAYERS}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E5A93C]/40 bg-[#182620] px-3 py-1.5 text-xs font-semibold text-[#F3EFE6] hover:border-[#E5A93C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
                <span>Add Player</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {config.playerNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <label htmlFor={`player-name-${idx}`} className="sr-only">
                    Player {idx + 1} name
                  </label>
                  <input
                    id={`player-name-${idx}`}
                    type="text"
                    value={name}
                    maxLength={22}
                    onChange={(e) => handleRenamePlayer(idx, e.target.value)}
                    placeholder={`Player ${idx + 1}`}
                    className="min-h-[40px] w-full rounded-lg border border-white/15 bg-[#0C1310] px-3 py-2 text-sm font-medium text-[#F7F4EC] placeholder:text-[#6B665D] focus:border-[#E5A93C] focus:outline-none"
                  />
                  {config.playerNames.length > MIN_PLAYERS && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      aria-label={`Remove ${name || `Player ${idx + 1}`}`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0C1310] text-[#A9A396] hover:border-[#D43F3F]/60 hover:text-[#F28482] transition-colors cursor-pointer"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Imposter Mode */}
          <div>
            <h3 className="mb-2.5 font-display text-base font-bold text-[#F7F4EC]">
              Imposter Clue Rule
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {MODE_OPTIONS.map((opt) => {
                const active = config.imposterMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeConfig({ ...config, imposterMode: opt.value })}
                    className={`flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#E5A93C] bg-[#1C2A24] text-[#F7F4EC]'
                        : 'border-white/10 bg-[#0E1613] text-[#C7C1B4] hover:border-white/25'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {active && <Check className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />}
                    </div>
                    <span className="mt-0.5 text-xs text-[#A9A396]">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Imposter Count & Discussion Timer */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-semibold tracking-wider text-[#A9A396] uppercase">
                Imposters
              </span>
              <div className="flex items-center gap-1.5 rounded-lg bg-[#0C1310] p-1 border border-white/10">
                {[1, 2].map((count) => {
                  const disabled = count > maxImposters;
                  const active = config.imposterCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChangeConfig({ ...config, imposterCount: count })}
                      className={`flex-1 min-h-[38px] rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                        active
                          ? 'bg-[#E5A93C] text-[#101714]'
                          : 'text-[#C7C1B4] hover:text-[#F7F4EC]'
                      }`}
                    >
                      {count} {count === 1 ? 'Imposter' : 'Imposters'}
                    </button>
                  );
                })}
              </div>
              {maxImposters < 2 && (
                <p className="mt-1 text-[11px] text-[#8E887C]">2 Imposters unlock at 7+ players</p>
              )}
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold tracking-wider text-[#A9A396] uppercase">
                Discussion Timer
              </span>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#0C1310] p-1 border border-white/10">
                {TIMER_OPTIONS.map((opt) => {
                  const active = config.discussionSeconds === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChangeConfig({ ...config, discussionSeconds: opt.value })}
                      className={`min-h-[38px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E5A93C] text-[#101714]'
                          : 'text-[#C7C1B4] hover:text-[#F7F4EC]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: 10 Free Genres + Custom Deck + Start Action */}
        <section className="flex flex-col gap-5 rounded-xl border border-white/10 bg-[#121C18] p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#F7F4EC]">
                Select Genres ({config.selectedGenreIds.length} active)
              </h3>
              <p className="text-xs text-[#A9A396]">
                Mix multiple packs together for unpredictable rounds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFreeGenres}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#17231E] px-3 py-1.5 text-xs font-semibold text-[#F3EFE6] hover:border-[#E5A93C]/50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Shuffle className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
                <span>Select All</span>
              </button>
              <button
                type="button"
                onClick={clearGenres}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-white/10 bg-[#0E1613] px-3 py-1.5 text-xs font-medium text-[#A9A396] hover:text-[#F7F4EC] transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:max-h-[470px] lg:overflow-y-auto lg:pr-1">
            {genrePacks.map((pack) => {
              const selected = config.selectedGenreIds.includes(pack.id);
              return (
                <button
                  key={pack.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGenre(pack.id)}
                  className={`flex min-h-[72px] flex-col justify-between rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    selected
                      ? pack.isMature
                        ? 'border-[#D94F4F] bg-[#251517]'
                        : 'border-[#E5A93C] bg-[#1A2822]'
                      : 'border-white/10 bg-[#0D1411] hover:border-white/25'
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-display text-sm font-bold text-[#F7F4EC] truncate">
                        {pack.name}
                      </span>
                      {pack.isMature && (
                        <span className="text-[11px] font-bold text-[#F28482] shrink-0">
                          Adults Only
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        selected
                          ? pack.isMature
                            ? 'border-[#D94F4F] bg-[#D94F4F] text-white'
                            : 'border-[#E5A93C] bg-[#E5A93C] text-[#101714]'
                          : 'border-white/20 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#A9A396]">
                    <span className="truncate">{pack.tagline}</span>
                    <span className="font-mono-num shrink-0 text-[#D8D2C5]">
                      {pack.entries.length}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Custom Offline Word Pack Tile */}
            <div
              className={`flex min-h-[76px] flex-col justify-between rounded-lg border p-3.5 sm:col-span-2 ${
                config.selectedGenreIds.includes(CUSTOM_GENRE_ID)
                  ? 'border-[#E5A93C] bg-[#1A2822]'
                  : 'border-white/10 bg-[#0D1411]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={customEntries.length === 0}
                  aria-pressed={config.selectedGenreIds.includes(CUSTOM_GENRE_ID)}
                  onClick={() => toggleGenre(CUSTOM_GENRE_ID)}
                  className="flex flex-1 items-center gap-2.5 text-left cursor-pointer disabled:cursor-default"
                >
                  <Sparkles className="h-4 w-4 text-[#E5A93C] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-display text-sm font-bold text-[#F7F4EC]">
                      Custom Offline Pack
                    </div>
                    <div className="text-xs text-[#A9A396]">
                      {customEntries.length > 0
                        ? `${customEntries.length} custom word pairs saved locally`
                        : 'Create your own inside-joke words (saved offline)'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onOpenCustomPack}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#18241F] px-3 py-1.5 text-xs font-semibold text-[#F3EFE6] hover:border-[#E5A93C] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
                  <span>Manage Custom Words</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary Deal CTA */}
          <div className="mt-auto flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[#B7B1A4]">
              {startCheck.ok ? (
                <span>
                  {config.playerNames.length} Players · {config.imposterCount}{' '}
                  {config.imposterCount === 1 ? 'Imposter' : 'Imposters'} · 3 Team Chances
                </span>
              ) : (
                <span className="text-[#F28482] font-medium">{startCheck.reason}</span>
              )}
            </div>

            <button
              type="button"
              disabled={!startCheck.ok}
              onClick={onStartRound}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#E5A93C] px-7 py-3 text-sm font-bold text-[#101714] shadow-md hover:bg-[#EEB854] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Deal Secret Cards
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
