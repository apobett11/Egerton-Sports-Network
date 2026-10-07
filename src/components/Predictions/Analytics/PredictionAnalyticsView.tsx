import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCw,
  Crown,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  PieChart as PieIcon,
  Flame,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { Match, ConsensusData, Team } from '../../../types/predictions';
import { showVotesForConsensus } from '../../../lib/predictions/voteDisplay.mjs';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import { fanAnalyticsService, type TeamFanAnalytics } from '../../../services/predictions/fanAnalyticsService';

interface PredictionAnalyticsViewProps {
  matches: Match[];
  consensusMap: Map<string, ConsensusData>;
  availableTeams: Team[];
  favouriteTeam?: string | null;
  onRefreshData?: () => Promise<void>;
}

const PIE_COLORS = [
  '#ff0046',
  '#00b04f',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#10b981',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#84cc16',
];

export const PredictionAnalyticsView: React.FC<PredictionAnalyticsViewProps> = ({
  matches,
  consensusMap,
  availableTeams,
  favouriteTeam,
  onRefreshData,
}) => {
  const [teamAnalytics, setTeamAnalytics] = useState<TeamFanAnalytics[]>([]);
  const [isLoadingFans, setIsLoadingFans] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(() => new Date());
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);

  // Load fan popularity data
  const loadFanData = useCallback(async () => {
    setIsLoadingFans(true);
    try {
      const data = await fanAnalyticsService.getTeamFanPopularity(availableTeams);
      setTeamAnalytics(data);
      if (!selectedTeamName && data.length > 0) {
        // Default selection: user's favourite team if set, else top-ranked team
        if (favouriteTeam) {
          const matchFav = data.find((t) => t.teamName.toLowerCase() === favouriteTeam.toLowerCase());
          setSelectedTeamName(matchFav ? matchFav.teamName : data[0].teamName);
        } else {
          setSelectedTeamName(data[0].teamName);
        }
      }
    } finally {
      setIsLoadingFans(false);
    }
  }, [availableTeams, favouriteTeam, selectedTeamName]);

  useEffect(() => {
    void loadFanData();
  }, [loadFanData]);

  // Dedicated refresh handler: refreshes only this analytics page without reloading the guest page
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      await loadFanData();
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const [copiedShare, setCopiedShare] = useState(false);
  const handleSharePage = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/analytics`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EgerScore — Predictions & Fan Analytics',
          text: 'Check out the live match popularity index and campus club fan standings!',
          url: shareUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {}
  };

  // Selected team object
  const currentSelectedTeam = useMemo(() => {
    if (!selectedTeamName && teamAnalytics.length > 0) return teamAnalytics[0];
    return teamAnalytics.find((t) => t.teamName.toLowerCase() === selectedTeamName?.toLowerCase()) || teamAnalytics[0];
  }, [teamAnalytics, selectedTeamName]);

  // Match of the selected team in the current slate (if any)
  const selectedTeamMatch = useMemo(() => {
    if (!currentSelectedTeam) return null;
    return matches.find(
      (m) =>
        m.homeTeam.name.toLowerCase() === currentSelectedTeam.teamName.toLowerCase() ||
        m.awayTeam.name.toLowerCase() === currentSelectedTeam.teamName.toLowerCase()
    );
  }, [matches, currentSelectedTeam]);

  // Bar chart data
  const barChartData = useMemo(() => {
    return teamAnalytics.map((t) => ({
      name: t.shortName,
      fullName: t.teamName,
      shownFans: t.shownFans,
      actualFans: t.actualFans,
      sharePct: t.sharePct,
    }));
  }, [teamAnalytics]);

  // Pie chart data (Top 6 + Others)
  const pieChartData = useMemo(() => {
    if (teamAnalytics.length <= 6) {
      return teamAnalytics.map((t) => ({
        name: t.teamName,
        value: t.shownFans,
        shortName: t.shortName,
      }));
    }
    const top5 = teamAnalytics.slice(0, 5).map((t) => ({
      name: t.teamName,
      value: t.shownFans,
      shortName: t.shortName,
    }));
    const othersValue = teamAnalytics.slice(5).reduce((sum, t) => sum + t.shownFans, 0);
    return [
      ...top5,
      {
        name: 'Other Clubs',
        value: othersValue,
        shortName: 'OTH',
      },
    ];
  }, [teamAnalytics]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Header & Page Refresh Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1a2e45] bg-gradient-to-r from-[#0a1624] via-[#0e1c2b] to-[#122238] p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff0046] text-white shadow-md">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              Predictions & Fan Analytics
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time match popularity index, crowd voting distributions, and fan favourite standings.
          </p>
        </div>

        {/* Local Page Refresh and Share Toolbar */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={handleSharePage}
            className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-[#14263b] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-200 hover:border-[#ff0046] hover:bg-[#1a3452] hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            title="Share this analytics page"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-[#ff0046]" />
                <span>Share</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#14263b] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-slate-200 hover:border-[#00b04f] hover:bg-[#1a3452] hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
            title="Refresh analytics data"
          >
            <RotateCw className={`h-3.5 w-3.5 text-[#00b04f] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MATCHES POPULARITY (CARDS MATCHING PREDICTIONS PAGE) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#ff0046]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Match Popularity Index
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {matches.length} Fixtures Listed
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-[#1a2e45] bg-[#0e1c2b] p-6 text-center text-sm text-slate-400">
            No match popularity data available for this slate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {matches.map((match) => {
              const consensus = consensusMap.get(match.id);
              const showVotes = showVotesForConsensus(
                consensus,
                match.id,
                null,
                Boolean(match.isDerby)
              );

              return (
                <div
                  key={match.id}
                  className={`relative rounded-xl p-3 sm:p-4 font-sans transition-all ${
                    match.isDerby
                      ? 'border-2 border-amber-400/90 bg-gradient-to-r from-[#201405] via-[#0e1c2b] to-[#0c1827] shadow-[0_0_25px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/40 hover:border-amber-300'
                      : 'border border-[#1a2e45] bg-[#0e1c2b] shadow-md hover:border-[#2a4565]'
                  }`}
                >
                  {/* Top Bar: Derby / Regular Badge & Kickoff */}
                  <div
                    className={`flex items-center justify-between pb-2 text-[10px] sm:text-[11px] font-medium border-b ${
                      match.isDerby
                        ? 'border-amber-500/25 text-amber-200'
                        : 'border-[#14263b] text-slate-400'
                    }`}
                  >
                    <span
                      className={`flex items-center gap-1.5 uppercase tracking-wider font-extrabold ${
                        match.isDerby ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {match.isDerby ? (
                        <>
                          <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] sm:text-[11px] font-black tracking-widest bg-gradient-to-r from-amber-300 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                            DERBY MATCH
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff0046]" />
                          <span>Matchday {match.matchday}</span>
                        </>
                      )}
                    </span>

                    <span className="font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatKickoffTime(match.scheduledTime)}
                    </span>
                  </div>

                  {/* Teams Row */}
                  <div className="my-3 grid grid-cols-7 items-center gap-1.5 sm:gap-2">
                    {/* Home Team */}
                    <div className="col-span-3 flex flex-col items-center text-center min-w-0">
                      <div
                        className={`relative mb-1.5 h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full border ${
                          match.isDerby
                            ? 'border-amber-400/80 bg-[#160d03]'
                            : 'border-slate-700/60 bg-[#081018]'
                        } p-0.5 shadow-sm`}
                      >
                        {match.homeTeam.logoUrl ? (
                          <img
                            src={match.homeTeam.logoUrl}
                            alt={match.homeTeam.name}
                            className="h-full w-full object-cover rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <Shield className="h-full w-full text-slate-500" />
                        )}
                      </div>
                      <span
                        className="text-xs sm:text-sm font-black tracking-tight text-white truncate max-w-full leading-tight"
                        title={match.homeTeam.name}
                      >
                        {formatTeamName(match.homeTeam.name)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Home
                      </span>
                    </div>

                    {/* VS */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-500">
                        VS
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[65px] text-center">
                        {match.venue.split('—')[0].trim()}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="col-span-3 flex flex-col items-center text-center min-w-0">
                      <div
                        className={`relative mb-1.5 h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full border ${
                          match.isDerby
                            ? 'border-amber-400/80 bg-[#160d03]'
                            : 'border-slate-700/60 bg-[#081018]'
                        } p-0.5 shadow-sm`}
                      >
                        {match.awayTeam.logoUrl ? (
                          <img
                            src={match.awayTeam.logoUrl}
                            alt={match.awayTeam.name}
                            className="h-full w-full object-cover rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <Shield className="h-full w-full text-slate-500" />
                        )}
                      </div>
                      <span
                        className="text-xs sm:text-sm font-black tracking-tight text-white truncate max-w-full leading-tight"
                        title={match.awayTeam.name}
                      >
                        {formatTeamName(match.awayTeam.name)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Away
                      </span>
                    </div>
                  </div>

                  {/* Votes Popularity Breakdown */}
                  <div className="mt-2 rounded-lg bg-[#081018]/90 p-2.5 border border-[#16283d]">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      <span className="text-slate-300">Votes</span>
                      <span className="text-slate-400 font-normal">
                        {showVotes.total.toLocaleString()} total votes
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
                      {/* Home */}
                      <div className="flex flex-col">
                        <span className="text-[#00b04f]">
                          {showVotes.homeVotes.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {showVotes.homePct}% Home
                        </span>
                        <div className="w-full bg-[#16283d] h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#00b04f] h-full rounded-full transition-all duration-500"
                            style={{ width: `${showVotes.homePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Draw */}
                      <div className="flex flex-col">
                        <span className="text-[#ff9800]">
                          {showVotes.drawVotes.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {showVotes.drawPct}% Draw
                        </span>
                        <div className="w-full bg-[#16283d] h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#ff9800] h-full rounded-full transition-all duration-500"
                            style={{ width: `${showVotes.drawPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Away */}
                      <div className="flex flex-col">
                        <span className="text-[#ff0046]">
                          {showVotes.awayVotes.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {showVotes.awayPct}% Away
                        </span>
                        <div className="w-full bg-[#16283d] h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#ff0046] h-full rounded-full transition-all duration-500"
                            style={{ width: `${showVotes.awayPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: TEAMS POPULARITY BY FANS FAVOURITES TABLE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#ff0046]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Most Popular Teams by Fans Favourites
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Verified Campus Fanbase
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1a2e45] bg-[#0e1c2b] shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#16283d] bg-[#081018] text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Rank</th>
                <th className="px-3 py-2.5">Team</th>
                <th className="px-3 py-2.5 text-right">Club Fans</th>
                <th className="px-3 py-2.5 text-right">Fan Share (%)</th>
                <th className="px-3 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16283d] text-slate-200">
              {isLoadingFans ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading fan popularity rankings...
                  </td>
                </tr>
              ) : teamAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No fan data available.
                  </td>
                </tr>
              ) : (
                teamAnalytics.map((team) => {
                  const isSelected =
                    currentSelectedTeam?.teamName.toLowerCase() === team.teamName.toLowerCase();

                  return (
                    <tr
                      key={team.teamId || team.teamName}
                      onClick={() => setSelectedTeamName(team.teamName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#ff0046]/15 hover:bg-[#ff0046]/20 ring-1 ring-[#ff0046]/40'
                          : 'hover:bg-[#14263b]/70'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-mono font-bold">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            team.rank === 1
                              ? 'bg-amber-500/20 text-amber-300 font-black'
                              : team.rank === 2
                              ? 'bg-slate-300/20 text-slate-200 font-bold'
                              : team.rank === 3
                              ? 'bg-amber-700/20 text-amber-500 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          #{team.rank}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                            {team.logoUrl ? (
                              <img
                                src={team.logoUrl}
                                alt={team.teamName}
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              <Shield className="h-full w-full text-slate-500 p-0.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {team.teamName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {team.shortName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-black text-[#00b04f]">
                        {team.shownFans.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono">
                          <span className="font-bold text-white">{team.sharePct}%</span>
                          <div className="w-12 bg-[#16283d] h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="bg-[#ff0046] h-full rounded-full"
                              style={{ width: `${team.sharePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeamName(team.teamName);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff0046] text-white shadow-xs'
                              : 'bg-[#14263b] text-slate-300 hover:text-white hover:bg-[#1b3450]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Analyze'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE SELECTION, GRAPHS & PIE CHARTS */}
      {currentSelectedTeam && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp className="h-4 w-4 text-[#ff0046]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Team Analytics & Popularity Breakdown
            </h2>
          </div>

          {/* Selected Team Spotlight Overview Card */}
          <div className="rounded-xl border border-slate-700/80 bg-gradient-to-r from-[#0e1c2b] via-[#122438] to-[#0a1624] p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[#081018] border-2 border-[#ff0046]/80 p-1 overflow-hidden shrink-0 shadow-md">
                  {currentSelectedTeam.logoUrl ? (
                    <img
                      src={currentSelectedTeam.logoUrl}
                      alt={currentSelectedTeam.teamName}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <Shield className="h-full w-full text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-[#ff0046]/20 text-[#ff0046] px-2 py-0.5 rounded-full border border-[#ff0046]/30">
                      Rank #{currentSelectedTeam.rank}
                    </span>
                    {favouriteTeam?.toLowerCase() === currentSelectedTeam.teamName.toLowerCase() && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Your Club
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {currentSelectedTeam.teamName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentSelectedTeam.sharePct}% crowd fan share • Campus Popularity Index
                  </p>
                </div>
              </div>

              {/* Stats Pills */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-lg bg-[#081018] border border-[#16283d] p-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Fans
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#00b04f]">
                    {currentSelectedTeam.shownFans.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg bg-[#081018] border border-[#16283d] p-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Campus Fan Share
                  </span>
                  <span className="text-sm sm:text-base font-black text-white">
                    {currentSelectedTeam.sharePct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Team Slate Match Consensus Preview */}
            {selectedTeamMatch && (
              <div className="mt-3 pt-3 border-t border-[#1a2e45] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-300">
                  <strong className="text-white">Upcoming Slate Match:</strong>{' '}
                  {selectedTeamMatch.isDerby ? '👑 ' : ''}
                  {formatTeamName(selectedTeamMatch.homeTeam.name)} vs{' '}
                  {formatTeamName(selectedTeamMatch.awayTeam.name)}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formatKickoffTime(selectedTeamMatch.scheduledTime)} • {selectedTeamMatch.venue}
                </span>
              </div>
            )}
          </div>

          {/* Side-by-side Visualizations: Bar Graph and Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Bar Chart: Fan Popularity Comparison */}
            <div className="rounded-xl border border-[#1a2e45] bg-[#0e1c2b] p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-[#ff0046]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Fan Popularity Comparison
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Tap bar to select
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-700 bg-[#081018] p-2.5 text-xs text-white shadow-xl">
                              <p className="font-black text-white">{data.fullName}</p>
                              <p className="text-[#00b04f] font-mono mt-0.5">
                                Votes: {data.shownFans.toLocaleString()} ({data.sharePct}% share)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="shownFans"
                      radius={[4, 4, 0, 0]}
                      onClick={(entry: any) => {
                        if (entry?.fullName) setSelectedTeamName(entry.fullName);
                      }}
                      className="cursor-pointer"
                    >
                      {barChartData.map((entry) => {
                        const isMatch =
                          currentSelectedTeam?.teamName.toLowerCase() ===
                          entry.fullName.toLowerCase();
                        return (
                          <Cell
                            key={`bar-${entry.name}`}
                            fill={isMatch ? '#ff0046' : '#1e3a5f'}
                            stroke={isMatch ? '#ff5480' : 'transparent'}
                            strokeWidth={isMatch ? 1.5 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Pie Chart: Fanbase Distribution Share */}
            <div className="rounded-xl border border-[#1a2e45] bg-[#0e1c2b] p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <PieIcon className="h-4 w-4 text-[#ff0046]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Fanbase Distribution Share
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Club percentage share
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      onClick={(entry: any) => {
                        if (entry?.name && entry.name !== 'Other Clubs') {
                          setSelectedTeamName(entry.name);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {pieChartData.map((entry, index) => {
                        const isMatch =
                          currentSelectedTeam?.teamName.toLowerCase() ===
                          entry.name.toLowerCase();
                        return (
                          <Cell
                            key={`pie-${entry.name}`}
                            fill={isMatch ? '#ff0046' : PIE_COLORS[index % PIE_COLORS.length]}
                            stroke={isMatch ? '#ffffff' : '#0e1c2b'}
                            strokeWidth={isMatch ? 2 : 1}
                          />
                        );
                      })}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-lg border border-slate-700 bg-[#081018] p-2 text-xs text-white shadow-xl">
                              <p className="font-bold text-white">{data.name}</p>
                              <p className="text-[#00b04f] font-mono mt-0.5">
                                {Number(data.value).toLocaleString()} votes
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Mini Legend for Pie Chart */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px]">
                {pieChartData.slice(0, 6).map((item, idx) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (item.name !== 'Other Clubs') setSelectedTeamName(item.name);
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          currentSelectedTeam?.teamName.toLowerCase() === item.name.toLowerCase()
                            ? '#ff0046'
                            : PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                    <span>{item.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
