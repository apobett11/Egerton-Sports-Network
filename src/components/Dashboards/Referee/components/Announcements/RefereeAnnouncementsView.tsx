import React, { useState } from 'react';
import { 
  Megaphone, Plus, X, Send, Calendar, User, 
  ShieldCheck, AlertCircle, Award, FileText 
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
      <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              League Announcements & Notices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official bulletins from League President & Administration • Craft referee notices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Craft Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-8 text-center bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
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
              className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-[#D4AF37] border border-amber-500/20">
                    Official Notice
                  </span>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {anc.title}
                  </h3>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
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

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Authorized Publication
                </span>
                <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#141C2E]">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="craft-announcement-title"
        >
          <div
            className="bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <h3 id="craft-announcement-title" className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Craft Official Announcement
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="E.g., Matchday Pitch Protocol & Schedule Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">All Campus & Officials</option>
                  <option value="referee">Referees & Officials</option>
                  <option value="coach">Team Coaches</option>
                  <option value="captain">Captains & Players</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Content / Bulletin Details
                </label>
                <textarea
                  rows={5}
                  placeholder="Enter the official details, pitch guidelines, or match directives..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
