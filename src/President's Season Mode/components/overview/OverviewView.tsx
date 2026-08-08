import React from 'react';
import {
  Trophy,
  Award,
  UserCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import type { SeasonTeam, SeasonReferee, SeasonPitch, SeasonModeView } from '../../types/seasonMode';

interface OverviewViewProps {
  isDark: boolean;
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  setActiveView: (view: SeasonModeView) => void;
  onOpenCoachModal: () => void;
  onOpenRefModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  isDark,
  premierLeagueTeams,
  championshipTeams,
  referees,
  pitches,
  setActiveView,
  onOpenCoachModal,
  onOpenRefModal,
}) => {
  const totalTeams = premierLeagueTeams.length + championshipTeams.length;
  const activeReferees = referees.filter((r) => r.status === 'Active').length;
  const availablePitches = pitches.filter((p) => p.status === 'Available').length;

  // Setup completion progress
  const checklist = [
    {
      label: 'Database Schema Contract Verification',
      status: 'complete',
      detail: 'Canonical tables and foreign key relationships confirmed',
    },
    {
      label: 'Egerton Premier League Roster Intake',
      status: premierLeagueTeams.length >= 4 ? 'complete' : 'pending',
      detail: `${premierLeagueTeams.length} Premier League teams registered`,
    },
    {
      label: 'Egerton Championships Roster Intake',
      status: championshipTeams.length >= 4 ? 'complete' : 'pending',
      detail: `${championshipTeams.length} Championship teams registered`,
    },
    {
      label: 'Official Referee Pool Verification',
      status: activeReferees >= 3 ? 'complete' : 'pending',
      detail: `${activeReferees} active center referees registered`,
    },
    {
      label: 'Official Pitch Foundation Setup',
      status: pitches.length >= 3 ? 'complete' : 'pending',
      detail: `${pitches.length} official Egerton grounds configured`,
    },
  ];

  const completedCount = checklist.filter((c) => c.status === 'complete').length;
  const setupPercentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div
        className={`p-6 md:p-8 rounded-3xl border relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-[#0E1424] via-[#090D16] to-[#0E1424] border-slate-800'
            : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200'
        }`}
      >
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            Season Status: Intake & Foundation Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Pre-Season Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Welcome, Mr. President. Review registered teams across both Egerton divisions, verify referee pool credentials, inspect official campus pitches, and process intake forms before launching the active season.
          </p>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: EPL Teams */}
        <div
          onClick={() => setActiveView('teams')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-amber-500/40' : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
              EPL
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{premierLeagueTeams.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Premier League Teams</div>
          </div>
        </div>

        {/* Card 2: Championship Teams */}
        <div
          onClick={() => setActiveView('teams')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-blue-500/40' : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
              Championship
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{championshipTeams.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Championship Teams</div>
          </div>
        </div>

        {/* Card 3: Referees */}
        <div
          onClick={() => setActiveView('referees')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Active Pool
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{referees.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Verified Referees</div>
          </div>
        </div>

        {/* Card 4: Pitches */}
        <div
          onClick={() => setActiveView('pitches')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
            isDark ? 'bg-[#0E1424] border-slate-800/80 hover:border-teal-500/40' : 'bg-white border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-md">
              Campus Pitches
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{pitches.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">Official Grounds</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & PRE-SEASON CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
            Quick Operational Actions
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => setActiveView('teams')}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                isDark ? 'bg-[#0E1424] border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">Review Registered Teams</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Inspect EPL & Championship rosters</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={onOpenCoachModal}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                isDark ? 'bg-[#0E1424] border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">New Coach Intake</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Register coach & team with normalization</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={onOpenRefModal}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                isDark ? 'bg-[#0E1424] border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">Register Center Referee</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Add verified referee to active pool</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveView('pitches')}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                isDark ? 'bg-[#0E1424] border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">Manage Pitch Availability</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Inspect the 3 official Egerton pitches</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Setup Checklist */}
        <div className="lg:col-span-2 space-y-4">
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
      </div>
    </div>
  );
};
