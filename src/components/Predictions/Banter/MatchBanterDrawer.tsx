import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { shareService } from '../../../services/predictions/shareService';
import type { Match, ConsensusData, PredictionOption } from '../../../types/predictions';

interface MatchBanterDrawerProps {
  match: Match;
  consensus?: ConsensusData;
  userSelection: PredictionOption | null;
  onClose: () => void;
}

export const MatchBanterDrawer: React.FC<MatchBanterDrawerProps> = ({
  match,
  consensus,
  userSelection,
  onClose,
}) => {
  let backedText = 'Not predicted yet';
  let badgeColor = 'text-slate-400';
  if (userSelection === '1') {
    backedText = `${match.homeTeam.name} Win`;
    badgeColor = 'text-[#00b04f]';
  } else if (userSelection === 'X') {
    backedText = 'Draw';
    badgeColor = 'text-[#ff9800]';
  } else if (userSelection === '2') {
    backedText = `${match.awayTeam.name} Win`;
    badgeColor = 'text-[#ff0046]';
  }

  const votes = consensus ? shareService.voteSplit(consensus) : null;

  return (
    <div className="rounded-xl border border-[#ff0046]/40 bg-gradient-to-r from-[#140810] via-[#0e1c2b] to-[#0e1c2b] p-4 text-white shadow-md mb-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff0046] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-[#ff0046]">
            This game's talk
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All takes</span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center text-xs">
        {/* User Backing */}
        <div className="bg-[#081018] p-2.5 rounded-lg border border-[#16283d]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            You picked
          </span>
          <span className={`text-sm font-black ${badgeColor}`}>
            {backedText}
          </span>
        </div>

        {/* Community Consensus Breakdown */}
        {votes && (
          <div className="bg-[#081018] p-2.5 rounded-lg border border-[#16283d]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Votes now
            </span>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-[#00b04f]">{votes.homeVotes.toLocaleString()} Home</span>
              <span className="text-[#ff9800]">{votes.drawVotes.toLocaleString()} Draw</span>
              <span className="text-[#ff0046]">{votes.awayVotes.toLocaleString()} Away</span>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2.5 text-center text-xs text-slate-300">
        Reply under this game. Come back Saturday.
      </p>
    </div>
  );
};
