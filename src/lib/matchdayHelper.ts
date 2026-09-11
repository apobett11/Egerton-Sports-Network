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

