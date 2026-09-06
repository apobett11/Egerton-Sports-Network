import React, { useState } from 'react';
import {
  BarChart3,
  Eye,
  FileText,
  Clock,
  Share2,
  Trophy,
  Layers,
  Users,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';
import { PerformanceMetrics } from '../../JournalistTypes';

interface JournalistAnalyticsViewProps {
  metrics: PerformanceMetrics;
  cardBg: string;
}

export const JournalistAnalyticsView: React.FC<JournalistAnalyticsViewProps> = ({
  metrics,
  cardBg,
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'matchday'>('monthly');

  const maxMonthlyViews = Math.max(...(metrics.monthlyStats || []).map((m) => m.views), 1);
  const maxMatchdayCount = Math.max(...(metrics.matchdayStats || []).map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              <BarChart3 className="w-5 h-5 text-[#ff0046]" /> Journalist Performance Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#14263b] text-[#ff0046] border border-[#1a2e45]">
              DB Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Real-time readership reach, monthly publishing breakdown, and matchday editorial coverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-white dark:bg-[#102237] text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1a2e45] flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider">Updated Today</span>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TOTAL IMPRESSIONS */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <span>Total Impressions</span>
            <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-slate-900 dark:text-white font-mono">
            {metrics.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#ff0046]" /> High reader discovery
          </div>
        </div>

        {/* COMPLETED READS */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <span>Completed Reads</span>
            <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-slate-900 dark:text-white font-mono">
            {metrics.reads.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#ff0046]" /> {metrics.avgReadTime} avg read time
          </div>
        </div>

        {/* ENGAGEMENT RATE */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <span>Engagement Rate</span>
            <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-slate-900 dark:text-white font-mono">
            {metrics.engagementRate}%
          </div>
          <div className="text-[11px] text-slate-400 font-bold">
            {metrics.shares.toLocaleString()} article shares
          </div>
        </div>

        {/* THIS MONTH'S ARTICLES */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <span>This Month's Articles</span>
            <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-slate-900 dark:text-white font-mono">
            {metrics.articlesThisMonth}
          </div>
          <div className="text-[11px] text-slate-400 font-bold">
            {metrics.articlesToday} today • {metrics.articlesThisWeek} this week
          </div>
        </div>
      </div>

      {/* EDITORIAL PIPELINE STATUS STRIP */}
      <div className="p-4 sm:p-5 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#ff0046]" /> Article Lifecycle & Publication Health
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            Total Articles: {metrics.publishedCount + metrics.draftsCount + metrics.flaggedCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PUBLISHED */}
          <div className="p-3.5 rounded-sm bg-[#ff0046]/10 border border-[#ff0046]/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ff0046]">Live Published</span>
              <div className="text-2xl font-black font-mono text-[#ff0046]">{metrics.publishedCount}</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#ff0046] text-white shadow-xs">
              Active in Feed
            </span>
          </div>

          {/* DRAFTS */}
          <div className="p-3.5 rounded-sm bg-[#152a40] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Working Drafts</span>
              <div className="text-2xl font-black font-mono text-white">{metrics.draftsCount}</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#1c3857] text-slate-200 border border-white/10">
              In Progress
            </span>
          </div>

          {/* FLAGGED / DISPUTED */}
          <div className="p-3.5 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Flagged Reviews</span>
              <div className="text-2xl font-black font-mono text-amber-400">{metrics.flaggedCount}</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Requires Action
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY & MATCHDAY DATABASE DISTRIBUTION BREAKDOWN */}
      <div className="p-4 sm:p-5 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-[#1a2e45] pb-3 gap-3">
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff0046]" /> Database Breakdown Distributions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              Aggregated from production database journals sorted monthly and across matchdays.
            </p>
          </div>

          {/* TAB SWITCHER: MONTHLY VS MATCHDAY */}
          <div className="flex items-center p-0.5 rounded-sm bg-[#0a1520] border border-[#1a2e45]">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-[#ff0046] text-white rounded-[2px] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Timeline
            </button>
            <button
              onClick={() => setActiveTab('matchday')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'matchday'
                  ? 'bg-[#ff0046] text-white rounded-[2px] shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Matchday Distribution
            </button>
          </div>
        </div>

        {/* TAB 1: MONTHLY TIMELINE */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {metrics.monthlyStats && metrics.monthlyStats.length > 0 ? (
                metrics.monthlyStats.map((m) => (
                  <div
                    key={m.monthKey}
                    className="p-3.5 rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#ff0046]" />
                        {m.monthLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-[#152a40] text-slate-200 border border-white/10 font-mono text-[10px] font-black uppercase">
                        {m.count} articles
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Total Views: {m.views.toLocaleString()}</span>
                        <span>{Math.round((m.views / maxMonthlyViews) * 100)}% volume</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#14263b] rounded-none overflow-hidden">
                        <div
                          style={{ width: `${Math.max((m.views / maxMonthlyViews) * 100, 10)}%` }}
                          className="h-full bg-[#ff0046] rounded-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-6 text-center text-xs font-bold text-slate-400">
                  No monthly distribution recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MATCHDAY DISTRIBUTION */}
        {activeTab === 'matchday' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {metrics.matchdayStats && metrics.matchdayStats.length > 0 ? (
                metrics.matchdayStats.map((md) => (
                  <div
                    key={md.matchday}
                    className="p-3.5 rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#ff0046]" />
                        {md.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-[#152a40] text-slate-200 border border-white/10 font-mono text-[10px] font-black uppercase">
                        {md.count} journals
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Readership</span>
                        <span>{md.views.toLocaleString()} views</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#14263b] rounded-none overflow-hidden">
                        <div
                          style={{ width: `${Math.max((md.count / maxMatchdayCount) * 100, 15)}%` }}
                          className="h-full bg-[#ff0046] rounded-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-6 text-center text-xs font-bold text-slate-400">
                  No matchday coverage records yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TOP PERFORMERS CARD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* TOP ARTICLE */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Trophy className="w-3.5 h-3.5 text-[#ff0046]" />
            <span>Top Performing Story</span>
          </div>
          <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white leading-snug">
            {metrics.topArticle}
          </p>
          <div className="text-[11px] text-slate-400 font-medium">
            Highest read count & reader retention in the newsroom.
          </div>
        </div>

        {/* TOP COMPETITION */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Award className="w-3.5 h-3.5 text-[#ff0046]" />
            <span>Primary Covered League</span>
          </div>
          <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white leading-snug">
            {metrics.topCompetition}
          </p>
          <div className="text-[11px] text-slate-400 font-medium">
            Most frequent editorial assignments and reports.
          </div>
        </div>

        {/* MOST COVERED TEAM */}
        <div className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Users className="w-3.5 h-3.5 text-[#ff0046]" />
            <span>Most Covered Club</span>
          </div>
          <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white leading-snug">
            {metrics.mostCoveredTeam}
          </p>
          <div className="text-[11px] text-slate-400 font-medium">
            Team with highest match report and transfer coverage.
          </div>
        </div>
      </div>
    </div>
  );
};
