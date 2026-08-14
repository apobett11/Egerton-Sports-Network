import React from 'react';
import { 
  Trophy, Clock, MapPin, UserCheck, Eye, CheckCircle, 
  XCircle, Award, Calendar, AlertCircle, ShieldCheck, ChevronRight 
} from 'lucide-react';
import type { Match, Announcement } from '../../../../../types';
import type { RefereeTab, RefereeProfileData } from '../../types';

interface RefereeHomeOverviewProps {
  todayMatches: Match[];
  upcomingAssignment: Match | null;
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
  todayMatches,
  upcomingAssignment,
  countdownStr,
  announcements,
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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase animate-pulse">
            ● {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase">
            Full Time
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* SECTION 1: TODAY'S "MY GAMES" MASTER CONTAINER */}
      <section className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        {/* Header with Title and Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                My Games Today
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chronological assignments for matchday officiating
              </p>
            </div>
          </div>

          {upcomingAssignment && upcomingAssignment.status !== 'FT' && upcomingAssignment.status !== 'CANCELLED' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-[#182236] border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-bold text-amber-600 dark:text-[#D4AF37] self-start sm:self-auto shadow-xs">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Kickoff: {countdownStr}</span>
            </div>
          )}
        </div>

        {/* TODAY'S MATCHES LIST */}
        {todayMatches.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-[#141C2E] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
              No Matches Scheduled for Selected Date
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You do not have any match assignments on this date. Use the date navigator above or check My Matches for all upcoming fixtures.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              View Full Match Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {todayMatches.map((match) => {
              const isFinished = match.status === 'FT';
              const isCancelled = match.status === 'CANCELLED';
              const isLive = match.status === 'LIVE' || match.status === 'HT';

              return (
                <div
                  key={match.id}
                  className="bg-slate-50/80 dark:bg-[#141C2E]/90 border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 space-y-4 shadow-sm"
                >
                  {/* Top Bar: League & Status */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {match.league || 'Egerton Premier League'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Matchday {match.matchday || 1}
                      </span>
                    </div>

                    {renderStatusBadge(match.status)}
                  </div>

                  {/* Teams Matchup & Score */}
                  <div
                    onClick={() => onSelectMatch(match)}
                    className="grid grid-cols-11 items-center bg-white dark:bg-[#0D1322] p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-[#121A2E] transition-colors"
                  >
                    {/* Home Team */}
                    <div className="col-span-5 flex items-center justify-start gap-2.5 sm:gap-3 truncate">
                      <img
                        src={match.teamA.logo}
                        alt={match.teamA.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamA.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                          Home Team
                        </span>
                      </div>
                    </div>

                    {/* Score / VS */}
                    <div className="col-span-1 text-center font-mono font-black text-sm sm:text-base text-amber-600 dark:text-[#D4AF37]">
                      {isFinished || isLive || isCancelled
                        ? `${match.scoreA} - ${match.scoreB}`
                        : 'VS'}
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex items-center justify-end gap-2.5 sm:gap-3 text-right truncate">
                      <div className="truncate">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamB.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                          Away Team
                        </span>
                      </div>
                      <img
                        src={match.teamB.logo}
                        alt={match.teamB.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                      />
                    </div>
                  </div>

                  {/* Important Game Details: Pitch, Linesmen, Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Pitch / Venue */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-[#0D1322]/70 border border-slate-200/60 dark:border-slate-800/60">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Pitch / Venue</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                          {match.venue || 'Egerton Pavilion Ground'}
                        </span>
                      </div>
                    </div>

                    {/* Kickoff Time */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-[#0D1322]/70 border border-slate-200/60 dark:border-slate-800/60">
                      <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Kickoff Time</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                          {match.time || '16:00'} EAT
                        </span>
                      </div>
                    </div>

                    {/* Linesmen / Officials */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-[#0D1322]/70 border border-slate-200/60 dark:border-slate-800/60">
                      <UserCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Linesmen</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                          AR1: Official 1 • AR2: Official 2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: End Match, Cancel Match, Give Walkover */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {!isFinished && !isCancelled && (
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Cancel Match */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel the match ${match.teamA.name} vs ${match.teamB.name}?`)) {
                              onCancelMatch(match.id);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>

                        {/* Give Walkover */}
                        <button
                          type="button"
                          onClick={() => onOpenWalkover(match)}
                          className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Walkover (3-0)</span>
                        </button>

                        {/* End Match Portal */}
                        <button
                          type="button"
                          onClick={() => onEndMatch(match)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
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
        )}
      </section>

      {/* SECTION 2: QUICK CAREER METRICS (PROGRESSIVE DISCLOSURE) */}
      <section className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Season Officiating Summary
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Official Record</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Matches Completed</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {stats.matchesRefereed}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Fixtures</span>
            <div className="text-xl font-black text-amber-600 dark:text-[#D4AF37]">
              {stats.upcomingMatches}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Yellow Cards</span>
            <div className="text-xl font-black text-amber-500">
              {stats.yellowCards}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Red Cards</span>
            <div className="text-xl font-black text-rose-500">
              {stats.redCards}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
