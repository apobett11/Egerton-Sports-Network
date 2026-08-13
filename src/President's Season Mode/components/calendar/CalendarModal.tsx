import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import type { SeasonFixture } from '../../types/seasonMode';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  fixtures: SeasonFixture[];
  onSelectDate: (dateStr: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  isDark,
  fixtures,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 2, 1)); // March 2026 default or current

  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  // Get day of week for 1st of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  let firstDayIndex = firstDayOfMonth.getDay(); 
  // Convert Sunday-first (0=Sun) to Monday-first (0=Mon, 1=Tue, ..., 6=Sun)
  let mondayFirstIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Map of date string (YYYY-MM-DD) -> fixture list
  const fixturesByDateMap: Record<string, SeasonFixture[]> = {};
  fixtures.forEach((f) => {
    if (!f.scheduled_time) return;
    const dateStr = f.scheduled_time.split('T')[0];
    if (!fixturesByDateMap[dateStr]) {
      fixturesByDateMap[dateStr] = [];
    }
    fixturesByDateMap[dateStr].push(f);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      <div
        className={`w-full max-w-md ${
          isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        } border rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/30 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 id="calendar-modal-title" className="text-base font-black tracking-tight">
                Operational Calendar
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Select date to view matchday</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calendar modal"
            className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={handlePrevMonth}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <span className="font-extrabold text-sm tracking-wide">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid — Monday-First Structure */}
        <div className="space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-black uppercase text-slate-400 py-1 border-b border-slate-800/40">
            {weekDayNames.map((dayName, i) => (
              <div key={dayName} className={i >= 5 ? 'text-amber-500/80 font-bold' : ''}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {/* Blank leading slots */}
            {Array.from({ length: mondayFirstIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-11 rounded-xl bg-transparent" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const monthStr = String(month + 1).padStart(2, '0');
              const dayStr = String(dayNumber).padStart(2, '0');
              const dateStr = `${year}-${monthStr}-${dayStr}`;

              const dayFixtures = fixturesByDateMap[dateStr] || [];
              const hasMatchday = dayFixtures.length > 0;
              const isCancelled = hasMatchday && dayFixtures.every((f) => f.status === 'CANCELLED');
              const isFriendly = hasMatchday && dayFixtures.some((f) => (f as any).is_friendly);

              // Determine slot visual styling
              let slotStyle = isDark
                ? 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';

              if (hasMatchday) {
                if (isCancelled) {
                  slotStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-400 font-black shadow-xs';
                } else if (isFriendly) {
                  slotStyle = 'bg-purple-500/20 border-purple-500/50 text-purple-400 font-black shadow-xs';
                } else {
                  slotStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-black shadow-xs';
                }
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onClose();
                  }}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer text-xs font-bold relative active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${slotStyle}`}
                >
                  <span>{dayNumber}</span>
                  {hasMatchday && (
                    <span className="text-[9px] font-mono leading-none tracking-tight">
                      {dayFixtures.length} match{dayFixtures.length > 1 ? 'es' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Matchday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Friendly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Off-day</span>
          </div>
        </div>
      </div>
    </div>
  );
};
