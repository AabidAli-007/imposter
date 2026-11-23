import React from 'react';
import { BookOpen, Pause, RotateCcw, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { GENRE_PACKS } from '../data/genres';
import type { PlayPhase } from '../game/engine';

interface HudBarProps {
  phase: PlayPhase;
  genreName?: string;
  chancesLeft?: number;
  maxChances?: number;
  isMuted: boolean;
  isOnline: boolean;
  onToggleMute: () => void;
  onOpenRules: () => void;
  onOpenPause: () => void;
  onQuickRestart?: () => void;
}

export const HudBar: React.FC<HudBarProps> = ({
  phase,
  genreName,
  chancesLeft = 3,
  maxChances = 3,
  isMuted,
  isOnline,
  onToggleMute,
  onOpenRules,
  onOpenPause,
  onQuickRestart,
}) => {
  const inActiveRound = phase !== 'SETUP';

  return (
    <header className="relative z-20 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#0D1512]/95 px-4 md:px-8">
      {/* Left: World Brand Emblem & Active Genre Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenPause}
          className="inline-flex items-center gap-2.5 text-left group cursor-pointer shrink-0"
          aria-label="Open game menu"
        >
          <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0" aria-hidden="true">
            <rect x="2" y="2" width="32" height="32" rx="7" fill="#182620" stroke="#E5A93C" strokeWidth="1.75" />
            <path d="M9 10H23L27 14V26H9V10Z" fill="#F4EFE4" />
            <circle cx="18" cy="18.5" r="4.5" fill="#C93838" />
          </svg>
          <span
            className={`font-display text-lg font-bold tracking-tight text-[#F7F4EC] whitespace-nowrap ${
              inActiveRound ? 'hidden sm:inline' : ''
            }`}
          >
            IMPOSTER
          </span>
        </button>

        {inActiveRound && genreName && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#A9A396] truncate">
            <span aria-hidden="true">·</span>
            <span className="truncate">{genreName}</span>
          </div>
        )}

        {!isOnline && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-[#E5A93C]">
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Offline</span>
          </span>
        )}
      </div>

      {/* Center: 3-Chance Vitality Sockets (visible during active deduction round) */}
      {inActiveRound ? (
        <div
          className="flex items-center gap-3"
          aria-label={`Chances remaining: ${chancesLeft} of ${maxChances}`}
        >
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxChances }, (_, idx) => {
              const isIntact = idx < chancesLeft;
              return (
                <svg
                  key={idx}
                  viewBox="0 0 28 28"
                  className="h-7 w-7 transition-transform duration-150"
                  aria-hidden="true"
                >
                  {isIntact ? (
                    <>
                      <circle cx="14" cy="14" r="12" fill="#2A1214" stroke="#E5A93C" strokeWidth="1.5" />
                      <circle cx="14" cy="14" r="8" fill="#D43F3F" />
                      <circle cx="11.5" cy="11.5" r="2.2" fill="#F9C5B8" fillOpacity="0.65" />
                    </>
                  ) : (
                    <>
                      <circle
                        cx="14"
                        cy="14"
                        r="11.5"
                        fill="#121A17"
                        stroke="#49534E"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                      <path
                        d="M9.5 9.5L18.5 18.5M18.5 9.5L9.5 18.5"
                        stroke="#6C7570"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
              );
            })}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-semibold tracking-wider text-[#A9A396] uppercase">
              Chances
            </span>
            <span
              data-testid="chances-readout"
              className="font-mono-num text-sm font-bold text-[#F7F4EC]"
            >
              {chancesLeft}/{maxChances}
            </span>
          </div>
        </div>
      ) : (
        <div className="hidden sm:block text-xs font-medium text-[#A9A396]">
          All {GENRE_PACKS.length} Genres Free · 3-Chance Deduction
        </div>
      )}

      {/* Right: Compact Utility Square Icon Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {inActiveRound && onQuickRestart && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onQuickRestart();
            }}
            aria-label="Restart round"
            title="Restart Round [R]"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#D8D2C5] hover:border-[#E5A93C]/60 hover:text-[#F7F4EC] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenRules();
          }}
          aria-label="How to play"
          title="How to Play [H]"
          className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#D8D2C5] hover:border-[#E5A93C]/60 hover:text-[#F7F4EC] transition-colors cursor-pointer"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          title="Mute [M]"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#D8D2C5] hover:border-[#E5A93C]/60 hover:text-[#F7F4EC] transition-colors cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-[#8C877C]" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenPause();
          }}
          aria-label="Pause game"
          title="Pause [Esc / P]"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#15201C] text-[#D8D2C5] hover:border-[#E5A93C]/60 hover:text-[#F7F4EC] transition-colors cursor-pointer"
        >
          <Pause className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
