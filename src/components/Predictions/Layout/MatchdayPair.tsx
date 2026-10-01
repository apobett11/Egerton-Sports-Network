import React from 'react';

export interface MatchdayPairDay {
  matchday: number;
  team: string;
  line: string;
}

interface MatchdayPairProps {
  days: MatchdayPairDay[];
  activeMatchday: number;
  onSelect: (matchday: number) => void;
}

export const MatchdayPair: React.FC<MatchdayPairProps> = ({ days, activeMatchday, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {days.map((day) => {
        const isActive = day.matchday === activeMatchday;
        return (
          <button
            key={day.matchday}
            type="button"
            onClick={() => onSelect(day.matchday)}
            className={`min-w-0 rounded-full px-3 py-1.5 text-left cursor-pointer transition-colors ${
              isActive
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'bg-[#14263b] text-slate-300 hover:bg-[#1b3450]'
            }`}
          >
            <span className="block text-[10px] font-black uppercase tracking-wider leading-none">
              Matchday {day.matchday}
            </span>
            <span className="mt-1 block truncate text-xs font-black leading-tight">{day.team}</span>
            <span className={`block truncate text-[10px] font-bold leading-tight ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
              {day.line}
            </span>
          </button>
        );
      })}
    </div>
  );
};
