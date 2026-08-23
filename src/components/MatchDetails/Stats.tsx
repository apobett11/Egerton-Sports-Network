import React, { useState } from 'react';
import type { Match } from '../../types';

interface StatsProps {
    match: Match;
}

export const Stats: React.FC<StatsProps> = ({ match }) => {
    const [period, setPeriod] = useState<'all' | '1st' | '2nd'>('all');
    const { stats = [], teamA, teamB } = match;

    const defaultStats = [
        { label: 'Expected Goals (xG)', teamAValue: 1.42, teamBValue: 0.85, isFloat: true },
        { label: 'Ball Possession', teamAValue: 56, teamBValue: 44, isPercent: true },
        { label: 'Goal Attempts', teamAValue: 15, teamBValue: 8 },
        { label: 'Shots on Goal', teamAValue: 6, teamBValue: 3 },
        { label: 'Shots off Goal', teamAValue: 5, teamBValue: 3 },
        { label: 'Blocked Shots', teamAValue: 4, teamBValue: 2 },
        { label: 'Corner Kicks', teamAValue: 7, teamBValue: 4 },
        { label: 'Offsides', teamAValue: 2, teamBValue: 1 },
        { label: 'Goalkeeper Saves', teamAValue: 3, teamBValue: 5 },
        { label: 'Fouls', teamAValue: 11, teamBValue: 14 },
        { label: 'Yellow Cards', teamAValue: 1, teamBValue: 2 },
    ];

    const displayStats = stats.length > 0 ? stats : defaultStats;

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-3">
            {/* 1. PERIOD SELECTOR PILLS (ALL | 1ST HALF | 2ND HALF) */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm">
                {[
                    { id: 'all', label: 'ALL' },
                    { id: '1st', label: '1ST HALF' },
                    { id: '2nd', label: '2ND HALF' },
                ].map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriod(p.id as any)}
                        className={`px-4 py-1 rounded-full text-xs font-black uppercase cursor-pointer transition-colors ${
                            period === p.id
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* 2. TOP STATS SECTION */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-extrabold uppercase text-slate-800 dark:text-white tracking-wider">
                    TOP STATS
                </div>

                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b] p-3 sm:p-4 space-y-3">
                    {displayStats.map((item, idx) => {
                        const total = (item.teamAValue || 0) + (item.teamBValue || 0);
                        const pctA = total > 0 ? (item.teamAValue / total) * 100 : 50;
                        const pctB = total > 0 ? (item.teamBValue / total) * 100 : 50;
                        const isHomeSuperior = item.teamAValue > item.teamBValue;
                        const isAwaySuperior = item.teamBValue > item.teamAValue;

                        return (
                            <div key={`${item.label}-${idx}`} className="pt-2">
                                {/* Label and Values */}
                                <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                                    <span className={`font-mono ${isHomeSuperior ? 'text-[#ff0046] font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {(item as any).isPercent ? `${item.teamAValue}%` : item.teamAValue}
                                    </span>
                                    <span className="text-[11px] text-slate-500 uppercase font-bold text-center">
                                        {item.label}
                                    </span>
                                    <span className={`font-mono ${isAwaySuperior ? 'text-[#1565c0] font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {(item as any).isPercent ? `${item.teamBValue}%` : item.teamBValue}
                                    </span>
                                </div>

                                {/* Dual Split Bars (Home fills right-to-left, Away fills left-to-right) */}
                                <div className="grid grid-cols-2 gap-1.5 h-1.5 w-full">
                                    {/* Home Team Bar */}
                                    <div className="bg-[#eef1f5] dark:bg-[#14263b] rounded-xs overflow-hidden flex justify-end">
                                        <div
                                            style={{ width: `${pctA}%` }}
                                            className={`h-full rounded-xs transition-all ${
                                                isHomeSuperior ? 'bg-[#ff0046]' : 'bg-slate-400 dark:bg-slate-600'
                                            }`}
                                        />
                                    </div>

                                    {/* Away Team Bar */}
                                    <div className="bg-[#eef1f5] dark:bg-[#14263b] rounded-xs overflow-hidden flex justify-start">
                                        <div
                                            style={{ width: `${pctB}%` }}
                                            className={`h-full rounded-xs transition-all ${
                                                isAwaySuperior ? 'bg-[#1565c0]' : 'bg-slate-400 dark:bg-slate-600'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


