import React from 'react';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

export const StickyMatchFooterBanner: React.FC<{ activeTab?: string }> = ({ activeTab }) => {
  const getTabLabel = (tab?: string) => {
    switch (tab) {
      case 'timeline':
        return 'Live Match In-Play Odds • Instant Payout';
      case 'squad':
        return 'Lineup Specials & Goalscorer Boost';
      case 'motm':
        return 'Man of the Match Odds & Accolades';
      case 'h2h_form':
        return 'Head-to-Head Streak Multipliers';
      case 'reports':
        return 'Tactical Odds & Post-Match Markets';
      case 'jerseys':
        return 'Team Specials & Match Multi-Bets';
      case 'details':
        return 'Campus Derby Odds • 100% Free Bet';
      default:
        return 'Instant Match Cash Out & Live Slip';
    }
  };

  return (
    <aside 
      aria-label="Sponsored Match Ad"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-purple-500/30 backdrop-blur-md px-3 py-1 flex justify-center items-center shadow-2xl"
    >
      <a
        href={DIRECT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-md h-[42px] max-h-[44px] flex items-center justify-between px-3 bg-gradient-to-r from-purple-900/40 via-zinc-900 to-purple-900/40 border border-purple-500/40 rounded-xl active:scale-[0.99] transition-all [text-size-adjust:100%] [-webkit-text-size-adjust:100%]"
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="text-sm shrink-0 leading-none">🔥</span>
          <div className="min-w-0 leading-tight">
            <span className="text-[7.5px] font-black text-purple-400 uppercase tracking-widest block leading-none mb-0.5">SPONSORED</span>
            <p className="text-[9.5px] font-bold text-zinc-100 truncate">
              {getTabLabel(activeTab)}
            </p>
          </div>
        </div>
        <span className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wide shadow-xs whitespace-nowrap">
          Bet Live →
        </span>
      </a>
    </aside>
  );
};
export default StickyMatchFooterBanner;
