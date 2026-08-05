import React from 'react';
import type { MatchStatus } from '../../types';

export type MatchDetailTabType =
    | 'overview'
    | 'squads'
    | 'timeline'
    | 'stats'
    | 'lineups'
    | 'ratings'
    | 'context'
    | 'details'
    | 'captains_notes'
    | 'form'
    | 'h2h';

interface TabBarProps {
    activeTab: MatchDetailTabType;
    setActiveTab: (tab: MatchDetailTabType) => void;
    status: MatchStatus | string;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab, status }) => {
    const isPreMatch = status === 'UPCOMING' || status === 'POSTPONED' || status === 'CANCELLED';
    const isLive = status === 'LIVE' || status === 'HT';

    // Build navigation schema according to Match Lifecycle
    let tabs: { id: MatchDetailTabType; label: string }[] = [];

    if (isPreMatch) {
        tabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'squads', label: 'Squads' },
            { id: 'details', label: 'Details' },
            { id: 'context', label: 'Context' },
            { id: 'captains_notes', label: "Captain's Notes" },
            { id: 'form', label: 'Form' },
            { id: 'h2h', label: 'H2H' },
        ];
    } else if (isLive) {
        tabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'stats', label: 'Statistics' },
            { id: 'lineups', label: 'Lineups' },
            { id: 'context', label: 'Context' },
            { id: 'details', label: 'Details' },
            { id: 'h2h', label: 'H2H' },
        ];
    } else {
        // Finished match
        tabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'stats', label: 'Statistics' },
            { id: 'lineups', label: 'Lineups' },
            { id: 'ratings', label: 'Player Ratings' },
            { id: 'context', label: 'Context' },
            { id: 'details', label: 'Details' },
            { id: 'h2h', label: 'H2H' },
        ];
    }

    return (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E1424]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 select-none transition-colors shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-2.5 max-w-4xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl font-extrabold text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer ${isActive
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

