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
        <header className="sticky top-0 z-50 w-full shadow-lg backdrop-blur-xl select-none bg-white/90 dark:bg-[#090D16]/90 text-slate-800 dark:text-slate-200 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
            {/* Row 1: Logo & Top controls */}
            <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-90 transition-all duration-200 ring-1 ring-transparent hover:ring-emerald-500/20 outline-none cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
                                Official Campus Hub
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
                            className="px-3.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-slate-100 max-w-[160px] transition-all duration-200"
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
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-90 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-emerald-500 cursor-pointer"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-90 transition-all duration-200 text-slate-500 dark:text-slate-400 cursor-pointer"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
                        ) : (
                            <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
                        )}
                    </button>

                    {/* Header Login Button */}
                    <button
                        type="button"
                        onClick={onNavigateLogin || (() => { window.location.hash = '/login'; })}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                        aria-label="Login"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Login</span>
                    </button>
                </div>
            </div>

            {/* Row 2: EGERTON SPORTS DEPARTMENT ECOSYSTEM BANNER */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0E1424]/60">
                <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar px-4 py-2 max-w-7xl mx-auto text-xs">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            Egerton Premier League & Egerton Championships
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Premier League
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            Championships
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 3: Date Navigator */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-[#090D16]/80">
                <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
                    <button
                        type="button"
                        onClick={() => changeDate(-1)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 active:scale-85 transition-all cursor-pointer"
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
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 active:scale-85 transition-all cursor-pointer mr-1"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                        <button
                            type="button"
                            onClick={() => {
                                setViewDate(new Date(selectedDate));
                                setShowCalendarModal(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 active:scale-85 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                            title="Database-Driven Gameweek Calendar"
                        >
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <span className="hidden sm:inline">Gameweek Calendar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* PART 2 DATABASE-DRIVEN GAMEWEEK CALENDAR POPUP MODAL */}
            {showCalendarModal && (
                <div 
                    className="fixed inset-0 z-100 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => {
                      setShowCalendarModal(false);
                      if (onCloseCalendar) onCloseCalendar();
                    }}
                >
                    <div 
                        className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Controls for Year and Month */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    title="Previous Year"
                                >
                                    &laquo;
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    title="Previous Month"
                                >
                                    &lt;
                                </button>
                            </div>

                            <div className="text-center">
                                <span className="font-black text-base text-slate-900 dark:text-slate-100 block">
                                    {monthNames[month]} {year}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                                    Database Driven Fixtures
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    title="Next Month"
                                >
                                    &gt;
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextYear}
                                    className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    title="Next Year"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                        </div>

                        {/* Month Grid with Gameweeks and Indicators */}
                        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
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

                                // Derived Gameweek numbering per week row
                                const dayIndex = firstDayOfMonth + i;
                                const weekNum = Math.floor(dayIndex / 7) + 1;

                                return (
                                    <div key={dayNum} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDate(targetDate);
                                                setShowCalendarModal(false);
                                            }}
                                            className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                                    : isToday
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/40'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <span>{dayNum}</span>

                                            {/* Color Indicators: Green for League Match, Orange for Friendly */}
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
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-widest bg-slate-900 text-amber-400 border border-amber-500/30 rounded-md pointer-events-none z-10 whitespace-nowrap shadow-sm">
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
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> League Match
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Friendly
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCalendarModal(false)}
                                className="px-3 py-1 rounded-xl bg-slate-800 text-white text-xs font-black cursor-pointer hover:bg-slate-700"
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

