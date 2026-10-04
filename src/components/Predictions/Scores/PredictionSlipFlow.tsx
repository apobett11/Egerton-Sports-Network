import React from 'react';
import { Shield, Clock } from 'lucide-react';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import { dayLabel } from '../../../lib/predictions/weekendSlate';
import type { Match, PredictionOption, Team } from '../../../types/predictions';

interface PredictionSlipFlowProps {
  teams?: Team[];
  queue: Match[];
  favouriteTeam?: string | null;
  userPredictions?: Map<string, PredictionOption>;
  pickedIds?: Set<string>;
  onSelectTeam?: (teamName: string, team?: Team) => void;
  onPick: (match: Match, option: PredictionOption) => void;
}

type PickChoice = { id: PredictionOption; label: string };

const PICKS: PickChoice[] = [
  { id: '1', label: 'Home' },
  { id: 'X', label: 'Draw' },
  { id: '2', label: 'Away' },
];

export function MatchPickCard({
  match,
  userSelection,
  onPick,
}: {
  match: Match;
  userSelection?: PredictionOption | null;
  onPick: (option: PredictionOption) => void;
}) {
  const home = formatTeamName(match.homeTeam.name);
  const away = formatTeamName(match.awayTeam.name);

  return (
    <div
      className="rounded-xl border border-[#1a2e45] bg-[#0e1c2b] p-2.5 sm:p-3 font-sans shadow-md transition-all hover:border-[#2a4565] max-w-full"
      data-testid={`match-card-${match.id}`}
    >
      {/* Header: Day/Derby Badge & Kickoff */}
      <div className="flex items-center justify-between border-b border-[#14263b] pb-1.5 text-[10px] sm:text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff0046]" />
          {match.isDerby ? 'DERBY MATCH' : dayLabel(match)}
        </span>
        <span className="font-mono text-slate-300 flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          {formatKickoffTime(match.scheduledTime)}
        </span>
      </div>

      {/* Teams Display with Logos and Names */}
      <div className="my-2 grid grid-cols-7 items-center gap-1.5 sm:gap-2">
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center text-center min-w-0">
          <div className="relative mb-1 h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border border-slate-700/60 bg-[#081018] p-0.5 shadow-sm">
            {match.homeTeam.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                alt={home}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-black tracking-tight text-white truncate max-w-[110px] sm:max-w-none leading-tight" title={home}>
            {home}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Home
          </span>
        </div>

        {/* Center VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className="text-[11px] font-black tracking-widest text-[#ff0046]">VS</span>
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex flex-col items-center text-center min-w-0">
          <div className="relative mb-1 h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border border-slate-700/60 bg-[#081018] p-0.5 shadow-sm">
            {match.awayTeam.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                alt={away}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-black tracking-tight text-white truncate max-w-[110px] sm:max-w-none leading-tight" title={away}>
            {away}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Away
          </span>
        </div>
      </div>

      {/* 1 / X / 2 Betting Odds / Pick Buttons */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
        {PICKS.map((pick) => {
          const isSelected = userSelection === pick.id;
          return (
            <button
              key={pick.id}
              type="button"
              onClick={() => onPick(pick.id)}
              data-testid={`pick-${pick.id}-${match.id}`}
              className={`flex min-h-[38px] sm:min-h-[42px] min-w-0 flex-col items-center justify-center rounded-lg border py-1 px-1 text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-[0_0_12px_rgba(255,0,70,0.35)] ring-2 ring-[#ff0046]/40'
                  : 'bg-[#0a1624] border-slate-700/80 text-slate-200 hover:border-[#ff0046]/60 hover:bg-[#122236]'
              }`}
            >
              <span className="text-xs sm:text-sm font-black leading-tight flex items-center gap-1">
                {pick.id}
                {isSelected && <span className="text-[9px]">✓</span>}
              </span>
              <span className={`text-[9px] uppercase font-semibold tracking-wider ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                {pick.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DerbyPickPopup({
  match,
  onPick,
}: {
  match: Match;
  onPick: (option: PredictionOption) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-36 z-30 flex items-start justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <MatchPickCard match={{ ...match, isDerby: true }} onPick={onPick} />
      </div>
    </div>
  );
}

export const PredictionSlipFlow: React.FC<PredictionSlipFlowProps> = ({
  queue,
  userPredictions,
  onPick,
}) => {
  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] px-4 py-6 text-center">
        <p className="text-sm font-black text-white">This weekend&apos;s matchdays have begun.</p>
        <p className="mt-1 text-xs text-slate-400">Picks close when Saturday or Sunday kicks off.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="match-cards-container">
      {queue.map((match) => (
        <MatchPickCard
          key={match.id}
          match={match}
          userSelection={userPredictions?.get(match.id) ?? null}
          onPick={(option) => onPick(match, option)}
        />
      ))}
    </div>
  );
};
