import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Plus, X } from 'lucide-react';
import type { OperationalMatch } from '../../types/seasonMode';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface CalendarViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  showToast: (msg: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  isDark,
  fixtures,
  showToast,
}) => {
  // Current month state (Default August 2026 / current date)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Availability Overrides: dateStr -> 'AVAILABLE' | 'UNAVAILABLE'
  const [dateOverrides, setDateOverrides] = useState<Record<string, 'AVAILABLE' | 'UNAVAILABLE'>>({});

  // Confirmation Modals
  const [confirmToggleDate, setConfirmToggleDate] = useState<{ dateStr: string; action: 'ADD' | 'CANCEL' } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray = useMemo(() => {
    const arr = [];
    // Padding days for initial day of week
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;
      arr.push({ dayNumber: d, dateStr });
    }
    return arr;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleConfirmAvailabilityToggle = () => {
    if (!confirmToggleDate) return;
    const { dateStr, action } = confirmToggleDate;

    setDateOverrides((prev) => ({
      ...prev,
      [dateStr]: action === 'ADD' ? 'AVAILABLE' : 'UNAVAILABLE',
    }));

    showToast(action === 'ADD' ? `Matchday added for ${dateStr}.` : `Weekend ${dateStr} marked unavailable.`);
    setConfirmToggleDate(null);
  };

  // Selected Date matches
  const selectedDateMatches = useMemo(() => {
    if (!selectedDateStr) return [];
    return fixtures.filter((f) => f.scheduled_time && f.scheduled_time.startsWith(selectedDateStr));
  }, [selectedDateStr, fixtures]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Operational Season Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Saturday & Sunday are default league matchdays. Click dates to adjust availability or inspect scheduled fixtures.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00b04f]" />
            <span className="text-slate-300">Green (League Matchday)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046]" />
            <span className="text-slate-300">Red (Unavailable Weekend)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-slate-300">Sky (Friendly)</span>
          </div>
        </div>
      </div>

      {/* MONTH CONTROL & CALENDAR GRID */}
      <div
        className={`p-6 rounded-md border space-y-4 ${
          isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xs border border-[#1a2e45] text-slate-400 hover:text-white hover:bg-[#152a40] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xs border border-[#1a2e45] text-slate-400 hover:text-white hover:bg-[#152a40] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((item, idx) => {
            if (!item) {
              return <div key={`pad-${idx}`} className="h-24 rounded-xs bg-transparent" />;
            }

            const { dayNumber, dateStr } = item;
            const dayOfWeek = new Date(dateStr).getDay();
            const isDefaultWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun or Sat

            const override = dateOverrides[dateStr];
            let isMatchday = isDefaultWeekend;
            if (override === 'AVAILABLE') isMatchday = true;
            if (override === 'UNAVAILABLE') isMatchday = false;

            const matchesOnDate = fixtures.filter(
              (f) => f.scheduled_time && f.scheduled_time.startsWith(dateStr)
            );
            const hasFriendly = matchesOnDate.some((f) => f.is_friendly || f.competition_id === 'friendlies');

            let cardBg = isDark ? 'bg-[#102237]/60 border-[#1a2e45]' : 'bg-slate-50 border-slate-200';
            if (hasFriendly) {
              cardBg = isDark ? 'bg-sky-950/20 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-200';
            } else if (isMatchday && isDefaultWeekend && override !== 'UNAVAILABLE') {
              cardBg = isDark ? 'bg-[#00b04f]/10 border-[#00b04f]/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200';
            } else if (override === 'UNAVAILABLE') {
              cardBg = isDark ? 'bg-[#ff0046]/10 border-[#ff0046]/30 text-rose-200' : 'bg-rose-50 border-rose-200';
            } else if (override === 'AVAILABLE') {
              cardBg = isDark ? 'bg-[#00b04f]/10 border-[#00b04f]/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200';
            }

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`p-3 rounded-xs border min-h-[90px] flex flex-col justify-between cursor-pointer transition-all hover:border-[#ff0046]/50 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs">{dayNumber}</span>
                  {hasFriendly ? (
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                  ) : isMatchday ? (
                    <span className="w-2 h-2 rounded-full bg-[#00b04f]" />
                  ) : override === 'UNAVAILABLE' ? (
                    <span className="w-2 h-2 rounded-full bg-[#ff0046]" />
                  ) : null}
                </div>

                <div className="space-y-1">
                  {matchesOnDate.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-xs bg-[#15273b] border border-[#1a2e45] block text-center truncate text-slate-200">
                      {matchesOnDate.length} Match(es)
                    </span>
                  )}

                  {/* Toggle button */}
                  <div className="flex items-center justify-end">
                    {isMatchday ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmToggleDate({ dateStr, action: 'CANCEL' });
                        }}
                        title="Cancel Matchday Availability"
                        className="text-[10px] font-bold text-[#ff0046] hover:underline"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmToggleDate({ dateStr, action: 'ADD' });
                        }}
                        title="Add Weekday Matchday"
                        className="text-[10px] font-bold text-[#00b04f] hover:underline"
                      >
                        + Matchday
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELECTED DATE DETAILS DRAWER / MODAL */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg p-6 rounded-xl border border-[#1a2e45] space-y-4 animate-scaleUp max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-[#0e1e2d] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <div>
                <h3 className="font-black text-lg">Operational Schedule: {selectedDateStr}</h3>
                <p className="text-xs text-slate-400">{selectedDateMatches.length} Matches Scheduled</p>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            {selectedDateMatches.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No matches scheduled on {selectedDateStr}.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateMatches.map((m) => (
                  <div key={m.id} className="p-4 rounded-sm bg-[#0e1c2b] border border-[#1a2e45] space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#ff0046]">
                        {m.is_friendly ? 'FRIENDLY' : `Matchday ${m.matchday}`}
                      </span>
                      <span className="text-slate-400">{m.scheduled_time?.split('T')[1]?.slice(0, 5) || '15:00'}</span>
                    </div>
                    <div className="font-extrabold text-sm text-white">
                      {m.home_team?.name || 'Team A'} vs {m.away_team?.name || 'Team B'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Pitch: {m.venue} | Referee: {m.referee?.name || 'Unassigned'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM AVAILABILITY CHANGE MODAL */}
      {confirmToggleDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md p-6 rounded-xl border border-[#1a2e45] space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0e1e2d] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="font-black text-lg">
              {confirmToggleDate.action === 'ADD' ? 'Add Weekday Matchday?' : 'Cancel Weekend Matchday?'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {confirmToggleDate.action === 'ADD'
                ? `Mark ${confirmToggleDate.dateStr} as an official valid matchday for scheduling.`
                : `Explicitly mark weekend ${confirmToggleDate.dateStr} as unavailable for matches.`}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmToggleDate(null)}
                className="flex-1 py-2.5 rounded-xs border border-[#1a2e45] text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-[#152a40] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAvailabilityToggle}
                className="flex-1 py-2.5 rounded-xs bg-[#ff0046] hover:bg-[#e0003e] text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
