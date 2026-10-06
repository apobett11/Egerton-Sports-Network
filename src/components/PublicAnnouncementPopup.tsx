import React from 'react';
import { Megaphone, CheckCircle2, X } from 'lucide-react';
import type { DeviceAnnouncementItem } from '../services/DeviceService';

interface PublicAnnouncementPopupProps {
  announcement: DeviceAnnouncementItem;
  onMarkRead: (id: string) => void;
  onDismiss: () => void;
  isDark?: boolean;
}

export const PublicAnnouncementPopup: React.FC<PublicAnnouncementPopupProps> = ({
  announcement,
  onMarkRead,
  onDismiss,
  isDark = true,
}) => {
  return (
    <div
      className="fixed inset-0 z-100 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-announcement-title"
    >
      <div
        className={`w-full max-w-lg border rounded-2xl shadow-2xl p-6 md:p-7 space-y-4 transition-all ${
          isDark
            ? 'bg-[#0e1c2b] border-[#1a2e45] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-700/40 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff0046]/20 to-[#ff9800]/20 text-[#ff0046] border border-[#ff0046]/30 flex items-center justify-center shrink-0 shadow-sm">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white">
                Official Notification
              </span>
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                {new Date(announcement.created_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss announcement"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-2.5">
          <h2
            id="public-announcement-title"
            className="text-base sm:text-lg font-black tracking-tight text-white"
          >
            {announcement.title}
          </h2>
          <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-300 max-h-60 overflow-y-auto pr-1">
            {announcement.content}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onMarkRead(announcement.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicAnnouncementPopup;
