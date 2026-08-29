import React, { useState } from 'react';
import type { Match, Player } from '../../types';

interface LineupsProps {
    match: Match;
}

export const Lineups: React.FC<LineupsProps> = ({ match }) => {
    const { lineups, teamA, teamB } = match;
    const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');

    const startersA = (lineups?.teamA || []).filter(p => !p.isSub);
    const subsA = (lineups?.teamA || []).filter(p => p.isSub);
    const startersB = (lineups?.teamB || []).filter(p => !p.isSub);
    const subsB = (lineups?.teamB || []).filter(p => p.isSub);

    // Grouping for pitch formation
    const groupStarters = (players: Player[]) => ({
        GK: players.filter(p => p.position === 'GK'),
        DEF: players.filter(p => p.position === 'DEF'),
        MID: players.filter(p => p.position === 'MID'),
        FWD: players.filter(p => p.position === 'FWD'),
    });

    const groupedA = groupStarters(startersA);
    const groupedB = groupStarters(startersB);

    const renderPitchPlayer = (player: Player, xPct: number, yPct: number, teamColor: string, isAway = false) => {
        return (
            <div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10 select-none cursor-pointer"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
                {/* Node with Jersey Number & Captain Tag */}
                <div className="relative">
                    <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center font-black font-mono text-[11px] text-white shadow-md"
                        style={{ backgroundColor: teamColor || (isAway ? '#1565c0' : '#ff0046') }}
                    >
                        {player.number}
                    </div>

                    {player.isCaptain && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-xs font-mono font-black text-[8px] shadow-xs text-black bg-amber-400">
                            C
                        </span>
                    )}
                </div>

                {/* Surname */}
                <span className="text-[9px] sm:text-[10px] font-bold text-white bg-black/75 px-1.5 py-0.2 rounded-xs truncate max-w-[65px] text-center shadow-xs mt-0.5">
                    {player.name.split(' ').pop()}
                </span>
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. FORMATION BAR (TEAM A vs TEAM B) */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm text-xs font-extrabold shadow-xs">
                <div className="flex items-center gap-2">
                    <img src={teamA.logo} alt={teamA.name} className="w-4 h-4 rounded-full" />
                    <span className="text-slate-900 dark:text-white truncate max-w-[120px]">{teamA.name}</span>
                    <span className="font-mono text-slate-500 font-bold">({lineups?.formationA || '4-3-3'})</span>
                </div>

                {/* Pitch / List view toggle */}
                <div className="flex items-center gap-1 bg-[#f0f2f5] dark:bg-[#14263b] p-0.5 rounded-full">
                    <button
                        type="button"
                        onClick={() => setViewMode('pitch')}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                            viewMode === 'pitch' ? 'bg-[#ff0046] text-white' : 'text-slate-500'
                        }`}
                    >
                        Pitch
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                            viewMode === 'list' ? 'bg-[#ff0046] text-white' : 'text-slate-500'
                        }`}
                    >
                        List
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">({lineups?.formationB || '4-3-3'})</span>
                    <span className="text-slate-900 dark:text-white truncate max-w-[120px]">{teamB.name}</span>
                    <img src={teamB.logo} alt={teamB.name} className="w-4 h-4 rounded-full" />
                </div>
            </div>

            {/* 2. TACTICAL PITCH VISUALIZER */}
            {viewMode === 'pitch' && (
                <div className="relative w-full max-w-lg mx-auto aspect-[3/4] sm:aspect-[4/5] rounded-none sm:rounded-sm overflow-hidden border border-[#e6e8ec] dark:border-[#1a2e45] bg-[#1a472a] select-none shadow-md">
                    {/* Pitch Turf Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1f4e2e_0%,#1f4e2e_10%,#194326_10%,#194326_20%,#1f4e2e_20%,#1f4e2e_30%,#194326_30%,#194326_40%,#1f4e2e_40%,#1f4e2e_50%,#194326_50%,#194326_60%,#1f4e2e_60%,#1f4e2e_70%,#194326_70%,#194326_80%,#1f4e2e_80%,#1f4e2e_90%,#194326_90%,#194326_100%)]" />

                    {/* Markings */}
                    <div className="absolute inset-3 border border-white/30 pointer-events-none" />
                    <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-white/30 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/30 rounded-full pointer-events-none" />
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-14 border border-white/30 pointer-events-none" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-14 border border-white/30 pointer-events-none" />

                    {/* Away Team Players (Top Half) */}
                    {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                        const rowY: Record<string, number> = { GK: 9, DEF: 22, MID: 35, FWD: 44 };
                        const players = groupedB[pos];
                        return players.map((p, idx) => {
                            const xVal = ((idx + 1) / (players.length + 1)) * 100;
                            return renderPitchPlayer(p, xVal, rowY[pos], teamB.colorCode, true);
                        });
                    })}

                    {/* Home Team Players (Bottom Half) */}
                    {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                        const rowY: Record<string, number> = { GK: 91, DEF: 78, MID: 65, FWD: 56 };
                        const players = groupedA[pos];
                        return players.map((p, idx) => {
                            const xVal = ((idx + 1) / (players.length + 1)) * 100;
                            return renderPitchPlayer(p, xVal, rowY[pos], teamA.colorCode, false);
                        });
                    })}
                </div>
            )}

            {/* 3. STARTING LINEUPS 2-COLUMN SIDE-BY-SIDE LIST */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    STARTING LINEUPS
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#f0f2f5] dark:divide-[#14263b]">
                    {/* Home Starting 11 */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {startersA.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">No starting XI available</div>
                        ) : (
                            startersA.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-4">{p.number}</span>
                                        <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className="font-mono font-bold text-[10px] text-slate-500 uppercase">
                                        {p.position}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Away Starting 11 */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {startersB.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">No starting XI available</div>
                        ) : (
                            startersB.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-4">{p.number}</span>
                                        <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className="font-mono font-bold text-[10px] text-slate-500 uppercase">
                                        {p.position}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 4. SUBSTITUTES SECTION */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    SUBSTITUTES
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#f0f2f5] dark:divide-[#14263b]">
                    {/* Home Subs */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {subsA.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">No substitutes listed</div>
                        ) : (
                            subsA.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-4">{p.number}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{p.position}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Away Subs */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {subsB.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">No substitutes listed</div>
                        ) : (
                            subsB.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-4">{p.number}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{p.position}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 5. COACHES ROW */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    COACHES
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#f0f2f5] dark:divide-[#14263b] p-3 text-xs">
                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                        {teamA.coachName || `Coach ${teamA.name}`}
                    </div>
                    <div className="font-extrabold text-slate-900 dark:text-white pl-3 truncate">
                        {teamB.coachName || `Coach ${teamB.name}`}
                    </div>
                </div>
            </div>
        </div>
    );
};

