import React from 'react';
import { Loader2, AlertCircle, Inbox, CheckCircle2, X } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  isDark?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading operational data...',
  isDark = true,
}) => (
  <div
    className={`p-12 rounded-3xl border flex flex-col items-center justify-center gap-4 text-center ${
      isDark ? 'bg-[#0E1424] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
    }`}
  >
    <Loader2 className="w-9 h-9 animate-spin text-emerald-500" />
    <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  isDark = true,
}) => (
  <div
    className={`p-10 rounded-3xl border text-center space-y-4 max-w-lg mx-auto ${
      isDark ? 'bg-[#0E1424] border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
    }`}
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
        isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <Inbox className="w-7 h-7" />
    </div>
    <div className="space-y-1">
      <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[44px]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  isDark?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  isDark = true,
}) => (
  <div
    className={`p-6 rounded-2xl border flex items-start gap-4 ${
      isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}
  >
    <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
    <div className="space-y-2 flex-1">
      <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-500">Operation Notice</h4>
      <p className="text-xs leading-relaxed font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold underline hover:no-underline text-rose-400 cursor-pointer pt-1"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

interface ToastProps {
  message: string | null;
  onClose?: () => void;
}

export const OperationalToast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-6 z-100 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-bounce border border-emerald-400/40 text-xs font-black">
      <CheckCircle2 className="w-5 h-5 shrink-0" />
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close toast" className="ml-2 hover:opacity-80 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
