import React from 'react';
import { Star } from 'lucide-react';
import type { Match } from '../../types';

interface FixturesListProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
    favorites: string[];
    toggleFavorite: (matchId: string) => void;
    filterSport?: string;
    selectedDate?: Date;
}

export const FixturesList: React.FC<FixturesListProps> = ({
    matches,
    onMatchClick,
    favorites,
    toggleFavorite,
    filterSport: _filterSport = 'football',
    selectedDate: _selectedDate
}) => {
    // Let's filter matches. Of course, since it's mock code, we can filter them by league, or sport, etc.
    // We can group matches by league.
    const leagues = Array.from(new Set(matches.map((m) => m.league)));

    const isFavorite = (matchId: string) => favorites.includes(matchId);

    // Grouping logic
    const matchesByLeague = leagues.reduce<Record<string, Match[]>>((acc, league) => {
        const list = matches.filter((m) => m.league === league);
        if (list.length > 0) {
            acc[league] = list;
        }
        return acc;
    }, {});

    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-150 dark:border-gray-800 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Star className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No Match Fixtures</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                    There are no fixtures matching the current filters or date. Try selecting another date.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 select-none">
            {Object.entries(matchesByLeague).map(([leagueName, leagueMatches]) => (
                <div
                    key={leagueName}
                    className="bg-white/80 dark:bg-[#15191B]/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-md overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
                >
                    {/* League Header */}
                    <div className="bg-gray-50/80 dark:bg-black/40 px-4 py-3 border-b border-gray-150/80 dark:border-gray-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                {leagueName}
                            </span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black tracking-wide">
                            CAMPUS LEAGUE
                        </span>
                    </div>

                    {/* Match Rows */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                        {leagueMatches.map((match) => {
                            const isMatchLive = match.status === 'LIVE';
                            const isFav = isFavorite(match.id);

                            return (
                                <div
                                    key={match.id}
                                    onClick={() => onMatchClick(match)}
                                    className="flex items-center justify-between px-4 py-4 hover:bg-emerald-500/[0.03] dark:hover:bg-emerald-500/[0.05] transition-all duration-200 cursor-pointer relative group active:scale-[0.99]"
                                >
                                    {/* Left Column: Match Status & Time */}
                                    <div className="w-[68px] flex flex-col items-start justify-center pr-3 border-r border-gray-100 dark:border-gray-800/80">
                                        {isMatchLive ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/10 ring-1 ring-amber-500/30 animate-pulse">
                                                    LIVE
                                                </span>
                                                <span className="text-xs font-black text-amber-500">
                                                    {match.minute}
                                                </span>
                                            </div>
                                        ) : match.status === 'HT' ? (
                                            <div className="flex flex-col items-start">
                                                <span className="text-[9px] font-black text-amber-500 tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/10">
                                                    HT
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">Half Time</span>
                                            </div>
                                        ) : match.status === 'FT' ? (
                                            <span className="text-xs font-black text-gray-400 dark:text-gray-500">
                                                FT
                                            </span>
                                        ) : (
                                            // UPCOMING
                                            <span className="text-xs font-extrabold text-gray-600 dark:text-gray-400">
                                                {match.time}
                                            </span>
                                        )}
                                    </div>

                                    {/* Center Column: Teams and Logos */}
                                    <div className="flex-1 flex flex-col gap-3 px-4 justify-center">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={match.teamA.logo}
                                                    alt={match.teamA.name}
                                                    className="w-6 h-6 rounded-full object-contain bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 p-0.5 shadow-xs group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {match.teamA.name}
                                                </span>
                                            </div>

                                            {match.status !== 'UPCOMING' && (
                                                <span className={`text-base font-black tracking-tight ${isMatchLive ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {match.scoreA}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={match.teamB.logo}
                                                    alt={match.teamB.name}
                                                    className="w-6 h-6 rounded-full object-contain bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 p-0.5 shadow-xs group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {match.teamB.name}
                                                </span>
                                            </div>

                                            {match.status !== 'UPCOMING' && (
                                                <span className={`text-base font-black tracking-tight ${isMatchLive ? 'text-amber-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {match.scoreB}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Actions (Favorite Star) */}
                                    <div className="pl-3 border-l border-gray-100 dark:border-gray-800/80">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(match.id);
                                            }}
                                            className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-80 cursor-pointer"
                                        >
                                            <Star
                                                className={`w-5 h-5 transition-all duration-300 ${isFav
                                                    ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                    : 'hover:text-amber-400 hover:scale-110'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
