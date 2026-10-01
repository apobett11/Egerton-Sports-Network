import type { Match, PredictionOption } from '../../types/predictions';

const CLOSE_HOUR = 19;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type VotingPhase = 'date' | 'hours' | 'minutes' | 'seconds' | 'closed' | 'none';

export interface VotingWindowView {
  phase: VotingPhase;
  label: string;
  urgent: boolean;
  closed: boolean;
  closeAt: Date | null;
}

export function closeAtForKickoff(scheduledTime: string): Date {
  const kick = new Date(scheduledTime);
  const close = new Date(kick);
  close.setDate(close.getDate() - 1);
  close.setHours(CLOSE_HOUR, 0, 0, 0);
  return close;
}

/** One deadline for the slate: 7:00 PM the day before the earliest kickoff. */
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
    return { phase: 'closed', label: 'Voting is closed', urgent: false, closed: true, closeAt };
  }

  if (remaining > DAY_MS) {
    const weekday = WEEKDAYS[closeAt.getDay()];
    return {
      phase: 'date',
      label: `Voting closes on ${weekday} 7:00 PM`,
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

export function slipTick(match: Match, pick: PredictionOption): SlipTick {
  if (match.status === 'LIVE' || match.status === 'HT') return 'live';
  if (match.status !== 'FT') return 'waiting';
  const actual: PredictionOption =
    match.scoreHome > match.scoreAway ? '1' : match.scoreHome < match.scoreAway ? '2' : 'X';
  return actual === pick ? 'won' : 'lost';
}
