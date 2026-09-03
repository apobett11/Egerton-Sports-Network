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
            const rawDate = f.scheduledTime || (f as any).scheduled_time || (f as any).playday || (f as any).play_date;
            let fDateStr = '';
            if (rawDate) {
                const parsed = new Date(rawDate);
                if (!isNaN(parsed.getTime())) {
                    fDateStr = parsed.toDateString();
                }
            }
            if (!fDateStr) return;

            const isFriendly = f.league?.toLowerCase().includes('friendly') || (f as any).is_friendly || (f as any).competition_id === 'friendlies';
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
            <div className="w-full bg-[#0e1e2d] text-white py-2.5 px-3">
                <div className="max-w-7xl mx-auto flex items-center justify-center">
                    <div className="inline-flex items-center border border-slate-700/60 dark:border-slate-700/60 rounded-xl p-1 bg-[#0a1520]/80 backdrop-blur-xs shadow-md">
                        <button
                            type="button"
                            onClick={() => {
                                if (onSelectMainTab) onSelectMainTab('scores');
                                window.location.hash = '/home';
                            }}
                            className={`px-10 sm:px-16 md:px-24 py-3 sm:py-3.5 text-sm sm:text-base md:text-lg font-black uppercase tracking-wider transition-all duration-150 cursor-pointer rounded-lg flex items-center justify-center gap-2.5 border-r border-slate-700/60 ${
                                isScoresActive 
                                    ? 'bg-[#152a40] text-white shadow-sm font-black ring-1 ring-white/15' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#112236]/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs border border-current flex items-center justify-center text-[10px] sm:text-[11px] font-black leading-none ${
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
                            className={`px-10 sm:px-16 md:px-24 py-3 sm:py-3.5 text-sm sm:text-base md:text-lg font-black uppercase tracking-wider transition-all duration-150 cursor-pointer rounded-lg flex items-center justify-center gap-2.5 ${
                                isNewsActive 
                                    ? 'bg-[#152a40] text-white shadow-sm font-black ring-1 ring-white/15' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#112236]/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs border border-current flex items-center justify-center text-[10px] sm:text-[11px] font-black leading-none ${
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

            {/* ROW 3: SCORES SUB-MENU (LEFT ALIGNED: FAVOURITES ICON | FIXTURES | STANDINGS) */}
            {isScoresActive && (
                <div className="w-full bg-[#ffffff] dark:bg-[#0e1c2b] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-slate-800 dark:text-slate-100 transition-colors">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-0 flex items-center justify-start space-x-3 sm:space-x-6 h-10">
                        {/* 1. FAVOURITES (Orange Icon Button) */}
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

                        {/* 2. FIXTURES */}
                        <button
                            type="button"
                            onClick={() => {
                                if (onSelectMainTab) onSelectMainTab('scores');
                            }}
                            className={`flex items-center gap-1.5 h-full px-2 text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                                activeMainTab === 'scores'
                                    ? 'text-[#ff0046] border-[#ff0046]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>FIXTURES</span>
                        </button>

                        {/* 3. STANDINGS */}
                        <button
                            type="button"
                            onClick={() => {
                                if (onSelectMainTab) onSelectMainTab('table');
                            }}
                            className={`flex items-center gap-1.5 h-full px-2 text-xs sm:text-sm font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                                activeMainTab === 'table'
                                    ? 'text-[#ff0046] border-[#ff0046]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                            }`}
                        >
                            <span>STANDINGS</span>
                        </button>
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

                                const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
                                const isFriendly = Boolean(matchInfo?.isFriendly);
                                const isPlayday = Boolean(matchInfo?.isLeague) || (!isFriendly && isWeekend);

                                const tooltip = isFriendly
                                    ? `Friendly Match • ${targetDate.toLocaleDateString()}`
                                    : isPlayday
                                    ? `Playday ${matchInfo?.matchday ? `(Matchday ${matchInfo.matchday})` : ''} • ${targetDate.toLocaleDateString()}`
                                    : targetDate.toLocaleDateString();

                                return (
                                    <button
                                        key={dayNum}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(targetDate);
                                            setShowCalendarModal(false);
                                            if (onCloseCalendar) onCloseCalendar();
                                        }}
                                        title={tooltip}
                                        aria-label={tooltip}
                                        className="w-full py-0.5 rounded font-bold text-xs transition-colors cursor-pointer relative flex flex-col items-center justify-center group"
                                    >
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                                                isSelected
                                                    ? 'bg-[#ff0046] text-white font-black shadow-xs ' +
                                                      (isFriendly
                                                        ? 'border-2 border-purple-400 ring-2 ring-purple-400/30'
                                                        : isPlayday
                                                        ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/30'
                                                        : 'border-2 border-transparent')
                                                    : isFriendly
                                                    ? 'border-2 border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold hover:bg-purple-500/10'
                                                    : isPlayday
                                                    ? 'border-2 border-[#00b04f] text-[#00b04f] dark:text-emerald-400 font-extrabold hover:bg-emerald-500/10'
                                                    : isToday
                                                    ? 'bg-slate-200 dark:bg-[#18314e] text-slate-900 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-[#1f3f64]'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263b] font-medium'
                                            }`}
                                        >
                                            <span>{dayNum}</span>
                                        </div>
                                        {matchInfo?.matchday && (
                                            <span className="text-[7.5px] font-black uppercase text-[#00b04f] dark:text-emerald-400 leading-none mt-0.5">
                                                MD {matchInfo.matchday}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Modal Footer with Legend & Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 dark:border-[#1a2e45] flex items-center justify-between text-xs">
                            {/* Legend */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" title="Playday / League Matchday">
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-[#00b04f] inline-block shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Playday</span>
                                </div>
                                <div className="flex items-center gap-1" title="Friendly Match">
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-purple-500 inline-block shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Friendly</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                                    className="px-2.5 py-1 bg-slate-200 dark:bg-[#14263b] rounded font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};


