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
            <div className="w-full rounded-3xl p-8 md:p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center select-none">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10 animate-pulse">
                    <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    No Favorite Matches Added
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Track live scores, match events, and real-time updates for your favorite teams. Tap the star icon on any fixture card to add it to your personal watchlist.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Starred fixtures will be saved locally & synchronized live</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 select-none">
            {Object.entries(matchesByLeague).map(([leagueName, leagueMatches]) => (
                <div
                    key={leagueName}
                    className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none"
                >
                    {/* Unified League Section Header */}
                    <div className="flex items-center justify-between px-4 md:px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                {leagueName}
                            </span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black tracking-wide">
                            CAMPUS LEAGUE
                        </span>
                    </div>

                    {/* Solidified Match List with neat columns and lateral scroll */}
                    <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
                        {leagueMatches.map((match) => {
                            const isMatchLive = match.status === 'LIVE';
                            const isFav = isFavorite(match.id);

                            return (
                                <div
                                    key={match.id}
                                    onClick={() => onMatchClick(match)}
                                    className="relative flex items-center justify-between px-4 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group min-w-[500px]"
                                >
                                    {/* Favorite Star Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(match.id);
                                        }}
                                        aria-label={isFav ? "Remove match from favorites" : "Add match to favorites"}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-2 shrink-0"
                                    >
                                        <Star
                                            className={`w-5 h-5 transition-all duration-200 ${
                                                isFav
                                                    ? 'text-amber-400 fill-amber-400 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                                    : 'text-slate-300 dark:text-slate-600 opacity-60 group-hover:opacity-100 hover:text-amber-400'
                                            }`}
                                        />
                                    </button>

                                    {/* Internal Grid Layout: grid-cols-[1fr_auto_1fr] */}
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 md:gap-4 pl-2">
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

                                            <span className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[120px] mt-1">
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
