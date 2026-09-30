import { detachEmbeddedLogos } from './teamLogoCache';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export type CacheCategory = 
  | 'fixtures' 
  | 'standings' 
  | 'match_details' 
  | 'teams' 
  | 'players' 
  | 'news' 
  | 'announcements' 
  | 'milestones' 
  | 'performance' 
  | 'audit_logs' 
  | 'seasons' 
  | 'leagues'
  | 'referees';

type CacheSubscriber = (category: string, key?: string) => void;

const DEFAULT_TTLS: Record<string, number> = {
  fixtures: 60 * 60 * 1000,      // 1 hour
  standings: 60 * 60 * 1000,     // 1 hour
  match_details: 10 * 60 * 1000, // 10 minutes
  teams: 24 * 60 * 60 * 1000,    // 24 hours (static master)
  players: 24 * 60 * 60 * 1000,  // 24 hours (static master)
  news: 60 * 60 * 1000,          // 1 hour
  announcements: 60 * 60 * 1000, // 1 hour
  milestones: 60 * 60 * 1000,    // 1 hour
  performance: 60 * 60 * 1000,   // 1 hour
  audit_logs: 10 * 60 * 1000,
  seasons: 24 * 60 * 60 * 1000,
  leagues: 24 * 60 * 60 * 1000,
  referees: 24 * 60 * 60 * 1000
};

const STORAGE_PREFIX = 'esn_guest_cache_v6_';
const MAX_STORED_CHARS = 80_000;
const RETIRED_PREFIXES = [
  'esn_guest_cache_v1_',
  'esn_guest_cache_v2_',
  'esn_guest_cache_v3_',
  'esn_guest_cache_v4_',
  'esn_guest_cache_v5_',
  'egerscore_guest_fixtures_',
  'guest_fixtures_v',
];

class GuestCacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private subscribers: Set<CacheSubscriber> = new Set();
  private pollTimer: number | null = null;
  private persistQueue: Array<{ storageKey: string; entry: CacheEntry<any> }> = [];
  private persistScheduled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.scheduleRetiredKeyCleanup();

      window.addEventListener('online', () => {
        this.clearStaleMemory();
      });

      this.setupGuestPollingDeferred();
    }
  }

  /**
   * Ultra-low footprint 1-hour polling, active only when user is viewing the page.
   */
  private setupGuestPollingDeferred(): void {
    if (typeof window === 'undefined') return;

    const start = () => this.startGuestPolling();

    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(start, { timeout: 10000 });
    } else {
      setTimeout(start, 8000);
    }
  }

  private startGuestPolling(): void {
    if (this.pollTimer !== null || typeof window === 'undefined') return;

    // Ask listeners to re-read cache. Do not delete fixtures: a wipe forced a
    // full-table download on the next paint and crashed the guest tab.
    this.pollTimer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      this.revalidate('fixtures');
      this.revalidate('standings');
    }, 60 * 60 * 1000);
  }

  /**
   * Defer non-critical realtime subscriptions until after initial paint (3-4s / idle)
   */
  public setupRealtimeDeferred(initFn: () => void | (() => void)): () => void {
    return setupRealtimeDeferred(initFn);
  }

  /**
   * Subscribe to cache invalidation / renewal events
   */
  subscribe(fn: CacheSubscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  private notifySubscribers(category: string, key?: string): void {
    this.subscribers.forEach((fn) => {
      try {
        fn(category, key);
      } catch (err) {
        console.error('Error in cache subscriber notification:', err);
      }
    });
  }

  /**
   * Return cached data even if TTL expired (SWR stale paint).
   */
  getStale<T>(category: string, key: string): T | null {
    const fullKey = `${category}:${key}`;

    const mem = this.memoryCache.get(fullKey);
    if (mem) {
      return mem.data as T;
    }

    const stored = this.readStored<T>(fullKey);
    if (stored) {
      this.memoryCache.set(fullKey, stored);
      return stored.data;
    }

    return null;
  }

  /**
   * Memory only. Safe to call while painting; it never touches localStorage.
   */
  peek<T>(category: string, key: string): T | null {
    const mem = this.memoryCache.get(`${category}:${key}`);
    if (!mem) return null;
    if (Date.now() - mem.timestamp >= mem.ttl) return null;
    return mem.data as T;
  }

  /**
   * Get cached entry if valid (unexpired).
   */
  get<T>(category: string, key: string): T | null {
    const fullKey = `${category}:${key}`;
    
    // 1. Check memory cache
    const mem = this.memoryCache.get(fullKey);
    if (mem) {
      if (Date.now() - mem.timestamp < mem.ttl) {
        return mem.data as T;
      }
      this.memoryCache.delete(fullKey);
    }

    const stored = this.readStored<T>(fullKey);
    if (stored && Date.now() - stored.timestamp < stored.ttl) {
      this.memoryCache.set(fullKey, stored);
      return stored.data;
    }

    return null;
  }

  /**
   * Keep the value in memory for this page immediately.
   * localStorage is filled one entry at a time, off the paint turn.
   */
  set<T>(category: string, key: string, data: T, customTtl?: number, notify = false): void {
    const fullKey = `${category}:${key}`;
    const ttl = customTtl || DEFAULT_TTLS[category] || 60 * 1000;
    const entry: CacheEntry<T> = {
      data: detachEmbeddedLogos(data) as T,
      timestamp: Date.now(),
      ttl
    };

    this.memoryCache.set(fullKey, entry);
    this.persistQueue = this.persistQueue.filter((job) => job.storageKey !== `${STORAGE_PREFIX}${fullKey}`);
    this.persistQueue.push({ storageKey: `${STORAGE_PREFIX}${fullKey}`, entry });
    this.schedulePersist();

    if (notify) {
      this.notifySubscribers(category, key);
    }
  }

  private schedulePersist(): void {
    if (this.persistScheduled || typeof window === 'undefined') return;
    this.persistScheduled = true;
    const run = () => {
      this.persistScheduled = false;
      const job = this.persistQueue.shift();
      if (job) {
        try {
          const json = JSON.stringify(job.entry);
          if (json.length <= MAX_STORED_CHARS && !json.includes('data:image')) {
            localStorage.setItem(job.storageKey, json);
          }
        } catch {
          this.evictOldestLocalStorage();
        }
      }
      if (this.persistQueue.length > 0) {
        window.setTimeout(() => this.schedulePersist(), 220);
      }
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 700 });
    } else {
      window.setTimeout(run, 120);
    }
  }

  /**
   * Drop retired cache keys by name only, one key at a time.
   * Their bodies are not read, so an old crest blob cannot freeze startup.
   */
  private scheduleRetiredKeyCleanup(): void {
    const step = () => {
      let retired: string | null = null;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && RETIRED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
            retired = key;
            break;
          }
        }
        if (retired) localStorage.removeItem(retired);
      } catch {
        return;
      }
      if (retired) window.setTimeout(step, 180);
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => step(), { timeout: 2500 });
    } else {
      window.setTimeout(step, 1200);
    }
  }

  /**
   * Delete / invalidate specific category or key.
   */
  delete(category: string, key?: string): void {
    this.invalidate(category, key);
  }

  /**
   * Ask subscribers to refresh without dropping the painted cache.
   */
  revalidate(category: string, key?: string): void {
    this.notifySubscribers(category, key);
  }

  /**
   * Invalidate specific category or key and notify subscribers.
   */
  invalidate(category: string, key?: string): void {
    if (key) {
      const fullKey = `${category}:${key}`;
      this.memoryCache.delete(fullKey);
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${fullKey}`);
      } catch {}
    } else {
      const prefix = `${category}:`;
      for (const k of this.memoryCache.keys()) {
        if (k.startsWith(prefix)) {
          this.memoryCache.delete(k);
        }
      }
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`${STORAGE_PREFIX}${prefix}`)) {
            localStorage.removeItem(k);
          }
        }
      } catch {}
    }

    this.notifySubscribers(category, key);
  }

  private readStored<T>(fullKey: string): CacheEntry<T> | null {
    try {
      const storageKey = `${STORAGE_PREFIX}${fullKey}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      if (raw.length > MAX_STORED_CHARS || raw.includes('data:image')) {
        try { localStorage.removeItem(storageKey); } catch {}
        return null;
      }
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  /**
   * Clear all expired entries from memory.
   */
  private clearStaleMemory(): void {
    const now = Date.now();
    for (const [k, v] of this.memoryCache.entries()) {
      if (now - v.timestamp >= v.ttl) {
        this.memoryCache.delete(k);
      }
    }
  }

  /**
   * Evict oldest items from localStorage if full.
   */
  private evictOldestLocalStorage(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keys.push(k);
        }
      }
      // Remove half of the cached keys
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const guestCache = new GuestCacheManager();

/**
 * Helper to defer non-critical realtime subscriptions until after initial paint (3-4s / idle)
 */
export function setupRealtimeDeferred(initFn: () => void | (() => void)): () => void {
  if (typeof window === 'undefined') return () => {};

  let cleanup: void | (() => void);
  let timerId: any = null;
  let idleId: any = null;
  let isCancelled = false;

  const init = () => {
    if (isCancelled) return;
    cleanup = initFn();
  };

  if (typeof (window as any).requestIdleCallback === 'function') {
    idleId = (window as any).requestIdleCallback(init, { timeout: 4000 });
  } else {
    timerId = setTimeout(init, 3500);
  }

  return () => {
    isCancelled = true;
    if (idleId !== null && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(idleId);
    }
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    if (typeof cleanup === 'function') {
      cleanup();
    }
  };
}
