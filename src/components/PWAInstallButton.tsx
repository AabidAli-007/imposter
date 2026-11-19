import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg border border-[#E5A93C]/40 bg-[#182620] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6] hover:border-[#E5A93C] hover:bg-[#1F312A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
        <span>{compact ? 'Install' : 'Install Offline App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5A93C]/40 bg-[#182620] px-3.5 py-2 text-xs font-semibold text-[#F3EFE6] hover:border-[#E5A93C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-[#E5A93C]" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-[#E5A93C]/30 bg-[#141E1A] p-6 text-[#F3EFE6] shadow-2xl">
              <h3 id="ios-install-title" className="font-display text-lg font-bold">
                Install for Offline Play
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C7C1B4]">
                1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#E5A93C] py-2.5 text-sm font-semibold text-[#111715] hover:bg-[#EEB854] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
