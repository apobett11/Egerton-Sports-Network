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
        { id: 'login' as MainTabType, label: 'Login', icon: LogIn },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-45 md:sticky md:top-[128px] md:z-10 bg-white/80 dark:bg-[#101415]/85 backdrop-blur-xl border-t md:border-t-0 md:border-b border-gray-200/80 dark:border-gray-800/80 transition-all duration-300 shadow-xl md:shadow-none select-none">
            <div className="flex items-center justify-around md:justify-center md:gap-4 px-2 py-1.5 md:py-2 max-w-5xl mx-auto h-[64px] md:h-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex flex-col md:flex-row items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer ${isActive
                                ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 ring-1 ring-emerald-500/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''} transition-transform duration-300`} />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-gray-950 shadow-sm animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-extrabold tracking-wide uppercase md:capitalize">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
