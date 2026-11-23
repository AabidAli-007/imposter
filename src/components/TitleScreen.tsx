import React, { useState } from 'react';
import { BookOpen, Volume2, VolumeX, WifiOff, CheckCircle2 } from 'lucide-react';
import { GENRE_PACKS, TOTAL_FREE_WORD_COUNT } from '../data/genres';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  onStart: () => void;
  onOpenRules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isOnline: boolean;
  swReady: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenRules,
  isMuted,
  onToggleMute,
  isOnline,
  swReady,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <main className="relative flex h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-[#0B1210] text-[#F3EFE6]">
      {/* Illustrated Tabletop Key-Art Backdrop */}
      {!imgFailed ? (
        <img
          src="/src/assets/images/title_bg_1795075337222.jpg"
          alt="Velvet tabletop with sealed dossier, wax seal, and brass magnifying glass"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-90"
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 felt-surface"
        />
      )}

      {/* Measured Negative-Space Scrim ensuring >= 10:1 text legibility on left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090F0D]/95 via-[#0B1411]/78 to-[#0B1411]/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090F0D]/90 via-transparent to-[#090F0D]/45"
      />

      {/* Top Minimal Utility Strip */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 md:px-12 md:pt-7">
        <div className="flex items-center gap-2 text-xs font-medium text-[#C7C1B4]">
          {!isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-[#E5A93C]">
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Offline Mode Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#56B881]" aria-hidden="true" />
              <span>{swReady ? 'Cached for Offline Play' : '100% Free · Works Offline'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-[#121D19]/90 text-[#F3EFE6] hover:border-[#E5A93C]/60 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-[#A9A396]" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Content anchored over calm negative space on the left */}
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-8 md:px-12">
        <div className="max-w-xl">
          {/* Bespoke Inline SVG Title Lockup & Wax Crest Emblem */}
          <div className="mb-5 flex items-center gap-4">
            <svg
              viewBox="0 0 64 64"
              className="h-14 w-14 shrink-0 drop-shadow-md"
              aria-hidden="true"
            >
              <rect x="6" y="8" width="52" height="48" rx="10" fill="#182620" stroke="#E5A93C" strokeWidth="2.5" />
              <path d="M16 20H40L48 28V48H16V20Z" fill="#F4EFE4" />
              <path d="M40 20V28H48L40 20Z" fill="#D5CCB8" />
              <circle cx="31" cy="35" r="8.5" fill="#C93838" />
              <path
                d="M27.5 34.5C27.5 32.5 29.1 31 31 31C32.9 31 34.5 32.5 34.5 34.5C34.5 35.8 33.6 36.8 32.4 37.3L32 40H30L29.6 37.3C28.4 36.8 27.5 35.8 27.5 34.5Z"
                fill="#F4EFE4"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#E5A93C] uppercase">
                Pass &amp; Play Social Deduction
              </p>
              <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#F7F4EC] sm:text-6xl">
                IMPOSTER
              </h1>
            </div>
          </div>

          <p className="max-w-md text-base leading-relaxed text-[#D8D2C5] sm:text-lg" style={{ textWrap: 'balance' }}>
            One team shares the secret word. One player bluffs with a decoy word and a subtle hint. You have just{' '}
            <strong className="font-semibold text-[#F7F4EC]">3 chances</strong> to expose the imposter.
          </p>

          {/* Clean unboxed metadata strip (zero-pill discipline) */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#A9A396]">
            <span>{GENRE_PACKS.length} Free Genres</span>
            <span aria-hidden="true">·</span>
            <span>{TOTAL_FREE_WORD_COUNT}+ Word Pairs</span>
            <span aria-hidden="true">·</span>
            <span>3-Strike Accusation Rule</span>
            <span aria-hidden="true">·</span>
            <span>3–12 Players</span>
          </div>

          {/* Primary Start CTA + Secondary Rules Action (<= 3 menu actions) */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#E5A93C] px-7 py-3 text-base font-bold text-[#101714] shadow-lg hover:bg-[#EEB854] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
            >
              Start Game
            </button>

            <button
              type="button"
              onClick={onOpenRules}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#141E1A]/90 px-5 py-3 text-sm font-semibold text-[#F3EFE6] hover:border-[#E5A93C]/50 hover:bg-[#1B2823] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
              <span>How to Play</span>
            </button>
          </div>
        </div>
      </section>

      {/* Single flat control-hint line in bottom safe margin */}
      <footer className="relative z-10 px-6 pb-5 md:px-12 md:pb-6">
        <p className="text-xs font-medium text-[#A9A396]">
          Enter / Space Start · Tap Card to Peek · H Rules · M Mute
        </p>
      </footer>
    </main>
  );
};
