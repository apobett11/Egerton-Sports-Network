import React from 'react';
import { Trophy, User, Star, List, MessageSquare, ClipboardList, Calendar } from 'lucide-react';
import type { AnonymousDevice } from '../../../types/predictions';

interface HeaderProps {
  embedded?: boolean;
  mainNav: 'livescore' | 'news' | 'standings';
  onSelectMainNav: (nav: 'livescore' | 'news' | 'standings') => void;
  activeTab: 'banter' | 'scores';
  onSelectTab?: (tab: 'banter' | 'scores') => void;
  identity: AnonymousDevice;
  completedPicksCount: number;
  totalRequiredPicks: number;
  clubFilterOn?: boolean;
  hasFavouriteClub?: boolean;
  onToggleClubBanter?: () => void;
  onOpenSlips?: () => void;
  slipCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  embedded = false,
  mainNav,
  onSelectMainNav,
  activeTab,
  onSelectTab,
  identity,
  completedPicksCount,
  totalRequiredPicks,
  clubFilterOn = false,
  hasFavouriteClub = false,
  onToggleClubBanter,
  onOpenSlips,
  slipCount = 0,
}) => {
  const isScores = mainNav === 'livescore' || mainNav === 'standings';
  const isNews = mainNav === 'news';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1a2e45] bg-[#0b1522] shadow-lg">
      {!embedded && (
        <>
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0046] font-black text-white shadow-sm ring-1 ring-white/20">
                <Trophy className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 text-base font-black tracking-tight text-white">
                  EGERSCORE
                  <span className="rounded-xs border border-[#ff0046]/40 bg-[#ff0046]/20 px-1 py-0.2 text-[10px] font-bold uppercase text-[#ff0046]">
                    EPL
                  </span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Matchday Community
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-[#0e1c2b] px-3 py-1 text-xs text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00b04f]" />
              <User className="h-3 w-3 text-slate-400" />
              <span className="max-w-[120px] truncate font-semibold text-slate-200 sm:max-w-[180px]">
                {identity.publicHandle}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#0e1e2d] px-3 py-2.5 text-white">
            <div className="mx-auto flex max-w-5xl items-center justify-center">
              <div className="inline-flex items-center rounded-xl border border-slate-700/60 bg-[#0a1520]/80 p-1 shadow-md backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => onSelectMainNav('livescore')}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border px-10 py-3 text-sm font-black uppercase tracking-wider transition-all duration-150 sm:px-16 sm:text-base md:px-24 ${
                    isScores
                      ? 'border-[#36506b] bg-[#152a40] text-white shadow-sm ring-1 ring-white/10'
                      : 'border-transparent text-slate-400 hover:bg-[#112236]/50 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-xs border border-current text-[10px] font-black leading-none ${
                      isScores ? 'border-[#ff0046] bg-[#ff0046] text-white' : ''
                    }`}
                  >
                    10
                  </span>
                  <span>Scores</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMainNav('news')}
                  className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border px-10 py-3 text-sm font-black uppercase tracking-wider transition-all duration-150 sm:px-16 sm:text-base md:px-24 ${
                    isNews
                      ? 'border-[#36506b] bg-[#152a40] text-white shadow-sm ring-1 ring-white/10'
                      : 'border-transparent text-slate-400 hover:bg-[#112236]/50 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-xs border border-current text-[10px] font-black leading-none ${
                      isNews ? 'border-[#ff0046] bg-[#ff0046] text-white' : ''
                    }`}
                  >
                    ≡
                  </span>
                  <span>News</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isScores && (
        <div className="w-full border-b border-[#1a2e45] bg-[#0e1c2b] text-slate-100">
          <div className="mx-auto flex h-10 max-w-5xl items-center justify-start gap-2 overflow-x-auto no-scrollbar px-2 sm:gap-5 sm:px-4">
            <button
              type="button"
              onClick={() => onSelectMainNav('livescore')}
              className={`flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm ${
                mainNav === 'livescore'
                  ? 'border-[#ff0046] text-[#ff0046]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Fixtures</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMainNav('standings')}
              className={`flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm ${
                mainNav === 'standings'
                  ? 'border-[#ff0046] text-[#ff0046]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>Standings</span>
            </button>
          </div>
        </div>
      )}

      {isNews && (
        <>
          <div className="w-full border-b border-[#1a2e45] bg-[#0e1c2b] text-slate-100">
            <div className="mx-auto flex h-10 max-w-5xl items-center justify-start gap-2 overflow-x-auto no-scrollbar px-2 sm:gap-5 sm:px-4">
              <button
                type="button"
                onClick={() => onSelectTab?.('banter')}
                className={`flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm ${
                  activeTab === 'banter'
                    ? 'border-[#ff0046] text-[#ff0046]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Banter</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab?.('scores')}
                className={`flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider transition-colors sm:text-sm ${
                  activeTab === 'scores'
                    ? 'border-[#ff0046] text-[#ff0046]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Predictions</span>
              </button>
            </div>
          </div>

          <div className="w-full border-b border-[#1a2e45] bg-[#0e1c2b] text-slate-100">
            <div className="mx-auto flex h-10 max-w-5xl items-center justify-start gap-1 overflow-x-auto no-scrollbar px-2 sm:gap-4 sm:px-4">
              {embedded && (
                <span className="mr-1 max-w-[9rem] truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {identity.publicHandle}
                </span>
              )}
              <button
                type="button"
                onClick={onToggleClubBanter}
                className={`relative flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors sm:p-2 ${
                  clubFilterOn ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'hover:bg-[#14263b]'
                }`}
                title={hasFavouriteClub ? 'Takes about your club' : 'Pick your club'}
                aria-label={hasFavouriteClub ? 'Takes about your club' : 'Pick your club'}
                aria-pressed={clubFilterOn}
              >
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {hasFavouriteClub && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff0046] text-[8px] font-black text-white">
                    1
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSlips}
                className="relative flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors hover:bg-[#14263b] sm:p-2"
                title="My prediction slips"
                aria-label="My prediction slips"
              >
                <List className="h-4 w-4 text-slate-200" />
                {slipCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ff0046] px-0.5 text-[8px] font-black text-white">
                    {slipCount > 9 ? '9+' : slipCount}
                  </span>
                )}
              </button>

              {activeTab === 'scores' && totalRequiredPicks > 0 && (
                <span className="ml-auto font-mono text-[10px] font-bold text-slate-400">
                  {completedPicksCount}/{totalRequiredPicks} selected
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
