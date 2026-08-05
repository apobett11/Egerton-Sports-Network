import React from 'react';
import { ArrowLeft, Star, MapPin, Award, Clock, Calendar } from 'lucide-react';
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
        <div className="bg-white dark:bg-[#0E1424] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors select-none">
            {/* Row 1: Back Button, Competition Badge, Favorite Toggle */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-4xl mx-auto">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    aria-label="Back to match list"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-500" />
                    <span>Back</span>
                </button>

                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {match.league || 'Egerton Premier League'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                        Matchday Official Fixture
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onToggleFavorite}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    aria-label="Favorite Match"
                >
                    <Star
                        className={`w-5 h-5 transition-all ${isFavorite
                            ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-400 hover:text-amber-500'
                            }`}
                    />
                </button>
            </div>

            {/* Row 2: Hero Scoreboard */}
            <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
                {/* Team A */}
                <div className="flex flex-col items-center text-center w-[35%] sm:w-[30%] space-y-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-center p-3 shadow-md shadow-slate-950/5">
                        <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                        {match.teamA.name}
                    </span>
                </div>

                {/* Score & Time Centerpiece */}
                <div className="flex flex-col items-center justify-center flex-1">
                    {match.status === 'UPCOMING' ? (
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tracking-widest border border-slate-200 dark:border-slate-700">
                                Upcoming Match
                            </span>
                            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                                {match.time || '15:00 EAT'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-2">
                            {/* Big Score Box */}
                            <div className="flex items-center gap-4 sm:gap-6 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
                                <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${isLive ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                    {match.scoreA}
                                </span>
                                <span className="text-slate-400 text-2xl font-bold font-mono">:</span>
                                <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${isLive ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                    {match.scoreB}
                                </span>
                            </div>

                            {/* Status & Minute Badge */}
                            <div>
                                {isLive ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 font-black text-xs">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                        <span>LIVE • {match.minute}</span>
                                    </div>
                                ) : isHT ? (
                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-black text-xs uppercase tracking-wider">
                                        Half Time (HT)
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-wider">
                                        Full Time (FT)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center text-center w-[35%] sm:w-[30%] space-y-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 flex items-center justify-center p-3 shadow-md shadow-slate-950/5">
                        <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                        {match.teamB.name}
                    </span>
                </div>
            </div>

            {/* Row 3: Meta Logistics Bar (Venue, Kickoff, Referee) */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 py-3 bg-slate-50/60 dark:bg-[#090D16]/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span>Venue: <strong className="text-slate-900 dark:text-slate-200 font-extrabold">{match.venue || 'Main Pavilion Ground'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Kickoff: <strong className="text-slate-900 dark:text-slate-200 font-extrabold">{match.time ? `${match.time} EAT` : '15:00 EAT'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Referee: <strong className="text-slate-900 dark:text-slate-200 font-extrabold">{match.referee || 'Official Ref.'}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

