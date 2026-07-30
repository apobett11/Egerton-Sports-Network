import React, { Component, useEffect, type ReactNode } from 'react';
import { Loader2, AlertCircle, X, Info } from 'lucide-react';

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] min-w-[44px]";
  
  const sizeStyles = {
    sm: "px-3 py-2 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  const variantStyles = {
    primary: "bg-[#D4AF37] hover:bg-[#c3a02f] text-slate-950 font-bold shadow-md shadow-amber-500/10 active:scale-98",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    outline: "border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
};

// --- CARD COMPONENT ---
interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  onClick?: () => void;
  'aria-label'?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action, onClick, 'aria-label': ariaLabel }) => {
  return (
    <div 
      onClick={onClick}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bento-card rounded-xl p-5 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#191c1e] text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div>
            {title && <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- BADGE COMPONENT ---
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    gold: "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- MODAL COMPONENT ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1d2022] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-2 text-sm text-slate-700 dark:text-slate-300 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// --- INPUT FIELD ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-[#D4AF37] transition-all min-h-[44px] ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium" role="alert">{error}</p>}
    </div>
  );
};

// --- SPINNER & SKELETON ---
export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading live data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-3" role="status" aria-live="polite">
    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" aria-hidden="true" />
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">{label}</p>
  </div>
);

export const SkeletonLoader: React.FC<{ count?: number; variant?: 'list' | 'card' | 'table' }> = ({ count = 3, variant = 'list' }) => {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="status" aria-label="Loading cards">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-36 w-full bg-slate-200 dark:bg-slate-800/60 animate-pulse rounded-2xl p-4 space-y-3">
            <div className="h-4 w-1/3 bg-slate-300 dark:bg-slate-700 rounded-md" />
            <div className="h-8 w-2/3 bg-slate-300 dark:bg-slate-700 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-300 dark:bg-slate-700 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#191c1e]" role="status" aria-label="Loading table">
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-800/80 animate-pulse rounded-md" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800/40 animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" role="status" aria-label="Loading list items">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-slate-200 dark:bg-slate-800/60 animate-pulse rounded-xl" />
      ))}
    </div>
  );
};

// --- EMPTY STATE ---
export const EmptyState: React.FC<{ title: string; message: string; action?: ReactNode; icon?: ReactNode }> = ({
  title,
  message,
  action,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 transition-all">
    {icon || <Info className="w-10 h-10 text-[#D4AF37] mb-3 opacity-80" aria-hidden="true" />}
    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-4 leading-relaxed">{message}</p>
    {action}
  </div>
);

// --- ERROR BOUNDARY ---
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-md mx-auto text-center my-12 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-4" role="alert">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Component Error</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              An unexpected display error occurred in this section.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </Button>
            <Button variant="danger" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

