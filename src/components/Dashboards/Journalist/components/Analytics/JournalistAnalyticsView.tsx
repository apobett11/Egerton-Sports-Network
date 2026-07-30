import React from 'react';
import { BarChart3, Eye, ThumbsUp, DollarSign, Star } from 'lucide-react';
import type { JournalistRatingInfo, MockAnalytics } from '../../JournalistTypes';

interface JournalistAnalyticsViewProps {
  cardBg: string;
  ratingData: JournalistRatingInfo;
  analytics: MockAnalytics;
}

export const JournalistAnalyticsView: React.FC<JournalistAnalyticsViewProps> = ({
  cardBg,
  ratingData,
  analytics,
}) => {
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg} space-y-6 shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#148A54]" /> Media Channel Analytics & Performance
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Real-time reader reach, article impressions, and monetized royalty earnings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Total Impressions</span>
              <Eye className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{analytics.totalViews}</div>
            <div className="text-[10px] text-emerald-500 font-bold">+18.4% this week</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Reader Engagement</span>
              <ThumbsUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{analytics.engagementRate}%</div>
            <div className="text-[10px] text-blue-500 font-bold">+4.2% interaction rate</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Royalty Earnings</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">KES {analytics.earnings}</div>
            <div className="text-[10px] text-amber-500 font-bold">Payout ready</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
              <span>Journalist Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-black text-[#148A54]">{ratingData.rating} / 5.0</div>
            <div className="text-[10px] text-emerald-500 font-bold">{ratingData.badgeText}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
