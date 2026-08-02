import React, { useState } from 'react';
import { Menu, Search, Sun, Moon, Calendar, ChevronLeft, ChevronRight, Newspaper, LogIn } from 'lucide-react';

interface HeaderProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    activeSport: string;
    setActiveSport: (sport: string) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    onMenuClick?: () => void;
    onNavigateNews?: () => void;
    onNavigateLogin?: () => void;
}

const SPORTS_PILLS = [
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'rugby', label: 'Rugby' },
    { id: 'hockey', label: 'Hockey' }
];

export const Header: React.FC<HeaderProps> = ({
    darkMode,
    toggleDarkMode,
    activeSport,
    setActiveSport,
    selectedDate,
    setSelectedDate,
    onMenuClick,
    onNavigateNews,
    onNavigateLogin
}) => {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Helper to format date
    const formatDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // Calendar Popup Modal State
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [viewDate, setViewDate] = useState(() => new Date(selectedDate));

    const handlePrevYear = () => {
        setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    };
    const handleNextYear = () => {
        setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    };
    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Days in month calculation
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <header className="sticky top-0 z-50 w-full shadow-lg backdrop-blur-xl select-none bg-white/90 dark:bg-[#101415]/90 text-gray-800 dark:text-gray-200 border-b border-gray-200/80 dark:border-gray-800/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {/* Row 1: Logo & Top controls */}
            <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 active:scale-90 transition-all duration-200 ring-1 ring-transparent hover:ring-emerald-500/20 outline-none cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { window.location.hash = '/home'; }}>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40 group-hover:scale-105 transition-transform duration-300">
                            E
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                                Egerton Sports
                            </span>
                            <span className="text-[9px] font-bold tracking-widest text-emerald-600/80 dark:text-emerald-400/80 uppercase -mt-1">
                                Campus League Hub
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                    {showSearch && (
                        <input
                            type="text"
                            placeholder="Search campus teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-800 dark:text-gray-100 max-w-[160px] transition-all duration-200"
                        />
                    )}

                    {/* Prominent News Header Button */}
                    <button
                        type="button"
                        onClick={onNavigateNews || (() => { window.location.hash = '/news'; })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                        aria-label="Campus News"
                    >
                        <Newspaper className="w-4 h-4" />
                        <span className="hidden sm:inline">News</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 active:scale-90 transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-emerald-500 cursor-pointer"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 active:scale-90 transition-all duration-200 text-gray-500 dark:text-gray-400 cursor-pointer"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Unified Login Button */}
                    <button
                        type="button"
                        onClick={onNavigateLogin || (() => { window.location.hash = '/login'; })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                        aria-label="Login"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Login</span>
                    </button>
                </div>
            </div>

            {/* Row 2: Scrollable Sports Pills */}
            <div className="border-t border-gray-150/80 dark:border-gray-800/60 bg-gray-50/50 dark:bg-black/40">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2 max-w-5xl mx-auto">
                    {SPORTS_PILLS.map((sport) => {
                        const isActive = activeSport === sport.id;
                        return (
                            <button
                                key={sport.id}
                                type="button"
                                onClick={() => setActiveSport(sport.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap tracking-wide transition-all duration-300 active:scale-95 cursor-pointer ${isActive
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/30'
                                        : 'bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-200/80 dark:border-gray-700/60'
                                    }`}
                            >
                                {sport.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Row 3: Date Navigator */}
            <div className="border-t border-gray-100 dark:border-gray-850/50 bg-white/50 dark:bg-[#131718]/80">
                <div className="flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
                    <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-550 dark:text-gray-400 active:scale-85 transition-all cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        {formatDateLabel(selectedDate)}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => changeDate(1)}
                            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-550 dark:text-gray-400 active:scale-85 transition-all cursor-pointer mr-1"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                        <button
                            type="button"
                            onClick={() => {
                                setViewDate(new Date(selectedDate));
                                setShowCalendarModal(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 active:scale-85 transition-all cursor-pointer"
                            title="Select Date from Calendar"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* FULL CALENDAR POPUP MODAL */}
            {showCalendarModal && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setShowCalendarModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-[#15191B] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Controls for Year and Month */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Previous Year"
                                >
                                    &laquo;
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Previous Month"
                                >
                                    &lt;
                                </button>
                            </div>

                            <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                                {monthNames[month]} {year}
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Next Month"
                                >
                                    &gt;
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"
                                    title="Next Year"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1;
                                const targetDate = new Date(year, month, dayNum);
                                const isSelected = targetDate.toDateString() === selectedDate.toDateString();
                                const isToday = targetDate.toDateString() === new Date().toDateString();

                                return (
                                    <button
                                        key={dayNum}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(targetDate);
                                            setShowCalendarModal(false);
                                        }}
                                        className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                                : isToday
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                                        }`}
                                    >
                                        {dayNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Footer / Close */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCalendarModal(false)}
                                className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
