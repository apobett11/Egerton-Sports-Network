import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { Match } from '../../types';

interface StatsProps {
    match: Match;
}

export const Stats: React.FC<StatsProps> = ({ match }) => {
    const { stats, teamA, teamB } = match;

    if (!stats || stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#0E1424] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No Match Statistics Available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Detailed statistical metrics (possession, shots, passes, fouls) will be populated live as match events occur.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            {/* Header & Teams Legend */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                        Performance Analytics
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Match Statistics Comparison
                    </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.colorCode || '#10B981' }} />
                        {teamA.name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.colorCode || '#3B82F6' }} />
                        {teamB.name}
                    </span>
                </div>
            </div>

            {/* Grouped Metric Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 space-y-4">
                {stats.map((stat, idx) => {
                    const total = stat.teamAValue + stat.teamBValue;
                    const widthA = total > 0 ? (stat.teamAValue / total) * 100 : 50;
                    const widthB = total > 0 ? (stat.teamBValue / total) * 100 : 50;

                    return (
                        <div key={`${stat.label}-${idx}`} className="flex flex-col gap-2 w-full py-3">
                            {/* Header: Home Val, Stat Label, Away Val */}
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="font-mono text-sm text-slate-900 dark:text-white">
                                    {stat.teamAValue}
                                </span>
                                <span className="uppercase tracking-widest text-[10px] text-slate-400">
                                    {stat.label}
                                </span>
                                <span className="font-mono text-sm text-slate-900 dark:text-white">
                                    {stat.teamBValue}
                                </span>
                            </div>

                            {/* Bar Track & Left/Right Bars */}
                            <div className="flex h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-900 dark:bg-blue-500 rounded-l-full transition-all duration-500"
                                    style={{ width: `${widthA}%` }}
                                />
                                <div
                                    className="bg-amber-500 rounded-r-full transition-all duration-500"
                                    style={{ width: `${widthB}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

