import React, { useState } from 'react';
import { 
  Megaphone, Plus, X, Send, 
  ShieldCheck, AlertCircle 
} from 'lucide-react';
import type { Announcement } from '../../../../../types';

interface RefereeAnnouncementsViewProps {
  announcements: Announcement[];
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onCreateAnnouncement: (title: string, content: string, targetRole: string) => Promise<void>;
  isSubmitting: boolean;
}

export const RefereeAnnouncementsView: React.FC<RefereeAnnouncementsViewProps> = ({
  announcements,
  isModalOpen,
  setIsModalOpen,
  onCreateAnnouncement,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Please enter both title and announcement content.');
      return;
    }
    setFormError(null);
    await onCreateAnnouncement(title, content, targetRole);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#152a40] text-white border border-[#223b56] flex items-center justify-center font-black shrink-0">
            <Megaphone className="w-4 h-4 text-[#ff0046]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 dark:text-white">
              League Announcements & Notices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official bulletins from League President & Administration • Craft referee notices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Craft Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3 sm:space-y-4">
        {announcements.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm space-y-2 shadow-xs">
            <Megaphone className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200">
              No Announcements Active
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are currently no published bulletins. You can craft a new announcement using the button above.
            </p>
          </div>
        ) : (
          announcements.map((anc) => (
            <div
              key={anc.id}
              className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#14263b] pb-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-slate-200 border border-[#223b56]">
                    Official Notice
                  </span>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                    {anc.title}
                  </h3>
                </div>

                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(anc.created_at || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {anc.content}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-[#14263b] text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-[#00b04f] font-bold text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authorized Publication
                </span>
                <span className="font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-[#152a40] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#223b56]">
                  Target: {anc.target_role || 'All Officials'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Craft Announcement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="craft-announcement-title"
        >
          <div
            className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#f8f9fa] dark:bg-[#0e1e2d] border-b border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#ff0046]" />
                <h3 id="craft-announcement-title" className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Craft Official Announcement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Matchday Pitch Protocol & Schedule Notice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="all">All Campus & Officials</option>
                    <option value="referee">Referees & Officials</option>
                    <option value="coach">Team Coaches</option>
                    <option value="captain">Captains & Players</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
                    Content / Bulletin Details
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Enter official details, pitch guidelines, or match directives..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none leading-relaxed transition-colors"
                    required
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#14263b]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Publishing...' : 'Publish Notice'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
