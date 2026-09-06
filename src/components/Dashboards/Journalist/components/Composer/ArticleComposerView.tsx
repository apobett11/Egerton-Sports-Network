import React from 'react';
import { Send, FileText } from 'lucide-react';
import type { ArticleCategory } from '../../JournalistTypes';

interface ArticleComposerViewProps {
  cardBg: string;
  composerTitle: string;
  setComposerTitle: (t: string) => void;
  composerCategory: ArticleCategory;
  setComposerCategory: (c: ArticleCategory) => void;
  composerExcerpt: string;
  setComposerExcerpt: (e: string) => void;
  composerContent: string;
  setComposerContent: (c: string) => void;
  composerImageUrl: string;
  setComposerImageUrl: (u: string) => void;
  composerTagsInput: string;
  setComposerTagsInput: (t: string) => void;
  composerIsBreaking: boolean;
  setComposerIsBreaking: (b: boolean) => void;
  editingArticleId: string | null;
  handleSaveArticle: (isDraft: boolean) => void;
  hasRecoveredDraft?: boolean;
  isSavingArticle?: boolean;
}

export const ArticleComposerView: React.FC<ArticleComposerViewProps> = ({
  cardBg,
  composerTitle,
  setComposerTitle,
  composerCategory,
  setComposerCategory,
  composerExcerpt,
  setComposerExcerpt,
  composerContent,
  setComposerContent,
  composerImageUrl,
  setComposerImageUrl,
  composerTagsInput,
  setComposerTagsInput,
  composerIsBreaking,
  setComposerIsBreaking,
  editingArticleId,
  handleSaveArticle,
  hasRecoveredDraft = false,
  isSavingArticle = false,
}) => {
  return (
    <div className={`p-4 sm:p-6 rounded-none sm:rounded-sm border ${cardBg} space-y-5 shadow-xs`}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#1a2e45] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">
              {editingArticleId ? 'Edit Draft Article' : 'Article Composer Studio'}
            </h2>
            {hasRecoveredDraft && !editingArticleId && (
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                Auto-Saved Draft Recovered
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Draft, attach press images, set breaking news alerts, and publish to campus timeline.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs font-semibold">
        <div>
          <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Article Headline</label>
          <input
            type="text"
            value={composerTitle}
            onChange={(e) => setComposerTitle(e.target.value)}
            disabled={isSavingArticle}
            placeholder="e.g. Egerton Strikers Secure Victory in Tatton Derby"
            className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Article Category</label>
            <select
              value={composerCategory}
              onChange={(e) => setComposerCategory(e.target.value as ArticleCategory)}
              disabled={isSavingArticle}
              className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white font-bold text-xs disabled:opacity-50 transition-colors"
            >
              <option value="match_report" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Match Report</option>
              <option value="breaking_news" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Breaking News</option>
              <option value="transfer_rumour" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Transfer Rumour</option>
              <option value="interview" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Interview</option>
              <option value="photo_story" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Photo Story</option>
              <option value="opinion" className="bg-white dark:bg-[#0e1e2d] text-slate-900 dark:text-white">Opinion</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Cover Image URL</label>
            <input
              type="text"
              value={composerImageUrl}
              onChange={(e) => setComposerImageUrl(e.target.value)}
              disabled={isSavingArticle}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs disabled:opacity-50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Article Excerpt / Subheadline</label>
          <input
            type="text"
            value={composerExcerpt}
            onChange={(e) => setComposerExcerpt(e.target.value)}
            disabled={isSavingArticle}
            placeholder="Brief 1-line summary for article card previews..."
            className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs disabled:opacity-50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Full Body Content</label>
          <textarea
            rows={8}
            value={composerContent}
            onChange={(e) => setComposerContent(e.target.value)}
            disabled={isSavingArticle}
            placeholder="Write full article body content..."
            className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs leading-relaxed disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold text-[10px] tracking-wider">Tags (comma separated)</label>
            <input
              type="text"
              value={composerTagsInput}
              onChange={(e) => setComposerTagsInput(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Egerton, Football, EPL, Derby"
              className="w-full p-2.5 rounded-sm bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] focus:border-[#ff0046] focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={composerIsBreaking}
                onChange={(e) => setComposerIsBreaking(e.target.checked)}
                disabled={isSavingArticle}
                className="w-4 h-4 rounded-xs text-[#ff0046] focus:ring-[#ff0046] accent-[#ff0046] border-[#223b56] cursor-pointer"
              />
              <span className="text-xs font-black uppercase tracking-wider text-rose-500">Flag as Breaking News Alert 🚨</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#1a2e45]">
          <button
            type="button"
            disabled={isSavingArticle}
            onClick={() => handleSaveArticle(true)}
            className="px-4 py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold uppercase text-xs tracking-wider shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> {isSavingArticle ? 'Saving Draft...' : 'Save as Working Draft'}
          </button>
          <button
            type="button"
            disabled={isSavingArticle}
            onClick={() => handleSaveArticle(false)}
            className="px-5 py-2.5 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> {isSavingArticle ? 'Publishing...' : 'Publish Article'}
          </button>
        </div>
      </div>
    </div>
  );
};
