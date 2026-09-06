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
    className={`p-12 rounded-md border flex flex-col items-center justify-center gap-4 text-center ${
      isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-slate-300' : 'bg-white border-[#e6e8ec] text-slate-700'
    }`}
  >
    <Loader2 className="w-8 h-8 animate-spin text-[#ff0046]" />
    <p className="text-xs font-black uppercase tracking-wider">{label}</p>
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
    className={`p-10 rounded-md border text-center space-y-4 max-w-lg mx-auto ${
      isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-slate-300' : 'bg-white border-[#e6e8ec] text-slate-700'
    }`}
  >
    <div
      className={`w-12 h-12 rounded-md flex items-center justify-center mx-auto ${
        isDark ? 'bg-[#152a40] text-slate-400' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <Inbox className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
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
    className={`p-5 rounded-md border flex items-start gap-3.5 ${
      isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
    }`}
  >
    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
    <div className="space-y-2 flex-1">
      <h4 className="font-black text-xs uppercase tracking-wider text-rose-500">Operation Notice</h4>
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
    <div className="fixed top-16 right-4 sm:right-6 z-100 flex items-center gap-2.5 bg-[#0e1e2d] border border-[#1a2e45] text-white px-4 py-2.5 rounded-md shadow-2xl text-xs font-bold ring-1 ring-white/10">
      <CheckCircle2 className="w-4 h-4 text-[#00b04f] shrink-0" />
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close toast" className="ml-2 hover:opacity-80 cursor-pointer text-slate-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
