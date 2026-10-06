import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Zap } from 'lucide-react';

const DIRECT_AD_LINK = 'https://omg10.com/4/11954980';

interface MonetagTopRightAdProps {
  /**
   * Optional override for display probability.
   * Defaults to ~50% probability (Math.random() < 0.5) when not explicitly set.
   */
  forceShow?: boolean;
  className?: string;
}

export const MonetagTopRightAd: React.FC<MonetagTopRightAdProps> = ({
  forceShow,
  className = '',
}) => {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof forceShow === 'boolean') return forceShow;
    return Math.random() < 0.5;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof forceShow === 'boolean') {
      setVisible(forceShow);
    }
  }, [forceShow]);

  if (!visible || dismissed) return null;

  return (
    <div
      data-testid="monetag-top-right-ad"
      className={`absolute top-14 right-3 sm:top-16 sm:right-4 z-[60] max-w-[270px] sm:max-w-[300px] animate-fadeIn transition-all duration-300 ease-out select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative rounded-xl border border-amber-500/40 bg-[#070e17]/95 p-2.5 sm:p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {/* Anti-ban spacing: 10px separation from independent close button */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider text-amber-300">
            <Zap className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            SPONSORED
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            data-testid="close-monetag-top-right-ad"
            aria-label="Dismiss Sponsored Ad"
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-3 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Ad Body & Click Target */}
        <a
          href={DIRECT_AD_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="group block space-y-1 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
              Claim 100% Free Bet & Live Odds
            </span>
            <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-amber-400 shrink-0" />
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">
            Exclusive campus match multipliers & fast verified payouts.
          </p>
        </a>
      </div>
    </div>
  );
};
