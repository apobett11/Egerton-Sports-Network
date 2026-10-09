import React, { useState, useEffect } from 'react';

interface CompactDirectBannerProps {
  label?: string;
  tagline?: string;
  ctaText?: string;
  variant?: 'emerald' | 'purple' | 'amber';
  className?: string;
  /** Force render as intersection in-page push unit */
  forceInPagePush?: boolean;
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
  forceInPagePush,
}) => {
  const [rotationIdx, setRotationIdx] = useState(0);
  // Slightly rare random intersection replacement (~28% probability)
  const [isIntersectionPush] = useState<boolean>(() => {
    if (typeof forceInPagePush === 'boolean') return forceInPagePush;
    return Math.random() < 0.28;
  });

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

  // 1. Intersection In-Page Push Variant (blends in identically like banner within container)
  if (isIntersectionPush) {
    return (
      <aside
        aria-label="Sponsored Promotion"
        data-testid="monetag-intersection-inpage-push"
        className={`w-full flex justify-center my-1.5 px-2 select-none monetag-intersection-slot ${className}`}
      >
        <a
          href={DIRECT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-md h-[44px] max-h-[46px] border border-purple-500/35 hover:border-purple-400/60 bg-gradient-to-r from-zinc-950 via-purple-950/40 to-zinc-950 rounded-xl flex items-center justify-between px-2.5 sm:px-3 transition-all duration-150 shadow-sm overflow-hidden active:scale-[0.99] [text-size-adjust:100%] [-webkit-text-size-adjust:100%]"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-xs sm:text-sm shrink-0 leading-none">🔔</span>
            <div className="text-left min-w-0 leading-none">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[7.5px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 px-1 py-0.2 rounded border border-purple-500/30 shrink-0">
                  IN-PAGE PUSH
                </span>
                <p className="text-[10px] sm:text-[10.5px] font-black uppercase text-zinc-100 truncate tracking-tight">
                  Instant Campus Live Odds
                </p>
              </div>
              <p className="text-[8px] sm:text-[8.5px] text-zinc-400 font-medium truncate">
                Verified matchday boosts & fast payouts
              </p>
            </div>
          </div>

          <span className="shrink-0 text-[8.5px] sm:text-[9.5px] font-black uppercase px-2 py-1 rounded-lg transition-colors tracking-wide shadow-xs bg-purple-600 hover:bg-purple-500 text-white whitespace-nowrap">
            Claim →
          </span>
        </a>
      </aside>
    );
  }

  // 2. Standard Compact Direct Banner Variant
  return (
    <aside
      aria-label="Sponsored Promotion"
      className={`w-full flex justify-center my-1.5 px-2 select-none ${className}`}
    >
      <a
        href={DIRECT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full max-w-md h-[44px] max-h-[46px] border rounded-xl flex items-center justify-between px-2.5 sm:px-3 transition-all duration-150 shadow-sm overflow-hidden active:scale-[0.99] [text-size-adjust:100%] [-webkit-text-size-adjust:100%] ${borderVariants[activeVariant]}`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="text-xs sm:text-sm shrink-0 leading-none">⚡</span>
          <div className="text-left min-w-0 leading-none">
            <p className="text-[10px] sm:text-[10.5px] font-black uppercase text-zinc-100 truncate tracking-tight mb-0.5">
              {activeLabel}
            </p>
            <p className="text-[8px] sm:text-[8.5px] text-zinc-400 font-medium truncate">
              {activeTagline}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 text-[8.5px] sm:text-[9.5px] font-black uppercase px-2 py-1 rounded-lg transition-colors tracking-wide shadow-xs whitespace-nowrap ${buttonVariants[activeVariant]}`}
        >
          {activeCta} →
        </span>
      </a>
    </aside>
  );
};
export default CompactDirectBanner;
