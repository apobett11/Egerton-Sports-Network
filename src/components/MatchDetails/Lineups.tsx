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
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-15 transition-all duration-300 pointer-events-auto"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
                {/* Jersey Circle */}
                <div
                    className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-md ring-2 ring-white/30 hover:scale-115 transition-transform"
                    style={{ backgroundColor: teamColor }}
                >
                    {player.number}

                    {/* Captain Badge */}
                    {player.isCaptain && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-405 border border-yellow-700 text-yellow-900 rounded-full flex items-center justify-center font-extrabold text-[8px] select-none shadow">
                            C
                        </span>
                    )}

                    {/* Event indicators */}
                    <div className="absolute -bottom-1 -right-1.5 flex gap-0.5">
                        {hasGoal && <span className="text-[10px] drop-shadow-sm">⚽</span>}
                        {hasYellow && <span className="w-2.5 h-3.5 bg-amber-400 border border-amber-500 rounded-xs block shadow-xs" />}
                        {hasRed && <span className="w-2.5 h-3.5 bg-red-650 border border-red-750 rounded-xs block shadow-xs" />}
                    </div>
                </div>

                {/* Player Name Tag */}
                <div className="mt-1 bg-black/60 dark:bg-black/85 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-white max-w-[80px] truncate text-center shadow-sm">
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
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none flex flex-col gap-6">
            {/* Controls */}
            <div className="flex justify-center bg-gray-100 dark:bg-gray-850 p-1 rounded-xl self-center">
                <button
                    type="button"
                    onClick={() => setActiveTeamView('both')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTeamView === 'both'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-705 dark:hover:text-gray-300'
                        }`}
                >
                    Full Pitch
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTeamView('teamA')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTeamView === 'teamA'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-705 dark:hover:text-gray-300'
                        }`}
                >
                    {teamA.shortName} Form.
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTeamView('teamB')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTeamView === 'teamB'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-705 dark:hover:text-gray-300'
                        }`}
                >
                    {teamB.shortName} Form.
                </button>
            </div>

            {/* Formations layout label */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest bg-gray-50 dark:bg-black/10 px-3 py-1.5 rounded-lg">
                <span>{teamA.shortName} Formation: {lineups.formationA}</span>
                <span>{teamB.shortName} Formation: {lineups.formationB}</span>
            </div>

            {/* Pitch Diagram */}
            <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] bg-emerald-800 dark:bg-emerald-900 border border-emerald-950 rounded-xl overflow-hidden shadow-inner select-none pointer-events-none">

                {/* Pitch Lines Grass Textures */}
                <div className="absolute inset-0 bg-linear-to-b from-white/[0.03] to-transparent bg-[size:100%_15%]" />

                {/* Boundary border */}
                <div className="absolute inset-2 border-2 border-white/20" />

                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />

                {/* Penalty box - TOP */}
                <div className="absolute top-2 left-1/2 w-[55%] h-[16%] border-b-2 border-l-2 border-r-2 border-white/20 transform -translate-x-1/2" />
                <div className="absolute top-2 left-1/2 w-[22%] h-[6%] border-b-2 border-l-2 border-r-2 border-white/20 transform -translate-x-1/2" />
                <div className="absolute top-[16%] left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full transform -translate-x-1/2" />

                {/* Penalty box - BOTTOM */}
                <div className="absolute bottom-2 left-1/2 w-[55%] h-[16%] border-t-2 border-l-2 border-r-2 border-white/20 transform -translate-x-1/2" />
                <div className="absolute bottom-2 left-1/2 w-[22%] h-[6%] border-t-2 border-l-2 border-r-2 border-white/20 transform -translate-x-1/2" />
                <div className="absolute bottom-[16%] left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full transform -translate-x-1/2" />

                {/* Render Players */}
                {(activeTeamView === 'both' || activeTeamView === 'teamA') && renderTeamAStarters()}
                {(activeTeamView === 'both' || activeTeamView === 'teamB') && renderTeamBStarters()}

            </div>

            {/* Substitutes Section with Advertisement Divider */}
            <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 px-1">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    Bench & Substitutes
                </h4>

                {/* Team A Bench */}
                <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm transition-colors">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                        <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">{teamA.name} Bench</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 divide-y sm:divide-y-0 divide-gray-50 dark:divide-gray-850">
                        {subsA.map(player => (
                            <div key={player.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 text-gray-400 font-bold text-right">{player.number}</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{player.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-750 px-1.5 py-0.2 rounded uppercase">
                                    {player.position}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Advertisement Card */}
                <div className="bg-linear-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 border border-emerald-700/50">
                    <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-300 block">Official Campus Sponsor</span>
                        <p className="text-xs font-black">Egerton Sports Network • Live HD Match Streams</p>
                        <p className="text-[10px] text-emerald-100 font-medium">Download the app for exclusive tactical camera feeds.</p>
                    </div>
                    <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] uppercase px-3 py-1 rounded-lg shrink-0 shadow-xs">
                        Ad
                    </span>
                </div>

                {/* Team B Bench */}
                <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm transition-colors">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                        <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">{teamB.name} Bench</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 divide-y sm:divide-y-0 divide-gray-50 dark:divide-gray-850">
                        {subsB.map(player => (
                            <div key={player.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 text-gray-400 font-bold text-right">{player.number}</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{player.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-750 px-1.5 py-0.2 rounded uppercase">
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
