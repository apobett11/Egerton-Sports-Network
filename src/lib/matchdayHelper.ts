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
