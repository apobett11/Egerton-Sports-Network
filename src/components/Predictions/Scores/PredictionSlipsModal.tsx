import React, { useState } from 'react';
import { X, List, MessageCircle } from 'lucide-react';
import { MatchdayPair, type MatchdayPairDay } from '../Layout/MatchdayPair';
import { formatTeamName } from '../../../lib/predictions/utils';
import { slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { shareService } from '../../../services/predictions/shareService';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface PredictionSlipsModalProps {
  days: MatchdayPairDay[];
  initialMatchday: number;
  fixtures: Match[];
  userPredictions: Map<string, PredictionOption>;
  consensusMap?: Map<string, ConsensusData>;
  onClose: () => void;
  onPickMatchday: (matchday: number, dayKey?: string) => void;
}

export const PredictionSlipsModal: React.FC<PredictionSlipsModalProps> = ({
  days,
  initialMatchday,
  fixtures,
  userPredictions,
  consensusMap,
  onClose,
  onPickMatchday,
}) => {
  const [slipKey, setSlipKey] = useState(() => {
    const found = days.find((day) => day.matchday === initialMatchday);
    return found?.dayKey ?? String(found?.matchday ?? days[0]?.matchday ?? initialMatchday);
  });
  const selected = days.find((day) => (day.dayKey ?? String(day.matchday)) === slipKey) ?? days[0];
  const slipDay = selected?.matchday ?? initialMatchday;

  const matches = selected?.dayKey
    ? fixtures.filter((match) => matchDayKey(match) === selected.dayKey)
    : fixtures.filter((match) => match.matchday === slipDay);
  const voted = matches.filter((match) => userPredictions.has(match.id));
  const slipDone = matches.length > 0 && voted.length >= matches.length;

  const handleShare = () => {
    shareService.shareSlip({
      matches,
      userPredictions,
      consensusMap,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2e45]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#14263b]">
              <List className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-wider">My slips</h2>
              <p className="text-[11px] text-slate-400 truncate">Switch the two matchdays. Each slip stays with its week.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer"
            aria-label="Close my slips"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <MatchdayPair
            days={days}
            activeMatchday={slipDay}
            activeDayKey={selected?.dayKey}
            onSelect={(day, dayKey) => setSlipKey(dayKey ?? String(day))}
          />
          <p className="mt-2 text-[11px] font-bold text-slate-400">
            {voted.length} of {matches.length} picked on matchday {slipDay}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm font-bold text-slate-300">No games listed for this matchday.</p>
          ) : voted.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-black text-white">This slip is empty.</p>
              <p className="text-xs text-slate-400">Pick who wins, then come back here to check both weeks.</p>
            </div>
          ) : (
            voted.map((match) => {
              const pick = userPredictions.get(match.id)!;
              const home = formatTeamName(match.homeTeam.name);
              const away = formatTeamName(match.awayTeam.name);
              const pickLabel = pick === '1' ? `${home} win` : pick === '2' ? `${away} win` : 'Draw';
              const tick = slipTick(match, pick);
              const tickLabel = tick === 'won' ? 'Won' : tick === 'lost' ? 'Lost' : tick === 'live' ? 'Live' : 'Waiting';
              return (
                <div key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2e45] bg-[#0b1624] px-3 py-2.5">
                  <span className="min-w-0 truncate text-xs font-bold text-white">{home} vs {away}</span>
                  <span className="shrink-0 flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase ${tick === 'won' ? 'text-[#00b04f]' : 'text-white'}`}>{tickLabel}</span>
                    <span className="rounded-full bg-[#ff0046] px-2 py-0.5 text-[10px] font-black text-white">{pickLabel}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-stretch gap-2 border-t border-[#1a2e45] px-4 py-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={voted.length === 0}
            className="flex-1 min-h-[44px] rounded-full bg-[#14263b] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            Share this slip
          </button>
          <button
            type="button"
            onClick={() => onPickMatchday(slipDay, selected?.dayKey)}
            className="flex-1 min-h-[44px] rounded-full bg-[#ff0046] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            {slipDone ? 'Back to games' : 'Pick these games'}
          </button>
        </div>
      </div>
    </div>
  );
};
