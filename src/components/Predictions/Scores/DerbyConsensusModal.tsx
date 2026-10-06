import React from 'react';
import { X, Sparkles, Trophy, ArrowRight, Shield } from 'lucide-react';
import type { Match, ConsensusData } from '../../../types/predictions';
import { showVotesForConsensus } from '../../../lib/predictions/voteDisplay.mjs';

interface DerbyConsensusModalProps {
  derbyMatch: Match;
  consensus?: ConsensusData;
  onClose: () => void;
  onNavigateStandings: () => void;
}

export const DerbyConsensusModal: React.FC<DerbyConsensusModalProps> = ({
  derbyMatch,
  consensus,
  onClose,
  onNavigateStandings,
}) => {
  const { homePct, drawPct, awayPct, homeVotes, drawVotes, awayVotes, total: totalVotes } =
    showVotesForConsensus(consensus, derbyMatch.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#ff9800] bg-[#0e1c2b] p-6 text-white tactical-modal-shadow">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pb-4 border-b border-slate-700/60">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9800]/20 px-3 py-1 text-xs font-black uppercase text-[#ff9800] border border-[#ff9800]/40">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CONSENSUS UNLOCKED</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-2">
            {derbyMatch.homeTeam.name} vs {derbyMatch.awayTeam.name}
          </h2>
          <p className="text-xs text-slate-400">
            Authoritative Matchday Climax Community Distribution
          </p>
        </div>

        {/* Teams Visual */}
        <div className="my-5 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-700 bg-[#081018] p-1 shadow-md mb-2">
              {derbyMatch.homeTeam.logoUrl ? (
                <img src={derbyMatch.homeTeam.logoUrl} alt={derbyMatch.homeTeam.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <Shield className="h-full w-full text-slate-500" />
              )}
            </div>
            <span className="text-xs font-black text-white">{derbyMatch.homeTeam.name}</span>
          </div>

          <div className="text-sm font-black text-[#ff9800]">VS</div>

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-700 bg-[#081018] p-1 shadow-md mb-2">
              {derbyMatch.awayTeam.logoUrl ? (
                <img src={derbyMatch.awayTeam.logoUrl} alt={derbyMatch.awayTeam.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <Shield className="h-full w-full text-slate-500" />
              )}
            </div>
            <span className="text-xs font-black text-white">{derbyMatch.awayTeam.name}</span>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-3 bg-[#081018] p-4 rounded-xl border border-[#16283d]">
          {/* Home */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-200">{derbyMatch.homeTeam.name} Win</span>
              <span className="text-[#00b04f] font-black">{homeVotes.toLocaleString()} votes</span>
            </div>
            <div className="h-2.5 w-full bg-[#16283d] rounded-full overflow-hidden">
              <div className="h-full bg-[#00b04f] rounded-full transition-all duration-500" style={{ width: `${homePct}%` }} />
            </div>
          </div>

          {/* Draw */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-200">Draw (X)</span>
              <span className="text-[#ff9800] font-black">{drawVotes.toLocaleString()} votes</span>
            </div>
            <div className="h-2.5 w-full bg-[#16283d] rounded-full overflow-hidden">
              <div className="h-full bg-[#ff9800] rounded-full transition-all duration-500" style={{ width: `${drawPct}%` }} />
            </div>
          </div>

          {/* Away */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-200">{derbyMatch.awayTeam.name} Win</span>
              <span className="text-[#ff0046] font-black">{awayVotes.toLocaleString()} votes</span>
            </div>
            <div className="h-2.5 w-full bg-[#16283d] rounded-full overflow-hidden">
              <div className="h-full bg-[#ff0046] rounded-full transition-all duration-500" style={{ width: `${awayPct}%` }} />
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Total Community Activity: <span className="font-bold text-white">{totalVotes}</span> fan predictions verified
          </div>
        </div>

        {/* Primary Final CTA (Section 23) */}
        <button
          type="button"
          onClick={onNavigateStandings}
          className="mt-5 w-full py-3.5 rounded-xl bg-[#ff0046] text-white font-black text-sm uppercase tracking-wider shadow-lg hover:bg-[#e0003c] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>SEE LIVE TABLE IMPACT →</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
