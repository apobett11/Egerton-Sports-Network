import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  Trophy,
  Vote,
  Users,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Copy,
  Check,
  Share2,
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import {
  getAdminAuditVotes,
  getWeeklyCycleStatus,
  buildMondayMysteryTeaser,
  buildMondayMysteryTeaserUrl,
  EPL_COMP_ID,
  CHAMP_COMP_ID,
} from '../../../../../services/potwService';
import type { PotwCandidate, AdminAuditResult } from '../../../../../types/potw';
import { useToast } from '../../../../../contexts/ToastContext';

interface AdminPotwAuditViewProps {
  showToast?: (message: string, options?: any) => void;
}

export const AdminPotwAuditView: React.FC<AdminPotwAuditViewProps> = ({ showToast: externalShowToast }) => {
  const { showSuccess, showError, showInfo } = useToast();

  const notifySuccess = useCallback((msg: string) => {
    if (externalShowToast) externalShowToast(msg, { type: 'success' });
    else showSuccess(msg);
  }, [externalShowToast, showSuccess]);

  const notifyError = useCallback((msg: string) => {
    if (externalShowToast) externalShowToast(msg, { type: 'error' });
    else showError(msg);
  }, [externalShowToast, showError]);

  const notifyInfo = useCallback((msg: string) => {
    if (externalShowToast) externalShowToast(msg, { type: 'info' });
    else showInfo(msg);
  }, [externalShowToast, showInfo]);

  // Filters
  const [selectedCompId, setSelectedCompId] = useState<string>(EPL_COMP_ID);
  const [matchweek, setMatchweek] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'votes' | 'name' | 'team'>('votes');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [auditData, setAuditData] = useState<AdminAuditResult>({
    candidates: [],
    totalVotes: 0,
    totalCandidates: 0,
    page: 1,
    pageSize: 8,
    totalPages: 1,
  });

  // Action states
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [copiedTeaser, setCopiedTeaser] = useState<boolean>(false);

  // Cycle Status
  const [cycleStatus, setCycleStatus] = useState(getWeeklyCycleStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleStatus(getWeeklyCycleStatus(matchweek));
    }, 1000);
    return () => clearInterval(timer);
  }, [matchweek]);

  // Format countdown string
  const formattedCountdown = useMemo(() => {
    const sec = cycleStatus.timeRemainingSeconds;
    if (sec <= 0) return 'Window Closed';
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [cycleStatus.timeRemainingSeconds]);

  // Load Admin Audit Votes
  const loadAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminAuditVotes(selectedCompId, matchweek, {
        page: currentPage,
        pageSize,
        sortBy,
        sortDir,
        searchQuery,
      });
      setAuditData(result);
    } catch (err: any) {
      notifyError('Failed to fetch POTW audit records: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }, [selectedCompId, matchweek, currentPage, pageSize, sortBy, sortDir, searchQuery, notifyError]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Leading candidate
  const leadingCandidate = useMemo(() => {
    if (auditData.candidates.length === 0) return null;
    return [...auditData.candidates].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))[0];
  }, [auditData.candidates]);

  const competitionName = selectedCompId === EPL_COMP_ID ? 'Egerton Premier League' : 'Egerton Championship';
  const leadingTeamName = leadingCandidate?.team_name || 'Leading Campus Team';

  const teaserText = useMemo(() => {
    return buildMondayMysteryTeaser(leadingTeamName, competitionName);
  }, [leadingTeamName, competitionName]);

  const handleCopyTeaser = () => {
    navigator.clipboard.writeText(teaserText);
    setCopiedTeaser(true);
    notifySuccess('Monday Mystery Teaser copied to clipboard!');
    setTimeout(() => setCopiedTeaser(false), 2500);
  };

  const handleShareTeaserWhatsApp = () => {
    const url = buildMondayMysteryTeaserUrl(leadingTeamName, competitionName);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Manual Trigger: Tuesday Finalization RPC
  const handleTriggerFinalize = async () => {
    if (!window.confirm(`Are you sure you want to finalize Player of the Week for ${competitionName} Matchweek ${matchweek}?`)) {
      return;
    }

    setIsFinalizing(true);
    try {
      const { data, error } = await supabase.rpc('fn_finalize_potw_winners', {
        p_matchweek: matchweek,
        p_competition_id: selectedCompId,
      });

      if (error) {
        notifyError('Finalization error: ' + error.message);
      } else if (data?.success) {
        notifySuccess(`🎉 Winner officially crowned for Matchweek ${matchweek}!`);
        loadAuditData();
      } else {
        notifyInfo(data?.message || 'Finalization completed with note.');
      }
    } catch (err: any) {
      notifyError('Error triggering finalization: ' + (err?.message || ''));
    } finally {
      setIsFinalizing(false);
    }
  };

  // Manual Trigger: Friday Purge/Reset RPC
  const handleTriggerPurge = async () => {
    if (!window.confirm('⚠️ WARNING: This will reset transient nominations and votes for the new weekly cycle. Crowned historical winners are strictly preserved. Proceed?')) {
      return;
    }

    setIsPurging(true);
    try {
      const { data, error } = await supabase.rpc('purge_potw_weekly_cycle');

      if (error) {
        notifyError('Purge error: ' + error.message);
      } else if (data?.success) {
        notifySuccess(`Cycle reset! Purged ${data.purged_votes} votes and ${data.purged_nominations} nominations.`);
        loadAuditData();
      } else {
        notifyInfo('Weekly reset executed.');
      }
    } catch (err: any) {
      notifyError('Error triggering weekly purge: ' + (err?.message || ''));
    } finally {
      setIsPurging(false);
    }
  };

  const toggleSort = (col: 'votes' | 'name' | 'team') => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir(col === 'votes' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none">
      {/* 1. HEADER & LEAGUE SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
              Player of the Week (POTW) Audit Portal
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            SuperAdmin unvarnished vote audit, fraud telemetry, Monday mystery teasers, and lifecycle overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* League Filter Toggle */}
          <div className="bg-[#121212] p-1 rounded-xl border border-[#2A2A2A] flex items-center">
            <button
              type="button"
              onClick={() => {
                setSelectedCompId(EPL_COMP_ID);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCompId === EPL_COMP_ID
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Premier League
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCompId(CHAMP_COMP_ID);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCompId === CHAMP_COMP_ID
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Championship
            </button>
          </div>

          {/* Matchweek Selector */}
          <div className="flex items-center gap-1.5 bg-[#121212] px-3 py-1.5 rounded-xl border border-[#2A2A2A] text-xs font-semibold text-gray-300">
            <span>Matchweek:</span>
            <select
              value={matchweek}
              onChange={(e) => {
                setMatchweek(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-white outline-none cursor-pointer"
            >
              {Array.from({ length: 38 }, (_, i) => i + 1).map((mw) => (
                <option key={mw} value={mw} className="bg-[#181818] text-white">
                  Week {mw}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadAuditData}
            className="p-2 bg-[#252525] hover:bg-[#303030] text-gray-300 hover:text-white rounded-xl border border-[#2A2A2A] transition-colors cursor-pointer"
            title="Refresh Audit Tallies"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KEY AUDIT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Votes Cast */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Raw Votes Cast</span>
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-2">
            {auditData.totalVotes}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Unrestricted Admin Reading</span>
          </div>
        </div>

        {/* Metric 2: Total Nominees */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Ballot Candidates</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-2">
            {auditData.totalCandidates}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Condensed by player UID
          </div>
        </div>

        {/* Metric 3: Leading Candidate */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Current Frontrunner</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white truncate mt-2">
            {leadingCandidate ? leadingCandidate.player_name : 'No Votes Yet'}
          </div>
          <div className="text-[11px] text-amber-400/90 font-medium truncate mt-1">
            {leadingCandidate
              ? `${leadingCandidate.team_name} (${leadingCandidate.votes_count || 0} votes • ${leadingCandidate.vote_share_percentage || 0}%)`
              : 'Awaiting ballot activity'}
          </div>
        </div>

        {/* Metric 4: Voting Cycle Window */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Voting Closes In</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {formattedCountdown}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {cycleStatus.isVotingOpen ? 'Voting Open (Deadline Tue 5PM)' : 'Voting Closed / Awarded'}
          </div>
        </div>
      </div>

      {/* 3. MONDAY MYSTERY TEASER GENERATOR CARD */}
      <div className="bg-gradient-to-br from-[#181818] via-[#1a1f18] to-[#181818] border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monday WhatsApp Mystery Teaser
              </h3>
              <p className="text-xs text-gray-400">
                Reveals the leading team while concealing the player identity to build campus voting suspense.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTeaser}
              className="px-3.5 py-2 bg-[#252525] hover:bg-[#303030] text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedTeaser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTeaser ? 'Copied!' : 'Copy Teaser'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareTeaserWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Broadcast on WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-[#101712] border border-emerald-500/20 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
          {teaserText}
        </div>
      </div>

      {/* 4. LIFECYCLE CONTROLS & MANUAL OVERRIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tuesday Finalization Trigger */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Tuesday 5:00 PM Finalization</span>
            </div>
            <h4 className="text-sm font-bold text-white">Crown Player of the Week Winner</h4>
            <p className="text-xs text-gray-400">
              Executes stored procedure <code className="text-amber-300">fn_finalize_potw_winners</code> to calculate decisive vote share and award the official crown.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerFinalize}
            disabled={isFinalizing}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{isFinalizing ? 'Finalizing Winner...' : `Execute Tuesday Finalization (Week ${matchweek})`}</span>
          </button>
        </div>

        {/* Friday 11:00 AM Reset Routine */}
        <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>Friday 11:00 AM Reset Routine</span>
            </div>
            <h4 className="text-sm font-bold text-white">Purge Cycle Transient Tables</h4>
            <p className="text-xs text-gray-400">
              Executes <code className="text-rose-300">purge_potw_weekly_cycle</code> to clear transient MOTM nominations and votes. All historical winners are strictly preserved.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerPurge}
            disabled={isPurging}
            className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isPurging ? 'Purging Transient Records...' : 'Execute Friday Table Reset'}</span>
          </button>
        </div>
      </div>

      {/* 5. UNVARNISHED VOTE TALLIES TABLE & PAGINATION */}
      <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Unvarnished Candidate Vote Tallies
            </h3>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate or team..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[10px] font-black text-gray-400 uppercase tracking-wider bg-[#121212]">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Candidate Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('team')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Team / Position</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Weekend Match Highlight</th>
                <th
                  onClick={() => toggleSort('votes')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Raw Votes</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Vote Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading unvarnished audit votes...
                  </td>
                </tr>
              ) : auditData.candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No candidates or votes recorded for Matchweek {matchweek}.
                  </td>
                </tr>
              ) : (
                auditData.candidates.map((candidate, idx) => {
                  const rank = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={candidate.player_id} className="hover:bg-[#202020] transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-gray-400">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{candidate.player_name}</span>
                          {candidate.jersey_number !== undefined && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              #{candidate.jersey_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div>{candidate.team_name}</div>
                        {candidate.position && (
                          <div className="text-[10px] text-gray-500">{candidate.position}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 max-w-xs truncate">
                        {candidate.match_details}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-400 text-sm">
                        {candidate.votes_count || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-300">
                        {candidate.vote_share_percentage || 0}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A] text-xs text-gray-400">
          <div>
            Showing Page <span className="font-bold text-white">{auditData.page}</span> of{' '}
            <span className="font-bold text-white">{auditData.totalPages}</span> ({auditData.totalCandidates} total candidates)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentPage >= auditData.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(auditData.totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
