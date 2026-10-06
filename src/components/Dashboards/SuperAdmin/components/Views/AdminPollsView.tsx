import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Radio,
  ExternalLink,
  Flame,
  MousePointerClick,
  Eye,
} from 'lucide-react';
import { FeaturePollService, type FeaturePollStats } from '../../../../../services/featurePollService';
import { BroadcastService, getScheduledDelayMs, type BroadcastNotification } from '../../../../../services/broadcastService';
import { SendBroadcastModal } from '../../../../common/SendBroadcastModal';

interface AdminPollsViewProps {
  showToast: (msg: string) => void;
}

export const AdminPollsView: React.FC<AdminPollsViewProps> = ({ showToast }) => {
  const [stats, setStats] = useState<FeaturePollStats>({
    totalGuestVisits: 0,
    totalOddsOpens: 0,
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

  // Broadcast Realtime Notifications & Reactions State
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

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

  const fetchBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true);
    try {
      const data = await BroadcastService.getRecentBroadcasts();
      setBroadcasts(data);
    } catch (e) {
      console.warn('Error fetching broadcasts:', e);
    } finally {
      setLoadingBroadcasts(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchBroadcasts();

    const handleDispatched = (e: any) => {
      if (e?.detail) {
        setBroadcasts((prev) => [e.detail, ...prev.filter((n) => n.id !== e.detail.id)]);
      }
    };
    window.addEventListener('esn_broadcast_dispatched', handleDispatched);

    return () => {
      window.removeEventListener('esn_broadcast_dispatched', handleDispatched);
    };
  }, [fetchStats, fetchBroadcasts]);

  const broadcastMetrics = useMemo(() => {
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalFire = 0;
    let totalSoccer = 0;
    let totalTrophy = 0;
    let totalLike = 0;

    broadcasts.forEach((b) => {
      const r = b.reactions || { impressions: 0, clicks: 0, fire: 0, soccer: 0, trophy: 0, like: 0 };
      totalImpressions += r.impressions || 0;
      totalClicks += r.clicks || 0;
      totalFire += r.fire || 0;
      totalSoccer += r.soccer || 0;
      totalTrophy += r.trophy || 0;
      totalLike += r.like || 0;
    });

    return {
      totalDispatched: broadcasts.length,
      totalImpressions,
      totalClicks,
      totalFire,
      totalSoccer,
      totalTrophy,
      totalLike,
      totalReactions: totalFire + totalSoccer + totalTrophy + totalLike,
    };
  }, [broadcasts]);

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
    (v.vote && v.vote.toLowerCase().includes(searchTerm.toLowerCase()))
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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:brightness-110 text-white text-xs font-black transition-all shadow-md shadow-purple-900/40 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Schedule / Dispatch Broadcast (8:20 PM)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchBroadcasts();
            }}
            disabled={loading || loadingBroadcasts}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-gray-300 text-xs font-bold transition-colors cursor-pointer border border-[#383838]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingBroadcasts ? 'animate-spin text-emerald-400' : ''}`} />
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

      {/* 2. Determinant Metric Cards (Telemetry Funnel: Guest -> Odds -> Votes -> Verdict) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Guest Page Visitors */}
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider">Guest Page</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalGuestVisits}
          </div>
          <p className="text-[10px] text-gray-400">
            Opened guest homepage
          </p>
        </div>

        {/* Odds Page Opened */}
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-amber-400">Odds Opened</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.totalOddsOpens}
          </div>
          <p className="text-[10px] text-gray-400">
            Clicked odds button / modal
          </p>
        </div>

        {/* Total Votes Cast */}
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-emerald-400">Total Voted</span>
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalVotes}
          </div>
          <p className="text-[10px] text-gray-400">
            Cast 1-device vote
          </p>
        </div>

        {/* Yes / In Favor */}
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-emerald-400">Yes (In Favor)</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {stats.yesCount}
            </span>
            <span className="text-xs font-bold text-emerald-500">
              ({stats.yesPercentage}%)
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            Supporting feature rollout
          </p>
        </div>

        {/* No / Opposed */}
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-bold uppercase tracking-wider text-rose-400">No (Opposed)</span>
            <ThumbsDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {stats.noCount}
            </span>
            <span className="text-xs font-bold text-rose-500">
              ({stats.noPercentage}%)
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            Prefer not having feature
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

      {/* 4. Real-Time Rich Broadcast Dropdown Alerts & Community Reactions Telemetry */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#181524] to-[#121118] border border-purple-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Real-Time In-App Dropdown Broadcasts & Live Reactions
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
                REALTIME SYNC
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Native alert dropdown telemetry sliding across all active devices in real-time
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer self-start sm:self-auto"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Schedule / Send Broadcast</span>
          </button>
        </div>

        {/* Broadcast Analytics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#1d1a2b] border border-purple-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider">Dispatched Alerts</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {broadcastMetrics.totalDispatched}
            </div>
            <p className="text-[10px] text-zinc-400">Sent across all devices</p>
          </div>

          <div className="p-4 rounded-xl bg-[#1d1a2b] border border-purple-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider">Device Impressions</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono">
              {broadcastMetrics.totalImpressions}
            </div>
            <p className="text-[10px] text-zinc-400">Dropdowns displayed on screens</p>
          </div>

          <div className="p-4 rounded-xl bg-[#1d1a2b] border border-purple-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider">Banter / Pick Clicks</span>
              <MousePointerClick className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {broadcastMetrics.totalClicks}
            </div>
            <p className="text-[10px] text-zinc-400">Clicks opening destination page</p>
          </div>

          <div className="p-4 rounded-xl bg-[#1d1a2b] border border-purple-500/20 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider">Total Reactions</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {broadcastMetrics.totalReactions}
            </div>
            <p className="text-[10px] text-zinc-400">Interactive emoji engagements</p>
          </div>
        </div>

        {/* Reaction Breakdown Pills */}
        <div className="p-4 rounded-xl bg-[#151320] border border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Live Emoji Sentiment Breakdown:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <span>🔥 Fire / Hype:</span>
              <span className="font-mono font-black">{broadcastMetrics.totalFire}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <span>⚽ Derby / Goals:</span>
              <span className="font-mono font-black">{broadcastMetrics.totalSoccer}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <span>🏆 Prediction Win:</span>
              <span className="font-mono font-black">{broadcastMetrics.totalTrophy}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
              <span>👍 Like / Approved:</span>
              <span className="font-mono font-black">{broadcastMetrics.totalLike}</span>
            </div>
          </div>
        </div>

        {/* Broadcasts Feed / History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Recent Dispatched Broadcasts ({broadcasts.length})</span>
            {loadingBroadcasts && <span className="text-purple-400 text-[10px]">Syncing realtime...</span>}
          </div>

          {broadcasts.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
              <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No rich broadcasts dispatched yet this session.</p>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
              >
                Dispatch the Egerton Derby Rich Notification now →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-purple-500/25 hover:border-purple-400/50 transition-all space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider">
                        {b.category || 'DERBY'}
                      </span>
                      {b.scheduled_for && (
                        getScheduledDelayMs(b.scheduled_for) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9.5px] font-mono font-bold flex items-center gap-1">
                            ⏰ Scheduled {new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-mono font-bold flex items-center gap-1">
                            ✅ Delivered {new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        BroadcastService.sendBroadcast({
                          title: b.title,
                          message: b.message,
                          image_url: b.image_url || undefined,
                          category: b.category,
                          action_url: b.action_url || '#/banter',
                        });
                        showToast('Re-broadcasted notification to all devices!');
                      }}
                      className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Re-broadcast alert"
                    >
                      Re-send
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white leading-tight">{b.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 whitespace-pre-line leading-relaxed font-sans">
                      {b.message}
                    </p>
                  </div>

                  {b.image_url && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 relative">
                      <img
                        src={b.image_url}
                        alt={b.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as any).src = '/derby-notification.png';
                        }}
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-sm bg-black/70 text-[9px] text-purple-300 font-mono">
                        Rich Media
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-amber-400">
                        🔥 {b.reactions?.fire || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-emerald-400">
                        ⚽ {b.reactions?.soccer || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-purple-400">
                        🏆 {b.reactions?.trophy || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-blue-400">
                        👍 {b.reactions?.like || 0}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                        🖱️ {b.reactions?.clicks || 0} clicks
                      </span>
                    </div>

                    <a
                      href={b.action_url || '#/banter'}
                      className="text-purple-400 hover:text-purple-300 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>Route</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Weekly Fixtures Match Predictor Blueprint & Architecture Status */}
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
                  <th className="py-2.5 px-3 text-center">Guest Page</th>
                  <th className="py-2.5 px-3 text-center">Odds Page</th>
                  <th className="py-2.5 px-3 text-center">Voted</th>
                  <th className="py-2.5 px-3">Vote Choice</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] font-mono">
                {filteredVotes.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-gray-300">
                      {row.deviceId.slice(0, 16)}...
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.openedGuestPage ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          true
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.openedOddsPage ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          true
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.voted ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          true
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.vote === 'yes' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ThumbsUp className="w-3 h-3" />
                          <span>Yes</span>
                        </span>
                      ) : row.vote === 'no' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <ThumbsDown className="w-3 h-3" />
                          <span>No</span>
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[10px]">No vote yet</span>
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

      {/* 7. Real-Time Rich Broadcast Dispatcher Modal */}
      <SendBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          fetchBroadcasts();
        }}
      />
    </div>
  );
};
