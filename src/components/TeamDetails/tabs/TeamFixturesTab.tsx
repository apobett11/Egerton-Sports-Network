import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, Clock, ChevronRight } from 'lucide-react';
import type { Match } from '../../Dashboards/Team/types';

interface TeamFixturesTabProps {
  fixtures: Match[];
  currentTeamName?: string;
  currentTeamLogo?: string;
  onSelectMatch?: (match: any) => void;
}

export const TeamFixturesTab: React.FC<TeamFixturesTabProps> = ({
  fixtures,
  currentTeamName = 'Team',
  currentTeamLogo,
  onSelectMatch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');

  const upcomingFixtures = fixtures.filter((f) => f.status === 'UPCOMING');
  const pastResults = fixtures.filter((f) => f.status === 'FINISHED');

  const displayedList =
    activeSubTab === 'UPCOMING'
      ? upcomingFixtures
      : activeSubTab === 'FINISHED'
      ? pastResults
      : fixtures;

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none animate-in fade-in duration-150">
      {/* 1. Header Banner & Sub-Tabs */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1a2e45] pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Official Fixtures & Match Results
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live match schedule and historical results derived from database records
              </p>
            </div>
          </div>

          {/* Sub-Tabs Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-[#14263b] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a2e45] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
                activeSubTab === 'ALL'
                  ? 'bg-white dark:bg-[#1f3a5a] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({fixtures.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('UPCOMING')}
              className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
                activeSubTab === 'UPCOMING'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Upcoming ({upcomingFixtures.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('FINISHED')}
              className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
                activeSubTab === 'FINISHED'
                  ? 'bg-[#00b04f] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Results ({pastResults.length})
            </button>
          </div>
        </div>

        {/* 2. Match Cards List */}
        <div className="space-y-2.5 pt-1">
          {displayedList.length === 0 ? (
            <div className="bg-slate-50 dark:bg-[#112236] p-8 rounded-sm border border-slate-200 dark:border-[#1a2e45] text-center">
              <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No match records found for this view filter.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                New fixtures and finalized results will appear automatically.
              </p>
            </div>
          ) : (
            displayedList.map((match) => {
              const isFinished = match.status === 'FINISHED';
              const isLive = match.status === 'LIVE';

              return (
                <div
                  key={match.id}
                  onClick={() => onSelectMatch && onSelectMatch(match)}
                  className={`bg-slate-50/70 dark:bg-[#112236] p-3.5 sm:p-4 rounded-none sm:rounded-sm border border-slate-200 dark:border-[#1a2e45] hover:border-[#ff0046]/40 dark:hover:border-[#ff0046]/40 transition-all flex flex-col gap-2.5 ${
                    onSelectMatch ? 'cursor-pointer group' : ''
                  }`}
                >
                  {/* Top line: Competition & Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                    <span className="font-extrabold text-[#ff0046] uppercase tracking-wider">
                      {match.league || 'Campus League'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {match.date} • {match.time}
                        </span>
                      </span>
                      {match.location && (
                        <span className="hidden sm:flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{match.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match Teams Row */}
                  <div className="grid grid-cols-12 gap-2 items-center py-1">
                    {/* Home Team */}
                    <div className="col-span-5 flex items-center justify-end gap-2 sm:gap-3 text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {match.homeTeamName || (match.isHome ? currentTeamName : match.opponentName)}
                      </span>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#1a2e45] p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <img
                          src={
                            match.homeTeamLogo ||
                            (match.isHome ? currentTeamLogo : match.opponentLogo) ||
                            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'
                          }
                          alt="Home team"
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Center Score / Status */}
                    <div className="col-span-2 flex flex-col items-center justify-center text-center">
                      {isFinished ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white bg-slate-200 dark:bg-[#14263b] px-2 sm:px-2.5 py-0.5 rounded-sm">
                            {match.score || `${match.scoreHome ?? 0} - ${match.scoreAway ?? 0}`}
                          </span>
                          {match.result && (
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-xs ${
                                match.result === 'W'
                                  ? 'bg-[#00b04f]/15 text-[#00b04f]'
                                  : match.result === 'D'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-rose-500/15 text-rose-500'
                              }`}
                            >
                              {match.result === 'W'
                                ? 'Win'
                                : match.result === 'D'
                                ? 'Draw'
                                : 'Loss'}
                            </span>
                          )}
                        </div>
                      ) : isLive ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-[#ff0046] animate-pulse uppercase">
                            LIVE
                          </span>
                          <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                            {match.score || '0 - 0'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">VS</span>
                          <span className="text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300">
                            {match.time || '15:00'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex items-center justify-start gap-2 sm:gap-3 text-left">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#1a2e45] p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <img
                          src={
                            match.awayTeamLogo ||
                            (!match.isHome ? currentTeamLogo : match.opponentLogo) ||
                            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'
                          }
                          alt="Away team"
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {match.awayTeamName || (!match.isHome ? currentTeamName : match.opponentName)}
                      </span>
                    </div>
                  </div>

                  {/* Details Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span className="font-semibold">
                      Matchday {match.matchday || 1}
                    </span>
                    {onSelectMatch && (
                      <span className="text-[#ff0046] font-bold group-hover:underline flex items-center gap-0.5">
                        <span>Match Center</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamFixturesTab;
