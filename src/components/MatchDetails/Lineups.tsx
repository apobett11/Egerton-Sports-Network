import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import type { Match, Player } from '../../types';

interface LineupsProps {
    match: Match;
}

export const Lineups: React.FC<LineupsProps> = ({ match }) => {
    const { lineups, teamA, teamB } = match;
    const [activeTeamView, setActiveTeamView] = useState<'both' | 'teamA' | 'teamB'>('both');

    // Filter starters & subs
    const startersA = lineups.teamA.filter(p => !p.isSub);
    const subsA = lineups.teamA.filter(p => p.isSub);

    const startersB = lineups.teamB.filter(p => !p.isSub);
    const subsB = lineups.teamB.filter(p => p.isSub);

    // Group helpers
    const groupStarters = (players: Player[]) => {
        return {
            GK: players.filter(p => p.position === 'GK'),
            DEF: players.filter(p => p.position === 'DEF'),
            MID: players.filter(p => p.position === 'MID'),
            FWD: players.filter(p => p.position === 'FWD'),
        };
    };

    const groupedA = groupStarters(startersA);
    const groupedB = groupStarters(startersB);

    // Render a player on the pitch
    const renderPitchPlayer = (player: Player, xPct: number, yPct: number, teamColor: string) => {
        // Check if player has events in match (e.g. goal, yellow, red card)
        const playerEvents = match.events.filter(e => e.playerId === player.id);
        const hasGoal = playerEvents.some(e => e.type === 'goal');
        const hasYellow = playerEvents.some(e => e.type === 'yellow');
        const hasRed = playerEvents.some(e => e.type === 'red');

        return (
            <div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10 cursor-pointer hover:scale-110 transition-transform"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
                {/* Jersey Node */}
                <div
                    className="relative w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center font-black font-mono text-xs text-white shadow-lg"
                    style={{ backgroundColor: teamColor || '#059669' }}
                >
                    {player.number}

                    {/* Captain Badge */}
                    {player.isCaptain && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border border-amber-600 text-slate-950 rounded-full flex items-center justify-center font-black text-[8px] select-none shadow-xs">
                            C
                        </span>
                    )}

                    {/* Event indicators */}
                    <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                        {hasGoal && <span className="text-[10px]">⚽</span>}
                        {hasYellow && <span className="w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs block shadow-xs" />}
                        {hasRed && <span className="w-2.5 h-3.5 bg-red-600 border border-red-700 rounded-xs block shadow-xs" />}
                    </div>
                </div>

                {/* Name Pill */}
                <div className="px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold uppercase tracking-wide truncate max-w-[60px] text-center shadow-xs">
                    {player.name.split(' ').pop()}
                </div>
            </div>
        );
    };

    const renderTeamAStarters = () => {
        const list: React.ReactNode[] = [];
        const keys: ('GK' | 'DEF' | 'MID' | 'FWD')[] = ['GK', 'DEF', 'MID', 'FWD'];

        // Team A is at the bottom. Row y percent:
        const rowY: Record<string, number> = {
            GK: 90,
            DEF: 75,
            MID: 61,
            FWD: 51
        };

        keys.forEach(pos => {
            const players = groupedA[pos];
            players.forEach((p, idx) => {
                const count = players.length;
                const xVal = ((idx + 1) / (count + 1)) * 100;
                list.push(renderPitchPlayer(p, xVal, rowY[pos], teamA.colorCode));
            });
        });

        return list;
    };

    const renderTeamBStarters = () => {
        const list: React.ReactNode[] = [];
        const keys: ('GK' | 'DEF' | 'MID' | 'FWD')[] = ['GK', 'DEF', 'MID', 'FWD'];

        // Team B is at the top. Row y percent (inverted):
        const rowY: Record<string, number> = {
            GK: 10,
            DEF: 25,
            MID: 39,
            FWD: 49
        };

        keys.forEach(pos => {
            const players = groupedB[pos];
            players.forEach((p, idx) => {
                const count = players.length;
                const xVal = ((idx + 1) / (count + 1)) * 100;
                list.push(renderPitchPlayer(p, xVal, rowY[pos], teamB.colorCode));
            });
        });

        return list;
    };

    return (
        <div className="w-full max-w-3xl mx-auto py-6 select-none flex flex-col gap-6">
            {/* Controls */}
            <div className="flex justify-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 self-center shadow-xs">
                <button
                    type="button"
                    onClick={() => setActiveTeamView('both')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTeamView === 'both'
                        ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Full Tactical Pitch
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTeamView('teamA')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTeamView === 'teamA'
                        ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    {teamA.shortName} Formation
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTeamView('teamB')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTeamView === 'teamB'
                        ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    {teamB.shortName} Formation
                </button>
            </div>

            {/* Formations layout label */}
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                    {teamA.name} ({lineups.formationA})
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                    {teamB.name} ({lineups.formationB})
                </span>
            </div>

            {/* Pitch Container & Markings */}
            <div className="relative w-full max-w-md mx-auto aspect-[2/3] sm:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800 bg-[linear-gradient(to_bottom,#064e3b_0%,#064e3b_10%,#065f46_10%,#065f46_20%,#064e3b_20%,#064e3b_30%,#065f46_30%,#065f46_40%,#064e3b_40%,#064e3b_50%,#065f46_50%,#065f46_60%,#064e3b_60%,#064e3b_70%,#065f46_70%,#065f46_80%,#064e3b_80%,#064e3b_90%,#065f46_90%,#065f46_100%)] select-none">
                {/* Outer Bounds */}
                <div className="absolute inset-4 border-2 border-white/30 pointer-events-none" />

                {/* Center Line */}
                <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/30 -translate-y-1/2 pointer-events-none" />

                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full pointer-events-none" />

                {/* Penalty Box (Top - Away) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-2 border-white/30 pointer-events-none" />

                {/* Penalty Box (Bottom - Home) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-[15%] border-2 border-white/30 pointer-events-none" />

                {/* Render Players */}
                {(activeTeamView === 'both' || activeTeamView === 'teamA') && renderTeamAStarters()}
                {(activeTeamView === 'both' || activeTeamView === 'teamB') && renderTeamBStarters()}
            </div>

            {/* Substitutes Section */}
            <div className="space-y-6 pt-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2 px-1">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Official Substitutes & Bench
                </h4>

                {/* Team A Bench */}
                <div className="bg-white dark:bg-[#0E1424] p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{teamA.name} Substitutes</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subsA.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-black flex items-center justify-center text-xs">
                                        {player.number}
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{player.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {player.position}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team B Bench */}
                <div className="bg-white dark:bg-[#0E1424] p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{teamB.name} Substitutes</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subsB.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-black flex items-center justify-center text-xs">
                                        {player.number}
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{player.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {player.position}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
