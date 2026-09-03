import React, { useState } from 'react';
import { X, User, MessageSquare } from 'lucide-react';
import type { Match, Player } from '../../types';

interface LineupsProps {
    match: Match;
}

export const Lineups: React.FC<LineupsProps> = ({ match }) => {
    const { lineups, teamA, teamB, events = [] } = match;
    const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
    const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; team: typeof teamA } | null>(null);

    const startersA = (lineups?.teamA || []).filter(p => !p.isSub);
    const subsA = (lineups?.teamA || []).filter(p => p.isSub);
    const startersB = (lineups?.teamB || []).filter(p => !p.isSub);
    const subsB = (lineups?.teamB || []).filter(p => p.isSub);

    // Grouping for pitch formation with guaranteed distribution
    const distributeStarters = (players: Player[]) => {
        if (players.length === 0) {
            return { GK: [], DEF: [], MID: [], FWD: [] };
        }

        let gk = players.filter(p => p.position === 'GK');
        let def = players.filter(p => p.position === 'DEF');
        let mid = players.filter(p => p.position === 'MID');
        let fwd = players.filter(p => p.position === 'FWD');

        // If no GK tagged, pick player #1 or the very first player
        if (gk.length === 0) {
            const firstGkCandidate = players.find(p => p.number === 1) || players[0];
            gk = [firstGkCandidate];
            const remaining = players.filter(p => p.id !== firstGkCandidate.id);
            def = remaining.filter(p => p.position === 'DEF');
            mid = remaining.filter(p => p.position === 'MID');
            fwd = remaining.filter(p => p.position === 'FWD');

            // If still missing lines, fallback distribute evenly
            if (def.length === 0 && mid.length === 0 && fwd.length === 0) {
                def = remaining.slice(0, 4);
                mid = remaining.slice(4, 7);
                fwd = remaining.slice(7, 10);
            }
        }

        return { GK: gk, DEF: def, MID: mid, FWD: fwd };
    };

    const groupedA = distributeStarters(startersA);
    const groupedB = distributeStarters(startersB);

    const getPositionBadgeClass = (pos: string) => {
        switch (pos) {
            case 'GK':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'DEF':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'MID':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
            case 'FWD':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            default:
                return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
        }
    };

    const renderPitchPlayer = (player: Player, xPct: number, yPct: number, teamColor: string, teamObj: typeof teamA, isAway = false) => {
        return (
            <div
                key={player.id}
                onClick={() => setSelectedPlayer({ player, team: teamObj })}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10 select-none cursor-pointer transition-transform hover:scale-115 active:scale-95"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                title={`${player.name} (#${player.number}) - Click for details`}
            >
                {/* Node with Jersey Number & Captain Tag */}
                <div className="relative">
                    <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center font-black font-mono text-[11px] text-white shadow-md transition-shadow hover:shadow-lg"
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
                <span className="text-[9px] sm:text-[10px] font-bold text-white bg-black/80 px-1.5 py-0.2 rounded-xs truncate max-w-[65px] text-center shadow-xs mt-0.5">
                    {player.name.split(' ').pop()}
                </span>
            </div>
        );
    };

    // Calculate events for selected player
    const selectedPlayerGoals = selectedPlayer ? events.filter(e => e.playerId === selectedPlayer.player.id && (e.type === 'goal' || e.type === 'penalty')).length : 0;
    const selectedPlayerYellows = selectedPlayer ? events.filter(e => e.playerId === selectedPlayer.player.id && e.type === 'yellow').length : 0;
    const selectedPlayerReds = selectedPlayer ? events.filter(e => e.playerId === selectedPlayer.player.id && e.type === 'red').length : 0;

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. FORMATION BAR (TEAM A vs TEAM B) */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm text-xs font-extrabold shadow-xs">
                <div className="flex items-center gap-2">
                    <img src={teamA.logo} alt={teamA.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
                    <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">{teamA.name}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">({lineups?.formationA || '4-3-3'})</span>
                </div>

                {/* Pitch / List view toggle */}
                <div className="flex items-center gap-1 bg-[#f0f2f5] dark:bg-[#14263b] p-0.5 rounded-full">
                    <button
                        type="button"
                        onClick={() => setViewMode('pitch')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            viewMode === 'pitch' ? 'bg-[#ff0046] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Pitch
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            viewMode === 'list' ? 'bg-[#ff0046] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        List
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">({lineups?.formationB || '4-3-3'})</span>
                    <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px] text-right">{teamB.name}</span>
                    <img src={teamB.logo} alt={teamB.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
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
                            return renderPitchPlayer(p, xVal, rowY[pos], teamB.colorCode, teamB, true);
                        });
                    })}

                    {/* Home Team Players (Bottom Half) */}
                    {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                        const rowY: Record<string, number> = { GK: 91, DEF: 78, MID: 65, FWD: 56 };
                        const players = groupedA[pos];
                        return players.map((p, idx) => {
                            const xVal = ((idx + 1) / (players.length + 1)) * 100;
                            return renderPitchPlayer(p, xVal, rowY[pos], teamA.colorCode, teamA, false);
                        });
                    })}
                </div>
            )}

            {/* 3. STARTING LINEUPS 2-COLUMN SIDE-BY-SIDE LIST */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    <span>STARTING LINEUPS</span>
                    <span className="text-[10px] font-semibold text-slate-400 lowercase">Tap player for profile</span>
                </div>

                <div className="grid grid-cols-2 divide-x divide-[#f0f2f5] dark:divide-[#14263b]">
                    {/* Home Starting 11 */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {startersA.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">No starting XI recorded</div>
                        ) : (
                            startersA.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPlayer({ player: p, team: teamA })}
                                    className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-black text-slate-400 w-5">{p.number}</span>
                                        <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-black bg-amber-400 text-black shadow-xs">C</span>
                                        )}
                                    </div>
                                    <span className={`font-mono font-black text-[9px] px-1.5 py-0.5 rounded-sm uppercase ${getPositionBadgeClass(p.position)}`}>
                                        {p.position}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Away Starting 11 */}
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {startersB.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">No starting XI recorded</div>
                        ) : (
                            startersB.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPlayer({ player: p, team: teamB })}
                                    className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-black text-slate-400 w-5">{p.number}</span>
                                        <span className="font-bold text-slate-900 dark:text-white truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-black bg-amber-400 text-black shadow-xs">C</span>
                                        )}
                                    </div>
                                    <span className={`font-mono font-black text-[9px] px-1.5 py-0.5 rounded-sm uppercase ${getPositionBadgeClass(p.position)}`}>
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
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPlayer({ player: p, team: teamA })}
                                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-5">{p.number}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${getPositionBadgeClass(p.position)}`}>
                                        {p.position}
                                    </span>
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
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPlayer({ player: p, team: teamB })}
                                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-slate-400 w-5">{p.number}</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                        {p.isCaptain && (
                                            <span className="px-1 py-0.2 rounded-xs text-[9px] font-black bg-amber-400 text-black">C</span>
                                        )}
                                    </div>
                                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${getPositionBadgeClass(p.position)}`}>
                                        {p.position}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 5. COACHES ROW */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    HEAD COACHES
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#f0f2f5] dark:divide-[#14263b] p-3 text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white truncate">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{teamA.coachName || `Coach ${teamA.name}`}</span>
                    </div>
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white pl-3 truncate">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{teamB.coachName || `Coach ${teamB.name}`}</span>
                    </div>
                </div>
            </div>

            {/* 6. CAPTAIN'S TACTICAL STATEMENTS (IF AVAILABLE) */}
            {(match.captainNotesA || match.captainNotesB) && (
                <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 tracking-wider">
                        <MessageSquare className="w-4 h-4" />
                        <span>Captain's Tactical Notes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {match.captainNotesA && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-sm border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                    {teamA.name} ({match.teamA.captainName || 'Captain'}):
                                </span>
                                <p className="italic text-slate-600 dark:text-slate-300 font-serif">
                                    "{match.captainNotesA}"
                                </p>
                            </div>
                        )}
                        {match.captainNotesB && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-sm border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                    {teamB.name} ({match.teamB.captainName || 'Captain'}):
                                </span>
                                <p className="italic text-slate-600 dark:text-slate-300 font-serif">
                                    "{match.captainNotesB}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 7. INTERACTIVE PLAYER DETAILS MODAL */}
            {selectedPlayer && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setSelectedPlayer(null)}
                >
                    <div
                        className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1a2e45] pb-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black font-mono text-sm shadow-md"
                                    style={{ backgroundColor: selectedPlayer.team.colorCode || '#ff0046' }}
                                >
                                    {selectedPlayer.player.number}
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span>{selectedPlayer.player.name}</span>
                                        {selectedPlayer.player.isCaptain && (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-400 text-black">
                                                CAPTAIN
                                            </span>
                                        )}
                                    </h4>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                                        {selectedPlayer.team.name}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedPlayer(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Player Specs */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Position</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                    {selectedPlayer.player.position === 'GK' ? 'Goalkeeper' :
                                     selectedPlayer.player.position === 'DEF' ? 'Defender' :
                                     selectedPlayer.player.position === 'MID' ? 'Midfielder' : 'Forward'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                    {selectedPlayer.player.isSub ? 'Substitute (Bench)' : 'Starting 11 (Pitch)'}
                                </span>
                            </div>
                        </div>

                        {/* Matchday Stats in this game */}
                        <div className="border border-slate-100 dark:border-[#1a2e45] rounded-lg p-3 text-xs space-y-1.5">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Match Involvements
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                                <span>⚽ Goals Scored:</span>
                                <span className="font-black font-mono">{selectedPlayerGoals}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                                <span>🟨 Yellow Cards:</span>
                                <span className="font-black font-mono">{selectedPlayerYellows}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                                <span>🟥 Red Cards:</span>
                                <span className="font-black font-mono">{selectedPlayerReds}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedPlayer(null)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-black uppercase text-slate-800 dark:text-white cursor-pointer transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

