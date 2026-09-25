import type { Match } from '../types';
import { guestCache } from './guestCache';

/**
 * Resolves the matchday date for the guest page:
 * - If today is a playday (weekend or has scheduled fixtures), returns today.
 * - If today is a weekday (and no fixtures today), returns the next matchday date.
 * 
 * Operates synchronously using guestCache / calendar arithmetic to ensure 0ms latency.
 */
export function resolveGuestMatchdayDate(fixtures?: Match[]): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Fixtures source: explicit param or synchronous master cache
  const fixturesList =
    fixtures && fixtures.length > 0
      ? fixtures
      : guestCache.get<Match[]>('fixtures', 'all_all_pall_sall') || [];

  // Check if today has any fixtures scheduled
  const hasFixturesToday = fixturesList.some((f) => {
    const raw = f.scheduledTime || (f as any).scheduled_time;
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateKey === todayStr;
  });

  const isTodayPlayday = dayOfWeek === 0 || dayOfWeek === 6 || hasFixturesToday;

  // 1. If on a playday, the matchday is actually loaded
  if (isTodayPlayday) {
    return now;
  }

  // 2. If on a weekday, the next matchday is opened
  if (fixturesList.length > 0) {
    const upcomingDateKeys: string[] = [];
    fixturesList.forEach((f) => {
      const raw = f.scheduledTime || (f as any).scheduled_time;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateKey > todayStr && !upcomingDateKeys.includes(dateKey)) {
        upcomingDateKeys.push(dateKey);
      }
    });

    upcomingDateKeys.sort();
    if (upcomingDateKeys.length > 0) {
      const [y, m, d] = upcomingDateKeys[0].split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }
  }

  // 3. Fallback: coming Saturday (standard weekend matchday kick-off)
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday, 12, 0, 0);
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


