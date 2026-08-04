import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NotificationItem } from '../../JournalistTypes';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  cardBg: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  cardBg,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-modal-title"
    >
      <div className={`w-full max-w-md ${cardBg} p-6 rounded-3xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-700/60`}>
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 id="notifications-modal-title" className="font-extrabold text-base tracking-tight flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" /> Notifications & Alerts
          </h3>
          <button
            onClick={onClose}
            aria-label="Close notifications modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="space-y-2 text-xs font-semibold">
          {notifications.length === 0 ? (
            <p className="text-center py-6 text-slate-400">No notifications.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer space-y-1 ${
                  n.isRead
                    ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-slate-100 font-bold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {n.type === 'dispute' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {n.actorName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {n.message}
                </p>
                {n.targetArticleTitle && (
                  <p className="text-[10px] text-emerald-500 truncate">
                    Target: "{n.targetArticleTitle}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
