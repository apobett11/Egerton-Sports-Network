import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'loading'
  | 'goal'
  | 'yellow'
  | 'red'
  | 'injury'
  | 'sub'
  | 'status';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  icon?: string;
  duration?: number;
}

export type ToastItem = ToastMessage;

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  const getTypeStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 ring-1 ring-emerald-500/30';
      case 'warning':
        return 'bg-amber-950/90 text-amber-100 border-amber-500/40 ring-1 ring-amber-500/30';
      case 'error':
        return 'bg-red-950/90 text-red-100 border-red-500/40 ring-1 ring-red-500/30';
      case 'loading':
        return 'bg-slate-900/90 text-blue-200 border-blue-500/40 ring-1 ring-blue-500/30';
      case 'goal':
        return 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-400/40 ring-2 ring-emerald-500/30';
      case 'yellow':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300/50 ring-2 ring-amber-400/30';
      case 'red':
        return 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-400/40 ring-2 ring-red-500/30';
      case 'injury':
        return 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-400/40';
      case 'sub':
        return 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white border-blue-400/40';
      case 'status':
        return 'bg-gradient-to-r from-slate-900 to-slate-950 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/20';
      case 'info':
      default:
        return 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-xl';
    }
  };

  const renderIcon = (toast: ToastMessage) => {
    if (toast.icon) return <span className="text-lg shrink-0">{toast.icon}</span>;

    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[9999] flex flex-col gap-2 max-w-[330px] w-full pointer-events-none select-none [text-size-adjust:100%] [-webkit-text-size-adjust:100%]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto p-3 rounded-xl border shadow-xl backdrop-blur-xl flex items-start justify-between gap-2.5 transition-all max-h-24 overflow-hidden ${getTypeStyle(
            toast.type
          )}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {renderIcon(toast)}
            <div className="space-y-0.5 min-w-0">
              {toast.title && (
                <h4 className="font-bold text-[10.5px] uppercase tracking-wider leading-none truncate">
                  {toast.title}
                </h4>
              )}
              <p className="text-[11px] font-semibold leading-tight opacity-95 line-clamp-2">
                {toast.message}
              </p>
            </div>
          </div>
          {toast.type !== 'loading' && (
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full hover:bg-black/20 text-current opacity-70 hover:opacity-100 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer shrink-0"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
