import React, { useState } from 'react';
import { Shield, Clock, Users, Crown } from 'lucide-react';
import { formatKickoffTime, formatTeamName } from '../../../lib/predictions/utils';
import { dayLabel } from '../../../lib/predictions/weekendSlate';
import { showVotesForConsensus } from '../../../lib/predictions/voteDisplay.mjs';
import { CompactDirectBanner } from '../../ads/CompactDirectBanner';
import type { Match, PredictionOption, Team, ConsensusData } from '../../../types/predictions';

export const nameToSlug = (name: string): string =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface PredictionSlipFlowProps {
  teams?: Team[];
  queue: Match[];
  favouriteTeam?: string | null;
  userPredictions?: Map<string, PredictionOption>;
  consensusMap?: Map<string, ConsensusData>;
  pickedIds?: Set<string>;
  inspectedSquadIds?: Set<string>;
  onSelectTeam?: (teamName: string, team?: Team) => void;
  onPick: (match: Match, option: PredictionOption) => void;
  onOpenSquads?: (match: Match) => void;
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
  consensus,
  isSquadInspected,
  onOpenSquads,
  onPick,
}: {
  match: Match;
  userSelection?: PredictionOption | null;
  consensus?: ConsensusData;
  isSquadInspected?: boolean;
  onOpenSquads?: () => void;
  onPick: (option: PredictionOption) => void;
}) {
  const home = formatTeamName(match.homeTeam.name);
  const away = formatTeamName(match.awayTeam.name);
  const [showTooltip, setShowTooltip] = useState(false);

  const stats = showVotesForConsensus(consensus, match.id, userSelection || undefined);

  const handlePickAttempt = (option: PredictionOption) => {
    // Squad inspection gate: Derby match requires viewing squads first
    if (match.isDerby && !isSquadInspected) {
      setShowTooltip(true);
      return;
    }
    setShowTooltip(false);
    onPick(option);
  };

  const handleSquadsClick = () => {
    setShowTooltip(false);
    if (onOpenSquads) {
      onOpenSquads();
    }
  };

  return (
    <div
      className={`relative rounded-xl p-2.5 sm:p-3 font-sans transition-all max-w-full ${
        match.isDerby
          ? 'border-2 border-amber-400/90 bg-gradient-to-r from-[#201405] via-[#0e1c2b] to-[#0c1827] shadow-[0_0_25px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/40 hover:border-amber-300'
          : 'border border-[#1a2e45] bg-[#0e1c2b] shadow-md hover:border-[#2a4565]'
      }`}
      data-testid={`match-card-${match.id}`}
    >
      {/* Header: Day/Derby Badge, Squads Button, & Kickoff */}
      <div className={`flex items-center justify-between pb-1.5 text-[10px] sm:text-[11px] font-medium border-b ${
        match.isDerby ? 'border-amber-500/25 text-amber-200' : 'border-[#14263b] text-slate-400'
      }`}>
        <span className={`flex items-center gap-1.5 uppercase tracking-wider font-extrabold ${
          match.isDerby ? 'text-amber-300' : 'text-slate-300'
        }`}>
          {match.isDerby ? (
            <>
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest bg-gradient-to-r from-amber-300 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                DERBY MATCH
              </span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff0046]" />
              <span>{dayLabel(match)}</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          {/* Squads Button with Directional Tooltip */}
          <div className="relative">
            <button
              type="button"
              onClick={handleSquadsClick}
              data-testid={`squads-btn-${match.id}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                match.isDerby
                  ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-500/50'
                  : 'bg-[#14263b] hover:bg-[#1f3856] text-white border-[#223b56]'
              }`}
            >
              <Users className={`w-3 h-3 ${match.isDerby ? 'text-amber-400' : 'text-[#00b04f]'}`} />
              <span>Squads</span>
            </button>

            {/* Contextual Directional Tooltip pointing down at the squads button */}
            {showTooltip && (
              <div
                data-testid={`squad-tooltip-${match.id}`}
                className="absolute -top-11 right-0 z-50 flex flex-col items-end pointer-events-none animate-bounce"
                style={{ minWidth: '220px' }}
              >
                <div className="bg-[#0e1c2b] text-white border-2 border-[#00b04f] shadow-[0_4px_16px_rgba(0,176,79,0.5)] px-2.5 py-1 rounded-lg text-[11px] font-black tracking-tight whitespace-nowrap">
                  Don&apos;t guess. Look at the squads.
                </div>
                <div className="mr-4 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#00b04f]" />
              </div>
            )}
          </div>

          <span className="font-mono text-slate-300 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            {formatKickoffTime(match.scheduledTime)}
          </span>
        </div>
      </div>

      {/* Teams Display with Logos Linking to Team Profiles */}
      <div className="my-2 grid grid-cols-7 items-center gap-1.5 sm:gap-2">
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center text-center min-w-0">
          <a
            href={`#/team/${nameToSlug(match.homeTeam.name)}`}
            className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center text-center min-w-0"
            title={`View ${home} profile`}
          >
            <div className={`relative mb-1 h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border ${match.isDerby ? 'border-amber-400/80 bg-[#160d03]' : 'border-slate-700/60 bg-[#081018]'} p-0.5 shadow-sm`}>
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
            <span className={`text-[11px] sm:text-xs font-black tracking-tight text-white truncate max-w-[110px] sm:max-w-none leading-tight ${match.isDerby ? 'hover:text-amber-400' : 'hover:text-[#00b04f]'} transition-colors`} title={home}>
              {home}
            </span>
          </a>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Home
          </span>
        </div>

        {/* Center VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className={`text-[11px] font-black tracking-widest ${match.isDerby ? 'text-amber-400' : 'text-[#00b04f]'}`}>VS</span>
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex flex-col items-center text-center min-w-0">
          <a
            href={`#/team/${nameToSlug(match.awayTeam.name)}`}
            className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center text-center min-w-0"
            title={`View ${away} profile`}
          >
            <div className={`relative mb-1 h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border ${match.isDerby ? 'border-amber-400/80 bg-[#160d03]' : 'border-slate-700/60 bg-[#081018]'} p-0.5 shadow-sm`}>
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
            <span className={`text-[11px] sm:text-xs font-black tracking-tight text-white truncate max-w-[110px] sm:max-w-none leading-tight ${match.isDerby ? 'hover:text-amber-400' : 'hover:text-[#00b04f]'} transition-colors`} title={away}>
              {away}
            </span>
          </a>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Away
          </span>
        </div>
      </div>

      {/* 1 / X / 2 Betting Odds / Pick Buttons:
          When NOT selected: NO percentage or votes shown.
          When selected: votes and percentages are revealed! Solid green on selected. */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
        {PICKS.map((pick) => {
          const isSelected = userSelection === pick.id;
          const hasVoted = Boolean(userSelection);
          const pct = pick.id === '1' ? stats.homePct : pick.id === 'X' ? stats.drawPct : stats.awayPct;
          return (
            <button
              key={pick.id}
              type="button"
              onClick={() => handlePickAttempt(pick.id)}
              data-testid={`pick-${pick.id}-${match.id}`}
              className={`flex min-h-[38px] sm:min-h-[42px] min-w-0 flex-col items-center justify-center rounded-lg border py-1 px-1 text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#00b04f] border-[#00b04f] text-white shadow-[0_0_12px_rgba(0,176,79,0.35)] ring-2 ring-[#00b04f]/40'
                  : match.isDerby
                  ? 'bg-[#121820] border-amber-500/30 text-slate-200 hover:border-amber-400 hover:bg-[#192330]'
                  : 'bg-[#0a1624] border-slate-700/80 text-slate-200 hover:border-[#00b04f]/60 hover:bg-[#122236]'
              }`}
            >
              <span className="text-xs sm:text-sm font-black leading-tight flex items-center gap-1">
                {pick.id}
                {isSelected && <span className="text-[10px]">✓</span>}
                {hasVoted && (
                  <span className={`text-[10px] font-mono font-normal ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                    • {pct}%
                  </span>
                )}
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
  onOpenSquads,
  isSquadInspected,
  consensus,
}: {
  match: Match;
  onPick: (option: PredictionOption) => void;
  onOpenSquads?: () => void;
  isSquadInspected?: boolean;
  consensus?: ConsensusData;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-36 z-30 flex items-start justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <MatchPickCard
          match={{ ...match, isDerby: true }}
          onPick={onPick}
          onOpenSquads={onOpenSquads}
          isSquadInspected={isSquadInspected}
          consensus={consensus}
        />
      </div>
    </div>
  );
}

export const PredictionSlipFlow: React.FC<PredictionSlipFlowProps> = ({
  queue,
  userPredictions,
  consensusMap,
  inspectedSquadIds = new Set(),
  onPick,
  onOpenSquads,
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
      {queue.map((match, idx) => (
        <React.Fragment key={match.id}>
          <MatchPickCard
            match={match}
            userSelection={userPredictions?.get(match.id) ?? null}
            consensus={consensusMap?.get(match.id)}
            isSquadInspected={inspectedSquadIds.has(match.id)}
            onOpenSquads={onOpenSquads ? () => onOpenSquads(match) : undefined}
            onPick={(option) => onPick(match, option)}
          />
          {/* Advert below the Derby game (derby is always first at index 0) */}
          {idx === 0 && match.isDerby && (
            <CompactDirectBanner
              variant="amber"
              label="Campus Derby Match"
              tagline="Claim 100% Free Bet & Live Odds"
              className="my-1.5"
            />
          )}
          {/* Advert after three games (index 3) */}
          {idx === 3 && (
            <CompactDirectBanner
              variant="emerald"
              label="Match Multiplier Bonus"
              tagline="Predict and win verified payouts"
              className="my-1.5"
            />
          )}
        </React.Fragment>
      ))}

      {/* Kept at the bottom */}
      <div className="pt-2">
        <CompactDirectBanner
          variant="purple"
          label="Verified Slip Bonus"
          tagline="Lock Your Prediction on External Sportsbook"
          className="my-1.5"
        />
      </div>
    </div>
  );
};
