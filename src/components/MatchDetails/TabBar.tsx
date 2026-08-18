import React, { useEffect, useRef } from 'react';
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

    const activeTabRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [activeTab]);

    // Build navigation schema: Squad is default first item for all matches
    let tabs: { id: MatchDetailTabType; label: string }[] = [];

    if (isPreMatch) {
        tabs = [
            { id: 'squads', label: 'Squad' },
            { id: 'overview', label: 'Overview' },
            { id: 'lineups', label: 'Lineup' },
            { id: 'captains_notes', label: "Captain Says" },
            { id: 'details', label: 'Details' },
            { id: 'context', label: 'Context' },
            { id: 'form', label: 'Form' },
            { id: 'h2h', label: 'H2H' },
        ];
    } else if (isLive) {
        tabs = [
            { id: 'squads', label: 'Squad' },
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'stats', label: 'Statistics' },
            { id: 'lineups', label: 'Lineup' },
            { id: 'captains_notes', label: "Captain Says" },
            { id: 'context', label: 'Context' },
            { id: 'details', label: 'Details' },
            { id: 'h2h', label: 'H2H' },
        ];
    } else {
        // Finished match
        tabs = [
            { id: 'squads', label: 'Squad' },
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'stats', label: 'Statistics' },
            { id: 'lineups', label: 'Lineup' },
            { id: 'ratings', label: 'Player Ratings' },
            { id: 'captains_notes', label: "Captain Says" },
            { id: 'context', label: 'Context' },
            { id: 'details', label: 'Details' },
            { id: 'h2h', label: 'H2H' },
        ];
    }

    return (
        <div className="sticky top-[64px] z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 select-none">
            <div className="w-full flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-2 py-4 px-4 max-w-5xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={isActive ? activeTabRef : null}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                isActive
                                    ? 'bg-blue-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
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


