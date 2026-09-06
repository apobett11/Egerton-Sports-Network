import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface AvailabilityConfirmModalProps {
  isOpen: boolean;
  isCurrentlyUnavailable: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export const AvailabilityConfirmModal: React.FC<AvailabilityConfirmModalProps> = ({
  isOpen,
  isCurrentlyUnavailable,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  // If currently unavailable (true), confirming will set to available (false)
  // If currently available (false), confirming will set to unavailable (true)
  const targetWillBeUnavailable = !isCurrentlyUnavailable;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="availability-modal-title"
    >
      <div
        className="bg-white dark:bg-[#0e1e2d] border border-slate-200 dark:border-[#1a2e45] rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2e45] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center ${
                targetWillBeUnavailable
                  ? 'bg-[#00b04f]/15 border border-[#00b04f]/30 text-[#00b04f]'
                  : 'bg-[#ff0046]/15 border border-[#ff0046]/30 text-[#ff0046]'
              }`}
            >
              {targetWillBeUnavailable ? (
                <AlertTriangle className="w-5 h-5 text-[#00b04f]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#ff0046]" />
              )}
            </div>
            <div>
              <h3
                id="availability-modal-title"
                className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white"
              >
                {targetWillBeUnavailable ? 'Set to Unavailable' : 'Set to Available'}
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Referee Roster Status
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Confirmation Message */}
        <div className="space-y-3">
          <div
            className={`p-4 rounded-md border ${
              targetWillBeUnavailable
                ? 'bg-[#00b04f]/10 border-[#00b04f]/30 text-[#00b04f]'
                : 'bg-[#ff0046]/10 border-[#ff0046]/30 text-[#ff0046]'
            }`}
          >
            <p className="font-black text-xs sm:text-sm uppercase tracking-wide">
              {targetWillBeUnavailable
                ? "You will not be included in the next game's match allocation."
                : "You will now be allocated into the next game's match allocation."}
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {targetWillBeUnavailable
              ? "When marked unavailable, your status in the database is set to Inactive. You will be excluded from the referee allocation pool on Fridays when Algorithms 4 and 5 generate weekend match officiating assignments."
              : "When marked available, your status in the database is set to Active. You will be eligible for weekend match allocations when the League President runs officiating assignments on Friday."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1a2e45]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-md text-white font-black text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              targetWillBeUnavailable
                ? 'bg-[#00b04f] hover:bg-[#009241]'
                : 'bg-[#ff0046] hover:bg-[#e0003e]'
            }`}
          >
            {isSubmitting ? (
              <span>Updating...</span>
            ) : targetWillBeUnavailable ? (
              <span>Confirm Unavailable</span>
            ) : (
              <span>Confirm Available</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
