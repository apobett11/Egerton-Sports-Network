import React, { useState } from 'react';
import { Star, Pin, ChevronUp, ChevronDown, Table, Volume2, VolumeX, Radio } from 'lucide-react';
import type { Match } from '../../types';
import { TeamLogo } from '../common/TeamLogo';
import { formatMatchTime, formatMatchPitch } from '../../lib/matchdayHelper';
import { CompactDirectBanner } from '../ads/CompactDirectBanner';

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

    const getLeaguePriority = (leagueName: string): number => {
        const l = (leagueName || '').toLowerCase();
        if (l.includes('friendly') || l.includes('friendlies')) return 0; // Friendlies strictly on top
        if (l.includes('premier') || l.includes('epl') || l.includes('division 1')) return 1;
        if (l.includes('champ') || l.includes('division 2')) return 2;
        if (l.includes('cup')) return 3;
        return 10;
    };

    // Grouping by league with deterministic priority (Friendlies -> EPL -> Championship)
    const leagues = Array.from(new Set(matches.map((m) => m.league))).sort((a, b) => {
        const isPinnedA = !!pinnedLeagues[a];
        const isPinnedB = !!pinnedLeagues[b];
        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;
        return getLeaguePriority(a) - getLeaguePriority(b);
    });

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

    // Unified fixtures sorted chronologically by kickoff time
    const sortedMatches = [...matches].sort((a, b) => {
        const timeA = a.scheduledTime || a.time || '';
        const timeB = b.scheduledTime || b.time || '';
        return timeA.localeCompare(timeB);
    });

    const isCollapsed = !!collapsedLeagues['unified'];
    const activeMatchday = sortedMatches[0]?.matchday || 17;

    return (
        <div className="flex flex-col gap-3 select-none w-full">
            <div className="w-full bg-white dark:bg-[#0e1c2b] border border-purple-300/80 dark:border-purple-800/80 ring-1 ring-purple-500/20 rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                {/* UNIFIED FIXTURES PURPLE THEME HEADER */}
                <div 
                    onClick={(e) => toggleCollapse('unified', e)}
                    className="flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800/60 hover:bg-purple-100/70 dark:hover:bg-purple-950/60 cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Purple Flash Icon */}
                        <div className="w-4 h-3 bg-purple-600 text-white rounded-xs flex items-center justify-center text-[8px] font-black overflow-hidden shrink-0 shadow-2xs">
                            ⚡
                        </div>

                        {/* Title & Badge */}
                        <div className="flex flex-col leading-tight min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-purple-950 dark:text-purple-200 uppercase tracking-tight truncate">
                                    Teddy Ajuoga Super Cup
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-purple-500/15 text-purple-700 dark:text-purple-300 font-black tracking-wider uppercase border border-purple-500/30">
                                    Matchday {activeMatchday}
                                </span>
                            </div>
                            <span className="text-[10px] text-purple-600/90 dark:text-purple-400 font-bold uppercase">
                                Super Cup Tournament • All Pitches
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 text-slate-400">
                        {onOpenTable && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTable('all');
                                }}
                                className="p-1 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded cursor-pointer"
                                title="View Standings"
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
                        {sortedMatches.map((match) => {
                            const isMatchLive = match.status === 'LIVE';
                            const isHT = match.status === 'HT';
                            const isFT = match.status === 'FT';
                            const isFav = isFavorite(match.id);

                            return (
                                <div
                                    key={match.id}
                                    onClick={() => onMatchClick(match)}
                                    className="flex items-center justify-between px-3 py-2.5 bg-purple-50/20 dark:bg-purple-950/15 border-l-4 border-l-purple-500 dark:border-l-purple-400 hover:bg-purple-100/40 dark:hover:bg-purple-900/30 transition-colors cursor-pointer group"
                                >
                                    {/* Left Column: Star & Match Status / Time */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            data-testid={`favorite-btn-${match.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(match.id);
                                            }}
                                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                                isFav
                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                    : 'text-purple-300 dark:text-purple-700 hover:text-amber-500 hover:bg-purple-500/10'
                                            }`}
                                            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                                            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                                        >
                                            <Star
                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                                    isFav
                                                        ? 'fill-white text-white animate-favorite-pop'
                                                        : 'hover:fill-amber-400'
                                                }`}
                                            />
                                        </button>

                                        {/* Status indicator / Time */}
                                        <div className="w-16 text-center flex flex-col items-center justify-center shrink-0">
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
                                                <div className="flex flex-col items-center leading-tight">
                                                    <span className="text-[11px] font-black text-purple-800 dark:text-purple-200 bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 rounded px-1.5 py-0.5 tracking-tight whitespace-nowrap">
                                                        {formatMatchTime(match.scheduledTime || match.time)}
                                                    </span>
                                                    {match.venue && (
                                                        <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider whitespace-nowrap mt-1">
                                                            {formatMatchPitch(match.venue, true)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Column: 2 Stacked Team Rows */}
                                    <div className="flex-1 px-3 flex flex-col justify-center gap-1 min-w-0">
                                        {/* Team A (Home) */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <TeamLogo
                                                    teamId={match.teamA.id}
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
                                                <TeamLogo
                                                    teamId={match.teamB.id}
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
                                            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white dark:bg-purple-600 dark:text-white border border-purple-400 shadow-2xs">
                                                SUPER CUP
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <CompactDirectBanner
                label="Verified Campus Match Consensus"
                tagline="View Pitchside Pundit Odds & Head-to-Head Multipliers"
                ctaText="View Odds"
                variant="purple"
            />
        </div>
    );
};

