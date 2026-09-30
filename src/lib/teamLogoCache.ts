import { needsAssetFetch, writeCachedAsset } from './cache/assetCache';
import { supabase } from './supabase';

export const DEFAULT_TEAM_LOGO =
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';

type LogoRecord = { src: string; stamp: string };

const memory = new Map<string, LogoRecord>();
const listeners = new Set<(teamId?: string) => void>();
const queue: Array<{ teamId: string; stamp: string; priority: boolean }> = [];
const inflight = new Set<string>();

let hydrated: Promise<void> | null = null;
let active = 0;
let pumpScheduled = false;
const MAX_CONCURRENT = 1;
const LOGO_GAP_MS = 700;

function notify(teamId?: string): void {
  listeners.forEach((fn) => {
    try {
      fn(teamId);
    } catch {
      // A logo subscriber must not break the rest of the page.
    }
  });
}

export function subscribeTeamLogos(fn: (teamId?: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function peekTeamLogo(teamId?: string | null): string | null {
  if (!teamId) return null;
  return memory.get(teamId)?.src || null;
}

export function peekLogoStamp(teamId?: string | null): string | null {
  if (!teamId) return null;
  return memory.get(teamId)?.stamp || null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('esn_team_logos_v1', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('logos')) {
        db.createObjectStore('logos');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function hydrateTeamLogos(): Promise<void> {
  if (hydrated) return hydrated;
  if (typeof indexedDB === 'undefined') {
    hydrated = Promise.resolve();
    return hydrated;
  }

  hydrated = openDb()
    .then(
      (db) =>
        new Promise<void>((resolve) => {
          const tx = db.transaction('logos', 'readonly');
          const store = tx.objectStore('logos');
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (!cursor) {
              resolve();
              return;
            }
            memory.set(String(cursor.key), cursor.value as LogoRecord);
            cursor.continue();
          };
          req.onerror = () => resolve();
          tx.onerror = () => resolve();
        })
    )
    .catch(() => undefined)
    .then(() => {
      if (memory.size > 0) notify();
    });

  return hydrated;
}

async function persist(teamId: string, record: LogoRecord): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction('logos', 'readwrite');
      tx.objectStore('logos').put(record, teamId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Memory still has the logo for this session.
  }
}

export async function rememberTeamLogo(teamId: string, src: string, stamp: string): Promise<void> {
  if (!teamId || !src || src.startsWith('data:')) return;
  writeCachedAsset(teamId, src, stamp && stamp !== 'legacy' ? stamp : undefined);
  const prev = memory.get(teamId);
  if (prev && prev.src === src && prev.stamp === stamp) return;
  const record = { src, stamp: stamp || 'legacy' };
  memory.set(teamId, record);
  notify(teamId);
  await persist(teamId, record);
}

/**
 * Short logo suitable for fixture and standings payloads.
 * Embedded images stay in the logo cache and are never copied into those payloads.
 */
export function publicTeamLogo(teamId?: string | null, raw?: string | null): string {
  if (raw && raw.startsWith('data:') && teamId) {
    void rememberTeamLogo(teamId, raw, peekLogoStamp(teamId) || 'legacy');
  } else if (raw && /^https?:\/\//.test(raw)) {
    if (teamId && !memory.has(teamId)) {
      void rememberTeamLogo(teamId, raw, raw);
    }
    return raw;
  }

  const cached = peekTeamLogo(teamId);
  if (cached && !cached.startsWith('data:')) return cached;
  return DEFAULT_TEAM_LOGO;
}

export function detachEmbeddedLogos(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => detachEmbeddedLogos(item));
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  const id = record.id || record.teamId || record.team_id;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) {
    if (
      (key === 'logo' || key === 'logo_url' || key === 'teamLogo' || key === 'team_logo') &&
      typeof child === 'string' &&
      child.startsWith('data:')
    ) {
      if (typeof id === 'string' && id) {
        void rememberTeamLogo(id, child, 'legacy');
      }
      out[key] = DEFAULT_TEAM_LOGO;
    } else {
      out[key] = detachEmbeddedLogos(child);
    }
  }
  return out;
}

function enqueue(teamId: string, stamp: string, priority: boolean): void {
  if (!teamId || inflight.has(teamId)) return;
  const known = memory.get(teamId);
  if (known && (!stamp || known.stamp === stamp || known.stamp === 'legacy')) {
    if (known.stamp === 'legacy' && stamp) {
      void rememberTeamLogo(teamId, known.src, stamp);
    }
    return;
  }

  const existing = queue.find((job) => job.teamId === teamId);
  if (existing) {
    if (priority) existing.priority = true;
    if (stamp) existing.stamp = stamp;
    return;
  }

  const job = { teamId, stamp, priority };
  if (priority) queue.unshift(job);
  else queue.push(job);
  schedulePump();
}

function schedulePump(): void {
  if (pumpScheduled || active >= MAX_CONCURRENT || queue.length === 0) return;
  pumpScheduled = true;
  const start = () => {
    pumpScheduled = false;
    void pump();
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 1600 });
  } else {
    setTimeout(start, 800);
  }
}

async function fetchOne(teamId: string, expectedStamp: string): Promise<void> {
  // Embedded crests stay in the database. The filter keeps data: bytes off the wire.
  const { data, error } = await supabase
    .from('teams')
    .select('logo_url, updated_at')
    .eq('id', teamId)
    .not('logo_url', 'like', 'data:%')
    .maybeSingle();

  if (error) return;
  const stamp = (data?.updated_at as string) || expectedStamp || 'embedded-skip';
  if (!data?.logo_url || String(data.logo_url).startsWith('data:')) {
    await rememberTeamLogo(teamId, DEFAULT_TEAM_LOGO, stamp);
    return;
  }
  await rememberTeamLogo(teamId, data.logo_url, stamp);
}

async function pump(): Promise<void> {
  if (active >= MAX_CONCURRENT) return;
  const priorityIndex = queue.findIndex((job) => job.priority);
  const job = queue.splice(priorityIndex >= 0 ? priorityIndex : 0, 1)[0];
  if (!job) return;

  active += 1;
  inflight.add(job.teamId);
  try {
    await hydrateTeamLogos();
    const known = memory.get(job.teamId);
    if (known && (!job.stamp || known.stamp === job.stamp || known.stamp === 'legacy')) {
      if (known.stamp === 'legacy' && job.stamp) {
        await rememberTeamLogo(job.teamId, known.src, job.stamp);
      }
    } else {
      await fetchOne(job.teamId, job.stamp);
    }
  } catch {
    // The crest stays on the default image until the next visit.
  } finally {
    inflight.delete(job.teamId);
    active -= 1;
    if (queue.length > 0) {
      setTimeout(() => schedulePump(), LOGO_GAP_MS);
    }
  }
}

/** Fetch this crest only when it is missing, or when an explicit version token changed. */
export function prioritizeTeamLogo(teamId?: string | null, version?: string): void {
  if (!teamId) return;
  if (!needsAssetFetch(teamId, version) || (memory.has(teamId) && !version)) return;
  void hydrateTeamLogos().then(() => {
    if (!needsAssetFetch(teamId, version) || (memory.has(teamId) && !version)) return;
    enqueue(teamId, version || '', true);
  });
}

/**
 * Logos stay in the permanent cache until a team's updated_at changes
 * (coach replaced the crest or another team field). Only those teams are fetched.
 */
export function reconcileLogoStamps(
  rows: Array<{ id?: string; updated_at?: string | null }>,
  version?: string,
): void {
  void hydrateTeamLogos().then(() => {
    for (const row of rows) {
      if (!row?.id) continue;
      const stamp = version || row.updated_at || '';
      if (!stamp || !needsAssetFetch(row.id, stamp)) continue;
      enqueue(row.id, stamp, false);
    }
  });
}

if (typeof window !== 'undefined') {
  void hydrateTeamLogos();
}
