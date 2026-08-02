import React, { useState } from 'react';
import { X, PenTool, Image as ImageIcon, Send, AlertCircle } from 'lucide-react';

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
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2C2C2E] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Compose Official Team Journal
              </h3>
              <p className="text-xs text-gray-400">
                Publish official club updates directly to the Egerton News Desk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Headline Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Journal Title / Headline <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-500 font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Captain's Matchday Briefing: Tactical Readiness & Squad Focus"
              className="w-full bg-[#111111] border border-[#2C2C2E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111111] border border-[#2C2C2E] rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="general">General Team Update</option>
              <option value="announcement">Club Bulletin / Announcement</option>
              <option value="match_report">Match Preview / Report</option>
              <option value="injury">Squad Injury Update</option>
              <option value="transfer">Roster & Transfer News</option>
            </select>
          </div>

          {/* Summary / Excerpt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Executive Summary / Excerpt
              </label>
              <span className="text-[10px] text-gray-500 font-mono">
                {excerpt.length}/300
              </span>
            </div>
            <textarea
              maxLength={300}
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary to highlight on the news feed card..."
              className="w-full bg-[#111111] border border-[#2C2C2E] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Main Body Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Journal Body <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-500 font-mono">
                {content.length}/5000
              </span>
            </div>
            <textarea
              maxLength={5000}
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full journal article or official club statement..."
              className="w-full bg-[#111111] border border-[#2C2C2E] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-y"
              required
            />
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cover Image URL (Optional)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#111111] border border-[#2C2C2E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2C2E]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-[#111111] hover:bg-[#2C2C2E] text-gray-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Team Journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
