import React from 'react';
import type { Match } from '../../types';

interface FormTabProps {
    match: Match;
}

export const FormTab: React.FC<FormTabProps> = ({ match }) => {
    const { teamA, teamB } = match;

    const formA = [
        { result: 'W', label: 'Win vs Science (2-0)' },
        { result: 'W', label: 'Win vs Arts (3-1)' },
        { result: 'D', label: 'Draw vs Tech (1-1)' },
        { result: 'L', label: 'Loss vs Vet (0-1)' },
        { result: 'W', label: 'Win vs Edu (4-2)' }
    ];

    const formB = [
        { result: 'W', label: 'Win vs Edu (1-0)' },
        { result: 'L', label: 'Loss vs Tech (0-2)' },
        { result: 'L', label: 'Loss vs Engineering (1-3)' },
        { result: 'W', label: 'Win vs Law (2-1)' },
        { result: 'D', label: 'Draw vs Med (0-0)' }
    ];

    const renderBadge = (res: string) => {
        switch (res) {
            case 'W':
                return (
                    <span title="Win" className="w-7 h-7 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        W
                    </span>
                );
            case 'D':
                return (
                    <span title="Draw" className="w-7 h-7 rounded-full bg-amber-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        D
                    </span>
                );
            case 'L':
                return (
                    <span title="Loss" className="w-7 h-7 rounded-full bg-red-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        L
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-4">
            {/* Header */}
            <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block">
                    Recent Form
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Team Form Guide
                </h3>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md p-6 divide-y divide-gray-100 dark:divide-gray-800 space-y-6 transition-colors">
                
                {/* Team A Form */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                {teamA.name}
                            </h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Last Five
                        </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        {formA.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {renderBadge(item.result)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team B Form */}
                <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                {teamB.name}
                            </h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Last Five
                        </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        {formB.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {renderBadge(item.result)}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
