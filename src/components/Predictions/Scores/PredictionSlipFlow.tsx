import React from 'react';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import { dayLabel, matchDayKey } from '../../../lib/predictions/weekendSlate';
import type { Match, PredictionOption, Team } from '../../../types/predictions';

interface PredictionSlipFlowProps {
  teams: Team[];
  queue: Match[];
  favouriteTeam: string | null;
  pickedIds: Set<string>;
  onSelectTeam: (teamName: string) => void;
  onPick: (match: Match, option: PredictionOption) => void;
}

const PICKS: { id: PredictionOption; label: string }[] = [
  { id: '1', label: 'Home' },
  { id: 'X', label: 'Draw' },
  { id: '2', label: 'Away' },
];

function MatchPickCard({
  match,
  onPick,
}: {
  match: Match;
  onPick: (option: PredictionOption) => void;
}) {
  const home = formatTeamName(match.homeTeam.name);
  const away = formatTeamName(match.awayTeam.name);
  return (
    <div className="rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] px-3 py-3">
      <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#ff0046]">
        {match.isDerby ? 'Your derby' : dayLabel(match)}
      </p>
      <p className="mt-1 text-center text-sm font-black text-white">
        {home} <span className="text-slate-500">vs</span> {away}
      </p>
        <p className="mt-0.5 text-center text-[11px] font-bold text-slate-400">
        {formatKickoffTime(match.scheduledTime)}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PICKS.map((pick) => (
          <button
            key={pick.id}
            type="button"
            onClick={() => onPick(pick.id)}
            className="rounded-xl border border-slate-700 bg-[#0a1624] py-3 text-sm font-black text-white cursor-pointer hover:border-[#ff0046] hover:bg-[#ff0046]/15"
          >
            <span className="block text-base">{pick.id}</span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {pick.id === '1' ? home : pick.id === '2' ? away : pick.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const PredictionSlipFlow: React.FC<PredictionSlipFlowProps> = ({
  teams,
  queue,
  favouriteTeam,
  pickedIds,
  onSelectTeam,
  onPick,
}) => {
  const remaining = queue.filter((match) => !pickedIds.has(match.id));
  const current = remaining[0] ?? null;
  const ahead = remaining.slice(1, 3);
  const rows = Math.max(1, Math.ceil(teams.length / 4));

  if (!favouriteTeam) {
    return (
      <div className="epl-slip-stage flex flex-col overflow-hidden">
        <h1 className="shrink-0 px-1 pt-1 text-center text-sm font-black leading-tight text-white sm:text-base">
          Which EPL team are you a hardcore fan of?
        </h1>
        <div
          className="mt-2 grid min-h-0 flex-1 gap-1 overflow-hidden"
          style={{
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {teams.map((team) => (
            <button
              key={team.id || team.name}
              type="button"
              onClick={() => onSelectTeam(team.name)}
              className="flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-slate-700/80 bg-[#0a1624] px-1 py-1 text-center cursor-pointer hover:border-[#ff0046]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 sm:h-7 sm:w-7">
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] font-black text-slate-300">{team.shortName?.slice(0, 3)}</span>
                )}
              </span>
              <span className="mt-0.5 w-full truncate text-[10px] font-black leading-tight text-white sm:text-[11px]">
                {formatTeamName(team.name)}
              </span>
            </button>
          ))}
        </div>
        {queue.length > 0 && (
          <div className="slip-preload" aria-hidden inert>
            {queue.slice(0, 3).map((match) => (
              <MatchPickCard key={match.id} match={match} onPick={() => {}} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] px-4 py-6 text-center">
        <p className="text-sm font-black text-white">This weekend&apos;s matchdays have begun.</p>
        <p className="mt-1 text-xs text-slate-400">Picks close when Saturday or Sunday kicks off.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div key={current.id} className="slip-card-in">
        <MatchPickCard
          match={current}
          onPick={(option) => onPick(current, option)}
        />
      </div>
      <div className="slip-preload" aria-hidden inert>
        {ahead.map((match) => (
          <MatchPickCard key={`${matchDayKey(match)}-${match.id}`} match={match} onPick={() => {}} />
        ))}
      </div>
    </div>
  );
};
