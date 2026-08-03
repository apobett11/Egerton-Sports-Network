import React from 'react';
import type { Match } from '../../types';

interface CaptainsNotesProps {
    match: Match;
}

export const CaptainsNotes: React.FC<CaptainsNotesProps> = ({ match }) => {
    const { teamA, teamB, lineups, captainNotesA, captainNotesB } = match;

    const captainA = lineups?.teamA?.find(p => p.isCaptain)?.name || 'Team Captain';
    const captainB = lineups?.teamB?.find(p => p.isCaptain)?.name || 'Team Captain';

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-4">
            {/* Header */}
            <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block">
                    Pre-Match Thoughts
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Captain's Notes (Stored Records)
                </h3>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md p-6 divide-y divide-gray-100 dark:divide-gray-800 space-y-6 transition-colors">
                
                {/* Captain A Note */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ backgroundColor: teamA.colorCode }}>
                            C
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                {teamA.name} Captain
                            </span>
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                {captainA}
                            </h4>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed italic bg-gray-50/60 dark:bg-gray-800/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/50">
                        {captainNotesA ? `"${captainNotesA}"` : "No official captain's notes published in database for this fixture."}
                    </p>
                </div>

                {/* Captain B Note */}
                <div className="pt-6 space-y-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ backgroundColor: teamB.colorCode }}>
                            C
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                {teamB.name} Captain
                            </span>
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                {captainB}
                            </h4>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed italic bg-gray-50/60 dark:bg-gray-800/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/50">
                        {captainNotesB ? `"${captainNotesB}"` : "No official captain's notes published in database for this fixture."}
                    </p>
                </div>

            </div>
        </div>
    );
};
