import React from 'react';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import type { SeasonFixture } from '../../types';

interface FixtureEngineViewProps {
  isDark: boolean;
  savedFixtures?: SeasonFixture[];
  onOpenLaunchModal?: () => void;
}

export const FixtureEngineView: React.FC<FixtureEngineViewProps> = ({
  isDark,
  onOpenLaunchModal,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Pre-Season Governance</span>
            </span>
          </div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Season Fixture Generation
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Initialize and orchestrate official Double Round-Robin matchdays for Egerton Premier League and Egerton Championship.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenLaunchModal}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Begin Season</span>
          </button>
        </div>
      </div>

      {/* STRICT PRE-SEASON EMPTY STATE IN THE MIDDLE OF THE PAGE */}
      <div className={`p-10 sm:p-16 md:p-20 rounded-3xl border text-center space-y-8 max-w-2xl mx-auto elevation-card ${
        isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <Trophy className="w-12 h-12" />
        </div>

        <div className="space-y-3 max-w-lg mx-auto">
          <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Official Season Not Yet Begun
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            Pre-season phase is active. Official double round-robin fixtures, venue assignments, and referee allocations will be computed by <strong className="text-amber-400">Agent 0</strong> once you launch and confirm the season.
          </p>
        </div>

        {/* PROMINENT CENTER BUTTON */}
        <div className="pt-2">
          <button
            onClick={onOpenLaunchModal}
            className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-3 mx-auto min-h-[48px]"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>Begin Season</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/60 max-w-md mx-auto text-left">
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-400">Premier League</span>
            <div className="text-xs font-bold text-slate-300">10 Clubs • 18 Matchdays</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-400">Championship</span>
            <div className="text-xs font-bold text-slate-300">13 Clubs • 26 Matchdays</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixtureEngineView;
