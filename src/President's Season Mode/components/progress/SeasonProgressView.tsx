import React from 'react';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Shield, Layers, PieChart } from 'lucide-react';
import type { OperationalMatch } from '../../types/seasonMode';
import { COMPETITIONS, PRODUCTION_TARGETS } from '../../constants/seasonConstants';

interface SeasonProgressViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
}

export const SeasonProgressView: React.FC<SeasonProgressViewProps> = ({
  isDark,
  fixtures,
}) => {
  // Aggregate Metrics
  const totalFixtures = fixtures.length || PRODUCTION_TARGETS.TOTAL_FIXTURES;
  const completedMatches = fixtures.filter((f) => f.status === 'FT').length;
  const remainingMatches = fixtures.filter((f) => f.status === 'UPCOMING' || f.status === 'LIVE' || f.status === 'HT').length;
  const postponedMatches = fixtures.filter((f) => f.status === 'POSTPONED').length;
  const cancelledMatches = fixtures.filter((f) => f.status === 'CANCELLED').length;
  const spilloverMatches = fixtures.filter((f) => f.spillover_status).length;

  const totalCompletionRate = Math.round((completedMatches / totalFixtures) * 100) || 0;

  // EPL breakdown
  const eplFixtures = fixtures.filter((f) => f.competition_id === COMPETITIONS.PREMIER_LEAGUE.id);
  const eplTotal = eplFixtures.length || PRODUCTION_TARGETS.PREMIER_LEAGUE.totalFixtures;
  const eplCompleted = eplFixtures.filter((f) => f.status === 'FT').length;
  const eplCompletionRate = Math.round((eplCompleted / eplTotal) * 100) || 0;

  // Championship breakdown
  const champFixtures = fixtures.filter((f) => f.competition_id === COMPETITIONS.CHAMPIONSHIP.id);
  const champTotal = champFixtures.length || PRODUCTION_TARGETS.CHAMPIONSHIP.totalFixtures;
  const champCompleted = champFixtures.filter((f) => f.status === 'FT').length;
  const champCompletionRate = Math.round((champCompleted / champTotal) * 100) || 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Season Operational Progress Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
              Read-Only Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Executive overview tracking total competition completion, matchday execution, and spillover metrics.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          className={`p-6 rounded-3xl border space-y-2 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase">Overall Completion</span>
            <PieChart className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalCompletionRate}%</div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalCompletionRate}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 font-medium pt-1">
            {completedMatches} of {totalFixtures} total fixtures completed
          </p>
        </div>

        <div
          className={`p-6 rounded-3xl border space-y-2 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase">Completed Fixtures</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{completedMatches}</div>
          <p className="text-[11px] text-slate-400 font-medium">Final scores recorded & standings updated</p>
        </div>

        <div
          className={`p-6 rounded-3xl border space-y-2 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase font-mono">Remaining Fixtures</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-blue-400">{remainingMatches}</div>
          <p className="text-[11px] text-slate-400 font-medium">Upcoming scheduled matchday matches</p>
        </div>

        <div
          className={`p-6 rounded-3xl border space-y-2 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase font-mono">Postponed / Spillover</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {postponedMatches + spilloverMatches}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {postponedMatches} postponed, {spilloverMatches} spillover matches
          </p>
        </div>
      </div>

      {/* DETAILED COMPETITION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EPL */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Egerton Premier League
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {eplCompletionRate}% Completed
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-400">
              <span>Target Team Count</span>
              <span className="text-white">10 Teams</span>
            </div>
            <div className="flex justify-between font-bold text-slate-400">
              <span>Leg 1 + Leg 2 Fixture Target</span>
              <span className="text-white">180 Fixtures</span>
            </div>
            <div className="flex justify-between font-bold text-slate-400">
              <span>Completed Match Count</span>
              <span className="text-emerald-400">{eplCompleted}</span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${eplCompletionRate}%` }} />
          </div>
        </div>

        {/* CHAMPIONSHIP */}
        <div
          className={`p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                Egerton Championships
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {champCompletionRate}% Completed
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-400">
              <span>Target Team Count</span>
              <span className="text-white">13 Teams</span>
            </div>
            <div className="flex justify-between font-bold text-slate-400">
              <span>Leg 1 + Leg 2 Fixture Target</span>
              <span className="text-white">156 Fixtures</span>
            </div>
            <div className="flex justify-between font-bold text-slate-400">
              <span>Completed Match Count</span>
              <span className="text-emerald-400">{champCompleted}</span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${champCompletionRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
