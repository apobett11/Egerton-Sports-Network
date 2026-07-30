import React from 'react';
import { Zap, RefreshCw, Users, TrendingUp, Clock, Award, Database } from 'lucide-react';

interface SuperAdminHeaderProps {
  trafficSpikeActive: boolean;
  setTrafficSpikeActive: React.Dispatch<React.SetStateAction<boolean>>;
  isScanningAdvisor: boolean;
  runIndexAdvisorScan: () => void;
  totalDAU: number;
  avgSessionTime: string;
  dreamTeamCompletionRate: string;
  flaggedQueriesCount: number;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  trafficSpikeActive,
  setTrafficSpikeActive,
  isScanningAdvisor,
  runIndexAdvisorScan,
  totalDAU,
  avgSessionTime,
  dreamTeamCompletionRate,
  flaggedQueriesCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              FA President Console
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational (Egerton Engine v5.0)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-1">
            Super Admin Psychological & Infrastructure Metrics
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            Real-time oversight for Egerton Sports Network (Njoro Campus Hub)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTrafficSpikeActive((prev) => !prev)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
              trafficSpikeActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700 text-gray-300'
            }`}
          >
            <Zap className={`w-4 h-4 ${trafficSpikeActive ? 'text-amber-400 animate-bounce' : 'text-gray-400'}`} />
            {trafficSpikeActive ? 'Simulating 5k Surge' : 'Test Weekend Spike'}
          </button>

          <button
            onClick={runIndexAdvisorScan}
            disabled={isScanningAdvisor}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanningAdvisor ? 'animate-spin' : ''}`} />
            {isScanningAdvisor ? 'Scanning Index Advisor...' : 'Run Index Advisor Scan'}
          </button>
        </div>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#181818] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Daily Active Users (DAU)
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalDAU.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              +24.6% vs last week (Matchday Peak)
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#181818] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Avg Session Duration
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">{avgSessionTime}</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Zero stopping-cue waterfall effect
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#181818] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Prediction Loop Rate
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{dreamTeamCompletionRate}</div>
            <div className="text-[11px] text-gray-400 mt-1">1,420 squads built this week</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#181818] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Supabase Query Health
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {flaggedQueriesCount > 0 ? (
                <span className="text-amber-400">{flaggedQueriesCount} Slow Queries</span>
              ) : (
                <span className="text-emerald-400">100% Optimal</span>
              )}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Index advisor active</div>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
            flaggedQueriesCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
