import React from 'react';
import { ArrowLeft, Star, Share2 } from 'lucide-react';
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
    const isFT = match.status === 'FT';

    const htScoreA = (match.events || []).filter(e => e.teamId === match.teamA.id && e.minute <= 45 && (e.type === 'goal' || e.type === 'penalty')).length;
    const htScoreB = (match.events || []).filter(e => e.teamId === match.teamB.id && e.minute <= 45 && (e.type === 'goal' || e.type === 'penalty')).length;

    return (
        <div className="w-full select-none bg-[#0e1e2d] text-white">
            {/* 1. TOP BREADCRUMB / NAV BAR */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#16283d] text-xs">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-1 hover:text-[#ff0046] transition-colors cursor-pointer text-slate-300 flex items-center gap-1"
                    aria-label="Back"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Match Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 truncate max-w-[260px] sm:max-w-none">
                    <span>⚽ FOOTBALL</span>
                    <span>&gt;</span>
                    <span>🇰🇪 KENYA</span>
                    <span>&gt;</span>
                    <span className="text-white font-extrabold uppercase truncate">{match.league || 'EGERTON LEAGUE'}</span>
                </div>

                {/* Right Action Icons: Star & Share */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleFavorite}
                        className="p-1 text-slate-300 hover:text-amber-400 cursor-pointer"
                        title="Favorite Match"
                    >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                    <button
                        type="button"
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                        title="Share Match"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: `${match.teamA.name} vs ${match.teamB.name}`, url: window.location.href });
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 2. MATCH SCORE HERO CONTAINER */}
            <div className="px-4 py-6 sm:py-8 flex flex-col items-center justify-center max-w-4xl mx-auto">
                {/* Match Status / Time / Minute Header */}
                <div className="text-center mb-4">
                    {isLive ? (
                        <div className="text-xs font-black tracking-widest text-[#ff0046] uppercase flex items-center justify-center gap-1.5 animate-pulse">
                            <span>LIVE</span>
                            <span>•</span>
                            <span>{match.minute && match.minute !== '-' ? match.minute : "65'"}</span>
                        </div>
                    ) : isHT ? (
                        <div className="text-xs font-black tracking-widest text-[#ff0046] uppercase">
                            HALF TIME
                        </div>
                    ) : isFT ? (
                        <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            FINISHED
                        </div>
                    ) : (
                        <div className="text-xs font-bold tracking-widest text-slate-300">
                            {match.time || '15:00 EAT'} • {match.venue || 'Campus Stadium'}
                        </div>
                    )}
                </div>

                {/* Scoreboard Grid: Team A vs Team B */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 sm:gap-6">
                    {/* Team A (Home) */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <img
                            src={match.teamA.logo}
                            alt={match.teamA.name}
                            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover bg-slate-800 p-0.5 shadow-md mb-2"
                        />
                        <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-[200px]">
                            {match.teamA.name}
                        </h2>
                    </div>

                    {/* Center Score Numbers */}
                    <div className="flex flex-col items-center justify-center px-2">
                        <div className={`text-4xl sm:text-6xl font-black font-mono tracking-tighter ${
                            isLive ? 'text-[#ff0046]' : 'text-white'
                        }`}>
                            {match.status !== 'UPCOMING' ? (
                                <span>{match.scoreA} - {match.scoreB}</span>
                            ) : (
                                <span className="text-2xl sm:text-4xl text-slate-400 font-sans font-bold">VS</span>
                            )}
                        </div>

                        {/* Real HT breakdown from database events */}
                        {match.status !== 'UPCOMING' && (
                            <span className="text-[11px] font-semibold text-slate-400 mt-1 font-mono">
                                (HT: {htScoreA} - {htScoreB})
                            </span>
                        )}
                    </div>

                    {/* Team B (Away) */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <img
                            src={match.teamB.logo}
                            alt={match.teamB.name}
                            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover bg-slate-800 p-0.5 shadow-md mb-2"
                        />
                        <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate max-w-[130px] sm:max-w-[200px]">
                            {match.teamB.name}
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
};


