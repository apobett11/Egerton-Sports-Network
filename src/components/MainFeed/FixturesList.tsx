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
        const list = matches
            .filter((m) => m.league === league)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
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
        <div className="flex flex-col gap-6 select-none">
            {Object.entries(matchesByLeague).map(([leagueName, leagueMatches]) => (
                <div key={leagueName} className="space-y-3">
                    {/* League Header */}
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                {leagueName}
                            </span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black tracking-wide">
                            CAMPUS LEAGUE
                        </span>
                    </div>

                    {/* Match Cards List */}
                    <div className="flex flex-col gap-3">
                        {leagueMatches.map((match) => {
                            const isMatchLive = match.status === 'LIVE';
                            const isFav = isFavorite(match.id);

                            return (
                                <div
                                    key={match.id}
                                    onClick={() => onMatchClick(match)}
                                    className="relative w-full flex items-center justify-between p-4 md:p-6 rounded-2xl group cursor-pointer transition-all duration-300 overflow-hidden bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:border-blue-900/20 dark:bg-slate-900 dark:border-white/5 dark:hover:border-white/15 dark:hover:bg-slate-800/80"
                                >
                                    {/* Favorite Star (Absolute Top-Left) */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(match.id);
                                        }}
                                        aria-label={isFav ? "Remove match from favorites" : "Add match to favorites"}
                                        className="absolute top-4 left-4 z-20 cursor-pointer focus:outline-none"
                                    >
                                        <Star
                                            className={`w-5 h-5 transition-all duration-200 ${
                                                isFav
                                                    ? 'text-amber-400 fill-amber-400 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                    : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                                            }`}
                                        />
                                    </button>

                                    {/* Internal Grid Layout: grid-cols-[1fr_auto_1fr] */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 md:gap-4 pl-4 md:pl-6">
                                        {/* Team A (Home - Left) */}
                                        <div className="flex items-center gap-3 justify-start min-w-0">
                                            <img
                                                src={match.teamA.logo}
                                                alt={match.teamA.name}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0"
                                            />
                                            <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white">
                                                {match.teamA.name}
                                            </span>
                                        </div>

                                        {/* Center Box (Score/Time) */}
                                        <div className="flex flex-col items-center justify-center px-2 md:px-6">
                                            {isMatchLive ? (
                                                <span className="text-[10px] md:text-xs font-mono font-black tracking-widest text-amber-500 animate-pulse mb-1">
                                                    LIVE {match.minute}
                                                </span>
                                            ) : match.status === 'HT' ? (
                                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-amber-500 mb-1">
                                                    HT
                                                </span>
                                            ) : match.status === 'FT' ? (
                                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">
                                                    FT
                                                </span>
                                            ) : (
                                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">
                                                    {match.time || 'UPCOMING'}
                                                </span>
                                            )}

                                            <div className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                                                {match.status !== 'UPCOMING' ? (
                                                    <span>{match.scoreA} - {match.scoreB}</span>
                                                ) : (
                                                    <span className="text-lg md:text-xl text-slate-400 font-bold tracking-normal font-sans">VS</span>
                                                )}
                                            </div>

                                            <span className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[100px] mt-1">
                                                {match.venue}
                                            </span>
                                        </div>

                                        {/* Team B (Away - Right) */}
                                        <div className="flex items-center gap-3 justify-end flex-row-reverse min-w-0">
                                            <img
                                                src={match.teamB.logo}
                                                alt={match.teamB.name}
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0"
                                            />
                                            <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white text-right">
                                                {match.teamB.name}
                                            </span>
                                        </div>
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
