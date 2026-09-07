import React from 'react';
import { Bell, CheckCircle2, Megaphone, X, Check } from 'lucide-react';
import type { DeviceAnnouncementItem } from '../services/DeviceService';

interface DeviceNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: DeviceAnnouncementItem[];
  onMarkRead: (id: string) => void;
  isDark?: boolean;
}

export const DeviceNotificationsModal: React.FC<DeviceNotificationsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  onMarkRead,
  isDark = true,
}) => {
  if (!isOpen) return null;

  const unreadCount = announcements.filter((a) => a.status === 'unread').length;

  return (
    <div
      className="fixed inset-0 z-100 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-notifications-title"
    >
      <div
        className={`w-full max-w-xl border rounded-none sm:rounded-sm shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col ${
          isDark
            ? 'bg-[#0e1e2d] border-[#1a2e45] text-white'
            : 'bg-white border-[#e6e8ec] text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/40 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/25 flex items-center justify-center font-black">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="device-notifications-title"
                className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white"
              >
                Notifications & Announcements
              </h2>
              <span className="text-[10px] text-slate-400 font-bold">
                {unreadCount > 0 ? `${unreadCount} Unread on this device` : 'All caught up'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Announcements */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 space-y-2">
              <Megaphone className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
              <p>No official announcements published yet.</p>
            </div>
          ) : (
            announcements.map((anc) => {
              const isUnread = anc.status === 'unread';
              return (
                <div
                  key={anc.id}
                  onClick={() => {
                    if (isUnread) onMarkRead(anc.id);
                  }}
                  className={`p-4 rounded-sm border transition-all cursor-pointer ${
                    isUnread
                      ? isDark
                        ? 'bg-[#15273b] border-[#ff0046]/40 hover:border-[#ff0046]'
                        : 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                      : isDark
                      ? 'bg-[#0a1520] border-[#14263b] opacity-80'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-2xs text-[9px] font-black uppercase tracking-wider ${
                          isUnread
                            ? 'bg-[#ff0046] text-white animate-pulse'
                            : isDark
                            ? 'bg-[#14263b] text-slate-400'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isUnread ? 'Unread' : 'Read'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(anc.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(anc.id);
                        }}
                        className="text-[10px] font-black uppercase text-[#ff0046] hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark Read
                      </button>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1">
                    {anc.title}
                  </h3>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {anc.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Device-Specific Notification Channel</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceNotificationsModal;
