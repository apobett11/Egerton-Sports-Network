import React from 'react';
import { 
  Trophy, Clock, MapPin, UserCheck, Eye, CheckCircle, 
  XCircle, Award, Calendar, AlertCircle, ShieldCheck
} from 'lucide-react';
import type { Match, Announcement } from '../../../../../types';
import type { RefereeTab, RefereeProfileData } from '../../types';

interface RefereeHomeOverviewProps {
  nextMatch: Match | null;
  countdownStr: string;
  announcements: Announcement[];
  profileData: RefereeProfileData;
  onSelectMatch: (match: Match) => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const RefereeHomeOverview: React.FC<RefereeHomeOverviewProps> = ({
  nextMatch,
  countdownStr,
  profileData,
  onSelectMatch,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
  setActiveTab,
}) => {
  const stats = profileData.statistics;

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

  const isFinished = nextMatch?.status === 'FT';
  const isCancelled = nextMatch?.status === 'CANCELLED';
  const isLive = nextMatch?.status === 'LIVE' || nextMatch?.status === 'HT';

  return (
    <div className="animate-fadeIn select-none space-y-8">
      {/* SECTION 1: HERO "NEXT MATCH" THIN STRIP MASTER CARD */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs">
        {/* Next Match Header Ribbon */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#14263b]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white">
              NEXT MATCH
            </span>
            {nextMatch && (
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {nextMatch.league || 'Egerton Premier League'} • Matchday {nextMatch.matchday || 1}
              </span>
            )}
          </div>

          {nextMatch && (
            <div className="flex items-center gap-2">
              {renderStatusBadge(nextMatch.status)}
              {!isFinished && !isCancelled && (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full sm:rounded-md bg-slate-100 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] text-xs font-mono font-extrabold text-[#ff0046]">
                  <Clock className="w-3.5 h-3.5 text-[#ff0046]" />
                  <span>{countdownStr}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {!nextMatch ? (
          /* Empty state when no next match */
          <div className="py-8 text-center space-y-2">
            <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
              No Upcoming Match Scheduled
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              All currently assigned fixtures for this referee have been concluded or no future matches are assigned.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className="mt-2 px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
            >
              View Match History & Schedule
            </button>
          </div>
        ) : (
          /* NEXT MATCH THIN STRIP (INTEGRATED BROADCAST CARD) */
          <div className="pt-3.5 space-y-3.5">
            {/* Matchup strip */}
            <div
              onClick={() => onSelectMatch(nextMatch)}
              className="grid grid-cols-11 items-center gap-2 py-2 px-1 cursor-pointer hover:opacity-95 transition-opacity"
            >
              {/* Home Team */}
              <div className="col-span-5 flex items-center justify-start gap-2.5 sm:gap-3 truncate">
                {nextMatch.teamA.logo ? (
                  <img
                    src={nextMatch.teamA.logo}
                    alt={nextMatch.teamA.name}
                    className="w-9 h-9 sm:w-11 sm:h-11 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-[#152a40] border border-[#223b56] text-white font-black flex items-center justify-center text-xs flex-shrink-0">
                    {nextMatch.teamA.shortName || 'HOM'}
                  </div>
                )}
                <div className="truncate">
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                    {nextMatch.teamA.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                    Home Team
                  </span>
                </div>
              </div>

              {/* Score / Kickoff */}
              <div className={`col-span-1 text-center font-mono font-black text-base sm:text-xl tracking-tight ${isLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'}`}>
                {isFinished || isLive || isCancelled ? `${nextMatch.scoreA} - ${nextMatch.scoreB}` : 'VS'}
              </div>

              {/* Away Team */}
              <div className="col-span-5 flex items-center justify-end gap-2.5 sm:gap-3 text-right truncate">
                <div className="truncate">
                  <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">
                    {nextMatch.teamB.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                    Away Team
                  </span>
                </div>
                {nextMatch.teamB.logo ? (
                  <img
                    src={nextMatch.teamB.logo}
                    alt={nextMatch.teamB.name}
                    className="w-9 h-9 sm:w-11 sm:h-11 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-[#152a40] border border-[#223b56] text-white font-black flex items-center justify-center text-xs flex-shrink-0">
                    {nextMatch.teamB.shortName || 'AWY'}
                  </div>
                )}
              </div>
            </div>

            {/* Inline Match Details */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-slate-600 dark:text-slate-300 px-1 pt-1">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span className="text-[11px] font-medium truncate uppercase tracking-wider">
                  Venue: <strong className="text-slate-900 dark:text-white font-bold">{nextMatch.venue || 'Egerton Sports Ground'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00b04f] flex-shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  Kickoff: <strong className="text-slate-900 dark:text-white font-bold">{nextMatch.time || '16:00'} EAT</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <UserCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span className="text-[11px] font-medium truncate uppercase tracking-wider">
                  Officials: <strong className="text-slate-900 dark:text-white font-bold">{nextMatch.referee}</strong> • {nextMatch.assistantReferee1} • {nextMatch.assistantReferee2}
                </span>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 dark:border-[#14263b] my-3" />

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => onSelectMatch(nextMatch)}
                className="px-3.5 py-2 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-white font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Match Details</span>
              </button>

              {!isFinished && !isCancelled && (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Cancel Match */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to cancel ${nextMatch.teamA.name} vs ${nextMatch.teamB.name}?`)) {
                        onCancelMatch(nextMatch.id);
                      }
                    }}
                    className="px-3 py-2 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Match</span>
                  </button>

                  {/* Give Walkover */}
                  <button
                    type="button"
                    onClick={() => onOpenWalkover(nextMatch)}
                    className="px-3 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Walkover (3-0)</span>
                  </button>

                  {/* End Match */}
                  <button
                    type="button"
                    onClick={() => onEndMatch(nextMatch)}
                    className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>End Match</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: REFEREE ANALYTICS (ALL FETCHED FROM DATABASE) */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Referee Official Analytics & Record
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
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Upcoming Fixtures</span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
              {stats.upcomingMatches}
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
          <span>Official: <strong className="text-slate-800 dark:text-slate-200 font-bold">{profileData.name}</strong></span>
          <span>Cancelled Fixtures: <strong className="text-slate-800 dark:text-slate-200 font-bold">{stats.cancelled}</strong></span>
          <span>Accreditation: <strong className="text-slate-800 dark:text-slate-200 font-bold">{profileData.association}</strong></span>
        </div>
      </section>
    </div>
  );
};
