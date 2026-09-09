import React, { useState } from 'react';
import { X, PenTool, Send, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#ff0046]" />
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Compose Team Press Release & Bulletin
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-4 p-2.5 bg-[#ff0046]/10 border border-[#ff0046]/20 rounded-sm text-[#ff0046] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Headline <span className="text-[#ff0046]">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Head Coach's Matchday Briefing: Tactical Readiness & Squad Focus"
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
            >
              <option value="general">General Team Update</option>
              <option value="announcement">Club Bulletin / Announcement</option>
              <option value="match_report">Match Preview / Report</option>
              <option value="injury">Squad Injury Update</option>
              <option value="transfer">Roster & Transfer News</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Summary / Excerpt
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {excerpt.length}/300
              </span>
            </div>
            <textarea
              maxLength={300}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-2 sentence overview of the announcement..."
              rows={2}
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Main Content <span className="text-[#ff0046]">*</span>
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed official statement, match notes, or squad announcement..."
              rows={5}
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Featured Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ff0046]"
            />
          </div>

          <div className="pt-3 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
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
