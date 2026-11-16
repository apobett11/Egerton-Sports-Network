import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BanterFilterType } from '../../types/predictions';

interface BanterTabsProps {
  activeFilter: BanterFilterType;
  onSelectFilter: (filter: BanterFilterType) => void;
  activeMatchContextName?: string | null;
  onClearMatchContext?: () => void;
  onBack?: () => void;
}

const SORTS: { id: BanterFilterType; label: string }[] = [
  { id: 'all', label: 'For you' },
  { id: 'trending', label: 'Trending' },
  { id: 'teams', label: 'Teams' },
  { id: 'coach', label: 'Coaches' },
  { id: 'analytics', label: 'Journals' },
];

export const BanterTabs: React.FC<BanterTabsProps> = ({
  activeFilter,
  onSelectFilter,
  activeMatchContextName,
  onClearMatchContext,
  onBack,
}) => {
  return (
    <div className="w-full border-b border-zinc-800/80 bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar px-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 p-2 mr-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Back"
            title="Back"
            data-testid="banter-tabs-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-stretch gap-1 sm:gap-2">
          {SORTS.map((sort) => {
            const isActive = activeFilter === sort.id;
            return (
              <button
                key={sort.id}
                type="button"
                onClick={() => onSelectFilter(sort.id)}
                className={`relative shrink-0 px-3.5 py-3 text-sm font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{sort.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-1 bg-[#1d9bf0] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {activeMatchContextName && onClearMatchContext && (
          <button
            type="button"
            onClick={onClearMatchContext}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-700/60 px-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer mr-1"
          >
            <span>{activeMatchContextName}</span>
            <span className="text-zinc-500 hover:text-rose-400 text-xs">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};
