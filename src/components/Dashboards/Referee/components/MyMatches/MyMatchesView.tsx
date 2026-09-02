import React, { useState } from 'react';
import { 
  Trophy, Calendar, MapPin, Clock, Eye, ChevronRight, 
  X, CheckCircle, XCircle, UserCheck, ShieldAlert, AlertCircle 
} from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab, MatchdayScheduleGroup } from '../../types';
import { canRefereeActOnMatch } from '../../hooks/useRefereeDashboard';

interface MyMatchesViewProps {
  todayMatches: Match[];
  matchdayGroups: MatchdayScheduleGroup[];
  onSelectMatch: (match: Match) => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  todayMatches,
  matchdayGroups,
  onSelectMatch,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
  setActiveTab,
}) => {
  const [activeMatchdayModal, setActiveMatchdayModal] = useState<MatchdayScheduleGroup | null>(null);

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
            FT
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

  const formatMatchDate = (match: Match) => {
    if (match.scheduledTime) {
      const d = new Date(match.scheduledTime);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return 'Scheduled Date';
  };

  return (
    <div className="space-y-8 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="bg-white/90 dark:bg-[#0E1524]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-lg space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              My Assigned Matches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Today's official fixtures and scheduled matchdays linked to your referee UID
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TODAY'S MATCHES */}
      <section className="bg-white/90 dark:bg-[#0E1524]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Today's Matches ({todayMatches.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {todayMatches.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-[#141C2E] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              No Matches Scheduled for Today
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You do not have any fixtures scheduled for today under your official referee UID. Check the matchdays below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMatches.map((match) => {
              const isFinished = match.status === 'FT';
              const isCancelled = match.status === 'CANCELLED';
              const isLive = match.status === 'LIVE' || match.status === 'HT';

              return (
                <div
                  key={match.id}
                  className="bg-slate-50/90 dark:bg-[#141C2E]/90 border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 transition-all duration-200 space-y-3 shadow-xs"
                >
                  {/* Top Bar: League & Status */}
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/70 dark:border-slate-800/70">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {match.league || 'Egerton Premier League'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        MD {match.matchday || 1}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" /> {match.time || '16:00'}
                      </span>
                    </div>

                    {renderStatusBadge(match.status)}
                  </div>

                  {/* Teams Matchup & Score */}
                  <div
                    onClick={() => onSelectMatch(match)}
                    className="grid grid-cols-11 items-center bg-white dark:bg-[#0D1322] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-[#121A2E] transition-colors"
                  >
                    {/* Home Team */}
                    <div className="col-span-5 flex items-center justify-start gap-2.5 truncate">
                      {match.teamA.logo ? (
                        <img
                          src={match.teamA.logo}
                          alt={match.teamA.name}
                          className="w-8 h-8 object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-black flex items-center justify-center text-xs flex-shrink-0">
                          {match.teamA.shortName || 'HOM'}
                        </div>
                      )}
                      <div className="truncate">
                        <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamA.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium">Home</span>
                      </div>
                    </div>

                    {/* Score / VS */}
                    <div className="col-span-1 text-center font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-[#D4AF37]">
                      {isFinished || isLive || isCancelled ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex items-center justify-end gap-2.5 text-right truncate">
                      <div className="truncate">
                        <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamB.name}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium">Away</span>
                      </div>
                      {match.teamB.logo ? (
                        <img
                          src={match.teamB.logo}
                          alt={match.teamB.name}
                          className="w-8 h-8 object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 font-black flex items-center justify-center text-xs flex-shrink-0">
                          {match.teamB.shortName || 'AWY'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {!isFinished && !isCancelled && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Cancel match ${match.teamA.name} vs ${match.teamB.name}?`)) {
                              onCancelMatch(match.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenWalkover(match)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Walkover</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEndMatch(match)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-600 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
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

      {/* SECTION 2: MATCHDAYS & DATES (WITH INTERACTIVE POPUP) */}
      <section className="bg-white/90 dark:bg-[#0E1524]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Assigned Matchdays & Schedules ({matchdayGroups.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Click any matchday to view fixtures
          </span>
        </div>

        {matchdayGroups.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-[#141C2E] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              No Matchdays Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No matchday schedules found under this referee UID.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matchdayGroups.map((group) => {
              const completedCount = group.matches.filter((m) => m.status === 'FT').length;
              const isAllDone = completedCount === group.matches.length && group.matches.length > 0;

              return (
                <div
                  key={group.matchday}
                  onClick={() => setActiveMatchdayModal(group)}
                  className="group bg-slate-50/90 dark:bg-[#141C2E]/90 hover:bg-amber-500/5 dark:hover:bg-[#182236] border border-slate-200/90 dark:border-slate-800/80 hover:border-amber-500/40 dark:hover:border-[#D4AF37]/40 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] font-black text-xs uppercase border border-amber-500/20">
                      Matchday {group.matchday}
                    </span>

                    {isAllDone ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Concluded
                      </span>
                    ) : group.isArrived ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                        Active Today
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {group.dateRangeStr}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                      {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'} Assigned ({completedCount} Completed)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-800/70 text-xs font-bold text-amber-600 dark:text-[#D4AF37] group-hover:underline">
                    <span>View Day's Matches</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* POPUP MODAL: DAY'S MATCHES FOR SELECTED MATCHDAY */}
      {activeMatchdayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveMatchdayModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl space-y-5 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-[#D4AF37] flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Matchday {activeMatchdayModal.matchday} Matches ({activeMatchdayModal.dateRangeStr})
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {activeMatchdayModal.matches.length} Official Fixtures under Referee Control
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMatchdayModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of matches in this matchday */}
            <div className="space-y-3.5">
              {activeMatchdayModal.matches.map((match) => {
                const isFinished = match.status === 'FT';
                const isCancelled = match.status === 'CANCELLED';
                const isLive = match.status === 'LIVE' || match.status === 'HT';
                const { canAct, reason } = canRefereeActOnMatch(match);

                return (
                  <div
                    key={match.id}
                    className="bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs"
                  >
                    {/* Top Row: Date, Time & Status */}
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {formatMatchDate(match)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500" /> {match.time || '16:00'} EAT
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-rose-500" /> {match.venue || 'Egerton Ground'}
                        </span>
                      </div>

                      {renderStatusBadge(match.status)}
                    </div>

                    {/* Matchup */}
                    <div
                      onClick={() => {
                        setActiveMatchdayModal(null);
                        onSelectMatch(match);
                      }}
                      className="grid grid-cols-11 items-center bg-white dark:bg-[#0D1322] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-[#121A2E] transition-colors"
                    >
                      {/* Team A */}
                      <div className="col-span-5 flex items-center justify-start gap-2 truncate">
                        {match.teamA.logo ? (
                          <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-7 h-7 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-[10px]">
                            {match.teamA.shortName || 'HOM'}
                          </div>
                        )}
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamA.name}
                        </span>
                      </div>

                      {/* Score / VS */}
                      <div className="col-span-1 text-center font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-[#D4AF37]">
                        {isFinished || isLive || isCancelled ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
                      </div>

                      {/* Team B */}
                      <div className="col-span-5 flex items-center justify-end gap-2 text-right truncate">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {match.teamB.name}
                        </span>
                        {match.teamB.logo ? (
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-7 h-7 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                            {match.teamB.shortName || 'AWY'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions and Arrival Protection */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMatchdayModal(null);
                          onSelectMatch(match);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Match</span>
                      </button>

                      {!isFinished && !isCancelled && (
                        <div>
                          {canAct ? (
                            /* Actions allowed when matchday is arrived / time is reached */
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Cancel match ${match.teamA.name} vs ${match.teamB.name}?`)) {
                                    onCancelMatch(match.id);
                                    setActiveMatchdayModal(null);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMatchdayModal(null);
                                  onOpenWalkover(match);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Walkover</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMatchdayModal(null);
                                  onEndMatch(match);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-600 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>End Match</span>
                              </button>
                            </div>
                          ) : (
                            /* Action Locked: Matchday not arrived */
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                              <span>{reason || 'Matchday has not arrived — Action locked'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMatchdayModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Matchday Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
