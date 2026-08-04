import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  BookOpen,
} from 'lucide-react';
import {
  ArticlePost,
  ARTICLE_CATEGORY_LABELS,
  OptionItem,
} from '../../JournalistTypes';

interface JournalistArticlesViewProps {
  articles: ArticlePost[];
  competitions: OptionItem[];
  teams: OptionItem[];
  onOpenCompose: (articleToEdit?: ArticlePost) => void;
  onViewArticle: (article: ArticlePost) => void;
  onDeleteArticle: (id: string) => void;
  cardBg: string;
  hoverBg: string;
}

export const JournalistArticlesView: React.FC<JournalistArticlesViewProps> = ({
  articles,
  competitions,
  teams,
  onOpenCompose,
  onViewArticle,
  onDeleteArticle,
  cardBg,
  hoverBg,
}) => {
  // Filter States
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((art) => {
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesHeadline = art.headline.toLowerCase().includes(q);
          const matchesBody = art.body.toLowerCase().includes(q);
          if (!matchesHeadline && !matchesBody) return false;
        }

        // Status Filter
        if (statusFilter !== 'all' && art.status !== statusFilter) return false;

        // Competition Filter
        if (selectedCompId && art.competitionId !== selectedCompId) return false;

        // Team Filter
        if (selectedTeamId && art.teamId !== selectedTeamId) return false;

        // Time Range Filter
        if (timeFilter === 'today' && !art.isToday && art.timestamp !== 'Just now') return false;
        if (timeFilter === 'yesterday' && !art.isYesterday && art.timestamp !== 'Yesterday') return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || 0).getTime();
        const timeB = new Date(b.publishedAt || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [articles, searchQuery, statusFilter, selectedCompId, selectedTeamId, timeFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" /> Newsroom Articles Archive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your published press releases, working drafts, and match coverage.
          </p>
        </div>

        <button
          onClick={() => onOpenCompose()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Compose New Article
        </button>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className={`p-4 md:p-5 rounded-2xl border ${cardBg} space-y-4 shadow-sm text-xs font-semibold`}>
        {/* ROW 1: SEARCH & SORT */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headline, text body, keywords..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <label htmlFor="article-sort-order" className="text-slate-400 font-bold uppercase text-[10px] whitespace-nowrap">Sort:</label>
            <select
              id="article-sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ROW 2: TIME, ENTITY & STATUS FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
          {/* TIME RANGE */}
          <div>
            <label htmlFor="article-time-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1">Time Range</label>
            <select
              id="article-time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label htmlFor="article-status-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1">Status</label>
            <select
              id="article-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="disputed">Flagged</option>
            </select>
          </div>

          {/* COMPETITION */}
          <div>
            <label htmlFor="article-competition-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1">Competition</label>
            <select
              id="article-competition-filter"
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
            >
              <option value="">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* TEAM */}
          <div>
            <label htmlFor="article-team-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1">Team</label>
            <select
              id="article-team-filter"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ARTICLES LIST GRID / CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span>Showing {filteredArticles.length} articles</span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className={`p-10 rounded-2xl border ${cardBg} text-center space-y-2`}>
            <p className="font-extrabold text-sm text-slate-400">No articles matched your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTimeFilter('all');
                setSelectedCompId('');
                setSelectedTeamId('');
              }}
              className="text-xs font-bold text-emerald-500 underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredArticles.map((post) => (
            <article
              key={post.id}
              className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all space-y-3 shadow-xs`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                      {ARTICLE_CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      post.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : post.status === 'draft'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">• {post.timestamp}</span>
                  </div>

                  <h3 className="font-extrabold text-sm md:text-base leading-snug tracking-tight text-slate-900 dark:text-slate-100">
                    {post.headline}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {post.subtitle || post.body}
                  </p>
                </div>

                {post.images && post.images.length > 0 && (
                  <img
                    src={post.images[0]}
                    alt={post.headline}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                  />
                )}
              </div>

              {/* ARTICLE BOTTOM META & ACTIONS */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 font-semibold">
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {post.competitionName || 'Egerton Sports'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> {post.viewsCount || 0} views
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewArticle(post)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => onOpenCompose(post)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {post.status === 'draft' && (
                    <button
                      onClick={() => onDeleteArticle(post.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
