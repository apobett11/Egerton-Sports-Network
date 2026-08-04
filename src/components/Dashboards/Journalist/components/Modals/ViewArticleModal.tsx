import React from 'react';
import { X, Calendar, Eye, Tag, Edit3, Trash2 } from 'lucide-react';
import { ArticlePost, ARTICLE_CATEGORY_LABELS } from '../../JournalistTypes';

interface ViewArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ArticlePost | null;
  onEdit?: (article: ArticlePost) => void;
  onDelete?: (id: string) => void;
  cardBg: string;
}

export const ViewArticleModal: React.FC<ViewArticleModalProps> = ({
  isOpen,
  onClose,
  article,
  onEdit,
  onDelete,
  cardBg,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-article-title"
    >
      <div className={`w-full max-w-2xl ${cardBg} p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-700/60`}>
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {ARTICLE_CATEGORY_LABELS[article.category] || article.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                article.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : article.status === 'draft'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {article.status}
              </span>
            </div>
            <h2 id="view-article-title" className="font-extrabold text-lg md:text-xl leading-tight">
              {article.headline}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close article modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METADATA */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 py-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {article.timestamp || 'Today'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              {article.viewsCount || 0} views
            </span>
          </div>

          {article.competitionName && (
            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <Tag className="w-3.5 h-3.5" />
              {article.competitionName}
            </span>
          )}
        </div>

        {/* FEATURED IMAGE */}
        {article.images && article.images.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72">
            <img
              src={article.images[0]}
              alt={article.headline}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* SUBTITLE */}
        {article.subtitle && (
          <p className="font-bold text-sm text-slate-700 dark:text-slate-200 italic border-l-4 border-emerald-500 pl-3 py-1">
            {article.subtitle}
          </p>
        )}

        {/* BODY */}
        <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pt-2">
          {article.body}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
          <div className="text-slate-500">
            By {article.authorName || 'Journalist'} ({article.roleBadge || 'Reporter'})
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(article);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {article.status === 'draft' && onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(article.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
