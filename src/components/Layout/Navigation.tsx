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
        <>
            {/* MOBILE BOTTOM NAVIGATION (< 768px) */}
            <nav className="fixed bottom-0 left-0 w-full h-[72px] z-[60] flex items-center justify-around pb-safe md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-t border-slate-200 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] select-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={
                                isActive
                                    ? "relative flex flex-col items-center justify-center gap-1 w-16 h-full text-blue-900 dark:text-blue-400 cursor-pointer"
                                    : "flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
                            }
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className="w-6 h-6" />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold">
                                {tab.label}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-blue-900 dark:bg-blue-400" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* DESKTOP STICKY SUBNAV (>= 768px) */}
            <nav className="hidden md:flex sticky top-[65px] z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 py-2.5 justify-center items-center gap-3 select-none">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? "bg-blue-900 text-white dark:bg-blue-600 shadow-md shadow-blue-900/20"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-500 text-white">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};


