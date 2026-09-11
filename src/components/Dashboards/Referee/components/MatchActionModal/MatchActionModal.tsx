import React from 'react';
import { 
  X, CheckCircle2, Trophy, Lock, MapPin, Clock, 
  ArrowRight, Shield 
} from 'lucide-react';
import { formatMatchTime, formatMatchPitch } from '../../../../../lib/matchdayHelper';
import type { Match } from '../../../../../types';
import { useToast } from '../../../../../contexts/ToastContext';

interface MatchActionModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onEndMatch: (match: Match) => void;
  onOpenWalkover: (match: Match) => void;
}

export const MatchActionModal: React.FC<MatchActionModalProps> = ({
  match,
  isOpen,
  onClose,
  onEndMatch,
  onOpenWalkover,
}) => {
  const { showWarning } = useToast();

  if (!isOpen) return null;

  const isConcluded = match.status === 'FT' || match.status === 'WALKOVER' || (match as any).stats_processed;
  const isCancelled = match.status === 'CANCELLED';

  const handleCancelClick = () => {
    showWarning('The President can only cancel the matches.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-[#0c141f] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl text-white animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple HIG Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-block">
              {match.league || 'Egerton League'} • Round {match.matchday || 1}
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
              Match Operations Desk
            </h3>
            <p className="text-xs text-slate-400">
              Select an official match officiating action below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Details Strip */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {match.teamA.logo ? (
                <img src={match.teamA.logo} alt={match.teamA.name} className="w-6 h-6 rounded-full object-contain shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                  {match.teamA.name.slice(0, 2)}
                </div>
              )}
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-[170px]">
                {match.teamA.name}
              </span>
            </div>

            <div className="px-2.5 py-0.5 rounded-md bg-white/10 font-mono font-black text-xs text-slate-300 shrink-0">
              {match.status !== 'UPCOMING' ? `${match.scoreA ?? 0} — ${match.scoreB ?? 0}` : 'VS'}
            </div>

            <div className="flex items-center gap-2.5 min-w-0 justify-end">
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-[170px] text-right">
                {match.teamB.name}
              </span>
              {match.teamB.logo ? (
                <img src={match.teamB.logo} alt={match.teamB.name} className="w-6 h-6 rounded-full object-contain shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                  {match.teamB.name.slice(0, 2)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {formatMatchTime(match.scheduledTime || match.time)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span className="truncate max-w-[180px]">{formatMatchPitch(match.venue, true) || match.venue || 'TBD'}</span>
            </span>
          </div>
        </div>

        {/* Primary Action Choices */}
        {isConcluded ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">
              Match Concluded & Result Locked
            </h4>
            <p className="text-xs text-slate-400">
              Official full-time score and match events have been finalized in league records. Further updates are locked to prevent duplicate processing.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Action 1: End Match */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEndMatch(match);
              }}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500/25 hover:to-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/50 transition-all cursor-pointer group flex items-center justify-between shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    End Match & Submit Final Score
                  </h4>
                  <p className="text-xs text-slate-400">
                    Log official goals, yellow/red cards, substitutions, and verify full-time score.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 2: Award Walkover */}
            {!isCancelled && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWalkover(match);
                }}
                className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/15 border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer group flex items-center justify-between shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                      Award Walkover (3 — 0)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Award automatic 3-0 victory if an opponent forfeits or fails to arrive.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Action 3: Cancel Match (Explicitly Disabled with Warning Toast) */}
            <button
              type="button"
              onClick={handleCancelClick}
              className="w-full text-left p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/[0.03] transition-all cursor-pointer group flex items-center justify-between opacity-75 hover:opacity-100"
              title="Only the President can cancel matches"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400/70 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-300 group-hover:text-rose-300 transition-colors">
                      Cancel Match
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      President Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Referees cannot cancel fixtures. This authority is reserved exclusively for the President.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Footer Dismiss Button */}
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
