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

  return (
    <div className="space-y-6">
      {/* TASK 2 — HERO: CURRENT EVENT CARD */}
      <section className={`p-6 rounded-3xl border ${cardBg} space-y-5 shadow-xl relative overflow-hidden`}>
        {/* TOP STATUS BADGE & LEAGUE */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              {currentEvent.competition}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 ${
              currentEvent.status === 'LIVE'
                ? 'bg-rose-600 text-white animate-pulse'
                : currentEvent.status === 'HT'
                ? 'bg-amber-500 text-slate-950'
                : currentEvent.status === 'FT'
                ? 'bg-slate-700 text-slate-200'
                : 'bg-blue-600 text-white'
            }`}>
              {currentEvent.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
              {currentEvent.status}
            </span>
          </div>

          {currentEvent.minute && (
            <span className="font-mono text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
              {currentEvent.minute}
            </span>
          )}
        </div>

        {/* TEAMS & SCORE MATCH BOARD */}
        <div className="py-2 flex items-center justify-between text-center gap-4">
          {/* HOME TEAM */}
          <div className="flex-1 space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              {currentEvent.homeLogo ? (
                <img src={currentEvent.homeLogo} alt={currentEvent.homeTeam} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-sm text-emerald-500">{currentEvent.homeTeam.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <h3 className="font-extrabold text-sm md:text-base leading-tight truncate">
              {currentEvent.homeTeam}
            </h3>
          </div>

          {/* SCORE / VS */}
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white dark:bg-black border border-emerald-500/30 font-black text-2xl md:text-3xl tracking-widest font-mono shadow-inner shrink-0">
            {currentEvent.status === 'UPCOMING' ? (
              <span className="text-xs uppercase text-slate-400">VS</span>
            ) : (
              <span className="text-emerald-400">{currentEvent.scoreHome} - {currentEvent.scoreAway}</span>
            )}
          </div>

          {/* AWAY TEAM */}
          <div className="flex-1 space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              {currentEvent.awayLogo ? (
                <img src={currentEvent.awayLogo} alt={currentEvent.awayTeam} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-sm text-emerald-500">{currentEvent.awayTeam.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <h3 className="font-extrabold text-sm md:text-base leading-tight truncate">
              {currentEvent.awayTeam}
            </h3>
          </div>
        </div>

        {/* VENUE & KICKOFF META */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {currentEvent.venue}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Kickoff: {currentEvent.kickoff}
            </span>
          </div>

          {currentEvent.countdown && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {currentEvent.countdown}
            </span>
          )}
        </div>

        {/* BUTTON: SEE OTHER GAMES */}
        <div className="pt-2">
          <button
            onClick={onOpenMatchSelector}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
          >
            <Radio className="w-4 h-4 text-emerald-500 group-hover:text-white" />
            <span>See Other Games</span>
          </button>
        </div>
      </section>

      {/* TASK 3 — QUICK ACTIONS */}
      <section className="space-y-3">
        <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 px-1">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: COMPOSE ARTICLE */}
          <div
            onClick={onOpenCompose}
            className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2 group hover:border-emerald-500/50 shadow-sm`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <PenSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                Compose Article
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                Draft or publish news stories, match previews, and transfer news.
              </p>
            </div>
          </div>

          {/* CARD 2: MY ARTICLES */}
          <div
            onClick={() => onNavigateTab('articles')}
            className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2 group hover:border-emerald-500/50 shadow-sm`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                My Articles
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                Browse, filter, edit, or manage your published articles and working drafts.
              </p>
            </div>
          </div>

          {/* CARD 3: ANALYTICS */}
          <div
            onClick={() => onNavigateTab('analytics')}
            className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2 group hover:border-emerald-500/50 shadow-sm`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-500 transition-colors">
                Analytics
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                Track article readership, reader impressions, engagement rates, and top stories.
              </p>
            </div>
          </div>

          {/* CARD 4: BOOKMARKS */}
          <div
            onClick={() => triggerToast('Bookmarks section is saved & ready for bookmarked coverage.')}
            className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2 group hover:border-emerald-500/50 shadow-sm`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                Bookmarks
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                Saved press releases, reference match notes, and bookmarked articles for future coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TASK 4 — PERFORMANCE CARD */}
      <section className={`p-6 rounded-3xl border ${cardBg} space-y-4 shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Journalist Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Summary of your editorial statistics and article reach metrics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Today</span>
            <div className="font-black text-xl text-slate-900 dark:text-slate-100">{performanceMetrics.articlesToday}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">This Week</span>
            <div className="font-black text-xl text-slate-900 dark:text-slate-100">{performanceMetrics.articlesThisWeek}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">This Month</span>
            <div className="font-black text-xl text-slate-900 dark:text-slate-100">{performanceMetrics.articlesThisMonth}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Published</span>
            <div className="font-black text-xl text-emerald-500">{performanceMetrics.publishedCount}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Drafts</span>
            <div className="font-black text-xl text-amber-500">{performanceMetrics.draftsCount}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-blue-500 uppercase">Impressions</span>
            <div className="font-black text-lg text-slate-900 dark:text-slate-100">{performanceMetrics.impressions.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
            <span className="text-[10px] font-bold text-purple-500 uppercase">Engagement</span>
            <div className="font-black text-lg text-purple-500">{performanceMetrics.engagementRate}%</div>
          </div>
        </div>

        {/* BUTTON: SEE MORE ANALYTICS */}
        <div className="pt-2">
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>See More Analytics</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* TASK 5 — TODAY'S ARTICLES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-extrabold text-sm md:text-base tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Today's Articles
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{todayArticles.length} articles</span>
        </div>

        {/* ARTICLES LIST (MAX 3) */}
        <div className="space-y-3">
          {todayArticles.length === 0 ? (
            <div className={`p-6 rounded-2xl border ${cardBg} text-center text-slate-500 text-xs font-semibold`}>
              No articles published today yet. Click "Compose Article" to write your first story!
            </div>
          ) : (
            todayArticles.map((art) => (
              <article
                key={art.id}
                onClick={() => onViewArticle(art)}
                className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-2 group shadow-xs`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                        {ARTICLE_CATEGORY_LABELS[art.category] || art.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">• {art.timestamp}</span>
                    </div>

                    <h3 className="font-extrabold text-sm md:text-base leading-snug tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors line-clamp-1">
                      {art.headline}
                    </h3>

                    {/* AUTOMATICALLY GENERATED SHORT PREVIEW FROM ARTICLE BODY */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {art.body.length > 140 ? `${art.body.slice(0, 140)}...` : art.body}
                    </p>
                  </div>

                  {art.images && art.images.length > 0 && (
                    <img
                      src={art.images[0]}
                      alt={art.headline}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-semibold">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    By {art.authorName || 'Journalist'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> {art.viewsCount || 0} views
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
            className="w-full py-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>See All Articles</span>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </section>
    </div>
  );
};
