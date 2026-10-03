// ============================================================================
// DERIVE ADMIN STATE — pure projection of an AdminRawSnapshot into every
// figure the console renders. No invented floors, ratios or placeholders:
// when a metric cannot be measured from the data it is reported as 0.
// ============================================================================

import type {
  ActivityFeedItem,
  AdminPlayerRow,
  AuditLogRecord,
  FailedApiCallRecord,
  HourlyTrafficData,
  JournalistOverviewSummary,
  PageVisitAnalytics,
  PlatformErrorItem,
  PlatformHealthMetrics,
  PlatformPerformanceMetrics,
  PresidentOverviewSummary,
  RefereeOverviewSummary,
  SupabaseSlowQuery,
  TeamOverviewSummary,
  UserProfileRow,
} from '../types';
import type { AdminRawSnapshot } from './adminSnapshot';

export interface DerivedAdminState {
  platformHealth: PlatformHealthMetrics;
  userDirectory: UserProfileRow[];
  playersList: AdminPlayerRow[];
  auditLogs: AuditLogRecord[];
  activityFeed: ActivityFeedItem[];
  platformErrors: PlatformErrorItem[];
  failedCalls: FailedApiCallRecord[];
  journalistOverview: JournalistOverviewSummary;
  teamOverview: TeamOverviewSummary;
  refereeOverview: RefereeOverviewSummary;
  presidentOverview: PresidentOverviewSummary;
  performanceMetrics: PlatformPerformanceMetrics;
  hourlyTraffic: HourlyTrafficData[];
  pageVisitAnalytics: PageVisitAnalytics[] | null;
  slowQueries: SupabaseSlowQuery[];
  storageUsageMb: number;
}

const CHAMPIONSHIP_COMPETITION_ID = '22222222-2222-2222-2222-222222222222';
const DAY_MS = 86_400_000;

const fullName = (p: any, fallback = ''): string =>
  `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || fallback;

const toMs = (iso?: string | null): number => (iso ? new Date(iso).getTime() : NaN);

function isSuspended(p: any): boolean {
  return p?.status === 'suspended' || Boolean(p?.bio?.includes('[SUSPENDED]'));
}

export function deriveAdminState(
  snapshot: AdminRawSnapshot,
  probe: { uptimePercentage: number; avgLoginTimeMs: number; realtimeLatencyMs: number }
): DerivedAdminState {
  const {
    profiles: allProfiles,
    teams: allTeams,
    players: allPlayers,
    fixtures: allFixtures,
    articles: allArticles,
    announcements: allAnnouncements,
    auditLogs: allAuditLogs,
    matchReports: allMatchReports,
    adminErrorLogs,
    devices: devicesList,
    matchEvents: allMatchEvents,
    matchLineups: allMatchLineups,
    admin2Analytics,
    storageObjects,
  } = snapshot;

  const nowTs = Date.now();
  const oneDayAgoIso = new Date(nowTs - DAY_MS).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  // --- Role counters -------------------------------------------------------
  const byRole = (role: string) => allProfiles.filter((p) => p.role?.toLowerCase() === role);
  const referees = byRole('referee');
  const journalists = byRole('journalist');
  const coaches = byRole('coach');
  const captains = byRole('captain');
  const revokedCount = allProfiles.filter(isSuspended).length;
  const scheduledFix = allFixtures.filter((f) => {
    const s = String(f.status || '').toUpperCase();
    return s === 'UPCOMING' || s === 'SCHEDULED' || s === 'LIVE';
  });
  const completedFix = allFixtures.filter((f) => {
    const s = String(f.status || '').toUpperCase();
    return s === 'FT' || s === 'FINISHED' || s === 'COMPLETED';
  });

  const realActiveToday = allProfiles.filter((p) => p.updated_at && p.updated_at >= oneDayAgoIso).length;
  const realOnline = allProfiles.filter((p) => p.updated_at && nowTs - toMs(p.updated_at) < 15 * 60 * 1000).length;

  const platformHealth: PlatformHealthMetrics = {
    totalUsers: snapshot.profilesTotalCount,
    activeUsersToday: realActiveToday,
    onlineUsers: realOnline,
    revokedUsers: revokedCount,
    uptimePercentage: probe.uptimePercentage,
    totalTeams: allTeams.length,
    totalPlayers: allPlayers.length,
    totalReferees: referees.length,
    totalJournalists: journalists.length,
    totalCoaches: coaches.length,
    totalCaptains: captains.length,
    totalArticles: allArticles.length,
    scheduledMatches: scheduledFix.length,
    completedMatches: completedFix.length,
  };

  // --- User directory ------------------------------------------------------
  const teamById = new Map<string, any>(allTeams.map((t) => [t.id, t]));
  const profileById = new Map<string, any>(allProfiles.map((p) => [p.id, p]));
  const playerByProfileId = new Map<string, any>();
  allPlayers.forEach((pl) => {
    if (pl.profile_id && !playerByProfileId.has(pl.profile_id)) playerByProfileId.set(pl.profile_id, pl);
  });

  const userDirectory: UserProfileRow[] = allProfiles.map((p) => {
    const matchingTeam = allTeams.find((t) => t.coach_id === p.id || t.captain_id === p.id);
    const playerEntry = playerByProfileId.get(p.id);
    const playerTeam = playerEntry ? teamById.get(playerEntry.team_id) : null;
    const profileTeam = p.team_id ? teamById.get(p.team_id) : null;
    const displayTeam = matchingTeam?.name || playerTeam?.name || profileTeam?.name || 'General';

    return {
      id: p.id,
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      name: fullName(p) || p.email || 'User',
      role: p.role as UserProfileRow['role'],
      email: p.email,
      phone: p.phone || 'N/A',
      teamName: displayTeam,
      lastLogin: new Date(p.updated_at || p.created_at).toLocaleDateString(),
      status: isSuspended(p) ? 'suspended' : 'active',
      avatarUrl: p.avatar_url,
    };
  });

  // --- Players -------------------------------------------------------------
  const playersList: AdminPlayerRow[] = allPlayers.map((pl) => {
    const matchingProf = pl.profile_id ? profileById.get(pl.profile_id) : null;
    const matchingTeam = teamById.get(pl.team_id);
    const name = (pl.first_name || pl.last_name) ? fullName(pl) : fullName(matchingProf, 'Player');

    return {
      id: pl.id,
      profileId: pl.profile_id,
      name: name || 'Squad Player',
      firstName: pl.first_name || matchingProf?.first_name || '',
      lastName: pl.last_name || matchingProf?.last_name || '',
      email: matchingProf?.email || 'N/A',
      phone: pl.phone || matchingProf?.phone || 'N/A',
      studentId: pl.student_id || 'N/A',
      jerseyNumber: pl.jersey_number || 0,
      position: pl.position || 'MID',
      teamId: pl.team_id || '',
      teamName: matchingTeam?.name || 'Unassigned',
      teamLogo: matchingTeam?.logo_url,
      status: pl.status || 'Fit',
      isApproved: Boolean(pl.is_approved || matchingProf?.is_verified),
      registeredAt: new Date(pl.created_at || Date.now()).toLocaleDateString(),
    };
  });

  // --- Audit logs ----------------------------------------------------------
  const auditLogs: AuditLogRecord[] = allAuditLogs.map((log) => {
    const userProf = profileById.get(log.user_id);
    return {
      id: log.id,
      timestamp: new Date(log.created_at).toLocaleString(),
      userId: log.user_id,
      userName: userProf ? fullName(userProf) : 'System Engine',
      userRole: log.user_role || userProf?.role || 'system',
      action: log.action,
      affectedRecord: log.resource_id || log.resource_type || 'platform',
      resourceType: log.resource_type || 'system',
      ipAddress: log.ip_address || 'n/a',
      status: /ERROR|FAIL/i.test(log.action || '') ? 'failed' : 'success',
      details: log.details ? JSON.stringify(log.details) : undefined,
    };
  });

  // --- Activity feed (sorted by real timestamps, not locale strings) ------
  const feed: Array<ActivityFeedItem & { ts: number }> = [];
  const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  allArticles.slice(0, 5).forEach((art) => {
    const author = profileById.get(art.author_id);
    feed.push({
      id: `art-${art.id}`,
      ts: toMs(art.created_at),
      timestamp: timeLabel(art.created_at),
      user: author ? fullName(author) : 'Journalist',
      role: 'journalist',
      action: art.status === 'published' ? 'published article' : 'created draft',
      details: `"${art.title}"`,
      iconType: 'journalist',
    });
  });

  [...allMatchReports]
    .sort((a, b) => toMs(b.submitted_at) - toMs(a.submitted_at))
    .slice(0, 5)
    .forEach((rep) => {
      const ref = profileById.get(rep.official_id);
      feed.push({
        id: `rep-${rep.id}`,
        ts: toMs(rep.submitted_at),
        timestamp: timeLabel(rep.submitted_at),
        user: ref ? fullName(ref) : 'Official Referee',
        role: 'referee',
        action: 'submitted match report',
        details: `Official report for fixture ${rep.fixture_id?.slice(0, 8)}`,
        iconType: 'referee',
      });
    });

  allProfiles.slice(0, 5).forEach((prof) => {
    feed.push({
      id: `prof-${prof.id}`,
      ts: toMs(prof.created_at),
      timestamp: timeLabel(prof.created_at),
      user: fullName(prof, prof.email || 'User'),
      role: prof.role,
      action: 'registered account',
      details: `New ${prof.role} onboarded to platform`,
      iconType: prof.role as ActivityFeedItem['iconType'],
    });
  });

  allAuditLogs.slice(0, 5).forEach((log) => {
    const actor = profileById.get(log.user_id);
    feed.push({
      id: `audit-${log.id}`,
      ts: toMs(log.created_at),
      timestamp: timeLabel(log.created_at),
      user: actor ? fullName(actor) : 'System Engine',
      role: log.user_role || 'system',
      action: String(log.action || '').toLowerCase().replace(/_/g, ' '),
      details: log.resource_type ? `${log.resource_type}${log.resource_id ? ` · ${String(log.resource_id).slice(0, 8)}` : ''}` : 'platform',
      iconType: (log.user_role as ActivityFeedItem['iconType']) || 'system',
    });
  });

  const activityFeed: ActivityFeedItem[] = feed
    .filter((f) => !Number.isNaN(f.ts))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 15)
    .map(({ ts: _ts, ...item }) => item);

  // --- Errors --------------------------------------------------------------
  const errorLogs = allAuditLogs.filter(
    (l) => l.action?.includes('ERROR') || l.action?.includes('FAIL') || l.action?.includes('SUSPEND')
  );

  const platformErrors: PlatformErrorItem[] = errorLogs.map((errLog, idx) => ({
    id: errLog.id || `err-${idx}`,
    timestamp: timeLabel(errLog.created_at),
    source: errLog.resource_type || 'System Engine',
    errorType: errLog.action,
    message: errLog.details
      ? (typeof errLog.details === 'string' ? errLog.details : JSON.stringify(errLog.details))
      : `Event logged for ${errLog.action}`,
    severity: errLog.action?.includes('SUSPEND') ? 'medium' : 'high',
    details: `Audit ID: ${errLog.id} | User: ${errLog.user_id || 'System'} | Action: ${errLog.action}`,
    resolved: false,
  }));

  const failedCalls: FailedApiCallRecord[] = [];
  adminErrorLogs.forEach((el: any) => {
    failedCalls.push({
      id: el.id,
      timestamp: timeLabel(el.created_at),
      endpoint: `/rest/v1/fixtures/${el.fixture_id ? String(el.fixture_id).slice(0, 8) : 'stats'}`,
      method: 'POST',
      statusCode: 422,
      errorName: el.module_name || 'Calculation Error',
      plainExplanation: el.error_message || 'A match statistics calculation failed database business logic validation.',
      rootCause: 'Data inconsistency or missing foreign key in match events table during finalization.',
      actionToFix: 'Verify match roster entries and ensure jersey numbers are correctly registered.',
      resolved: false,
    });
  });
  errorLogs.forEach((al: any) => {
    failedCalls.push({
      id: `audit-${al.id}`,
      timestamp: timeLabel(al.created_at),
      endpoint: `/rest/v1/${al.resource_type || 'platform'}`,
      method: 'PATCH/POST',
      statusCode: 403,
      errorName: al.action,
      plainExplanation: typeof al.details === 'string' ? al.details : (al.details?.reason || 'Security policy blocked an unauthorized operation.'),
      rootCause: `Action ${al.action} blocked on ${al.resource_type} table.`,
      actionToFix: 'Check user role privileges or verify database Row Level Security policies.',
      resolved: false,
    });
  });
  // Tables the snapshot could not read are surfaced as real failed calls.
  snapshot.timings.filter((t) => t.error).forEach((t) => {
    failedCalls.push({
      id: `snapshot-${t.table}-${snapshot.fetchedAt}`,
      timestamp: timeLabel(new Date(snapshot.fetchedAt).toISOString()),
      endpoint: `/rest/v1/${t.table}`,
      method: 'GET',
      statusCode: /permission denied/i.test(t.error || '') ? 403 : 500,
      errorName: /permission denied/i.test(t.error || '') ? 'PermissionDenied' : 'QueryFailed',
      plainExplanation: t.error || 'Query failed.',
      rootCause: /permission denied/i.test(t.error || '')
        ? 'The signed-in role has no SELECT grant or RLS policy on this table.'
        : 'PostgREST returned an error for this query.',
      actionToFix: 'Apply migration 78 (admin read grants) and refresh.',
      resolved: false,
    });
  });

  // --- Journalist overview -------------------------------------------------
  const publishedArt = allArticles.filter((a) => a.status === 'published');
  const draftsArt = allArticles.filter((a) => a.status === 'draft');
  const topArt = [...publishedArt].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))[0] || null;
  const latestArt = publishedArt[0] || null;
  const totalArticleViews = allArticles.reduce((sum, a) => sum + (Number(a.views) || 0), 0);
  const authorName = (id: string) => {
    const j = profileById.get(id);
    return j ? fullName(j, 'Journalist') : 'Journalist';
  };

  const journalistOverview: JournalistOverviewSummary = {
    totalJournalists: journalists.length,
    articlesToday: allArticles.filter((a) => toMs(a.created_at) >= todayStartMs).length,
    draftsCount: draftsArt.length,
    publishedCount: publishedArt.length,
    flaggedCount: allArticles.filter((a) => a.status === 'flagged').length,
    totalViews: totalArticleViews,
    mostViewedArticle: topArt
      ? { id: topArt.id, title: topArt.title, views: Number(topArt.views) || 0, author: authorName(topArt.author_id) }
      : null,
    latestPublication: latestArt
      ? {
          id: latestArt.id,
          title: latestArt.title,
          author: authorName(latestArt.author_id),
          publishedAt: new Date(latestArt.published_at || latestArt.created_at).toLocaleDateString(),
        }
      : null,
    journalistsList: journalists.map((j) => {
      const authorArticles = allArticles.filter((a) => a.author_id === j.id);
      const views = authorArticles.reduce((s, a) => s + (Number(a.views) || 0), 0);
      return {
        id: j.id,
        name: fullName(j) || j.email,
        email: j.email,
        articlesCount: authorArticles.length,
        totalViews: views,
        impressions: views,
        status: isSuspended(j) ? 'suspended' : 'active',
        latestPublishDate: authorArticles[0]
          ? new Date(authorArticles[0].created_at).toLocaleDateString()
          : 'No articles yet',
      };
    }),
  };

  // --- Team overview -------------------------------------------------------
  const avgP = allTeams.length > 0 ? Math.round(allPlayers.length / allTeams.length) : 0;
  const squadCompPercent = allTeams.length > 0
    ? Math.min(100, Math.round((allPlayers.length / (allTeams.length * 11)) * 100))
    : 0;

  const mappedTeamsList: TeamOverviewSummary['teamsList'] = allTeams.map((t) => {
    const coach = profileById.get(t.coach_id);
    const captain = profileById.get(t.captain_id);
    const teamPlayers = allPlayers.filter((p) => p.team_id === t.id);
    const teamPlayerCount = teamPlayers.length;
    const status: 'complete' | 'incomplete' | 'attention_needed' =
      !coach || !captain ? 'attention_needed' : teamPlayerCount < 11 ? 'incomplete' : 'complete';

    const isChamp =
      t.competition_id === CHAMPIONSHIP_COMPETITION_ID ||
      t.competition_id?.includes('2222') ||
      t.name?.toLowerCase().includes('championship');
    const league: 'EPL' | 'Championship' = isChamp ? 'Championship' : 'EPL';

    const hasUploadedKits = Boolean(
      (Array.isArray(t.kits_config) && t.kits_config.length > 0) ||
      (t.kits_config && typeof t.kits_config === 'object' && !Array.isArray(t.kits_config) && Object.keys(t.kits_config).length > 0)
    );

    let rawXIIds: string[] = [];
    if (t.starting_xi_str && typeof t.starting_xi_str === 'string') {
      rawXIIds = t.starting_xi_str.split(',').map((id: string) => id.trim()).filter(Boolean);
    } else if (Array.isArray(t.temporary_match_squad?.startingXI)) {
      rawXIIds = t.temporary_match_squad.startingXI.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
    }

    const teamPlayerIds = new Set(teamPlayers.map((p) => p.id));
    const verifiedXI = rawXIIds.filter((id) => teamPlayerIds.has(id));
    const hasLineupSubmitted = allMatchLineups.some(
      (ml) => ml.team_id === t.id && Array.isArray(ml.starting_xi) && ml.starting_xi.length >= 11
    );
    const hasArrangedSquad = verifiedXI.length >= 11 || hasLineupSubmitted;

    let rawSubIds: string[] = [];
    if (t.substitutes_str && typeof t.substitutes_str === 'string') {
      rawSubIds = t.substitutes_str.split(',').map((id: string) => id.trim()).filter(Boolean);
    } else if (Array.isArray(t.temporary_match_squad?.substitutes)) {
      rawSubIds = t.temporary_match_squad.substitutes.map((p: any) => (typeof p === 'string' ? p : p?.id)).filter(Boolean);
    }
    const hasSubsInLineup = allMatchLineups.some(
      (ml) => ml.team_id === t.id && Array.isArray(ml.substitutes) && ml.substitutes.length > 0
    );
    const verifiedSubs = rawSubIds.filter((id) => teamPlayerIds.has(id) && !verifiedXI.includes(id));
    const hasSubstitutes = hasArrangedSquad && (verifiedSubs.length > 0 || hasSubsInLineup);

    const hasMatchEvents = allMatchEvents.some((ev) => ev.team_id === t.id);

    const hasUploadedLogo = Boolean(
      t.logo_url &&
      typeof t.logo_url === 'string' &&
      t.logo_url.trim().length > 10 &&
      !t.logo_url.startsWith('data:') &&
      !t.logo_url.includes('placeholder')
    );

    const readinessScore = [hasUploadedKits, hasArrangedSquad, hasMatchEvents, hasUploadedLogo].filter(Boolean).length;
    const readinessPercentage = Math.round((readinessScore / 4) * 100);

    let resolvedCaptainName = 'Unassigned';
    const inMatchCapId = t.tactics_config?.roles?.captainId || t.temporary_match_squad?.roles?.captainId;
    if (inMatchCapId) {
      const inMatchCap = allPlayers.find((p) => p.id === inMatchCapId || p.profile_id === inMatchCapId);
      if (inMatchCap) {
        const capProf = profileById.get(inMatchCap.profile_id);
        resolvedCaptainName = (inMatchCap.first_name || inMatchCap.last_name)
          ? fullName(inMatchCap)
          : fullName(capProf, 'Team Captain');
      }
    }
    if (resolvedCaptainName === 'Unassigned' && captain) {
      resolvedCaptainName = fullName(captain);
    }

    return {
      id: t.id,
      name: t.name,
      logoUrl: t.logo_url,
      coachName: coach ? fullName(coach, 'Head Coach') : 'Unassigned',
      captainName: resolvedCaptainName,
      playersCount: teamPlayerCount,
      league,
      hasUploadedKits,
      hasArrangedSquad,
      hasSubstitutes,
      substitutesCount: verifiedSubs.length,
      hasMatchEvents,
      hasUploadedLogo,
      coachHasSubmittedXI: hasArrangedSquad,
      readinessScore,
      readinessPercentage,
      status,
      lastSubmission: new Date(t.updated_at || t.created_at).toLocaleDateString(),
    };
  });

  const teamWithLatestSquad = allTeams
    .filter((t) => mappedTeamsList.find((mt) => mt.id === t.id)?.hasArrangedSquad)
    .sort((a, b) => toMs(b.updated_at || b.created_at) - toMs(a.updated_at || a.created_at))[0];
  const latestCoach = teamWithLatestSquad ? profileById.get(teamWithLatestSquad.coach_id) : null;

  const avgReadinessPercentage = mappedTeamsList.length > 0
    ? Math.round(mappedTeamsList.reduce((acc, t) => acc + t.readinessPercentage, 0) / mappedTeamsList.length)
    : 0;

  const teamOverview: TeamOverviewSummary = {
    totalTeams: allTeams.length,
    avgPlayersPerTeam: avgP,
    avgSquadCompletion: squadCompPercent,
    avgReadinessPercentage,
    practiceSchedulesCount: allTeams.filter((t) => {
      const ps = t.practice_schedule;
      if (!ps) return false;
      if (Array.isArray(ps)) return ps.length > 0;
      if (typeof ps === 'object') return Object.keys(ps).length > 0;
      return String(ps).trim().length > 0;
    }).length,
    upcomingFixturesCount: scheduledFix.length,
    latestSquadSubmission: teamWithLatestSquad
      ? {
          teamName: teamWithLatestSquad.name,
          submittedAt: new Date(teamWithLatestSquad.updated_at || teamWithLatestSquad.created_at).toLocaleDateString(),
          coachName: latestCoach ? fullName(latestCoach, 'Head Coach') : 'Head Coach',
        }
      : null,
    teamsNeedingAttentionCount: allTeams.filter((t) => !t.coach_id || !t.captain_id).length,
    teamsList: mappedTeamsList,
  };

  // --- Referee overview ----------------------------------------------------
  const fixtureById = new Map<string, any>(allFixtures.map((f) => [f.id, f]));
  const reportedFixtureIds = new Set(allMatchReports.map((r) => r.fixture_id));
  const unassignedRefs = referees.filter(
    (r) => !allFixtures.some((f) => f.referee_id === r.id && (f.status === 'LIVE' || f.status === 'UPCOMING'))
  );
  const pendingMatchReports = completedFix.filter((f) => !reportedFixtureIds.has(f.id)).length;

  // Real turnaround: minutes between kick-off + 90' and the report submission.
  const turnaroundSamples = allMatchReports
    .map((rep) => {
      const fx = fixtureById.get(rep.fixture_id);
      if (!fx?.scheduled_time || !rep.submitted_at) return NaN;
      const expectedEnd = toMs(fx.scheduled_time) + 90 * 60 * 1000;
      return (toMs(rep.submitted_at) - expectedEnd) / 60000;
    })
    .filter((m) => Number.isFinite(m) && m >= 0 && m < 7 * 24 * 60);
  const avgReportCompletionTimeMins = turnaroundSamples.length > 0
    ? Math.round(turnaroundSamples.reduce((a, b) => a + b, 0) / turnaroundSamples.length)
    : 0;

  const refereeOverview: RefereeOverviewSummary = {
    totalReferees: referees.length,
    availableReferees: unassignedRefs.length,
    assignedToday: allFixtures.filter((f) => f.referee_id && toMs(f.scheduled_time) >= todayStartMs && toMs(f.scheduled_time) < todayStartMs + DAY_MS).length,
    completedMatches: completedFix.length,
    pendingReportsCount: pendingMatchReports,
    cancelledMatchesCount: allFixtures.filter((f) => f.status === 'POSTPONED' || f.status === 'CANCELLED').length,
    avgReportCompletionTimeMins,
    refereesList: referees.map((r) => {
      const assigned = allFixtures.filter((f) => f.referee_id === r.id);
      const reportsCount = allMatchReports.filter((m) => m.official_id === r.id).length;
      const finished = assigned.filter((f) => {
        const s = String(f.status || '').toUpperCase();
        return s === 'FT' || s === 'FINISHED' || s === 'COMPLETED';
      });
      const pendingCount = finished.filter((f) => !reportedFixtureIds.has(f.id)).length;
      // Share of finished assignments that have a filed report, on a 0–5 scale.
      const performanceRating = finished.length > 0
        ? Number(((finished.length - pendingCount) / finished.length * 5).toFixed(1))
        : 0;
      return {
        id: r.id,
        name: fullName(r) || r.email,
        email: r.email,
        assignedFixturesCount: assigned.length,
        completedFixturesCount: reportsCount,
        pendingReportsCount: pendingCount,
        status: assigned.some((f) => f.status === 'LIVE' || f.status === 'UPCOMING') ? 'assigned' : 'available',
        performanceRating,
      };
    }),
  };

  // --- President overview --------------------------------------------------
  const fixtureGenerationLogs = allAuditLogs.filter((l) =>
    /FIXTURE|SEASON|GENERAT/i.test(String(l.action || '')) || l.resource_type === 'fixtures' || l.resource_type === 'base_fixtures'
  );
  const competitionsInPlay = new Set(allFixtures.map((f) => f.competition_id).filter(Boolean));

  const presidentOverview: PresidentOverviewSummary = {
    totalAnnouncements: allAnnouncements.length,
    fixtureGenerationsCount: fixtureGenerationLogs.length,
    currentCompetition: competitionsInPlay.has(CHAMPIONSHIP_COMPETITION_ID) && competitionsInPlay.size > 1
      ? 'Egerton Premier League & Championship'
      : 'Egerton Campus Premier League',
    latestBroadcastsCount: allAnnouncements.filter((a) => nowTs - toMs(a.created_at) < 7 * DAY_MS).length,
    latestActions: allAnnouncements.map((a) => {
      const author = profileById.get(a.author_id);
      return {
        id: a.id,
        action: `Published announcement: "${a.title}"`,
        timestamp: new Date(a.created_at).toLocaleString(),
        user: author ? fullName(author, 'League President') : 'League President',
      };
    }),
  };

  // --- Performance telemetry (measured) -----------------------------------
  const storageBytes = storageObjects.reduce((sum, o) => sum + (Number(o.metadata?.size) || 0), 0);
  const storageUsageMb = Number((storageBytes / (1024 * 1024)).toFixed(1));
  const uploadsToday = storageObjects.filter((o) => toMs(o.created_at) >= todayStartMs).length;
  const okTimings = snapshot.timings.filter((t) => !t.error);
  const avgApiResponseMs = okTimings.length > 0
    ? Math.round(okTimings.reduce((s, t) => s + t.durationMs, 0) / okTimings.length)
    : snapshot.batchDurationMs;
  const dbLatencyMs = okTimings.length > 0 ? Math.min(...okTimings.map((t) => t.durationMs)) : 0;

  const devicesSeenToday = devicesList.filter((d) => toMs(d.last_seen_at) >= todayStartMs);
  const perHourToday = new Array<number>(24).fill(0);
  devicesSeenToday.forEach((d) => {
    perHourToday[new Date(d.last_seen_at).getHours()] += 1;
  });
  const articlesLast7Days = allArticles.filter((a) => nowTs - toMs(a.created_at) < 7 * DAY_MS).length;

  const performanceMetrics: PlatformPerformanceMetrics = {
    avgUserUptimePercentage: probe.uptimePercentage,
    avgLoginTimeMs: probe.avgLoginTimeMs,
    avgApiResponseMs,
    dbLatencyMs,
    realtimeLatencyMs: probe.realtimeLatencyMs,
    storageUsageMb,
    articlesPerDay: Number((articlesLast7Days / 7).toFixed(1)),
    uploadsToday,
    // Not observable from the schema; reported as 0 rather than invented.
    avgSessionDurationMins: 0,
    peakConcurrentUsers: Math.max(0, ...perHourToday),
    activeSessionsCount: realOnline,
  };

  const hourlyTraffic: HourlyTrafficData[] = perHourToday.map((users, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    users,
    pageViews: 0,
    apiRequests: 0,
  }));

  // Page analytics exist only when the guest client has written them.
  let pageVisitAnalytics: PageVisitAnalytics[] | null = null;
  const pCur = admin2Analytics?.pageViewsCurrent?.perDay;
  if (pCur) {
    const entries: Array<[string, string, number]> = [
      ['/home', 'Main Matchday Feed & Top Stories', Number(pCur.homepage) || 0],
      ['/fixtures', 'Campus League Fixtures & Results', Number(pCur.fixtures) || 0],
      ['/standings', 'Premier League Table & Form Guide', Number(pCur.standings) || 0],
      ['/match-details', 'Live Match Center & Realtime Events', Number(pCur.matchDetails) || 0],
      ['/team-details', 'Club Rosters, Pitch Tactics & Kits', Number(pCur.teamsProfiles) || 0],
      ['/form', 'Form Tables & Tactical Streaks', Number(pCur.formTables) || 0],
      ['/other', 'Other Campus Sports Portals', Number(pCur.otherPages) || 0],
    ];
    const total = entries.reduce((s, [, , v]) => s + v, 0);
    pageVisitAnalytics = entries.map(([route, title, visits]) => ({
      route,
      title,
      visits,
      uniqueVisitors: 0,
      percentageShare: total ? Math.round((visits / total) * 100) : 0,
      avgDwellTime: 'n/a',
      bounceRate: 'n/a',
    }));
  }

  // Measured query timings for the actual admin batch, slowest first.
  const slowQueries: SupabaseSlowQuery[] = [...snapshot.timings]
    .filter((t) => !t.error)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 6)
    .map((t) => ({
      id: `q-${t.table}`,
      query: `${t.table}: ${t.query}`,
      durationMs: t.durationMs,
      tableName: t.table,
      recommendedIndex: `${t.rows} rows returned in ${t.durationMs}ms (measured on this session's admin snapshot).`,
      isOptimized: t.durationMs < 400,
    }));

  return {
    platformHealth,
    userDirectory,
    playersList,
    auditLogs,
    activityFeed,
    platformErrors,
    failedCalls,
    journalistOverview,
    teamOverview,
    refereeOverview,
    presidentOverview,
    performanceMetrics,
    hourlyTraffic,
    pageVisitAnalytics,
    slowQueries,
    storageUsageMb,
  };
}
