import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { type RoundState, getPlayerSecretView } from '../game/engine';

interface RevealScreenProps {
  round: RoundState;
  onCardFlipSound: (isRevealing: boolean, isImposter: boolean) => void;
  onNextPlayer: () => void;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  round,
  onCardFlipSound,
  onNextPlayer,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const player = round.players[round.revealIndex];
  const secret = getPlayerSecretView(player, round);
  const isLastPlayer = round.revealIndex === round.players.length - 1;

  // Reset flip state whenever revealIndex advances
  useEffect(() => {
    setIsFlipped(false);
  }, [round.revealIndex]);

  const handleReveal = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    onCardFlipSound(true, player.isImposter);
  };

  const handleHideAndAdvance = () => {
    setIsFlipped(false);
    onCardFlipSound(false, player.isImposter);
    onNextPlayer();
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-6">
      {/* Progress Header */}
      <div className="mb-5 text-center">
        <p className="font-mono-num text-xs font-semibold tracking-wider text-[#E5A93C] uppercase">
          Secret Deal · Player {round.revealIndex + 1} of {round.players.length}
        </p>
        <h2 className="mt-1 font-display text-3xl font-extrabold text-[#F7F4EC]">
          {player.name}
        </h2>
        <p className="mt-1 text-sm text-[#B7B1A4]">
          {isFlipped
            ? 'Memorize your secret dossier, then hide it before passing the device.'
            : 'Make sure nobody else is looking at the screen before revealing.'}
        </p>
      </div>

      {/* 3D Tactile Flip Dossier Card */}
      <div className="card-perspective w-full max-w-md">
        <div
          className={`card-inner min-h-[310px] w-full ${isFlipped ? 'is-flipped' : ''}`}
        >
          {/* Front Face: Privacy Shield */}
          <div
            aria-hidden={isFlipped}
            className={`card-face absolute inset-0 flex flex-col items-center justify-between rounded-2xl border border-[#E5A93C]/35 bg-[#15211C] p-7 text-center shadow-2xl ${
              isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            <div className="text-xs font-semibold tracking-wider text-[#A9A396] uppercase">
              {round.genreName}
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#E5A93C]/40 bg-[#0E1714]">
                <EyeOff className="h-7 w-7 text-[#E5A93C]" aria-hidden="true" />
              </div>
              <p className="font-display text-xl font-bold text-[#F7F4EC]">
                Confidential Dossier
              </p>
              <p className="mt-1 max-w-xs text-sm text-[#B7B1A4]">
                Only <strong className="text-[#F7F4EC]">{player.name}</strong> may view this card.
              </p>
            </div>

            <button
              type="button"
              tabIndex={isFlipped ? -1 : 0}
              onClick={handleReveal}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#E5A93C] px-5 py-3 text-sm font-bold text-[#101714] hover:bg-[#EEB854] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>Reveal Secret Card</span>
            </button>
          </div>

          {/* Back Face: Secret Word or Imposter Dossier */}
          <div
            aria-hidden={!isFlipped}
            data-testid="secret-card-back"
            className={`card-face card-face-back absolute inset-0 flex flex-col items-center justify-between rounded-2xl border p-7 text-center shadow-2xl ${
              !isFlipped ? 'pointer-events-none' : ''
            } ${
              secret.roleLabel === 'IMPOSTER'
                ? 'border-[#D43F3F]/60 bg-[#221113] text-[#F7F4EC]'
                : 'border-[#D5CCB8] bg-[#F6F1E6] text-[#141A18]'
            }`}
          >
            {isFlipped && (
              <>
                <div className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider">
                  <span
                    className={
                      secret.roleLabel === 'IMPOSTER' ? 'text-[#F28482]' : 'text-[#5C584F]'
                    }
                  >
                    {secret.roleLabel === 'IMPOSTER' ? 'Imposter Dossier' : 'Team Dossier'}
                  </span>
                  <span
                    className={
                      secret.roleLabel === 'IMPOSTER' ? 'text-[#C7C1B4]' : 'text-[#5C584F]'
                    }
                  >
                    {round.genreName}
                  </span>
                </div>

                <div className="my-4 flex flex-col items-center">
                  {secret.roleLabel === 'IMPOSTER' ? (
                    <>
                      <span className="text-xs font-bold tracking-widest text-[#F28482] uppercase">
                        You Are The Imposter
                      </span>

                      {secret.primaryWord ? (
                        <div className="mt-2">
                          <span className="block text-[11px] font-medium text-[#C7C1B4]">
                            Your Decoy Word
                          </span>
                          <div className="mt-1 font-display text-4xl font-extrabold tracking-tight text-[#F7F4EC]">
                            {secret.primaryWord}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[#F7F4EC]">
                          No Secret Word
                        </div>
                      )}

                      {secret.hintText && (
                        <div className="mt-4 rounded-lg border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-[#EFEAE0]">
                          <span className="block text-[10px] font-semibold tracking-wider text-[#E5A93C] uppercase">
                            Bluff Hint
                          </span>
                          <span className="mt-0.5 block font-medium">{secret.hintText}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold tracking-widest text-[#1B5E42] uppercase">
                        Your Secret Team Word
                      </span>
                      <div className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#141A18]">
                        {secret.primaryWord}
                      </div>
                      <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#4F4B43]">
                        Give a subtle spoken clue that matches this word. Catch the imposter within 3 chances.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleHideAndAdvance}
                  className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    secret.roleLabel === 'IMPOSTER'
                      ? 'bg-[#D43F3F] text-white hover:bg-[#E05252]'
                      : 'bg-[#141A18] text-[#F7F4EC] hover:bg-[#232D29]'
                  }`}
                >
                  <span>{isLastPlayer ? 'Hide & Start Discussion' : 'Hide & Pass Device'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step Indicator Dots */}
      <div className="mt-6 flex items-center gap-2" aria-hidden="true">
        {round.players.map((p, idx) => (
          <span
            key={p.id}
            className={`h-2 rounded-full transition-all ${
              idx === round.revealIndex
                ? 'w-6 bg-[#E5A93C]'
                : p.hasSeenCard
                  ? 'w-2 bg-[#56B881]'
                  : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
