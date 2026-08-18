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
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                    Pre-Match Statements
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Captain's Notes & Tactical Outlook
                </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 divide-y divide-slate-100 dark:divide-white/5 space-y-6 transition-colors">
                
                {/* Captain A Note */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0" style={{ backgroundColor: teamA.colorCode }}>
                            C
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                {teamA.name} Captain
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {captainA}
                            </h4>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        {captainNotesA ? `"${captainNotesA}"` : "No official captain's notes published for this fixture."}
                    </p>
                </div>

                {/* Captain B Note */}
                <div className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0" style={{ backgroundColor: teamB.colorCode }}>
                            C
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                {teamB.name} Captain
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {captainB}
                            </h4>
                        </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        {captainNotesB ? `"${captainNotesB}"` : "No official captain's notes published for this fixture."}
                    </p>
                </div>

            </div>
        </div>
    );
};

