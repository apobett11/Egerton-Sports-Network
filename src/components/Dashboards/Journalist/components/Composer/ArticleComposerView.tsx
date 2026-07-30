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
    <div className={`p-6 rounded-2xl border ${cardBg} space-y-6 shadow-xl`}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black tracking-tight">
              {editingArticleId ? 'Edit Draft Article' : 'Article Composer Studio'}
            </h2>
            {hasRecoveredDraft && !editingArticleId && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                Auto-Saved Draft Recovered
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Draft, attach press images, set breaking news alerts, and publish to campus timeline.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs font-semibold">
        <div>
          <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Article Headline</label>
          <input
            type="text"
            value={composerTitle}
            onChange={(e) => setComposerTitle(e.target.value)}
            disabled={isSavingArticle}
            placeholder="e.g. Egerton Strikers Secure Victory in Tatton Derby"
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm font-extrabold focus:outline-none focus:border-[#148A54] disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Article Category</label>
            <select
              value={composerCategory}
              onChange={(e) => setComposerCategory(e.target.value as ArticleCategory)}
              disabled={isSavingArticle}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:outline-none focus:border-[#148A54] disabled:opacity-50"
            >
              <option value="match_report">Match Report</option>
              <option value="breaking_news">Breaking News</option>
              <option value="transfer_rumour">Transfer Rumour</option>
              <option value="interview">Interview</option>
              <option value="photo_story">Photo Story</option>
              <option value="opinion">Opinion</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Cover Image URL</label>
            <input
              type="text"
              value={composerImageUrl}
              onChange={(e) => setComposerImageUrl(e.target.value)}
              disabled={isSavingArticle}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:outline-none focus:border-[#148A54] disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Article Excerpt / Subheadline</label>
          <input
            type="text"
            value={composerExcerpt}
            onChange={(e) => setComposerExcerpt(e.target.value)}
            disabled={isSavingArticle}
            placeholder="Brief 1-line summary for article card previews..."
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:outline-none focus:border-[#148A54] disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Full Body Content</label>
          <textarea
            rows={8}
            value={composerContent}
            onChange={(e) => setComposerContent(e.target.value)}
            disabled={isSavingArticle}
            placeholder="Write full article body content..."
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs leading-relaxed focus:outline-none focus:border-[#148A54] disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold text-[10px]">Tags (comma separated)</label>
            <input
              type="text"
              value={composerTagsInput}
              onChange={(e) => setComposerTagsInput(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Egerton, Football, EPL, Derby"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-xs font-bold focus:outline-none focus:border-[#148A54] disabled:opacity-50"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={composerIsBreaking}
                onChange={(e) => setComposerIsBreaking(e.target.checked)}
                disabled={isSavingArticle}
                className="w-4 h-4 rounded text-[#148A54]"
              />
              <span className="text-xs font-bold text-rose-500">Flag as Breaking News Alert 🚨</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            disabled={isSavingArticle}
            onClick={() => handleSaveArticle(true)}
            className="px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> {isSavingArticle ? 'Saving Draft...' : 'Save as Working Draft'}
          </button>
          <button
            type="button"
            disabled={isSavingArticle}
            onClick={() => handleSaveArticle(false)}
            className="px-6 py-3 rounded-xl bg-[#148A54] hover:bg-[#107244] text-white font-extrabold text-xs shadow-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> {isSavingArticle ? 'Publishing...' : 'Publish Live Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
