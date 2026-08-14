import React from 'react';
import { Trophy, Calendar, MapPin, Clock, Eye, ChevronRight } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface MyMatchesViewProps {
  matchesByMonth: { [monthKey: string]: Match[] };
  onSelectMatch: (match: Match) => void;
  onEndMatch: (match: Match) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  matchesByMonth,
  onSelectMatch,
  onEndMatch,
  setActiveTab,
}) => {
  const monthKeys = Object.keys(matchesByMonth);

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
    if (match.id && match.id.length > 10 && !isNaN(Date.parse(match.id))) {
      const d = new Date(match.id);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return 'Sat, Aug 15';
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-xl space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Assigned Matches
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inline schedule organized by month • Click any match to inspect details
            </p>
          </div>
        </div>
      </div>

      {/* MONTHLY INLINE GROUPS */}
      {monthKeys.length === 0 ? (
        <div className="p-8 text-center bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
            No Assigned Matches Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You do not currently have any fixtures assigned under your official referee UID.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {monthKeys.map((monthKey) => {
            const matches = matchesByMonth[monthKey] || [];
            return (
              <div
                key={monthKey}
                className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3"
              >
                {/* Month Title Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-600 dark:text-[#D4AF37] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {monthKey}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-[#162032] px-2.5 py-0.5 rounded-full">
                    {matches.length} {matches.length === 1 ? 'Fixture' : 'Fixtures'}
                  </span>
                </div>

                {/* Inline Matches List */}
                <div className="space-y-2">
                  {matches.map((match) => {
                    const isFinished = match.status === 'FT';
                    const isLive = match.status === 'LIVE' || match.status === 'HT';
                    const isCancelled = match.status === 'CANCELLED';

                    return (
                      <div
                        key={match.id}
                        onClick={() => onSelectMatch(match)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#141C2E]/90 hover:bg-amber-500/5 dark:hover:bg-[#182236] border border-slate-200/70 dark:border-slate-800/70 hover:border-amber-500/40 dark:hover:border-[#D4AF37]/40 transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        {/* Left: Matchday & Date Pill */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] font-black text-[10px] uppercase border border-amber-500/20">
                            MD {match.matchday || 1}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {formatMatchDate(match)}
                          </span>
                        </div>

                        {/* Middle: Teams & Score */}
                        <div className="flex-1 grid grid-cols-11 items-center gap-2 px-2 text-xs">
                          {/* Team A */}
                          <div className="col-span-5 flex items-center justify-end gap-2 text-right truncate">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {match.teamA.name}
                            </span>
                            <img
                              src={match.teamA.logo}
                              alt={match.teamA.name}
                              className="w-6 h-6 object-contain flex-shrink-0"
                            />
                          </div>

                          {/* Score / VS */}
                          <div className="col-span-1 text-center font-mono font-black text-xs text-amber-600 dark:text-[#D4AF37]">
                            {isFinished || isLive || isCancelled
                              ? `${match.scoreA} - ${match.scoreB}`
                              : 'vs'}
                          </div>

                          {/* Team B */}
                          <div className="col-span-5 flex items-center justify-start gap-2 text-left truncate">
                            <img
                              src={match.teamB.logo}
                              alt={match.teamB.name}
                              className="w-6 h-6 object-contain flex-shrink-0"
                            />
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {match.teamB.name}
                            </span>
                          </div>
                        </div>

                        {/* Right: Venue, Time & Status */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 text-xs">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 hidden md:flex">
                            <Clock className="w-3 h-3" /> {match.time || '16:00'}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[120px] hidden lg:flex">
                            <MapPin className="w-3 h-3" /> {match.venue || 'Pavilion Pitch'}
                          </span>

                          {renderStatusBadge(match.status)}

                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
