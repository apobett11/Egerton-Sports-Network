import React from 'react';
import { Modal, Button } from './UIComponents';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            variant === 'danger'
              ? 'bg-red-500/10 text-red-500'
              : variant === 'warning'
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-blue-500/10 text-blue-500'
          }`}
        >
          {variant === 'danger' ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {message}
          </p>
          {variant === 'danger' && (
            <p className="text-xs text-red-500/90 font-semibold pt-1">
              This action cannot be undone. Please ensure you intend to proceed.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
