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
        <div className="sticky top-0 z-40 bg-slate-100/90 dark:bg-[#12192B]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-700/80 select-none shadow-md">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 py-2.5 max-w-4xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={isActive ? activeTabRef : null}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl font-black text-xs tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-950 shadow-md shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37] scale-[1.03]'
                                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800/80 font-bold'
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

