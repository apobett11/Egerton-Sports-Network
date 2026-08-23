import React from 'react';
import { CalendarDays, Trophy, Newspaper, Star, LogIn, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const tabs = [
        { id: 'scores' as MainTabType, label: 'Scores', icon: CalendarDays },
        { id: 'table' as MainTabType, label: 'Standings', icon: Trophy },
        { id: 'news' as MainTabType, label: 'News', icon: Newspaper },
        { id: 'favorites' as MainTabType, label: 'Favorites', icon: Star, badge: favoritesCount },
        { id: 'login' as MainTabType, label: 'Portal', icon: LogIn }
    ];

    const formatDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow, ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const changeDate = (days: number) => {
        if (!selectedDate || !setSelectedDate) return;
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
        if (activeTab !== 'scores') {
            setActiveTab('scores');
        }
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value || !setSelectedDate) return;
        const parts = e.target.value.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            setSelectedDate(d);
            if (activeTab !== 'scores') {
                setActiveTab('scores');
            }
        }
    };

    const formattedDateStr = selectedDate ? (
        `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    ) : '';

    return (
        <>
            {/* MOBILE BOTTOM NAVIGATION (< 768px) */}
            <nav className="fixed bottom-0 left-0 w-full h-[72px] z-[60] flex items-center justify-around pb-safe md:hidden bg-emerald-50/90 dark:bg-[#071a14]/92 backdrop-blur-3xl border-t border-emerald-200/60 dark:border-emerald-500/20 shadow-[0_-8px_30px_rgba(5,46,22,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)] select-none">
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
                                    ? "relative flex flex-col items-center justify-center gap-1 w-16 h-full text-emerald-700 dark:text-emerald-400 cursor-pointer"
                                    : "flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 cursor-pointer transition-colors"
                            }
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className="w-6 h-6" />
                                {!!tab.badge && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-emerald-950 shadow-sm animate-pulse">
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold">
                                {tab.label}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-emerald-700 dark:bg-emerald-400" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* DESKTOP STICKY SUBNAV (>= 768px) */}
            <nav className="hidden md:flex sticky top-[65px] z-40 bg-emerald-50/85 dark:bg-[#071a14]/90 backdrop-blur-2xl border-b border-emerald-200/60 dark:border-emerald-500/20 py-2.5 justify-center items-center gap-3 select-none">
                <div className="flex items-center gap-2 bg-white/90 dark:bg-[#0b241d]/90 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 shadow-sm">
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
                                        ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-md shadow-emerald-700/20"
                                        : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30"
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

            {/* CALENDAR DATE STRIP DIRECTLY BELOW TOP NAVIGATION */}
            {selectedDate && setSelectedDate && (
                <div className="w-full bg-emerald-100/60 dark:bg-[#062118]/85 backdrop-blur-xl border-b border-emerald-200/70 dark:border-emerald-900/50 py-2.5 px-4 select-none">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => changeDate(-1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#0b241d] hover:bg-white dark:hover:bg-[#10342a] text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs"
                            title="Move to previous day"
                            aria-label="Previous Day"
                        >
                            <ChevronLeft className="w-4 h-4 text-amber-500" />
                            <span className="hidden sm:inline">Prev Day</span>
                        </button>

                        {/* Active Date Badge & Quick Picker */}
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                                <span>{formatDateLabel(selectedDate)}</span>
                            </span>

                            <input 
                                type="date"
                                value={formattedDateStr}
                                onChange={handleDateInputChange}
                                className="hidden sm:inline-block text-xs font-bold text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-[#0b241d] border border-emerald-200/80 dark:border-emerald-500/30 rounded-xl px-2.5 py-1 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Choose specific date"
                            />
                        </div>

                        {/* Next Day, Today, and Full Calendar */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => changeDate(1)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#0b241d] hover:bg-white dark:hover:bg-[#10342a] text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs"
                                title="Move to next day"
                                aria-label="Next Day"
                            >
                                <span className="hidden sm:inline">Next Day</span>
                                <ChevronRight className="w-4 h-4 text-amber-500" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDate(new Date());
                                    if (activeTab !== 'scores') setActiveTab('scores');
                                }}
                                className="hidden md:flex items-center px-3 py-1.5 rounded-xl text-xs font-black text-slate-900 dark:text-white bg-white/90 dark:bg-[#0b241d] hover:bg-white dark:hover:bg-[#10342a] border border-emerald-200/80 dark:border-emerald-500/30 shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                                Today
                            </button>

                            {onOpenCalendar && (
                                <button
                                    type="button"
                                    onClick={onOpenCalendar}
                                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-xs"
                                    title="Open Full Gameweek Calendar"
                                    aria-label="Open Full Calendar"
                                >
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    <span className="hidden sm:inline">Full Calendar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


