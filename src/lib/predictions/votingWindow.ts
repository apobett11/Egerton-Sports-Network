import type { Match, PredictionOption } from '../../types/predictions';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type VotingPhase = 'date' | 'hours' | 'minutes' | 'seconds' | 'closed' | 'none';

export interface VotingWindowView {
  phase: VotingPhase;
  label: string;
  urgent: boolean;
  closed: boolean;
  closeAt: Date | null;
}

/** Picks close when this fixture's matchday kicks off. */
export function closeAtForKickoff(scheduledTime: string): Date {
  return new Date(scheduledTime);
}

/** The slate locks at the earliest kickoff in the group. */
export function matchdayCloseAt(matches: Match[]): Date | null {
  if (!matches.length) return null;
  const earliest = matches.reduce((best, match) =>
    new Date(match.scheduledTime).getTime() < new Date(best.scheduledTime).getTime() ? match : best
  );
  return closeAtForKickoff(earliest.scheduledTime);
}

export function describeVotingWindow(matches: Match[], now = new Date()): VotingWindowView {
  const closeAt = matchdayCloseAt(matches);
  if (!closeAt) {
    return { phase: 'none', label: '', urgent: false, closed: false, closeAt: null };
  }

  const remaining = closeAt.getTime() - now.getTime();
  if (remaining <= 0) {
    return { phase: 'closed', label: 'This matchday has begun', urgent: false, closed: true, closeAt };
  }

  if (remaining > DAY_MS) {
    return {
      phase: 'date',
      label: 'Picks lock when this matchday begins',
      urgent: false,
      closed: false,
      closeAt,
    };
  }

  if (remaining >= HOUR_MS) {
    const hours = Math.floor(remaining / HOUR_MS);
    return {
      phase: 'hours',
      label: `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
      urgent: false,
      closed: false,
      closeAt,
    };
  }

  if (remaining >= MINUTE_MS) {
    const minutes = Math.floor(remaining / MINUTE_MS);
    return {
      phase: 'minutes',
      label: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
      urgent: false,
      closed: false,
      closeAt,
    };
  }

  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  return {
    phase: 'seconds',
    label: `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`,
    urgent: true,
    closed: false,
    closeAt,
  };
}

const FINISHED = new Set(['FT', 'CANCELLED']);

export function matchdayFullyPlayed(matches: Match[]): boolean {
  return matches.length > 0 && matches.every((match) => FINISHED.has(match.status));
}

export type SlipTick = 'waiting' | 'live' | 'won' | 'lost';

export function matchClosed(match: Match): boolean {
  return match.status === 'FT' || match.status === 'CANCELLED';
}

export function slipResult(matches: Match[], pickFor: (matchId: string) => PredictionOption | undefined) {
  let got = 0;
  matches.forEach((match) => {
    const pick = pickFor(match.id);
    if (pick && slipTick(match, pick) === 'won') got += 1;
  });
  return {
    got,
    total: matches.length,
    allClosed: matches.length > 0 && matches.every(matchClosed),
  };
}

export function slipTick(match: Match, pick: PredictionOption): SlipTick {
  if (match.status === 'LIVE' || match.status === 'HT') return 'live';
  if (match.status !== 'FT') return 'waiting';
  const actual: PredictionOption =
    match.scoreHome > match.scoreAway ? '1' : match.scoreHome < match.scoreAway ? '2' : 'X';
  return actual === pick ? 'won' : 'lost';
}
