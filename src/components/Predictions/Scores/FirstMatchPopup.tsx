import React, { useState } from 'react';
import { X, Shield, Flame } from 'lucide-react';
import { VoteRangeBar } from './VoteRangeBar';
import { formatTeamName } from '../../../lib/predictions/utils';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface FirstMatchPopupProps {
  match: Match;
  consensus?: ConsensusData | null;
  existingPrediction?: PredictionOption | null;
  onSelectPrediction: (match: Match, option: PredictionOption) => void;
  onClose: () => void;
  onSeeBanter?: () => void;
}

export const FirstMatchPopup: React.FC<FirstMatchPopupProps> = ({
  match,
  consensus,
  onSelectPrediction,
  onClose,
}) => {
  // Always clean slate on preload - never preselect a team
  const [selectedOption, setSelectedOption] = useState<PredictionOption | null>(null);

  // Fallback consensus values if not ready
  const totalVotes = consensus?.totalVotes || 1240;
  const homePct = consensus?.homePct || 54;
  const drawPct = consensus?.drawPct || 22;
  const awayPct = consensus?.awayPct || 24;

  const homeVotes = Math.round((totalVotes * homePct) / 100);
  const drawVotes = Math.round((totalVotes * drawPct) / 100);
  const awayVotes = Math.round((totalVotes * awayPct) / 100);

  const homeDisplayName = formatTeamName(match.homeTeam.name);
  const awayDisplayName = formatTeamName(match.awayTeam.name);

  const handlePick = (option: PredictionOption) => {
    // No change of vote once casted
    if (selectedOption !== null) return;

    setSelectedOption(option);
    onSelectPrediction(match, option);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 glassmorphic-backdrop">
      <div className="relative w-full max-w-lg rounded-2xl glassmorphic-card p-4 sm:p-6 text-white tactical-modal-shadow max-h-[92vh] overflow-y-auto">
        {/* Glow Ambient Lights */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#ff0046]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#00b04f]/15 blur-3xl pointer-events-none" />

        {/* Close Button to directly retract */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Minimalist Top Badge */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff0046] to-[#ff9800] text-white shadow-sm">
            <Flame className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#ff0046] uppercase">
              {match.isDerby ? 'My Match' : 'First game'}
            </span>
          </div>
        </div>

        {/* Main Header Question */}
        <h1 className="text-base sm:text-xl font-black text-white tracking-tight leading-tight">
          Who do you think will win?
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {selectedOption ? 'Locked. Call your people next.' : 'Tap Home, Draw, or Away. It locks.'}
        </p>

        {/* Matchup Teams Display */}
        <div className="my-3 sm:my-4 rounded-xl bg-[#070e17]/80 border border-slate-800/90 p-3 sm:p-4">
          <div className="grid grid-cols-7 items-center text-center">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-slate-700/80 p-0.5 overflow-hidden shadow-md">
                {match.homeTeam.logoUrl ? (
                  <img
                    src={match.homeTeam.logoUrl}
                    alt={match.homeTeam.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <Shield className="h-full w-full text-slate-500" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {homeDisplayName}
              </span>
            </div>

            {/* VS */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-xs font-black text-[#ff0046] tracking-widest">VS</span>
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-slate-700/80 p-0.5 overflow-hidden shadow-md">
                {match.awayTeam.logoUrl ? (
                  <img
                    src={match.awayTeam.logoUrl}
                    alt={match.awayTeam.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <Shield className="h-full w-full text-slate-500" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {awayDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Buttons: Home, X, Away (clean slate, no team abbreviations, standard labels) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={selectedOption !== null}
            onClick={() => handlePick('1')}
            className={`tactile-button py-2.5 px-2 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              selectedOption === '1'
                ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-lg shadow-[#ff0046]/30 cursor-default'
                : selectedOption !== null
                ? 'bg-[#0d1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-[#122336] border-slate-700/80 text-slate-200 hover:bg-[#182f49] hover:border-slate-600 cursor-pointer'
            }`}
          >
            {selectedOption === '1' ? '✓ ' : ''}Home
          </button>

          <button
            type="button"
            disabled={selectedOption !== null}
            onClick={() => handlePick('X')}
            className={`tactile-button py-2.5 px-2 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              selectedOption === 'X'
                ? 'bg-[#ff9800] border-[#ff9800] text-black shadow-lg shadow-[#ff9800]/30 cursor-default'
                : selectedOption !== null
                ? 'bg-[#0d1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-[#122336] border-slate-700/80 text-slate-200 hover:bg-[#182f49] hover:border-slate-600 cursor-pointer'
            }`}
          >
            {selectedOption === 'X' ? '✓ ' : ''}Draw
          </button>

          <button
            type="button"
            disabled={selectedOption !== null}
            onClick={() => handlePick('2')}
            className={`tactile-button py-2.5 px-2 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              selectedOption === '2'
                ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-lg shadow-[#ff0046]/30 cursor-default'
                : selectedOption !== null
                ? 'bg-[#0d1722]/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-[#122336] border-slate-700/80 text-slate-200 hover:bg-[#182f49] hover:border-slate-600 cursor-pointer'
            }`}
          >
            {selectedOption === '2' ? '✓ ' : ''}Away
          </button>
        </div>

        {/* Continuous Vote Range Bar after selection (clean and uncluttered) */}
        {selectedOption && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <VoteRangeBar
              homePct={homePct}
              drawPct={drawPct}
              awayPct={awayPct}
              homeVotes={homeVotes}
              drawVotes={drawVotes}
              awayVotes={awayVotes}
              homeName={match.homeTeam.name}
              awayName={match.awayTeam.name}
              selectedOption={selectedOption}
              hideSelectedHeader={true}
            />
          </div>
        )}

      </div>
    </div>
  );
};
