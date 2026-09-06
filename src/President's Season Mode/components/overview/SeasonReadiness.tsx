import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Calendar, Play } from 'lucide-react';
import type { SeasonTeam, SeasonReferee, SeasonPitch } from '../../types/seasonMode';

interface SeasonReadinessProps {
  isDark: boolean;
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
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
  const availablePitches = pitches.filter((p) => p.status === 'Available');

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
      className={`p-5 rounded-md border space-y-4 shadow-xs transition-all ${
        isDark
          ? 'bg-[#0e1c2b] border-[#1a2e45] text-white'
          : 'bg-white border-[#e6e8ec] text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#14263b]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Season Preparation & Readiness
            </h2>
            {hasSavedFixtures && (
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-slate-300 border border-[#1a2e45]">
                Fixtures Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Live evaluation of database roster, referee pool, and pitch availability.
          </p>
        </div>

        {/* Readiness Pill */}
        <div className="flex items-center gap-2">
          {isSeasonReady ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00b04f]" />
              <span>Ready</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Not Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Database State Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Teams Status */}
        <div
          className={`p-3.5 rounded-md border space-y-2 ${
            isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Teams</span>
            {eplCount >= 2 && champCount >= 2 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00b04f]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span>EPL</span>
              <span className={eplCount >= 2 ? 'text-[#00b04f]' : 'text-amber-400'}>
                ✓ {eplCount} teams
              </span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span>Championships</span>
              <span className={champCount >= 2 ? 'text-[#00b04f]' : 'text-amber-400'}>
                ✓ {champCount} teams
              </span>
            </div>
          </div>
        </div>

        {/* Referees Status */}
        <div
          className={`p-3.5 rounded-md border space-y-2 ${
            isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Referees</span>
            {refCount >= 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00b04f]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span>Available Pool</span>
              <span className={refCount >= 1 ? 'text-[#00b04f]' : 'text-amber-400'}>
                ✓ {refCount} available
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Active center referees
            </div>
          </div>
        </div>

        {/* Pitches Status */}
        <div
          className={`p-3.5 rounded-md border space-y-2 ${
            isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pitches</span>
            {pitchCount >= 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00b04f]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span>Campus Pitches</span>
              <span className={pitchCount >= 1 ? 'text-[#00b04f]' : 'text-amber-400'}>
                ✓ {pitchCount} available
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Official Egerton grounds
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Callout if Not Ready */}
      {!isSeasonReady && (
        <div className="p-3.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
          <div className="font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Season Generation Requirements Incomplete:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] font-medium text-amber-200">
            {missingRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Action Area */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400 font-medium">
          {isSeasonReady
            ? 'All operational criteria met. You can launch fixture generation.'
            : 'Complete the intake forms to satisfy all database criteria before initiating season fixtures.'}
        </div>

        <button
          onClick={onOpenGenerationModal}
          disabled={!isSeasonReady}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-black text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs ${
            isSeasonReady
              ? 'bg-[#ff0046] hover:bg-[#e0003e] text-white active:scale-98'
              : 'bg-[#14263b] text-slate-500 border border-[#1a2e45] cursor-not-allowed opacity-60'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Generate Fixtures</span>
        </button>
      </div>
    </div>
  );
};
