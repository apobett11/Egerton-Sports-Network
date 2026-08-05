import React from 'react';
import { ArrowRight, Trophy, Megaphone, UserCheck, Calendar } from 'lucide-react';
import type { PresidentTab, SeasonItem, TeamItem, RefereeItem } from '../../types';

interface PresidentHomeOverviewProps {
  isDark: boolean;
  seasons: SeasonItem[];
  teams: TeamItem[];
  referees: RefereeItem[];
  announcementsCount?: number;
  setActiveView: (tab: PresidentTab) => void;
}

export const PresidentHomeOverview: React.FC<PresidentHomeOverviewProps> = ({
  isDark,
  seasons: _seasons,
  teams,
  referees,
  announcementsCount = 0,
  setActiveView,
}) => {
  return (
    <div className="space-y-8">
      {/* QUICK ACTIONS BANNER */}
      <div className={`p-6 md:p-10 rounded-3xl border ${isDark ? 'bg-[#0E1424]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'} backdrop-blur-2xl space-y-6 relative overflow-hidden`}>
        <div className="space-y-2 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
            PRE-SEASON PHASE
          </span>
          <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pre-Season Executive Portal
          </h1>
          <p className={`text-xs md:text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Manage referee registrations, broadcast announcements, review league registrations, and prepare match fixtures.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveView('fixture_engine')}
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Generate Fixtures</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveView('megaphone')}
              className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400 flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <span>Make Announcement</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveView('referees')}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>Manage Referees</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setActiveView('season_engine')}
              className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>View Leagues</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Referees Card */}
        <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">Referees</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {referees.length}
          </div>
          <button
            onClick={() => setActiveView('referees')}
            className="w-full py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Register Referee
          </button>
        </div>

        {/* Registered Teams Card */}
        <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">Registered Teams</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {teams.length}
          </div>
          <button
            onClick={() => setActiveView('season_engine')}
            className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            View Teams
          </button>
        </div>

        {/* Leagues Overview Card */}
        <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">Leagues</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            2
          </div>
          <button
            onClick={() => setActiveView('season_engine')}
            className="w-full py-2.5 rounded-xl bg-amber-600/10 hover:bg-amber-600 text-amber-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            View Leagues
          </button>
        </div>

        {/* Announcements Card */}
        <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">Announcements</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {announcementsCount}
          </div>
          <button
            onClick={() => setActiveView('megaphone')}
            className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Make Announcement
          </button>
        </div>
      </div>
    </div>
  );
};
