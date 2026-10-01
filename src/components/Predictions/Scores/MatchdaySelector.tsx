import React from 'react';
import { Calendar } from 'lucide-react';

interface MatchdaySelectorProps {
  matchdays: number[];
  activeMatchday: number;
  onSelectMatchday: (md: number) => void;
}

export const MatchdaySelector: React.FC<MatchdaySelectorProps> = ({
  matchdays,
  activeMatchday,
  onSelectMatchday,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto py-2 no-scrollbar">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Calendar className="h-3.5 w-3.5 text-[#ff0046]" />
        <span>EPL Schedule:</span>
      </div>
      <div className="flex items-center gap-2">
        {matchdays.map((md) => {
          const isActive = md === activeMatchday;
          return (
            <button
              key={md}
              type="button"
              onClick={() => onSelectMatchday(md)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#ff0046] text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-[#0e1c2b] text-slate-400 hover:text-white border border-[#1a2e45]'
              }`}
            >
              Matchday {md}
            </button>
          );
        })}
      </div>
    </div>
  );
};
