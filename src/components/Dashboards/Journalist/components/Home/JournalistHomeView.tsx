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
  AlertCircle,
  Share2,
} from 'lucide-react';
import {
  CurrentMatchEvent,
  ArticlePost,
  PerformanceMetrics,
  ARTICLE_CATEGORY_LABELS,
} from '../../JournalistTypes';

interface JournalistHomeViewProps {
  currentEvent: CurrentMatchEvent;
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
  currentEvent,
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
  // Filter today's articles (max 3, newest first)
  const todayArticles = articles
    .filter((a) => a.isToday || a.status === 'published')
    .slice(0, 3);

  const totalPipelineCount = (performanceMetrics.publishedCount || 0) + (performanceMetrics.draftsCount || 0);
  const publishedRatio = totalPipelineCount > 0 
    ? Math.round((performanceMetrics.publishedCount / totalPipelineCount) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* 1. HERO MATCH EVENT CARD */}
      <section className={`p-6 rounded-3xl border ${cardBg} space-y-5 shadow-xl relative overflow-hidden`}>
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP STATUS BADGE & LEAGUE */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              {currentEvent.competition}
            </span>

            {currentEvent.matchday && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Matchday {currentEvent.matchday}
              </span>
            )}

            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 shadow-xs ${
              currentEvent.status === 'LIVE'
                ? 'bg-rose-600 text-white animate-pulse'
                : currentEvent.status === 'HT'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : currentEvent.status === 'FT'
                ? 'bg-slate-700 text-slate-200'
                : 'bg-emerald-600 text-white'
            }`}>
              {currentEvent.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
              {currentEvent.status}
            </span>
          </div>

          {currentEvent.minute && (
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-xs">
              {currentEvent.minute}
            </span>
          )}
        </div>

        {/* TEAMS & SCORE MATCH BOARD */}
        <div className="py-3 flex items-center justify-between text-center gap-4 relative z-10">
          {/* HOME TEAM */}
          <div className="flex-1 space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-slate-800 p-2.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transform transition-transform hover:scale-105">
              {currentEvent.homeLogo ? (
                <img src={currentEvent.homeLogo} alt={currentEvent.homeTeam} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">{currentEvent.homeTeam.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <h3 className="font-black text-sm md:text-base leading-tight text-slate-900 dark:text-slate-100">
              {currentEvent.homeTeam}
            </h3>
          </div>

          {/* SCORE / VS BOARD */}
          <div className="px-5 py-2.5 rounded-2xl bg-slate-950 text-white border border-emerald-500/40 font-black text-2xl md:text-4xl tracking-widest font-mono shadow-2xl shrink-0 flex items-center justify-center gap-2">
            {currentEvent.status === 'UPCOMING' ? (
              <span className="text-sm uppercase tracking-widest text-slate-400">VS</span>
            ) : (
              <>
                <span className="text-emerald-400">{currentEvent.scoreHome}</span>
                <span className="text-slate-600 text-xl">-</span>
                <span className="text-emerald-400">{currentEvent.scoreAway}</span>
              </>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex-1 space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white dark:bg-slate-800 p-2.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-md transform transition-transform hover:scale-105">
              {currentEvent.awayLogo ? (
                <img src={currentEvent.awayLogo} alt={currentEvent.awayTeam} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">{currentEvent.awayTeam.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <h3 className="font-black text-sm md:text-base leading-tight text-slate-900 dark:text-slate-100">
              {currentEvent.awayTeam}
            </h3>
          </div>
        </div>

        {/* VENUE & KICKOFF META */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-200/80 dark:border-slate-800 gap-2 relative z-10 font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {currentEvent.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Kickoff: {currentEvent.kickoff}
            </span>
          </div>

          {currentEvent.countdown && (
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
              {currentEvent.countdown}
            </span>
          )}
        </div>

        {/* BUTTON: SEE OTHER GAMES */}
        <div className="pt-1 relative z-10">
          <button
            onClick={onOpenMatchSelector}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 group active:scale-[0.99]"
          >
            <Radio className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors" />
            <span>Select Different Match Fixture</span>
          </button>
        </div>
      </section>

      {/* 2. QUICK ACTIONS COMMAND BAR (STREAMLINED BUTTONS, NOT BRICKS) */}
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
            onClick={() => triggerToast('Press releases and bookmarked coverage desk loaded.')}
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

      {/* 3. EXECUTIVE ANALYTICS DASHBOARD STRIP */}
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
