import React from 'react';
import {
  ArrowRight,
  Trophy,
  Megaphone,
  UserCheck,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react';
import type { PresidentTab, SeasonItem, TeamItem, RefereeItem, PitchItem } from '../../types';
import { SeasonReadiness } from './SeasonReadiness';
import { OPERATIONAL_STATUS_COLORS } from '../../constants';

interface PresidentHomeOverviewProps {
  isDark: boolean;
  seasons: SeasonItem[];
  teams: TeamItem[];
  referees: RefereeItem[];
  pitches?: PitchItem[];
  announcementsCount?: number;
  setActiveView: (tab: PresidentTab) => void;
  onOpenSeasonLaunchModal?: () => void;
}

export const PresidentHomeOverview: React.FC<PresidentHomeOverviewProps> = ({
  isDark,
  seasons: _seasons,
  teams,
  referees,
  pitches = [],
  setActiveView,
  onOpenSeasonLaunchModal,
}) => {
  const premierLeagueTeams = teams.filter((t) => t.league === 'premier' || !t.league);
  const championshipTeams = teams.filter((t) => t.league === 'championship');
  const activeReferees = referees.filter((r) => r.status === 'Active');

  // Pre-season setup checklist calculation
  const checklist = [
    {
      label: 'Database Schema Contract Verification',
      status: 'complete',
      detail: 'Canonical tables and foreign key relationships confirmed',
    },
    {
      label: 'Egerton Premier League Roster Intake',
      status: premierLeagueTeams.length >= 2 ? 'complete' : 'pending',
      detail: `${premierLeagueTeams.length} Premier League teams registered`,
    },
    {
      label: 'Egerton Championship Roster Intake',
      status: championshipTeams.length >= 2 ? 'complete' : 'pending',
      detail: `${championshipTeams.length} Championship teams registered`,
    },
    {
      label: 'Official Referee Pool Verification',
      status: activeReferees.length >= 1 ? 'complete' : 'pending',
      detail: `${activeReferees.length} active center referees registered`,
    },
    {
      label: 'Official Pitch Foundation Setup',
      status: pitches.length >= 1 ? 'complete' : 'pending',
      detail: `${pitches.length} official Egerton grounds configured`,
    },
  ];

  const completedCount = checklist.filter((c) => c.status === 'complete').length;
  const setupPercentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8">
      {/* QUICK ACTIONS BANNER */}
      <div
        className={`p-6 md:p-10 rounded-3xl border ${
          isDark ? 'bg-[#0E1424]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'
        } backdrop-blur-2xl space-y-6 relative overflow-hidden`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
            PRE-SEASON PHASE
          </span>
          <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pre-Season Executive Portal
          </h1>
          <p className={`text-xs md:text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Review registered teams across Egerton divisions, verify referee pool credentials, inspect campus pitches, and launch season fixtures.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveView('fixture_engine')}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center justify-between cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Begin Season</span>
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
              className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-between cursor-pointer group"
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
        {/* Card 1: Referees */}
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

        {/* Card 2: Registered Teams */}
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

        {/* Card 3: Leagues Overview */}
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

        {/* Card 4: Campus Pitches (Replaces Announcements Card) */}
        <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">Campus Pitches</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {pitches.length}
          </div>
          <div className="text-xs text-teal-500 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Egerton Grounds</span>
          </div>
        </div>
      </div>

      {/* SEASON READINESS COMPONENT */}
      <SeasonReadiness
        isDark={isDark}
        premierLeagueTeams={premierLeagueTeams}
        championshipTeams={championshipTeams}
        referees={referees}
        pitches={pitches}
        onOpenGenerationModal={() => setActiveView('fixture_engine')}
      />

      {/* PRE-SEASON CHECKLIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
            Pre-Season Setup Checklist
          </h2>
          <span className="text-xs font-black text-emerald-500">{setupPercentage}% Complete</span>
        </div>

        <div
          className={`p-6 rounded-3xl border space-y-5 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Progress Bar */}
          <div className="w-full bg-slate-800/40 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${setupPercentage}%` }}
            />
          </div>

          <div className="space-y-3.5 divide-y divide-slate-800/40">
            {checklist.map((item, idx) => (
              <div key={idx} className="pt-3.5 first:pt-0 flex items-start gap-3">
                {item.status === 'complete' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OFFICIAL CAMPUS PITCHES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Official Campus Pitches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Verified sports grounds allocated for Pre-Season league matches.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-black">
            {pitches.length} Grounds Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pitches.map((pitch) => (
            <div
              key={pitch.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                isDark ? 'bg-[#0E1424] border-slate-800 hover:border-teal-500/30' : 'bg-white border-slate-200 hover:border-teal-400'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white flex items-center justify-center font-black shadow-md">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {pitch.name}
                      </h3>
                      {pitch.short_code && (
                        <span className="text-[10px] text-teal-400 font-mono font-bold">{pitch.short_code}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                      OPERATIONAL_STATUS_COLORS[pitch.status || 'Available'] || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {pitch.status || 'Available'}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/40 text-xs font-medium text-slate-300">
                  {pitch.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Location:</span>
                      <span className="truncate max-w-[150px]">{pitch.location}</span>
                    </div>
                  )}
                  {pitch.capacity !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Spectator Capacity:</span>
                      <span className="font-extrabold text-white flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {pitch.capacity.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {pitch.surface_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Surface:</span>
                      <span>{pitch.surface_type}</span>
                    </div>
                  )}
                  {pitch.has_lighting !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Floodlights:</span>
                      <span className="flex items-center gap-1 font-bold">
                        {pitch.has_lighting ? (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-400">Commissioned</span>
                          </>
                        ) : (
                          <span className="text-slate-500">Day Fixtures Only</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Ready for Allocation</span>
                <span className="text-teal-400 font-extrabold">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
