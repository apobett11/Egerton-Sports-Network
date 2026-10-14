import React from 'react';

export const StorePageSkeleton: React.FC<{ theme?: 'dark' | 'light' }> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#09131f] text-slate-200' : 'bg-[#f3f6fa] text-slate-800'} animate-pulse`}>
      {/* Header Skeleton */}
      <div className={`h-14 sm:h-16 border-b flex items-center justify-between px-3 sm:px-6 ${
        isDark ? 'bg-[#102338]/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-700/40" />
          <div className="w-28 h-4 rounded-md bg-slate-700/30" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-48 h-7 rounded-xl bg-slate-700/30" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700/40" />
          <div className="w-8 h-8 rounded-full bg-slate-700/40" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 space-y-3">
        {/* Categories Bar Skeleton */}
        <div className={`rounded-2xl p-4 border ${
          isDark ? 'bg-[#13273e]/70 border-[#234568]/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-24 h-4 rounded bg-slate-700/40" />
            <div className="w-16 h-4 rounded bg-slate-700/40" />
          </div>
          <div className="flex gap-2.5 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-20 h-20 rounded-xl bg-slate-700/30 shrink-0" />
            ))}
          </div>
        </div>

        {/* What's New Skeleton */}
        <div className={`rounded-2xl p-4 border ${
          isDark ? 'bg-[#13273e]/70 border-[#234568]/60' : 'bg-white border-slate-200'
        }`}>
          <div className="w-32 h-4 rounded bg-slate-700/40 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-700/30" />
            ))}
          </div>
        </div>

        {/* All Products Grid Skeleton */}
        <div className={`rounded-2xl p-4 border ${
          isDark ? 'bg-[#13273e]/70 border-[#234568]/60' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-36 h-4 rounded bg-slate-700/40" />
            <div className="w-24 h-6 rounded bg-slate-700/30" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-52 rounded-xl bg-slate-700/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionSkeleton: React.FC<{ rows?: number; height?: string }> = ({ 
  rows = 4,
  height = 'h-48' 
}) => (
  <div className={`w-full rounded-2xl border p-4 bg-slate-800/20 border-slate-700/50 animate-pulse ${height}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-32 h-4 rounded bg-slate-700/50" />
      <div className="w-16 h-4 rounded bg-slate-700/40" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-slate-700/30" />
      ))}
    </div>
  </div>
);
