import React, { useState } from 'react';
import {
    X,
    User,
    MessageSquare,
    Crown,
    Zap,
    Target,
    CornerDownRight,
    CornerDownLeft,
    ChevronDown,
    ChevronUp,
    Users,
} from 'lucide-react';
import type { Match, Player } from '../../types';

interface LineupsProps {
    match: Match;
}

// Derive standard 5 in-match set piece & leadership roles for a squad
const getTeamInMatchRoles = (starters: Player[], subs: Player[]) => {
    const captain = starters.find(p => p.isCaptain) || starters[0] || subs[0] || null;
    const penalty = starters.find(p => p.position === 'FWD') || captain || starters[0];
    const freeKick = starters.find(p => p.position === 'MID' && p.id !== captain?.id) || starters[1] || captain;
    const rightCorner = starters.find(p => (p.position === 'MID' || p.position === 'FWD') && p.id !== captain?.id && p.id !== freeKick?.id) || starters[2] || captain;
    const leftCorner = starters.find(p => p.position === 'MID' && p.id !== captain?.id && p.id !== rightCorner?.id) || starters[3] || captain;

    return [
        {
            id: 'captain',
            label: 'Team Captain',
            desc: 'Matchday captain & referee consultation',
            icon: Crown,
            iconColor: 'text-amber-400',
            bgGlow: 'bg-amber-500/10 border-amber-500/30',
            player: captain,
        },
        {
            id: 'penalty',
            label: 'Penalty Taker',
            desc: 'Primary 1st choice penalty taker',
            icon: Zap,
            iconColor: 'text-rose-400',
            bgGlow: 'bg-rose-500/10 border-rose-500/30',
            player: penalty,
        },
        {
            id: 'free_kick',
            label: 'Free Kick Specialist',
            desc: 'Direct & perimeter dead-ball specialist',
            icon: Target,
            iconColor: 'text-blue-400',
            bgGlow: 'bg-blue-500/10 border-blue-500/30',
            player: freeKick,
        },
        {
            id: 'right_corner',
            label: 'Right Corner Specialist',
            desc: 'Right side corner delivery & inswingers',
            icon: CornerDownRight,
            iconColor: 'text-emerald-400',
            bgGlow: 'bg-emerald-500/10 border-emerald-500/30',
            player: rightCorner,
        },
        {
            id: 'left_corner',
            label: 'Left Corner Specialist',
            desc: 'Left side corner delivery & outswingers',
            icon: CornerDownLeft,
            iconColor: 'text-purple-400',
            bgGlow: 'bg-purple-500/10 border-purple-500/30',
            player: leftCorner,
        },
    ];
};

export const Lineups: React.FC<LineupsProps> = ({ match }) => {
    const { lineups, teamA, teamB, events = [] } = match;
    const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
    const [capsuleFilter, setCapsuleFilter] = useState<'both' | 'home' | 'away'>('both');
    const [showReserves, setShowReserves] = useState(false);
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; team: typeof teamA } | null>(null);

    // Strict partition: First 11 Starters, 6 Substitutes, and remaining in Reserves
    const rawA = lineups?.teamA || [];
    const startersA = rawA.filter(p => !p.isSub && !p.isReserve).slice(0, 11);
    const startersIdSetA = new Set(startersA.map(p => p.id));
    const remainingA = rawA.filter(p => !startersIdSetA.has(p.id));
    const subsA = remainingA.slice(0, 6);
    const reservesA = remainingA.slice(6);

    const rawB = lineups?.teamB || [];
    const startersB = rawB.filter(p => !p.isSub && !p.isReserve).slice(0, 11);
    const startersIdSetB = new Set(startersB.map(p => p.id));
    const remainingB = rawB.filter(p => !startersIdSetB.has(p.id));
    const subsB = remainingB.slice(0, 6);
    const reservesB = remainingB.slice(6);

    // In-Match Roles for each team
    const rolesA = getTeamInMatchRoles(startersA, subsA);
    const rolesB = getTeamInMatchRoles(startersB, subsB);

    // Super Eagles coach reflection (Head Coach named The Special One)
    const coachNameA = teamA.name.toLowerCase().includes('super eagle')
        ? 'The Special One'
        : (teamA.coachName || `Coach ${teamA.name}`);
    const coachNameB = teamB.name.toLowerCase().includes('super eagle')
        ? 'The Special One'
        : (teamB.coachName || `Coach ${teamB.name}`);

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

    const renderPlayerRow = (p: Player, teamObj: typeof teamA) => (
        <div
            key={p.id}
            onClick={() => setSelectedPlayer({ player: p, team: teamObj })}
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
    );

    const showRolesForA = capsuleFilter === 'both' || capsuleFilter === 'home';
    const showRolesForB = capsuleFilter === 'both' || capsuleFilter === 'away';

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. TOP CAPSULE NAVIGATION BAR: 3 BUTTONS (BOTH, HOME, AWAY) + IN-MATCH ROLES BUTTON */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl shadow-xs">
                {/* 3 Buttons Capsule */}
                <div className="inline-flex items-center p-1 bg-[#f0f2f5] dark:bg-[#14263b] rounded-full border border-slate-200 dark:border-[#1a2e45] self-center sm:self-auto shadow-inner max-w-full overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setCapsuleFilter('both')}
                        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
                            capsuleFilter === 'both'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Both
                    </button>
                    <button
                        type="button"
                        onClick={() => setCapsuleFilter('home')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            capsuleFilter === 'home'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <img src={teamA.logo} alt={teamA.name} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                        <span className="truncate max-w-[110px]">{teamA.name}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setCapsuleFilter('away')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            capsuleFilter === 'away'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <img src={teamB.logo} alt={teamB.name} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                        <span className="truncate max-w-[110px]">{teamB.name}</span>
                    </button>
                </div>

                {/* In-Match Roles Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsRolesModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                >
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>
                        {capsuleFilter === 'both'
                            ? 'In-Match Roles (Both)'
                            : capsuleFilter === 'home'
                            ? `Roles: ${teamA.name}`
                            : `Roles: ${teamB.name}`}
                    </span>
                </button>
            </div>

            {/* 2. FORMATION BAR & PITCH/LIST TOGGLE */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm text-xs font-extrabold shadow-xs">
                {(capsuleFilter === 'both' || capsuleFilter === 'home') && (
                    <div className="flex items-center gap-2">
                        <img src={teamA.logo} alt={teamA.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
                        <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">{teamA.name}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">({lineups?.formationA || '4-3-3'})</span>
                    </div>
                )}

                {/* Pitch / List view toggle */}
                <div className="flex items-center gap-1 bg-[#f0f2f5] dark:bg-[#14263b] p-0.5 rounded-full mx-auto">
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

                {(capsuleFilter === 'both' || capsuleFilter === 'away') && (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">({lineups?.formationB || '4-3-3'})</span>
                        <span className="text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px] text-right">{teamB.name}</span>
                        <img src={teamB.logo} alt={teamB.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
                    </div>
                )}
            </div>

            {/* 3. TACTICAL PITCH VISUALIZER (ADAPTIVE: BOTH TEAMS OR SOLO TEAM SIMULATION) */}
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

                    {/* SCENARIO A: BOTH TEAMS ON PITCH */}
                    {capsuleFilter === 'both' && (
                        <>
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
                        </>
                    )}

                    {/* SCENARIO B: HOME TEAM ONLY (UPRIGHT FORMATION SIMULATION) */}
                    {capsuleFilter === 'home' && (
                        (['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                            const rowY: Record<string, number> = { GK: 88, DEF: 68, MID: 45, FWD: 22 };
                            const players = groupedA[pos];
                            return players.map((p, idx) => {
                                const xVal = ((idx + 1) / (players.length + 1)) * 100;
                                return renderPitchPlayer(p, xVal, rowY[pos], teamA.colorCode, teamA, false);
                            });
                        })
                    )}

                    {/* SCENARIO C: AWAY TEAM ONLY (UPRIGHT FORMATION SIMULATION) */}
                    {capsuleFilter === 'away' && (
                        (['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
                            const rowY: Record<string, number> = { GK: 88, DEF: 68, MID: 45, FWD: 22 };
                            const players = groupedB[pos];
                            return players.map((p, idx) => {
                                const xVal = ((idx + 1) / (players.length + 1)) * 100;
                                return renderPitchPlayer(p, xVal, rowY[pos], teamB.colorCode, teamB, true);
                            });
                        })
                    )}
                </div>
            )}

            {/* 4. STARTING LINEUPS (FIRST 11) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    <span>
                        STARTING LINEUPS (FIRST 11)
                        {capsuleFilter !== 'both' && ` • ${capsuleFilter === 'home' ? teamA.name : teamB.name}`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 lowercase">Tap player for profile</span>
                </div>

                <div className={`grid ${capsuleFilter === 'both' ? 'grid-cols-2 divide-x' : 'grid-cols-1'} divide-[#f0f2f5] dark:divide-[#14263b]`}>
                    {/* Home Starting 11 */}
                    {(capsuleFilter === 'both' || capsuleFilter === 'home') && (
                        <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                            {capsuleFilter === 'both' && (
                                <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {teamA.name}
                                </div>
                            )}
                            {startersA.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">No starting XI recorded</div>
                            ) : (
                                startersA.map(p => renderPlayerRow(p, teamA))
                            )}
                        </div>
                    )}

                    {/* Away Starting 11 */}
                    {(capsuleFilter === 'both' || capsuleFilter === 'away') && (
                        <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                            {capsuleFilter === 'both' && (
                                <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {teamB.name}
                                </div>
                            )}
                            {startersB.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">No starting XI recorded</div>
                            ) : (
                                startersB.map(p => renderPlayerRow(p, teamB))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 5. SUBSTITUTES SECTION (STRICTLY 6 SUBS) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    <span>
                        SUBSTITUTES (MAX 6)
                        {capsuleFilter !== 'both' && ` • ${capsuleFilter === 'home' ? teamA.name : teamB.name}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Bench Roster</span>
                </div>

                <div className={`grid ${capsuleFilter === 'both' ? 'grid-cols-2 divide-x' : 'grid-cols-1'} divide-[#f0f2f5] dark:divide-[#14263b]`}>
                    {/* Home Subs */}
                    {(capsuleFilter === 'both' || capsuleFilter === 'home') && (
                        <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                            {capsuleFilter === 'both' && (
                                <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {teamA.name} ({subsA.length}/6)
                                </div>
                            )}
                            {subsA.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">No substitutes listed</div>
                            ) : (
                                subsA.map(p => renderPlayerRow(p, teamA))
                            )}
                        </div>
                    )}

                    {/* Away Subs */}
                    {(capsuleFilter === 'both' || capsuleFilter === 'away') && (
                        <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                            {capsuleFilter === 'both' && (
                                <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {teamB.name} ({subsB.length}/6)
                                </div>
                            )}
                            {subsB.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">No substitutes listed</div>
                            ) : (
                                subsB.map(p => renderPlayerRow(p, teamB))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 6. RESERVES EXPANDER BUTTON (BELOW THE SUBS) */}
            <div className="flex flex-col items-center gap-1 pt-1 pb-1">
                <button
                    type="button"
                    onClick={() => setShowReserves(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#14263b] dark:hover:bg-[#1f3a5a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1a2e45] text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {showReserves ? 'Hide Reserves' : 'View Reserves'} (
                        {capsuleFilter === 'both'
                            ? `${reservesA.length} Home / ${reservesB.length} Away`
                            : capsuleFilter === 'home'
                            ? `${reservesA.length} Players`
                            : `${reservesB.length} Players`}
                        )
                    </span>
                    {showReserves ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-slate-400">
                    Non-matchday reserve roster
                </span>
            </div>

            {/* 7. RESERVES EXPANDED SECTION (SHOWN WHEN BUTTON CLICKED) */}
            {showReserves && (
                <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs animate-in fade-in duration-200">
                    <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        <span>
                            RESERVES (EXTENDED SQUAD)
                            {capsuleFilter !== 'both' && ` • ${capsuleFilter === 'home' ? teamA.name : teamB.name}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Not in active 17</span>
                    </div>

                    <div className={`grid ${capsuleFilter === 'both' ? 'grid-cols-2 divide-x' : 'grid-cols-1'} divide-[#f0f2f5] dark:divide-[#14263b]`}>
                        {/* Home Reserves */}
                        {(capsuleFilter === 'both' || capsuleFilter === 'home') && (
                            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                                {capsuleFilter === 'both' && (
                                    <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        {teamA.name} Reserves ({reservesA.length})
                                    </div>
                                )}
                                {reservesA.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">No reserve players</div>
                                ) : (
                                    reservesA.map(p => renderPlayerRow(p, teamA))
                                )}
                            </div>
                        )}

                        {/* Away Reserves */}
                        {(capsuleFilter === 'both' || capsuleFilter === 'away') && (
                            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                                {capsuleFilter === 'both' && (
                                    <div className="px-3 py-1.5 bg-[#f0f2f5]/60 dark:bg-[#14263b]/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        {teamB.name} Reserves ({reservesB.length})
                                    </div>
                                )}
                                {reservesB.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">No reserve players</div>
                                ) : (
                                    reservesB.map(p => renderPlayerRow(p, teamB))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 8. HEAD COACHES ROW (REFLECTING THE SPECIAL ONE FOR SUPER EAGLES) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    HEAD COACHES
                </div>
                <div className={`grid ${capsuleFilter === 'both' ? 'grid-cols-2 divide-x' : 'grid-cols-1'} divide-[#f0f2f5] dark:divide-[#14263b] p-3 text-xs`}>
                    {(capsuleFilter === 'both' || capsuleFilter === 'home') && (
                        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white truncate">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="truncate">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">{teamA.name}</span>
                                <span className="truncate">{coachNameA}</span>
                            </div>
                        </div>
                    )}
                    {(capsuleFilter === 'both' || capsuleFilter === 'away') && (
                        <div className={`flex items-center gap-2 font-extrabold text-slate-900 dark:text-white ${capsuleFilter === 'both' ? 'pl-3' : ''} truncate`}>
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="truncate">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">{teamB.name}</span>
                                <span className="truncate">{coachNameB}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 9. CAPTAIN'S TACTICAL STATEMENTS (IF AVAILABLE) */}
            {(match.captainNotesA || match.captainNotesB) && (
                <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 tracking-wider">
                        <MessageSquare className="w-4 h-4" />
                        <span>Captain's Tactical Notes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {match.captainNotesA && (capsuleFilter === 'both' || capsuleFilter === 'home') && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-sm border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                                    {teamA.name} ({match.teamA.captainName || 'Captain'}):
                                </span>
                                <p className="italic text-slate-600 dark:text-slate-300 font-serif">
                                    "{match.captainNotesA}"
                                </p>
                            </div>
                        )}
                        {match.captainNotesB && (capsuleFilter === 'both' || capsuleFilter === 'away') && (
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

            {/* 10. IN-MATCH ROLES POPUP MODAL (FILTERED TO BOTH TEAMS OR SINGLE TEAM MATCHING TOP CAPSULE) */}
            {isRolesModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setIsRolesModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <Crown className="w-4 h-4 fill-current" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        In-Match Roles & Set-Pieces
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {capsuleFilter === 'both'
                                            ? `Designations for ${teamA.name} & ${teamB.name}`
                                            : `Official designations for ${capsuleFilter === 'home' ? teamA.name : teamB.name}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRolesModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2e45] cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-6 flex-1">
                            {/* Home Team Roles */}
                            {showRolesForA && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-[#1a2e45]">
                                        <img src={teamA.logo} alt={teamA.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            {teamA.name} Roles
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {rolesA.map((r) => {
                                            const IconComp = r.icon;
                                            return (
                                                <div
                                                    key={r.id}
                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${r.bgGlow}`}>
                                                            <IconComp className={`w-4 h-4 ${r.iconColor}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase block truncate">
                                                                {r.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                                                {r.desc}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {r.player ? (
                                                        <div className="text-right pl-2 shrink-0">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[90px]">
                                                                {r.player.name}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400 block">
                                                                #{r.player.number} • {r.player.position}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Unassigned</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Away Team Roles */}
                            {showRolesForB && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-[#1a2e45]">
                                        <img src={teamB.logo} alt={teamB.name} className="w-5 h-5 rounded-full object-cover bg-slate-800" />
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            {teamB.name} Roles
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {rolesB.map((r) => {
                                            const IconComp = r.icon;
                                            return (
                                                <div
                                                    key={r.id}
                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${r.bgGlow}`}>
                                                            <IconComp className={`w-4 h-4 ${r.iconColor}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase block truncate">
                                                                {r.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                                                {r.desc}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {r.player ? (
                                                        <div className="text-right pl-2 shrink-0">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[90px]">
                                                                {r.player.name}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400 block">
                                                                #{r.player.number} • {r.player.position}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Unassigned</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-[#f8f9fa] dark:bg-[#112236] border-t border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Designated tactical roles from official coach lineup
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsRolesModalOpen(false)}
                                className="px-4 py-1.5 rounded-lg bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 11. INTERACTIVE PLAYER DETAILS MODAL */}
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
                                    {selectedPlayer.player.isReserve ? 'Reserve (Squad)' : selectedPlayer.player.isSub ? 'Substitute (Bench)' : 'Starting 11 (Pitch)'}
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

