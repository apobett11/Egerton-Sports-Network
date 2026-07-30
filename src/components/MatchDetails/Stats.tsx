import React from 'react';
import type { Match } from '../../types';

interface StatsProps {
    match: Match;
}

export const Stats: React.FC<StatsProps> = ({ match }) => {
    const { stats } = match;

    if (!stats || stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-transparent select-none">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    No statistical aggregates available for this matchup.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-6">
            {stats.map((stat, idx) => {
                const total = stat.teamAValue + stat.teamBValue;
                const widthA = total > 0 ? (stat.teamAValue / total) * 100 : 50;
                const widthB = total > 0 ? (stat.teamBValue / total) * 100 : 50;

                return (
                    <div key={`${stat.label}-${idx}`} className="space-y-2">
                        {/* Numeric Values & Stat Label */}
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300">
                            <span className="w-12 text-left text-sm font-black text-gray-900 dark:text-white">
                                {stat.teamAValue}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-gray-450 tracking-wider text-center">
                                {stat.label}
                            </span>
                            <span className="w-12 text-right text-sm font-black text-gray-900 dark:text-white">
                                {stat.teamBValue}
                            </span>
                        </div>

                        {/* Split Bar */}
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 flex overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                                style={{ width: `${widthA}%` }}
                            />
                            <div
                                className="h-full bg-gray-500 transition-all duration-500 rounded-r-full"
                                style={{ width: `${widthB}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
