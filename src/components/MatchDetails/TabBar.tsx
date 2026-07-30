import React from 'react';

export type MatchDetailTabType = 'info' | 'summary' | 'stats' | 'lineups' | 'highlights' | 'h2h';

interface TabBarProps {
    activeTab: MatchDetailTabType;
    setActiveTab: (tab: MatchDetailTabType) => void;
    isUpcoming: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab, isUpcoming }) => {
    // Tabs schema
    const tabs = [
        { id: 'info' as MatchDetailTabType, label: 'Info' },
        { id: 'summary' as MatchDetailTabType, label: 'Summary', disabled: isUpcoming },
        { id: 'stats' as MatchDetailTabType, label: 'Stats', disabled: isUpcoming },
        { id: 'lineups' as MatchDetailTabType, label: 'Lineups' },
        { id: 'highlights' as MatchDetailTabType, label: 'Highlights', disabled: isUpcoming },
        { id: 'h2h' as MatchDetailTabType, label: 'H2H' }
    ];

    return (
        <div className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-805 select-none transition-colors">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 max-w-2xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    if (tab.disabled) {
                        return null; // hide tabs that don't make sense for upcoming matches
                    }

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
