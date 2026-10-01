import React, { useState } from 'react';
import { Shield } from 'lucide-react';
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

type PickChoice = { id: PredictionOption; label: string; logo?: string | null };

const PICKS: PickChoice[] = [
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
  const derbyPicks: PickChoice[] = [
    { id: '1', label: home, logo: match.homeTeam.logoUrl },
    { id: '2', label: away, logo: match.awayTeam.logoUrl },
  ];
  const choices = match.isDerby ? derbyPicks : PICKS;

  return (
    <div className="rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] px-3 py-3 font-sans">
      <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#ff0046]">
        {match.isDerby ? 'Your derby' : dayLabel(match)}
      </p>
      <h2 className="mt-1 text-center text-base font-semibold text-white">
        {match.isDerby ? 'As a fanatic, which team do you think will win?' : `${home} vs ${away}`}
      </h2>
      <p className="mt-0.5 text-center text-[11px] font-medium text-slate-400">
        {formatKickoffTime(match.scheduledTime)}
      </p>
      <div className={`mt-3 grid gap-2 ${match.isDerby ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {choices.map((pick) => (
          <button
            key={pick.id}
            type="button"
            onClick={() => onPick(pick.id)}
            className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-[#0a1624] px-2 py-3 text-sm font-semibold text-white cursor-pointer hover:border-[#ff0046] hover:bg-[#ff0046]/15"
          >
            {match.isDerby && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-600 bg-slate-800">
                {pick.logo ? (
                  <img src={pick.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Shield className="h-5 w-5 text-slate-400" />
                )}
              </span>
            )}
            <span className="min-w-0">
              {!match.isDerby && <span className="block text-base">{pick.id}</span>}
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                {pick.id === '1' ? home : pick.id === '2' ? away : pick.label}
              </span>
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
  const [fanaticAnswered, setFanaticAnswered] = useState(false);
  const remaining = queue.filter((match) => !pickedIds.has(match.id));
  const current = remaining[0] ?? null;
  const ahead = remaining.slice(1, 3);
  const rows = Math.max(1, Math.ceil(teams.length / 4));

  if (!favouriteTeam) {
    if (!fanaticAnswered) {
      return (
        <div className="epl-slip-stage flex items-center justify-center overflow-hidden">
          <section className="slip-card-in w-full max-w-md rounded-3xl border border-[#29435d] bg-[#0e1c2b] px-5 py-6 text-center shadow-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff0046]">EPL predictions</p>
            <h1 className="mt-2 text-xl font-semibold text-white">Are you a football fanatic?</h1>
            <p className="mt-1 text-sm font-normal text-slate-400">
              Either answer takes you straight to your club and this weekend&apos;s picks.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFanaticAnswered(true)}
                className="rounded-2xl border border-[#ff0046]/70 bg-[#ff0046]/15 px-4 py-3 text-sm font-semibold text-white cursor-pointer hover:bg-[#ff0046]/25"
              >
                Yes, I am
              </button>
              <button
                type="button"
                onClick={() => setFanaticAnswered(true)}
                className="rounded-2xl border border-slate-600 bg-[#0a1624] px-4 py-3 text-sm font-medium text-slate-200 cursor-pointer hover:border-slate-400"
              >
                Not really
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="epl-slip-stage flex flex-col overflow-hidden">
        <h1 className="shrink-0 px-1 pt-1 text-center text-sm font-semibold leading-tight text-white sm:text-base">
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
