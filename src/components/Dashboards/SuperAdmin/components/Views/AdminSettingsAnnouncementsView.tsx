import React, { useState } from 'react';
import { Megaphone, Send, Settings, ShieldCheck, Lock, Globe } from 'lucide-react';

interface AdminSettingsAnnouncementsViewProps {
  onPostAnnouncement: (title: string, content: string, targetRole: string) => void;
  showToast: (msg: string) => void;
}

export const AdminSettingsAnnouncementsView: React.FC<AdminSettingsAnnouncementsViewProps> = ({
  onPostAnnouncement,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Platform Announcements & Operations Control
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Broadcast system notices to specific roles or modify system toggles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Announcement Form */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Broadcast System Announcement
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Notice Title</label>
              <input
                type="text"
                placeholder="e.g. Scheduled System Upgrade Window"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold"
              >
                <option value="all">All Platform Users</option>
                <option value="coach">Coaches & Captains</option>
                <option value="referee">Referees</option>
                <option value="journalist">Journalists</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Content Body</label>
              <textarea
                rows={4}
                placeholder="Details of system notice..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                if (!title || !content) {
                  showToast('Title and content are required.');
                  return;
                }
                onPostAnnouncement(title, content, targetRole);
                setTitle('');
                setContent('');
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg min-h-[44px] cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Announcement Now</span>
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              System Settings & Toggles
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Maintenance Lock Mode</div>
                <div className="text-[11px] text-gray-400">Restrict data mutations during updates</div>
              </div>
              <button
                onClick={() => showToast('Maintenance mode state toggled.')}
                className="px-3.5 py-1.5 bg-[#222222] text-gray-300 border border-[#333333] rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Toggle
              </button>
            </div>

            <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Onboarding Portal Status</div>
                <div className="text-[11px] text-gray-400">Open or restrict new account registrations</div>
              </div>
              <button
                onClick={() => showToast('Onboarding registration portal toggled.')}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
