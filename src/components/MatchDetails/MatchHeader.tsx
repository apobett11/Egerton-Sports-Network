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
        <div className="w-full max-w-5xl mx-auto select-none">
            {/* Top Navigation & Controls Bar */}
            <div className="flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
                    aria-label="Back to match list"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-500" />
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {match.league || 'Egerton Premier League'}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onToggleFavorite}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
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

            {/* HERO SCOREBOARD CONTAINER (Forced Theme Override) */}
            <div className="relative w-full flex flex-col items-center justify-center pt-16 pb-12 px-4 rounded-b-[40px] md:rounded-[40px] mt-4 overflow-hidden shadow-2xl bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 border border-white/10">
                {/* Ambient Center Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

                {/* Grid Align: grid-cols-[1fr_auto_1fr] */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-4xl mx-auto gap-4 md:gap-12 z-10">
                    {/* Team A (Home) */}
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] object-cover bg-white mx-auto"
                        />
                        <h2 className="mt-4 text-center text-white font-black text-lg md:text-2xl tracking-tight">
                            {match.teamA.name}
                        </h2>
                    </div>

                    {/* Center Score Box */}
                    <div className="flex flex-col items-center justify-center">
                        {/* Top Status Pill */}
                        <div className="px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest bg-white/10 text-emerald-400 border border-white/10 mb-4">
                            {isLive ? (
                                <span className="flex items-center gap-1.5 text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    LIVE {match.minute}
                                </span>
                            ) : isHT ? (
                                <span>HALF TIME</span>
                            ) : match.status === 'FT' ? (
                                <span>FULL TIME</span>
                            ) : (
                                <span>{match.time || '15:00 EAT'}</span>
                            )}
                        </div>

                        {/* Score Typography */}
                        <div className="text-7xl md:text-[120px] font-black font-mono tracking-tighter text-white drop-shadow-2xl leading-none flex items-center gap-2 md:gap-4">
                            {match.status !== 'UPCOMING' ? (
                                <>
                                    <span>{match.scoreA}</span>
                                    <span className="text-white/40 text-5xl md:text-[90px] font-light">:</span>
                                    <span>{match.scoreB}</span>
                                </>
                            ) : (
                                <span className="text-4xl md:text-6xl text-white/50 tracking-normal font-sans font-extrabold">VS</span>
                            )}
                        </div>
                    </div>

                    {/* Team B (Away) */}
                    <div className="flex flex-col items-center justify-center">
                        <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] object-cover bg-white mx-auto"
                        />
                        <h2 className="mt-4 text-center text-white font-black text-lg md:text-2xl tracking-tight">
                            {match.teamB.name}
                        </h2>
                    </div>
                </div>

                {/* Logistics Metadata Strip */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10 text-xs font-semibold text-slate-300 z-10">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>{match.venue || 'Egerton Main Ground'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>{match.time ? `${match.time} EAT` : 'Scheduled'}</span>
                    </div>
                    {match.referee && (
                        <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span>Ref: {match.referee}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

