import React from 'react';
import { ArrowLeft, Star, MapPin, Award } from 'lucide-react';
import type { Match } from '../../types';

interface MatchHeaderProps {
    match: Match;
    onBack: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
    match,
    onBack,
    isFavorite,
    onToggleFavorite
}) => {
    const isLive = match.status === 'LIVE';
    const isHT = match.status === 'HT';

    return (
        <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800 transition-colors select-none">
            {/* Row 1: Back, League info, Favorite */}
            <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors active:scale-95 flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold text-xs"
                    aria-label="Back to match list"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Scores</span>
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                        {match.league}
                    </span>
                    <span className="text-[9px] text-gray-400 font-semibold tracking-wider">KENYA</span>
                </div>

                <button
                    type="button"
                    onClick={onToggleFavorite}
                    className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-gray-850 transition-colors"
                    aria-label="Favorite Match"
                >
                    <Star
                        className={`w-5 h-5 transition-all ${isFavorite
                            ? 'fill-amber-400 text-amber-400 scale-105'
                            : 'text-gray-400 hover:text-amber-500'
                            }`}
                    />
                </button>
            </div>

            {/* Row 2: Scoreboard */}
            <div className="px-4 py-6 max-w-2xl mx-auto flex items-center justify-between gap-4">
                {/* Team A */}
                <div className="flex flex-col items-center text-center w-[30%]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-2 mb-2 shadow-sm">
                        <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-200 line-clamp-2">
                        {match.teamA.name}
                    </span>
                </div>

                {/* Score & Time */}
                <div className="flex flex-col items-center justify-center flex-1">
                    {match.status === 'UPCOMING' ? (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 tracking-wider">
                                Upcoming
                            </span>
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100 mt-1">
                                {match.time}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* Big Score Box */}
                            <div className="flex items-center gap-4">
                                <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {match.scoreA}
                                </span>
                                <span className="text-gray-400 text-xl font-medium">:</span>
                                <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {match.scoreB}
                                </span>
                            </div>

                            {/* Status and Clock */}
                            <div className="mt-3 flex flex-col items-center">
                                {isLive ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 font-extrabold text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-live" />
                                        <span>LIVE • {match.minute}</span>
                                    </div>
                                ) : isHT ? (
                                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 font-extrabold text-[10px] uppercase">
                                        Half Time
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase">
                                        Ended (FT)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center text-center w-[30%]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center p-2 mb-2 shadow-sm">
                        <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-200 line-clamp-2">
                        {match.teamB.name}
                    </span>
                </div>
            </div>

            {/* Row 3: Meta Info (Venue, Referee) */}
            <div className="border-t border-gray-100 dark:border-gray-850 px-4 py-2 bg-gray-50/50 dark:bg-black/10 text-[10px] text-gray-550 dark:text-gray-400 font-semibold">
                <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>Venue: <strong className="text-gray-700 dark:text-gray-300 font-bold">{match.venue}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-gray-400" />
                        <span>Referee: <strong className="text-gray-700 dark:text-gray-300 font-bold">{match.referee}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
