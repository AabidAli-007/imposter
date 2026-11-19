import React from 'react';
import { Trophy, Skull, RotateCcw, Sliders } from 'lucide-react';
import type { RoundState } from '../game/engine';

interface GameOverModalProps {
  round: RoundState;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  round,
  onPlayAgain,
  onBackToSetup,
}) => {
  const isTeamWin = round.outcome === 'TEAM_WIN';
  const imposters = round.players.filter((p) => p.isImposter);
  const chancesUsed = round.maxChances - round.chancesLeft;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E5A93C]/35 bg-[#121C18] p-6 text-[#F7F4EC] shadow-2xl md:p-7">
        {/* Outcome Banner */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${
              isTeamWin
                ? 'border-[#56B881]/40 bg-[#152B21] text-[#56B881]'
                : 'border-[#D43F3F]/50 bg-[#2A1315] text-[#F28482]'
            }`}
          >
            {isTeamWin ? (
              <Trophy className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Skull className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
          <div>
            <p
              className={`text-xs font-bold tracking-widest uppercase ${
                isTeamWin ? 'text-[#56B881]' : 'text-[#F28482]'
              }`}
            >
              {isTeamWin ? 'Team Victory' : 'Imposter Escaped'}
            </p>
            <h2 id="gameover-title" className="font-display text-2xl font-extrabold md:text-3xl">
              {isTeamWin ? 'Imposter Exposed!' : 'Out of Chances (0/3)'}
            </h2>
          </div>
        </div>

        {/* Imposter Reveal */}
        <div className="mt-5 rounded-xl border border-white/10 bg-[#0C1310] p-4">
          <span className="text-[11px] font-semibold tracking-wider text-[#A9A396] uppercase">
            {imposters.length > 1 ? 'The Imposters Were' : 'The Imposter Was'}
          </span>
          <div className="mt-1 font-display text-xl font-bold text-[#F28482]">
            {imposters.map((p) => p.name).join(' & ')}
          </div>
        </div>

        {/* Word & Hint Comparison */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0C1310] p-4">
            <span className="text-[11px] font-semibold tracking-wider text-[#56B881] uppercase">
              Team Word
            </span>
            <div className="mt-1 font-display text-lg font-bold text-[#F7F4EC]">
              {round.entry.teamWord}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0C1310] p-4">
            <span className="text-[11px] font-semibold tracking-wider text-[#E5A93C] uppercase">
              Imposter Word
            </span>
            <div className="mt-1 font-display text-lg font-bold text-[#F7F4EC]">
              {round.imposterMode === 'HINT_ONLY' ? 'None (Hint Only)' : round.entry.imposterWord}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-[#0C1310] px-4 py-3 text-xs text-[#C7C1B4]">
          <span className="font-semibold text-[#E5A93C]">Hint: </span>
          <span>{round.entry.hint}</span>
          {round.accusations.length > 0 && (
            <div className="mt-2 border-t border-white/10 pt-2 text-[11px] text-[#A9A396]">
              <span className="font-semibold text-[#D8D2C5]">Votes: </span>
              {round.accusations
                .map(
                  (a, i) =>
                    `${i + 1}. ${a.playerName} (${a.wasImposter ? 'Imposter' : 'Innocent'})`
                )
                .join(' · ')}
            </div>
          )}
        </div>

        {/* Tabular Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-white/10 bg-[#0E1613] py-2.5 px-2">
            <span className="block text-[10px] font-semibold uppercase text-[#A9A396]">Genre</span>
            <span className="mt-0.5 block truncate text-xs font-bold text-[#F7F4EC]">
              {round.genreName}
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0E1613] py-2.5 px-2">
            <span className="block text-[10px] font-semibold uppercase text-[#A9A396]">
              Wrong Votes
            </span>
            <span className="font-mono-num mt-0.5 block text-sm font-bold text-[#F7F4EC]">
              {chancesUsed}/3
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0E1613] py-2.5 px-2">
            <span className="block text-[10px] font-semibold uppercase text-[#A9A396]">
              Chances Left
            </span>
            <span className="font-mono-num mt-0.5 block text-sm font-bold text-[#E5A93C]">
              {round.chancesLeft}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#E5A93C] px-5 py-3 text-sm font-bold text-[#101714] hover:bg-[#EEB854] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Play Next Round</span>
          </button>

          <button
            type="button"
            onClick={onBackToSetup}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#18241F] px-5 py-3 text-sm font-semibold text-[#F3EFE6] hover:border-[#E5A93C]/50 transition-colors cursor-pointer"
          >
            <Sliders className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
            <span>Setup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
