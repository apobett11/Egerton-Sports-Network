import React, { useState } from 'react';
import { X, Crown, Shield, Swords, MessageCircle } from 'lucide-react';
import { VoteRangeBar } from './VoteRangeBar';
import { shareService } from '../../../services/predictions/shareService';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface DerbyUltimatePopupProps {
  match: Match;
  selection: PredictionOption;
  consensus?: ConsensusData | null;
  matches?: Match[];
  userPredictions?: Map<string, PredictionOption>;
  consensusMap?: Map<string, ConsensusData>;
  onClose: () => void;
  onContinueSelecting?: () => void;
  onSeeBanter?: () => void;
}

export const DerbyUltimatePopup: React.FC<DerbyUltimatePopupProps> = ({
  match,
  selection,
  consensus,
  matches = [],
  userPredictions,
  consensusMap,
  onClose,
  onContinueSelecting,
  onSeeBanter,
}) => {
  const [didShare, setDidShare] = useState(false);

  const homeDisplayName = formatTeamName(match.homeTeam.name);
  const awayDisplayName = formatTeamName(match.awayTeam.name);

  const selectedTeamName =
    selection === '1'
      ? homeDisplayName
      : selection === '2'
      ? awayDisplayName
      : 'Draw';

  const totalVotes = consensus?.totalVotes || 1680;
  const homePct = consensus?.homePct || 58;
  const drawPct = consensus?.drawPct || 18;
  const awayPct = consensus?.awayPct || 24;

  const homeVotes = Math.round((totalVotes * homePct) / 100);
  const drawVotes = Math.round((totalVotes * drawPct) / 100);
  const awayVotes = Math.round((totalVotes * awayPct) / 100);

  const selectedVotes = selection === '1' ? homeVotes : selection === 'X' ? drawVotes : awayVotes;
  const holding = selectedVotes >= Math.max(homeVotes, drawVotes, awayVotes);
  const callLine = selection === 'X'
    ? (holding
      ? 'Call other fans to vote draw with you to keep this.'
      : 'Call other fans to vote draw with you to secure this.')
    : (holding
      ? 'Call other fans to vote for your team to keep this win.'
      : 'Call other fans to vote for your team to secure this win.');
  const stakeLine = holding
    ? 'Stay quiet and this lead will not hold till Saturday.'
    : 'Without them, this will not stay yours.';

  const handleWhatsAppShare = () => {
    shareService.shareDerby({
      derby: match,
      selection,
      consensus,
      matches,
      userPredictions: userPredictions || new Map([[match.id, selection]]),
      consensusMap,
    }).then((sent) => {
      if (sent) setDidShare(true);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glassmorphic-backdrop">
      <div className="relative w-full max-w-lg rounded-2xl glassmorphic-derby p-5 sm:p-6 text-white tactical-modal-shadow max-h-[92vh] overflow-y-auto">
        {/* Ambient Lights */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#ff0046]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#ff9800]/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ========================================================================= */}
        {/* 1. TOP: THE MATCH & THE SELECTED OPTION                                   */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          {/* Header Title with Prestige Badge */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff0046] via-[#ff4136] to-[#ff9800] text-white shadow-lg shadow-[#ff0046]/35">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-[#ff0046] uppercase">
                  My Match
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatKickoffTime(match.scheduledTime)} • {match.venue}
              </span>
            </div>
          </div>

          {/* Combined Card: Teams Matchup & Selection Ranges in the Same Card */}
          <div className="rounded-xl bg-[#070e17]/90 border border-slate-800 p-3.5 sm:p-4 space-y-3 shadow-md">
            {/* Teams Matchup */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-800 border-2 border-amber-500/40 p-0.5 overflow-hidden shadow shrink-0">
                  {match.homeTeam.logoUrl ? (
                    <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <Shield className="h-full w-full text-slate-500" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-black text-white truncate">{homeDisplayName}</span>
              </div>

              <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-black/40 border border-amber-500/30 shrink-0 mx-2">
                VS
              </span>

              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 justify-end">
                <span className="text-xs sm:text-sm font-black text-white truncate text-right">{awayDisplayName}</span>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-800 border-2 border-amber-500/40 p-0.5 overflow-hidden shadow shrink-0">
                  {match.awayTeam.logoUrl ? (
                    <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <Shield className="h-full w-full text-slate-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Selection Ranges in the Same Card */}
            <div className="pt-2.5 border-t border-slate-800/80">
              <VoteRangeBar
                homePct={homePct}
                drawPct={drawPct}
                awayPct={awayPct}
                homeVotes={homeVotes}
                drawVotes={drawVotes}
                awayVotes={awayVotes}
                homeName={homeDisplayName}
                awayName={awayDisplayName}
                selectedOption={selection}
                hideSelectedHeader={true}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CARD THAT ACTUALLY ENCOURAGES THE USER TO SHARE                        */}
        {/* ========================================================================= */}
        <div className="mt-3 rounded-xl border border-white/15 bg-gradient-to-b from-[#122336] to-[#081320] p-3.5 text-xs space-y-2 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
            <Swords className="h-4 w-4 text-[#ff0046] shrink-0" />
            <span>You picked {selectedTeamName}</span>
          </div>
          <p className="text-sm font-black text-white leading-snug">{callLine}</p>
          <p className="text-xs text-slate-300 leading-snug">{stakeLine}</p>

          <div className="pt-1 flex items-stretch gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 min-h-[46px] px-2 rounded-xl bg-[#00b04f] hover:bg-[#009b45] text-white font-black text-[11px] sm:text-xs leading-tight text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#00b04f]/30 active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4 fill-white shrink-0" />
              <span>{didShare ? 'Sent. Share again' : 'Share on WhatsApp'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onContinueSelecting) onContinueSelecting();
                else onClose();
              }}
              className="flex-1 min-h-[46px] px-2 rounded-xl bg-white text-[#081018] font-black text-[11px] sm:text-xs leading-tight text-center transition-all cursor-pointer hover:bg-slate-100 active:scale-[0.98] shadow-md"
            >
              Select other games
            </button>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-2.5 min-h-[46px] rounded-xl text-slate-500 hover:text-slate-300 text-[11px] font-bold cursor-pointer border border-slate-800 bg-transparent"
            >
              Cancel
            </button>
          </div>

          {onSeeBanter && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSeeBanter();
                }}
                className="text-[11px] text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                Or join the talk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
