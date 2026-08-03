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
            { id: 'context', label: 'Match Context' },
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
            { id: 'context', label: 'Match Context' },
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
            { id: 'context', label: 'Match Context' },
            { id: 'details', label: 'Details' },
            { id: 'h2h', label: 'H2H' },
        ];
    }

    return (
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 select-none transition-colors">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 max-w-2xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all outline-none ${isActive
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-500 font-extrabold'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
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
