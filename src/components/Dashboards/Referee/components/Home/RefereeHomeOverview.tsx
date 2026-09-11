import React, { useState, useMemo } from 'react';
import { 
  Trophy, Clock, MapPin, Eye, CheckCircle, 
  XCircle, Award, Calendar, CheckCircle2, ShieldCheck, Radio, X
} from 'lucide-react';
import { formatMatchTime } from '../../../../../lib/matchdayHelper';
import type { Match, Announcement } from '../../../../../types';
import type { RefereeTab, RefereeProfileData } from '../../types';

interface RefereeHomeOverviewProps {
  activeMatches?: Match[];
  allMatches?: Match[];
  rawEvents?: any[];
  nextMatch?: Match | null;
  leagueProgress?: {
    total: number;
    completed: number;
    remaining: number;
    isAllCompleted: boolean;
  };
  countdownStr: string;
  announcements: Announcement[];
  profileData: RefereeProfileData;
  activeRefereeId?: string;
  onSelectMatch: (match: Match) => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const RefereeHomeOverview: React.FC<RefereeHomeOverviewProps> = ({
  activeMatches,
  allMatches = [],
  rawEvents = [],
  nextMatch,
  leagueProgress,
  countdownStr,
  profileData,
  onSelectMatch,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
  setActiveTab,
}) => {
  const stats = profileData.statistics;
  const [mobileActionMatch, setMobileActionMatch] = useState<Match | null>(null);

  // Render top 3 active unfilled matches or fallback to nextMatch
  const displayMatches: Match[] = 
    activeMatches && activeMatches.length > 0 
      ? activeMatches 
      : (nextMatch ? [nextMatch] : []);

  // Today's League Analytics (auto-updates dynamically on match submission)
  const todayAnalytics = useMemo(() => {
    const now = new Date();
    const todayLocaleStr = now.toDateString();

    const matchesToday = (allMatches || []).filter((m) => {
      if (m.scheduledTime) {
        const d = new Date(m.scheduledTime);
        if (!isNaN(d.getTime()) && d.toDateString() === todayLocaleStr) {
          return true;
        }
      }
      return (m.matchday || 1) === (activeMatches?.[0]?.matchday || 1);
    });

    const isEPL = (m: Match) => {
      const l = (m.league || '').toLowerCase();
      return !l.includes('champ');
    };

    const isChamp = (m: Match) => {
      const l = (m.league || '').toLowerCase();
      return l.includes('champ');
    };

    const eplToday = matchesToday.filter(isEPL);
    const eplPlayedToday = eplToday.filter((m) => m.status === 'FT');
    const eplGoalsToday = eplPlayedToday.reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0);

    const champToday = matchesToday.filter(isChamp);
    const champPlayedToday = champToday.filter((m) => m.status === 'FT');
    const champGoalsToday = champPlayedToday.reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0);

    const eplMatchIds = new Set(eplToday.map((m) => m.id));
    const champMatchIds = new Set(champToday.map((m) => m.id));

    let eplYellows = 0;
    let eplReds = 0;
    let eplInjuries = 0;

    let champYellows = 0;
    let champReds = 0;
    let champInjuries = 0;

    (rawEvents || []).forEach((e: any) => {
      const fid = e.fixture_id || e.match_uid;
      const type = (e.type || '').toLowerCase();

      if (eplMatchIds.has(fid)) {
        if (type === 'yellow' || (type === 'card' && e.card_type === 'YELLOW')) eplYellows++;
        if (type === 'red' || (type === 'card' && e.card_type === 'RED')) eplReds++;
        if (type === 'injury') eplInjuries++;
      } else if (champMatchIds.has(fid)) {
        if (type === 'yellow' || (type === 'card' && e.card_type === 'YELLOW')) champYellows++;
        if (type === 'red' || (type === 'card' && e.card_type === 'RED')) champReds++;
        if (type === 'injury') champInjuries++;
      }
    });

    return {
      totalPlayedToday: eplPlayedToday.length + champPlayedToday.length,
      totalYellowsToday: eplYellows + champYellows,
      totalRedsToday: eplReds + champReds,
      totalInjuriesToday: eplInjuries + champInjuries,
      epl: {
        playedToday: eplPlayedToday.length,
        totalToday: eplToday.length,
        goalsToday: eplGoalsToday,
        yellows: eplYellows,
        reds: eplReds,
        injuries: eplInjuries,
      },
      championship: {
        playedToday: champPlayedToday.length,
        totalToday: champToday.length,
        goalsToday: champGoalsToday,
        yellows: champYellows,
        reds: champReds,
        injuries: champInjuries,
      },
    };
  }, [allMatches, rawEvents, activeMatches]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white animate-pulse">
            ● {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00b04f] text-white">
            Full Time
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#152e4d] text-sky-200 border border-sky-400/20">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="animate-fadeIn select-none space-y-8">
      {/* SECTION 1: 3-EVENT ROLLING ACTIVE MATCHDAY QUEUE */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#14263b]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white">
              ACTIVE EVENTS ({displayMatches.length} QUEUED)
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Official Matchday Fill & Action Queue
            </span>
          </div>

          <div className="flex items-center gap-2">
            {leagueProgress && leagueProgress.total > 0 && (
              <span className="px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] text-[11px] font-bold uppercase tracking-wider text-[#00b04f]">
                {leagueProgress.completed} / {leagueProgress.total} Matches Resolved
              </span>
            )}
          </div>
        </div>

        {displayMatches.length === 0 ? (
          /* Empty or Full Completed State */
          leagueProgress?.isAllCompleted ? (
            <div className="py-10 text-center space-y-3 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-md p-6">
              <CheckCircle2 className="w-10 h-10 text-[#00b04f] mx-auto" />
              <h3 className="font-black text-base uppercase tracking-tight text-slate-900 dark:text-white">
                All EPL Season Matches Concluded & Reconciled
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All official matches have been concluded and submitted. Final standings, top scorers, and team forms have been calculated.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="mt-2 px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
              >
                View Full Match Schedule
              </button>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
                No Active Matches in Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                All currently queued fixtures have been submitted. Check the match schedule for upcoming fixtures.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="mt-2 px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
              >
                View Full Schedule
              </button>
            </div>
          )
        ) : (
          /* LEAGUE FIXTURES CARD: THIN HORIZONTAL STRIPS (IDENTICAL TO HOMEPAGE FIXTURESLIST) */
          <div className="border border-slate-200 dark:border-[#1a2e45] rounded-md overflow-hidden bg-white dark:bg-[#0c1825] shadow-xs">
            {/* League Header Strip */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#eaedf2] dark:bg-[#0c1a27] border-b border-[#d8dce2] dark:border-[#14263b] text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#ff0046]" />
                <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {displayMatches[0]?.league || 'Egerton Premier League'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  • Matchday {displayMatches[0]?.matchday || 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20">
                  Active 3-Match Queue
                </span>
              </div>
            </div>

            {/* Match Rows Container (Identical to FixturesList.tsx) */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {displayMatches.map((match) => {
                const isMatchLive = match.status === 'LIVE';
                const isHT = match.status === 'HT';
                const isFT = match.status === 'FT';

                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      if (window.innerWidth < 640) {
                        setMobileActionMatch(match);
                      } else {
                        onEndMatch(match);
                      }
                    }}
                    className="flex items-center justify-between px-3 py-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer group"
                  >
                    {/* Left Column: Match Status / Time */}
                    <div className="w-14 text-center flex flex-col items-center justify-center shrink-0">
                      {isMatchLive ? (
                        <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-0.5">
                          <Radio className="w-3 h-3 animate-pulse" />
                          {match.minute || "65'"}
                        </span>
                      ) : isHT ? (
                        <span className="text-[11px] font-extrabold text-[#ff0046]">HT</span>
                      ) : isFT ? (
                        <span className="text-[10px] font-bold text-[#00b04f]">Finished</span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                          {formatMatchTime(match.scheduledTime || match.time)}
                        </span>
                      )}
                    </div>

                    {/* Middle Column: 2 Stacked Team Rows */}
                    <div className="flex-1 px-3 flex flex-col justify-center gap-1 min-w-0">
                      {/* Team A (Home) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                          />
                          <span className={`text-xs truncate ${
                            isMatchLive ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-100'
                          }`}>
                            {match.teamA.name}
                          </span>
                        </div>

                        {match.status !== 'UPCOMING' && (
                          <span className={`text-xs font-mono font-extrabold pl-2 ${
                            isMatchLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'
                          }`}>
                            {match.scoreA}
                          </span>
                        )}
                      </div>

                      {/* Team B (Away) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                          />
                          <span className={`text-xs truncate ${
                            isMatchLive ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-100'
                          }`}>
                            {match.teamB.name}
                          </span>
                        </div>

                        {match.status !== 'UPCOMING' && (
                          <span className={`text-xs font-mono font-extrabold pl-2 ${
                            isMatchLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'
                          }`}>
                            {match.scoreB}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Action Buttons (Desktop has all 3, Mobile has only PREVIEW) */}
                    <div className="shrink-0 flex items-center gap-1.5 pl-2" onClick={(e) => e.stopPropagation()}>
                      {/* Desktop only: End Match & Walkover */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEndMatch(match)}
                          className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-[#00b04f] hover:bg-[#009643] text-white transition-colors cursor-pointer shadow-2xs"
                          title="Open End Match Modal"
                        >
                          End Match
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenWalkover(match)}
                          className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer shadow-2xs"
                          title="Award 3-0 Walkover"
                        >
                          Walkover (3-0)
                        </button>
                      </div>

                      {/* Both Mobile and Desktop: PREVIEW Button on the strip */}
                      <button
                        type="button"
                        onClick={() => onSelectMatch(match)}
                        className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#152e4d] hover:bg-[#1a385d] text-[#4ea8de] dark:bg-[#152e4d] dark:text-[#56b4ea] border border-[#4ea8de]/35 shadow-2xs transition-colors cursor-pointer"
                        title="Match Preview & Lineups"
                      >
                        PREVIEW
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* MOBILE 3-BUTTON MODAL POPUP (Triggered when tapping a match on mobile) */}
      {mobileActionMatch && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-fadeIn select-none"
          onClick={() => setMobileActionMatch(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0d1b2a] border border-slate-200 dark:border-[#1e3857] rounded-xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046] animate-pulse" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">
                    {mobileActionMatch.teamA.shortName || mobileActionMatch.teamA.name} vs {mobileActionMatch.teamB.shortName || mobileActionMatch.teamB.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {mobileActionMatch.league || 'Egerton League'} • Matchday {mobileActionMatch.matchday || 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileActionMatch(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Selectable Action Options */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const m = mobileActionMatch;
                  setMobileActionMatch(null);
                  onEndMatch(m);
                }}
                className="w-full py-3 px-4 rounded-lg bg-[#00b04f] hover:bg-[#009643] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>End Match (Official Final Score)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const m = mobileActionMatch;
                  setMobileActionMatch(null);
                  onOpenWalkover(m);
                }}
                className="w-full py-3 px-4 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Award Walkover (3-0)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const m = mobileActionMatch;
                  setMobileActionMatch(null);
                  onSelectMatch(m);
                }}
                className="w-full py-3 px-4 rounded-lg bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1e3857] text-slate-800 dark:text-slate-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Details & Lineups</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REFEREE ANALYTICS (FETCHED FROM DATABASE) */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Official League Match Control Analytics
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#00b04f]">
            Live Database Sync
          </span>
        </div>

        {/* 4 Analytics Metric Cards (All-Time / Season) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Matches Completed (Season)</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.matchesRefereed}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Remaining In League</span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
              {leagueProgress ? leagueProgress.remaining : stats.upcomingMatches}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Yellow Cards Issued (Season)</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {stats.yellowCards}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Red Cards Issued (Season)</span>
            <div className="text-xl sm:text-2xl font-black text-rose-500 font-mono">
              {stats.redCards}
            </div>
          </div>
        </div>

        {/* TODAY'S MATCH OPERATIONS & LEAGUE ANALYTICS CARD (Auto-updates on match submission) */}
        <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#162a40] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff0046]" />
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Today's Match Operations & League Analytics
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Real-time match completion, disciplinary sanctions, and player injuries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Auto-Updating
              </span>
            </div>
          </div>

          {/* Today's High-Level Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-[#0c1825] p-3 rounded border border-slate-200 dark:border-[#182f49]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Matches Played</span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-500">{todayAnalytics.totalPlayedToday}</span>
            </div>
            <div className="bg-white dark:bg-[#0c1825] p-3 rounded border border-slate-200 dark:border-[#182f49]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Yellow Cards</span>
              <span className="text-lg sm:text-xl font-black font-mono text-amber-400">{todayAnalytics.totalYellowsToday}</span>
            </div>
            <div className="bg-white dark:bg-[#0c1825] p-3 rounded border border-slate-200 dark:border-[#182f49]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Red Cards</span>
              <span className="text-lg sm:text-xl font-black font-mono text-rose-500">{todayAnalytics.totalRedsToday}</span>
            </div>
            <div className="bg-white dark:bg-[#0c1825] p-3 rounded border border-slate-200 dark:border-[#182f49]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Injuries Logged</span>
              <span className="text-lg sm:text-xl font-black font-mono text-sky-400">{todayAnalytics.totalInjuriesToday}</span>
            </div>
          </div>

          {/* Two League Breakdown Columns: EPL & Championships */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* EPL Column */}
            <div className="bg-white dark:bg-[#0c1825] border border-slate-200 dark:border-[#182f49] rounded p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#ff0046]" />
                  <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Egerton Premier League (EPL)</span>
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-400">
                  {todayAnalytics.epl.playedToday} / {todayAnalytics.epl.totalToday} Completed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Goals</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.epl.goalsToday}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Cards (Y / R)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.epl.yellows} / {todayAnalytics.epl.reds}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Injuries</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.epl.injuries}</span>
                </div>
              </div>
            </div>

            {/* Championship Column */}
            <div className="bg-white dark:bg-[#0c1825] border border-slate-200 dark:border-[#182f49] rounded p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Egerton Championships</span>
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-400">
                  {todayAnalytics.championship.playedToday} / {todayAnalytics.championship.totalToday} Completed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Goals</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.championship.goalsToday}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Cards (Y / R)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.championship.yellows} / {todayAnalytics.championship.reds}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#102237] p-2 rounded">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Injuries</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{todayAnalytics.championship.injuries}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Info Strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-[#14263b] px-1 font-medium">
          <span>Match Operations: <strong className="text-slate-800 dark:text-slate-200 font-bold">Unified Match Officials Desk</strong></span>
          <span>Cancelled Fixtures: <strong className="text-slate-800 dark:text-slate-200 font-bold">{stats.cancelled}</strong></span>
          <span>Accreditation: <strong className="text-slate-800 dark:text-slate-200 font-bold">FKF National Level Official</strong></span>
        </div>
      </section>
    </div>
  );
};

export default RefereeHomeOverview;
