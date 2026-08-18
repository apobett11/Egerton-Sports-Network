import React, { useState, useEffect } from 'react';
import type { Match } from '../../types';
import { ApiService } from '../../services/api';

interface FormTabProps {
    match: Match;
}

export const FormTab: React.FC<FormTabProps> = ({ match }) => {
    const { teamA, teamB } = match;

    const [formA, setFormA] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);
    const [formB, setFormB] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);

    useEffect(() => {
        if (teamA?.id) {
            ApiService.getTeamForm(teamA.id).then((res) => {
                if (res.data) setFormA(res.data);
            });
        }
        if (teamB?.id) {
            ApiService.getTeamForm(teamB.id).then((res) => {
                if (res.data) setFormB(res.data);
            });
        }
    }, [teamA?.id, teamB?.id]);

    const renderBadge = (res: string) => {
        switch (res) {
            case 'W':
                return (
                    <span title="Win" className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        W
                    </span>
                );
            case 'D':
                return (
                    <span title="Draw" className="w-8 h-8 rounded-xl bg-amber-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        D
                    </span>
                );
            case 'L':
                return (
                    <span title="Loss" className="w-8 h-8 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        L
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                    Recent Form
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Team Form Guide (Previous Matches)
                </h3>
            </div>

            {/* Main Form Card (Solidified Section Card) */}
            <div className="w-full rounded-3xl p-6 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none divide-y divide-slate-100 dark:divide-white/5 space-y-6 transition-colors">
                
                {/* Team A Form */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {teamA.name}
                            </h4>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Last Five Fixtures
                        </span>
                    </div>

                    {formA.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1">No prior match results in database.</p>
                    ) : (
                        <div className="flex items-center gap-3 pt-1">
                            {formA.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2" title={item.label}>
                                    {renderBadge(item.result)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Team B Form */}
                <div className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {teamB.name}
                            </h4>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Last Five Fixtures
                        </span>
                    </div>

                    {formB.length === 0 ? (
                        <p className="text-xs text-slate-400 py-1">No prior match results in database.</p>
                    ) : (
                        <div className="flex items-center gap-3 pt-1">
                            {formB.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2" title={item.label}>
                                    {renderBadge(item.result)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

