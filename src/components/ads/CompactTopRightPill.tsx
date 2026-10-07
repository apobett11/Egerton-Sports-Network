import React, { useState } from 'react';

const DIRECT_LINK_URL = 'https://omg10.com/4/11954980';

interface CompactTopRightPillProps {
  label?: string;
  badge?: string;
  variant?: 'purple' | 'emerald' | 'amber';
}

export const CompactTopRightPill: React.FC<CompactTopRightPillProps> = ({
  label = '2.5x Derby Boost',
  badge = 'HOT',
  variant = 'purple',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const colorConfig = {
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
      pulse: 'bg-purple-400',
      text: 'text-purple-300',
    },
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
      pulse: 'bg-emerald-400',
      text: 'text-emerald-300',
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
      pulse: 'bg-amber-400',
      text: 'text-amber-300',
    },
  }[variant];

  return (
    <aside
      aria-label="Campus Promotion"
      /* Anchored below the header (top-19 / ~76px) to avoid overlapping SCORES / NEWS */
      className="fixed top-[76px] right-3 z-30 pointer-events-auto select-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className={`flex items-center gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 border ${colorConfig.border} backdrop-blur-md rounded-full pl-2.5 pr-1.5 py-1 shadow-xl shadow-black/50`}>
        <a
          href={DIRECT_LINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 min-w-0 pr-1 group"
        >
          {/* Subtle Live Pulse Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorConfig.pulse} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${colorConfig.pulse}`} />
          </span>

          {/* Micro Category Chip */}
          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border tracking-wider ${colorConfig.badge}`}>
            {badge}
          </span>

          {/* Utility Action Label */}
          <span className="text-[10px] font-bold text-zinc-200 group-hover:text-white truncate max-w-[115px]">
            {label}
          </span>

          <span className={`${colorConfig.text} text-[10px] font-black group-hover:translate-x-0.5 transition-transform`}>
            →
          </span>
        </a>

        {/* Minimalist Close Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="w-4 h-4 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center text-[8px] shrink-0 transition cursor-pointer"
          aria-label="Dismiss chip"
        >
          ✕
        </button>
      </div>
    </aside>
  );
};
