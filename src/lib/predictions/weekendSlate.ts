import type { Match, Team } from '../../types/predictions';

export const EPL_COMPETITION_ID = '11111111-1111-1111-1111-111111111111';

const NAIROBI_MS = 3 * 60 * 60 * 1000;

export interface WeekendPair {
  saturday: string;
  sunday: string;
}

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

function weekdayOfKey(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0)).getUTCDay();
}

function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

/** ISO calendar date as stored on the fixtures page. Nairobi is the fallback. */
export function matchDayKey(match: Match): string {
  const raw = String(match.scheduledTime || '').trim();
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  return keyFromParts(nairobiParts(new Date(match.scheduledTime)));
}

function todayKey(now = new Date()): string {
  const iso = now.toISOString().match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  return keyFromParts(nairobiParts(now));
}

function slateStillLive(matches: Match[]): boolean {
  return matches.some((match) => match.status !== 'FT' && match.status !== 'CANCELLED');
}

/** This Saturday and the Sunday that follows it. Never the weekend after. */
export function weekendDates(now = new Date()): WeekendPair {
  const parts = nairobiParts(now);
  const satOffset = parts.weekday === 0 ? -1 : 6 - parts.weekday;
  const saturday = addDays(parts, satOffset);
  const sunday = addDays(saturday, 1);
  return { saturday: keyFromParts(saturday), sunday: keyFromParts(sunday) };
}

export function isEplMatch(match: Match): boolean {
  return match.competitionId === EPL_COMPETITION_ID;
}

/**
 * Next Saturday and Sunday that actually have fixtures.
 * Locked dates stay until that weekend is finished. They never jump to the week after.
 */
export function nextFixtureWeekend(
  matches: Match[],
  now = new Date(),
  locked?: WeekendPair | null,
): WeekendPair {
  const calendar = weekendDates(now);
  const epl = matches.filter(isEplMatch);
  if (epl.length === 0) return locked?.saturday && locked?.sunday ? locked : calendar;

  const byDay = new Map<string, Match[]>();
  epl.forEach((match) => {
    const key = matchDayKey(match);
    const list = byDay.get(key);
    if (list) list.push(match);
    else byDay.set(key, [match]);
  });

  const keys = Array.from(byDay.keys()).sort();
  const saturdays = keys.filter((key) => weekdayOfKey(key) === 6);
  const sundays = keys.filter((key) => weekdayOfKey(key) === 0);
  const today = todayKey(now);

  if (locked?.saturday && locked?.sunday) {
    const lockedMatches = [
      ...(byDay.get(locked.saturday) || []),
      ...(byDay.get(locked.sunday) || []),
    ];
    const stillOnCalendar = locked.sunday >= today || locked.saturday >= today;
    if (lockedMatches.length > 0 && (stillOnCalendar || slateStillLive(lockedMatches))) {
      return locked;
    }
  }

  const thisWeekendListed = byDay.has(calendar.saturday) || byDay.has(calendar.sunday);
  if (thisWeekendListed) {
    return {
      saturday: byDay.has(calendar.saturday) ? calendar.saturday : calendar.saturday,
      sunday: byDay.has(calendar.sunday) ? calendar.sunday : addDaysToKey(calendar.saturday, 1),
    };
  }

  const nextSaturday = saturdays.find((key) => key > calendar.sunday)
    || saturdays.find((key) => key >= today)
    || saturdays[0];
  if (!nextSaturday) return calendar;

  const pairedSunday = sundays.find((key) => key === addDaysToKey(nextSaturday, 1))
    || sundays.find((key) => key > nextSaturday && key <= addDaysToKey(nextSaturday, 2))
    || addDaysToKey(nextSaturday, 1);

  return { saturday: nextSaturday, sunday: pairedSunday };
}

export function weekendFixtures(
  matches: Match[],
  now = new Date(),
  locked?: WeekendPair | null,
): Match[] {
  const { saturday, sunday } = nextFixtureWeekend(matches, now, locked);
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

export function weekendDays(
  matches: Match[],
  now = new Date(),
  locked?: WeekendPair | null,
): WeekendDay[] {
  const { saturday, sunday } = nextFixtureWeekend(matches, now, locked);
  const slate = weekendFixtures(matches, now, { saturday, sunday });
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

export function openWeekendMatches(
  matches: Match[],
  now = new Date(),
  locked?: WeekendPair | null,
): Match[] {
  return weekendDays(matches, now, locked)
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

/** Shared match first, otherwise favourite club's game, then the rest of this open slate. */
export function predictionQueue(
  matches: Match[],
  favouriteTeam: string | null,
  now = new Date(),
  preferredMatchId?: string | null,
  locked?: WeekendPair | null,
): Match[] {
  const open = openWeekendMatches(matches, now, locked);
  const preferred = preferredMatchId
    ? open.find((match) => match.id === preferredMatchId)
    : null;
  if (preferred) {
    return [
      { ...preferred, isDerby: true },
      ...open.filter((match) => match.id !== preferred.id).map((match) => ({ ...match, isDerby: false })),
    ];
  }
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

export function dayLabel(match: Match): 'Saturday' | 'Sunday' {
  return weekdayOfKey(matchDayKey(match)) === 0 ? 'Sunday' : 'Saturday';
}
