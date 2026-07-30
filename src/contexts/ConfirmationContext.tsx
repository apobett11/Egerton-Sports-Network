import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void | Promise<void>;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ConfirmationOptions & { isOpen: boolean; isLoading: boolean }>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((options: ConfirmationOptions) => {
    setModalState({
      ...options,
      isOpen: true,
      isLoading: false,
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      await modalState.onConfirm();
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setModalState((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    }
  }, [modalState]);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        isLoading={modalState.isLoading}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
