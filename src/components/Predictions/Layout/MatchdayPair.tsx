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
    <div className="flex flex-wrap items-center justify-center gap-2">
      {days.map((day) => {
        const isActive = day.dayKey
          ? day.dayKey === activeDayKey
          : day.matchday === activeMatchday;
        return (
          <button
            key={day.dayKey ?? day.matchday}
            type="button"
            onClick={() => onSelect(day.matchday, day.dayKey)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
              isActive
                ? 'bg-[#ff0046] text-white'
                : 'bg-[#14263b] text-slate-300 hover:bg-[#1b3450]'
            }`}
          >
            {day.label ?? `Matchday ${day.matchday}`}
          </button>
        );
      })}
    </div>
  );
};
