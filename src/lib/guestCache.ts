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

const STORAGE_PREFIX = 'esn_guest_cache_v3_';

class GuestCacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private subscribers: Set<CacheSubscriber> = new Set();
  private pollTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // Purge legacy v1 and v2 cache keys on startup to clear pre-wipe stale mock data
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('esn_guest_cache_v1_') || k.startsWith('esn_guest_cache_v2_'))) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      window.addEventListener('online', () => {
        // Revalidate stale cache on network recovery
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

    // 1-hour polling interval (3,600,000 ms) with visibility check
    this.pollTimer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return; // Don't poll when tab is in background / minimized
      }
      this.invalidate('fixtures');
      this.invalidate('standings');
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

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${fullKey}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        this.memoryCache.set(fullKey, parsed);
        return parsed.data;
      }
    } catch {
      // Ignore localStorage errors
    }

    return null;
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

    // 2. Check localStorage fallback
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${fullKey}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Repopulate memory cache
          this.memoryCache.set(fullKey, parsed);
          return parsed.data;
        }
        localStorage.removeItem(`${STORAGE_PREFIX}${fullKey}`);
      }
    } catch {
      // Ignore localStorage errors
    }

    return null;
  }

  /**
   * Set cached entry with TTL.
   */
  set<T>(category: string, key: string, data: T, customTtl?: number, notify = false): void {
    const fullKey = `${category}:${key}`;
    const ttl = customTtl || DEFAULT_TTLS[category] || 60 * 1000;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.memoryCache.set(fullKey, entry);

    try {
      localStorage.setItem(`${STORAGE_PREFIX}${fullKey}`, JSON.stringify(entry));
    } catch {
      // Clean old keys if storage full
      this.evictOldestLocalStorage();
    }

    if (notify) {
      this.notifySubscribers(category, key);
    }
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
