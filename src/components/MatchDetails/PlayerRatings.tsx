import React, { useState } from 'react';
import { Star, Award } from 'lucide-react';
import type { Match, Player } from '../../types';

interface PlayerRatingsProps {
    match: Match;
}

export const PlayerRatings: React.FC<PlayerRatingsProps> = ({ match }) => {
    const { teamA, teamB, lineups, events = [] } = match;
    const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>('teamA');

    // Calculate rating based on stored match events (Goals, Assists, Cards)
    const computePlayerRating = (player: Player): { ratingStr: string; isMotm: boolean } => {
        if (typeof player.rating === 'number' && player.rating > 0) {
            return { ratingStr: player.rating.toFixed(1), isMotm: Boolean(player.rating >= 8.5) };
        }

        let base = player.isSub ? 6.0 : 6.5;
        const playerEvts = events.filter((e) => e.playerId === player.id);
        const playerAssists = events.filter((e) => e.assistPlayerId === player.id);

        base += playerEvts.filter((e) => e.type === 'goal' || e.type === 'penalty').length * 1.5;
        base += playerAssists.length * 0.8;
        base -= playerEvts.filter((e) => e.type === 'yellow').length * 0.6;
        base -= playerEvts.filter((e) => e.type === 'red').length * 2.0;

        const finalRating = Math.min(10.0, Math.max(4.0, base));
        return { ratingStr: finalRating.toFixed(1), isMotm: false };
    };

    const mapPlayers = (players: Player[]) => {
        const mapped = players.map((p) => {
            const { ratingStr } = computePlayerRating(p);
            return { ...p, ratingStr, ratingVal: parseFloat(ratingStr) };
        });

        const highestRating = Math.max(...mapped.map((m) => m.ratingVal), 0);
        return mapped.map((m) => ({
            ...m,
            isMotm: m.ratingVal > 7.5 && m.ratingVal === highestRating
        }));
    };

    const playersA = mapPlayers(lineups?.teamA || []);
    const playersB = mapPlayers(lineups?.teamB || []);

    const currentPlayers = selectedTeam === 'teamA' ? playersA : playersB;
    const currentTeam = selectedTeam === 'teamA' ? teamA : teamB;

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block">
                        Post-Match Analysis
                    </span>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                        Player Performance Ratings
                    </h3>
                </div>

                {/* Team Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setSelectedTeam('teamA')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedTeam === 'teamA'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                    >
                        {teamA.shortName}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTeam('teamB')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedTeam === 'teamB'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                    >
                        {teamB.shortName}
                    </button>
                </div>
            </div>

            {/* Ratings Card */}
            {currentPlayers.length === 0 ? (
                <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-2xl border border-gray-150 dark:border-gray-800 text-center text-xs text-gray-400">
                    No match lineup players available for performance rating.
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md divide-y divide-gray-100 dark:divide-gray-800/80 overflow-hidden transition-colors">
                    {currentPlayers.map((player) => {
                        const ratingNum = player.ratingVal;
                        const isHigh = ratingNum >= 8.0;
                        const isMedium = ratingNum >= 7.0 && ratingNum < 8.0;

                        return (
                            <div key={player.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                                        style={{ backgroundColor: currentTeam.colorCode }}
                                    >
                                        {player.number}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                                                {player.name}
                                            </h4>
                                            {player.isMotm && (
                                                <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5 uppercase">
                                                    <Award className="w-3 h-3" /> MOTM
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                            {player.position} {player.isSub ? '(Sub)' : '(Starter)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Rating badge */}
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${isHigh
                                        ? 'bg-emerald-500 text-white'
                                        : isMedium
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}>
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>{player.ratingStr}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
