import React from 'react';

export interface MatchdayPairDay {
  matchday: number;
  dayKey?: string;
  label?: string;
  team?: string;
  line?: string;
}

interface MatchdayPairProps {
  days: MatchdayPairDay[];
  activeMatchday: number;
  activeDayKey?: string;
  onSelect: (matchday: number, dayKey?: string) => void;
}

export const MatchdayPair: React.FC<MatchdayPairProps> = ({ days, activeMatchday, activeDayKey, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {days.map((day) => {
        const isActive = day.dayKey
          ? day.dayKey === activeDayKey
          : day.matchday === activeMatchday;
        return (
          <button
            key={day.dayKey ?? day.matchday}
            type="button"
            onClick={() => onSelect(day.matchday, day.dayKey)}
            className={`min-w-0 rounded-lg border px-2 py-1 text-center cursor-pointer transition-colors ${
              isActive
                ? 'border-[#ff0046]/80 bg-[#ff0046]/15 text-white'
                : 'border-[#29435d] bg-[#0e1c2b] text-slate-400 hover:border-slate-500'
            }`}
          >
            <span className="block truncate text-[9px] font-semibold uppercase tracking-wide leading-tight">
              {day.label ?? `Matchday ${day.matchday}`}
            </span>
          </button>
        );
      })}
    </div>
  );
};
