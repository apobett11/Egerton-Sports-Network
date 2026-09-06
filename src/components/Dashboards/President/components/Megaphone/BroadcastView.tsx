import React from 'react';
import { Megaphone, Send } from 'lucide-react';
import type { AnnouncementItem } from '../../types';

interface BroadcastViewProps {
  isDark: boolean;
  announcementTitle: string;
  setAnnouncementTitle: (t: string) => void;
  announcementBody: string;
  setAnnouncementBody: (b: string) => void;
  recipientGroup: string;
  setRecipientGroup: (r: string) => void;
  recentAnnouncements: AnnouncementItem[];
  handleBroadcastAnnouncement: (e: React.FormEvent) => void;
  isSending?: boolean;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  isDark,
  announcementTitle,
  setAnnouncementTitle,
  announcementBody,
  setAnnouncementBody,
  recipientGroup,
  setRecipientGroup,
  recentAnnouncements,
  handleBroadcastAnnouncement,
  isSending = false,
}) => {
  const MAX_TITLE_LENGTH = 100;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Make Announcement
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Broadcast official pre-season announcements to user roles and target audiences across the platform.
        </p>
      </div>

      {/* ANNOUNCEMENT FORM */}
      <div className={`p-6 md:p-8 rounded-none sm:rounded-sm border space-y-6 ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xs ${isDark ? 'bg-[#152a40] text-[#ff0046] border border-[#223b56]' : 'bg-[#e9edf2] text-[#ff0046] border border-[#d2d8e0]'} flex items-center justify-center font-bold`}>
            <Megaphone className="w-5 h-5" />
          </div>
          <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Announcement</h3>
        </div>

        <form onSubmit={handleBroadcastAnnouncement} className="space-y-5">
          {/* Recipient Dropdown */}
          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Recipient</label>
            <select
              value={recipientGroup}
              onChange={(e) => setRecipientGroup(e.target.value)}
              className={`w-full p-3 rounded-md border text-xs font-bold ${isDark ? 'bg-[#15273b] border-[#223b56] text-white focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-slate-800 focus:border-[#ff0046] focus:outline-none'}`}
            >
              <option value="all">All (Default)</option>
              <option value="coaches">Coaches</option>
              <option value="captains">Captains</option>
              <option value="referees">Referees</option>
              <option value="journalists">Journalists</option>
              <option value="players">Players</option>
            </select>
          </div>

          {/* Title Field with Character Counter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 text-xs uppercase font-bold">Title</label>
              <span className={`text-[10px] font-mono font-bold ${announcementTitle.length >= MAX_TITLE_LENGTH ? 'text-[#ff0046]' : 'text-slate-400'}`}>
                {announcementTitle.length} / {MAX_TITLE_LENGTH}
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_TITLE_LENGTH}
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="e.g. Pre-Season Roster Verification Cutoff Notice"
              className={`w-full p-3 rounded-md border text-xs font-bold ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-slate-800 placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              required
            />
          </div>

          {/* Message Body Field */}
          <div>
            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Message Body</label>
            <textarea
              rows={5}
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Enter official announcement message body..."
              className={`w-full p-3 rounded-md border text-xs leading-relaxed font-medium ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-slate-800 placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              required
            />
          </div>

          {/* Send Announcement Button */}
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Send Announcement
          </button>
        </form>
      </div>

      {/* RECENT ANNOUNCEMENTS TABLE */}
      <div className={`p-6 rounded-none sm:rounded-sm border space-y-4 ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Recent Announcements ({recentAnnouncements.length})
        </h3>

        {recentAnnouncements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No announcements published yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#112236] border-[#1a2e45] text-slate-400' : 'bg-[#f8f9fa] border-[#e6e8ec] text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Read Count</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#14263b]' : 'divide-slate-200'}`}>
                {recentAnnouncements.map((anc) => (
                  <tr key={anc.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    <td className="px-4 py-3 font-black">{anc.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase ${isDark ? 'bg-[#152a40] text-[#ff0046] border border-[#223b56]' : 'bg-slate-100 text-[#ff0046] border border-slate-300'}`}>
                        {anc.target_role || 'All'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {new Date(anc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-400">
                      {anc.read_count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
