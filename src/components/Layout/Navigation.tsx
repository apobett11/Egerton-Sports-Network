import React from 'react';
import { CalendarDays, Trophy, Newspaper, Star, LogIn } from 'lucide-react';

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
        { id: 'favorites' as MainTabType, label: 'Favorites', icon: Star, badge: favoritesCount },
        { id: 'login' as MainTabType, label: 'Portal', icon: LogIn }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-45 md:sticky md:top-[124px] md:z-20 bg-white/90 dark:bg-[#0B101E]/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 select-none">
            <div className="flex items-center justify-around md:justify-center md:gap-3 lg:gap-5 px-2 sm:px-4 py-2 max-w-4xl mx-auto h-[68px] md:h-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isStar = tab.id === 'favorites';

                    let activeClass = 'text-amber-500 dark:text-[#D4AF37] bg-amber-500/15 dark:bg-[#D4AF37]/15 border border-amber-500/30 dark:border-[#D4AF37]/40 shadow-sm font-black scale-[1.03] shadow-amber-500/10';
                    let inactiveClass = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent font-bold';

                    if (isStar && isActive) {
                        activeClass = 'text-orange-500 dark:text-orange-400 bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/40 shadow-sm font-black scale-[1.03] shadow-orange-500/15';
                    }

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex flex-col md:flex-row items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
                                isActive ? activeClass : inactiveClass
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                                    isActive 
                                        ? isStar ? 'scale-110 text-orange-500 fill-orange-500/30' : 'scale-110 text-amber-500 dark:text-[#D4AF37]' 
                                        : isStar ? 'text-orange-400/80 hover:text-orange-500' : ''
                                }`} />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-[#0B101E] shadow-sm animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs tracking-wide uppercase md:capitalize">
                                {tab.label}
                            </span>
                            {isActive && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] md:hidden" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};


