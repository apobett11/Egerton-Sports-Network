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
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BarChart3 className="w-6 h-6 text-emerald-500" /> Journalist Performance Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              DB Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time readership reach, monthly publishing breakdown, and matchday editorial coverage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated Today</span>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS GRID - VIBRANT COLOR CODED WIDGETS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL IMPRESSIONS (BLUE) */}
        <div className={`p-4.5 rounded-2xl border ${cardBg} space-y-2 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all`}>
          <div className="flex items-center justify-between text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Total Impressions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {metrics.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High reader discovery
          </div>
        </div>

        {/* FULL READS (EMERALD) */}
        <div className={`p-4.5 rounded-2xl border ${cardBg} space-y-2 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all`}>
          <div className="flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span>Completed Reads</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.reads.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {metrics.avgReadTime} avg read time
          </div>
        </div>

        {/* ENGAGEMENT & SHARES (PURPLE) */}
        <div className={`p-4.5 rounded-2xl border ${cardBg} space-y-2 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all`}>
          <div className="flex items-center justify-between text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <span>Engagement Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {metrics.engagementRate}%
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
            {metrics.shares.toLocaleString()} article shares
          </div>
        </div>

        {/* MONTHLY OUTPUT (AMBER) */}
        <div className={`p-4.5 rounded-2xl border ${cardBg} space-y-2 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all`}>
          <div className="flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <span>This Month's Articles</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {metrics.articlesThisMonth}
          </div>
          <div className="text-[11px] text-slate-400 font-bold">
            {metrics.articlesToday} today • {metrics.articlesThisWeek} this week
          </div>
        </div>
      </div>

      {/* EDITORIAL PIPELINE STATUS STRIP */}
      <div className={`p-5 rounded-2xl border ${cardBg} space-y-3 shadow-sm`}>
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-500" /> Article Lifecycle & Publication Health
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Total Articles: {metrics.publishedCount + metrics.draftsCount + metrics.flaggedCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PUBLISHED */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">Live Published</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.publishedCount}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              Active in Feed
            </span>
          </div>

          {/* DRAFTS */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400">Working Drafts</span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.draftsCount}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              In Progress
            </span>
          </div>

          {/* FLAGGED / DISPUTED */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400">Flagged Reviews</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.flaggedCount}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Requires Action
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY & MATCHDAY DATABASE DISTRIBUTION BREAKDOWN */}
      <div className={`p-6 rounded-3xl border ${cardBg} space-y-5 shadow-xl`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="font-black text-sm md:text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Database Breakdown Distributions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated from production database journals sorted monthly and across matchdays.
            </p>
          </div>

          {/* TAB SWITCHER: MONTHLY VS MATCHDAY */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Monthly Timeline
            </button>
            <button
              onClick={() => setActiveTab('matchday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'matchday'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Matchday Distribution
            </button>
          </div>
        </div>

        {/* TAB 1: MONTHLY TIMELINE */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.monthlyStats && metrics.monthlyStats.length > 0 ? (
                metrics.monthlyStats.map((m) => (
                  <div
                    key={m.monthKey}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        {m.monthLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 font-mono text-[11px] font-black">
                        {m.count} articles
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Total Views: {m.views.toLocaleString()}</span>
                        <span>{Math.round((m.views / maxMonthlyViews) * 100)}% volume</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max((m.views / maxMonthlyViews) * 100, 10)}%` }}
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.matchdayStats && metrics.matchdayStats.length > 0 ? (
                metrics.matchdayStats.map((md) => (
                  <div
                    key={md.matchday}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        {md.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-black">
                        {md.count} journals
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Readership</span>
                        <span>{md.views.toLocaleString()} views</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max((md.count / maxMatchdayCount) * 100, 15)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOP ARTICLE */}
        <div className={`p-5 rounded-2xl border ${cardBg} space-y-2.5 shadow-sm hover:border-emerald-500/40 transition-all`}>
          <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span>Top Performing Story</span>
          </div>
          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
            {metrics.topArticle}
          </p>
          <div className="text-[11px] text-slate-400 font-semibold">
            Highest read count & reader retention in the newsroom.
          </div>
        </div>

        {/* TOP COMPETITION */}
        <div className={`p-5 rounded-2xl border ${cardBg} space-y-2.5 shadow-sm hover:border-blue-500/40 transition-all`}>
          <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Award className="w-4 h-4 text-blue-500" />
            <span>Primary Covered League</span>
          </div>
          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
            {metrics.topCompetition}
          </p>
          <div className="text-[11px] text-slate-400 font-semibold">
            Most frequent editorial assignments and reports.
          </div>
        </div>

        {/* MOST COVERED TEAM */}
        <div className={`p-5 rounded-2xl border ${cardBg} space-y-2.5 shadow-sm hover:border-purple-500/40 transition-all`}>
          <div className="flex items-center gap-2 text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Most Covered Club</span>
          </div>
          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
            {metrics.mostCoveredTeam}
          </p>
          <div className="text-[11px] text-slate-400 font-semibold">
            Team with highest match report and transfer coverage.
          </div>
        </div>
      </div>
    </div>
  );
};
