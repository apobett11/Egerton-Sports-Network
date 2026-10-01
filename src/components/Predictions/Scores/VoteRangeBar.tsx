import React from 'react';
import type { PredictionOption } from '../../../types/predictions';
import { Check } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';

interface VoteRangeBarProps {
  homePct: number;
  drawPct: number;
  awayPct: number;
  homeVotes: number;
  drawVotes: number;
  awayVotes: number;
  homeName?: string;
  awayName?: string;
  selectedOption?: PredictionOption | null;
  hideVoteNumbers?: boolean;
  hideSelectedHeader?: boolean;
}

export const VoteRangeBar: React.FC<VoteRangeBarProps> = ({
  homePct,
  drawPct,
  awayPct,
  homeVotes,
  drawVotes,
  awayVotes,
  homeName = 'Home',
  awayName = 'Away',
  selectedOption = null,
  hideVoteNumbers = false,
  hideSelectedHeader = false,
}) => {
  const isSelected = selectedOption !== null;

  const formattedHome = formatTeamName(homeName);
  const formattedAway = formatTeamName(awayName);

  // Selected team name resolution
  const selectedLabel =
    selectedOption === '1'
      ? `${formattedHome} (Home)`
      : selectedOption === '2'
      ? `${formattedAway} (Away)`
      : selectedOption === 'X'
      ? 'Draw'
      : null;

  const selectedVotes =
    selectedOption === '1'
      ? homeVotes
      : selectedOption === 'X'
      ? drawVotes
      : awayVotes;

  // Colors: Selected range in color, others in gray-ish
  const homeColor =
    selectedOption === '1'
      ? 'bg-[#00b04f] text-white shadow-md font-black z-10'
      : isSelected
      ? 'bg-slate-800/90 text-slate-400'
      : 'bg-[#00b04f]/80 text-white';

  const drawColor =
    selectedOption === 'X'
      ? 'bg-[#ff9800] text-black shadow-md font-black z-10'
      : isSelected
      ? 'bg-slate-700/80 text-slate-400'
      : 'bg-[#ff9800]/80 text-black';

  const awayColor =
    selectedOption === '2'
      ? 'bg-[#ff0046] text-white shadow-md font-black z-10'
      : isSelected
      ? 'bg-slate-800/90 text-slate-400'
      : 'bg-[#ff0046]/80 text-white';

  return (
    <div className="w-full space-y-1">
      {/* Selected Team Label Header */}
      {!hideSelectedHeader && selectedLabel && (
        <div className="flex items-center justify-between text-[11px] px-0.5">
          <span className="text-slate-300 flex items-center gap-1 font-semibold truncate max-w-[70%]">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>You picked</span>
            <strong className="text-white font-black truncate">{selectedLabel}</strong>
          </span>
          <span className="text-slate-400 font-mono text-[10px] shrink-0">
            {selectedVotes.toLocaleString()} fan votes
          </span>
        </div>
      )}

      {/* The Single Range Bar that runs across: Home | X | Away */}
      <div className="h-10 w-full rounded-lg bg-[#060d16] p-0.5 flex overflow-hidden border border-slate-800/90 shadow-inner">
        <div
          style={{ width: `${Math.max(homePct, 22)}%` }}
          className={`h-full rounded-l-md flex flex-col items-center justify-center px-1 text-center leading-none min-w-0 ${homeColor}`}
          title={`Home: ${homeVotes.toLocaleString()} fan votes`}
        >
          <span className="truncate max-w-full text-[11px] sm:text-xs font-black">{homeVotes.toLocaleString()}</span>
          <span className="truncate max-w-full text-[8px] sm:text-[10px] font-bold opacity-90">fan votes</span>
        </div>

        <div
          style={{ width: `${Math.max(drawPct, 18)}%` }}
          className={`h-full flex flex-col items-center justify-center px-1 text-center leading-none border-x border-slate-900/40 min-w-0 ${drawColor}`}
          title={`Draw: ${drawVotes.toLocaleString()} fan votes`}
        >
          <span className="truncate max-w-full text-[11px] sm:text-xs font-black">{drawVotes.toLocaleString()}</span>
          <span className="truncate max-w-full text-[8px] sm:text-[10px] font-bold opacity-90">fan votes</span>
        </div>

        <div
          style={{ width: `${Math.max(awayPct, 22)}%` }}
          className={`h-full rounded-r-md flex flex-col items-center justify-center px-1 text-center leading-none min-w-0 ${awayColor}`}
          title={`Away: ${awayVotes.toLocaleString()} fan votes`}
        >
          <span className="truncate max-w-full text-[11px] sm:text-xs font-black">{awayVotes.toLocaleString()}</span>
          <span className="truncate max-w-full text-[8px] sm:text-[10px] font-bold opacity-90">fan votes</span>
        </div>
      </div>
    </div>
  );
};
