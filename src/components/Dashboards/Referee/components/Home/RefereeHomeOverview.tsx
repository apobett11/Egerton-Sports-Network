import React, { useMemo } from 'react';
import { 
  Trophy, Clock, MapPin, Eye, Award, Calendar, 
  CheckCircle2, Radio, ArrowRight
} from 'lucide-react';
import { formatMatchTime, formatMatchPitch } from '../../../../../lib/matchdayHelper';
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
  profileData,
  onSelectMatch,
  onEndMatch,
  onOpenWalkover,
  setActiveTab,
}) => {
  const stats = profileData.statistics;

  // Render top 3 active unfilled matches or fallback to nextMatch
  const displayMatches: Match[] = 
    activeMatches && activeMatches.length > 0 
      ? activeMatches 
      : (nextMatch ? [nextMatch] : []);

  // Today's League Analytics
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

  return (
    <div className="animate-fadeIn select-none space-y-10 md:space-y-14 bg-black text-slate-100">
      {/* ========================================================================= */}
      {/* CARD 1: ACTIVE MATCH QUEUE (TODAY'S MATCHES)                              */}
      {/* ========================================================================= */}
      <section className="bg-[#0c121c] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white">
                Active Match Queue ({displayMatches.length})
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Matchday Action Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tap any match card or click Preview to launch official End Match or Walkover procedures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {leagueProgress && leagueProgress.total > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                {leagueProgress.completed} / {leagueProgress.total} Concluded
              </span>
            )}
          </div>
        </div>

        {displayMatches.length === 0 ? (
          leagueProgress?.isAllCompleted ? (
            <div className="py-12 text-center space-y-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-black text-base uppercase tracking-tight text-white">
                All Season Matches Concluded
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All scheduled official league fixtures have been finalized and recorded. Standings and rankings are fully up to date.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/15 transition-colors cursor-pointer"
              >
                View Full Fixture List
              </button>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-300">
                No Active Matches Queued
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All queued fixtures for this slot have been submitted.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
              >
                View Full Match Schedule
              </button>
            </div>
          )
        ) : (
          /* LEAGUE FIXTURES CARD: THIN CLEAN HORIZONTAL STRIPS */
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#090e17] shadow-lg divide-y divide-white/5">
            {/* League Header Strip */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/10 text-slate-300">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-[#ff0046]" />
                <span className="text-xs font-black uppercase tracking-tight text-white">
                  {displayMatches[0]?.league || 'Egerton Premier League'}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  • Matchday {displayMatches[0]?.matchday || 1}
                </span>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20">
                Live Queue
              </span>
            </div>

            {/* Match Rows */}
            {displayMatches.map((match) => {
              const isMatchLive = match.status === 'LIVE';
              const isHT = match.status === 'HT';
              const isFT = match.status === 'FT';

              return (
                <div
                  key={match.id}
                  onClick={() => onSelectMatch(match)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-all cursor-pointer group select-none"
                >
                  {/* Left Column: Match Status / Time & Pitch */}
                  <div className="w-20 text-center flex flex-col items-center justify-center shrink-0 pr-2 border-r border-white/5">
                    {isMatchLive ? (
                      <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-0.5">
                        <Radio className="w-3 h-3 animate-pulse" />
                        {match.minute || "65'"}
                      </span>
                    ) : isHT ? (
                      <span className="text-[11px] font-extrabold text-[#ff0046]">HT</span>
                    ) : isFT ? (
                      <span className="text-[10px] font-bold text-emerald-400">Finished</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {formatMatchTime(match.scheduledTime || match.time)}
                      </span>
                    )}
                    {match.venue && (
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[75px] mt-0.5">
                        {formatMatchPitch(match.venue, true)}
                      </span>
                    )}
                  </div>

                  {/* Middle Column: 2 Stacked Team Rows */}
                  <div className="flex-1 px-4 flex flex-col justify-center gap-1.5 min-w-0">
                    {/* Team A (Home) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {match.teamA.logo ? (
                          <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-4 h-4 rounded-full object-contain shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-300">
                            {match.teamA.name.slice(0, 1)}
                          </div>
                        )}
                        <span className={`text-xs truncate ${
                          isMatchLive ? 'font-black text-white' : 'font-bold text-slate-200 group-hover:text-white'
                        }`}>
                          {match.teamA.name}
                        </span>
                      </div>

                      {match.status !== 'UPCOMING' && (
                        <span className={`text-xs font-mono font-extrabold pl-2 ${
                          isMatchLive ? 'text-[#ff0046]' : 'text-slate-300'
                        }`}>
                          {match.scoreA}
                        </span>
                      )}
                    </div>

                    {/* Team B (Away) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {match.teamB.logo ? (
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-4 h-4 rounded-full object-contain shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-300">
                            {match.teamB.name.slice(0, 1)}
                          </div>
                        )}
                        <span className={`text-xs truncate ${
                          isMatchLive ? 'font-black text-white' : 'font-bold text-slate-200 group-hover:text-white'
                        }`}>
                          {match.teamB.name}
                        </span>
                      </div>

                      {match.status !== 'UPCOMING' && (
                        <span className={`text-xs font-mono font-extrabold pl-2 ${
                          isMatchLive ? 'text-[#ff0046]' : 'text-slate-300'
                        }`}>
                          {match.scoreB}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="shrink-0 flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                    {/* Desktop Direct Buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEndMatch(match)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Open End Match Modal"
                      >
                        End Match
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenWalkover(match)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Award 3-0 Walkover"
                      >
                        Walkover (3-0)
                      </button>
                    </div>

                    {/* PREVIEW Button: Reacts identically by opening Match Actions */}
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 shadow-sm transition-all cursor-pointer active:scale-95"
                      title="Match Officiating Actions"
                    >
                      PREVIEW
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* CARD 2: TODAY'S MATCHDAY ANALYTICS (COMES BEFORE CONTROL ANALYTICS)       */}
      {/* ========================================================================= */}
      <section className="bg-[#0c121c] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff0046]" />
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Today's Matchday Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Live summary of match completions, cards, and logged injuries across today's matchdays
            </p>
          </div>
        </div>

        {/* 4 Minimalist Apple Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Matches Played</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{todayAnalytics.totalPlayedToday}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Yellow Cards</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{todayAnalytics.totalYellowsToday}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Red Cards</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-500">{todayAnalytics.totalRedsToday}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Injuries Logged</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">{todayAnalytics.totalInjuriesToday}</span>
          </div>
        </div>

        {/* TWO DISTINCTIVE COLORED LEAGUE CARDS (EPL & CHAMPIONSHIP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* EPL CARD - Rich Emerald & Jade Tone */}
          <div className="bg-gradient-to-br from-[#072d21] via-[#051f17] to-[#03140f] border border-emerald-500/35 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.25)]">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-black uppercase text-white tracking-wide">
                  Egerton Premier League
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                {todayAnalytics.epl.playedToday} / {todayAnalytics.epl.totalToday} Completed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-black/40 backdrop-blur-xs border border-emerald-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-300/70 block uppercase tracking-wider">Goals</span>
                <span className="text-xl font-black font-mono text-emerald-300">{todayAnalytics.epl.goalsToday}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xs border border-emerald-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-300/70 block uppercase tracking-wider">Cards (Y / R)</span>
                <span className="text-xl font-black font-mono text-emerald-300">{todayAnalytics.epl.yellows} / {todayAnalytics.epl.reds}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xs border border-emerald-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-300/70 block uppercase tracking-wider">Injuries</span>
                <span className="text-xl font-black font-mono text-emerald-300">{todayAnalytics.epl.injuries}</span>
              </div>
            </div>
          </div>

          {/* CHAMPIONSHIP CARD - Royal Violet & Indigo Tone */}
          <div className="bg-gradient-to-br from-[#1b1442] via-[#130e30] to-[#0b081c] border border-purple-500/35 rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_8px_32px_-8px_rgba(168,85,247,0.25)]">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-black uppercase text-white tracking-wide">
                  Egerton Championship
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30">
                {todayAnalytics.championship.playedToday} / {todayAnalytics.championship.totalToday} Completed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-black/40 backdrop-blur-xs border border-purple-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-purple-300/70 block uppercase tracking-wider">Goals</span>
                <span className="text-xl font-black font-mono text-purple-300">{todayAnalytics.championship.goalsToday}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xs border border-purple-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-purple-300/70 block uppercase tracking-wider">Cards (Y / R)</span>
                <span className="text-xl font-black font-mono text-purple-300">{todayAnalytics.championship.yellows} / {todayAnalytics.championship.reds}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xs border border-purple-500/20 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-purple-300/70 block uppercase tracking-wider">Injuries</span>
                <span className="text-xl font-black font-mono text-purple-300">{todayAnalytics.championship.injuries}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CARD 3: OFFICIAL LEAGUE CONTROL ANALYTICS (SEASON-WIDE)                   */}
      {/* ========================================================================= */}
      <section className="bg-[#0c121c] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ff0046]" />
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Official League Control Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Cumulative season totals and discipline statistics across all competitions
            </p>
          </div>

          {leagueProgress && leagueProgress.total > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-emerald-400">
              {leagueProgress.completed} / {leagueProgress.total} Concluded
            </span>
          )}
        </div>

        {/* 4 Analytics Metric Cards (All-Time / Season) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matches Completed</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.matchesRefereed}
            </div>
          </div>

          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining in League</span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
              {leagueProgress ? leagueProgress.remaining : stats.upcomingMatches}
            </div>
          </div>

          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yellow Cards (Season)</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats.yellowCards}
            </div>
          </div>

          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Red Cards (Season)</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">
              {stats.redCards}
            </div>
          </div>
        </div>

        {/* Secondary Info Strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/5 font-medium gap-2">
          <span>Match Operations: <strong className="text-white font-bold">Center Match Referee Desk</strong></span>
          <span>Accreditation: <strong className="text-white font-bold">FKF National Level Official</strong></span>
        </div>
      </section>
    </div>
  );
};

export default RefereeHomeOverview;
