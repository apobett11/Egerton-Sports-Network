import React, { useState } from 'react';
import { X, Trophy, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
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
  const [isLocallySubmitting, setIsLocallySubmitting] = useState<boolean>(false);

  const isMatchLocked = match.status === 'FT' || (match.status as any) === 'WALKOVER' || Boolean((match as any).stats_processed);

  const handleConfirm = async () => {
    if (isSubmitting || isLocallySubmitting || isMatchLocked) return;
    setIsLocallySubmitting(true);
    try {
      await onConfirmWalkover(match.id, selectedWinner);
      onClose();
    } catch (err) {
      console.error('Walkover error:', err);
    } finally {
      setIsLocallySubmitting(false);
    }
  };

  const winningTeamName = selectedWinner === 'home' ? match.teamA.name : match.teamB.name;
  const losingTeamName = selectedWinner === 'home' ? match.teamB.name : match.teamA.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkover-title"
    >
      <div
        className="bg-[#0b131e] border border-white/10 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 id="walkover-title" className="font-black text-base uppercase tracking-tight text-white">
                Award Match Walkover
              </h3>
              <p className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
                Official 3 — 0 Regulatory Decision
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close walkover modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WORKFLOW PROGRESS TRACKER (Make next steps so obvious) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
            <div className="w-5 h-5 rounded-full bg-[#ff0046] text-white flex items-center justify-center text-[10px] font-black">
              1
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Step 1</span>
              <span className="font-bold text-white">Choose Winner</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-black">
              2
            </div>
            <div>
              <span className="text-[10px] text-amber-300 block uppercase font-bold">Step 2 • Next</span>
              <span className="font-bold text-amber-200">Confirm 3-0 FT</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Select Winning Team */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
            Step 1: Select the winning team to receive 3-0 victory
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Home Team */}
            <div
              onClick={() => setSelectedWinner('home')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedWinner === 'home'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  Home Team
                </span>
                {selectedWinner === 'home' ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-600" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="w-10 h-10 object-contain rounded-lg bg-black/30 p-1 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-black text-xs uppercase tracking-tight text-white truncate">
                    {match.teamA.name}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Award 3 - 0
                  </span>
                </div>
              </div>
            </div>

            {/* Option 2: Away Team */}
            <div
              onClick={() => setSelectedWinner('away')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedWinner === 'away'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  Away Team
                </span>
                {selectedWinner === 'away' ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-600" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="w-10 h-10 object-contain rounded-lg bg-black/30 p-1 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-black text-xs uppercase tracking-tight text-white truncate">
                    {match.teamB.name}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Award 3 - 0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Live Decision Summary Card (Very obvious next state) */}
        <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Official Outcome Summary</span>
            <span className="text-amber-400 font-black">Status: Full Time (FT)</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-1 font-mono font-black text-lg sm:text-xl text-white">
            <span className={selectedWinner === 'home' ? 'text-amber-400' : 'text-slate-400'}>
              {match.teamA.name}
            </span>
            <span className="px-3 py-1 rounded bg-white/10 text-amber-400 font-black tracking-widest text-base">
              {selectedWinner === 'home' ? '3 — 0' : '0 — 3'}
            </span>
            <span className={selectedWinner === 'away' ? 'text-amber-400' : 'text-slate-400'}>
              {match.teamB.name}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 text-center">
            <strong>{winningTeamName}</strong> receives 3 points and +3 goal difference. <strong>{losingTeamName}</strong> forfeits.
          </p>
        </div>

        {isMatchLocked && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>This match is already finalized (Result Locked). Walkover cannot be awarded.</span>
          </div>
        )}

        {/* Modal Actions with obvious next step */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isLocallySubmitting}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            Dismiss
          </button>

          <button
            type="button"
            disabled={isSubmitting || isLocallySubmitting || isMatchLocked}
            onClick={handleConfirm}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isSubmitting || isLocallySubmitting ? 'Awarding Walkover...' : 'Confirm Walkover Win (3-0 FT)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default WalkoverModal;
