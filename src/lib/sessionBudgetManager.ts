// ============================================================================
// SESSION BUDGET & EGRESS GUARD
// Tracks calls and estimated data transfer per session in sessionStorage.
// Prevents runaway client loops from draining the project quota.
// ============================================================================

export interface SessionUsage {
  totalCalls: number;
  dashboardCalls: number;
  estimatedBytes: number;
  isBudgetExceeded: boolean;
  exceededReason?: string;
}

const STORAGE_KEY = 'esn_session_network_budget_v1';

// Generous caps to allow full legitimate usage while halting infinite loops
export const BUDGET_LIMITS = {
  MAX_TOTAL_CALLS: 400,
  MAX_DASHBOARD_CALLS: 200,
  MAX_ESTIMATED_BYTES: 35 * 1024 * 1024, // 35 MB per session (entire DB is ~42 MB)
};

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

export function getSessionUsage(): SessionUsage {
  const storage = getStorage();
  if (!storage) {
    return {
      totalCalls: 0,
      dashboardCalls: 0,
      estimatedBytes: 0,
      isBudgetExceeded: false,
    };
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        totalCalls: 0,
        dashboardCalls: 0,
        estimatedBytes: 0,
        isBudgetExceeded: false,
      };
    }
    const parsed = JSON.parse(raw);
    const isExceeded =
      parsed.dashboardCalls >= BUDGET_LIMITS.MAX_DASHBOARD_CALLS ||
      parsed.totalCalls >= BUDGET_LIMITS.MAX_TOTAL_CALLS ||
      parsed.estimatedBytes >= BUDGET_LIMITS.MAX_ESTIMATED_BYTES;

    let reason: string | undefined;
    if (parsed.dashboardCalls >= BUDGET_LIMITS.MAX_DASHBOARD_CALLS) {
      reason = `Dashboard call limit reached (${parsed.dashboardCalls}/${BUDGET_LIMITS.MAX_DASHBOARD_CALLS}).`;
    } else if (parsed.totalCalls >= BUDGET_LIMITS.MAX_TOTAL_CALLS) {
      reason = `Total session call limit reached (${parsed.totalCalls}/${BUDGET_LIMITS.MAX_TOTAL_CALLS}).`;
    } else if (parsed.estimatedBytes >= BUDGET_LIMITS.MAX_ESTIMATED_BYTES) {
      reason = `Session data transfer cap reached (${(parsed.estimatedBytes / (1024 * 1024)).toFixed(1)} MB / 35 MB).`;
    }

    return {
      totalCalls: parsed.totalCalls || 0,
      dashboardCalls: parsed.dashboardCalls || 0,
      estimatedBytes: parsed.estimatedBytes || 0,
      isBudgetExceeded: isExceeded,
      exceededReason: reason,
    };
  } catch {
    return {
      totalCalls: 0,
      dashboardCalls: 0,
      estimatedBytes: 0,
      isBudgetExceeded: false,
    };
  }
}

export function recordSessionCall(isDashboard = false, estimatedBytes = 2048): boolean {
  const storage = getStorage();
  if (!storage) return true;

  try {
    const current = getSessionUsage();
    if (current.isBudgetExceeded) {
      return false; // blocked
    }

    const updated = {
      totalCalls: current.totalCalls + 1,
      dashboardCalls: current.dashboardCalls + (isDashboard ? 1 : 0),
      estimatedBytes: current.estimatedBytes + estimatedBytes,
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
    } catch {}
  }
}
