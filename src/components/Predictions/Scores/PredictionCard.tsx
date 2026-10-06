import React from 'react';
import { Clock, MessageSquare, Lock, CheckCircle2, Shield } from 'lucide-react';
import { formatKickoffTime, calculateCountdown } from '../../../lib/predictions/utils';
import { showVotesForConsensus } from '../../../lib/predictions/voteDisplay.mjs';
import type { Match, PredictionOption, ConsensusData } from '../../../types/predictions';

interface PredictionCardProps {
  match: Match;
  userSelection: PredictionOption | null;
  consensus?: ConsensusData;
  onSelectOption: (option: PredictionOption) => void;
  onOpenMatchBanter: (match: Match) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  match,
  userSelection,
  consensus,
  onSelectOption,
  onOpenMatchBanter,
}) => {
  const [countdown, setCountdown] = React.useState(() => calculateCountdown(match.scheduledTime));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(match.scheduledTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [match.scheduledTime]);

  const isLocked = countdown.isLocked || match.status === 'LIVE' || match.status === 'FT';
  const showVotes = showVotesForConsensus(consensus, match.id, userSelection);

  return (
    <div className="relative rounded-xl border border-[#1a2e45] bg-[#0e1c2b] p-4 tactical-card-shadow transition-all hover:border-slate-600/60">
      {/* Header Info: Venue & Countdown */}
      <div className="flex items-center justify-between border-b border-[#16283d] pb-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff0046]" />
          <span className="truncate">{match.venue}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
          <Clock className="h-3 w-3 text-slate-400" />
          {isLocked ? (
            <span className="text-[#ff0046] flex items-center gap-1">
              <Lock className="h-3 w-3" /> LOCKED
            </span>
          ) : (
            <span className="text-[#00b04f]">LOCKS IN {countdown.formatted}</span>
          )}
        </div>
      </div>

      {/* Teams Display */}
      <div className="my-4 grid grid-cols-7 items-center">
        {/* Home Team */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-slate-700/60 bg-[#081018] p-1 shadow-md">
            {match.homeTeam.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                alt={match.homeTeam.name}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm font-black tracking-tight text-white leading-tight">
            {match.homeTeam.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Home
          </span>
        </div>

        {/* VS / Kickoff Time */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className="text-xs font-black tracking-widest text-slate-500">VS</span>
          <span className="text-[10px] font-bold text-slate-400 mt-1">
            {formatKickoffTime(match.scheduledTime)}
          </span>
        </div>

        {/* Away Team */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-slate-700/60 bg-[#081018] p-1 shadow-md">
            {match.awayTeam.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                alt={match.awayTeam.name}
                className="h-full w-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <Shield className="h-full w-full text-slate-500" />
            )}
          </div>
          <span className="text-sm font-black tracking-tight text-white leading-tight">
            {match.awayTeam.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Away
          </span>
        </div>
      </div>

      {/* 1 / X / 2 Prediction Buttons */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {/* HOME (1) */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectOption('1')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-2 transition-all cursor-pointer border ${
            userSelection === '1'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md ring-2 ring-[#ff0046]/40'
              : 'bg-[#14263b]/70 border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
            1 <span className="font-normal text-[10px] opacity-80">({match.homeTeam.shortName})</span>
          </span>
          {userSelection === '1' && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Picked
            </span>
          )}
        </button>

        {/* DRAW (X) */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectOption('X')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-2 transition-all cursor-pointer border ${
            userSelection === 'X'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md ring-2 ring-[#ff0046]/40'
              : 'bg-[#14263b]/70 border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
            X <span className="font-normal text-[10px] opacity-80">(Draw)</span>
          </span>
          {userSelection === 'X' && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Picked
            </span>
          )}
        </button>

        {/* AWAY (2) */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectOption('2')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-2 transition-all cursor-pointer border ${
            userSelection === '2'
              ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md ring-2 ring-[#ff0046]/40'
              : 'bg-[#14263b]/70 border-slate-700/60 text-slate-200 hover:bg-[#1a334f]'
          } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
            2 <span className="font-normal text-[10px] opacity-80">({match.awayTeam.shortName})</span>
          </span>
          {userSelection === '2' && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-white mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Picked
            </span>
          )}
        </button>
      </div>

      {/* Crowd Consensus Reveal (Section 10) */}
      {consensus && (
        <div className="mt-3 rounded-lg bg-[#081018] p-2.5 border border-[#16283d]">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            <span className="text-slate-300">Fan Consensus</span>
            <span className="text-slate-400 font-normal">{showVotes.total.toLocaleString()} fan predictions</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="flex flex-col">
              <span className={userSelection === '1' ? 'text-[#00b04f]' : 'text-slate-300'}>
                {showVotes.homeVotes.toLocaleString()} votes
              </span>
              <div className="w-full bg-[#16283d] h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-[#00b04f] h-full rounded-full" style={{ width: `${showVotes.homePct}%` }} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className={userSelection === 'X' ? 'text-[#ff9800]' : 'text-slate-300'}>
                {showVotes.drawVotes.toLocaleString()} votes
              </span>
              <div className="w-full bg-[#16283d] h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-[#ff9800] h-full rounded-full" style={{ width: `${showVotes.drawPct}%` }} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className={userSelection === '2' ? 'text-[#ff0046]' : 'text-slate-300'}>
                {showVotes.awayVotes.toLocaleString()} votes
              </span>
              <div className="w-full bg-[#16283d] h-1 rounded-full mt-1 overflow-hidden">
                <div className="bg-[#ff0046] h-full rounded-full" style={{ width: `${showVotes.awayPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banter Entry Point (Section 8 & 69) */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#142538]">
        <button
          type="button"
          onClick={() => onOpenMatchBanter(match)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5 text-[#ff0046]" />
          <span>💬 Debate this match →</span>
        </button>
        {userSelection && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
            Pick Saved
          </span>
        )}
      </div>
    </div>
  );
};
