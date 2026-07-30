import React, { useState, useEffect } from 'react';
import { Match, StandingEntry } from '../types';

interface HomepageProps {
    onNavigateToMatchCenter: () => void;
    matches: Match[];
    standings: StandingEntry[];
}

export const Homepage: React.FC<HomepageProps> = ({ onNavigateToMatchCenter, matches: _matches, standings: _standings }) => {
    // Current state for countdown timer
    const [timeLeft, setTimeLeft] = useState({
        days: 2,
        hours: 14,
        minutes: 35,
        seconds: 12
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else {
                    if (prev.minutes > 0) {
                        return { ...prev, minutes: 59, seconds: 59 };
                    } else {
                        if (prev.hours > 0) {
                            return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                        } else {
                            if (prev.days > 0) {
                                return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                            }
                            clearInterval(interval);
                            return prev;
                        }
                    }
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fd = (num: number) => String(num).padStart(2, '0');

    return (
        <div className="w-full space-y-stack-lg max-w-7xl mx-auto">
            {/* Hero Section: Next Match */}
            <section className="relative w-full rounded-xl overflow-hidden glass-panel luminous-shadow inner-glow p-6 md:p-8 transition-all duration-300 border border-outline-variant/20 min-h-[calc(100vh-7.5rem)] flex flex-col justify-between">
                {/* Background image for hero under overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover opacity-15"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpSmfYgTBJ8eklkvzo5yTlQWbShh3nfTgRxCJTkG1bYIlBaxPG-INMSQnJZmxKwXZvNt2R-yenM9aN7NF5RBYvP2_-FkEx1qx527cX5dI0qOA6kdfd9xSGePzDrN2h4Qzq_0F28ubLLbdlHO7WH9C-zKVI7pnbO8skHMzqP1oFnKdzrwzdFvfDCrbmcZFO0SmrqMlGoXRgnD5WPsSVyL7ngStY-ZzHEZ0JsZGExGAwCyVtwSUk5_p2wn53hU_TjqKGt5lSg75JbV0r"
                        alt="Egerton Arena"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </div>

                {/* The Next Game Card itself: Centered at the top, Clickable, Darker background, border, attention-grabbing */}
                <div
                    onClick={onNavigateToMatchCenter}
                    className="relative z-10 w-full max-w-4xl mx-auto bg-black/60 hover:bg-black/75 rounded-2xl border border-primary/20 hover:border-rose-500/80 p-5 md:p-6 transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(0,0,0,0.7)] hover:shadow-[0_0_35px_rgba(244,63,94,0.15)] group active:scale-[0.99] flex flex-col gap-5"
                >
                    {/* Attention Economy Badges / Info */}
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10 select-none">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5">
                                🚨 CRITICAL SHOWDOWN
                            </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                            West London Premier League
                        </span>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full pb-2">
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                            <div className="flex items-center gap-6">
                                {/* Home Logo */}
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center p-3 border border-outline-variant/30 shadow-lg">
                                        <img
                                            className="w-full h-full object-contain pointer-events-none"
                                            alt="Egerton FC Crest"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
                                        />
                                    </div>
                                    <p className="mt-2 font-label-sm text-[9px] font-bold text-primary uppercase tracking-widest">Egerton FC</p>
                                </div>

                                {/* VS Indicator */}
                                <div className="text-center px-2">
                                    <span className="text-3xl font-black text-on-surface opacity-30 italic">VS</span>
                                    <div className="mt-1 font-mono text-[9px] text-on-surface-variant font-bold tracking-[0.25em] uppercase">MATCHDAY 24</div>
                                </div>

                                {/* Away Logo */}
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center p-3 border border-outline-variant/30 shadow-lg">
                                        <img
                                            className="w-full h-full object-contain pointer-events-none"
                                            alt="Kingsley United Crest"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFhXXRDKFY04YZjn56uxD6P9Xir8Bb1s-8o1zh1JY6WZDBReq2LfJ8yh2LONNrsWbfuVvyFmxm9j2LeQP6wnZSgkRH5XQdQkaVLoC9SWYJ1qTn3GEl5imBB34TuO_EeqtOZyKIy4NooG7A60DL0Ph39bqGKXv49KMMoR1jRd5p7AfRXCiW5XFREvezpvV4Rs0joXr6SN83wLsA-JincLbUw8KJAh-qjooeaRy1RQt9NCIibiL5JuNwDSkB0y11FMr8uzGZbbNppYhp"
                                        />
                                    </div>
                                    <p className="mt-2 font-label-sm text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Kingsley Utd</p>
                                </div>
                            </div>

                            <div className="hidden sm:block h-12 w-[1px] bg-outline-variant/20 mx-2"></div>

                            {/* Smaller Details */}
                            <div className="flex flex-col items-center sm:items-start gap-1.5 text-on-surface-variant text-[11px] font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[13px] text-primary">calendar_today</span>
                                    <span>Saturday, 24th Oct</span>
                                    <span className="opacity-30">|</span>
                                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                                    <span>15:00 GMT</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                                    <span>Egerton Arena, Central Manchester</span>
                                </span>
                            </div>
                        </div>

                        {/* Kick-off Countdown */}
                        <div className="bg-background/40 backdrop-blur-md rounded-xl p-4 border border-outline-variant/20 flex flex-col items-center min-w-[200px] w-full lg:w-auto">
                            <p className="font-label-sm text-[9px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">KICK-OFF COUNTDOWN</p>
                            <div className="flex gap-2 text-primary font-mono font-black text-xl">
                                <span>{fd(timeLeft.days)}</span>
                                <span className="opacity-40 animate-pulse">:</span>
                                <span>{fd(timeLeft.hours)}</span>
                                <span className="opacity-40 animate-pulse">:</span>
                                <span>{fd(timeLeft.minutes)}</span>
                                <span className="opacity-40 animate-pulse">:</span>
                                <span>{fd(timeLeft.seconds)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Centered actions at bottom of next match card */}
                    <div className="flex justify-center pt-2 select-none border-t border-white/5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToMatchCenter();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-10 rounded-full flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.35)] hover:shadow-[0_0_25px_rgba(225,29,72,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all text-[11px] uppercase tracking-widest cursor-pointer border border-rose-500/20"
                        >
                            <span className="material-symbols-outlined text-[16px] font-black">sports_soccer</span>
                            Enter Tactical Match Plan Center
                        </button>
                    </div>
                </div>

                {/* Hello and team name in the middle of page */}
                <div className="relative z-10 flex flex-col items-center justify-center py-8 my-auto select-none">
                    <h1 className="text-4xl md:text-6xl font-black tracking-widest text-center uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-on-surface to-surface-variant drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-fade-in">
                        Hello Egerton FC
                    </h1>
                </div>

                {/* Form & Squad Health Strip at the bottom of Hero Section */}
                <div className="relative z-10 w-full border-t border-outline-variant/15 pt-6 mt-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {/* League Info & Form */}
                        <div className="col-span-1 md:col-span-2 glass-panel rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Current League</span>
                                    <span className="font-headline-md text-headline-md font-bold text-on-surface">National Division One</span>
                                </div>
                                <div className="h-10 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Position</span>
                                    <span className="font-headline-md text-headline-md text-primary font-bold">2nd <span className="text-body-md text-on-surface-variant font-normal">/ 24</span></span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mr-2">Form</span>
                                {/* Form Indicators */}
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center" title="Win">
                                        <span className="material-symbols-outlined text-emerald-400 text-[18px] font-bold">check</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center" title="Win">
                                        <span className="material-symbols-outlined text-emerald-400 text-[18px] font-bold">check</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center" title="Draw">
                                        <span className="material-symbols-outlined text-amber-400 text-[18px] font-bold">remove</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center" title="Win">
                                        <span className="material-symbols-outlined text-emerald-400 text-[18px] font-bold">check</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center" title="Loss">
                                        <span className="material-symbols-outlined text-rose-400 text-[18px] font-bold">close</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center" title="Win">
                                        <span className="material-symbols-outlined text-emerald-400 text-[18px] font-bold">check</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Squad Quick Action */}
                        <div className="glass-panel rounded-xl p-6 flex items-center justify-between border-l-4 border-primary">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Squad Health</span>
                                <span className="font-headline-md text-headline-md font-bold text-on-surface">94% Fit</span>
                            </div>
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high overflow-hidden shadow">
                                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8Li0adYRQcho3yviz-jXLtvSbm31HoDarilefD50f8XPmkVXetKyZB4Jn52o39kofJna9hEpmuWEQSCmxGtspztaz2fEIGhWObti73Lc0yt-c9fJ3BWu5o8_QU57yCqQ8bVzeKaGMryfKPXtpaL_zII0gqE5xjePxuEcNbY6ophh0kFN-IMHzH6jQ_tlAEvdlW4KXeDTbByvhPLDfSqskkpDVtE74oH9diEwgfVzmQMOy7fsNfMNDicwaoaf3CdCqZnwIxGnq_9VS" alt="Player 1" />
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high overflow-hidden shadow">
                                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCw4JhYTmfFfoqvb6Mb3bQqiJ8y5Q-CZAA5noRZgeKEwGyta-iFD-tL3AsWbC0F1AT3LiSLeZt1DzeFfcsjRQwLkE40R_9FFeBSC4OWmkKVDfRvPeLThIgJhMFSGWCYKhBdW3VdnuqY3m1RLnFqZTqDVkxO0ulvxSfCrP9rvalZLZIg8AjXG1xQLJJOg_p0bAhrPSeqW1l6ZHhFQhyXsJwFA-nAYo9jm309TilSelexiQNfFJZsaoU2jjfhQy-ocTd5bzyLKwk2fFxz" alt="Player 2" />
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-surface bg-surface-container-high overflow-hidden shadow">
                                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrr6SC9TgLfKChWdxfl02QcKBZXDk0vC-C2kCp-st0wVtxyCbm-_iU6z0dMIGslsy71YiftPwxrnbHurkG12ph1BULK2eo7yHTjFApHoVB0ZTxJdbp8BU8dDxvlT16TlQn9xvNDmuidIOpNma0lQYgYRatcc1j0dMO4W713lSPxtG_ivGHg0yBsMMxYZGmlO3dXhlKU9RjP1KLKvhnH-ASciX9Es7UNSb98P4_AWbummiEstPPk8VZuaIhkWT4Q2zxEZCAuwslqxKj" alt="Player 3" />
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-surface bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
                                    +17
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Training & Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                {/* Training Schedule */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Training Sessions</h2>
                        <button className="text-primary hover:underline text-xs font-bold uppercase tracking-wider cursor-pointer">Full Schedule</button>
                    </div>

                    {/* Session Card 1 */}
                    <div className="glass-panel rounded-xl p-5 hover:bg-white/5 transition-all cursor-pointer group border border-outline-variant/15">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                    <span className="material-symbols-outlined text-2xl">fitness_center</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Tactical Drills</h3>
                                    <p className="text-on-surface-variant text-xs mt-1">Pitch 3 • 10:00 - 12:30</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-primary font-bold block tracking-wider">TOMORROW</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant font-medium">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-primary">groups</span> 24 Players</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-primary">person</span> Coach Marcus</span>
                        </div>
                    </div>

                    {/* Session Card 2 */}
                    <div className="glass-panel rounded-xl p-5 hover:bg-white/5 transition-all cursor-pointer group border border-outline-variant/15">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
                                    <span className="material-symbols-outlined text-2xl">analytics</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Video Strategy Analysis</h3>
                                    <p className="text-on-surface-variant text-xs mt-1">Briefing Room • 14:00</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">Oct 26</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant font-medium">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-secondary">groups</span> First XI Only</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-secondary">person</span> Analyst Team</span>
                        </div>
                    </div>
                </div>

                {/* Performance Stats Bento widget */}
                <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-4 flex items-center justify-between mb-2">
                        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Quick Analytics</h2>
                        <span className="text-xs text-on-surface-variant font-medium">Last 30 Days</span>
                    </div>

                    {/* Stat 1 */}
                    <div className="bento-card rounded-xl p-6 flex flex-col justify-between aspect-square md:aspect-auto">
                        <span className="material-symbols-outlined text-primary text-3xl">sports_soccer</span>
                        <div>
                            <span className="text-display-md font-display-md block font-black text-on-surface">2.4</span>
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Goals / Match</span>
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="bento-card rounded-xl p-6 flex flex-col justify-between aspect-square md:aspect-auto">
                        <span className="material-symbols-outlined text-primary text-3xl">shield</span>
                        <div>
                            <span className="text-display-md font-display-md block font-black text-on-surface">12</span>
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Clean Sheets</span>
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bento-card rounded-xl p-6 flex flex-col justify-between col-span-2 md:col-span-2 relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-[80px]">trending_up</span>
                        </div>
                        <div>
                            <span className="material-symbols-outlined text-primary text-3xl mb-2">speed</span>
                            <div className="flex items-end gap-2">
                                <span className="text-display-md font-display-md block font-black text-on-surface">88%</span>
                                <span className="text-emerald-400 text-xs font-bold mb-2">+4%</span>
                            </div>
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pass Accuracy</span>
                        </div>
                        <div className="mt-4 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '88%' }}></div>
                        </div>
                    </div>

                    {/* Large Projections Card */}
                    <div className="col-span-2 md:col-span-4 bento-card rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                        <div className="z-10 flex-1">
                            <h4 className="font-headline-md text-sm font-bold text-on-surface mb-2">Season Projections & Predictions</h4>
                            <p className="text-on-surface-variant text-xs mb-4 max-w-md leading-relaxed">
                                Based on current trajectory, the squad is projected to finish with 84 points, securing an automatic promotion spot in the division league.
                            </p>
                            <button className="border border-primary text-primary hover:bg-primary hover:text-on-primary font-bold text-xs uppercase tracking-wider py-2 px-6 rounded-full transition-colors cursor-pointer">
                                Detailed Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
