import React from 'react';
import { X, Check, Crown, MessageCircle } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';
import { slipTick } from '../../../lib/predictions/votingWindow';
import { shareService } from '../../../services/predictions/shareService';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface MyVotesModalProps {
  matches: Match[];
  userPredictions: Map<string, PredictionOption>;
  consensusMap?: Map<string, ConsensusData>;
  onClose: () => void;
  onSeeBanter?: () => void;
  onSharePicks?: () => void;
}

export const MyVotesModal: React.FC<MyVotesModalProps> = ({
  matches,
  userPredictions,
  consensusMap,
  onClose,
  onSeeBanter,
}) => {
  const votedMatches = matches.filter((m) => userPredictions.has(m.id));
  const totalMatches = matches.length;
  const slipDone = totalMatches > 0 && votedMatches.length >= totalMatches;

  const handleShare = () => {
    shareService.shareSlip({
      matches,
      userPredictions,
      consensusMap,
    });
  };

  const handleBanter = () => {
    if (onSeeBanter) {
      onSeeBanter();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-gradient-to-b from-[#0e1d2e] via-[#091420] to-[#07101a] p-4 sm:p-5 text-white tactical-modal-shadow overflow-hidden">
        {/* Ambient Lights */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#00b04f]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#ff0046]/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                MY SELECTIONS
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {votedMatches.length} / {totalMatches} Selected
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">Your slip</h1>
            <p className="text-[11px] text-slate-400">Share the first five. Your pick and the votes go with it.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Matches & Selected Ones */}
        <div className="flex-1 overflow-y-auto space-y-2 my-3 pr-1">
          {votedMatches.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-bold text-slate-300">No picks yet.</p>
              <p className="text-xs text-slate-500">Go back and tap who wins.</p>
            </div>
          ) : (
            votedMatches.map((m) => {
              const pick = userPredictions.get(m.id)!;
              const homeFormatted = formatTeamName(m.homeTeam.name);
              const awayFormatted = formatTeamName(m.awayTeam.name);

              const pickLabel =
                pick === '1'
                  ? `${homeFormatted} Win`
                  : pick === '2'
                  ? `${awayFormatted} Win`
                  : 'Draw';
              const tick = slipTick(m, pick);
              const tickLabel = tick === 'won' ? 'Won' : tick === 'lost' ? 'Lost' : tick === 'live' ? 'Live' : 'Waiting';

              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs border transition-colors ${
                    m.isDerby
                      ? 'border-amber-500/40 bg-gradient-to-r from-[#210915] via-[#101c2b] to-[#0c1622]'
                      : 'border-slate-800 bg-[#08121d]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white truncate text-xs">
                        {homeFormatted} vs {awayFormatted}
                      </span>
                      {m.isDerby && (
                        <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-500/40 flex items-center gap-0.5">
                          <Crown className="h-2.5 w-2.5" />
                          Derby
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className={`font-black text-[10px] uppercase ${tick === 'won' ? 'text-[#00b04f]' : 'text-white'}`}>
                      {tickLabel}
                    </span>
                    <span className="font-black text-xs text-[#ff0046] bg-[#ff0046]/10 border border-[#ff0046]/30 px-2.5 py-1 rounded-lg">
                      {pickLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Equal small buttons */}
        <div className="flex items-stretch gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleShare}
            disabled={votedMatches.length === 0}
            className="flex-1 min-h-[46px] px-2 rounded-xl bg-[#00b04f] hover:bg-[#009b45] disabled:opacity-40 text-white font-black text-[11px] sm:text-xs leading-tight text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#00b04f]/30"
          >
            <MessageCircle className="h-4 w-4 fill-white shrink-0" />
            <span>Share slip on WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={slipDone ? handleBanter : onClose}
            className="flex-1 min-h-[46px] px-2 rounded-xl bg-white text-[#081018] font-black text-[11px] sm:text-xs leading-tight text-center transition-all cursor-pointer hover:bg-slate-100"
          >
            {slipDone ? 'Join the talk' : 'Select other games'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-2.5 min-h-[46px] rounded-xl text-slate-500 hover:text-slate-300 text-[11px] font-bold cursor-pointer border border-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
