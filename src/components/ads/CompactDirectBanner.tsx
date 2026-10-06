import React, { useState, useEffect } from 'react';

interface CompactDirectBannerProps {
  label?: string;
  tagline?: string;
  ctaText?: string;
  variant?: 'emerald' | 'purple' | 'amber';
  className?: string;
}

const DIRECT_LINK = 'https://omg10.com/4/11954980';

const AD_ROTATIONS = [
  { label: 'Campus Derby Match', tagline: 'Claim 100% Free Bet & Live Odds', ctaText: 'Claim', variant: 'amber' as const },
  { label: 'Match Multiplier Bonus', tagline: 'Predict & Win Instant Verified Payouts', ctaText: 'Play', variant: 'emerald' as const },
  { label: 'Exclusive Sportsbook Deal', tagline: 'Boosted Matchday Accumulator Odds', ctaText: 'Bet Now', variant: 'purple' as const },
];

export const CompactDirectBanner: React.FC<CompactDirectBannerProps> = ({
  label,
  tagline,
  ctaText,
  variant,
  className = '',
}) => {
  const [rotationIdx, setRotationIdx] = useState(0);

  // Reload ad when user leaves and returns to the tab/page
  useEffect(() => {
    const handleReload = () => {
      if (document.visibilityState === 'visible') {
        setRotationIdx((prev) => (prev + 1) % AD_ROTATIONS.length);
      }
    };
    document.addEventListener('visibilitychange', handleReload);
    window.addEventListener('focus', handleReload);
    return () => {
      document.removeEventListener('visibilitychange', handleReload);
      window.removeEventListener('focus', handleReload);
    };
  }, []);

  const activeOffer = AD_ROTATIONS[rotationIdx];
  const activeLabel = label || activeOffer.label;
  const activeTagline = tagline || activeOffer.tagline;
  const activeCta = ctaText || activeOffer.ctaText;
  const activeVariant = variant || activeOffer.variant;

  const borderVariants = {
    purple: 'border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-r from-zinc-900 via-purple-950/30 to-zinc-900',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-r from-zinc-900 via-emerald-950/30 to-zinc-900',
    amber: 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900',
  };

  const buttonVariants = {
    purple: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
    amber: 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/30',
  };

  return (
    <aside
      aria-label="Sponsored Promotion"
      className={`w-full flex justify-center my-2 px-2 select-none ${className}`}
    >
      <a
        href={DIRECT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full max-w-md h-[44px] sm:h-[48px] max-h-[48px] border rounded-xl flex items-center justify-between px-2.5 sm:px-3 transition-all duration-150 shadow-sm overflow-hidden active:scale-[0.99] ${borderVariants[activeVariant]}`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="text-sm sm:text-base shrink-0 leading-none">⚡</span>
          <div className="text-left min-w-0 leading-tight">
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-zinc-100 truncate tracking-tight">
              {activeLabel}
            </p>
            <p className="text-[8px] sm:text-[9px] text-zinc-400 font-medium truncate">
              {activeTagline}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition-colors tracking-wide shadow-xs ${buttonVariants[activeVariant]}`}
        >
          {activeCta} →
        </span>
      </a>
    </aside>
  );
};
export default CompactDirectBanner;
