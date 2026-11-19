import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { WordEntry } from '../data/genres';
import { validateCustomWordInput } from '../game/engine';

interface PauseModalProps {
  inActiveRound: boolean;
  onResume: () => void;
  onRestartRound: () => void;
  onReturnToSetup: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  inActiveRound,
  onResume,
  onRestartRound,
  onReturnToSetup,
  onReturnToTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#E5A93C]/35 bg-[#121C18] p-6 text-[#F7F4EC] shadow-2xl">
        <h2 id="pause-title" className="font-display text-2xl font-bold">
          Game Paused
        </h2>
        <p className="mt-1 text-sm text-[#B7B1A4]">
          Secret cards remain hidden while paused.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="min-h-[46px] w-full rounded-lg bg-[#E5A93C] px-4 py-2.5 text-sm font-bold text-[#101714] hover:bg-[#EEB854] transition-colors cursor-pointer"
          >
            Resume
          </button>

          {inActiveRound && (
            <>
              <button
                type="button"
                onClick={onRestartRound}
                className="min-h-[44px] w-full rounded-lg border border-white/15 bg-[#18241F] px-4 py-2.5 text-sm font-semibold text-[#F3EFE6] hover:border-[#E5A93C]/50 transition-colors cursor-pointer"
              >
                Deal New Word
              </button>
              <button
                type="button"
                onClick={onReturnToSetup}
                className="min-h-[44px] w-full rounded-lg border border-white/15 bg-[#18241F] px-4 py-2.5 text-sm font-semibold text-[#F3EFE6] hover:border-[#E5A93C]/50 transition-colors cursor-pointer"
              >
                Change Players &amp; Genres
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onReturnToTitle}
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-[#0D1411] px-4 py-2.5 text-sm font-medium text-[#B7B1A4] hover:text-[#F7F4EC] transition-colors cursor-pointer"
          >
            Back to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E5A93C]/35 bg-[#121C18] p-6 text-[#F7F4EC] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="rules-title" className="font-display text-2xl font-bold">
            How to Play Imposter
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0D1411] text-[#C7C1B4] hover:text-[#F7F4EC] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#D8D2C5]">
          <li>
            <strong className="text-[#E5A93C]">1. Secret Deal:</strong> Pass one device around the
            group. Everyone on the Team sees the exact same secret word. The Imposter sees a
            closely related decoy word and/or subtle hint.
          </li>
          <li>
            <strong className="text-[#E5A93C]">2. Give Clues Aloud:</strong> Starting with the
            chosen speaker, each player says a single word or brief clue relating to their card.
            Be specific enough to prove you belong, without handing the word to the Imposter.
          </li>
          <li>
            <strong className="text-[#E5A93C]">3. 3 Chances to Catch Them:</strong> Vote together
            to accuse a suspect. Each wrong accusation clears that innocent player and costs{' '}
            <strong className="text-[#F7F4EC]">1 of your 3 chances</strong>. Catch all imposters
            before hitting 0 chances to win!
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-[46px] w-full rounded-lg bg-[#E5A93C] py-2.5 text-sm font-bold text-[#101714] hover:bg-[#EEB854] transition-colors cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

interface CustomPackModalProps {
  entries: WordEntry[];
  onAddEntry: (entry: WordEntry) => void;
  onRemoveEntry: (id: string) => void;
  onClose: () => void;
}

export const CustomPackModal: React.FC<CustomPackModalProps> = ({
  entries,
  onAddEntry,
  onRemoveEntry,
  onClose,
}) => {
  const [teamWord, setTeamWord] = useState('');
  const [imposterWord, setImposterWord] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateCustomWordInput(teamWord, imposterWord, hint);
    if (!res.valid || !res.entry) {
      setError(res.error || 'Please check all fields.');
      return;
    }
    onAddEntry(res.entry);
    setTeamWord('');
    setImposterWord('');
    setHint('');
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-pack-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E5A93C]/35 bg-[#121C18] p-6 text-[#F7F4EC] shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="custom-pack-title" className="font-display text-xl font-bold">
              Custom Offline Word Pack
            </h2>
            <p className="text-xs text-[#A9A396]">
              Saved in this browser so your custom cards work completely offline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom word manager"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0D1411] text-[#C7C1B4] hover:text-[#F7F4EC] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="custom-team-word" className="mb-1 block text-xs font-semibold text-[#C7C1B4]">
                Team Word
              </label>
              <input
                id="custom-team-word"
                type="text"
                value={teamWord}
                onChange={(e) => setTeamWord(e.target.value)}
                placeholder="e.g. Espresso"
                className="min-h-[42px] w-full rounded-lg border border-white/15 bg-[#0C1310] px-3 py-2 text-sm text-[#F7F4EC] placeholder:text-[#6B665D] focus:border-[#E5A93C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-imposter-word" className="mb-1 block text-xs font-semibold text-[#C7C1B4]">
                Imposter Decoy Word
              </label>
              <input
                id="custom-imposter-word"
                type="text"
                value={imposterWord}
                onChange={(e) => setImposterWord(e.target.value)}
                placeholder="e.g. Matcha"
                className="min-h-[42px] w-full rounded-lg border border-white/15 bg-[#0C1310] px-3 py-2 text-sm text-[#F7F4EC] placeholder:text-[#6B665D] focus:border-[#E5A93C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-hint" className="mb-1 block text-xs font-semibold text-[#C7C1B4]">
              Subtle Hint
            </label>
            <input
              id="custom-hint"
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Morning café pick-me-up"
              className="min-h-[42px] w-full rounded-lg border border-white/15 bg-[#0C1310] px-3 py-2 text-sm text-[#F7F4EC] placeholder:text-[#6B665D] focus:border-[#E5A93C] focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-medium text-[#F28482]">{error}</p>}

          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#E5A93C] px-4 py-2 text-sm font-bold text-[#101714] hover:bg-[#EEB854] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Word Pair</span>
          </button>
        </form>

        {/* Saved List */}
        <div className="mt-5 max-h-52 overflow-y-auto space-y-2 border-t border-white/10 pt-4">
          {entries.length === 0 ? (
            <p className="text-center text-xs text-[#8E887C] py-4">
              No custom word pairs added yet.
            </p>
          ) : (
            entries.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0D1411] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F7F4EC] truncate">
                    {item.teamWord} <span className="text-[#8E887C]">vs</span> {item.imposterWord}
                  </div>
                  <div className="text-xs text-[#A9A396] truncate">Hint: {item.hint}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveEntry(item.id)}
                  aria-label={`Delete custom word ${item.teamWord}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#A9A396] hover:border-[#D43F3F]/60 hover:text-[#F28482] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
