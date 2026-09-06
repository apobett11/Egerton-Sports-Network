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
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-modal-title"
    >
      <div className="w-full max-w-md bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 id="notifications-modal-title" className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ff0046]" /> Notifications & Alerts
          </h3>
          <button
            onClick={onClose}
            aria-label="Close notifications modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="p-6 space-y-2.5 overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-[#0e1c2b] border border-[#1a2e45] rounded-sm space-y-1">
              <Bell className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">No notifications available</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All caught up!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isDispute = n.type === 'dispute';
              return (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`bg-[#0e1c2b] hover:bg-[#13263b] border rounded-sm p-3.5 transition-colors cursor-pointer space-y-1.5 ${
                    !n.isRead
                      ? 'border-l-4 border-l-[#ff0046] border-t-[#1a2e45] border-r-[#1a2e45] border-b-[#1a2e45] bg-[#ff0046]/5'
                      : 'border-[#1a2e45]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-extrabold text-white text-xs">
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#ff0046] inline-block animate-pulse shrink-0" />
                      )}
                      {isDispute ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                      )}
                      <span className="truncate">{n.actorName}</span>
                      {isDispute && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                          DISPUTE
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      {n.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {n.message}
                  </p>

                  {n.targetArticleTitle && (
                    <div className="text-[10px] text-[#ff0046] font-bold uppercase tracking-wider truncate pt-0.5">
                      Story: "{n.targetArticleTitle}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-[#0e1e2d] border-t border-[#1a2e45] px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
