/**
 * UNIFIED DASHBOARD AUDIT & ACTIVITY LOGGING SERVICE
 * 
 * Strict Architectural Rules:
 * 1. DASHBOARDS ONLY: Rejects guest, storefront, and anonymous users.
 * 2. REPETITIVE ACTION AGGREGATION: Deduplicates repeated actions within a 15-second window,
 *    tracking aggregation counts to prevent log ingestion bloat.
 * 3. TEMPORARILY DISABLED: `IS_LOG_SAVING_ENABLED = false` halts all Supabase log ingestion
 *    during store testing to protect the 1 GB quota (currently at 0.85 GB / 85%).
 *    Can be reactivated simply by setting `IS_LOG_SAVING_ENABLED = true`.
 */

import { supabase } from '../lib/supabase';

// MASTER SWITCH: Currently disabled to protect Supabase Log Ingestion quota
export const IS_LOG_SAVING_ENABLED = false;

// Allowed dashboard roles authorized to create audit logs
export const DASHBOARD_AUTHORIZED_ROLES = new Set([
  'admin',
  'superadmin',
  'president',
  'coach',
  'captain',
  'referee',
  'journalist',
  'doctor',
  'system',
]);

export interface DashboardAuditEntry {
  user_id?: string | null;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  created_at?: string;
}

interface AggregatedLogKey {
  key: string;
  entry: DashboardAuditEntry;
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  timer?: any;
}

// In-memory aggregation buffer to coalesce repetitive rapid actions across dashboards
const aggregationBuffer = new Map<string, AggregatedLogKey>();
const AGGREGATION_WINDOW_MS = 15_000; // 15 seconds debounce/coalesce window

function getAggregationKey(entry: DashboardAuditEntry): string {
  const role = entry.user_role || 'unknown';
  const action = entry.action || 'unknown';
  const resType = entry.resource_type || 'unknown';
  const resId = entry.resource_id || 'none';
  return `${role}:${action}:${resType}:${resId}`;
}

export const DashboardLogService = {
  /**
   * Check if an actor is a dashboard user and not a guest or storefront shopper
   */
  isAuthorizedDashboardActor(role?: string): boolean {
    if (!role) return false;
    const cleanRole = role.toLowerCase().trim();
    if (
      cleanRole === 'guest' || 
      cleanRole === 'anon' || 
      cleanRole === 'anonymous' || 
      cleanRole === 'customer' || 
      cleanRole === 'shopper'
    ) {
      return false;
    }
    return DASHBOARD_AUTHORIZED_ROLES.has(cleanRole);
  },

  /**
   * Record a dashboard action with deduplication and aggregation.
   * If the exact same action is repeated rapidly, it bundles occurrences together.
   */
  async recordAction(entry: DashboardAuditEntry): Promise<void> {
    // 1. MASTER TOGGLE CHECK: Stop logs for now during testing
    if (!IS_LOG_SAVING_ENABLED) {
      return;
    }

    // 2. DASHBOARD SCOPE GUARD: strictly reject guest and storefront
    const role = entry.user_role?.toLowerCase().trim() || 'unknown';
    if (!this.isAuthorizedDashboardActor(role)) {
      return;
    }

    // 3. REPETITIVE ACTION DEDUPLICATION & AGGREGATION
    const key = getAggregationKey(entry);
    const now = Date.now();
    const existing = aggregationBuffer.get(key);

    if (existing && (now - existing.firstTimestamp < AGGREGATION_WINDOW_MS)) {
      existing.count += 1;
      existing.lastTimestamp = now;
      existing.entry.details = {
        ...(existing.entry.details || {}),
        ...(entry.details || {}),
        _aggregated_occurrences: existing.count,
        _last_occurrence_at: new Date(now).toISOString(),
      };

      if (existing.timer) clearTimeout(existing.timer);
      existing.timer = setTimeout(() => {
        this.flushAggregatedEntry(key);
      }, AGGREGATION_WINDOW_MS);
      return;
    }

    const newAgg: AggregatedLogKey = {
      key,
      entry: { ...entry, created_at: entry.created_at || new Date().toISOString() },
      count: 1,
      firstTimestamp: now,
      lastTimestamp: now,
    };

    newAgg.timer = setTimeout(() => {
      this.flushAggregatedEntry(key);
    }, 2000);

    aggregationBuffer.set(key, newAgg);
  },

  /**
   * Flush aggregated entry to Supabase audit_logs
   */
  async flushAggregatedEntry(key: string): Promise<void> {
    const item = aggregationBuffer.get(key);
    if (!item) return;
    aggregationBuffer.delete(key);

    if (!IS_LOG_SAVING_ENABLED) return;

    try {
      const payload = {
        user_id: item.entry.user_id || null,
        user_role: item.entry.user_role || 'system',
        action: item.entry.action,
        resource_type: item.entry.resource_type,
        resource_id: item.entry.resource_id || null,
        details: item.count > 1 
          ? { ...item.entry.details, _aggregated_count: item.count }
          : item.entry.details || null,
        ip_address: item.entry.ip_address || null,
        created_at: item.entry.created_at || new Date().toISOString(),
      };

      await supabase.from('audit_logs').insert(payload);
    } catch (err: any) {
      console.warn('[DashboardLogService] Failed to flush audit row:', err?.message);
    }
  },

  /**
   * Direct non-aggregated insert for high-importance one-off security operations (e.g. suspend user, password reset)
   */
  async recordDirect(entry: DashboardAuditEntry): Promise<void> {
    if (!IS_LOG_SAVING_ENABLED) return;
    if (!this.isAuthorizedDashboardActor(entry.user_role)) return;

    try {
      await supabase.from('audit_logs').insert({
        user_id: entry.user_id || null,
        user_role: entry.user_role || 'system',
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id || null,
        details: entry.details || null,
        ip_address: entry.ip_address || null,
        created_at: entry.created_at || new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('[DashboardLogService] Direct audit insert error:', err?.message);
    }
  }
};
