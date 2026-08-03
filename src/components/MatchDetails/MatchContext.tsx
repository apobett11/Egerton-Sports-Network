import React from 'react';
import { Trophy, TrendingUp, Flame, Target } from 'lucide-react';
import type { Match } from '../../types';

interface MatchContextProps {
    match: Match;
}

export const MatchContext: React.FC<MatchContextProps> = ({ match }) => {
    const { teamA, teamB } = match;

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-4">
            {/* Header */}
            <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block">
                    Context & Stakes
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Match Context
                </h3>
            </div>

            {/* Match Context Card */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md p-5 space-y-5 transition-colors">
                
                {/* League position & Points grid */}
                <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100 dark:divide-gray-800">
                    {/* Team A stats */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{teamA.name}</span>
                        </div>
                        <div className="pl-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-gray-900 dark:text-white">1st</span>
                                <span className="text-xs font-bold text-gray-400">Position</span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                24 pts <span className="text-gray-400 font-normal">• 9 Played</span>
                            </p>
                        </div>
                    </div>

                    {/* Team B stats */}
                    <div className="pl-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{teamB.name}</span>
                        </div>
                        <div className="pl-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-gray-900 dark:text-white">3rd</span>
                                <span className="text-xs font-bold text-gray-400">Position</span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                22 pts <span className="text-gray-400 font-normal">• 9 Played</span>
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* What's at stake */}
                <div className="flex items-start gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            What's At Stake
                        </span>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                            Winner moves top of the Egerton Super League standings. A draw leaves the title race open.
                        </p>
                    </div>
                </div>

                {/* Current Streaks */}
                <div className="flex items-start gap-3 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                            Active Team Streaks
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 pt-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{teamA.shortName}: Unbeaten in 6 matches</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{teamB.shortName}: Won last 3 consecutive</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
