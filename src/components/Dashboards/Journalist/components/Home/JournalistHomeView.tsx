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
  MapPin,
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
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h2 className="font-black text-xs uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500" />
              {ongoingMatches.length > 0 ? "Current Ongoing Matches (Click Strip to Log Events)" : "Today's Match Strips (Click to Manage Events)"}
            </h2>
          </div>
          <button
            onClick={onOpenMatchSelector}
            className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Browse All Fixtures</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayMatches.length === 0 ? (
          <div className={`p-6 rounded-2xl border ${cardBg} text-center space-y-2 shadow-xs`}>
            <Activity className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-400">No matches found in database for today.</p>
            <button
              onClick={onOpenMatchSelector}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs cursor-pointer hover:bg-emerald-500"
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
                  className={`p-3.5 md:p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-500/50 group flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden`}
                  title={`Click to open live events module for ${m.homeTeam} vs ${m.awayTeam}`}
                >
                  {/* Subtle live indicator left accent border */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isLive ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />

                  {/* LEFT: LEAGUE, STATUS & TEAMS */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 pl-1">
                    {/* STATUS PILL */}
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider flex items-center gap-1 shadow-xs ${
                          isLive
                            ? 'bg-rose-600 text-white animate-pulse'
                            : m.status === 'FT'
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                        {m.status}
                      </span>
                      {m.minute && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {m.minute}
                        </span>
                      )}
                    </div>

                    {/* TEAMS & SCORE */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <Layers className="w-3 h-3 text-emerald-500" />
                        <span className="truncate max-w-[200px]">{m.competition}</span>
                        {m.venue && <span className="hidden md:inline">• {m.venue}</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="font-extrabold text-sm md:text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors flex items-center gap-2 truncate">
                          <span className="truncate">{m.homeTeam}</span>
                          <span className="text-slate-400 font-normal">vs</span>
                          <span className="truncate">{m.awayTeam}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: SCORE DISPLAY & ACTION BUTTON */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* SCORE BOARD */}
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white font-mono font-black text-base md:text-lg border border-emerald-500/40 shadow-xs flex items-center gap-2">
                      {m.status === 'UPCOMING' ? (
                        <span className="text-xs uppercase text-slate-400">VS</span>
                      ) : (
                        <>
                          <span className="text-emerald-400">{m.scoreHome}</span>
                          <span className="text-slate-600 text-sm">-</span>
                          <span className="text-emerald-400">{m.scoreAway}</span>
                        </>
                      )}
                    </div>

                    {/* CLICK TO LOG EVENTS PROMPT */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all text-xs font-black">
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
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Newsroom Actions
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Quick Commands</span>
        </div>

        {/* BUTTON BAR - COLOR CODED, ELEVATED, INTERACTIVE BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* BUTTON 1: COMPOSE (VIBRANT EMERALD) */}
          <button
            onClick={onOpenCompose}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-900/20 border border-emerald-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <PenSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1">
                <span>Compose</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium truncate">New journal / news</p>
            </div>
          </button>

          {/* BUTTON 2: MY JOURNALS ARCHIVE (VIBRANT SKY BLUE) */}
          <button
            onClick={() => onNavigateTab('articles')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20 border border-sky-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1.5">
                <span>My Articles</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-black">{articles.length}</span>
              </div>
              <p className="text-[10px] text-sky-100 font-medium truncate">Archive & drafts</p>
            </div>
          </button>

          {/* BUTTON 3: ANALYTICS & METRICS (VIBRANT VIOLET) */}
          <button
            onClick={() => onNavigateTab('analytics')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white shadow-lg shadow-purple-900/20 border border-violet-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1">
                <span>Analytics</span>
                <span className="text-[10px] text-violet-200">📈</span>
              </div>
              <p className="text-[10px] text-violet-100 font-medium truncate">Readership & reach</p>
            </div>
          </button>

          {/* BUTTON 4: BOOKMARKS / PRESS RELEASES (VIBRANT AMBER) */}
          <button
            onClick={() => triggerToast('Press releases desk loaded.')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-900/20 border border-amber-300/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight">
                <span>Press Desk</span>
              </div>
              <p className="text-[10px] text-amber-100 font-medium truncate">Saved releases & tips</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. EDITORIAL ANALYTICS (FETCHING FROM DATABASE) */}
      <section className={`p-6 rounded-3xl border ${cardBg} space-y-5 shadow-xl relative overflow-hidden`}>
        {/* HEADER WITH REAL-TIME INDICATOR */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
          <div>
            <h2 className="font-black text-base tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Editorial Analytics & Reach
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Database verified statistics for your published journals and press coverage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Analytics
            </span>
          </div>
        </div>

        {/* PRIMARY KPI METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* TILE 1: OUTPUT (TODAY & WEEK) */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Today's Output</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{performanceMetrics.articlesToday}</span>
              <span className="text-xs font-bold text-slate-400">/ {performanceMetrics.articlesThisWeek} this week</span>
            </div>
            <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {performanceMetrics.articlesThisMonth} published this month
            </div>
          </div>

          {/* TILE 2: IMPRESSIONS & REACH */}
          <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Reader Impressions</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {performanceMetrics.impressions >= 1000 
                  ? `${(performanceMetrics.impressions / 1000).toFixed(1)}k` 
                  : performanceMetrics.impressions}
              </span>
              <span className="text-xs font-bold text-blue-500 font-mono">+{performanceMetrics.reads} reads</span>
            </div>
            <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
              Avg read time: {performanceMetrics.avgReadTime}
            </div>
          </div>

          {/* TILE 3: ENGAGEMENT & SHARES */}
          <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">Engagement Rate</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{performanceMetrics.engagementRate}%</span>
              <span className="text-xs font-bold text-slate-400">{performanceMetrics.shares} shares</span>
            </div>
            <div className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
              High audience retention
            </div>
          </div>

          {/* TILE 4: PIPELINE (PUBLISHED VS DRAFTS) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Editorial Pipeline</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{performanceMetrics.publishedCount}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">Live</span>
              </div>
              <div className="text-slate-300 dark:text-slate-700">|</div>
              <div>
                <span className="text-2xl font-black text-amber-500">{performanceMetrics.draftsCount}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">Drafts</span>
              </div>
              {performanceMetrics.flaggedCount > 0 && (
                <>
                  <div className="text-slate-300 dark:text-slate-700">|</div>
                  <div>
                    <span className="text-2xl font-black text-rose-500">{performanceMetrics.flaggedCount}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1">Flagged</span>
                  </div>
                </>
              )}
            </div>
            {/* Visual Ratio Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${publishedRatio}%` }} className="h-full bg-emerald-500" />
              <div style={{ width: `${100 - publishedRatio}%` }} className="h-full bg-amber-500" />
            </div>
          </div>
        </div>

        {/* MONTHLY & MATCHDAY SNAPSHOT TICKER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Monthly Snapshot */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Monthly Volume Snapshot</div>
                <div className="text-[11px] text-slate-400">
                  {performanceMetrics.monthlyStats && performanceMetrics.monthlyStats.length > 0 
                    ? `${performanceMetrics.monthlyStats[0].monthLabel}: ${performanceMetrics.monthlyStats[0].count} articles` 
                    : 'Active publishing schedule'}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] transition-colors cursor-pointer"
            >
              View Breakdown
            </button>
          </div>

          {/* Matchday Snapshot */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Matchday Coverage</div>
                <div className="text-[11px] text-slate-400">
                  {performanceMetrics.topCompetition} • Top: {performanceMetrics.mostCoveredTeam}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('articles')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] transition-colors cursor-pointer"
            >
              Filter Matchdays
            </button>
          </div>
        </div>

        {/* BUTTON: FULL ANALYTICS STUDIO */}
        <div className="pt-1">
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
          >
            <span>Open Full Journalist Analytics Studio</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* 4. TODAY'S ARTICLES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-sm md:text-base tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Clock className="w-4 h-4 text-emerald-500" /> Today's Published Coverage
          </h2>
          <span className="text-xs text-slate-500 font-bold">{todayArticles.length} recent stories</span>
        </div>

        {/* ARTICLES LIST (MAX 3) */}
        <div className="space-y-3">
          {todayArticles.length === 0 ? (
            <div className={`p-8 rounded-2xl border ${cardBg} text-center space-y-2 shadow-sm`}>
              <p className="text-xs font-black text-slate-400">No articles published today yet.</p>
              <button
                onClick={onOpenCompose}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs cursor-pointer hover:bg-emerald-500 shadow-md"
              >
                + Write Your First Story Today
              </button>
            </div>
          ) : (
            todayArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onViewArticle(art)}
                className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2.5 group shadow-xs hover:border-emerald-500/40`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {ARTICLE_CATEGORY_LABELS[art.category] || art.category}
                      </span>
                      {art.matchday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          MD {art.matchday}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-semibold">• {art.timestamp}</span>
                    </div>

                    <h3 className="font-extrabold text-sm md:text-base leading-snug tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors line-clamp-1">
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
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-semibold">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    By {art.authorName || 'Journalist'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> {art.viewsCount || 0} views
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
            className="w-full py-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Browse Complete Archive (Sorted Monthly & Matchdays)</span>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </section>
    </div>
  );
};
