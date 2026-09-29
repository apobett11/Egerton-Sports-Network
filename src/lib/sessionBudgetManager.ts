// ============================================================================
// SESSION BUDGET & EGRESS GUARD
// Tracks calls and estimated data transfer per rolling window in sessionStorage.
// Prevents runaway client loops from draining the project quota without ever
// wedging a healthy tab: once the window elapses the counters reset on their own.
// ============================================================================

export interface SessionUsage {
  totalCalls: number;
  dashboardCalls: number;
  estimatedBytes: number;
  isBudgetExceeded: boolean;
  exceededReason?: string;
  /** Epoch ms at which the current window (and any block) resets. */
  windowResetsAt: number;
}

interface StoredUsage {
  windowStart: number;
  totalCalls: number;
  dashboardCalls: number;
  estimatedBytes: number;
}

const STORAGE_KEY = 'esn_session_network_budget_v2';
const LEGACY_STORAGE_KEY = 'esn_session_network_budget_v1';

// Generous caps to allow full legitimate usage while halting infinite loops.
// The caps apply per rolling window, not per tab lifetime.
export const BUDGET_LIMITS = {
  WINDOW_MS: 10 * 60 * 1000, // 10 minute rolling window
  MAX_TOTAL_CALLS: 400,
  MAX_DASHBOARD_CALLS: 200,
  MAX_ESTIMATED_BYTES: 35 * 1024 * 1024, // 35 MB per window (entire DB is ~42 MB)
};

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

function emptyStored(now = Date.now()): StoredUsage {
  return { windowStart: now, totalCalls: 0, dashboardCalls: 0, estimatedBytes: 0 };
}

function readStored(): StoredUsage {
  const storage = getStorage();
  const now = Date.now();
  if (!storage) return emptyStored(now);

  try {
    // Drop the pre-window format so an old wedged counter can't carry over.
    storage.removeItem(LEGACY_STORAGE_KEY);

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyStored(now);
    const parsed = JSON.parse(raw) as Partial<StoredUsage>;
    const windowStart = Number(parsed.windowStart) || now;
    if (now - windowStart >= BUDGET_LIMITS.WINDOW_MS) {
      return emptyStored(now);
    }
    return {
      windowStart,
      totalCalls: Number(parsed.totalCalls) || 0,
      dashboardCalls: Number(parsed.dashboardCalls) || 0,
      estimatedBytes: Number(parsed.estimatedBytes) || 0,
    };
  } catch {
    return emptyStored(now);
  }
}

function formatResetHint(resetsAt: number): string {
  const secs = Math.max(1, Math.ceil((resetsAt - Date.now()) / 1000));
  return secs >= 60 ? `${Math.ceil(secs / 60)} min` : `${secs}s`;
}

export function getSessionUsage(): SessionUsage {
  const stored = readStored();
  const windowResetsAt = stored.windowStart + BUDGET_LIMITS.WINDOW_MS;

  let reason: string | undefined;
  if (stored.dashboardCalls >= BUDGET_LIMITS.MAX_DASHBOARD_CALLS) {
    reason = `Dashboard call limit reached (${stored.dashboardCalls}/${BUDGET_LIMITS.MAX_DASHBOARD_CALLS}). Resets in ${formatResetHint(windowResetsAt)}.`;
  } else if (stored.totalCalls >= BUDGET_LIMITS.MAX_TOTAL_CALLS) {
    reason = `Total session call limit reached (${stored.totalCalls}/${BUDGET_LIMITS.MAX_TOTAL_CALLS}). Resets in ${formatResetHint(windowResetsAt)}.`;
  } else if (stored.estimatedBytes >= BUDGET_LIMITS.MAX_ESTIMATED_BYTES) {
    reason = `Session data transfer cap reached (${(stored.estimatedBytes / (1024 * 1024)).toFixed(1)} MB / 35 MB). Resets in ${formatResetHint(windowResetsAt)}.`;
  }

  return {
    totalCalls: stored.totalCalls,
    dashboardCalls: stored.dashboardCalls,
    estimatedBytes: stored.estimatedBytes,
    isBudgetExceeded: Boolean(reason),
    exceededReason: reason,
    windowResetsAt,
  };
}

export function recordSessionCall(isDashboard = false, estimatedBytes = 2048): boolean {
  const storage = getStorage();
  if (!storage) return true;

  try {
    const stored = readStored();
    const current = getSessionUsage();
    if (current.isBudgetExceeded) {
      return false; // blocked until the window rolls over
    }

    const updated: StoredUsage = {
      windowStart: stored.windowStart,
      totalCalls: stored.totalCalls + 1,
      dashboardCalls: stored.dashboardCalls + (isDashboard ? 1 : 0),
      estimatedBytes: stored.estimatedBytes + estimatedBytes,
    };

    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return true;
  }
}

export function canMakeDashboardCall(): { allowed: boolean; reason?: string } {
  const usage = getSessionUsage();
  if (usage.isBudgetExceeded) {
    return { allowed: false, reason: usage.exceededReason };
  }
  return { allowed: true };
}

export function resetSessionBudget(): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
  }
}
