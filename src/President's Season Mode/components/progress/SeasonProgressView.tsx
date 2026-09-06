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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Season Operational Progress Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30 uppercase tracking-wider">
              Read-Only Oversight
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive overview tracking total competition completion, matchday execution, and spillover metrics.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={`p-4 sm:p-5 rounded-md border space-y-1.5 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Overall Completion</span>
            <PieChart className="w-4 h-4 text-[#ff0046]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">{totalCompletionRate}%</div>
          <div className="w-full h-2 rounded-sm bg-[#14263b] overflow-hidden mt-1">
            <div className="h-full rounded-sm bg-[#ff0046]" style={{ width: `${totalCompletionRate}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium pt-0.5">
            {completedMatches} of {totalFixtures} total fixtures completed
          </p>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-md border space-y-1.5 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Completed Fixtures</span>
            <CheckCircle2 className="w-4 h-4 text-[#00b04f]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#00b04f]">{completedMatches}</div>
          <p className="text-[10px] text-slate-400 font-medium">Final scores recorded & standings updated</p>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-md border space-y-1.5 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Remaining Fixtures</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400">{remainingMatches}</div>
          <p className="text-[10px] text-slate-400 font-medium">Upcoming scheduled matchday matches</p>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-md border space-y-1.5 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Postponed / Spillover</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {postponedMatches + spilloverMatches}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {postponedMatches} postponed, {spilloverMatches} spillover matches
          </p>
        </div>
      </div>

      {/* DETAILED COMPETITION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EPL */}
        <div
          className={`p-4 sm:p-5 rounded-md border space-y-3 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff0046]" />
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                Egerton Premier League
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30">
              {eplCompletionRate}% Completed
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
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
              <span className="text-[#00b04f] font-mono font-bold">{eplCompleted}</span>
            </div>
          </div>

          <div className="w-full h-2 rounded-sm bg-[#14263b] overflow-hidden">
            <div className="h-full rounded-sm bg-[#ff0046]" style={{ width: `${eplCompletionRate}%` }} />
          </div>
        </div>

        {/* CHAMPIONSHIP */}
        <div
          className={`p-4 sm:p-5 rounded-md border space-y-3 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                Egerton Championships
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {champCompletionRate}% Completed
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
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
              <span className="text-[#00b04f] font-mono font-bold">{champCompleted}</span>
            </div>
          </div>

          <div className="w-full h-2 rounded-sm bg-[#14263b] overflow-hidden">
            <div className="h-full rounded-sm bg-sky-500" style={{ width: `${champCompletionRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
