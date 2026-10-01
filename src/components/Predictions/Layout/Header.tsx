import React from 'react';
import { Trophy, User, Radio, Newspaper, Table, Star, List, MessageSquare, ClipboardList } from 'lucide-react';
import type { AnonymousDevice } from '../../../types/predictions';

interface HeaderProps {
  embedded?: boolean;
  mainNav: 'livescore' | 'news' | 'standings';
  onSelectMainNav: (nav: 'livescore' | 'news' | 'standings') => void;
  activeTab: 'banter' | 'scores';
  onSelectTab: (tab: 'banter' | 'scores') => void;
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
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#1a2e45] bg-[#0b1522] shadow-lg">
      {!embedded && (
      <>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0046] font-black text-white shadow-sm ring-1 ring-white/20">
              <Trophy className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                EGERSCORE
                <span className="rounded-xs bg-[#ff0046]/20 px-1 py-0.2 text-[10px] font-bold text-[#ff0046] border border-[#ff0046]/40 uppercase">
                  EPL
                </span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Matchday Community
              </span>
            </div>
          </div>
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-[#0e1c2b] px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-[#00b04f] animate-pulse" />
          <User className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
            {identity.publicHandle}
          </span>
        </div>
      </div>

      {/* 2. Top-Level Livescore Master Navigation Hierarchy */}
      <div className="w-full bg-[#08121c] border-t border-[#142538] px-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <nav className="flex items-center space-x-1 sm:space-x-2 py-1 text-xs font-black tracking-wider uppercase">
            {/* LIVESCORE (Untouched matches center) */}
            <button
              type="button"
              onClick={() => onSelectMainNav('livescore')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                mainNav === 'livescore'
                  ? 'bg-[#152a40] text-white border-b-2 border-[#ff0046]'
                  : 'text-slate-400 hover:text-white hover:bg-[#112236]/40'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${mainNav === 'livescore' ? 'text-[#ff0046] animate-pulse' : 'text-slate-400'}`} />
              <span>LIVESCORE</span>
            </button>

            {/* NEWS (The main button leading to this whole Community & Prediction feature) */}
            <button
              type="button"
              onClick={() => onSelectMainNav('news')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer relative ${
                mainNav === 'news'
                  ? 'bg-[#152a40] text-white border-b-2 border-[#ff0046]'
                  : 'text-slate-400 hover:text-white hover:bg-[#112236]/40'
              }`}
            >
              <Newspaper className="h-3.5 w-3.5 text-[#ff0046]" />
              <span>NEWS / COMMUNITY</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#ff0046] animate-ping" />
            </button>

            {/* STANDINGS */}
            <button
              type="button"
              onClick={() => onSelectMainNav('standings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                mainNav === 'standings'
                  ? 'bg-[#152a40] text-white border-b-2 border-[#ff0046]'
                  : 'text-slate-400 hover:text-white hover:bg-[#112236]/40'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-slate-400" />
              <span>STANDINGS</span>
            </button>
          </nav>

          <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono">
            Gameweek 7 Active
          </span>
        </div>
      </div>
      </>
      )}

      {/* Scores and banter stay on this row whether the guest opened News or Predictions. */}
      {mainNav === 'news' && (
        <div className="w-full bg-[#0e1c2b] border-b border-[#1a2e45] text-slate-100 animate-fadeIn">
          <div className="mx-auto flex h-10 max-w-5xl items-center justify-start gap-1 overflow-x-auto no-scrollbar px-2 sm:gap-4 sm:px-4">
            {embedded && (
              <span className="mr-1 max-w-[9rem] truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {identity.publicHandle}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleClubBanter}
              className={`relative flex items-center justify-center rounded-md p-1.5 sm:p-2 cursor-pointer transition-colors ${
                clubFilterOn
                  ? 'bg-amber-500/15 ring-1 ring-amber-500/40'
                  : 'hover:bg-[#14263b]'
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
              className="relative flex items-center justify-center rounded-md p-1.5 sm:p-2 cursor-pointer transition-colors hover:bg-[#14263b]"
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

            <button
              type="button"
              onClick={() => onSelectTab('banter')}
              className={`flex h-full items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors sm:text-sm ${
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
              onClick={() => onSelectTab('scores')}
              className={`flex h-full items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors sm:text-sm ${
                activeTab === 'scores'
                  ? 'border-[#ff0046] text-[#ff0046]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Predictions</span>
              {totalRequiredPicks > 0 && (
                <span className={`text-[10px] font-mono ${activeTab === 'scores' ? 'text-[#ff0046]' : 'text-slate-500'}`}>
                  {completedPicksCount}/{totalRequiredPicks}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
