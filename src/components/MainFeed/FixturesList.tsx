import React, { useState } from 'react';
import { Star, Pin, ChevronUp, ChevronDown, Table, Volume2, VolumeX, Radio } from 'lucide-react';
import type { Match } from '../../types';

interface FixturesListProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
    favorites: string[];
    toggleFavorite: (matchId: string) => void;
    filterSport?: string;
    selectedDate?: Date;
    onOpenTable?: (leagueName: string) => void;
}

export const FixturesList: React.FC<FixturesListProps> = ({
    matches,
    onMatchClick,
    favorites,
    toggleFavorite,
    filterSport: _filterSport = 'football',
    selectedDate: _selectedDate,
    onOpenTable
}) => {
    const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});
    const [pinnedLeagues, setPinnedLeagues] = useState<Record<string, boolean>>({});

    const toggleCollapse = (league: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsedLeagues(prev => ({ ...prev, [league]: !prev[league] }));
    };

    const togglePin = (league: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPinnedLeagues(prev => ({ ...prev, [league]: !prev[league] }));
    };

    const isFavorite = (matchId: string) => favorites.includes(matchId);

    // Grouping by league
    const leagues = Array.from(new Set(matches.map((m) => m.league)));

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
            <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-md p-8 text-center select-none shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#14263b] text-[#ff0046] flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    No Matches Scheduled
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    No matches found matching the active date or filter criteria.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 select-none w-full">
            {Object.entries(matchesByLeague).map(([leagueName, leagueMatches]) => {
                const isCollapsed = !!collapsedLeagues[leagueName];
                const isPinned = !!pinnedLeagues[leagueName];

                return (
                    <div
                        key={leagueName}
                        className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
                    >
                        {/* FLASHSCORE LEAGUE HEADER BAND */}
                        <div 
                            onClick={(e) => toggleCollapse(leagueName, e)}
                            className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#152940] transition-colors"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* League pin/star button */}
                                <button
                                    type="button"
                                    onClick={(e) => togglePin(leagueName, e)}
                                    className="p-0.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                                    title="Pin League"
                                >
                                    <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                                </button>

                                {/* Flag / Crest */}
                                <div className="w-4 h-3 bg-slate-300 dark:bg-slate-700 rounded-xs flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
                                    🇰🇪
                                </div>

                                {/* League Info */}
                                <div className="flex flex-col leading-tight min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                            {leagueName}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                        KENYA
                                    </span>
                                </div>
                            </div>

                            {/* League Actions: Table Icon & Collapse Toggle */}
                            <div className="flex items-center gap-2 text-slate-400">
                                {onOpenTable && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenTable(leagueName);
                                        }}
                                        className="p-1 hover:text-[#ff0046] hover:bg-slate-200 dark:hover:bg-[#1a2e45] rounded cursor-pointer"
                                        title="View League Standings"
                                    >
                                        <Table className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* MATCH ROWS CONTAINER */}
                        {!isCollapsed && (
                            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                                {leagueMatches.map((match) => {
                                    const isMatchLive = match.status === 'LIVE';
                                    const isHT = match.status === 'HT';
                                    const isFT = match.status === 'FT';
                                    const isFav = isFavorite(match.id);

                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => onMatchClick(match)}
                                            className="flex items-center justify-between px-3 py-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer group"
                                        >
                                            {/* Left Column: Star & Match Status / Time */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(match.id);
                                                    }}
                                                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-amber-400 cursor-pointer"
                                                    aria-label="Toggle favorite"
                                                >
                                                    <Star
                                                        className={`w-4 h-4 transition-colors ${
                                                            isFav
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'hover:fill-amber-400'
                                                        }`}
                                                    />
                                                </button>

                                                {/* Status indicator / Time */}
                                                <div className="w-12 text-center flex flex-col items-center justify-center">
                                                    {isMatchLive ? (
                                                        <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-0.5">
                                                            <Radio className="w-3 h-3 animate-pulse" />
                                                            {match.minute}'
                                                        </span>
                                                    ) : isHT ? (
                                                        <span className="text-[11px] font-extrabold text-[#ff0046]">
                                                            HT
                                                        </span>
                                                    ) : isFT ? (
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                            Finished
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                            {match.time || '16:00'}
                                                        </span>
                                                    )}
                                                </div>
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

                                                    {/* Home Score */}
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

                                                    {/* Away Score */}
                                                    {match.status !== 'UPCOMING' && (
                                                        <span className={`text-xs font-mono font-extrabold pl-2 ${
                                                            isMatchLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'
                                                        }`}>
                                                            {match.scoreB}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Live Badge or Preview Badge */}
                                            <div className="shrink-0 pl-2">
                                                {isMatchLive ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white flex items-center gap-1">
                                                        LIVE
                                                    </span>
                                                ) : match.status === 'UPCOMING' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#14263b] text-slate-600 dark:text-slate-400">
                                                        PREVIEW
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

