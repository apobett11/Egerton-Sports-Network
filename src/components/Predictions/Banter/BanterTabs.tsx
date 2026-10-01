import React from 'react';
import type { BanterFilterType } from '../../../types/predictions';

interface BanterTabsProps {
  activeFilter: BanterFilterType;
  onSelectFilter: (filter: BanterFilterType) => void;
  activeMatchContextName?: string | null;
  onClearMatchContext?: () => void;
}

const SORTS: { id: BanterFilterType; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'coach', label: 'Coach updates' },
  { id: 'latest', label: 'Latest' },
  { id: 'all', label: 'All' },
];

export const BanterTabs: React.FC<BanterTabsProps> = ({
  activeFilter,
  onSelectFilter,
  activeMatchContextName,
  onClearMatchContext,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {SORTS.map((sort) => {
          const isActive = activeFilter === sort.id;
          return (
            <button
              key={sort.id}
              type="button"
              onClick={() => onSelectFilter(sort.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black cursor-pointer transition-colors sm:px-4 ${
                isActive
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'bg-[#14263b] text-slate-300 hover:bg-[#1b3450]'
              }`}
            >
              {sort.label}
            </button>
          );
        })}
      </div>

      {activeMatchContextName && onClearMatchContext && (
        <button
          type="button"
          onClick={onClearMatchContext}
          className="shrink-0 rounded-full bg-[#14263b] px-3 py-1 text-[11px] font-black text-white cursor-pointer"
        >
          {activeMatchContextName} ✕
        </button>
      )}
    </div>
  );
};
