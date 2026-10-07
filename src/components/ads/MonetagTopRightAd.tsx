import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Zap } from 'lucide-react';

const DIRECT_AD_LINK = 'https://omg10.com/4/11954980';

const STORAGE_DISMISSED_KEY = 'esn_monetag_top_ad_dismissed';

interface MonetagTopRightAdProps {
  /**
   * Optional override for display probability.
   * Defaults to ~40% probability when not explicitly set and not previously dismissed.
   */
  forceShow?: boolean;
  className?: string;
}

export const MonetagTopRightAd: React.FC<MonetagTopRightAdProps> = ({
  forceShow,
  className = '',
}) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isDismissed = sessionStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
    if (isDismissed) return false;
    if (typeof forceShow === 'boolean') return forceShow;
    return Math.random() < 0.35; // Lower initial chance so it doesn't pop up constantly
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_DISMISSED_KEY) === 'true') {
      return;
    }
    if (typeof forceShow === 'boolean') {
      setVisible(forceShow);
    }
  }, [forceShow]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div
      data-testid="monetag-top-right-ad"
      className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-[50] max-w-[210px] sm:max-w-[230px] animate-fadeIn transition-all duration-300 ease-out select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative rounded-lg border border-amber-500/30 bg-[#081018]/95 p-2 shadow-lg shadow-black/60 backdrop-blur-md">
        {/* Anti-ban spacing: clear separation from independent close button */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 mb-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider text-amber-300">
            <Zap className="h-2 w-2 fill-amber-400 text-amber-400" />
            SPONSORED
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            data-testid="close-monetag-top-right-ad"
            aria-label="Dismiss Sponsored Ad"
            className="rounded p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Ad Body & Click Target */}
        <a
          href={DIRECT_AD_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="group block space-y-0.5 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
              Claim 100% Free Bet & Live Odds
            </span>
            <ExternalLink className="h-2.5 w-2.5 text-slate-400 group-hover:text-amber-400 shrink-0" />
          </div>
          <p className="text-[9px] text-slate-300 leading-tight line-clamp-2">
            Campus match multipliers & fast verified payouts.
          </p>
        </a>
      </div>
    </div>
  );
};
