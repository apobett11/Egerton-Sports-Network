import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Users,
  Clock,
  Shield,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { banterService } from '../../services/predictions/banterService';
import type { JournalistAnalytics } from '../../types/predictions';

interface JournalistBanterAnalyticsProps {
  onSelectTeam?: (teamId: string, teamName: string) => void;
}

export const JournalistBanterAnalytics: React.FC<JournalistBanterAnalyticsProps> = ({
  onSelectTeam
}) => {
  const [analytics, setAnalytics] = useState<JournalistAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await banterService.fetchJournalistAnalytics();
      setAnalytics(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to load journalist analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Find peak hour from 24h distribution
  const peakHour = analytics?.hourly_distribution_24h && analytics.hourly_distribution_24h.length > 0
    ? [...analytics.hourly_distribution_24h].sort((a, b) => b.post_count - a.post_count)[0]
    : null;

  // Max count for scaling the 24h bar chart
  const maxHourlyCount = Math.max(
    1,
    ...(analytics?.hourly_distribution_24h?.map((h: { post_count: number }) => h.post_count) || [1])
  );

  // Max count for scaling the team leaderboard
  const maxTeamTags = Math.max(
    1,
    ...(analytics?.top_tagged_teams?.map((t: { tag_count: number }) => t.tag_count) || [1])
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 space-y-6 text-white font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-black p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-md">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Journalist Discourse Analytics
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-400 border border-sky-500/40">
                  <Zap className="h-3 w-3" /> ZERO-EGRESS RPC
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Real-time sentiment, team mentions, and campus engagement telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                Synced at {lastRefreshed}
              </span>
            )}
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* Egress Defense Pill */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-400 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800/80 w-fit">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Aggregations executed in PostgreSQL (<code className="text-sky-300 font-mono">get_journalist_banter_analytics()</code>) ~0.8KB payload</span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Root Takes (7d)</span>
            <MessageSquare className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {isLoading ? '...' : analytics?.total_posts_7d ?? 0}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Campus original hot takes</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Thread Replies (7d)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {isLoading ? '...' : analytics?.total_replies_7d ?? 0}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Deep discussion volume</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Active Devices (7d)</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300">
            {isLoading ? '...' : analytics?.active_devices_7d ?? 0}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Unique student phones</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Peak Hour (24h)</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">
            {isLoading ? '...' : peakHour ? `${String(peakHour.hour_of_day).padStart(2, '0')}:00` : '18:00'}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Highest campus chatter</span>
        </div>
      </div>

      {/* Main Grid: Most Tagged Teams Leaderboard & 24h Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Tagged Teams Leaderboard */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Most Tagged Teams (7d)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Trending Discourse
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
              <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
              <div className="h-10 bg-zinc-900 rounded-xl animate-pulse" />
            </div>
          ) : !analytics?.top_tagged_teams || analytics.top_tagged_teams.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No campus team tags recorded in the last 7 days.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.top_tagged_teams.map((item: { tagged_team_id: string; tagged_team_name: string; tag_count: number }, index: number) => {
                const pct = Math.round((item.tag_count / maxTeamTags) * 100);
                return (
                  <div
                    key={item.tagged_team_id || index}
                    onClick={() => onSelectTeam && onSelectTeam(item.tagged_team_id, item.tagged_team_name)}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md font-black text-[10px] ${
                          index === 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : index === 1
                            ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30'
                            : index === 2
                            ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                          @{item.tagged_team_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-zinc-400">
                        <span className="font-bold text-white">{item.tag_count}</span>
                        <span className="text-[10px] text-zinc-500">tags</span>
                        <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-sky-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 24-Hour Discourse Heatmap & Peak Hours */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                24-Hour Peak Engagement
              </h2>
            </div>
            {peakHour && (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Peak: {String(peakHour.hour_of_day).padStart(2, '0')}:00 EAT
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-44 bg-zinc-900 rounded-xl animate-pulse" />
          ) : (
            <div>
              {/* Visual Bar Distribution Chart */}
              <div className="h-36 flex items-end gap-1 pt-4 pb-1 border-b border-zinc-800/80">
                {Array.from({ length: 24 }).map((_, h) => {
                  const entry = analytics?.hourly_distribution_24h?.find((e: { hour_of_day: number; post_count: number }) => e.hour_of_day === h);
                  const count = entry ? entry.post_count : 0;
                  const heightPct = Math.round((count / maxHourlyCount) * 100);
                  const isPeak = peakHour && peakHour.hour_of_day === h;

                  return (
                    <div
                      key={h}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-white whitespace-nowrap z-20 shadow-md">
                        {String(h).padStart(2, '0')}:00 · {count} posts
                      </div>

                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPeak
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : count > 0
                            ? 'bg-sky-500/70 hover:bg-sky-400'
                            : 'bg-zinc-800/40'
                        }`}
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Hour Labels */}
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>

              <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
                Campus posting frequency surges around match kickoffs and post-whistle debate hours. Use these windows for journalistic scoops and poll drops.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
