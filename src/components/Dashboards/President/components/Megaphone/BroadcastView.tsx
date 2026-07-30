import React from 'react';
import { Megaphone } from 'lucide-react';

interface BroadcastViewProps {
  isDark: boolean;
  announcementTitle: string;
  setAnnouncementTitle: (t: string) => void;
  announcementBody: string;
  setAnnouncementBody: (b: string) => void;
  selectedAudiences: string[];
  toggleAudience: (aud: string) => void;
  handleBroadcastAnnouncement: (e: React.FormEvent) => void;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  isDark,
  announcementTitle,
  setAnnouncementTitle,
  announcementBody,
  setAnnouncementBody,
  selectedAudiences,
  toggleAudience,
  handleBroadcastAnnouncement,
}) => {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          TAB 5 — Pre-Season Megaphone
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Broadcast pre-season directives, registration cutoff notices, and official announcements across target roles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* BROADCAST FORM */}
        <div className={`lg:col-span-7 p-6 md:p-8 rounded-3xl border elevation-card space-y-6 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Broadcast Message Composer</h3>
          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Announcement Title</label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Pre-Season Registration Window Cutoff Notice"
                className={`w-full p-3 rounded-xl border text-xs font-bold ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Target Audience Selector</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['All Dashboards', 'Captains', 'Journalists', 'Referees', 'Coaches', 'Players'].map((aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => toggleAudience(aud)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedAudiences.includes(aud)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Announcement Body</label>
              <textarea
                rows={5}
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
                placeholder="Enter official pre-season directive content..."
                className={`w-full p-3 rounded-xl border text-xs ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> Broadcast Announcement
            </button>
          </form>
        </div>

        {/* LIVE PREVIEW CARD */}
        <div className={`lg:col-span-5 p-6 md:p-8 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-xs font-black uppercase tracking-wider text-orange-500">Live Dashboard Card Preview</h3>
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-500">
                Target: {selectedAudiences.join(', ')}
              </span>
              <span className="text-[10px] text-slate-400">Just Now</span>
            </div>
            <h4 className="font-black text-sm">{announcementTitle || 'Announcement Title Preview'}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {announcementBody || 'Your official pre-season broadcast text will appear here exactly as rendered on user role dashboards.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
