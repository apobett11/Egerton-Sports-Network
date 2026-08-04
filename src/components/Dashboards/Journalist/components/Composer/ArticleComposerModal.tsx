import React from 'react';
import { X, Send, Save, Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  ArticleCategory,
  ARTICLE_CATEGORY_LABELS,
  CurrentMatchEvent,
  OptionItem,
} from '../../JournalistTypes';

interface ArticleComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  composeType: ArticleCategory;
  setComposeType: (type: ArticleCategory) => void;
  composeHeadline: string;
  setComposeHeadline: (headline: string) => void;
  composeSubtitle: string;
  setComposeSubtitle: (subtitle: string) => void;
  composeBody: string;
  setComposeBody: (body: string) => void;
  composeMatchId: string;
  setComposeMatchId: (id: string) => void;
  composeTeamId: string;
  setComposeTeamId: (id: string) => void;
  composeCompetitionId: string;
  setComposeCompetitionId: (id: string) => void;
  composeImageUrl: string;
  setComposeImageUrl: (url: string) => void;
  matches: CurrentMatchEvent[];
  competitions: OptionItem[];
  teams: OptionItem[];
  currentEvent: CurrentMatchEvent;
  editingArticleId: string | null;
  isSavingArticle: boolean;
  handleSaveArticle: (isDraft: boolean) => void;
  cardBg: string;
}

export const ArticleComposerModal: React.FC<ArticleComposerModalProps> = ({
  isOpen,
  onClose,
  composeType,
  setComposeType,
  composeHeadline,
  setComposeHeadline,
  composeSubtitle,
  setComposeSubtitle,
  composeBody,
  setComposeBody,
  composeMatchId,
  setComposeMatchId,
  composeTeamId,
  setComposeTeamId,
  composeCompetitionId,
  setComposeCompetitionId,
  composeImageUrl,
  setComposeImageUrl,
  matches,
  competitions,
  teams,
  currentEvent: _currentEvent,
  editingArticleId,
  isSavingArticle,
  handleSaveArticle,
  cardBg,
}) => {
  if (!isOpen) return null;

  const MAX_HEADLINE_LENGTH = 140;
  const headlineLength = composeHeadline.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
    >
      <div className={`w-full max-w-2xl ${cardBg} p-5 md:p-6 rounded-3xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-700/60`}>
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="compose-modal-title" className="font-extrabold text-base tracking-tight leading-none">
                {editingArticleId ? 'Edit News Article' : 'Compose News Article'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Publish live match reports, interviews, and campus breaking news.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close compose modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs font-semibold">
          {/* ARTICLE TYPE DROPDOWN */}
          <div>
            <label htmlFor="article-type-select" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
              Article Type
            </label>
            <select
              id="article-type-select"
              value={composeType}
              onChange={(e) => setComposeType(e.target.value as ArticleCategory)}
              disabled={isSavingArticle}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {(Object.keys(ARTICLE_CATEGORY_LABELS) as ArticleCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {ARTICLE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* HEADLINE WITH LIVE CHARACTER COUNTER */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="article-headline-input" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px]">
                Headline <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono font-bold ${
                headlineLength > MAX_HEADLINE_LENGTH ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {headlineLength} / {MAX_HEADLINE_LENGTH}
              </span>
            </div>
            <input
              id="article-headline-input"
              type="text"
              maxLength={MAX_HEADLINE_LENGTH}
              value={composeHeadline}
              onChange={(e) => setComposeHeadline(e.target.value)}
              disabled={isSavingArticle}
              placeholder="e.g. Tatton FC Edge Njoro City 2-1 in Thrilling Derby Finish!"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SUBTITLE */}
          <div>
            <label htmlFor="article-subtitle-input" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
              Subtitle (Optional)
            </label>
            <input
              id="article-subtitle-input"
              type="text"
              value={composeSubtitle}
              onChange={(e) => setComposeSubtitle(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Brief 1-sentence summary preview..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* MATCH, TEAM, COMPETITION DROPDOWNS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* MATCH DROPDOWN */}
            <div>
              <label htmlFor="article-match-select" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
                Associated Match
              </label>
              <select
                id="article-match-select"
                value={composeMatchId}
                onChange={(e) => setComposeMatchId(e.target.value)}
                disabled={isSavingArticle}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam} vs {m.awayTeam} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {/* TEAM DROPDOWN */}
            <div>
              <label htmlFor="article-team-select" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
                Associated Team
              </label>
              <select
                id="article-team-select"
                value={composeTeamId}
                onChange={(e) => setComposeTeamId(e.target.value)}
                disabled={isSavingArticle}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                <option value="">-- General / None --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* COMPETITION DROPDOWN */}
            <div>
              <label htmlFor="article-comp-select" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
                Competition
              </label>
              <select
                id="article-comp-select"
                value={composeCompetitionId}
                onChange={(e) => setComposeCompetitionId(e.target.value)}
                disabled={isSavingArticle}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                <option value="">-- General --</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FEATURED IMAGE */}
          <div>
            <label htmlFor="article-image-input" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
              Featured Image URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="article-image-input"
                  type="url"
                  value={composeImageUrl}
                  onChange={(e) => setComposeImageUrl(e.target.value)}
                  disabled={isSavingArticle}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* BODY CONTENT */}
          <div>
            <label htmlFor="article-body-input" className="block text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] mb-1">
              Article Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="article-body-input"
              rows={6}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Write the complete article content here..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSavingArticle}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveArticle(true)}
              disabled={isSavingArticle}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingArticle ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={() => handleSaveArticle(false)}
              disabled={isSavingArticle}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-900/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSavingArticle ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
