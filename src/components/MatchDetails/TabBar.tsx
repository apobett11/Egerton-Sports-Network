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
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B101E]/95 backdrop-blur-2xl border-b border-amber-500/30 dark:border-[#D4AF37]/30 select-none shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 py-2.5 max-w-4xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={isActive ? activeTabRef : null}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl font-black text-xs tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                isActive
                                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] text-slate-950 shadow-[0_4px_16px_rgba(212,175,55,0.4)] ring-2 ring-amber-400 scale-[1.03]'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold border border-transparent'
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


