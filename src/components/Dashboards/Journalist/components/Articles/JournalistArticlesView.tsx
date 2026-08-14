import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
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
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedMatchday, setSelectedMatchday] = useState<string>('all');
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [groupingMode, setGroupingMode] = useState<'flat' | 'monthly' | 'matchday'>('flat');

  // Extract distinct available months from database articles
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    articles.forEach((a) => {
      if (a.monthKey && a.monthLabel) {
        monthsMap.set(a.monthKey, a.monthLabel);
      }
    });
    return Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [articles]);

  // Extract distinct matchdays
  const availableMatchdays = useMemo(() => {
    const mds = new Set<number>();
    articles.forEach((a) => {
      if (a.matchday !== undefined) {
        mds.add(a.matchday);
      }
    });
    return Array.from(mds).sort((a, b) => a - b);
  }, [articles]);

  // Filtered Articles
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

        // Monthly Filter
        if (selectedMonth !== 'all' && art.monthKey !== selectedMonth) return false;

        // Matchday Filter
        if (selectedMatchday !== 'all' && String(art.matchday) !== selectedMatchday) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [articles, searchQuery, statusFilter, selectedCompId, selectedTeamId, selectedMonth, selectedMatchday, sortOrder]);

  // Grouped by Month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, { label: string; list: ArticlePost[] }> = {};
    filteredArticles.forEach((art) => {
      const key = art.monthKey || 'Other';
      const label = art.monthLabel || 'Archived Coverage';
      if (!groups[key]) {
        groups[key] = { label, list: [] };
      }
      groups[key].list.push(art);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredArticles]);

  // Grouped by Matchday
  const groupedByMatchday = useMemo(() => {
    const groups: Record<string, { label: string; list: ArticlePost[] }> = {};
    filteredArticles.forEach((art) => {
      const md = art.matchday ? `Matchday ${art.matchday}` : 'General Stories & News';
      if (!groups[md]) {
        groups[md] = { label: md, list: [] };
      }
      groups[md].list.push(art);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredArticles]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BookOpen className="w-6 h-6 text-emerald-500" /> Newsroom Articles Archive
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {articles.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organized monthly and by matchdays directly from your database records.
          </p>
        </div>

        <button
          onClick={() => onOpenCompose()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Compose New Story
        </button>
      </div>

      {/* FILTER & SORT CONTROLS CARD */}
      <div className={`p-4 md:p-5 rounded-2xl border ${cardBg} space-y-4 shadow-sm text-xs font-semibold`}>
        {/* ROW 1: SEARCH & SORT ORDER & GROUPING TOGGLE */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headline, text body, keywords..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
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

          {/* VIEW / GROUPING MODE */}
          <div className="sm:col-span-3 flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setGroupingMode('flat')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                groupingMode === 'flat' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setGroupingMode('monthly')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                groupingMode === 'monthly' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setGroupingMode('matchday')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                groupingMode === 'matchday' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Matchdays
            </button>
          </div>
        </div>

        {/* ROW 2: FILTERS (MONTH, MATCHDAY, STATUS, COMPETITION) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* MONTH FILTER */}
          <div>
            <label htmlFor="article-month-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-500" /> Month
            </label>
            <select
              id="article-month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
            >
              <option value="all">All Months</option>
              {availableMonths.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* MATCHDAY FILTER */}
          <div>
            <label htmlFor="article-matchday-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500" /> Matchday
            </label>
            <select
              id="article-matchday-filter"
              value={selectedMatchday}
              onChange={(e) => setSelectedMatchday(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
            >
              <option value="all">All Matchdays</option>
              {availableMatchdays.map((md) => (
                <option key={md} value={String(md)}>Matchday {md}</option>
              ))}
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
              <option value="published">Live Published</option>
              <option value="draft">Working Drafts</option>
              <option value="disputed">Flagged</option>
            </select>
          </div>

          {/* COMPETITION */}
          <div>
            <label htmlFor="article-competition-filter" className="block text-slate-400 uppercase font-black text-[10px] mb-1">League</label>
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
        </div>
      </div>

      {/* ARTICLES LIST OR GROUPED VIEWS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span>Showing {filteredArticles.length} filtered articles</span>
          {(selectedMonth !== 'all' || selectedMatchday !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedMatchday('all');
                setStatusFilter('all');
                setSelectedCompId('');
                setSelectedTeamId('');
                setSearchQuery('');
              }}
              className="text-emerald-500 font-black hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className={`p-12 rounded-2xl border ${cardBg} text-center space-y-3`}>
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-extrabold text-sm text-slate-400">No articles matched your search or filters.</p>
            <button
              onClick={() => onOpenCompose()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500 cursor-pointer shadow-md"
            >
              + Create New Story Now
            </button>
          </div>
        ) : groupingMode === 'flat' ? (
          /* FLAT LIST */
          <div className="space-y-3">
            {filteredArticles.map((post) => (
              <ArticleCardItem
                key={post.id}
                post={post}
                cardBg={cardBg}
                hoverBg={hoverBg}
                onViewArticle={onViewArticle}
                onOpenCompose={onOpenCompose}
                onDeleteArticle={onDeleteArticle}
              />
            ))}
          </div>
        ) : groupingMode === 'monthly' ? (
          /* MONTHLY GROUPED VIEW */
          <div className="space-y-6">
            {groupedByMonth.map(([monthKey, group]) => (
              <div key={monthKey} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                    <Calendar className="w-4 h-4" /> {group.label}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{group.list.length} articles</span>
                </div>
                <div className="space-y-3">
                  {group.list.map((post) => (
                    <ArticleCardItem
                      key={post.id}
                      post={post}
                      cardBg={cardBg}
                      hoverBg={hoverBg}
                      onViewArticle={onViewArticle}
                      onOpenCompose={onOpenCompose}
                      onDeleteArticle={onDeleteArticle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MATCHDAY GROUPED VIEW */
          <div className="space-y-6">
            {groupedByMatchday.map(([mdKey, group]) => (
              <div key={mdKey} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> {group.label}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{group.list.length} articles</span>
                </div>
                <div className="space-y-3">
                  {group.list.map((post) => (
                    <ArticleCardItem
                      key={post.id}
                      post={post}
                      cardBg={cardBg}
                      hoverBg={hoverBg}
                      onViewArticle={onViewArticle}
                      onOpenCompose={onOpenCompose}
                      onDeleteArticle={onDeleteArticle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ArticleCardItemProps {
  post: ArticlePost;
  cardBg: string;
  hoverBg: string;
  onViewArticle: (p: ArticlePost) => void;
  onOpenCompose: (p: ArticlePost) => void;
  onDeleteArticle: (id: string) => void;
}

const ArticleCardItem: React.FC<ArticleCardItemProps> = ({
  post,
  cardBg,
  hoverBg,
  onViewArticle,
  onOpenCompose,
  onDeleteArticle,
}) => {
  return (
    <article
      className={`p-4.5 rounded-2xl border ${cardBg} ${hoverBg} transition-all space-y-3 shadow-xs hover:border-emerald-500/40`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {ARTICLE_CATEGORY_LABELS[post.category] || post.category}
            </span>

            {post.matchday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Matchday {post.matchday}
              </span>
            )}

            {post.monthLabel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                {post.monthLabel}
              </span>
            )}

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              post.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-500'
                : post.status === 'draft'
                ? 'bg-amber-500/20 text-amber-500'
                : 'bg-rose-500/20 text-rose-500'
            }`}>
              {post.status}
            </span>

            <span className="text-[11px] text-slate-400 font-semibold">• {post.timestamp}</span>
          </div>

          <h3
            onClick={() => onViewArticle(post)}
            className="font-extrabold text-sm md:text-base leading-snug tracking-tight text-slate-900 dark:text-slate-100 hover:text-emerald-500 transition-colors cursor-pointer"
          >
            {post.headline}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {post.body.length > 140 ? `${post.body.slice(0, 140)}...` : post.body}
          </p>
        </div>

        {post.images && post.images.length > 0 && (
          <img
            src={post.images[0]}
            alt={post.headline}
            className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-xs"
          />
        )}
      </div>

      {/* ARTICLE BOTTOM META & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100 dark:border-slate-800 font-semibold gap-2">
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            By {post.authorName || 'Journalist'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-blue-500" /> {post.viewsCount || 0} views
          </span>
          {post.matchTitle && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              Fixture: {post.matchTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewArticle(post)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Read
          </button>

          <button
            onClick={() => onOpenCompose(post)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>

          <button
            onClick={() => onDeleteArticle(post.id)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </article>
  );
};
