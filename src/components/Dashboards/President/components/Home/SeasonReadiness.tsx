import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import type { TeamItem, RefereeItem, PitchItem } from '../../types';

interface SeasonReadinessProps {
  isDark: boolean;
  premierLeagueTeams: TeamItem[];
  championshipTeams: TeamItem[];
  referees: RefereeItem[];
  pitches: PitchItem[];
  onOpenGenerationModal: () => void;
  hasSavedFixtures?: boolean;
}

export const SeasonReadiness: React.FC<SeasonReadinessProps> = ({
  isDark,
  premierLeagueTeams,
  championshipTeams,
  referees,
  pitches,
  onOpenGenerationModal,
  hasSavedFixtures = false,
}) => {
  const activeReferees = referees.filter((r) => r.status === 'Active');
  const availablePitches = pitches.filter((p) => !p.status || p.status === 'Available');

  const eplCount = premierLeagueTeams.length;
  const champCount = championshipTeams.length;
  const refCount = activeReferees.length;
  const pitchCount = availablePitches.length;

  // Real database-driven readiness checks
  const missingRequirements: string[] = [];

  if (eplCount < 2) {
    missingRequirements.push(`Egerton Premier League has only ${eplCount} registered team(s) (minimum 2 required).`);
  }

  if (champCount < 2) {
    missingRequirements.push(`Egerton Championship has only ${champCount} registered team(s) (minimum 2 required).`);
  }

  if (refCount < 1) {
    missingRequirements.push('No active referees available in the referee pool.');
  }

  if (pitchCount < 1) {
    missingRequirements.push('No official pitches configured or available.');
  }

  const isSeasonReady = missingRequirements.length === 0;

  return (
    <div
      className={`p-6 sm:p-7 rounded-3xl border space-y-6 shadow-sm transition-all ${
        isDark
          ? 'bg-[#0E1424] border-slate-800'
          : 'bg-white border-slate-200 shadow-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Season Preparation & Readiness
            </h2>
            {hasSavedFixtures && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Fixtures Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Live evaluation of database roster, referee pool, and pitch availability.
          </p>
        </div>

        {/* Readiness Pill */}
        <div className="flex items-center gap-2">
          {isSeasonReady ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Ready</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Not Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Database State Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Teams Status */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Teams</span>
            {eplCount >= 2 && champCount >= 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-slate-100">
              <span>EPL</span>
              <span className={eplCount >= 2 ? 'text-emerald-500' : 'text-amber-500'}>
                ✓ {eplCount} teams
              </span>
            </div>
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-slate-100">
              <span>Championships</span>
              <span className={champCount >= 2 ? 'text-emerald-500' : 'text-amber-500'}>
                ✓ {champCount} teams
              </span>
            </div>
          </div>
        </div>

        {/* Referees Status */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Referees</span>
            {refCount >= 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-slate-100">
              <span>Available Pool</span>
              <span className={refCount >= 1 ? 'text-emerald-500' : 'text-amber-500'}>
                ✓ {refCount} available
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Active center referees
            </div>
          </div>
        </div>

        {/* Pitches Status */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pitches</span>
            {pitchCount >= 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-slate-100">
              <span>Campus Pitches</span>
              <span className={pitchCount >= 1 ? 'text-emerald-500' : 'text-amber-500'}>
                ✓ {pitchCount} available
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Official Egerton grounds
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Callout if Not Ready */}
      {!isSeasonReady && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs space-y-1.5">
          <div className="font-extrabold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Season Generation Requirements Incomplete:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] font-medium text-amber-800 dark:text-amber-200">
            {missingRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Action Area */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {isSeasonReady
            ? 'All operational criteria met. You can launch fixture generation.'
            : 'Complete the intake forms to satisfy all database criteria before initiating season fixtures.'}
        </div>

        <button
          onClick={onOpenGenerationModal}
          disabled={!isSeasonReady}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs cursor-pointer transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            isSeasonReady
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:scale-[1.02]'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Generate Fixtures</span>
        </button>
      </div>
    </div>
  );
};
