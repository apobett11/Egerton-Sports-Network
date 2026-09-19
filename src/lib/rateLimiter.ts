export type RateLimitScope = 
  | 'global'
  | 'admin'
  | 'admin-operations'
  | 'admin-2fa'
  | 'auth'
  | 'dashboard'
  | 'dashboard-doctor'
  | 'dashboard-journalist'
  | 'dashboard-president'
  | 'dashboard-referee'
  | 'dashboard-superadmin'
  | 'dashboard-team'
  | string;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxBurstDelayMs?: number;
  description?: string;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetTimeMs: number;
  scope: RateLimitScope;
}

export class RateLimitError extends Error {
  status: number = 429;
  retryAfterSeconds: number;
  scope: RateLimitScope;

  constructor(message: string, retryAfterMs: number, scope: RateLimitScope) {
    super(message);
    this.name = 'RateLimitError';
    this.scope = scope;
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  }
}

const DEFAULT_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'global': {
    maxRequests: 120,
    windowMs: 10_000,
    maxBurstDelayMs: 400,
    description: 'Global Application Rate Limit',
  },
  'dashboard': {
    maxRequests: 60,
    windowMs: 10_000,
    maxBurstDelayMs: 300,
    description: 'Dashboard General Calls',
  },
  'dashboard-superadmin': {
    maxRequests: 45,
    windowMs: 10_000,
    maxBurstDelayMs: 200,
    description: 'SuperAdmin Dashboard Calls',
  },
  'dashboard-president': {
    maxRequests: 50,
    windowMs: 10_000,
    maxBurstDelayMs: 250,
    description: 'President Dashboard Calls',
  },
  'dashboard-referee': {
    maxRequests: 50,
    windowMs: 10_000,
    maxBurstDelayMs: 250,
    description: 'Referee Dashboard Calls',
  },
  'dashboard-team': {
    maxRequests: 50,
    windowMs: 10_000,
    maxBurstDelayMs: 250,
    description: 'Team Dashboard Calls',
  },
  'dashboard-journalist': {
    maxRequests: 50,
    windowMs: 10_000,
    maxBurstDelayMs: 250,
    description: 'Journalist Dashboard Calls',
  },
  'dashboard-doctor': {
    maxRequests: 40,
    windowMs: 10_000,
    maxBurstDelayMs: 200,
    description: 'Doctor Dashboard Calls',
  },
  'admin': {
    maxRequests: 20,
    windowMs: 10_000,
    maxBurstDelayMs: 150,
    description: 'Admin Master Calls',
  },
  'admin-operations': {
    maxRequests: 15,
    windowMs: 10_000,
    maxBurstDelayMs: 100,
    description: 'Admin Sensitive Operations',
  },
  'admin-2fa': {
    maxRequests: 10,
    windowMs: 30_000,
    maxBurstDelayMs: 0,
    description: 'Admin 2FA Verification Calls',
  },
  'auth': {
    maxRequests: 20,
    windowMs: 30_000,
    maxBurstDelayMs: 0,
    description: 'Authentication Calls',
  },
};

type RateLimitListener = (result: RateLimitCheckResult & { url?: string }) => void;

export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private listeners: Set<RateLimitListener> = new Set();

  constructor() {
    Object.entries(DEFAULT_LIMIT_CONFIGS).forEach(([scope, config]) => {
      this.configs.set(scope, config);
    });
  }

  public setConfig(scope: RateLimitScope, config: RateLimitConfig): void {
    this.configs.set(scope, config);
  }

  public getConfig(scope: RateLimitScope): RateLimitConfig {
    return this.configs.get(scope) || DEFAULT_LIMIT_CONFIGS['global'];
  }

  public onRateLimit(listener: RateLimitListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private prune(scope: string, windowMs: number, now: number): number[] {
    const list = this.timestamps.get(scope) || [];
    const threshold = now - windowMs;
    const pruned = list.filter((ts) => ts > threshold);
    this.timestamps.set(scope, pruned);
    return pruned;
  }

  public check(scope: RateLimitScope): RateLimitCheckResult {
    const now = Date.now();
    const config = this.getConfig(scope);
    const active = this.prune(scope, config.windowMs, now);

    const remaining = Math.max(0, config.maxRequests - active.length);
    const allowed = active.length < config.maxRequests;
    const oldest = active.length > 0 ? active[0] : now;
    const retryAfterMs = allowed ? 0 : Math.max(0, oldest + config.windowMs - now);
    const resetTimeMs = now + (retryAfterMs > 0 ? retryAfterMs : config.windowMs);

    return {
      allowed,
      remaining,
      limit: config.maxRequests,
      retryAfterMs,
      resetTimeMs,
      scope,
    };
  }

  public async acquire(scope: RateLimitScope, url?: string): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const config = this.getConfig(scope);
    const active = this.prune(scope, config.windowMs, now);

    if (active.length >= config.maxRequests) {
      const oldest = active[0];
      const retryAfterMs = Math.max(500, oldest + config.windowMs - now);
      const violation: RateLimitCheckResult = {
        allowed: false,
        remaining: 0,
        limit: config.maxRequests,
        retryAfterMs,
        resetTimeMs: now + retryAfterMs,
        scope,
      };

      this.listeners.forEach((listener) => {
        try {
          listener({ ...violation, url });
        } catch {}
      });

      throw new RateLimitError(
        `Rate limit exceeded for ${config.description || scope}. Please wait ${Math.ceil(retryAfterMs / 1000)}s before trying again.`,
        retryAfterMs,
        scope
      );
    }

    if (config.maxBurstDelayMs && active.length > config.maxRequests * 0.75) {
      const burstDelay = Math.min(
        config.maxBurstDelayMs,
        Math.floor((active.length / config.maxRequests) * config.maxBurstDelayMs)
      );
      if (burstDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, burstDelay));
      }
    }

    active.push(Date.now());
    this.timestamps.set(scope, active);

    return {
      allowed: true,
      remaining: config.maxRequests - active.length,
      limit: config.maxRequests,
      retryAfterMs: 0,
      resetTimeMs: now + config.windowMs,
      scope,
    };
  }

  public reset(scope?: RateLimitScope): void {
    if (scope) {
      this.timestamps.delete(scope);
    } else {
      this.timestamps.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();

export function classifyRequestScope(input: RequestInfo | URL, init?: RequestInit): RateLimitScope {
  const urlString = typeof input === 'string'
    ? input
    : input instanceof URL
    ? input.toString()
    : (input as Request)?.url || '';

  const lowerUrl = urlString.toLowerCase();
  const method = (init?.method || (input as Request)?.method || 'GET').toUpperCase();

  if (
    lowerUrl.includes('admin-2fa') ||
    lowerUrl.includes('admin_passkey') ||
    lowerUrl.includes('admin_2fa_verification')
  ) {
    return 'admin-2fa';
  }

  if (
    lowerUrl.includes('/admin') ||
    lowerUrl.includes('rpc/admin') ||
    (lowerUrl.includes('system_settings') && method !== 'GET') ||
    (lowerUrl.includes('audit_logs') && method === 'GET' && lowerUrl.includes('admin'))
  ) {
    return method !== 'GET' ? 'admin-operations' : 'admin';
  }

  if (lowerUrl.includes('superadmin') || lowerUrl.includes('audit_logs')) {
    return 'dashboard-superadmin';
  }
  if (lowerUrl.includes('pitches') || lowerUrl.includes('referees') || lowerUrl.includes('president')) {
    return 'dashboard-president';
  }
  if (lowerUrl.includes('match_events') || lowerUrl.includes('assignment_status') || lowerUrl.includes('referee')) {
    return 'dashboard-referee';
  }
  if (lowerUrl.includes('temporary_match_squad') || lowerUrl.includes('tactics_config') || lowerUrl.includes('team_id')) {
    return 'dashboard-team';
  }
  if (lowerUrl.includes('news_articles') || lowerUrl.includes('news') || lowerUrl.includes('journalist')) {
    return 'dashboard-journalist';
  }
  if (lowerUrl.includes('injuries') || lowerUrl.includes('medical') || lowerUrl.includes('doctor')) {
    return 'dashboard-doctor';
  }

  if (lowerUrl.includes('/auth/v1') || lowerUrl.includes('reauthenticate')) {
    return 'auth';
  }

  if (typeof window !== 'undefined' && window.location) {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('admin')) return 'dashboard-superadmin';
    if (hash.includes('president')) return 'dashboard-president';
    if (hash.includes('referee')) return 'dashboard-referee';
    if (hash.includes('team')) return 'dashboard-team';
    if (hash.includes('journalist')) return 'dashboard-journalist';
    if (hash.includes('doctor')) return 'dashboard-doctor';
    if (hash.includes('dashboard')) return 'dashboard';
  }

  return 'global';
}

function isPublicGuestRead(urlString: string, init?: RequestInit): boolean {
  const lowerUrl = urlString.toLowerCase();
  const method = (init?.method || 'GET').toUpperCase();

  if (lowerUrl.includes('get_guest_fixtures')) return true;

  if (method !== 'GET') return false;

  return (
    lowerUrl.includes('league_standings') ||
    lowerUrl.includes('/rest/v1/fixtures') ||
    lowerUrl.includes('/rest/v1/teams') ||
    lowerUrl.includes('/rest/v1/competitions')
  );
}

export async function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const nativeFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
  const scope = classifyRequestScope(input, init);

  const urlString = typeof input === 'string'
    ? input
    : input instanceof URL
    ? input.toString()
    : (input as Request)?.url || '';

  if (isPublicGuestRead(urlString, init)) {
    return nativeFetch(input, init);
  }

  try {
    const quota = await rateLimiter.acquire(scope, urlString);
    const response = await nativeFetch(input, init);

    if (response.status === 429) {
      rateLimiter.setConfig(scope, {
        ...rateLimiter.getConfig(scope),
        maxRequests: Math.max(2, Math.floor(quota.limit * 0.7)),
      });
    }

    return response;
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      const body = JSON.stringify({
        error: error.message,
        message: error.message,
        statusCode: 429,
        status: 429,
        retryAfter: error.retryAfterSeconds,
        scope: error.scope,
      });

      return new Response(body, {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(error.retryAfterSeconds),
          'X-RateLimit-Scope': error.scope,
        },
      });
    }
    throw error;
  }
}
