import React from 'react';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import type { SeasonFixture } from '../../types';

interface FixtureEngineViewProps {
  isDark: boolean;
  savedFixtures?: SeasonFixture[];
  premierLeagueTeams?: any[];
  championshipTeams?: any[];
  onOpenLaunchModal?: () => void;
}

export const FixtureEngineView: React.FC<FixtureEngineViewProps> = ({
  isDark,
  premierLeagueTeams = [],
  championshipTeams = [],
  onOpenLaunchModal,
}) => {
  const eplCount = premierLeagueTeams.length;
  const champCount = championshipTeams.length;
  const eplMatchdays = eplCount > 1 ? (eplCount % 2 === 0 ? (eplCount - 1) * 2 : eplCount * 2) : 0;
  const champMatchdays = champCount > 1 ? (champCount % 2 === 0 ? (champCount - 1) * 2 : champCount * 2) : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#14263b] text-slate-300 border border-[#1a2e45] inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#ff0046]" />
              <span>Pre-Season Governance</span>
            </span>
          </div>
          <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Season Fixture Generation
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Initialize and orchestrate official Double Round-Robin matchdays for Egerton Premier League and Egerton Championship.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenLaunchModal}
            className="px-4 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Begin Season</span>
          </button>
        </div>
      </div>

      {/* STRICT PRE-SEASON EMPTY STATE IN THE MIDDLE OF THE PAGE */}
      <div className={`p-8 sm:p-12 md:p-16 rounded-none sm:rounded-sm border text-center space-y-6 max-w-2xl mx-auto shadow-xs ${
        isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'
      }`}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-[#152a40] text-[#ff0046] flex items-center justify-center mx-auto border border-[#223b56] shadow-xs">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Official Season Not Yet Begun
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            Pre-season phase is active. Official double round-robin fixtures, venue assignments, and referee allocations will be computed by <strong className="text-[#ff0046]">Agent 0</strong> once you launch and confirm the season.
          </p>
        </div>

        {/* PROMINENT CENTER BUTTON */}
        <div className="pt-2">
          <button
            onClick={onOpenLaunchModal}
            className="px-8 py-3.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2.5 mx-auto min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Begin Season</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#14263b] max-w-md mx-auto text-left">
          <div className="p-3 rounded-sm bg-[#102237] border border-[#1a2e45] space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#ff0046]">Premier League</span>
            <div className="text-xs font-bold text-slate-200">{eplCount} Clubs • {eplMatchdays} Matchdays</div>
          </div>
          <div className="p-3 rounded-sm bg-[#102237] border border-[#1a2e45] space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Championship</span>
            <div className="text-xs font-bold text-slate-200">{champCount} Clubs • {champMatchdays} Matchdays</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixtureEngineView;
