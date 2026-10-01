import type { Match, Team } from '../../types/predictions';

export const EPL_COMPETITION_ID = '11111111-1111-1111-1111-111111111111';

const NAIROBI_MS = 3 * 60 * 60 * 1000;

interface NairobiParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

function nairobiParts(date: Date): NairobiParts {
  const shifted = new Date(date.getTime() + NAIROBI_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

function keyFromParts(parts: NairobiParts): string {
  const month = String(parts.month + 1).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

function addDays(parts: NairobiParts, days: number): NairobiParts {
  const utc = Date.UTC(parts.year, parts.month, parts.day) + days * 86400000;
  const next = new Date(utc);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth(),
    day: next.getUTCDate(),
    weekday: next.getUTCDay(),
  };
}

/** This Saturday and the Sunday that follows it. Never the weekend after. */
export function weekendDates(now = new Date()): { saturday: string; sunday: string } {
  const parts = nairobiParts(now);
  const satOffset = parts.weekday === 0 ? -1 : 6 - parts.weekday;
  const saturday = addDays(parts, satOffset);
  const sunday = addDays(saturday, 1);
  return { saturday: keyFromParts(saturday), sunday: keyFromParts(sunday) };
}

export function matchDayKey(match: Match): string {
  return keyFromParts(nairobiParts(new Date(match.scheduledTime)));
}

export function isEplMatch(match: Match): boolean {
  return match.competitionId === EPL_COMPETITION_ID;
}

export function weekendFixtures(matches: Match[], now = new Date()): Match[] {
  const { saturday, sunday } = weekendDates(now);
  return matches.filter((match) => {
    if (!isEplMatch(match)) return false;
    const day = matchDayKey(match);
    return day === saturday || day === sunday;
  });
}

/** A slate locks at its earliest kickoff. */
export function slateHasBegun(matches: Match[], now = new Date()): boolean {
  if (!matches.length) return false;
  const earliest = Math.min(...matches.map((match) => new Date(match.scheduledTime).getTime()));
  return now.getTime() >= earliest;
}

export interface WeekendDay {
  key: string;
  label: 'Saturday' | 'Sunday';
  matches: Match[];
}

export function weekendDays(matches: Match[], now = new Date()): WeekendDay[] {
  const { saturday, sunday } = weekendDates(now);
  const slate = weekendFixtures(matches, now);
  const byTime = (a: Match, b: Match) =>
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  return [
    {
      key: saturday,
      label: 'Saturday',
      matches: slate.filter((match) => matchDayKey(match) === saturday).sort(byTime),
    },
    {
      key: sunday,
      label: 'Sunday',
      matches: slate.filter((match) => matchDayKey(match) === sunday).sort(byTime),
    },
  ];
}

export function openWeekendMatches(matches: Match[], now = new Date()): Match[] {
  return weekendDays(matches, now)
    .filter((day) => day.matches.length > 0 && !slateHasBegun(day.matches, now))
    .flatMap((day) => day.matches);
}

function involvesTeam(match: Match, teamName: string): boolean {
  const fav = teamName.toLowerCase().trim();
  return (
    match.homeTeam.name.toLowerCase().trim() === fav ||
    match.awayTeam.name.toLowerCase().trim() === fav ||
    match.homeTeam.shortName.toLowerCase().trim() === fav ||
    match.awayTeam.shortName.toLowerCase().trim() === fav ||
    match.homeTeam.id === teamName ||
    match.awayTeam.id === teamName
  );
}

/** Favourite club's game first, then the rest of this open weekend. */
export function predictionQueue(matches: Match[], favouriteTeam: string | null, now = new Date()): Match[] {
  const open = openWeekendMatches(matches, now);
  if (!favouriteTeam) return open;
  const derby = open.find((match) => involvesTeam(match, favouriteTeam));
  const rest = open.filter((match) => match.id !== derby?.id);
  return derby ? [{ ...derby, isDerby: true }, ...rest] : rest;
}

export function teamsFromMatches(matches: Match[]): Team[] {
  const map = new Map<string, Team>();
  matches.forEach((match) => {
    if (match.homeTeam?.name && !map.has(match.homeTeam.name)) {
      map.set(match.homeTeam.name, match.homeTeam);
    }
    if (match.awayTeam?.name && !map.has(match.awayTeam.name)) {
      map.set(match.awayTeam.name, match.awayTeam);
    }
  });
  return Array.from(map.values());
}

export function dayLabel(match: Match, now = new Date()): 'Saturday' | 'Sunday' {
  const { sunday } = weekendDates(now);
  return matchDayKey(match) === sunday ? 'Sunday' : 'Saturday';
}
