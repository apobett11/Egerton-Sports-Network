import React from 'react';
import { 
  Trophy, Clock, MapPin, Eye, CheckCircle, 
  XCircle, Award, Calendar, CheckCircle2, ShieldCheck
} from 'lucide-react';
import type { Match, Announcement } from '../../../../../types';
import type { RefereeTab, RefereeProfileData } from '../../types';

interface RefereeHomeOverviewProps {
  activeMatches?: Match[];
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

  // Render top 3 active unfilled matches or fallback to nextMatch
  const displayMatches: Match[] = 
    activeMatches && activeMatches.length > 0 
      ? activeMatches 
      : (nextMatch ? [nextMatch] : []);

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
          /* 3 ACTIVE MATCHDAY EVENT MODULES */
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing current 3 matches. When any match is filled and submitted, the next fixture will queue here until all EPL matches are filled. Referees can update details, scores, or end any match at any time.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {displayMatches.map((match, idx) => {
                const isFinished = match.status === 'FT';
                const isCancelled = match.status === 'CANCELLED';
                const isLive = match.status === 'LIVE' || match.status === 'HT';

                return (
                  <div
                    key={match.id}
                    className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 space-y-3.5 shadow-xs transition-all hover:border-[#ff0046]/40"
                  >
                    {/* Top strip: Event number badge + League + Matchday + Time */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-[#14263b] text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-[#ff0046] text-white font-black flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-black uppercase tracking-tight text-slate-900 dark:text-white">
                          {match.league || 'Egerton Premier League'}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Matchday {match.matchday || 1}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00b04f]" /> {match.time || '16:00'} EAT
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStatusBadge(match.status)}
                        {idx === 0 && !isFinished && !isCancelled && (
                          <span className="hidden sm:inline-block text-[11px] font-mono font-bold text-[#ff0046]">
                            {countdownStr}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MATCHUP MODULE: High-visibility team names and badges */}
                    <div
                      onClick={() => onSelectMatch(match)}
                      className="grid grid-cols-11 items-center gap-2 py-2 px-1 cursor-pointer bg-white dark:bg-[#0a1520] p-3 rounded-sm border border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 dark:hover:border-[#264468] transition-all"
                    >
                      {/* Home Team */}
                      <div className="col-span-5 flex items-center justify-start gap-3 truncate">
                        {match.teamA.logo ? (
                          <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-[#152a40] border border-[#223b56] text-white font-black flex items-center justify-center text-xs flex-shrink-0">
                            {match.teamA.shortName || 'HOM'}
                          </div>
                        )}
                        <div className="truncate">
                          <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                            {match.teamA.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                            Home Team
                          </span>
                        </div>
                      </div>

                      {/* Score / VS */}
                      <div className={`col-span-1 text-center font-mono font-black text-base sm:text-xl tracking-tight ${isLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'}`}>
                        {isFinished || isLive || isCancelled ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
                      </div>

                      {/* Away Team */}
                      <div className="col-span-5 flex items-center justify-end gap-3 text-right truncate">
                        <div className="truncate">
                          <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                            {match.teamB.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                            Away Team
                          </span>
                        </div>
                        {match.teamB.logo ? (
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-[#152a40] border border-[#223b56] text-white font-black flex items-center justify-center text-xs flex-shrink-0">
                            {match.teamB.shortName || 'AWY'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 text-xs text-slate-600 dark:text-slate-300 px-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate uppercase tracking-wider">
                          Venue: <strong className="text-slate-900 dark:text-white font-bold">{match.venue || 'Egerton Sports Ground'}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Match ID: <span className="font-mono">{match.id.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Action buttons row: ANY referee can act on ANY match */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-[#14263b]">
                      <button
                        type="button"
                        onClick={() => onSelectMatch(match)}
                        className="px-3.5 py-2 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1c3857] text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Match Details & Scores</span>
                      </button>

                      {!isFinished && !isCancelled && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Cancel Match */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel ${match.teamA.name} vs ${match.teamB.name}?`)) {
                                onCancelMatch(match.id);
                              }
                            }}
                            className="px-3 py-2 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>

                          {/* Walkover */}
                          <button
                            type="button"
                            onClick={() => onOpenWalkover(match)}
                            className="px-3 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-300" />
                            <span>Walkover (3-0)</span>
                          </button>

                          {/* End Match */}
                          <button
                            type="button"
                            onClick={() => onEndMatch(match)}
                            className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>End Match</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: REFEREE ANALYTICS (FETCHED FROM DATABASE) */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
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

        {/* 4 Analytics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Matches Completed</span>
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
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Yellow Cards Issued</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {stats.yellowCards}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md space-y-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Red Cards Issued</span>
            <div className="text-xl sm:text-2xl font-black text-rose-500 font-mono">
              {stats.redCards}
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
