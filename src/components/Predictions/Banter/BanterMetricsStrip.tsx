import React from 'react';
import { formatMetricNumber } from '@/utils/formatMetrics';

interface BanterMetricsStripProps {
  impressions: number;
  repliesCount: number;
  repostsCount: number;
  likesCount: number;
  onReply?: () => void;
  onRepost?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const BanterMetricsStrip: React.FC<BanterMetricsStripProps> = ({
  impressions,
  repliesCount,
  repostsCount,
  likesCount,
  onReply,
  onRepost,
  onLike,
  isLiked,
}) => {
  return (
    <div className="flex items-center justify-between text-zinc-500 text-xs mt-2 pt-2 border-t border-zinc-900/60 max-w-md">
      {/* Replies */}
      <button
        onClick={onReply}
        className="flex items-center gap-1.5 hover:text-sky-400 transition group"
        aria-label="Replies"
      >
        <span className="p-1 rounded-full group-hover:bg-sky-500/10">💬</span>
        <span className="font-mono text-[11px]">{formatMetricNumber(repliesCount)}</span>
      </button>

      {/* Reposts */}
      <button
        onClick={onRepost}
        className="flex items-center gap-1.5 hover:text-emerald-400 transition group"
        aria-label="Reposts"
      >
        <span className="p-1 rounded-full group-hover:bg-emerald-500/10">🔁</span>
        <span className="font-mono text-[11px]">{formatMetricNumber(repostsCount)}</span>
      </button>

      {/* Likes */}
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 hover:text-rose-400 transition group ${
          isLiked ? 'text-rose-500' : ''
        }`}
        aria-label="Likes"
      >
        <span className="p-1 rounded-full group-hover:bg-rose-500/10">
          {isLiked ? '❤️' : '🤍'}
        </span>
        <span className="font-mono text-[11px]">{formatMetricNumber(likesCount)}</span>
      </button>

      {/* Standard Impressions Bar */}
      <div className="flex items-center gap-1 text-zinc-600 select-none" title="Views">
        <span>📊</span>
        <span className="font-mono text-[11px]">{formatMetricNumber(impressions)}</span>
      </div>
    </div>
  );
};
