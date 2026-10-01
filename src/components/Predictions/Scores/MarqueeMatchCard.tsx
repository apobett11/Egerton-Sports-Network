import React from 'react';
import { Flame, Lock, Unlock, Share2, Sparkles, Shield } from 'lucide-react';
import type { Match, ConsensusData } from '../../../types/predictions';

interface MarqueeMatchCardProps {
  derbyMatch: Match;
  isUnlocked: boolean;
  canUnlock: boolean;
  consensus?: ConsensusData;
  onShareAndReveal: () => void;
  onOpenConsensusModal: () => void;
}

export const MarqueeMatchCard: React.FC<MarqueeMatchCardProps> = ({
  derbyMatch,
  isUnlocked,
  canUnlock,
  consensus,
  onShareAndReveal,
  onOpenConsensusModal,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-[#ff9800]/60 bg-gradient-to-b from-[#191508] via-[#0e1c2b] to-[#0e1c2b] p-5 tactical-card-shadow glow-derby">
      {/* Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ff9800]/30">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff9800] text-black font-black">
            <Flame className="h-4 w-4" />
          </span>
          <span className="text-xs sm:text-sm font-black tracking-widest text-[#ff9800] uppercase">
            Matchday Climax • Marquee Derby
          </span>
        </div>
        <span className="rounded-full bg-[#ff9800]/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#ff9800] border border-[#ff9800]/40">
          Climax Match
        </span>
      </div>

      {/* Marquee Teams */}
      <div className="my-5 grid grid-cols-7 items-center">
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-[#ff9800]/60 bg-[#081018] p-1 shadow-lg">
            {derbyMatch.homeTeam.logoUrl ? (
              <img
                src={derbyMatch.homeTeam.logoUrl}
                alt={derbyMatch.homeTeam.name}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
            {derbyMatch.homeTeam.name}
          </span>
        </div>

        {/* VS / Clash */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className="text-sm font-black tracking-widest text-[#ff9800]">VS</span>
          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Clash</span>
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-[#ff9800]/60 bg-[#081018] p-1 shadow-lg">
            {derbyMatch.awayTeam.logoUrl ? (
              <img
                src={derbyMatch.awayTeam.logoUrl}
                alt={derbyMatch.awayTeam.name}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
            {derbyMatch.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Locked / Unlocked State Content */}
      <div className="mt-4 rounded-xl bg-[#081018]/90 p-4 border border-slate-700/60 text-center">
        {isUnlocked ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Unlock className="h-4 w-4" />
              <span>Derby Consensus Unlocked</span>
            </div>
            <p className="text-xs text-slate-300">
              The high-stakes fan distribution for this marquee clash is revealed!
            </p>
            <button
              type="button"
              onClick={onOpenConsensusModal}
              className="w-full py-2.5 rounded-lg bg-[#00b04f] text-white font-black text-xs uppercase tracking-wider shadow-lg hover:bg-[#009b45] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>View Derby Breakdown & Live Table Impact →</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Lock className="h-4 w-4" />
              <span>The Fan Consensus is Locked</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {canUnlock
                ? 'All regular picks completed! Share your matchday predictions to reveal what the fans voted.'
                : 'Complete your remaining matchday predictions to unlock the community consensus for this marquee clash.'}
            </p>

            <button
              type="button"
              disabled={!canUnlock}
              onClick={onShareAndReveal}
              className={`w-full py-3 rounded-lg font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                canUnlock
                  ? 'bg-gradient-to-r from-[#ff9800] to-[#ff0046] text-white hover:opacity-95 cursor-pointer'
                  : 'bg-[#1a2e45] text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Share2 className="h-4 w-4" />
              <span>{canUnlock ? 'Share & Reveal Consensus' : 'Complete All Picks to Unlock'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
