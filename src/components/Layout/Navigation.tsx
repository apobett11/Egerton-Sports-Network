import React from 'react';
import { Trophy, Star, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export type MainTabType = 'scores' | 'table' | 'news' | 'favorites' | 'login';

interface NavigationProps {
    activeTab: MainTabType;
    setActiveTab: (tab: MainTabType) => void;
    favoritesCount: number;
    selectedDate?: Date;
    setSelectedDate?: (date: Date) => void;
    onOpenCalendar?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
    activeTab,
    setActiveTab,
    favoritesCount,
    selectedDate,
    setSelectedDate,
    onOpenCalendar
}) => {
    // Secondary sub-tab bar for Table/Standings or Favorites if active
    if (activeTab !== 'table' && activeTab !== 'favorites') {
        return null;
    }

    return (
        <div className="w-full bg-white dark:bg-[#0e1c2b] border-b border-[#e6e8ec] dark:border-[#1a2e45] py-2 px-4 select-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('scores')}
                        className="text-xs font-bold text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Scores</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('table')}
                        className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                            activeTab === 'table'
                                ? 'bg-[#0e1e2d] text-white dark:bg-white dark:text-slate-950 font-black'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263b]'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5" /> Standings Table
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('favorites')}
                        className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                            activeTab === 'favorites'
                                ? 'bg-[#ff0046] text-white font-black'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263b]'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5" /> Favorites ({favoritesCount})
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};



