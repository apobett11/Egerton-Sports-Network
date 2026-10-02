import React from 'react';
import { X } from 'lucide-react';
import { SLIPS_PER_PAIR } from '../../../lib/predictions/slipBook';

export function TriesLeftPopup({
  used,
  onClose,
}: {
  used: number;
  onClose: () => void;
}) {
  const left = Math.max(0, SLIPS_PER_PAIR - used);
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-[#260a1a] via-[#122236] to-[#0e1b2b] p-5 text-white shadow-[0_0_25px_rgba(255,160,0,0.22)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="pr-8 text-sm font-black text-white">
          You are allowed three slips per 2 gameweeks. you still have {left}/{SLIPS_PER_PAIR} tries
        </p>
      </div>
    </div>
  );
}
