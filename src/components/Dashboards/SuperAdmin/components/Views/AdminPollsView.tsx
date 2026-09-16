import React, { useState, useEffect, useCallback } from 'react';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  Users,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Calendar,
  Search,
} from 'lucide-react';
import { FeaturePollService, type FeaturePollStats } from '../../../../../services/featurePollService';

interface AdminPollsViewProps {
  showToast: (msg: string) => void;
}

export const AdminPollsView: React.FC<AdminPollsViewProps> = ({ showToast }) => {
  const [stats, setStats] = useState<FeaturePollStats>({
    totalVotes: 0,
    yesCount: 0,
    noCount: 0,
    yesPercentage: 0,
    noPercentage: 0,
    recentVotes: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FeaturePollService.getPollAnalytics();
      setStats(data);
    } catch (err) {
      console.warn('Error fetching poll stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      const ok = await FeaturePollService.purgeFeedbackPollTable();
      if (ok) {
        showToast('Temporary determinant poll data permanently deleted.');
        setShowPurgeModal(false);
        fetchStats();
      } else {
        showToast('Failed to purge temporary table.');
      }
    } catch {
      showToast('Error purging temporary table.');
    } finally {
      setIsPurging(false);
    }
  };

  const filteredVotes = stats.recentVotes.filter((v) =>
    v.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#191919] via-[#1A231F] to-[#191919] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Vote className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Admin 2 • Polls & Feature Determinants
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                  SUB-PAGE ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Community feedback determinants & weekly match prediction engine telemetry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-gray-300 text-xs font-bold transition-colors cursor-pointer border border-[#383838]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer border border-rose-500/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Temporary Table</span>
          </button>
        </div>
      </div>

      {/* 2. Determinant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unique Devices */}
        <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Total Unique Devices</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.totalVotes}
          </div>
          <p className="text-[11px] text-gray-400">
            1 vote per device identifier
          </p>
        </div>

        {/* Yes / In Favor */}
        <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-emerald-400">In Favor (Yes)</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {stats.yesCount}
            </span>
            <span className="text-xs font-bold text-emerald-500">
              ({stats.yesPercentage}%)
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Fans supporting feature rollout
          </p>
        </div>

        {/* No / Opposed */}
        <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-amber-400">Opposed (No)</span>
            <ThumbsDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {stats.noCount}
            </span>
            <span className="text-xs font-bold text-amber-500">
              ({stats.noPercentage}%)
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Prefer not having the feature
          </p>
        </div>

        {/* Current Verdict */}
        <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Determinant Verdict</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-black uppercase tracking-wider">
            {stats.totalVotes === 0 ? (
              <span className="text-gray-400">Awaiting Feedback</span>
            ) : stats.yesPercentage >= 60 ? (
              <span className="text-emerald-400">Strong Approval</span>
            ) : stats.yesPercentage >= 45 ? (
              <span className="text-amber-400">Mixed Sentiment</span>
            ) : (
              <span className="text-rose-400">Feature On Hold</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            {stats.totalVotes === 0
              ? 'No device votes recorded yet'
              : `${stats.yesPercentage}% approval across ${stats.totalVotes} devices`}
          </p>
        </div>
      </div>

      {/* 3. Visual Sentiment Gauge */}
      <div className="p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-wider text-white">
            Community Sentiment Distribution
          </span>
          <span className="font-mono text-gray-400 text-[11px]">
            {stats.yesCount} YES vs {stats.noCount} NO
          </span>
        </div>

        {stats.totalVotes > 0 ? (
          <div className="space-y-2">
            <div className="w-full h-4 bg-[#262626] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${stats.yesPercentage}%` }}
                title={`Yes: ${stats.yesPercentage}%`}
              />
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${stats.noPercentage}%` }}
                title={`No: ${stats.noPercentage}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 font-bold">
              <span className="text-emerald-400">Yes: {stats.yesPercentage}%</span>
              <span className="text-amber-400">No: {stats.noPercentage}%</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-gray-500">
            No votes submitted yet. The determinant poll will populate as visitors explore the ODDS tab.
          </div>
        )}
      </div>

      {/* 4. Weekly Fixtures Match Predictor Blueprint & Architecture Status */}
      <div className="p-6 rounded-2xl bg-[#141d26] border border-[#1e344a] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>Upcoming Phase: Weekly Fixtures Match Prediction Lifecycle</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
            Awaiting Determinant Approval
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Once approved, the Match Prediction engine will run on a high-efficiency weekly cycle designed to preserve database performance with minimal storage footprint:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0c1620] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Phase 1: Ingestion</span>
            <h4 className="font-black text-white">Wednesday Prep</h4>
            <p className="text-[11px] text-slate-400">Fixtures mapped and indexed for ultra-fast device lookup.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0c1620] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Phase 2: Open Window</span>
            <h4 className="font-black text-white">Thursday Evening</h4>
            <p className="text-[11px] text-slate-400">Unlocked for fans to vote Win/Draw/Away per match (1 vote/device).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0c1620] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Phase 3: Results</span>
            <h4 className="font-black text-white">Sat & Sun Tally</h4>
            <p className="text-[11px] text-slate-400">Personal private score (e.g. /22) evaluated locally on user device.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0c1620] border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Phase 4: Speed Protection</span>
            <h4 className="font-black text-white">Weekly Auto-Purge</h4>
            <p className="text-[11px] text-slate-400">Tables cleared clean before next week to protect DB latency.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Psychological Privacy Guarantee:</strong> Zero gambling/money involved. User picks are kept client-side and never broadcasted to other fans, leaderboards, or servers.
          </span>
        </div>
      </div>

      {/* 5. Device Responses Audit Table */}
      <div className="p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Device Determinant Responses Log
            </h3>
            <p className="text-[11px] text-gray-400">
              Temporary table entries ({filteredVotes.length} records)
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search device ID or choice..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#141414] border border-[#2e2e2e] text-xs text-white placeholder:text-gray-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-xs text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        ) : filteredVotes.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No device responses matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono text-gray-400 uppercase border-b border-[#262626]">
                <tr>
                  <th className="py-2.5 px-3">Device UID</th>
                  <th className="py-2.5 px-3">Determinant Choice</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-mono">
                {filteredVotes.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-gray-300">
                      {row.deviceId.slice(0, 16)}...
                    </td>
                    <td className="py-2.5 px-3">
                      {row.vote === 'yes' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ThumbsUp className="w-3 h-3" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <ThumbsDown className="w-3 h-3" />
                          <span>No</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#1c1c1c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black uppercase tracking-wide text-white">
                Purge Temporary Feedback Table?
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              This will permanently delete all temporary Yes/No responses collected for the Match Predictor determinant poll. This action is immediate and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={isPurging}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                {isPurging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
