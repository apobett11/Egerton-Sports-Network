import React from 'react';
import type { MatchStatus } from '../../types';

export type MatchDetailTabType =
    | 'overview'
    | 'stats'
    | 'lineups'
    | 'ratings'
    | 'timeline'
    | 'form'
    | 'h2h';

interface TabBarProps {
    activeTab: MatchDetailTabType;
    setActiveTab: (tab: MatchDetailTabType) => void;
    status: MatchStatus | string;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
    const mainTabs: { id: MatchDetailTabType; label: string }[] = [
        { id: 'overview', label: 'SUMMARY' },
        { id: 'stats', label: 'STATS' },
        { id: 'lineups', label: 'LINEUPS' },
        { id: 'ratings', label: 'PLAYER STATS' },
        { id: 'timeline', label: 'COMMENTARY' },
        { id: 'form', label: 'FORM' },
        { id: 'h2h', label: 'H2H' },
    ];

    return (
        <div className="w-full bg-[#0e1e2d] border-b border-[#16283d] select-none sticky top-[48px] z-40 shadow-xs">
            {/* MAIN MATCH DETAILS NAVIGATION BAR */}
            <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-2 px-3 max-w-4xl mx-auto">
                {mainTabs.map((tb) => {
                    const isActive = activeTab === tb.id;
                    return (
                        <button
                            key={tb.id}
                            type="button"
                            onClick={() => setActiveTab(tb.id)}
                            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase transition-colors whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? 'bg-[#ff0046] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-[#14263b]'
                            }`}
                        >
                            {tb.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};




