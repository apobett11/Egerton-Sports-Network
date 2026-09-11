import React, { useState } from 'react';
import { 
  Trophy, Calendar, MapPin, Clock, Eye, ChevronRight, 
  X, CheckCircle, XCircle, UserCheck, ShieldAlert, AlertCircle,
  Radio, CheckCircle2, Lock
} from 'lucide-react';
import { formatMatchTime, formatMatchPitch } from '../../../../../lib/matchdayHelper';
import { useToast } from '../../../../../contexts/ToastContext';
import type { Match } from '../../../../../types';
import type { RefereeTab, MatchdayScheduleGroup } from '../../types';
import { canRefereeActOnMatch } from '../../hooks/useRefereeDashboard';

interface MyMatchesViewProps {
  todayMatches: Match[];
  myNextMatches?: Match[];
  matchdayGroups: MatchdayScheduleGroup[];
  onSelectMatch: (match: Match) => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
  setActiveTab: (tab: RefereeTab) => void;
  isSubmitting?: boolean;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  todayMatches,
  myNextMatches,
  matchdayGroups,
  onSelectMatch,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
  setActiveTab,
  isSubmitting = false,
}) => {
  const { showWarning } = useToast();
  const [activeMatchdayModal, setActiveMatchdayModal] = useState<MatchdayScheduleGroup | null>(null);
  const displayMatches = todayMatches && todayMatches.length > 0 ? todayMatches : (myNextMatches && myNextMatches.length > 0 ? myNextMatches : []);

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
            FT
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
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#152a40] text-white border border-[#223b56] flex items-center justify-center font-black shadow-xs">
            <Calendar className="w-5 h-5 text-[#ff0046]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Today's Matches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All official league fixtures. Any official can update kickoff time, scores, award walkovers, or finalize any match at any time.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TODAY'S / MATCHDAY'S MATCHES (THIN HORIZONTAL STRIPS IDENTICAL TO HOMEPAGE) */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Today's / Matchday Matches ({displayMatches.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Matchday {displayMatches[0]?.matchday || 1} Schedule
          </span>
        </div>

        {displayMatches.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-[#102237] border border-dashed border-slate-200 dark:border-[#1a2e45] rounded-md space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
              No Matches Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No fixtures scheduled for this matchday.
            </p>
          </div>
        ) : (
          /* LEAGUE FIXTURES CARD: THIN HORIZONTAL STRIPS (IDENTICAL TO HOMEPAGE) */
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

              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20">
                Official Matchday Fixtures
              </span>
            </div>

            {/* Match Rows Container */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {displayMatches.map((match) => {
                const isMatchLive = match.status === 'LIVE';
                const isHT = match.status === 'HT';
                const isFT = match.status === 'FT';

                return (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
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

                    {/* Right Column: Action Buttons */}
                    <div className="shrink-0 flex items-center gap-1.5 pl-2" onClick={(e) => e.stopPropagation()}>
                      {match.status === 'FT' || match.status === 'WALKOVER' || (match as any).stats_processed ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Result Confirmed</span>
                        </div>
                      ) : (
                        <>
                          {/* Desktop only: End Match & Walkover */}
                          <div className="hidden sm:flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => onEndMatch(match)}
                              className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-[#00b04f] hover:bg-[#009643] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors cursor-pointer shadow-2xs"
                              title="Open End Match Modal"
                            >
                              End Match
                            </button>

                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => onOpenWalkover(match)}
                              className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors cursor-pointer shadow-2xs"
                              title="Award 3-0 Walkover"
                            >
                              Walkover (3-0)
                            </button>
                          </div>

                          {/* Both Mobile and Desktop: PREVIEW Button on the strip (opens same match actions) */}
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMatch(match);
                            }}
                            className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#152e4d] hover:bg-[#1a385d] disabled:opacity-50 disabled:cursor-not-allowed text-[#4ea8de] dark:bg-[#152e4d] dark:text-[#56b4ea] border border-[#4ea8de]/35 shadow-2xs transition-colors cursor-pointer"
                            title="Match Actions"
                          >
                            PREVIEW
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: MATCHDAYS & DATES (WITH INTERACTIVE POPUP) */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Assigned Matchdays & Schedules ({matchdayGroups.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Click any matchday to view fixtures
          </span>
        </div>

        {matchdayGroups.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-[#102237] border border-dashed border-slate-200 dark:border-[#1a2e45] rounded-md space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
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
                  className="group bg-slate-50 dark:bg-[#102237] hover:bg-slate-100 dark:hover:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] hover:border-[#ff0046]/50 rounded-md p-4 transition-all duration-200 cursor-pointer shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-sm bg-[#152a40] text-white font-black text-xs uppercase tracking-wider border border-[#223b56]">
                      Matchday {group.matchday}
                    </span>

                    {isAllDone ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00b04f] text-white">
                        Concluded
                      </span>
                    ) : group.isArrived ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white animate-pulse">
                        Active Today
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#152e4d] text-sky-200 border border-sky-400/20">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {group.dateRangeStr}
                    </h4>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mt-0.5">
                      {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'} Assigned ({completedCount} Completed)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#14263b] text-xs font-bold text-slate-400 group-hover:text-[#ff0046] transition-colors uppercase tracking-wider">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setActiveMatchdayModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#0e1e2d] border border-slate-200 dark:border-[#1a2e45] rounded-xl max-w-3xl w-full shadow-lg overflow-hidden space-y-0 text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-[#0e1e2d] border-b border-slate-200 dark:border-[#14263b] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#152a40] text-white border border-[#223b56] flex items-center justify-center font-black">
                  <Calendar className="w-4 h-4 text-[#ff0046]" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 dark:text-white">
                    Matchday {activeMatchdayModal.matchday} Matches ({activeMatchdayModal.dateRangeStr})
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {activeMatchdayModal.matches.length} Official Fixtures under Referee Control
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMatchdayModal(null)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#152a40] transition-colors cursor-pointer"
                aria-label="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of matches in this matchday */}
            <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
              {activeMatchdayModal.matches.map((match) => {
                const isFinished = match.status === 'FT';
                const isCancelled = match.status === 'CANCELLED';
                const isLive = match.status === 'LIVE' || match.status === 'HT';
                const activeMd = todayMatches[0]?.matchday || displayMatches[0]?.matchday;
                const { canAct, reason } = canRefereeActOnMatch(match, activeMd);

                return (
                  <div
                    key={match.id}
                    className="bg-slate-50 dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-md p-3.5 space-y-3 shadow-xs"
                  >
                    {/* Top Row: Date, Time & Status */}
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200 dark:border-[#14263b]">
                      <div className="flex items-center gap-2">
                        <span className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {formatMatchDate(match)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00b04f]" /> {formatMatchTime(match.scheduledTime || match.time)}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span className="font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-rose-500" /> {formatMatchPitch(match.venue) || match.venue || 'TBD'}
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
                      className="grid grid-cols-11 items-center bg-white dark:bg-[#0a1520] p-3 rounded-sm border border-slate-200 dark:border-[#1a2e45] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#13263b] transition-colors"
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
                          <div className="w-7 h-7 rounded-sm bg-[#152a40] text-white font-black flex items-center justify-center text-[10px] border border-[#223b56]">
                            {match.teamA.shortName || 'HOM'}
                          </div>
                        )}
                        <span className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900 dark:text-white truncate">
                          {match.teamA.name}
                        </span>
                      </div>

                      {/* Score / VS */}
                      <div className={`col-span-1 text-center font-mono font-black text-xs sm:text-sm ${isLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'}`}>
                        {isFinished || isLive || isCancelled ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
                      </div>

                      {/* Team B */}
                      <div className="col-span-5 flex items-center justify-end gap-2 text-right truncate">
                        <span className="font-black text-xs sm:text-sm uppercase tracking-tight text-slate-900 dark:text-white truncate">
                          {match.teamB.name}
                        </span>
                        {match.teamB.logo ? (
                          <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-7 h-7 object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-sm bg-[#152a40] text-white font-black flex items-center justify-center text-[10px] border border-[#223b56]">
                            {match.teamB.shortName || 'AWY'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions and Arrival Protection */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-[#14263b]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMatchdayModal(null);
                          onSelectMatch(match);
                        }}
                        className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1c3857] text-slate-700 dark:text-white font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Match Actions</span>
                      </button>

                      {!isFinished && !isCancelled && (
                        <div>
                          {canAct ? (
                            /* Actions allowed when matchday is arrived / time is reached */
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  showWarning("The President can only cancel the matches.");
                                  onCancelMatch(match.id);
                                }}
                                className="px-2.5 py-1.5 rounded-md bg-rose-500/10 text-rose-400/60 border border-rose-500/20 text-xs font-bold uppercase tracking-wider transition-all cursor-not-allowed flex items-center gap-1 opacity-70"
                                title="The President can only cancel the matches"
                              >
                                <Lock className="w-3.5 h-3.5 text-rose-400/60" />
                                <span>Cancel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMatchdayModal(null);
                                  onOpenWalkover(match);
                                }}
                                className="px-2.5 py-1.5 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                                <span>Walkover</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMatchdayModal(null);
                                  onEndMatch(match);
                                }}
                                className="px-3.5 py-1.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>End Match</span>
                              </button>
                            </div>
                          ) : (
                            /* Action Locked: Matchday not arrived */
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-200/70 dark:bg-[#15273b] border border-slate-300 dark:border-[#223b56] text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
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
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#112236] border-t border-slate-200 dark:border-[#1a2e45] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveMatchdayModal(null)}
                className="px-4 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
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
