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
}) => {
  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-article-title"
    >
      <div className="w-full max-w-2xl bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* DIALOG HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#14263b] text-slate-300 border border-[#223b56] text-[10px] uppercase font-bold tracking-wider rounded-sm px-2 py-0.5">
                {ARTICLE_CATEGORY_LABELS[article.category] || article.category}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider rounded-sm px-2 py-0.5 border ${
                  article.status === 'published'
                    ? 'bg-[#00b04f]/20 text-[#00b04f] border-[#00b04f]/30'
                    : article.status === 'draft'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                {article.status}
              </span>
            </div>
            <h2 id="view-article-title" className="font-black text-xl text-white leading-tight">
              {article.headline}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close article modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer shrink-0 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE READING SHEET */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* METADATA STRIP */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider gap-2 pb-2 border-b border-[#1a2e45]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#ff0046]" />
                {article.timestamp || 'Today'}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                {article.viewsCount || 0} views
              </span>
            </div>

            {article.competitionName && (
              <span className="flex items-center gap-1.5 text-slate-300">
                <Tag className="w-3.5 h-3.5 text-[#ff0046]" />
                {article.competitionName}
              </span>
            )}
          </div>

          {/* FEATURED IMAGE CONTAINER */}
          {article.images && article.images.length > 0 && (
            <div className="rounded-sm border border-[#1a2e45] overflow-hidden max-h-72 bg-[#0e1c2b]">
              <img
                src={article.images[0]}
                alt={article.headline}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* SUBTITLE */}
          {article.subtitle && (
            <p className="text-slate-300 font-medium italic border-l-2 border-[#ff0046] pl-3 py-1">
              {article.subtitle}
            </p>
          )}

          {/* BODY TEXT */}
          <div className="text-slate-200 leading-relaxed whitespace-pre-line text-xs sm:text-sm font-sans pt-1">
            {article.body}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-[#0e1e2d] border-t border-[#1a2e45] px-6 py-4 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            By <span className="text-white font-extrabold">{article.authorName || 'Journalist'}</span> ({article.roleBadge || 'Reporter'})
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(article);
                }}
                className="bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold uppercase text-xs tracking-wider rounded-sm px-3.5 py-2 flex items-center gap-1.5 cursor-pointer transition-colors"
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
                className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 font-bold uppercase text-xs tracking-wider rounded-sm px-3.5 py-2 flex items-center gap-1.5 cursor-pointer transition-colors"
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
