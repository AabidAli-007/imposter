import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Gavel, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { PlayPhase, RoundState } from '../game/engine';

interface DiscussVoteScreenProps {
  phase: Extract<PlayPhase, 'DISCUSS' | 'VOTE' | 'STRIKE_RESULT'>;
  round: RoundState;
  discussionSeconds: number;
  onStartVote: () => void;
  onBackToDiscuss: () => void;
  onConfirmAccusation: (playerId: string) => void;
  onContinueAfterStrike: () => void;
}

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const DiscussVoteScreen: React.FC<DiscussVoteScreenProps> = ({
  phase,
  round,
  discussionSeconds,
  onStartVote,
  onBackToDiscuss,
  onConfirmAccusation,
  onContinueAfterStrike,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(discussionSeconds);
  const [timerRunning, setTimerRunning] = useState(discussionSeconds > 0);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);

  useEffect(() => {
    setSecondsLeft(discussionSeconds);
    setTimerRunning(discussionSeconds > 0);
  }, [discussionSeconds, round.entry.id]);

  useEffect(() => {
    if (phase === 'VOTE') {
      setSelectedSuspectId(null);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'DISCUSS' || !timerRunning || discussionSeconds <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, timerRunning, discussionSeconds]);

  const starter = round.players[round.startingSpeakerIndex];
  const activeSuspects = round.players.filter((p) => p.status === 'ACTIVE');
  const remainingImposters = round.players.filter(
    (p) => p.isImposter && p.status === 'ACTIVE'
  ).length;
  const selectedSuspect = activeSuspects.find((p) => p.id === selectedSuspectId) || null;

  if (phase === 'STRIKE_RESULT' && round.lastAccusation) {
    const rec = round.lastAccusation;
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-8">
        <div
          className={`w-full rounded-2xl border p-7 text-center shadow-2xl ${
            rec.wasImposter
              ? 'border-[#56B881]/50 bg-[#12241C]'
              : 'border-[#D43F3F]/60 bg-[#231214]'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/25">
            {rec.wasImposter ? (
              <CheckCircle2 className="h-7 w-7 text-[#56B881]" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-7 w-7 text-[#F28482]" aria-hidden="true" />
            )}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase text-[#C7C1B4]">
            {rec.wasImposter ? 'Imposter Exposed' : 'Wrong Accusation'}
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold text-[#F7F4EC]">
            {rec.playerName} was {rec.wasImposter ? 'an Imposter!' : 'Innocent!'}
          </h2>
          <p className="mt-2 text-sm text-[#D8D2C5]">
            {rec.wasImposter
              ? `${remainingImposters} imposter still hiding. You keep all ${round.chancesLeft} remaining chances.`
              : `1 chance lost. You have ${round.chancesLeft} of ${round.maxChances} chances left to catch the imposter.`}
          </p>

          <button
            type="button"
            onClick={onContinueAfterStrike}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#E5A93C] px-6 py-3 text-sm font-bold text-[#101714] hover:bg-[#EEB854] transition-colors cursor-pointer"
          >
            Continue Hunting
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'VOTE') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-[#121C18] p-6 shadow-xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#E5A93C] uppercase">
                Accusation Vote · {round.chancesLeft} of {round.maxChances} Chances Left
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#F7F4EC]">
                Who is the Imposter?
              </h2>
            </div>

            <button
              type="button"
              onClick={onBackToDiscuss}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#0E1613] px-3.5 py-2 text-xs font-semibold text-[#D8D2C5] hover:border-white/30 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to Clues</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {round.players.map((p) => {
              const isCleared = p.status === 'CLEARED';
              const isCaught = p.status === 'CAUGHT';
              const isDisabled = p.status !== 'ACTIVE';
              const isSelected = selectedSuspectId === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSuspectId(p.id)}
                  className={`flex min-h-[58px] items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    isDisabled
                      ? 'border-white/5 bg-[#0B120F] opacity-55 cursor-not-allowed'
                      : isSelected
                        ? 'border-[#D43F3F] bg-[#281316] text-[#F7F4EC] cursor-pointer'
                        : 'border-white/15 bg-[#0F1814] text-[#F7F4EC] hover:border-[#E5A93C]/50 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="font-display text-base font-bold">{p.name}</div>
                    <div className="text-xs text-[#A9A396]">
                      {isCleared
                        ? 'Cleared (Innocent)'
                        : isCaught
                          ? 'Caught (Imposter)'
                          : isSelected
                            ? 'Selected for accusation'
                            : 'Tap to suspect'}
                    </div>
                  </div>
                  <div className="text-xs font-semibold uppercase">
                    {isCleared && <span className="text-[#56B881]">Cleared</span>}
                    {isCaught && <span className="text-[#F28482]">Caught</span>}
                    {!isDisabled && isSelected && (
                      <Gavel className="h-5 w-5 text-[#F28482]" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#B7B1A4]">
              Wrong accusation costs <strong className="text-[#F7F4EC]">1 chance</strong>. At 0 chances, the imposter escapes.
            </p>
            <button
              type="button"
              disabled={!selectedSuspect}
              onClick={() => selectedSuspect && onConfirmAccusation(selectedSuspect.id)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#D43F3F] px-6 py-3 text-sm font-bold text-white hover:bg-[#E05252] disabled:opacity-35 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gavel className="h-4 w-4" aria-hidden="true" />
              <span>
                {selectedSuspect ? `Accuse ${selectedSuspect.name}` : 'Select a Suspect'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DISCUSS Phase
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Main Discussion Focal Panel */}
        <section className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#121C18] p-6 shadow-xl md:col-span-7">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#E5A93C] uppercase">
              Clue Round · {round.genreName}
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#F7F4EC] md:text-3xl">
              Give Clues &amp; Debate
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#C7C1B4]">
              Going clockwise from <strong className="text-[#F7F4EC]">{starter.name}</strong>, each
              player says one word or short phrase linked to their secret word. Watch closely for
              anyone hesitating or drifting off-topic.
            </p>

            {/* Optional Countdown Timer */}
            {discussionSeconds > 0 && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-[#0C1310] p-4">
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider text-[#A9A396] uppercase">
                    Round Timer
                  </span>
                  <span
                    className={`font-mono-num text-3xl font-bold ${
                      secondsLeft <= 10 ? 'text-[#F28482]' : 'text-[#F7F4EC]'
                    }`}
                  >
                    {formatClock(secondsLeft)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning((r) => !r)}
                    aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#F7F4EC] hover:border-[#E5A93C] transition-colors cursor-pointer"
                  >
                    {timerRunning ? (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Play className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSecondsLeft(discussionSeconds);
                      setTimerRunning(false);
                    }}
                    aria-label="Reset timer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#D8D2C5] hover:border-[#E5A93C] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onStartVote}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#E5A93C] px-6 py-3 text-sm font-bold text-[#101714] hover:bg-[#EEB854] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Gavel className="h-4 w-4" aria-hidden="true" />
              <span>Start Vote (Accuse Suspect)</span>
            </button>
          </div>
        </section>

        {/* Suspects & Chances Sidebar */}
        <aside className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#101815] p-5 md:col-span-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#F7F4EC]">
                Suspect Roster
              </h3>
              <span className="font-mono-num text-xs text-[#A9A396]">
                {activeSuspects.length} Active
              </span>
            </div>

            <ul className="space-y-2">
              {round.players.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B110F] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-xs text-[#8E887C]">{idx + 1}.</span>
                    <span
                      className={
                        p.status === 'CLEARED'
                          ? 'line-through text-[#7B766C]'
                          : 'font-medium text-[#F7F4EC]'
                      }
                    >
                      {p.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold">
                    {p.status === 'CLEARED' ? (
                      <span className="text-[#56B881]">Cleared</span>
                    ) : p.status === 'CAUGHT' ? (
                      <span className="text-[#F28482]">Caught</span>
                    ) : idx === round.startingSpeakerIndex ? (
                      <span className="text-[#E5A93C]">First Speaker</span>
                    ) : (
                      <span className="text-[#A9A396]">In Play</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-[#0B110F] p-3 text-xs text-[#B7B1A4]">
            Team has <strong className="font-mono-num text-[#F7F4EC]">{round.chancesLeft}</strong>{' '}
            {round.chancesLeft === 1 ? 'chance' : 'chances'} remaining to identify all imposters.
          </div>
        </aside>
      </div>
    </div>
  );
};
