import React, { useState, useMemo } from 'react';
import { Menu, Search, Sun, Moon, Calendar, ChevronLeft, ChevronRight, Newspaper, LogIn, Trophy, Filter, Award } from 'lucide-react';
import type { Match } from '../../types';

interface HeaderProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    activeSport: string;
    setActiveSport: (sport: string) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    selectedCompetitionId?: string;
    setSelectedCompetitionId?: (comp: string) => void;
    dbFixtures?: Match[];
    onMenuClick?: () => void;
    onNavigateNews?: () => void;
    onNavigateLogin?: () => void;
    isCalendarOpen?: boolean;
    onCloseCalendar?: () => void;
}

const COMPETITION_OPTIONS = [
    { id: 'all', label: 'All Competitions', shortLabel: 'All Leagues' },
    { id: '11111111-1111-1111-1111-111111111111', label: 'Egerton Premier League', shortLabel: 'Premier League' },
    { id: '22222222-2222-2222-2222-222222222222', label: 'Egerton Championships', shortLabel: 'Championship' },
    { id: 'friendlies', label: 'Friendlies', shortLabel: 'Friendlies' }
];

export const Header: React.FC<HeaderProps> = ({
    darkMode,
    toggleDarkMode,
    activeSport,
    setActiveSport,
    selectedDate,
    setSelectedDate,
    selectedCompetitionId = 'all',
    setSelectedCompetitionId,
    dbFixtures = [],
    onMenuClick,
    onNavigateNews,
    onNavigateLogin,
    isCalendarOpen = false,
    onCloseCalendar
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

    React.useEffect(() => {
      if (isCalendarOpen) {
        setShowCalendarModal(true);
      }
    }, [isCalendarOpen]);
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

    // Compute DB Match Indicators per day & Gameweeks per week
    const dateMatchMap = useMemo(() => {
        const map = new Map<string, { isLeague: boolean; isFriendly: boolean; matchday?: number }>();
        
        dbFixtures.forEach((f) => {
            if (!f.time && !f.id) return;
            // Parse fixture date
            let fDateStr = '';
            if (f.id && f.id.length > 10 && !isNaN(Date.parse(f.id))) {
                fDateStr = new Date(f.id).toDateString();
            } else {
                fDateStr = new Date().toDateString();
            }

            const isFriendly = f.league?.toLowerCase().includes('friendly');
            const isLeague = !isFriendly;

            if (!map.has(fDateStr)) {
                map.set(fDateStr, { isLeague, isFriendly, matchday: f.matchday });
            } else {
                const cur = map.get(fDateStr)!;
                map.set(fDateStr, {
                    isLeague: cur.isLeague || isLeague,
                    isFriendly: cur.isFriendly || isFriendly,
                    matchday: cur.matchday || f.matchday
                });
            }
        });

        return map;
    }, [dbFixtures]);

    return (
        <header className="sticky top-0 z-50 w-full select-none bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-b dark:border-white/5 shadow-sm transition-all duration-300">
            {/* Row 1: Logo & Top controls */}
            <div className="flex items-center justify-between w-full px-4 py-3 md:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer bg-white border border-slate-200 hover:shadow-md text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300"
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { window.location.hash = '/home'; }}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                            E
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                Egerton Sports
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Official Campus Hub
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right-side Action Controls */}
                <div className="flex items-center gap-2 md:gap-4">
                    {showSearch && (
                        <input
                            type="text"
                            placeholder="Search campus teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 max-w-[170px] transition-all duration-200 shadow-xs"
                        />
                    )}

                    {/* News Header Button */}
                    <button
                        type="button"
                        onClick={onNavigateNews || (() => { window.location.hash = '/news'; })}
                        className="flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl transition-all duration-200 cursor-pointer bg-white border border-slate-200 hover:shadow-md text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300 font-bold text-xs"
                        aria-label="Campus News"
                    >
                        <Newspaper className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">News</span>
                    </button>

                    {/* Search Button */}
                    <button
                        type="button"
                        onClick={() => setShowSearch(!showSearch)}
                        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer bg-white border border-slate-200 hover:shadow-md text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300"
                        aria-label="Search"
                    >
                        <Search className="w-4.5 h-4.5" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 cursor-pointer bg-white border border-slate-200 hover:shadow-md text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? (
                            <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon className="w-4.5 h-4.5 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Header Login Button */}
                    <button
                        type="button"
                        onClick={onNavigateLogin || (() => { window.location.hash = '/login'; })}
                        className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-900/20 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all cursor-pointer active:scale-95"
                        aria-label="Login"
                    >
                        <LogIn className="w-4 h-4 text-white" />
                        <span>Login</span>
                    </button>
                </div>
            </div>

            {/* Row 2: EGERTON SPORTS DEPARTMENT ECOSYSTEM BANNER (CALM CONTINUITY STRIP) */}
            <div className="border-t border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-[#12192B]/80 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar px-4 py-2 max-w-7xl mx-auto text-xs">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                            <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-[11px] sm:text-xs">
                            Egerton Premier League & Egerton Championships
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Premier League
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            Championships
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 3: DATE NAVIGATOR STRIP WITH EXPLICIT DAY MOVEMENT */}
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1524]/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
                    <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182236] hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
                        title="Move to previous day"
                        aria-label="Move to previous day"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
                        <span className="hidden sm:inline">Previous Day</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                            {formatDateLabel(selectedDate)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => changeDate(1)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182236] hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
                            title="Move to next day"
                            aria-label="Move to next day"
                        >
                            <span className="hidden sm:inline">Next Day</span>
                            <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                        </button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
                        <button
                            type="button"
                            onClick={() => {
                                setViewDate(new Date(selectedDate));
                                setShowCalendarModal(true);
                            }}
                            className="p-1.5 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-xs"
                            title="Database-Driven Monday-First Calendar"
                        >
                            <Calendar className="w-4 h-4 text-[#D4AF37]" />
                            <span className="hidden sm:inline">Full Calendar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* DATABASE-DRIVEN GAMEWEEK CALENDAR POPUP MODAL (MONDAY-FIRST) */}
            {showCalendarModal && (
                <div 
                    className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => {
                      setShowCalendarModal(false);
                      if (onCloseCalendar) onCloseCalendar();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Gameweek Calendar Modal"
                >
                    <div 
                        className="bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Controls for Year and Month */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Previous Year"
                                >
                                    &laquo;
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Previous Month"
                                >
                                    &lt;
                                </button>
                            </div>

                            <div className="text-center">
                                <span className="font-black text-base text-slate-900 dark:text-slate-100 block">
                                    {monthNames[month]} {year}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4AF37]">
                                    Database Gameweek Calendar
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Next Month"
                                >
                                    &gt;
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Next Year"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>

                        {/* Weekday Labels (Monday-First: Mo, Tu, We, Th, Fr, Sa, Su) */}
                        <div className="grid grid-cols-7 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                        </div>

                        {/* Month Grid with Monday-First calculations */}
                        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                            {/* Calculate empty slots for Monday-First: (firstDayIndex + 6) % 7 */}
                            {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1;
                                const targetDate = new Date(year, month, dayNum);
                                const dateKey = targetDate.toDateString();
                                const isSelected = dateKey === selectedDate.toDateString();
                                const isToday = dateKey === new Date().toDateString();

                                const matchInfo = dateMatchMap.get(dateKey);
                                const hasLeague = matchInfo?.isLeague;
                                const hasFriendly = matchInfo?.isFriendly;

                                const dayIndex = ((firstDayOfMonth + 6) % 7) + i;
                                const weekNum = Math.floor(dayIndex / 7) + 1;

                                return (
                                    <div key={dayNum} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDate(targetDate);
                                                setShowCalendarModal(false);
                                                if (onCloseCalendar) onCloseCalendar();
                                            }}
                                            className={`w-full py-2 rounded-2xl font-black text-xs transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                                                isSelected
                                                    ? 'bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 shadow-lg shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37]'
                                                    : isToday
                                                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <span>{dayNum}</span>

                                            {/* Color Indicators: Green for League Match, Amber for Friendly */}
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {hasLeague && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-emerald-400" title="League Match Scheduled" />
                                                )}
                                                {hasFriendly && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-amber-400" title="Friendly Match Scheduled" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Gameweek Badge indicator on start of week */}
                                        {(dayIndex % 7 === 0 || dayNum === 1) && (
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-widest bg-slate-950 text-[#D4AF37] border border-[#D4AF37]/30 rounded-md pointer-events-none z-10 whitespace-nowrap shadow-sm">
                                                {matchInfo?.matchday ? `GW ${matchInfo.matchday}` : `GW ${weekNum}`}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Calendar Indicators Legend */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> League
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Friendly
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCalendarModal(false);
                                    if (onCloseCalendar) onCloseCalendar();
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer shadow-sm transition-colors"
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

