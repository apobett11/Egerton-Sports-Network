// ============================================================================
// ADMIN SNAPSHOT — one batched read of every table the admin console needs,
// persisted locally so the console renders instantly and only re-pulls when
// the snapshot is stale or the admin explicitly asks for a refresh.
// ============================================================================

import { supabase } from '../../../../lib/supabase';
import { TEAM_ADMIN_COLUMNS } from '../../../../lib/teamColumns';

export interface StorageObjectRow {
  name: string;
  created_at?: string;
  updated_at?: string;
  metadata?: { size?: number } | null;
}

export interface AdminQueryTiming {
  table: string;
  query: string;
  durationMs: number;
  rows: number;
  error?: string;
}

export interface AdminRawSnapshot {
  fetchedAt: number;
  /** Wall-clock time for the whole parallel batch (ms). */
  batchDurationMs: number;
  timings: AdminQueryTiming[];
  profilesTotalCount: number;
  devicesTotalCount: number;
  profiles: any[];
  teams: any[];
  players: any[];
  fixtures: any[];
  articles: any[];
  announcements: any[];
  auditLogs: any[];
  matchReports: any[];
  adminErrorLogs: any[];
  devices: any[];
  matchEvents: any[];
  matchLineups: any[];
  admin2Analytics: any | null;
  storageObjects: StorageObjectRow[];
}

const CACHE_KEY = 'esn_admin_snapshot_v1';
/** Serve from cache without any network for this long. */
export const SNAPSHOT_FRESH_MS = 3 * 60 * 1000;
/** Beyond this the cache is discarded rather than shown. */
export const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let memorySnapshot: AdminRawSnapshot | null = null;

const PROFILE_COLUMNS =
  'id, role, first_name, last_name, email, phone, country, avatar_url, bio, is_verified, team_id, created_at, updated_at';
const PLAYER_COLUMNS =
  'id, profile_id, team_id, first_name, last_name, phone, student_id, jersey_number, position, status, is_approved, created_at';
const FIXTURE_COLUMNS =
  'id, competition_id, home_team_id, away_team_id, scheduled_time, status, score_home, score_away, referee_id, matchday, created_at, updated_at';
const DEVICE_COLUMNS = 'device_id, last_seen_at, favorite_team_id, created_at';
const MATCH_REPORT_COLUMNS = 'id, fixture_id, official_id, official_role, submitted_at';
const MATCH_EVENT_COLUMNS = 'id, team_id, fixture_id';
const MATCH_LINEUP_COLUMNS = 'id, team_id, fixture_id, starting_xi, substitutes';
const AUDIT_COLUMNS = 'id, user_id, user_role, action, resource_type, resource_id, details, ip_address, created_at';

interface TimedResult<T> {
  data: T;
  count: number | null;
  timing: AdminQueryTiming;
}

async function timed<T>(
  table: string,
  query: string,
  run: () => PromiseLike<{ data: T | null; error: { message: string } | null; count?: number | null }>,
  fallback: T
): Promise<TimedResult<T>> {
  const t0 = performance.now();
  try {
    const res = await run();
    const durationMs = Math.round(performance.now() - t0);
    const data = (res.data ?? fallback) as T;
    const rows = Array.isArray(data) ? data.length : data ? 1 : 0;
    return {
      data,
      count: res.count ?? null,
      timing: { table, query, durationMs, rows, error: res.error?.message },
    };
  } catch (err: any) {
    return {
      data: fallback,
      count: null,
      timing: {
        table,
        query,
        durationMs: Math.round(performance.now() - t0),
        rows: 0,
        error: err?.message || 'request failed',
      },
    };
  }
}

/** Tables the console cannot function without. Anything else degrades gracefully. */
const CRITICAL_TABLES = new Set(['profiles', 'teams', 'players', 'fixtures']);

export class AdminSnapshotError extends Error {
  readonly failures: AdminQueryTiming[];
  constructor(failures: AdminQueryTiming[]) {
    const first = failures[0];
    const permission = failures.some((f) => /permission denied/i.test(f.error || ''));
    super(
      permission
        ? `Supabase denied admin read access (${failures.map((f) => f.table).join(', ')}). ` +
          `The signed-in session lacks table grants — apply supabase/migrations/78_repair_auth_and_admin_read_access.sql and sign in again.`
        : `${first.table}: ${first.error}`
    );
    this.name = 'AdminSnapshotError';
    this.failures = failures;
  }
}

export async function fetchAdminSnapshot(): Promise<AdminRawSnapshot> {
  const batchStart = performance.now();

  const [
    profiles,
    teams,
    players,
    fixtures,
    articles,
    announcements,
    auditLogs,
    matchReports,
    adminErrorLogs,
    devices,
    admin2Analytics,
    matchEvents,
    matchLineups,
    storageObjects,
  ] = await Promise.all([
    timed<any[]>('profiles', `select ${PROFILE_COLUMNS} order by created_at desc limit 1000`, () =>
      supabase.from('profiles').select(PROFILE_COLUMNS, { count: 'exact' }).order('created_at', { ascending: false }).limit(1000), []),
    timed<any[]>('teams', `select ${TEAM_ADMIN_COLUMNS}, practice_schedule limit 100`, () =>
      supabase.from('teams').select(`${TEAM_ADMIN_COLUMNS}, practice_schedule`).is('deleted_at', null).limit(100), []),
    timed<any[]>('players', `select ${PLAYER_COLUMNS} where deleted_at is null limit 1000`, () =>
      supabase.from('players').select(PLAYER_COLUMNS).is('deleted_at', null).limit(1000), []),
    timed<any[]>('fixtures', `select ${FIXTURE_COLUMNS} where deleted_at is null order by scheduled_time limit 500`, () =>
      supabase.from('fixtures').select(FIXTURE_COLUMNS).is('deleted_at', null).order('scheduled_time', { ascending: true }).limit(500), []),
    timed<any[]>('news_articles', 'select * order by created_at desc limit 100', () =>
      supabase.from('news_articles').select('*').order('created_at', { ascending: false }).limit(100), []),
    timed<any[]>('announcements', 'select * order by created_at desc limit 100', () =>
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(100), []),
    timed<any[]>('audit_logs', `select ${AUDIT_COLUMNS} order by created_at desc limit 200`, () =>
      supabase.from('audit_logs').select(AUDIT_COLUMNS).order('created_at', { ascending: false }).limit(200), []),
    timed<any[]>('match_reports', `select ${MATCH_REPORT_COLUMNS} limit 200`, () =>
      supabase.from('match_reports').select(MATCH_REPORT_COLUMNS).limit(200), []),
    timed<any[]>('admin_error_logs', 'select * order by created_at desc limit 30', () =>
      supabase.from('admin_error_logs').select('*').order('created_at', { ascending: false }).limit(30), []),
    timed<any[]>('anonymous_devices', `select ${DEVICE_COLUMNS} limit 2000`, () =>
      supabase.from('anonymous_devices').select(DEVICE_COLUMNS, { count: 'exact' }).order('last_seen_at', { ascending: false }).range(0, 49), []),
    timed<any | null>('system_settings', "select value where key = 'admin_2_analytics'", () =>
      supabase.from('system_settings').select('value').eq('key', 'admin_2_analytics').maybeSingle(), null),
    timed<any[]>('match_events', `select ${MATCH_EVENT_COLUMNS} limit 1000`, () =>
      supabase.from('match_events').select(MATCH_EVENT_COLUMNS).limit(1000), []),
    timed<any[]>('match_lineups', `select ${MATCH_LINEUP_COLUMNS} limit 200`, () =>
      supabase.from('match_lineups').select(MATCH_LINEUP_COLUMNS).limit(200), []),
    timed<StorageObjectRow[]>('storage.team-logos', "storage.list('logos', limit 1000)", () =>
      supabase.storage.from('team-logos').list('logos', { limit: 1000 }) as PromiseLike<any>, []),
  ]);

  const timings = [
    profiles, teams, players, fixtures, articles, announcements, auditLogs, matchReports,
    adminErrorLogs, devices, admin2Analytics, matchEvents, matchLineups, storageObjects,
  ].map((r) => r.timing);

  const criticalFailures = timings.filter((t) => t.error && CRITICAL_TABLES.has(t.table));
  if (criticalFailures.length > 0) {
    throw new AdminSnapshotError(criticalFailures);
  }

  const snapshot: AdminRawSnapshot = {
    fetchedAt: Date.now(),
    batchDurationMs: Math.round(performance.now() - batchStart),
    timings,
    profilesTotalCount: profiles.count ?? profiles.data.length,
    devicesTotalCount: devices.count ?? devices.data.length,
    profiles: profiles.data,
    teams: teams.data,
    players: players.data,
    fixtures: fixtures.data,
    articles: articles.data,
    announcements: announcements.data,
    auditLogs: auditLogs.data,
    matchReports: matchReports.data,
    adminErrorLogs: adminErrorLogs.data,
    devices: devices.data,
    matchEvents: matchEvents.data,
    matchLineups: matchLineups.data,
    admin2Analytics: admin2Analytics.data?.value ?? null,
    storageObjects: Array.isArray(storageObjects.data) ? storageObjects.data : [],
  };

  writeCachedSnapshot(snapshot);
  return snapshot;
}

export function readCachedSnapshot(): AdminRawSnapshot | null {
  if (memorySnapshot && Date.now() - memorySnapshot.fetchedAt < SNAPSHOT_MAX_AGE_MS) {
    return memorySnapshot;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminRawSnapshot;
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt >= SNAPSHOT_MAX_AGE_MS) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }
    memorySnapshot = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedSnapshot(snapshot: AdminRawSnapshot): void {
  memorySnapshot = snapshot;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota exceeded: keep the in-memory copy, drop the persisted one so a
    // half-written blob is never read back.
    try {
      window.localStorage.removeItem(CACHE_KEY);
    } catch {}
  }
}

export function clearCachedSnapshot(): void {
  memorySnapshot = null;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function isSnapshotFresh(snapshot: AdminRawSnapshot | null): boolean {
  return Boolean(snapshot && Date.now() - snapshot.fetchedAt < SNAPSHOT_FRESH_MS);
}
