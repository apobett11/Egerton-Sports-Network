import React, { useState } from 'react';
import { X, Trophy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Match } from '../../../../../types';

interface WalkoverModalProps {
  match: Match;
  onClose: () => void;
  onConfirmWalkover: (fixtureId: string, winningTeam: 'home' | 'away') => Promise<void>;
  isSubmitting: boolean;
}

export const WalkoverModal: React.FC<WalkoverModalProps> = ({
  match,
  onClose,
  onConfirmWalkover,
  isSubmitting,
}) => {
  const [selectedWinner, setSelectedWinner] = useState<'home' | 'away'>('home');

  const handleConfirm = async () => {
    await onConfirmWalkover(match.id, selectedWinner);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkover-title"
    >
      <div
        className="bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 id="walkover-title" className="font-extrabold text-sm tracking-tight">
                Award Match Walkover
              </h3>
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-[#D4AF37]">
                Official 3-0 Victory
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close walkover modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Awarding a walkover marks this match as <strong>Full Time (FT)</strong> with a score of <strong>3 — 0</strong> in the official database. No individual player goal records will be assigned.
          </p>
        </div>

        {/* Team Selection Options */}
        <div className="space-y-2.5">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Select Winning Team (Award 3-0)
          </label>

          {/* Option 1: Home Team */}
          <div
            onClick={() => setSelectedWinner('home')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedWinner === 'home'
                ? 'bg-amber-500/10 dark:bg-[#D4AF37]/15 border-amber-500 dark:border-[#D4AF37] shadow-sm'
                : 'bg-slate-50 dark:bg-[#182234] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={match.teamA.logo}
                alt={match.teamA.name}
                className="w-9 h-9 object-contain flex-shrink-0"
              />
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {match.teamA.name}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Home Team • Award 3-0 Win
                </span>
              </div>
            </div>
            {selectedWinner === 'home' && (
              <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-[#D4AF37]" />
            )}
          </div>

          {/* Option 2: Away Team */}
          <div
            onClick={() => setSelectedWinner('away')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedWinner === 'away'
                ? 'bg-amber-500/10 dark:bg-[#D4AF37]/15 border-amber-500 dark:border-[#D4AF37] shadow-sm'
                : 'bg-slate-50 dark:bg-[#182234] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={match.teamB.logo}
                alt={match.teamB.name}
                className="w-9 h-9 object-contain flex-shrink-0"
              />
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {match.teamB.name}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Away Team • Award 3-0 Win
                </span>
              </div>
            </div>
            {selectedWinner === 'away' && (
              <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-[#D4AF37]" />
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Confirm Walkover Win</span>
          </button>
        </div>
      </div>
    </div>
  );
};
