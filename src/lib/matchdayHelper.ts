import type { Match } from '../types';
import { guestCache } from './guestCache';
import { supabase } from './supabase';

export const PLAYDAY_INDEX_KEY = 'playday_index_v1';
const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
const FRIENDLY_COMP_ID = '33333333-3333-3333-3333-333333333333';

export interface PlaydayMark {
  date: string;
  matchday: number;
  isFriendly: boolean;
  isLeague: boolean;
}

/** Calendar date the fixture was scheduled on, taken from the timestamp itself. */
export function fixtureDateKey(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

function isFriendlyRow(row: { competition_id?: string; league?: string; is_friendly?: boolean }): boolean {
  const league = (row.league || '').toLowerCase();
  return Boolean(
    row.is_friendly ||
    row.competition_id === 'friendlies' ||
    row.competition_id === FRIENDLY_COMP_ID ||
    league.includes('friend')
  );
}

export function buildPlaydayIndex(rows: Array<{
  scheduled_time?: string | null;
  scheduledTime?: string | null;
  matchday?: number | null;
  competition_id?: string | null;
  league?: string | null;
  is_friendly?: boolean;
}>): PlaydayMark[] {
  const map = new Map<string, PlaydayMark & { hasEpl: boolean }>();
  rows.forEach((row) => {
    const date = fixtureDateKey(row.scheduledTime || row.scheduled_time);
    if (!date) return;
    const friendly = isFriendlyRow(row);
    const isEpl = row.competition_id === EPL_COMP_ID || (row.league || '').toLowerCase().includes('premier');
    const md = Number(row.matchday) || 0;
    const prev = map.get(date);
    if (!prev) {
      map.set(date, {
        date,
        matchday: md || 1,
        isFriendly: friendly,
        isLeague: !friendly,
        hasEpl: isEpl && md > 0,
      });
      return;
    }
    prev.isFriendly = prev.isFriendly || friendly;
    prev.isLeague = prev.isLeague || !friendly;
    if (isEpl && md > 0) {
      prev.matchday = md;
      prev.hasEpl = true;
    } else if (!prev.hasEpl && md > 0) {
      prev.matchday = md;
    }
  });
  return [...map.values()]
    .map(({ hasEpl: _hasEpl, ...mark }) => mark)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function readPlaydayIndex(): PlaydayMark[] {
  return guestCache.getStale<PlaydayMark[]>('fixtures', PLAYDAY_INDEX_KEY) || [];
}

let playdayInflight: Promise<PlaydayMark[]> | null = null;

/** Paint from cache, then refresh the season date index in the background. */
export function refreshPlaydayIndex(): Promise<PlaydayMark[]> {
  if (playdayInflight) return playdayInflight;
  playdayInflight = (async () => {
    try {
      const { data } = await supabase
        .from('fixtures')
        .select('scheduled_time, matchday, competition_id')
        .order('scheduled_time', { ascending: true });
      const index = buildPlaydayIndex(data || []);
      if (index.length > 0) {
        guestCache.set('fixtures', PLAYDAY_INDEX_KEY, index, 6 * 60 * 60 * 1000);
        return index;
      }
      return readPlaydayIndex();
    } catch {
      return readPlaydayIndex();
    } finally {
      playdayInflight = null;
    }
  })();
  return playdayInflight;
}

/** Move to the previous or next date that actually has fixtures. */
export function shiftPlayday(currentKey: string, direction: 1 | -1, index: PlaydayMark[]): string | null {
  if (!index.length) return null;
  const exact = index.findIndex((mark) => mark.date === currentKey);
  if (exact === -1) {
    if (direction === 1) return index.find((mark) => mark.date > currentKey)?.date || null;
    for (let i = index.length - 1; i >= 0; i--) {
      if (index[i].date < currentKey) return index[i].date;
    }
    return null;
  }
  const next = index[exact + direction];
  return next ? next.date : null;
}

/**
 * Resolves the matchday date for the guest page from the real fixture calendar.
 * Today wins when it has matches. Otherwise the next scheduled playday opens.
 */
export function resolveGuestMatchdayDate(fixtures?: Match[]): Date {
  const now = new Date();
  const todayStr = localDateKey(now);
  const index = readPlaydayIndex();

  if (index.some((mark) => mark.date === todayStr)) {
    return now;
  }
  const upcoming = index.find((mark) => mark.date > todayStr);
  if (upcoming) return dateFromKey(upcoming.date);
  if (index.length > 0) return dateFromKey(index[index.length - 1].date);

  const fixturesList =
    fixtures && fixtures.length > 0
      ? fixtures
      : guestCache.getStale<Match[]>('fixtures', 'all_all_pall_sall') || [];

  const dateKeys = Array.from(new Set(
    fixturesList
      .map((f) => fixtureDateKey(f.scheduledTime || (f as any).scheduled_time))
      .filter((key): key is string => Boolean(key))
  )).sort();

  if (dateKeys.includes(todayStr)) return now;
  const nextKey = dateKeys.find((key) => key > todayStr);
  if (nextKey) return dateFromKey(nextKey);
  if (dateKeys.length > 0) return dateFromKey(dateKeys[dateKeys.length - 1]);

  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dayOfWeek === 6 || dayOfWeek === 0 ? 0 : daysUntilSaturday), 12, 0, 0);
}

/**
 * Formats a fixture scheduled time or time string cleanly into official kickoff time (e.g., '8:30 AM', '10:30 AM', '1:00 PM', '3:00 PM').
 * Deterministic and timezone-independent: parses directly from ISO timestamp or time string without unwanted timezone shift.
 */
export function formatMatchTime(timeOrIso?: string | null): string {
  if (!timeOrIso) return '';
  const str = String(timeOrIso).trim();
  if (!str) return '';

  // If already formatted with AM/PM (e.g. '8:30 AM' or '08:30 AM')
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (ampmMatch) {
    const hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    return `${hours}:${mins} ${ampm}`;
  }

  // If simple time format 'HH:mm' or 'HH:mm:ss'
  const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeOnlyMatch) {
    const hours = parseInt(timeOnlyMatch[1], 10);
    const mins = timeOnlyMatch[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${mins} ${ampm}`;
  }

  // If ISO string like '2026-09-05T08:30:00.000Z' or '2026-09-05 08:30:00'
  const isoTimeMatch = str.match(/[T\s](\d{2}):(\d{2})/);
  if (isoTimeMatch) {
    const hours = parseInt(isoTimeMatch[1], 10);
    const mins = isoTimeMatch[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${mins} ${ampm}`;
  }

  return str;
}

/**
 * Formats pitch allocation name. If short is true, returns 'Pitch A', 'Pitch B', or 'Pitch C'.
 * Otherwise returns the full venue name (e.g., 'Pitch A — Main Stadium Pitch').
 */
export function formatMatchPitch(venueOrPitch?: string | null, short = false): string {
  if (!venueOrPitch) return '';
  const str = String(venueOrPitch).trim();
  if (!str) return '';

  if (short) {
    const m = str.match(/^(Pitch\s+[A-C])/i);
    if (m) return m[1];
  }
  return str;
}

export interface MatchOfficialsInfo {
  centerReferee?: string;
  centerRefereeId?: string;
  linesmanTeamA?: string;
  linesmanTeamB?: string;
}

export const KNOWN_REFEREE_NAMES: Record<string, string> = {
  '30000000-0000-4000-9000-000000000001': 'Jark',
  '30000000-0000-4000-9000-000000000002': 'Lamoh',
  '30000000-0000-4000-9000-000000000003': 'Chalo',
  '30000000-0000-4000-9000-000000000004': 'Daudi',
  '30000000-0000-4000-9000-000000000005': 'Ericko',
  '30000000-0000-4000-9000-000000000006': 'Jatugo',
  '30000000-0000-4000-9000-000000000007': 'Edu',
  '30000000-0000-4000-9000-000000000008': 'Brilliant',
};

export const FIXTURE_ALLOCATED_OFFICIALS: Record<string, MatchOfficialsInfo> = {
  // Matchday 6 EPL
  'f0000000-0000-4000-8000-000000000022': { centerReferee: 'Jark', centerRefereeId: '30000000-0000-4000-9000-000000000001', linesmanTeamA: 'Legends Fc', linesmanTeamB: 'Wazito Fc' },
  'f0000000-0000-4000-8000-000000000024': { centerReferee: 'Lamoh', centerRefereeId: '30000000-0000-4000-9000-000000000002', linesmanTeamA: 'Super eagles', linesmanTeamB: 'Celtics FC' },
  'f0000000-0000-4000-8000-000000000020': { centerReferee: 'Chalo', centerRefereeId: '30000000-0000-4000-9000-000000000003', linesmanTeamA: 'Santos fc', linesmanTeamB: 'Mighty Blacks' },
  'f0000000-0000-4000-8000-000000000021': { centerReferee: 'Daudi', centerRefereeId: '30000000-0000-4000-9000-000000000004', linesmanTeamA: 'Blue Blazers', linesmanTeamB: 'Giants FC' },
  'f0000000-0000-4000-8000-00000000001f': { centerReferee: 'Ericko', centerRefereeId: '30000000-0000-4000-9000-000000000005', linesmanTeamA: 'Five Stars fc', linesmanTeamB: 'BCOM FC' },
  'f0000000-0000-4000-8000-000000000023': { centerReferee: 'Jatugo', centerRefereeId: '30000000-0000-4000-9000-000000000006', linesmanTeamA: 'Med fc', linesmanTeamB: 'Rising stars' },
  // Matchday 7 EPL
  'f0000000-0000-4000-8000-000000000028': { centerReferee: 'Edu', centerRefereeId: '30000000-0000-4000-9000-000000000007', linesmanTeamA: 'Wazito Fc', linesmanTeamB: 'Celtics FC' },
  'f0000000-0000-4000-8000-000000000027': { centerReferee: 'Lamoh', centerRefereeId: '30000000-0000-4000-9000-000000000002', linesmanTeamA: 'Super eagles', linesmanTeamB: 'Rising stars' },
  'f0000000-0000-4000-8000-000000000029': { centerReferee: 'Chalo', centerRefereeId: '30000000-0000-4000-9000-000000000003', linesmanTeamA: 'Five Stars fc', linesmanTeamB: 'Santos fc' },
  'f0000000-0000-4000-8000-000000000026': { centerReferee: 'Ericko', centerRefereeId: '30000000-0000-4000-9000-000000000005', linesmanTeamA: 'Mighty Blacks', linesmanTeamB: 'Legends Fc' },
  'f0000000-0000-4000-8000-000000000025': { centerReferee: 'Daudi', centerRefereeId: '30000000-0000-4000-9000-000000000004', linesmanTeamA: 'Giants FC', linesmanTeamB: 'Med fc' },
  'f0000000-0000-4000-8000-00000000002a': { centerReferee: 'Jatugo', centerRefereeId: '30000000-0000-4000-9000-000000000006', linesmanTeamA: 'BCOM FC', linesmanTeamB: 'Blue Blazers' },
  // Matchday 7 Championship
  'c0000000-0000-4000-8000-00000000001e': { centerReferee: 'Jatugo', centerRefereeId: '30000000-0000-4000-9000-000000000006', linesmanTeamA: 'Young legends', linesmanTeamB: 'Aged FC' },
  'c0000000-0000-4000-8000-00000000001d': { centerReferee: 'Brilliant', centerRefereeId: '30000000-0000-4000-9000-000000000008', linesmanTeamA: 'Talanta fc', linesmanTeamB: 'law fc' },
  // Matchday 7 Friendlies
  'e0000000-0000-4000-8000-000000000001': { centerReferee: 'Jark', centerRefereeId: '30000000-0000-4000-9000-000000000001' },
};

const GENERIC_PLACEHOLDER_REFEREES = new Set([
  'appointed official',
  'accredited league referee',
  'official referee',
  'accredited official referee',
  'accredited referee',
  'official',
  'referee',
  'tba'
]);

export function isGenericRefereePlaceholder(name?: string | null): boolean {
  if (!name) return true;
  return GENERIC_PLACEHOLDER_REFEREES.has(name.trim().toLowerCase());
}

export function resolveAllocatedOfficials(target?: string | Match | any): MatchOfficialsInfo {
  if (!target) return {};

  const id = typeof target === 'string' ? target : target.id;
  const fromSchedule = id ? FIXTURE_ALLOCATED_OFFICIALS[id] : undefined;

  let refName: string | undefined = undefined;
  let refId: string | undefined = undefined;
  let linesA: string | undefined = undefined;
  let linesB: string | undefined = undefined;

  if (typeof target === 'object' && target !== null) {
    // 1. Direct referee name if non-generic
    const rawRef = target.referee || target.centerReferee || (target as any).refereeName;
    if (rawRef && !isGenericRefereePlaceholder(rawRef)) {
      refName = rawRef.trim();
    }

    // 2. Map from referee ID
    const rawId = target.refereeId || target.centerRefereeId || (target as any).referee_id || (target as any).center_referee_id;
    if (rawId && typeof rawId === 'string') {
      refId = rawId;
      if (!refName && KNOWN_REFEREE_NAMES[rawId]) {
        refName = KNOWN_REFEREE_NAMES[rawId];
      }
    }

    // 3. Linesmen teams
    linesA = target.linesmanTeamAName || target.linesmanTeamA?.name || (target as any).linesman_team_a_name;
    linesB = target.linesmanTeamBName || target.linesmanTeamB?.name || (target as any).linesman_team_b_name;
  }

  // Fallback to schedule allocation if not yet resolved
  if (!refName && fromSchedule?.centerReferee) {
    refName = fromSchedule.centerReferee;
  }
  if (!refId && fromSchedule?.centerRefereeId) {
    refId = fromSchedule.centerRefereeId;
  }
  if (!linesA && fromSchedule?.linesmanTeamA) {
    linesA = fromSchedule.linesmanTeamA;
  }
  if (!linesB && fromSchedule?.linesmanTeamB) {
    linesB = fromSchedule.linesmanTeamB;
  }

  return {
    centerReferee: refName,
    centerRefereeId: refId,
    linesmanTeamA: linesA,
    linesmanTeamB: linesB,
  };
}


