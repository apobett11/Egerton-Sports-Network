import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ToastContainer, type ToastMessage, type ToastType } from '../components/common/ToastContainer';

interface ShowToastOptions {
  type?: ToastType;
  duration?: number;
  id?: string;
}

interface ToastContextType {
  showToast: (message: string, options?: ShowToastOptions) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showLoading: (message: string) => string;
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}): string => {
      const { type = 'info', duration = 4000, id: customId } = options;

      // Anti-spam deduplication: block identical toast within 1.5s
      const now = Date.now();
      const lastSeen = recentMessagesRef.current.get(`${type}:${message}`);
      if (lastSeen && now - lastSeen < 1500) {
        return customId || 'duplicate-suppressed';
      }
      recentMessagesRef.current.set(`${type}:${message}`, now);

      const id = customId || `toast_${now}_${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastMessage = {
        id,
        type,
        message,
        duration: type === 'loading' ? 0 : duration,
      };

      setToasts((prev) => {
        // Cap max simultaneous toasts to 5 to avoid screen clutter
        const existing = prev.filter((t) => t.id !== id);
        if (existing.length >= 5) {
          return [...existing.slice(1), newToast];
        }
        return [...existing, newToast];
      });

      return id;
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'success', duration }),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'error', duration }),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'warning', duration }),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, { type: 'info', duration }),
    [showToast]
  );

  const showLoading = useCallback(
    (message: string) => showToast(message, { type: 'loading', duration: 0 }),
    [showToast]
  );

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) =>
      showToast(message, { type, duration }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        addToast,
        dismissToast,
        clearAllToasts,
      }}
    >

      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
