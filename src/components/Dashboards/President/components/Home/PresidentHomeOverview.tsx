import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { PresidentTab, SeasonItem, PendingTeam, TeamItem, RefereeItem, DraftFixture } from '../../types';

interface PresidentHomeOverviewProps {
  isDark: boolean;
  seasons: SeasonItem[];
  pendingTeams: PendingTeam[];
  teams: TeamItem[];
  referees: RefereeItem[];
  draftFixtures: DraftFixture[];
  isScheduleLocked: boolean;
  setActiveView: (tab: PresidentTab) => void;
}

export const PresidentHomeOverview: React.FC<PresidentHomeOverviewProps> = ({
  isDark,
  seasons,
  pendingTeams,
  teams,
  referees,
  draftFixtures,
  isScheduleLocked,
  setActiveView,
}) => {
  return (
    <div className="space-y-8">
      <div className={`p-8 md:p-10 rounded-3xl border ${isDark ? 'bg-[#0E1424]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'} backdrop-blur-2xl elevation-card space-y-6 relative overflow-hidden`}>
        <div className="space-y-3 max-w-2xl">
          <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
            PRE-SEASON PHASE
          </span>
          <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pre-Season President Dashboard
          </h1>
          <p className={`text-sm md:text-base font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Centralized executive portal for season initialization, team approvals, referee allocation, fixture engine, and megaphone broadcasts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={() => setActiveView('season_engine')}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Open Season Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveView('teams')}
            className={`px-5 py-3 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'}`}
          >
            Review Pending Approvals ({pendingTeams.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Season', val: seasons.find((s) => s.status === 'active')?.name || '2027 EPL', sub: 'Status: Active', action: () => setActiveView('season_engine') },
          { label: 'Pending Teams', val: pendingTeams.length.toString(), sub: 'Requires Review', action: () => setActiveView('teams') },
          { label: 'Approved Teams', val: teams.length.toString(), sub: 'Premier & Champ', action: () => setActiveView('teams') },
          { label: 'Referee Pool', val: referees.length.toString(), sub: 'FKF & Campus', action: () => setActiveView('referees') },
          { label: 'Draft Fixtures', val: draftFixtures.length.toString(), sub: isScheduleLocked ? 'Locked' : 'Drafting', action: () => setActiveView('fixture_engine') },
          { label: 'Schedule Lock', val: isScheduleLocked ? 'LOCKED' : 'OPEN', sub: 'Pre-Season Rule', action: () => setActiveView('fixture_engine') }
        ].map((stat, idx) => (
          <div
            key={idx}
            onClick={stat.action}
            className={`p-5 rounded-3xl border elevation-card transition-all cursor-pointer group ${isDark ? 'bg-[#0E1424] border-slate-800 hover:border-blue-500/40' : 'bg-white border-slate-200/90 hover:border-blue-500/40'}`}
          >
            <div className={`text-xl md:text-2xl font-black tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-blue-600 transition-colors`}>
              {stat.val}
            </div>
            <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stat.label}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
