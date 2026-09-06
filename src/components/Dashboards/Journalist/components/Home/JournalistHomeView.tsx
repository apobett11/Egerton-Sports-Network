import React from 'react';
import {
  Radio,
  PenSquare,
  FileText,
  BarChart3,
  Bookmark,
  ChevronRight,
  Eye,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Share2,
  PlusCircle,
  Activity,
} from 'lucide-react';
import {
  CurrentMatchEvent,
  ArticlePost,
  PerformanceMetrics,
  ARTICLE_CATEGORY_LABELS,
} from '../../JournalistTypes';

interface JournalistHomeViewProps {
  matches: CurrentMatchEvent[];
  onSelectMatchForEvents: (match: CurrentMatchEvent) => void;
  onOpenMatchSelector: () => void;
  onOpenCompose: () => void;
  onNavigateTab: (tab: 'articles' | 'analytics') => void;
  performanceMetrics: PerformanceMetrics;
  articles: ArticlePost[];
  onViewArticle: (article: ArticlePost) => void;
  triggerToast: (msg: string) => void;
  cardBg: string;
  hoverBg: string;
}

export const JournalistHomeView: React.FC<JournalistHomeViewProps> = ({
  matches,
  onSelectMatchForEvents,
  onOpenMatchSelector,
  onOpenCompose,
  onNavigateTab,
  performanceMetrics,
  articles,
  onViewArticle,
  triggerToast,
  cardBg,
  hoverBg,
}) => {
  // Ongoing live matches filter (matches currently in progress today)
  const ongoingMatches = matches.filter(
    (m) =>
      m.status === 'LIVE' ||
      m.status === 'HT' ||
      m.status === 'SECOND_HALF' ||
      (m.status as string) === '1H' ||
      (m.status as string) === '2H'
  );

  // Fallback today matches if no live ongoing ones (upcoming or recent today)
  const displayMatches = ongoingMatches.length > 0 ? ongoingMatches : matches.slice(0, 3);

  // Today's articles (max 3, newest first)
  const todayArticles = articles
    .filter((a) => a.isToday || a.status === 'published')
    .slice(0, 3);

  const totalPipelineCount = (performanceMetrics.publishedCount || 0) + (performanceMetrics.draftsCount || 0);
  const publishedRatio = totalPipelineCount > 0 
    ? Math.round((performanceMetrics.publishedCount / totalPipelineCount) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION: THIN MATCH STRIPS FOR CURRENT ONGOING EVENTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046] animate-pulse" />
            <h2 className="font-black text-xs uppercase tracking-wider text-[#ff0046] flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#ff0046]" />
              {ongoingMatches.length > 0 ? "Current Ongoing Matches (Click Strip to Log Events)" : "Today's Match Strips (Click to Manage Events)"}
            </h2>
          </div>
          <button
            onClick={onOpenMatchSelector}
            className="text-[11px] font-black uppercase tracking-wider text-[#ff0046] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Browse All Fixtures</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayMatches.length === 0 ? (
          <div className="p-6 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] text-center space-y-2 shadow-xs">
            <Activity className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matches found in database for today.</p>
            <button
              onClick={onOpenMatchSelector}
              className="px-3.5 py-1.5 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
            >
              Select Match from Archive
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayMatches.map((m) => {
              const isLive = m.status === 'LIVE' || m.status === 'HT' || m.status === 'SECOND_HALF';
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatchForEvents(m)}
                  className="p-3.5 md:p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
                  title={`Click to open live events module for ${m.homeTeam} vs ${m.awayTeam}`}
                >
                  {/* Subtle live indicator left accent border */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isLive ? 'bg-[#ff0046]' : 'bg-[#1a2e45]'
                    }`}
                  />

                  {/* LEFT: LEAGUE, STATUS & TEAMS */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 pl-1 sm:pl-1.5">
                    {/* STATUS PILL */}
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          isLive
                            ? 'bg-[#ff0046] text-white animate-pulse'
                            : m.status === 'FT'
                            ? 'bg-[#152a40] text-slate-300 border border-white/10'
                            : 'bg-[#14263b] text-slate-300 border border-[#223b56]'
                        }`}
                      >
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                        {m.status}
                      </span>
                      {m.minute && (
                        <span className="text-[10px] font-mono font-extrabold text-[#ff0046] mt-0.5">
                          {m.minute}
                        </span>
                      )}
                    </div>

                    {/* TEAMS & SCORE */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Layers className="w-3 h-3 text-[#ff0046]" />
                        <span className="truncate max-w-[200px]">{m.competition}</span>
                        {m.venue && <span className="hidden md:inline">• {m.venue}</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-[#ff0046] transition-colors flex items-center gap-2 truncate">
                          <span className="truncate font-black">{m.homeTeam}</span>
                          <span className="text-slate-400 font-normal text-xs">vs</span>
                          <span className="truncate font-black">{m.awayTeam}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: SCORE DISPLAY & ACTION BUTTON */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#14263b]">
                    {/* SCORE BOARD */}
                    <div className="px-3 py-1 rounded-sm bg-[#112236] text-white font-mono font-black text-sm md:text-base border border-[#1a2e45] shadow-xs flex items-center gap-2">
                      {m.status === 'UPCOMING' ? (
                        <span className="text-xs uppercase text-slate-400 font-bold">VS</span>
                      ) : (
                        <>
                          <span className="text-white font-black">{m.scoreHome}</span>
                          <span className="text-slate-500 text-xs">-</span>
                          <span className="text-white font-black">{m.scoreAway}</span>
                        </>
                      )}
                    </div>

                    {/* CLICK TO LOG EVENTS PROMPT */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white transition-colors text-xs font-black uppercase tracking-wider shadow-xs">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Log Events</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SPACE SEPARATION */}
      <div className="h-2" />

      {/* 2. NEWSROOM ACTIONS (QUICK COMMANDS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#ff0046]" /> Newsroom Actions
          </h2>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Commands</span>
        </div>

        {/* BUTTON BAR - FLASHSCORE ACTION BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* BUTTON 1: COMPOSE (FLASHSCORE PRIMARY #ff0046) */}
          <button
            onClick={onOpenCompose}
            className="p-3.5 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs flex items-center gap-3 transition-colors cursor-pointer group text-left"
          >
            <div className="w-9 h-9 rounded-sm bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <PenSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-wider uppercase flex items-center gap-1">
                <span>Compose</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <p className="text-[10px] text-white/80 font-bold truncate normal-case tracking-normal">New journal / news</p>
            </div>
          </button>

          {/* BUTTON 2: MY ARTICLES ARCHIVE (#152a40) */}
          <button
            onClick={() => onNavigateTab('articles')}
            className="p-3.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-3 transition-colors cursor-pointer group text-left shadow-xs"
          >
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-wider uppercase flex items-center gap-1.5">
                <span>My Articles</span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-white/20 text-[10px] font-black">{articles.length}</span>
              </div>
              <p className="text-[10px] text-slate-300 font-bold truncate normal-case tracking-normal">Archive & drafts</p>
            </div>
          </button>

          {/* BUTTON 3: ANALYTICS STUDIO (#152a40) */}
          <button
            onClick={() => onNavigateTab('analytics')}
            className="p-3.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-3 transition-colors cursor-pointer group text-left shadow-xs"
          >
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-wider uppercase flex items-center gap-1">
                <span>Analytics</span>
              </div>
              <p className="text-[10px] text-slate-300 font-bold truncate normal-case tracking-normal">Readership & reach</p>
            </div>
          </button>

          {/* BUTTON 4: PRESS DESK (#152a40) */}
          <button
            onClick={() => triggerToast('Press releases desk loaded.')}
            className="p-3.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 flex items-center gap-3 transition-colors cursor-pointer group text-left shadow-xs"
          >
            <div className="w-9 h-9 rounded-sm bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-wider uppercase">
                <span>Press Desk</span>
              </div>
              <p className="text-[10px] text-slate-300 font-bold truncate normal-case tracking-normal">Saved releases & tips</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. EDITORIAL ANALYTICS (FETCHING FROM DATABASE) */}
      <section className="p-4 sm:p-5 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] space-y-5 shadow-xs relative overflow-hidden">
        {/* HEADER WITH REAL-TIME INDICATOR */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-[#1a2e45] pb-3 gap-2">
          <div>
            <h2 className="font-black text-base uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
              <TrendingUp className="w-5 h-5 text-[#ff0046]" /> Editorial Analytics & Reach
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Database verified statistics for your published journals and press coverage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-[2px] text-[10px] font-black uppercase tracking-wider bg-[#14263b] text-[#ff0046] border border-[#1a2e45] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046] animate-pulse" />
              Live DB Analytics
            </span>
          </div>
        </div>

        {/* PRIMARY KPI METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* TILE 1: OUTPUT (TODAY & WEEK) */}
          <div className="p-3.5 sm:p-4 rounded-none sm:rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Today's Output</span>
              <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#ff0046]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">{performanceMetrics.articlesToday}</span>
              <span className="text-xs font-bold text-slate-400">/ {performanceMetrics.articlesThisWeek} this week</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#00b04f]" /> <span className="text-slate-900 dark:text-white font-bold">{performanceMetrics.articlesThisMonth}</span> published this month
            </div>
          </div>

          {/* TILE 2: IMPRESSIONS & REACH */}
          <div className="p-3.5 sm:p-4 rounded-none sm:rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Reader Impressions</span>
              <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-[#ff0046]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {performanceMetrics.impressions >= 1000 
                  ? `${(performanceMetrics.impressions / 1000).toFixed(1)}k` 
                  : performanceMetrics.impressions}
              </span>
              <span className="text-xs font-bold text-[#ff0046] font-mono">+{performanceMetrics.reads} reads</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400">
              Avg read time: <span className="text-slate-900 dark:text-white font-mono font-bold">{performanceMetrics.avgReadTime}</span>
            </div>
          </div>

          {/* TILE 3: ENGAGEMENT & SHARES */}
          <div className="p-3.5 sm:p-4 rounded-none sm:rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Engagement Rate</span>
              <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5 text-[#ff0046]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">{performanceMetrics.engagementRate}%</span>
              <span className="text-xs font-bold text-slate-400 font-mono">{performanceMetrics.shares} shares</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400">
              High audience retention
            </div>
          </div>

          {/* TILE 4: PIPELINE (PUBLISHED VS DRAFTS) */}
          <div className="p-3.5 sm:p-4 rounded-none sm:rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Editorial Pipeline</span>
              <div className="w-7 h-7 rounded-sm bg-[#152a40] text-slate-300 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-[#ff0046]" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black font-mono text-[#ff0046]">{performanceMetrics.publishedCount}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Live</span>
              </div>
              <div className="text-slate-300 dark:text-slate-700">|</div>
              <div>
                <span className="text-2xl font-black font-mono text-amber-500">{performanceMetrics.draftsCount}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Drafts</span>
              </div>
              {performanceMetrics.flaggedCount > 0 && (
                <>
                  <div className="text-slate-300 dark:text-slate-700">|</div>
                  <div>
                    <span className="text-2xl font-black font-mono text-rose-500">{performanceMetrics.flaggedCount}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Flagged</span>
                  </div>
                </>
              )}
            </div>
            {/* Visual Ratio Bar */}
            <div className="w-full h-1.5 bg-[#14263b] rounded-none overflow-hidden flex">
              <div style={{ width: `${publishedRatio}%` }} className="h-full bg-[#ff0046]" />
              <div style={{ width: `${100 - publishedRatio}%` }} className="h-full bg-[#152a40]" />
            </div>
          </div>
        </div>

        {/* MONTHLY & MATCHDAY SNAPSHOT TICKER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Monthly Snapshot */}
          <div className="p-3.5 rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#152a40] text-[#ff0046] flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Monthly Volume Snapshot</div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  {performanceMetrics.monthlyStats && performanceMetrics.monthlyStats.length > 0 
                    ? `${performanceMetrics.monthlyStats[0].monthLabel}: ${performanceMetrics.monthlyStats[0].count} articles` 
                    : 'Active publishing schedule'}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="px-3 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
            >
              View Breakdown
            </button>
          </div>

          {/* Matchday Snapshot */}
          <div className="p-3.5 rounded-sm bg-slate-50 dark:bg-[#112236] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#152a40] text-[#ff0046] flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Matchday Coverage</div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  {performanceMetrics.topCompetition} • Top: {performanceMetrics.mostCoveredTeam}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('articles')}
              className="px-3 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
            >
              Filter Matchdays
            </button>
          </div>
        </div>

        {/* BUTTON: FULL ANALYTICS STUDIO */}
        <div className="pt-1">
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-white/10"
          >
            <span>Open Full Journalist Analytics Studio</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* 4. TODAY'S ARTICLES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-sm md:text-base tracking-tight uppercase flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-[#ff0046]" /> Today's Published Coverage
          </h2>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{todayArticles.length} recent stories</span>
        </div>

        {/* ARTICLES LIST (MAX 3) */}
        <div className="space-y-3">
          {todayArticles.length === 0 ? (
            <div className="p-8 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] text-center space-y-2 shadow-xs">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">No articles published today yet.</p>
              <button
                onClick={onOpenCompose}
                className="px-4 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                + Write Your First Story Today
              </button>
            </div>
          ) : (
            todayArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onViewArticle(art)}
                className="p-4 rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer space-y-2.5 group shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#14263b] text-slate-300 border border-[#223b56] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">
                        {ARTICLE_CATEGORY_LABELS[art.category] || art.category}
                      </span>
                      {art.matchday && (
                        <span className="bg-[#102237] text-sky-400 border border-[#1a2e45] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">
                          MD {art.matchday}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-semibold">• {art.timestamp}</span>
                    </div>

                    <h3 className="font-extrabold text-sm md:text-base leading-snug tracking-tight text-slate-900 dark:text-white group-hover:text-[#ff0046] transition-colors line-clamp-1">
                      {art.headline}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {art.body.length > 140 ? `${art.body.slice(0, 140)}...` : art.body}
                    </p>
                  </div>

                  {art.images && art.images.length > 0 && (
                    <img
                      src={art.images[0]}
                      alt={art.headline}
                      className="w-16 h-16 rounded-sm object-cover shrink-0 border border-slate-200 dark:border-[#1a2e45] shadow-xs"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-[#14263b] font-semibold">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                    By {art.authorName || 'Journalist'}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Eye className="w-3.5 h-3.5 text-[#ff0046]" /> {art.viewsCount || 0} views
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {/* BUTTON: SEE ALL ARTICLES */}
        <div className="pt-1">
          <button
            onClick={() => onNavigateTab('articles')}
            className="w-full py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-white/10"
          >
            <span>Browse Complete Archive (Sorted Monthly & Matchdays)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>
    </div>
  );
};
