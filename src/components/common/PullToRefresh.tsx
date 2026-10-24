import React, { useState, useRef, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  pullThreshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullThreshold = 65,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const isAtTop = () => {
    if (typeof window !== 'undefined') {
      return (window.pageYOffset || document.documentElement.scrollTop || 0) <= 2;
    }
    return true;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAtTop()) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.45, pullThreshold + 25);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= pullThreshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(pullThreshold);

      if ('vibrate' in navigator) navigator.vibrate(40);

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* Pull / Spinner Indicator */}
      <div
        style={{ height: `${pullDistance}px` }}
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out text-zinc-400"
      >
        {refreshing ? (
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div
            style={{ transform: `rotate(${Math.min(pullDistance * 4, 180)}deg)` }}
            className="text-xs font-mono font-bold transition-transform text-sky-400"
          >
            ↓
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
