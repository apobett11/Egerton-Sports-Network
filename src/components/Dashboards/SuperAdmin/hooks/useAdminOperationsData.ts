import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { isTabVisible } from '../../../../lib/tabVisibility';
import { supabase } from '../../../../lib/supabase';
import { rateLimiter } from '../../../../lib/rateLimiter';
import { isSessionActive } from '../../../../lib/inactivityManager';
import { canMakeDashboardCall } from '../../../../lib/sessionBudgetManager';
import {
  fetchAdminSnapshot,
  readCachedSnapshot,
  writeCachedSnapshot,
  isSnapshotFresh,
  type AdminRawSnapshot,
} from '../lib/adminSnapshot';
import { deriveAdminState, type DerivedAdminState } from '../lib/deriveAdminState';
import type {
  AdminTabType,
  SystemHealthMetrics,
  FailedApiCallRecord,
  PlatformInsightItem,
  PageVisitAnalytics,
  HealthStatusType,
} from '../types';

/** Background health probe cadence. Each probe is four cheap requests. */
const PROBE_INTERVAL_MS = 2 * 60 * 1000;
const REALTIME_PROBE_TIMEOUT_MS = 4000;

interface ProbeStats {
  attempts: number;
  successes: number;
  /** Rolling mean of the auth round-trip (ms). */
  avgAuthMs: number;
  /** Last measured realtime subscribe round-trip (ms); 0 when unmeasured. */
  realtimeLatencyMs: number;
}

const INITIAL_PROBE: ProbeStats = { attempts: 0, successes: 0, avgAuthMs: 0, realtimeLatencyMs: 0 };

const EMPTY_HEALTH: SystemHealthMetrics = {
  apiStatus: 'healthy',
  apiLatencyMs: 0,
  dbStatus: 'healthy',
  dbLatencyMs: 0,
  authStatus: 'healthy',
  storageStatus: 'healthy',
  realtimeStatus: 'healthy',
  lastChecked: '—',
};

function statusFor(ms: number, error: unknown, warnAt: number, offlineAt: number): HealthStatusType {
  if (error) return 'warning';
  if (ms >= offlineAt) return 'offline';
  if (ms >= warnAt) return 'warning';
  return 'healthy';
}

/** Measures how long the realtime socket takes to acknowledge a subscription. */
async function measureRealtimeLatency(): Promise<number> {
  return new Promise<number>((resolve) => {
    const t0 = performance.now();
    let settled = false;
    const channel = supabase.channel(`admin-probe-${Date.now()}`);
    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      try {
        supabase.removeChannel(channel);
      } catch {}
      resolve(value);
    };
    const timer = setTimeout(() => finish(0), REALTIME_PROBE_TIMEOUT_MS);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        finish(Math.round(performance.now() - t0));
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer);
        finish(0);
      }
    });
  });
}

export const useAdminOperationsData = () => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [snapshot, setSnapshot] = useState<AdminRawSnapshot | null>(() => readCachedSnapshot());
  const [isLoading, setIsLoading] = useState<boolean>(() => readCachedSnapshot() === null);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [probeStats, setProbeStats] = useState<ProbeStats>(INITIAL_PROBE);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics>(EMPTY_HEALTH);
  const [runtimeFailedCalls, setRuntimeFailedCalls] = useState<FailedApiCallRecord[]>([]);
  const [isProbeRunning, setIsProbeRunning] = useState<boolean>(true);
  const [probeCount, setProbeCount] = useState<number>(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const [isAdmin2Unlocked, setIsAdmin2Unlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('esn_admin_2_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [isAdmin2FaVerified, setIsAdmin2FaVerified] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('esn_admin_2fa_verified') === 'true') return true;
      const weeklyClearedUntil = localStorage.getItem('esn_admin_2fa_cleared_until');
      return Boolean(weeklyClearedUntil && Number(weeklyClearedUntil) > Date.now());
    } catch {
      return false;
    }
  });

  // Search / filter state
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  // Modal state
  const [activeModal, setActiveModal] = useState<
    'journalist' | 'team' | 'referee' | 'president' | 'user_detail' | 'error_detail' | 'announcement' | 'settings' | null
  >(null);
  const [selectedItemForModal, setSelectedItemForModal] = useState<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // ---------------------------------------------------------------------------
  // Derived state: everything the console renders comes from the snapshot.
  // ---------------------------------------------------------------------------
  const derived: DerivedAdminState | null = useMemo(() => {
    if (!snapshot) return null;
    const uptimePercentage = probeStats.attempts > 0
      ? Number(((probeStats.successes / probeStats.attempts) * 100).toFixed(2))
      : 100;
    return deriveAdminState(snapshot, {
      uptimePercentage,
      avgLoginTimeMs: Math.round(probeStats.avgAuthMs),
      realtimeLatencyMs: probeStats.realtimeLatencyMs,
    });
  }, [snapshot, probeStats]);

  const lastSyncedLabel = useMemo(
    () => (snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString() : '—'),
    [snapshot]
  );

  // Rate-limit violations feed the failed-calls telemetry.
  useEffect(() => {
    const unsubscribe = rateLimiter.onRateLimit((violation) => {
      setRuntimeFailedCalls((prev) => [
        {
          id: `rate-limit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: violation.url || `/api/${violation.scope}`,
          method: 'GLOBAL',
          statusCode: 429,
          errorName: 'RateLimitExceeded',
          plainExplanation: `Rate limit triggered on ${violation.scope} (Quota: ${violation.limit} calls per window).`,
          rootCause: 'High volume request burst or automated polling.',
          actionToFix: `Wait ${Math.ceil(violation.retryAfterMs / 1000)}s before sending further requests.`,
          resolved: false,
        },
        ...prev.slice(0, 49),
      ]);
      if (violation.scope.startsWith('admin')) {
        showToast(`Admin Rate Limit: Quota exceeded for ${violation.scope}. Cooldown: ${Math.ceil(violation.retryAfterMs / 1000)}s`);
      }
    });
    return unsubscribe;
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // Snapshot loading: cache-first, revalidate when stale, force on demand.
  // ---------------------------------------------------------------------------
  const loadSnapshot = useCallback(async (mode: 'auto' | 'force' = 'auto') => {
    if (inFlightRef.current) return inFlightRef.current;

    const cached = readCachedSnapshot();
    if (mode === 'auto' && isSnapshotFresh(cached)) {
      setSnapshot(cached);
      setIsLoading(false);
      return;
    }
    if (!isSessionActive() || !isTabVisible()) {
      // Never leave the console on the connecting screen because the tab is idle.
      if (cached) setSnapshot(cached);
      setIsLoading(false);
      return;
    }

    const budget = canMakeDashboardCall();
    if (!budget.allowed) {
      if (cached) setSnapshot(cached);
      setIsLoading(false);
      setErrorMsg(budget.reason || 'Session call budget reached.');
      return;
    }

    const hasSomethingToShow = Boolean(cached || snapshot);
    if (hasSomethingToShow) setIsRevalidating(true);
    else setIsLoading(true);
    setErrorMsg(null);

    const run = (async () => {
      try {
        const fresh = await fetchAdminSnapshot();
        setSnapshot(fresh);
        setProbeStats((prev) => ({ ...prev, attempts: prev.attempts + 1, successes: prev.successes + 1 }));
        setSystemHealth((prev) => ({
          ...prev,
          apiStatus: statusFor(fresh.batchDurationMs, null, 1500, 5000),
          apiLatencyMs: fresh.batchDurationMs,
          dbStatus: fresh.timings.some((t) => t.error) ? 'warning' : statusFor(fresh.batchDurationMs, null, 1500, 5000),
          dbLatencyMs: Math.min(...fresh.timings.filter((t) => !t.error).map((t) => t.durationMs), fresh.batchDurationMs),
          lastChecked: new Date().toLocaleTimeString(),
        }));
      } catch (err: any) {
        console.error('Error loading admin snapshot:', err);
        setProbeStats((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
        setErrorMsg(err?.message || 'Failed to load system data from Supabase.');
        if (cached) setSnapshot(cached);
      } finally {
        setIsLoading(false);
        setIsRevalidating(false);
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = run;
    return run;
  }, [snapshot]);

  // Mount: serve the cache instantly and revalidate only if stale.
  useEffect(() => {
    loadSnapshot('auto');
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadSnapshot('auto');
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entering Admin 2 gets a stale-check, never an unconditional re-pull.
  useEffect(() => {
    if (activeTab === 'admin_2') loadSnapshot('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /** Optimistically patch cached raw rows so the UI reflects an action immediately. */
  const patchSnapshot = useCallback((mutate: (draft: AdminRawSnapshot) => void) => {
    setSnapshot((prev) => {
      if (!prev) return prev;
      const draft: AdminRawSnapshot = {
        ...prev,
        profiles: prev.profiles.map((p) => ({ ...p })),
        players: prev.players.map((p) => ({ ...p })),
        announcements: [...prev.announcements],
        auditLogs: [...prev.auditLogs],
      };
      mutate(draft);
      writeCachedSnapshot(draft);
      return draft;
    });
  }, []);

  const appendAuditRow = useCallback((draft: AdminRawSnapshot, row: Record<string, any>) => {
    draft.auditLogs.unshift({ id: `local-${Date.now()}`, created_at: new Date().toISOString(), ...row });
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleSuspendUser = useCallback(async (userId: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const user = derived?.userDirectory.find((u) => u.id === userId);
      if (!user) return;

      const updatedBio = `[SUSPENDED] Account suspended by Admin on ${new Date().toLocaleDateString()}`;
      const { error } = await supabase.from('profiles').update({ bio: updatedBio }).eq('id', userId);
      if (error) throw error;

      const auditRow = {
        user_id: userId,
        user_role: user.role,
        action: 'SUSPEND_USER',
        resource_type: 'profiles',
        resource_id: userId,
        details: { email: user.email, reason: 'Admin suspended account' },
      };
      await supabase.from('audit_logs').insert(auditRow);

      patchSnapshot((draft) => {
        const row = draft.profiles.find((p) => p.id === userId);
        if (row) row.bio = updatedBio;
        appendAuditRow(draft, auditRow);
      });
      showToast(`User ${user.name} has been suspended.`);
    } catch (err: any) {
      console.error('Error suspending user:', err);
      showToast(`Failed to suspend user: ${err.message}`);
    }
  }, [derived, patchSnapshot, appendAuditRow, showToast]);

  const handleActivateUser = useCallback(async (userId: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const user = derived?.userDirectory.find((u) => u.id === userId);
      if (!user) return;

      const { error } = await supabase.from('profiles').update({ bio: '' }).eq('id', userId);
      if (error) throw error;

      const auditRow = {
        user_id: userId,
        user_role: user.role,
        action: 'ACTIVATE_USER',
        resource_type: 'profiles',
        resource_id: userId,
        details: { email: user.email, reason: 'Admin restored account access' },
      };
      await supabase.from('audit_logs').insert(auditRow);

      patchSnapshot((draft) => {
        const row = draft.profiles.find((p) => p.id === userId);
        if (row) row.bio = '';
        appendAuditRow(draft, auditRow);
      });
      showToast(`User ${user.name} access restored.`);
    } catch (err: any) {
      console.error('Error activating user:', err);
      showToast(`Failed to activate user: ${err.message}`);
    }
  }, [derived, patchSnapshot, appendAuditRow, showToast]);

  const handleChangeUserRole = useCallback(async (userId: string, newRole: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const user = derived?.userDirectory.find((u) => u.id === userId);
      if (!user) return;
      const oldRole = user.role;

      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;

      const auditRow = {
        user_id: userId,
        user_role: newRole,
        action: 'CHANGE_USER_ROLE',
        resource_type: 'profiles',
        resource_id: userId,
        details: { oldRole, newRole, updated_by: 'admin' },
      };
      await supabase.from('audit_logs').insert(auditRow);

      patchSnapshot((draft) => {
        const row = draft.profiles.find((p) => p.id === userId);
        if (row) row.role = newRole;
        appendAuditRow(draft, auditRow);
      });
      showToast(`User ${user.name} role changed to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      console.error('Error changing user role:', err);
      showToast(`Failed to change role: ${err.message}`);
    }
  }, [derived, patchSnapshot, appendAuditRow, showToast]);

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'PASSWORD_RESET_TRIGGERED',
        resource_type: 'auth.users',
        resource_id: email,
        details: { triggered_by: 'admin' },
      });
      showToast(`Password reset link dispatched to ${email}`);
    } catch (err: any) {
      showToast(`Password reset failed for ${email}: ${err?.message || 'auth service error'}`);
    }
  }, [showToast]);

  const handlePostAnnouncement = useCallback(async (title: string, content: string, targetRole: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id;

      const { data: inserted, error } = await supabase
        .from('announcements')
        .insert({ title, content, target_role: targetRole, author_id: adminId || null })
        .select('*')
        .maybeSingle();
      if (error) throw error;

      const auditRow = {
        user_id: adminId || null,
        user_role: 'admin',
        action: 'CREATE_ANNOUNCEMENT',
        resource_type: 'announcements',
        details: { title, targetRole },
      };
      await supabase.from('audit_logs').insert(auditRow);

      patchSnapshot((draft) => {
        draft.announcements.unshift(
          inserted || { id: `local-${Date.now()}`, title, content, target_role: targetRole, author_id: adminId, created_at: new Date().toISOString() }
        );
        appendAuditRow(draft, auditRow);
      });
      showToast('Platform announcement published successfully!');
    } catch (err: any) {
      console.error('Error posting announcement:', err);
      showToast(`Failed to post announcement: ${err.message}`);
    }
  }, [patchSnapshot, appendAuditRow, showToast]);

  const handleApprovePlayer = useCallback(async (playerId: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const pl = derived?.playersList.find((p) => p.id === playerId);
      const { error } = await supabase.from('players').update({ is_approved: true, status: 'Fit' }).eq('id', playerId);
      if (error) throw error;
      if (pl?.profileId) {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', pl.profileId);
      }
      patchSnapshot((draft) => {
        const row = draft.players.find((p) => p.id === playerId);
        if (row) {
          row.is_approved = true;
          row.status = 'Fit';
        }
        if (pl?.profileId) {
          const prof = draft.profiles.find((p) => p.id === pl.profileId);
          if (prof) prof.is_verified = true;
        }
      });
      showToast(`Player ${pl?.name || ''} approved and activated successfully!`);
    } catch (err: any) {
      showToast(`Failed to approve player: ${err.message}`);
    }
  }, [derived, patchSnapshot, showToast]);

  const handleRejectPlayer = useCallback(async (playerId: string) => {
    try {
      await rateLimiter.acquire('admin-operations');
      const pl = derived?.playersList.find((p) => p.id === playerId);
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
      patchSnapshot((draft) => {
        draft.players = draft.players.filter((p) => p.id !== playerId);
      });
      showToast(`Removed ${pl?.name || 'player'} from squad.`);
    } catch (err: any) {
      showToast(`Failed to remove player: ${err.message}`);
    }
  }, [derived, patchSnapshot, showToast]);

  const handleExportAuditLogsCSV = useCallback(() => {
    const auditLogs = derived?.auditLogs || [];
    if (auditLogs.length === 0) {
      showToast('No audit logs available to export.');
      return;
    }

    const headers = ['Timestamp', 'User Name', 'Role', 'Action', 'Resource', 'IP Address', 'Status'];
    const rows = auditLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.affectedRecord}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported to CSV file.');
  }, [derived, showToast]);

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  const userDirectory = useMemo(() => derived?.userDirectory ?? [], [derived]);
  const auditLogs = useMemo(() => derived?.auditLogs ?? [], [derived]);

  const filteredUsers = useMemo(() => {
    const term = userSearchTerm.toLowerCase();
    return userDirectory.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone.includes(userSearchTerm);
      const matchesRole = userRoleFilter === 'ALL' || user.role.toLowerCase() === userRoleFilter.toLowerCase();
      const matchesStatus = userStatusFilter === 'ALL' || user.status === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [userDirectory, userSearchTerm, userRoleFilter, userStatusFilter]);

  const filteredAuditLogs = useMemo(() => {
    const term = auditSearchTerm.toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.affectedRecord.toLowerCase().includes(term);
      const matchesRole = auditRoleFilter === 'ALL' || log.userRole.toLowerCase() === auditRoleFilter.toLowerCase();
      const matchesAction = auditActionFilter === 'ALL' || log.action.toUpperCase().includes(auditActionFilter.toUpperCase());
      return matchesSearch && matchesRole && matchesAction;
    });
  }, [auditLogs, auditSearchTerm, auditRoleFilter, auditActionFilter]);

  // ---------------------------------------------------------------------------
  // Insights, computed from the derived figures only
  // ---------------------------------------------------------------------------
  const platformInsights = useMemo<PlatformInsightItem[]>(() => {
    const insights: PlatformInsightItem[] = [];
    if (!derived) return insights;
    const { refereeOverview, teamOverview, journalistOverview, playersList, storageUsageMb } = derived;

    if (refereeOverview.pendingReportsCount > 0) {
      insights.push({
        id: 'ins-ref',
        severity: 'critical',
        title: `${refereeOverview.pendingReportsCount} referee match reports unsubmitted`,
        message: 'Matches finished without an official referee confirmation report.',
        actionRequired: 'Review Referee Overview',
        targetTab: 'overviews',
      });
    }
    if (teamOverview.teamsNeedingAttentionCount > 0) {
      insights.push({
        id: 'ins-team',
        severity: 'warning',
        title: `${teamOverview.teamsNeedingAttentionCount} teams require leadership assignment`,
        message: 'Teams missing either an assigned Head Coach or Team Captain.',
        actionRequired: 'Inspect Team Overview',
        targetTab: 'overviews',
      });
    }
    const pendingPlayers = playersList.filter((p) => !p.isApproved).length;
    if (pendingPlayers > 0) {
      insights.push({
        id: 'ins-players',
        severity: 'warning',
        title: `${pendingPlayers} player registrations awaiting approval`,
        message: 'Registered players are not eligible for selection until approved.',
        actionRequired: 'Open Player Approvals',
        targetTab: 'players',
      });
    }
    if (journalistOverview.flaggedCount > 0) {
      insights.push({
        id: 'ins-news',
        severity: 'warning',
        title: `${journalistOverview.flaggedCount} news articles awaiting moderation`,
        message: 'Articles carrying an editorial flag.',
        actionRequired: 'Inspect Journalist Overview',
        targetTab: 'overviews',
      });
    }
    const failedTables = snapshot?.timings.filter((t) => t.error) ?? [];
    if (failedTables.length > 0) {
      insights.push({
        id: 'ins-grants',
        severity: 'critical',
        title: `${failedTables.length} tables could not be read by the admin session`,
        message: failedTables.map((t) => `${t.table}: ${t.error}`).join(' · '),
        actionRequired: 'Open Health Diagnostics',
        targetTab: 'health',
      });
    }
    insights.push({
      id: 'ins-storage',
      severity: 'info',
      title: `Team logo storage at ${storageUsageMb} MB`,
      message: `${snapshot?.storageObjects.length ?? 0} objects measured in the team-logos bucket.`,
      actionRequired: 'View Storage Telemetry',
      targetTab: 'health',
    });
    if (failedTables.length === 0 && !errorMsg) {
      insights.push({
        id: 'ins-sys',
        severity: 'success',
        title: 'All admin data sources readable',
        message: `Snapshot of ${snapshot?.timings.length ?? 0} tables completed in ${snapshot?.batchDurationMs ?? 0}ms.`,
      });
    }
    return insights;
  }, [derived, snapshot, errorMsg]);

  // ---------------------------------------------------------------------------
  // Live health probe (measured, not simulated)
  // ---------------------------------------------------------------------------
  const runLiveDiagnostic = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRevalidating(true);
    try {
      const t0 = performance.now();
      const { error: dbErr } = await supabase.from('profiles').select('id', { head: true, count: 'exact' });
      const dbMs = Math.round(performance.now() - t0);

      const t1 = performance.now();
      const { error: authErr } = await supabase.auth.getUser();
      const authMs = Math.round(performance.now() - t1);

      const t2 = performance.now();
      const { error: storErr } = await supabase.storage.from('team-logos').list('logos', { limit: 1 });
      const storMs = Math.round(performance.now() - t2);

      const realtimeMs = await measureRealtimeLatency();

      const anyErr = dbErr || authErr || storErr;
      const avgMs = Math.round((dbMs + authMs + storMs) / 3);

      setSystemHealth({
        apiStatus: statusFor(avgMs, anyErr, 800, 3000),
        apiLatencyMs: avgMs,
        dbStatus: statusFor(dbMs, dbErr, 600, 3000),
        dbLatencyMs: dbMs,
        authStatus: authErr ? 'warning' : 'healthy',
        storageStatus: storErr ? 'warning' : 'healthy',
        realtimeStatus: realtimeMs > 0 ? 'healthy' : 'warning',
        lastChecked: new Date().toLocaleTimeString(),
      });

      setProbeStats((prev) => {
        const attempts = prev.attempts + 1;
        const successes = prev.successes + (anyErr ? 0 : 1);
        const avgAuthMs = prev.avgAuthMs === 0 ? authMs : prev.avgAuthMs * 0.7 + authMs * 0.3;
        return { attempts, successes, avgAuthMs, realtimeLatencyMs: realtimeMs || prev.realtimeLatencyMs };
      });

      if (anyErr) {
        const err = dbErr || authErr || storErr;
        setRuntimeFailedCalls((prev) => [
          {
            id: `diag-err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            endpoint: dbErr ? '/rest/v1/profiles' : authErr ? '/auth/v1/user' : '/storage/v1/object/list/team-logos',
            method: 'GET',
            statusCode: /permission denied/i.test(err?.message || '') ? 403 : 500,
            errorName: 'Diagnostic Probe Failure',
            plainExplanation: err?.message || 'A diagnostic query returned an unexpected response.',
            rootCause: dbErr ? 'Database grant/RLS or connectivity problem.' : authErr ? 'Auth service rejected the session token.' : 'Storage bucket unreadable.',
            actionToFix: 'Check the Supabase project status and the signed-in role grants.',
            resolved: false,
          },
          ...prev.slice(0, 49),
        ]);
      }

      setProbeCount((c) => c + 1);
      if (!isSilent) showToast('Live diagnostic completed.');
    } catch (err: any) {
      setProbeStats((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
      if (!isSilent) showToast(`Diagnostic failed: ${err.message}`);
    } finally {
      if (!isSilent) setIsRevalidating(false);
    }
  }, [showToast]);

  const toggleProbe = useCallback(() => {
    setIsProbeRunning((prev) => {
      const next = !prev;
      showToast(next ? `Health probe activated (${PROBE_INTERVAL_MS / 60000} min interval).` : 'Health probe paused.');
      return next;
    });
  }, [showToast]);

  useEffect(() => {
    if (!isProbeRunning) return;
    const interval = setInterval(() => {
      if (!isTabVisible() || !isSessionActive()) return;
      runLiveDiagnostic(true);
    }, PROBE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isProbeRunning, runLiveDiagnostic]);

  // ---------------------------------------------------------------------------
  // Admin 2 gate
  // ---------------------------------------------------------------------------
  const verifyAdmin2Password = useCallback(async (passwordInput: string): Promise<boolean> => {
    try {
      await rateLimiter.acquire('admin-operations');
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_2_security')
        .maybeSingle();
      if (error || !data?.value?.password) return false;
      return passwordInput.trim() === String(data.value.password).trim();
    } catch {
      return false;
    }
  }, []);

  const updateAdmin2Password = useCallback(async (newPassword: string): Promise<boolean> => {
    try {
      await rateLimiter.acquire('admin-operations');
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'admin_2_security', value: { password: newPassword, updated_at: new Date().toISOString() } });
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_ADMIN_2_PASSWORD',
        resource_type: 'system_settings',
        details: { updated_at: new Date().toISOString() },
      });
      showToast('Admin 2 Master Password updated in database.');
      return true;
    } catch (err: any) {
      showToast(`Failed to update password: ${err.message}`);
      return false;
    }
  }, [showToast]);

  /** Re-measures the batch; the "index advisor" reports real timings only. */
  const applyIndexOptimization = useCallback(() => {
    showToast('Re-measuring query timings against the live database…');
    loadSnapshot('force');
  }, [showToast, loadSnapshot]);

  const clearFailedCalls = useCallback(() => {
    setRuntimeFailedCalls([]);
    showToast('Runtime failed-call log cleared. Persisted database errors remain listed.');
  }, [showToast]);

  const unlockAdmin2 = useCallback(() => {
    setIsAdmin2Unlocked(true);
    try {
      sessionStorage.setItem('esn_admin_2_unlocked', 'true');
    } catch {}
    loadSnapshot('auto');
  }, [loadSnapshot]);

  const relockAdmin2 = useCallback(() => {
    setIsAdmin2Unlocked(false);
    try {
      sessionStorage.removeItem('esn_admin_2_unlocked');
    } catch {}
    setActiveTab('overview');
    showToast('Admin 2 locked.');
  }, [showToast]);

  const verify2FaClearance = useCallback((clearanceType: 'weekly' | 'single_session' = 'weekly') => {
    setIsAdmin2FaVerified(true);
    try {
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      if (clearanceType === 'weekly') {
        localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        showToast('Two-factor authentication clearance granted for 1 week.');
      } else {
        localStorage.removeItem('esn_admin_2fa_cleared_until');
        showToast('Emergency passkey accepted for current session.');
      }
    } catch {}
    loadSnapshot('auto');
  }, [showToast, loadSnapshot]);

  const refreshData = useCallback(() => {
    loadSnapshot('force');
  }, [loadSnapshot]);

  const failedCalls = useMemo(
    () => [...runtimeFailedCalls, ...(derived?.failedCalls ?? [])],
    [runtimeFailedCalls, derived]
  );

  const emptyPageAnalytics: PageVisitAnalytics[] = [];

  return {
    activeTab,
    setActiveTab,
    isLoading,
    isRevalidating,
    lastSyncedLabel,
    errorMsg,
    toastMessage,
    showToast,
    platformHealth: derived?.platformHealth ?? {
      totalUsers: 0, activeUsersToday: 0, onlineUsers: 0, revokedUsers: 0, uptimePercentage: 0,
      totalTeams: 0, totalPlayers: 0, totalReferees: 0, totalJournalists: 0, totalCoaches: 0,
      totalCaptains: 0, totalArticles: 0, scheduledMatches: 0, completedMatches: 0,
    },
    systemHealth,
    activityFeed: derived?.activityFeed ?? [],
    platformErrors: derived?.platformErrors ?? [],
    userDirectory,
    filteredUsers,
    userSearchTerm,
    setUserSearchTerm,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    auditLogs,
    filteredAuditLogs,
    auditSearchTerm,
    setAuditSearchTerm,
    auditRoleFilter,
    setAuditRoleFilter,
    auditActionFilter,
    setAuditActionFilter,
    journalistOverview: derived?.journalistOverview ?? {
      totalJournalists: 0, articlesToday: 0, draftsCount: 0, publishedCount: 0, flaggedCount: 0,
      totalViews: 0, mostViewedArticle: null, latestPublication: null, journalistsList: [],
    },
    teamOverview: derived?.teamOverview ?? {
      totalTeams: 0, avgPlayersPerTeam: 0, avgSquadCompletion: 0, practiceSchedulesCount: 0,
      upcomingFixturesCount: 0, latestSquadSubmission: null, teamsNeedingAttentionCount: 0, teamsList: [],
    },
    refereeOverview: derived?.refereeOverview ?? {
      totalReferees: 0, availableReferees: 0, assignedToday: 0, completedMatches: 0,
      pendingReportsCount: 0, cancelledMatchesCount: 0, avgReportCompletionTimeMins: 0, refereesList: [],
    },
    presidentOverview: derived?.presidentOverview ?? {
      totalAnnouncements: 0, fixtureGenerationsCount: 0, currentCompetition: '—', latestBroadcastsCount: 0, latestActions: [],
    },
    performanceMetrics: derived?.performanceMetrics ?? {
      avgUserUptimePercentage: 0, avgLoginTimeMs: 0, avgApiResponseMs: 0, dbLatencyMs: 0, realtimeLatencyMs: 0,
      storageUsageMb: 0, articlesPerDay: 0, uploadsToday: 0, avgSessionDurationMins: 0, peakConcurrentUsers: 0, activeSessionsCount: 0,
    },
    platformInsights,
    activeModal,
    setActiveModal,
    selectedItemForModal,
    setSelectedItemForModal,
    handleSuspendUser,
    handleActivateUser,
    handleChangeUserRole,
    handleResetPassword,
    handlePostAnnouncement,
    handleExportAuditLogsCSV,
    playersList: derived?.playersList ?? [],
    handleApprovePlayer,
    handleRejectPlayer,
    refreshData,
    failedCalls,
    slowQueries: derived?.slowQueries ?? [],
    hourlyTraffic: derived?.hourlyTraffic ?? [],
    pageVisitAnalytics: derived?.pageVisitAnalytics ?? emptyPageAnalytics,
    isAdmin2Unlocked,
    unlockAdmin2,
    relockAdmin2,
    isAdmin2FaVerified,
    verify2FaClearance,
    runLiveDiagnostic,
    isProbeRunning,
    toggleProbe,
    probeCount,
    verifyAdmin2Password,
    updateAdmin2Password,
    applyIndexOptimization,
    clearFailedCalls,
  };
};
