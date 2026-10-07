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
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-announcement-title"
    >
      <div
        className={`w-full max-w-md border rounded-xl shadow-2xl p-4 sm:p-5 space-y-3 transition-all ${
          isDark
            ? 'bg-[#0e1c2b]/95 border-[#1a2e45] text-white backdrop-blur-md'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 border-b border-slate-700/30 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff0046]/20 to-[#ff9800]/20 text-[#ff0046] border border-[#ff0046]/30 flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#ff0046] text-white">
                Official Notification
              </span>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
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
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-1.5">
          <h2
            id="public-announcement-title"
            className="text-sm sm:text-base font-black tracking-tight text-white"
          >
            {announcement.title}
          </h2>
          <div className="text-xs font-medium leading-relaxed whitespace-pre-wrap text-slate-300 max-h-40 overflow-y-auto pr-1">
            {announcement.content}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onMarkRead(announcement.id)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicAnnouncementPopup;
