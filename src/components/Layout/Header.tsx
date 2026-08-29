import React, { useState, useMemo } from 'react';
import { Menu, Search, Sun, Moon, Calendar, ChevronLeft, ChevronRight, Star, X, LogIn, ChevronDown } from 'lucide-react';
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
    activeMainTab?: 'scores' | 'news' | 'table' | 'favorites';
    onSelectMainTab?: (tab: 'scores' | 'news' | 'table' | 'favorites') => void;
    favoritesCount?: number;
    isCalendarOpen?: boolean;
    onCloseCalendar?: () => void;
}

const SPORTS_LIST = [
    { id: 'football', label: 'FOOTBALL' },
    { id: 'epl', label: 'EPL' },
    { id: 'championships', label: 'CHAMPIONSHIPS' },
    { id: 'kpl', label: 'KPL' },
    { id: 'basketball', label: 'BASKETBALL' },
    { id: 'tennis', label: 'TENNIS' },
    { id: 'volleyball', label: 'VOLLEYBALL' },
    { id: 'ice_hockey', label: 'ICE HOCKEY' },
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
    activeMainTab = 'scores',
    onSelectMainTab,
    favoritesCount = 0,
    isCalendarOpen = false,
    onCloseCalendar
}) => {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Calendar Modal State
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [viewDate, setViewDate] = useState(() => new Date(selectedDate));

    React.useEffect(() => {
        if (isCalendarOpen) {
            setViewDate(new Date(selectedDate));
            setShowCalendarModal(true);
        }
    }, [isCalendarOpen, selectedDate]);

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

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dateMatchMap = useMemo(() => {
        const map = new Map<string, { isLeague: boolean; isFriendly: boolean; matchday?: number }>();
        dbFixtures.forEach((f) => {
            if (!f.time && !f.id) return;
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

    const isNewsActive = activeMainTab === 'news';
    const isScoresActive = activeMainTab === 'scores' || activeMainTab === 'table' || activeMainTab === 'favorites';

    return (
        <header className="sticky top-0 z-50 w-full select-none shadow-md">
            {/* ROW 1: ESN LOGO & SEARCH/HAMBURGER */}
            <div className="w-full bg-[#0e1e2d] text-white border-b border-[#14263b] px-3 sm:px-4 py-2.5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand / Logo */}
                    <div 
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => {
                            if (onSelectMainTab) onSelectMainTab('scores');
                            window.location.hash = '/home';
                        }}
                    >
                        {/* ESN Iconic Red Wedge Icon */}
                        <div className="flex items-center gap-0.5">
                            <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
                            <div className="w-1.5 h-6 bg-white transform -skew-x-12 rounded-[1.5px] opacity-90" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-black text-xl tracking-tight uppercase text-white font-sans">
                                ESN
                            </span>
                            <span className="text-[8.5px] font-bold tracking-widest uppercase text-slate-400">
                                EGERTON SPORTS
                            </span>
                        </div>
                    </div>

                    {/* Right Controls: Search + Hamburger Menu */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {showSearch && (
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search teams, players..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="px-3 py-1.5 text-xs bg-[#15273b] border border-[#223b56] rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-[#ff0046] w-40 sm:w-56"
                                />
                                {searchQuery && (
                                    <button 
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 rounded-md hover:bg-[#182f47] text-slate-300 hover:text-white transition-colors cursor-pointer"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            onClick={onMenuClick}
                            className="p-2 rounded-md hover:bg-[#182f47] text-slate-300 hover:text-white transition-colors cursor-pointer"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ROW 2: PRIMARY TABS (SCORES | NEWS) */}
            <div className="w-full bg-[#0e1e2d] text-white py-2 px-3">
                <div className="max-w-7xl mx-auto flex items-center justify-center">
                    <div className="inline-flex items-center border border-slate-700/60 dark:border-slate-700/60 rounded-lg p-0.5 bg-[#0a1520]/80 backdrop-blur-xs shadow-xs">
                        <button
                            type="button"
                            onClick={() => {
                                if (onSelectMainTab) onSelectMainTab('scores');
                                window.location.hash = '/home';
                            }}
                            className={`px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 cursor-pointer rounded-md flex items-center justify-center gap-2 border-r border-slate-700/60 ${
                                isScoresActive 
                                    ? 'bg-[#152a40] text-white shadow-xs font-black ring-1 ring-white/10' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#112236]/50'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={`w-3.5 h-3.5 rounded-xs border border-current flex items-center justify-center text-[9px] font-black leading-none ${
                                    isScoresActive ? 'bg-[#ff0046] border-[#ff0046] text-white' : ''
                                }`}>
                                    10
                                </span>
                                <span>SCORES</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (onSelectMainTab) onSelectMainTab('news');
                                if (onNavigateNews) onNavigateNews();
                                window.location.hash = '/news';
                            }}
                            className={`px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-150 cursor-pointer rounded-md flex items-center justify-center gap-2 ${
                                isNewsActive 
                                    ? 'bg-[#152a40] text-white shadow-xs font-black ring-1 ring-white/10' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#112236]/50'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={`w-3.5 h-3.5 rounded-xs border border-current flex items-center justify-center text-[9px] font-black leading-none ${
                                    isNewsActive ? 'bg-[#ff0046] border-[#ff0046] text-white' : ''
                                }`}>
                                    ≡
                                </span>
                                <span>NEWS</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* ROW 3: SCORES SUB-MENU (FAVOURITES ICON | CENTERED EQUI-DISTANT FIXTURES & STANDINGS) */}
            {isScoresActive && (
                <div className="w-full bg-[#ffffff] dark:bg-[#0e1c2b] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-slate-800 dark:text-slate-100 transition-colors">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-0 flex items-center justify-between relative h-10">
                        {/* 1. FAVOURITES (Orange Icon Button) */}
                        <div className="flex items-center z-10">
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectMainTab) onSelectMainTab('favorites');
                                }}
                                className={`p-1.5 sm:p-2 rounded-md cursor-pointer transition-colors relative flex items-center justify-center ${
                                    activeMainTab === 'favorites'
                                        ? 'bg-amber-500/15 ring-1 ring-amber-500/40'
                                        : 'hover:bg-slate-100 dark:hover:bg-[#14263b]'
                                }`}
                                title={`Favourites (${favoritesCount})`}
                                aria-label={`Favourites (${favoritesCount})`}
                            >
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 transition-transform hover:scale-110" />
                                {favoritesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#ff0046] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                        {favoritesCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* 2 & 3. CENTERED & EQUI-DISTANT FIXTURES & STANDINGS */}
                        <div className="absolute inset-0 flex items-center justify-center space-x-6 sm:space-x-12 pointer-events-none">
                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectMainTab) onSelectMainTab('scores');
                                }}
                                className={`pointer-events-auto flex items-center gap-1.5 h-full px-2 text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                                    activeMainTab === 'scores'
                                        ? 'text-[#ff0046] border-[#ff0046]'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>FIXTURES</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (onSelectMainTab) onSelectMainTab('table');
                                }}
                                className={`pointer-events-auto flex items-center gap-1.5 h-full px-2 text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                                    activeMainTab === 'table'
                                        ? 'text-[#ff0046] border-[#ff0046]'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                                }`}
                            >
                                <span>STANDINGS</span>
                            </button>
                        </div>

                        {/* Right balance spacer for symmetry */}
                        <div className="w-8 shrink-0 pointer-events-none" />
                    </div>
                </div>
            )}

            {/* FLASH-SCORE POPUP CALENDAR MODAL */}
            {showCalendarModal && (
                <div 
                    className="fixed inset-0 z-100 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => {
                        setShowCalendarModal(false);
                        if (onCloseCalendar) onCloseCalendar();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select Match Date"
                >
                    <div 
                        className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl p-5 w-full max-w-sm shadow-2xl space-y-4 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Month & Year Navigator */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a2e45]">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevYear}
                                    className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Previous Year"
                                >
                                    &laquo;
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Previous Month"
                                >
                                    &lt;
                                </button>
                            </div>

                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {monthNames[month]} {year}
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Next Month"
                                >
                                    &gt;
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextYear}
                                    className="px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-200 cursor-pointer"
                                    title="Next Year"
                                >
                                    &raquo;
                                </button>
                            </div>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
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

                                return (
                                    <button
                                        key={dayNum}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(targetDate);
                                            setShowCalendarModal(false);
                                            if (onCloseCalendar) onCloseCalendar();
                                        }}
                                        className={`w-full py-2 rounded font-bold text-xs transition-colors cursor-pointer relative flex flex-col items-center justify-center ${
                                            isSelected
                                                ? 'bg-[#ff0046] text-white font-extrabold shadow-sm'
                                                : isToday
                                                ? 'bg-slate-200 dark:bg-[#18314e] text-slate-900 dark:text-white'
                                                : 'hover:bg-slate-100 dark:hover:bg-[#14263b] text-slate-800 dark:text-slate-200'
                                        }`}
                                    >
                                        <span>{dayNum}</span>
                                        {matchInfo && (
                                            <span className="w-1 h-1 rounded-full bg-[#ff0046] mt-0.5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-[#1a2e45] flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDate(new Date());
                                    setShowCalendarModal(false);
                                    if (onCloseCalendar) onCloseCalendar();
                                }}
                                className="text-xs font-bold text-[#ff0046] hover:underline cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCalendarModal(false);
                                    if (onCloseCalendar) onCloseCalendar();
                                }}
                                className="px-3 py-1 bg-slate-200 dark:bg-[#14263b] rounded font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
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


