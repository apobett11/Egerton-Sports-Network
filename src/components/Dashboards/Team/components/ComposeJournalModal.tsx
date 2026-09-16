import React, { useState } from 'react';
import { X, PenTool, Send, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ComposeJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (journal: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    imageUrl?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ComposeJournalModal: React.FC<ComposeJournalModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a headline for the journal.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please provide the main journal content.');
      return;
    }

    try {
      await onPublish({
        title: title.trim(),
        excerpt: excerpt.trim() || title.trim(),
        content: content.trim(),
        category,
        imageUrl: imageUrl.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setCategory('general');
      setExcerpt('');
      setContent('');
      setImageUrl('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish team journal. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden my-8 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] via-purple-500 to-indigo-500" />

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                Compose Team Press Release & Bulletin
              </h3>
              <p className="text-[11px] text-slate-400">
                Official statement, tactical briefing, or club announcement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Headline <span className="text-[#ff0046]">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Head Coach's Matchday Briefing: Tactical Readiness & Squad Focus"
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
            >
              <option value="general">General Team Update</option>
              <option value="announcement">Club Bulletin / Announcement</option>
              <option value="match_report">Match Preview / Report</option>
              <option value="injury">Squad Injury Update</option>
              <option value="transfer">Roster & Transfer News</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Summary / Excerpt
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {excerpt.length}/300
              </span>
            </div>
            <textarea
              maxLength={300}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-2 sentence overview of the announcement..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Main Content <span className="text-[#ff0046]">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed official statement, match notes, or squad announcement..."
              rows={5}
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Featured Image URL (Optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] transition-all"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#14263b] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-[#1a324e] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish to Newsroom'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeJournalModal;
