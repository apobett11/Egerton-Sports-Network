import React from 'react';
import { CalendarDays, Trophy, Newspaper, Star } from 'lucide-react';

export type MainTabType = 'scores' | 'table' | 'news' | 'favorites' | 'login';

interface NavigationProps {
    activeTab: MainTabType;
    setActiveTab: (tab: MainTabType) => void;
    favoritesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
    activeTab,
    setActiveTab,
    favoritesCount
}) => {
    const tabs = [
        { id: 'scores' as MainTabType, label: 'Scores', icon: CalendarDays },
        { id: 'table' as MainTabType, label: 'Standings', icon: Trophy },
        { id: 'news' as MainTabType, label: 'News', icon: Newspaper },
        { id: 'favorites' as MainTabType, label: 'Favorites', icon: Star, badge: favoritesCount }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-45 md:sticky md:top-[124px] md:z-10 bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-2xl transition-all duration-300 select-none border-t-[#D4AF37]/40">
            <div className="flex items-center justify-around md:justify-center md:gap-6 px-3 py-2 max-w-4xl mx-auto h-[66px] md:h-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isStar = tab.id === 'favorites';

                    let activeClass = 'text-[#D4AF37] bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-sm font-extrabold scale-[1.02]';
                    let inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border border-transparent font-bold';

                    if (isStar && isActive) {
                        activeClass = 'text-orange-500 dark:text-orange-400 bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/40 shadow-sm font-extrabold scale-[1.02]';
                    }

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex flex-col md:flex-row items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                                isActive ? activeClass : inactiveClass
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                                    isActive 
                                        ? isStar ? 'scale-110 text-orange-500 fill-orange-500/20' : 'scale-110 text-[#D4AF37]' 
                                        : isStar ? 'text-orange-400/80 hover:text-orange-500' : ''
                                }`} />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-[#0D1322] shadow-sm animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs tracking-wide uppercase md:capitalize">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

