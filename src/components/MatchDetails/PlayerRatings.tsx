import React, { useState } from 'react';
import { Star, Award } from 'lucide-react';
import type { Match } from '../../types';

interface PlayerRatingsProps {
    match: Match;
}

export const PlayerRatings: React.FC<PlayerRatingsProps> = ({ match }) => {
    const { teamA, teamB, lineups } = match;
    const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>('teamA');

    const playersA = (lineups?.teamA || []).map((p, idx) => ({
        ...p,
        rating: (8.8 - idx * 0.3).toFixed(1),
        isMotm: idx === 0
    }));

    const playersB = (lineups?.teamB || []).map((p, idx) => ({
        ...p,
        rating: (7.9 - idx * 0.35).toFixed(1),
        isMotm: false
    }));

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
                        Player Ratings
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
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md divide-y divide-gray-100 dark:divide-gray-800/80 overflow-hidden transition-colors">
                {currentPlayers.map((player) => {
                    const ratingNum = parseFloat(player.rating);
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
                                <span>{player.rating}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
