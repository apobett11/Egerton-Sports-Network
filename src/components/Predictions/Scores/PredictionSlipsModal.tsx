import React from 'react';
import { X, List, MessageCircle } from 'lucide-react';
import type { MatchdayPairDay } from '../Layout/MatchdayPair';
import { formatTeamName } from '../../../lib/predictions/utils';
import { matchClosed, slipResult, slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { shareService } from '../../../services/predictions/shareService';
import { CompactDirectBanner } from '../../ads/CompactDirectBanner';
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
}) => {
  const focus = days.find((day) => day.matchday === initialMatchday) ?? days[0];
  const matches = focus?.dayKey
    ? fixtures.filter((match) => matchDayKey(match) === focus.dayKey)
    : fixtures.filter((match) => match.matchday === (focus?.matchday ?? initialMatchday));
  const voted = matches.filter((match) => userPredictions.has(match.id));

  const handleShare = () => {
    shareService.shareSlip({
      matches,
      userPredictions,
      consensusMap,
    });
  };

  const dayMatches = (day: MatchdayPairDay) => (
    day.dayKey
      ? fixtures.filter((match) => matchDayKey(match) === day.dayKey)
      : fixtures.filter((match) => match.matchday === day.matchday)
  );
  const pastDays = days.filter((day) => slipResult(dayMatches(day), (id) => userPredictions.get(id)).allClosed);
  const openDays = days.filter((day) => !pastDays.includes(day));

  const renderDay = (day: MatchdayPairDay) => {
    const rows = dayMatches(day);
    const result = slipResult(rows, (id) => userPredictions.get(id));
    return (
      <section key={day.dayKey ?? day.matchday} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {day.label ?? `Matchday ${day.matchday}`}
          </h3>
          <span className="rounded-full bg-[#14263b] px-2 py-0.5 text-[11px] font-black text-white">
            {result.got}/{result.total}
          </span>
        </div>
        {rows.map((match) => {
          const pick = userPredictions.get(match.id);
          const home = formatTeamName(match.homeTeam.name);
          const away = formatTeamName(match.awayTeam.name);
          const pickLabel = pick === '1' ? 'Home' : pick === '2' ? 'Away' : pick === 'X' ? 'Draw' : 'Not picked';
          const tick = pick ? slipTick(match, pick) : 'waiting';
          const tickLabel = !matchClosed(match)
            ? 'Waiting'
            : tick === 'won'
              ? 'Got it'
              : tick === 'lost'
                ? 'Missed'
                : tick === 'live'
                  ? 'Live'
                  : 'Waiting';
          return (
            <div key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2e45] bg-[#0b1624] px-3 py-2.5">
              <span className="min-w-0 truncate text-xs font-bold text-white">{home} vs {away}</span>
              <span className="shrink-0 flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase ${tick === 'won' ? 'text-[#00b04f]' : 'text-white'}`}>{tickLabel}</span>
                <span className="rounded-full bg-[#ff0046] px-2 py-0.5 text-[10px] font-black text-white">{pickLabel}</span>
              </span>
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl overflow-hidden">
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

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {openDays.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slips</p>
              {openDays.map(renderDay)}
            </div>
          )}
          {pastDays.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past slips</p>
              {pastDays.map(renderDay)}
            </div>
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
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-full bg-[#ff0046] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export function ShareSlipPopup({
  matchday,
  matches,
  picks,
  isFirst,
  inviteOnly = false,
  nextMatchday,
  onClose,
  onShare,
  onSeeNext,
  onSeeArticles,
  onSeeBanter,
}: {
  matchday: number;
  matches: Match[];
  picks: Map<string, PredictionOption>;
  isFirst: boolean;
  inviteOnly?: boolean;
  nextMatchday?: number;
  onClose: () => void;
  onShare: () => void;
  onSeeNext?: () => void;
  onSeeArticles?: () => void;
  onSeeBanter?: () => void;
}) {
  const result = slipResult(matches, (id) => picks.get(id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2.5 sm:p-4 backdrop-blur-md animate-fadeIn" data-testid="share-slip-popup">
      <div className="relative flex max-h-[85dvh] w-full max-w-sm sm:max-w-md flex-col overflow-hidden rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1a2e45] px-3.5 py-2.5 bg-[#0a1624]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#00b04f]">Share slip</p>
            <h2 className="text-xs sm:text-sm font-black">{inviteOnly ? 'Invite others' : `Matchday ${matchday}`}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:bg-[#14263b] hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-300 border-b border-[#14263b] bg-[#081018]">
          <span>Slip selections</span>
          <span className="font-mono text-white text-[11px] bg-[#14263b] px-2 py-0.5 rounded-full">{result.got}/{result.total} completed</span>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2 max-h-[40vh]">
          {matches.map((match) => {
            const pick = picks.get(match.id);
            const home = formatTeamName(match.homeTeam.name);
            const away = formatTeamName(match.awayTeam.name);
            const pickLabel = pick === '1' ? '1 (Home)' : pick === '2' ? '2 (Away)' : pick === 'X' ? 'X (Draw)' : 'Not picked';
            const tick = pick ? slipTick(match, pick) : 'waiting';
            const isClosed = matchClosed(match);
            const isWon = isClosed && tick === 'won';
            const isLost = isClosed && tick === 'lost';

            return (
              <div key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2e45] bg-[#0b1624] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center -space-x-1 shrink-0">
                    {match.homeTeam.logoUrl ? (
                      <img src={match.homeTeam.logoUrl} alt={home} className="h-4.5 w-4.5 rounded-full object-cover border border-slate-700 bg-[#081018]" loading="lazy" />
                    ) : (
                      <span className="h-4.5 w-4.5 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">H</span>
                    )}
                    {match.awayTeam.logoUrl ? (
                      <img src={match.awayTeam.logoUrl} alt={away} className="h-4.5 w-4.5 rounded-full object-cover border border-slate-700 bg-[#081018]" loading="lazy" />
                    ) : (
                      <span className="h-4.5 w-4.5 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">A</span>
                    )}
                  </div>
                  <span className="min-w-0 truncate text-[11px] sm:text-xs font-bold text-white">{home} vs {away}</span>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {isWon ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00b04f]/20 border border-[#00b04f]/50 px-1.5 py-0.5 text-[9px] font-black text-[#00b04f]">✓</span>
                  ) : isLost ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ff0046]/20 border border-[#ff0046]/50 px-1.5 py-0.5 text-[9px] font-black text-[#ff0046]">✗</span>
                  ) : null}
                  <span className="rounded bg-[#ff0046] px-1.5 py-0.5 text-[9px] font-black text-white">{pickLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-[#1a2e45] px-3.5 py-2.5 bg-[#0a1624]">
          <button type="button" onClick={onShare} className="min-h-[38px] rounded-full bg-[#00b04f] text-xs font-black uppercase tracking-wider text-white cursor-pointer hover:bg-[#009b45]">
            Share slip
          </button>
          {!inviteOnly && isFirst && onSeeNext && (
            <button
              type="button"
              onClick={onSeeNext}
              data-testid="go-to-next-matchday"
              className="min-h-[38px] rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white cursor-pointer hover:bg-[#e0003c]"
            >
              Go to matchday {nextMatchday ?? (matchday + 1)}
            </button>
          )}
          {!inviteOnly && isFirst && onSeeArticles && (
            <button type="button" onClick={onSeeArticles} className="min-h-[36px] rounded-full border border-[#29435d] text-xs font-black uppercase tracking-wider text-white cursor-pointer">
              See match articles
            </button>
          )}
          {!inviteOnly && !isFirst && onSeeBanter && (
            <button type="button" onClick={onSeeBanter} className="min-h-[38px] rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white cursor-pointer">
              See the banter
            </button>
          )}
          {!inviteOnly && (
            <button type="button" onClick={onClose} className="min-h-[32px] text-xs font-bold text-slate-400 cursor-pointer hover:text-white">
              Close
            </button>
          )}
          <CompactDirectBanner
            label="Verified Slip Bonus"
            tagline="Lock Your Prediction on External Sportsbook"
            variant="emerald"
            className="my-1"
          />
        </div>
      </div>
    </div>
  );
}

export function FreshPerspectiveModal({
  remainingMs,
  onClose,
}: {
  remainingMs: number;
  onClose: () => void;
}) {
  const [timeLeft, setTimeLeft] = React.useState(remainingMs);

  React.useEffect(() => {
    setTimeLeft(remainingMs);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingMs]);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn" data-testid="fresh-perspective-popup">
      <div className="relative w-full max-w-[340px] rounded-2xl border border-[#ff0046]/40 bg-[#0e1c2b] p-4 sm:p-5 text-center text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff0046]/20 text-xl shadow-inner">
          ☺️
        </div>
        <h2 className="text-xs sm:text-sm font-black text-white">Fresh Perspective Needed</h2>
        <p className="mt-1 text-xs text-slate-300 leading-snug">
          you need a fresh perspective, you have to wait just a little☺️. come again and make your prediction in:
        </p>
        <div className="my-3 rounded-lg border border-slate-700/80 bg-[#070e18] py-2 px-3 font-mono text-base sm:text-lg font-black text-[#ff0046] tracking-wider shadow-inner" data-testid="cooldown-timer">
          {formatCountdown(timeLeft)}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[38px] rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white hover:bg-[#e0003c] transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function MatchdayAdvancePopup({
  nextMatchdayNumber,
  nextSlipNumber = 2,
  onGoToNext,
  onClose,
}: {
  nextMatchdayNumber: number;
  nextSlipNumber?: number;
  onGoToNext: () => void;
  onClose: () => void;
}) {
  const slipName = nextSlipNumber === 2 ? 'second' : nextSlipNumber === 3 ? 'third' : `${nextSlipNumber}th`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn" data-testid="matchday-advance-popup">
      <div className="relative w-full max-w-[340px] rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] p-4 sm:p-5 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-6 text-xs sm:text-sm font-black">Matchday 1 Complete</h2>
        <p className="mt-1 text-xs text-slate-300 leading-snug">
          You will be able to create a {slipName} slip once both matchdays are complete. Complete matchday {nextMatchdayNumber} to finish your slip.
        </p>
        <button
          type="button"
          onClick={onGoToNext}
          data-testid="advance-to-matchday-10"
          className="mt-4 min-h-[38px] w-full rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white hover:bg-[#e0003c] transition-colors cursor-pointer"
        >
          Go to matchday {nextMatchdayNumber}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1.5 min-h-[32px] w-full text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function PeekMatchdayPopup({
  matchday,
  nextMatchday,
  onSeeNext,
  onClose,
}: {
  matchday: number;
  nextMatchday: number;
  onSeeNext: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] p-5 text-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:text-white cursor-pointer">
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-base font-black">You have selected the matchday {matchday} matches.</h2>
        <p className="mt-2 text-sm text-slate-300">You can have a peek at matchday {nextMatchday}.</p>
        <button type="button" onClick={onSeeNext} className="mt-4 min-h-[44px] w-full rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white cursor-pointer">
          See matchday {nextMatchday}
        </button>
        <button type="button" onClick={onClose} className="mt-2 min-h-[40px] w-full text-xs font-bold text-slate-400 cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}
