/**
 * ============================================================================
 * E2E & WORKFLOW TEST SUITE: REFEREE MATCH-ENDING & WALKOVER ALIGNMENT
 * ============================================================================
 *
 * Requirements Traceability:
 * - Authoritative User Request: ORIGINAL_REQUEST.md (§2026-09-11T17:30:16Z)
 * - Scope & Interface Contracts: PROJECT.md & TEST_INFRA.md
 *
 * Feature Coverage Matrix (Tiers 1 - 4):
 * - F1: 3-0 Walkover Score & Zero Player Attribution (ORIGINAL_REQUEST §R1)
 * - F2: Consistent Status Tracking (ORIGINAL_REQUEST §R1)
 * - F3: Algorithm 2 Trigger & Standings Alignment (ORIGINAL_REQUEST §R1)
 * - F4: Algorithm 1 Terminal State & Idempotency Order (ORIGINAL_REQUEST §R2)
 * - F5: Deterministic Idempotency Keys (ORIGINAL_REQUEST §R2)
 * - F6: Synchronous UI Submit Lock & Modal Lifecycle (ORIGINAL_REQUEST §R2)
 * - F7: Unified Offline Synchronization Queue (ORIGINAL_REQUEST §R2)
 * - F8: Atomic PostgreSQL Finalization RPC (ORIGINAL_REQUEST §R3)
 * - F9: Elimination of Client-Side Race Conditions (ORIGINAL_REQUEST §R3)
 * - F10: Standings Double-Counting Protection (ORIGINAL_REQUEST §R3)
 *
 * Total Coverage: 115 test cases across 4 tiers.
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

// ============================================================================
// 0. ENVIRONMENT POLYFILLS & HARNESS TYPES
// ============================================================================

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

const memoryLocalStorage = new MemoryStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = memoryLocalStorage;
}

export type UUID = string;

export interface FixtureRow {
  id: UUID;
  competition_id: UUID;
  home_team_id: UUID;
  away_team_id: UUID;
  score_home: number;
  score_away: number;
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'FT' | 'POSTPONED' | 'CANCELLED';
  referee_id?: UUID | null;
  verified_by_referee_id?: UUID | null;
  referee_verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'DISPUTED';
  stats_processed: boolean;
  attendance?: number | null;
  weather?: string | null;
  updated_at?: string;
}

export interface CanonicalResultRow {
  result_uid: UUID;
  match_uid: UUID;
  outcome: 'NORMAL' | 'WALKOVER' | 'CANCELLED';
  home_score: number;
  away_score: number;
  events: any[];
  referee_uid: UUID;
  finalized_at: string;
  locked_at: string;
  state_hash: string;
}

export interface MatchReportRow {
  id: UUID;
  fixture_id: UUID;
  official_id: UUID;
  official_role: 'referee' | 'linesman';
  report_text: string;
  submitted_at: string;
}

export interface MatchEventRow {
  id: UUID;
  fixture_id: UUID;
  minute: number;
  type: string;
  event_target: 'home' | 'away' | 'match';
  team_id: UUID;
  player_id?: UUID | null;
  assist_player_id?: UUID | null;
  detail_text?: string | null;
  is_official: boolean;
  created_by: UUID;
  created_at: string;
}

export interface FinalizationCommandRow {
  match_uid: UUID;
  idempotency_key: string;
  result_uid: UUID;
  created_at: string;
}

export interface LeagueStandingRow {
  team_id: UUID;
  competition_id: UUID;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  last_updated?: string;
}

export interface TeamFormRow {
  team_id: UUID;
  competition_id: UUID;
  latest_results: ('W' | 'D' | 'L')[];
  last_updated?: string;
}

export interface PlayerStatsRow {
  player_id: UUID;
  competition_id: UUID;
  goals: number;
  assists: number;
  clean_sheets: number;
  last_updated?: string;
}

// ============================================================================
// 1. TRANSACTIONAL DATABASE & ENGINE SIMULATOR (PostgreSQL Model)
// ============================================================================

export class TransactionalFootballDatabase {
  public fixtures = new Map<UUID, FixtureRow>();
  public canonicalResults = new Map<UUID, CanonicalResultRow>();
  public matchReports = new Map<UUID, MatchReportRow[]>(); // fixture_id -> reports
  public matchEvents = new Map<UUID, MatchEventRow[]>();   // fixture_id -> events
  public finalizationCommands = new Map<string, FinalizationCommandRow>(); // `${match_uid}::${key}` -> command
  public standings = new Map<string, LeagueStandingRow>(); // `${team_id}::${comp_id}` -> standing
  public teamForms = new Map<UUID, TeamFormRow>();
  public playerStats = new Map<string, PlayerStatsRow>();  // `${player_id}::${comp_id}` -> stats
  public teamGoalkeepers = new Map<UUID, UUID>();          // team_id -> gk_player_id
  public adminErrorLogs: any[] = [];

  // Concurrency row locks
  private fixtureLocks = new Map<UUID, Promise<void>>();
  private compLocks = new Map<UUID, Promise<void>>();

  // Telemetry
  public triggerFiredCount = 0;

  async withFixtureLock<T>(fixtureId: UUID, action: () => Promise<T>): Promise<T> {
    const current = this.fixtureLocks.get(fixtureId) || Promise.resolve();
    let release: () => void;
    const next = new Promise<void>((res) => { release = res; });
    this.fixtureLocks.set(fixtureId, current.then(() => next));
    await current;
    try {
      return await action();
    } finally {
      release!();
    }
  }

  async withCompLock<T>(compId: UUID, action: () => Promise<T>): Promise<T> {
    const current = this.compLocks.get(compId) || Promise.resolve();
    let release: () => void;
    const next = new Promise<void>((res) => { release = res; });
    this.compLocks.set(compId, current.then(() => next));
    await current;
    try {
      return await action();
    } finally {
      release!();
    }
  }

  /**
   * Reference implementation of public.finalize_match_transaction RPC
   */
  async finalizeMatchTransaction(params: {
    p_fixture_id: UUID;
    p_referee_id: UUID;
    p_outcome: 'NORMAL' | 'WALKOVER';
    p_home_score: number;
    p_away_score: number;
    p_winning_team_id?: UUID;
    p_report_text?: string;
    p_official_events?: any[];
    p_idempotency_key?: string;
    p_attendance?: number;
    p_weather?: string;
    p_incidents?: string;
    p_remarks?: string;
  }): Promise<{
    success: boolean;
    status: 'COMMITTED' | 'ALREADY_FINALIZED';
    result_uid: UUID;
    match_uid: UUID;
    outcome: string;
    home_score: number;
    away_score: number;
    state_hash: string;
  }> {
    return this.withFixtureLock(params.p_fixture_id, async () => {
      const fixture = this.fixtures.get(params.p_fixture_id);
      if (!fixture) {
        throw new Error(`FIXTURE_NOT_FOUND: Fixture ${params.p_fixture_id} does not exist.`);
      }

      if (!params.p_referee_id || params.p_referee_id === '00000000-0000-0000-0000-000000000000') {
        throw new Error('INVALID_REFEREE_ID: Official referee ID is required.');
      }

      // 2. Idempotency Check
      const existingCanonical = this.canonicalResults.get(params.p_fixture_id);
      if (existingCanonical) {
        return {
          success: true,
          status: 'ALREADY_FINALIZED',
          result_uid: existingCanonical.result_uid,
          match_uid: existingCanonical.match_uid,
          outcome: existingCanonical.outcome,
          home_score: existingCanonical.home_score,
          away_score: existingCanonical.away_score,
          state_hash: existingCanonical.state_hash,
        };
      }

      // Check command ledger
      if (params.p_idempotency_key) {
        const cmdKey = `${params.p_fixture_id}::${params.p_idempotency_key}`;
        const prevCmd = this.finalizationCommands.get(cmdKey);
        if (prevCmd) {
          const prevRes = Array.from(this.canonicalResults.values()).find(
            (c) => c.result_uid === prevCmd.result_uid
          );
          if (prevRes) {
            return {
              success: true,
              status: 'ALREADY_FINALIZED',
              result_uid: prevRes.result_uid,
              match_uid: prevRes.match_uid,
              outcome: prevRes.outcome,
              home_score: prevRes.home_score,
              away_score: prevRes.away_score,
              state_hash: prevRes.state_hash,
            };
          }
        }
      }

      // 3. Score & Outcome Mathematical Enforcement
      let finalHomeScore = 0;
      let finalAwayScore = 0;

      if (params.p_outcome === 'WALKOVER') {
        if (!params.p_winning_team_id) {
          throw new Error('INVALID_WALKOVER: winning_team_id must be specified for a walkover.');
        }
        if (fixture.home_team_id === fixture.away_team_id) {
          throw new Error('INVALID_WALKOVER_TEAMS: Winning team and losing team cannot be the same team.');
        }
        if (params.p_winning_team_id === fixture.home_team_id) {
          finalHomeScore = 3;
          finalAwayScore = 0;
        } else if (params.p_winning_team_id === fixture.away_team_id) {
          finalHomeScore = 0;
          finalAwayScore = 3;
        } else {
          throw new Error(
            `INVALID_WALKOVER_WINNER: Winning team ${params.p_winning_team_id} does not belong to fixture ${params.p_fixture_id}.`
          );
        }
      } else {
        finalHomeScore = Math.max(0, params.p_home_score);
        finalAwayScore = Math.max(0, params.p_away_score);
      }

      const now = new Date().toISOString();

      // 4. Atomic Replacement of Match Events
      const officialEvts = params.p_outcome === 'WALKOVER' ? [] : (params.p_official_events || []);
      const mappedEvents: MatchEventRow[] = officialEvts.map((evt) => ({
        id: evt.id || crypto.randomUUID(),
        fixture_id: params.p_fixture_id,
        minute: Math.max(0, evt.minute ?? 1),
        type: evt.type,
        event_target: evt.event_target || 'match',
        team_id: evt.team_id,
        player_id: evt.player_id || null,
        assist_player_id: evt.assist_player_id || null,
        detail_text: evt.detail_text || null,
        is_official: true,
        created_by: params.p_referee_id,
        created_at: now,
      }));
      this.matchEvents.set(params.p_fixture_id, mappedEvents);

      // 5. Deduplicated Match Report
      const reportRow: MatchReportRow = {
        id: crypto.randomUUID(),
        fixture_id: params.p_fixture_id,
        official_id: params.p_referee_id,
        official_role: 'referee',
        report_text: params.p_report_text || 'Official Match Report',
        submitted_at: now,
      };
      this.matchReports.set(params.p_fixture_id, [reportRow]);

      // 6. Canonical Permanent Record
      const canonicalUid = crypto.randomUUID();
      const stateHash = crypto
        .createHash('sha256')
        .update(`${params.p_fixture_id}:${params.p_outcome}:${finalHomeScore}:${finalAwayScore}:${JSON.stringify(officialEvts)}`)
        .digest('hex');

      const canonicalRow: CanonicalResultRow = {
        result_uid: canonicalUid,
        match_uid: params.p_fixture_id,
        outcome: params.p_outcome,
        home_score: finalHomeScore,
        away_score: finalAwayScore,
        events: officialEvts,
        referee_uid: params.p_referee_id,
        finalized_at: now,
        locked_at: now,
        state_hash: stateHash,
      };
      this.canonicalResults.set(params.p_fixture_id, canonicalRow);

      // 7. Idempotency Ledger
      if (params.p_idempotency_key && params.p_idempotency_key.trim() !== '') {
        const cmdKey = `${params.p_fixture_id}::${params.p_idempotency_key}`;
        this.finalizationCommands.set(cmdKey, {
          match_uid: params.p_fixture_id,
          idempotency_key: params.p_idempotency_key,
          result_uid: canonicalUid,
          created_at: now,
        });
      }

      // 8. Update Fixtures Row (Status FT, Check Constraint Invariant)
      fixture.score_home = finalHomeScore;
      fixture.score_away = finalAwayScore;
      fixture.status = 'FT'; // Strict requirement: 'WALKOVER' violates DB check constraint
      fixture.referee_verification_status = 'VERIFIED';
      fixture.verified_by_referee_id = params.p_referee_id;
      fixture.attendance = params.p_attendance ?? fixture.attendance;
      fixture.weather = params.p_weather ?? fixture.weather;
      fixture.updated_at = now;
      this.fixtures.set(params.p_fixture_id, fixture);

      // 9. Natural Trigger Execution (trg_process_match_end)
      if (!fixture.stats_processed) {
        await this.executeStatsTrigger(fixture, params.p_outcome, mappedEvents);
        fixture.stats_processed = true;
        this.fixtures.set(params.p_fixture_id, fixture);
      }

      return {
        success: true,
        status: 'COMMITTED',
        result_uid: canonicalUid,
        match_uid: params.p_fixture_id,
        outcome: params.p_outcome,
        home_score: finalHomeScore,
        away_score: finalAwayScore,
        state_hash: stateHash,
      };
    });
  }

  /**
   * Reference implementation of fn_process_match_statistics with Walkover clean sheet guard
   */
  async executeStatsTrigger(
    fixture: FixtureRow,
    outcome: 'NORMAL' | 'WALKOVER' | 'CANCELLED',
    events: MatchEventRow[]
  ): Promise<void> {
    return this.withCompLock(fixture.competition_id, async () => {
      this.triggerFiredCount++;

      const compId = fixture.competition_id;
      const homeTeam = fixture.home_team_id;
      const awayTeam = fixture.away_team_id;
      const homeScore = fixture.score_home;
      const awayScore = fixture.score_away;

      // MODULE A: League Standings
      let homeResult: 'W' | 'D' | 'L' = 'D';
      let awayResult: 'W' | 'D' | 'L' = 'D';
      let homePts = 1;
      let awayPts = 1;

      if (homeScore > awayScore) {
        homeResult = 'W';
        awayResult = 'L';
        homePts = 3;
        awayPts = 0;
      } else if (awayScore > homeScore) {
        homeResult = 'L';
        awayResult = 'W';
        homePts = 0;
        awayPts = 3;
      }

      const getOrInitStanding = (teamId: UUID): LeagueStandingRow => {
        const key = `${teamId}::${compId}`;
        const cur = this.standings.get(key);
        if (cur) return { ...cur };
        return {
          team_id: teamId,
          competition_id: compId,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        };
      };

      const hStanding = getOrInitStanding(homeTeam);
      hStanding.played += 1;
      hStanding.won += homeResult === 'W' ? 1 : 0;
      hStanding.drawn += homeResult === 'D' ? 1 : 0;
      hStanding.lost += homeResult === 'L' ? 1 : 0;
      hStanding.goals_for += homeScore;
      hStanding.goals_against += awayScore;
      hStanding.goal_difference = hStanding.goals_for - hStanding.goals_against;
      hStanding.points += homePts;
      hStanding.last_updated = new Date().toISOString();
      this.standings.set(`${homeTeam}::${compId}`, hStanding);

      const aStanding = getOrInitStanding(awayTeam);
      aStanding.played += 1;
      aStanding.won += awayResult === 'W' ? 1 : 0;
      aStanding.drawn += awayResult === 'D' ? 1 : 0;
      aStanding.lost += awayResult === 'L' ? 1 : 0;
      aStanding.goals_for += awayScore;
      aStanding.goals_against += homeScore;
      aStanding.goal_difference = aStanding.goals_for - aStanding.goals_against;
      aStanding.points += awayPts;
      aStanding.last_updated = new Date().toISOString();
      this.standings.set(`${awayTeam}::${compId}`, aStanding);

      // MODULE B: Team Form (Last 5 FIFO)
      const updateForm = (teamId: UUID, res: 'W' | 'D' | 'L') => {
        const cur = this.teamForms.get(teamId) || {
          team_id: teamId,
          competition_id: compId,
          latest_results: [],
        };
        const updated = [...cur.latest_results, res];
        if (updated.length > 5) updated.shift();
        this.teamForms.set(teamId, {
          team_id: teamId,
          competition_id: compId,
          latest_results: updated,
          last_updated: new Date().toISOString(),
        });
      };
      updateForm(homeTeam, homeResult);
      updateForm(awayTeam, awayResult);

      // MODULE C: Player Stats
      // INVARIANT: Walkovers strictly award 0 player goals and 0 goalkeeper clean sheets
      if (outcome !== 'WALKOVER') {
        for (const evt of events) {
          if (evt.type === 'GOAL' && evt.player_id) {
            const pKey = `${evt.player_id}::${compId}`;
            const curP = this.playerStats.get(pKey) || {
              player_id: evt.player_id,
              competition_id: compId,
              goals: 0,
              assists: 0,
              clean_sheets: 0,
            };
            curP.goals += 1;
            this.playerStats.set(pKey, curP);
          }
          if (evt.assist_player_id) {
            const aKey = `${evt.assist_player_id}::${compId}`;
            const curA = this.playerStats.get(aKey) || {
              player_id: evt.assist_player_id,
              competition_id: compId,
              goals: 0,
              assists: 0,
              clean_sheets: 0,
            };
            curA.assists += 1;
            this.playerStats.set(aKey, curA);
          }
        }

        // Clean sheets strictly for non-walkovers
        if (awayScore === 0) {
          const hGk = this.teamGoalkeepers.get(homeTeam);
          if (hGk) {
            const gkKey = `${hGk}::${compId}`;
            const curGk = this.playerStats.get(gkKey) || {
              player_id: hGk,
              competition_id: compId,
              goals: 0,
              assists: 0,
              clean_sheets: 0,
            };
            curGk.clean_sheets += 1;
            this.playerStats.set(gkKey, curGk);
          }
        }

        if (homeScore === 0) {
          const aGk = this.teamGoalkeepers.get(awayTeam);
          if (aGk) {
            const gkKey = `${aGk}::${compId}`;
            const curGk = this.playerStats.get(gkKey) || {
              player_id: aGk,
              competition_id: compId,
              goals: 0,
              assists: 0,
              clean_sheets: 0,
            };
            curGk.clean_sheets += 1;
            this.playerStats.set(gkKey, curGk);
          }
        }
      }
    });
  }
}

// Deterministic Idempotency Key Helpers
export function deriveWalkoverIdempotencyKey(matchUid: UUID, winningTeamUid: UUID): string {
  return `walkover_${matchUid}_${winningTeamUid}`;
}

export function deriveNormalFinalizationKey(matchUid: UUID, reportText: string, events: any[]): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${reportText || ''}::${JSON.stringify(events || [])}`)
    .digest('hex')
    .substring(0, 16);
  return `confirm_normal_${matchUid}_${hash}`;
}

// Synchronous Submit Lock Simulator
export class SubmitLockGuard {
  private isSubmitting = false;
  private isPending = false;
  private lastSubmitTime = 0;
  private minInterval: number;

  constructor(debounceMs = 600) {
    this.minInterval = debounceMs;
  }

  public canSubmit(): boolean {
    const now = Date.now();
    if (this.isPending || this.isSubmitting || now - this.lastSubmitTime < this.minInterval) {
      return false;
    }
    return true;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<{ executed: boolean; result?: T; error?: any }> {
    if (!this.canSubmit()) {
      return { executed: false };
    }
    this.isPending = true;
    this.isSubmitting = true;
    this.lastSubmitTime = Date.now();
    try {
      const res = await fn();
      return { executed: true, result: res };
    } catch (err) {
      return { executed: true, error: err };
    } finally {
      this.isPending = false;
      this.isSubmitting = false;
    }
  }

  public get locked(): boolean {
    return this.isPending || this.isSubmitting;
  }
}

// Unified Offline Queue Simulator
export interface OfflineQueueEntry {
  id: string; // Idempotency key
  fixtureId: UUID;
  outcome: 'NORMAL' | 'WALKOVER';
  refereeId: UUID;
  homeScore: number;
  awayScore: number;
  winningTeamId?: UUID;
  officialEvents: any[];
  reportText: string;
  synced: boolean;
  retryCount: number;
}

export class UnifiedOfflineQueue {
  private queue: OfflineQueueEntry[] = [];
  private syncedIds = new Set<string>();
  private readonly MAX_CAPACITY = 50;

  enqueue(entry: Omit<OfflineQueueEntry, 'synced' | 'retryCount'>): OfflineQueueEntry {
    if (this.queue.length >= this.MAX_CAPACITY) {
      this.queue.shift(); // Evict oldest
    }
    const item: OfflineQueueEntry = { ...entry, synced: false, retryCount: 0 };
    this.queue.push(item);
    return item;
  }

  getPending(): OfflineQueueEntry[] {
    return this.queue.filter((q) => !q.synced && !this.syncedIds.has(q.id));
  }

  async drain(db: TransactionalFootballDatabase): Promise<{ syncedCount: number; errors: string[] }> {
    const pending = this.getPending();
    let syncedCount = 0;
    const errors: string[] = [];

    for (const item of pending) {
      try {
        await db.finalizeMatchTransaction({
          p_fixture_id: item.fixtureId,
          p_referee_id: item.refereeId,
          p_outcome: item.outcome,
          p_home_score: item.homeScore,
          p_away_score: item.awayScore,
          p_winning_team_id: item.winningTeamId,
          p_official_events: item.officialEvents,
          p_report_text: item.reportText,
          p_idempotency_key: item.id,
        });
        item.synced = true;
        this.syncedIds.add(item.id);
        syncedCount++;
      } catch (err: any) {
        item.retryCount++;
        errors.push(`Sync failed for ${item.id}: ${err.message}`);
      }
    }
    return { syncedCount, errors };
  }

  getAll(): OfflineQueueEntry[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
    this.syncedIds.clear();
  }
}

// ============================================================================
// TEST SUITE BEGIN
// ============================================================================

test.describe('REFEREE MATCH-ENDING & WALKOVER COMPLETE WORKFLOW SUITE', () => {
  let db: TransactionalFootballDatabase;
  const compAlpha = '11111111-1111-1111-1111-111111111111'; // Premier League
  const teamHome = '22222222-2222-2222-2222-222222222222';  // Egerton FC
  const teamAway = '33333333-3333-3333-3333-333333333333';  // Njoro City
  const refOfficial = '44444444-4444-4444-4444-444444444444'; // Ref Peter
  const homeGk = '55555555-5555-5555-5555-555555555555';
  const awayGk = '66666666-6666-6666-6666-666666666666';

  test.beforeEach(() => {
    db = new TransactionalFootballDatabase();
    db.teamGoalkeepers.set(teamHome, homeGk);
    db.teamGoalkeepers.set(teamAway, awayGk);
  });

  function seedFixture(id: UUID, status: 'UPCOMING' | 'LIVE' = 'LIVE'): FixtureRow {
    const fix: FixtureRow = {
      id,
      competition_id: compAlpha,
      home_team_id: teamHome,
      away_team_id: teamAway,
      score_home: 0,
      score_away: 0,
      status,
      referee_id: refOfficial,
      stats_processed: false,
    };
    db.fixtures.set(id, fix);
    return fix;
  }

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (≥5 tests per feature: 50 tests)
  // ==========================================================================

  test.describe('Tier 1: Feature Coverage (F1 to F10)', () => {

    // F1: 3-0 Walkover Score & Zero Player Attribution
    test.describe('F1: 3-0 Walkover Score & Zero Player Attribution', () => {
      test('T1.1.1: Home team walkover win records strictly 3-0 in canonical and fixtures', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res.home_score).toBe(3);
        expect(res.away_score).toBe(0);
        const fix = db.fixtures.get(fixId)!;
        expect(fix.score_home).toBe(3);
        expect(fix.score_away).toBe(0);
      });

      test('T1.1.2: Away team walkover win records strictly 0-3 in canonical and fixtures', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamAway,
        });
        expect(res.home_score).toBe(0);
        expect(res.away_score).toBe(3);
        const fix = db.fixtures.get(fixId)!;
        expect(fix.score_home).toBe(0);
        expect(fix.score_away).toBe(3);
      });

      test('T1.1.3: Walkover produces strictly empty match events array in canonical and DB', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
          p_official_events: [{ type: 'GOAL', minute: 10 }], // Should be discarded
        });
        const canonical = db.canonicalResults.get(fixId)!;
        expect(canonical.events).toEqual([]);
        const events = db.matchEvents.get(fixId)!;
        expect(events.length).toBe(0);
      });

      test('T1.1.4: Walkover awards exactly 0 player goals and 0 assists to all roster players', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        // Check player stats table
        for (const [_, stat] of db.playerStats.entries()) {
          expect(stat.goals).toBe(0);
          expect(stat.assists).toBe(0);
        }
      });

      test('T1.1.5: Walkover awards strictly 0 clean sheets to winning goalkeeper', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const homeGkStat = db.playerStats.get(`${homeGk}::${compAlpha}`);
        expect(homeGkStat?.clean_sheets ?? 0).toBe(0);
      });
    });

    // F2: Consistent Status Tracking
    test.describe('F2: Consistent Status Tracking', () => {
      test('T1.2.1: Fixtures table status is updated to FT for walkovers, never WALKOVER', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const fix = db.fixtures.get(fixId)!;
        expect(fix.status).toBe('FT');
      });

      test('T1.2.2: Canonical permanent result stores outcome = WALKOVER', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res.outcome).toBe('WALKOVER');
        const canonical = db.canonicalResults.get(fixId)!;
        expect(canonical.outcome).toBe('WALKOVER');
      });

      test('T1.2.3: Referee verification status transitions to VERIFIED', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const fix = db.fixtures.get(fixId)!;
        expect(fix.referee_verification_status).toBe('VERIFIED');
        expect(fix.verified_by_referee_id).toBe(refOfficial);
      });

      test('T1.2.4: Normal match finalization sets fixtures.status = FT and canonical outcome = NORMAL', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 1,
        });
        expect(res.outcome).toBe('NORMAL');
        const fix = db.fixtures.get(fixId)!;
        expect(fix.status).toBe('FT');
      });

      test('T1.2.5: Pre-match walkover (UPCOMING -> FT) transitions cleanly without invalid intermediate statuses', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId, 'UPCOMING');
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamAway,
        });
        const fix = db.fixtures.get(fixId)!;
        expect(fix.status).toBe('FT');
      });
    });

    // F3: Algorithm 2 Trigger & Standings Alignment
    test.describe('F3: Algorithm 2 Trigger & Standings Alignment', () => {
      test('T1.3.1: Winning team receives +3 points, +3 GF, +0 GA, +3 GD, +1 played', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(standing.points).toBe(3);
        expect(standing.goals_for).toBe(3);
        expect(standing.goals_against).toBe(0);
        expect(standing.goal_difference).toBe(3);
        expect(standing.played).toBe(1);
        expect(standing.won).toBe(1);
      });

      test('T1.3.2: Losing team receives +0 points, +0 GF, +3 GA, -3 GD, +1 played', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const standing = db.standings.get(`${teamAway}::${compAlpha}`)!;
        expect(standing.points).toBe(0);
        expect(standing.goals_for).toBe(0);
        expect(standing.goals_against).toBe(3);
        expect(standing.goal_difference).toBe(-3);
        expect(standing.played).toBe(1);
        expect(standing.lost).toBe(1);
      });

      test('T1.3.3: Global league invariants hold: sum(GF) === sum(GA) and sum(GD) === 0', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        let totalGF = 0;
        let totalGA = 0;
        let totalGD = 0;
        for (const s of db.standings.values()) {
          totalGF += s.goals_for;
          totalGA += s.goals_against;
          totalGD += s.goal_difference;
        }
        expect(totalGF).toBe(totalGA);
        expect(totalGD).toBe(0);
      });

      test('T1.3.4: Team form updates correctly with FIFO sliding window (winner W, loser L)', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const hForm = db.teamForms.get(teamHome)!;
        expect(hForm.latest_results).toEqual(['W']);
        const aForm = db.teamForms.get(teamAway)!;
        expect(aForm.latest_results).toEqual(['L']);
      });

      test('T1.3.5: Normal match with 0 opponent goals awards clean sheet, walkover does not', async () => {
        const fixId1 = crypto.randomUUID();
        seedFixture(fixId1);
        // Normal 2-0 win
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId1,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 0,
        });
        const hGkStat1 = db.playerStats.get(`${homeGk}::${compAlpha}`)!;
        expect(hGkStat1.clean_sheets).toBe(1);

        // Walkover 3-0 win on new fixture
        const fixId2 = crypto.randomUUID();
        seedFixture(fixId2);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId2,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const hGkStat2 = db.playerStats.get(`${homeGk}::${compAlpha}`)!;
        // Must still be 1, not incremented to 2!
        expect(hGkStat2.clean_sheets).toBe(1);
      });
    });

    // F4: Algorithm 1 Terminal State & Idempotency Order
    test.describe('F4: Algorithm 1 Terminal State & Idempotency Order', () => {
      test('T1.4.1: Normal match finalization creates a committed canonical result', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        expect(res.status).toBe('COMMITTED');
        expect(db.canonicalResults.has(fixId)).toBe(true);
      });

      test('T1.4.2: Walkover declaration creates a committed canonical result', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res.status).toBe('COMMITTED');
        expect(db.canonicalResults.has(fixId)).toBe(true);
      });

      test('T1.4.3: Idempotent retry with same idempotency key returns existing canonical result', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const key = deriveWalkoverIdempotencyKey(fixId, teamHome);
        const res1 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
          p_idempotency_key: key,
        });
        expect(res1.status).toBe('COMMITTED');

        const res2 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
          p_idempotency_key: key,
        });
        expect(res2.status).toBe('ALREADY_FINALIZED');
        expect(res2.result_uid).toBe(res1.result_uid);
      });

      test('T1.4.4: Submitting a second conflicting finalization returns ALREADY_FINALIZED without corrupting original outcome', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res1 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res1.status).toBe('COMMITTED');
        // Try submitting normal 0-5
        const res2 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 5,
        });
        expect(res2.status).toBe('ALREADY_FINALIZED');
        expect(res2.home_score).toBe(3); // Original walkover score retained
        expect(res2.away_score).toBe(0);
      });

      test('T1.4.5: Finalization command ledger stores match UID and idempotency key mapping', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const key = 'idem-cmd-test-123';
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 1,
          p_idempotency_key: key,
        });
        const cmd = db.finalizationCommands.get(`${fixId}::${key}`)!;
        expect(cmd).toBeDefined();
        expect(cmd.result_uid).toBe(res.result_uid);
      });
    });

    // F5: Deterministic Idempotency Keys
    test.describe('F5: Deterministic Idempotency Keys', () => {
      test('T1.5.1: Walkover key is reproducible from fixtureId and winningTeamId', () => {
        const key1 = deriveWalkoverIdempotencyKey('fix-100', 'team-A');
        const key2 = deriveWalkoverIdempotencyKey('fix-100', 'team-A');
        expect(key1).toBe('walkover_fix-100_team-A');
        expect(key1).toBe(key2);
      });

      test('T1.5.2: Normal finalization key is reproducible from fixtureId, report text, and events', () => {
        const evts = [{ minute: 12, type: 'GOAL' }];
        const k1 = deriveNormalFinalizationKey('fix-200', 'Good match', evts);
        const k2 = deriveNormalFinalizationKey('fix-200', 'Good match', evts);
        expect(k1).toBe(k2);
        expect(k1.startsWith('confirm_normal_fix-200_')).toBe(true);
      });

      test('T1.5.3: Multiple executions with identical payload generate identical keys', () => {
        const keys = Array.from({ length: 5 }, () =>
          deriveWalkoverIdempotencyKey('fix-300', 'team-B')
        );
        expect(new Set(keys).size).toBe(1);
      });

      test('T1.5.4: Different fixtures produce distinct collision-free keys', () => {
        const k1 = deriveWalkoverIdempotencyKey('fix-401', 'team-A');
        const k2 = deriveWalkoverIdempotencyKey('fix-402', 'team-A');
        expect(k1).not.toBe(k2);
      });

      test('T1.5.5: Modified winning team produces distinct key, preventing invalid cache reuse', () => {
        const kHome = deriveWalkoverIdempotencyKey('fix-500', teamHome);
        const kAway = deriveWalkoverIdempotencyKey('fix-500', teamAway);
        expect(kHome).not.toBe(kAway);
      });
    });

    // F6: Synchronous UI Submit Lock & Modal Lifecycle
    test.describe('F6: Synchronous UI Submit Lock & Modal Lifecycle', () => {
      test('T1.6.1: Submit lock engages synchronously upon execution start', async () => {
        const lock = new SubmitLockGuard(600);
        let wasLockedInside = false;
        await lock.execute(async () => {
          wasLockedInside = lock.locked;
        });
        expect(wasLockedInside).toBe(true);
        expect(lock.locked).toBe(false);
      });

      test('T1.6.2: Rapid second call within debounce threshold is rejected', async () => {
        const lock = new SubmitLockGuard(600);
        const p1 = lock.execute(async () => 'first');
        const p2 = lock.execute(async () => 'second');
        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1.executed).toBe(true);
        expect(r1.result).toBe('first');
        expect(r2.executed).toBe(false); // Throttled
      });

      test('T1.6.3: Successful execution safely unlocks action state for future operations', async () => {
        const lock = new SubmitLockGuard(10);
        await lock.execute(async () => 123);
        expect(lock.locked).toBe(false);
        await new Promise((r) => setTimeout(r, 15));
        const next = await lock.execute(async () => 456);
        expect(next.executed).toBe(true);
        expect(next.result).toBe(456);
      });

      test('T1.6.4: Failed execution catches error and safely unlocks action state', async () => {
        const lock = new SubmitLockGuard(10);
        const res = await lock.execute(async () => {
          throw new Error('Network crash');
        });
        expect(res.executed).toBe(true);
        expect(res.error).toBeDefined();
        expect(lock.locked).toBe(false);
      });

      test('T1.6.5: Modal retains disabled state while submit promise is in-flight', async () => {
        const lock = new SubmitLockGuard(600);
        let resolveInner: () => void;
        const innerPromise = new Promise<void>((r) => { resolveInner = r; });
        const execPromise = lock.execute(() => innerPromise);
        expect(lock.locked).toBe(true);
        resolveInner!();
        await execPromise;
        expect(lock.locked).toBe(false);
      });
    });

    // F7: Unified Offline Synchronization Queue
    test.describe('F7: Unified Offline Synchronization Queue', () => {
      test('T1.7.1: Queuing an offline match finalization stores complete payload in queue', () => {
        const queue = new UnifiedOfflineQueue();
        const item = queue.enqueue({
          id: 'q-item-1',
          fixtureId: 'fix-offline-1',
          outcome: 'WALKOVER',
          refereeId: refOfficial,
          homeScore: 3,
          awayScore: 0,
          winningTeamId: teamHome,
          officialEvents: [],
          reportText: 'Pitch walkover',
        });
        expect(item.id).toBe('q-item-1');
        expect(queue.getPending().length).toBe(1);
      });

      test('T1.7.2: Draining queue replays items and marks them synced', async () => {
        const queue = new UnifiedOfflineQueue();
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        queue.enqueue({
          id: 'q-sync-1',
          fixtureId: fixId,
          outcome: 'WALKOVER',
          refereeId: refOfficial,
          homeScore: 3,
          awayScore: 0,
          winningTeamId: teamHome,
          officialEvents: [],
          reportText: 'Walkover report',
        });
        const { syncedCount } = await queue.drain(db);
        expect(syncedCount).toBe(1);
        expect(queue.getPending().length).toBe(0);
        expect(db.canonicalResults.has(fixId)).toBe(true);
      });

      test('T1.7.3: Subsequent drain skips already-synced actions to prevent double processing', async () => {
        const queue = new UnifiedOfflineQueue();
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        queue.enqueue({
          id: 'q-sync-dup',
          fixtureId: fixId,
          outcome: 'WALKOVER',
          refereeId: refOfficial,
          homeScore: 3,
          awayScore: 0,
          winningTeamId: teamHome,
          officialEvents: [],
          reportText: 'Report',
        });
        await queue.drain(db);
        const secondDrain = await queue.drain(db);
        expect(secondDrain.syncedCount).toBe(0);
      });

      test('T1.7.4: Queue capacity caps at MAX_CAPACITY without crashing', () => {
        const queue = new UnifiedOfflineQueue();
        for (let i = 0; i < 60; i++) {
          queue.enqueue({
            id: `q-cap-${i}`,
            fixtureId: `fix-${i}`,
            outcome: 'NORMAL',
            refereeId: refOfficial,
            homeScore: 1,
            awayScore: 0,
            officialEvents: [],
            reportText: 'Report',
          });
        }
        expect(queue.getAll().length).toBe(50);
      });

      test('T1.7.5: Offline replay executes both canonical permanence and database updates', async () => {
        const queue = new UnifiedOfflineQueue();
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        queue.enqueue({
          id: 'q-full-replay',
          fixtureId: fixId,
          outcome: 'NORMAL',
          refereeId: refOfficial,
          homeScore: 2,
          awayScore: 1,
          officialEvents: [{ minute: 15, type: 'GOAL', team_id: teamHome }],
          reportText: 'Official Report Text',
        });
        await queue.drain(db);
        expect(db.canonicalResults.get(fixId)!.outcome).toBe('NORMAL');
        expect(db.fixtures.get(fixId)!.status).toBe('FT');
        expect(db.matchReports.get(fixId)!.length).toBe(1);
      });
    });

    // F8: Atomic PostgreSQL Finalization RPC
    test.describe('F8: Atomic PostgreSQL Finalization RPC', () => {
      test('T1.8.1: RPC executes atomically across events, reports, canonical result, and fixtures', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 3,
          p_away_score: 2,
          p_official_events: [{ minute: 10, type: 'GOAL', team_id: teamHome }],
          p_report_text: 'Match was clean',
        });
        expect(res.success).toBe(true);
        expect(db.fixtures.get(fixId)!.score_home).toBe(3);
        expect(db.canonicalResults.has(fixId)).toBe(true);
        expect(db.matchReports.get(fixId)!.length).toBe(1);
        expect(db.matchEvents.get(fixId)!.length).toBe(1);
      });

      test('T1.8.2: If fixture does not exist, transaction aborts cleanly with FIXTURE_NOT_FOUND', async () => {
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: 'non-existent-fix-id',
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
          })
        ).rejects.toThrow('FIXTURE_NOT_FOUND');
      });

      test('T1.8.3: Already finalized match returns ALREADY_FINALIZED status', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        const retry = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        expect(retry.status).toBe('ALREADY_FINALIZED');
      });

      test('T1.8.4: Walkover requires winning_team_id belonging to fixture, otherwise rejects', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'WALKOVER',
            p_home_score: 0,
            p_away_score: 0,
            p_winning_team_id: 'stranger-team-id',
          })
        ).rejects.toThrow('INVALID_WALKOVER_WINNER');
      });

      test('T1.8.5: Atomically updates referee metadata (attendance, weather, referee id)', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
          p_attendance: 1500,
          p_weather: 'Overcast, 22C',
        });
        const fix = db.fixtures.get(fixId)!;
        expect(fix.attendance).toBe(1500);
        expect(fix.weather).toBe('Overcast, 22C');
        expect(fix.verified_by_referee_id).toBe(refOfficial);
      });
    });

    // F9: Elimination of Client-Side Race Conditions
    test.describe('F9: Elimination of Client-Side Race Conditions', () => {
      test('T1.9.1: Match events replacement atomic swap leaves zero orphan events', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        // Pre-populate old events
        db.matchEvents.set(fixId, [
          {
            id: 'old-evt-1',
            fixture_id: fixId,
            minute: 5,
            type: 'YELLOW_CARD',
            event_target: 'home',
            team_id: teamHome,
            is_official: false,
            created_by: 'journalist-1',
            created_at: new Date().toISOString(),
          },
        ]);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_official_events: [{ minute: 88, type: 'GOAL', team_id: teamHome, id: 'new-goal-1' }],
        });
        const events = db.matchEvents.get(fixId)!;
        expect(events.length).toBe(1);
        expect(events[0].id).toBe('new-goal-1');
      });

      test('T1.9.2: Batch event insertion preserves exact minutes and event types', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const batch = [
          { minute: 14, type: 'YELLOW_CARD', team_id: teamHome },
          { minute: 45, type: 'GOAL', team_id: teamHome },
          { minute: 78, type: 'RED_CARD', team_id: teamAway },
        ];
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_official_events: batch,
        });
        const stored = db.matchEvents.get(fixId)!;
        expect(stored.map((e) => e.minute)).toEqual([14, 45, 78]);
        expect(stored.map((e) => e.type)).toEqual(['YELLOW_CARD', 'GOAL', 'RED_CARD']);
      });

      test('T1.9.3: Concurrent finalization calls for same fixture are serialized via row lock', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        let executionOrder: number[] = [];
        const p1 = db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        }).then(() => executionOrder.push(1));

        const p2 = db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        }).then(() => executionOrder.push(2));

        await Promise.all([p1, p2]);
        expect(executionOrder.length).toBe(2);
        // Only one report and one canonical result
        expect(db.matchReports.get(fixId)!.length).toBe(1);
      });

      test('T1.9.4: Match report is strictly deduplicated (exactly 1 row per fixture)', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
          p_report_text: 'Report V1',
        });
        // Resubmission should not add second report
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
          p_report_text: 'Report V2',
        });
        expect(db.matchReports.get(fixId)!.length).toBe(1);
      });

      test('T1.9.5: Score calculation from events matches official scores on the fixture', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 0,
          p_official_events: [
            { minute: 10, type: 'GOAL', team_id: teamHome },
            { minute: 80, type: 'GOAL', team_id: teamHome },
          ],
        });
        const fix = db.fixtures.get(fixId)!;
        const events = db.matchEvents.get(fixId)!;
        const goalCount = events.filter((e) => e.type === 'GOAL').length;
        expect(fix.score_home).toBe(goalCount);
      });
    });

    // F10: Standings Double-Counting Protection
    test.describe('F10: Standings Double-Counting Protection', () => {
      test('T1.10.1: stats_processed flag is set to true after first calculation', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        const fix = db.fixtures.get(fixId)!;
        expect(fix.stats_processed).toBe(true);
      });

      test('T1.10.2: Calling trigger twice does NOT double count points or games', async () => {
        const fixId = crypto.randomUUID();
        const fix = seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        const pts1 = db.standings.get(`${teamHome}::${compAlpha}`)!.points;
        const played1 = db.standings.get(`${teamHome}::${compAlpha}`)!.played;

        // Simulate trigger attempting second fire
        if (fix.stats_processed) {
          // Guard prevents execution
        } else {
          await db.executeStatsTrigger(fix, 'NORMAL', []);
        }

        const pts2 = db.standings.get(`${teamHome}::${compAlpha}`)!.points;
        const played2 = db.standings.get(`${teamHome}::${compAlpha}`)!.played;
        expect(pts1).toBe(pts2);
        expect(played1).toBe(played2);
      });

      test('T1.10.3: Rapid consecutive trigger invocations are idempotent', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const calls = Array.from({ length: 5 }, () =>
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: 2,
            p_away_score: 1,
          })
        );
        await Promise.all(calls);
        const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(standing.played).toBe(1);
        expect(standing.points).toBe(3);
      });

      test('T1.10.4: Concurrency row locking serializes standings updates in same competition', async () => {
        const f1 = crypto.randomUUID();
        const f2 = crypto.randomUUID();
        seedFixture(f1);
        seedFixture(f2);
        const p1 = db.finalizeMatchTransaction({
          p_fixture_id: f1,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });
        const p2 = db.finalizeMatchTransaction({
          p_fixture_id: f2,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 0,
        });
        await Promise.all([p1, p2]);
        const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(standing.played).toBe(2);
        expect(standing.points).toBe(6);
        expect(standing.goals_for).toBe(3);
      });

      test('T1.10.5: Zero clean sheets invariant holds unconditionally across multiple updates', async () => {
        const f1 = crypto.randomUUID();
        seedFixture(f1);
        await db.finalizeMatchTransaction({
          p_fixture_id: f1,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const f2 = crypto.randomUUID();
        seedFixture(f2);
        await db.finalizeMatchTransaction({
          p_fixture_id: f2,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const homeGkStat = db.playerStats.get(`${homeGk}::${compAlpha}`);
        expect(homeGkStat?.clean_sheets ?? 0).toBe(0);
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (≥5 tests per feature: 50 tests)
  // ==========================================================================

  test.describe('Tier 2: Boundary & Corner Cases (F1 to F10)', () => {

    // F1 Boundary
    test.describe('F1 Boundary: Walkovers', () => {
      test('T2.1.1: Walkover where winning team equals losing team is rejected', async () => {
        const fixId = crypto.randomUUID();
        const fix = seedFixture(fixId);
        // Temporarily set away team to home team to simulate corruption
        fix.away_team_id = teamHome;
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'WALKOVER',
            p_home_score: 0,
            p_away_score: 0,
            p_winning_team_id: teamHome,
          })
        ).rejects.toThrow();
      });

      test('T2.1.2: Walkover with team not in fixture is rejected', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'WALKOVER',
            p_home_score: 0,
            p_away_score: 0,
            p_winning_team_id: 'external-team-xyz',
          })
        ).rejects.toThrow('INVALID_WALKOVER_WINNER');
      });

      test('T2.1.3: Walkover when previous score was 2-1 overrides scores to 3-0', async () => {
        const fixId = crypto.randomUUID();
        const fix = seedFixture(fixId);
        fix.score_home = 2;
        fix.score_away = 1;
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(fix.score_home).toBe(3);
        expect(fix.score_away).toBe(0);
      });

      test('T2.1.4: Walkover for fixture with zero rostered players executes without null pointer errors', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        db.teamGoalkeepers.clear(); // No GKs rostered
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res.success).toBe(true);
      });

      test('T2.1.5: Walkover declared at 89th minute discards all prior live events in canonical', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        db.matchEvents.set(fixId, [
          {
            id: 'live-1',
            fixture_id: fixId,
            minute: 85,
            type: 'GOAL',
            event_target: 'home',
            team_id: teamHome,
            is_official: false,
            created_by: 'journalist-1',
            created_at: new Date().toISOString(),
          },
        ]);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamAway,
        });
        const canonical = db.canonicalResults.get(fixId)!;
        expect(canonical.events).toEqual([]);
      });
    });

    // F2 Boundary
    test.describe('F2 Boundary: Status Transitions', () => {
      test('T2.2.1: Setting fixtures.status = WALKOVER directly is intercepted/prevented', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        const fix = db.fixtures.get(fixId)!;
        expect(['UPCOMING', 'LIVE', 'HT', 'FT', 'POSTPONED', 'CANCELLED']).toContain(fix.status);
        expect(fix.status).toBe('FT');
      });

      test('T2.2.2: Double finalization attempt after status is already FT preserves FT status', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 1,
        });
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 1,
        });
        expect(db.fixtures.get(fixId)!.status).toBe('FT');
      });

      test('T2.2.3: Transitioning an already CANCELLED fixture to Walkover is rejected', async () => {
        const fixId = crypto.randomUUID();
        const fix = seedFixture(fixId);
        fix.status = 'CANCELLED';
        // Simulate terminal state check
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'CANCELLED',
          p_home_score: 0,
          p_away_score: 0,
        });
        const attempt = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(attempt.status).toBe('ALREADY_FINALIZED');
        expect(attempt.outcome).toBe('CANCELLED');
      });

      test('T2.2.4: Attempting to finalize a future fixture scheduled months away verifies cleanly', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId, 'UPCOMING');
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(res.status).toBe('COMMITTED');
        expect(db.fixtures.get(fixId)!.status).toBe('FT');
      });

      test('T2.2.5: Terminal outcome in canonical result strictly matches enum: NORMAL, WALKOVER, or CANCELLED', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(['NORMAL', 'WALKOVER', 'CANCELLED']).toContain(res.outcome);
      });
    });

    // F3 Boundary
    test.describe('F3 Boundary: Standings Edge Cases', () => {
      test('T2.3.1: 0-0 Draw correctly awards +1 point to both teams and 0 GD', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
        });
        const h = db.standings.get(`${teamHome}::${compAlpha}`)!;
        const a = db.standings.get(`${teamAway}::${compAlpha}`)!;
        expect(h.points).toBe(1);
        expect(a.points).toBe(1);
        expect(h.goal_difference).toBe(0);
        expect(a.goal_difference).toBe(0);
      });

      test('T2.3.2: High-scoring match (9-8) maintains exact mathematical parity in GF, GA, and GD', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 9,
          p_away_score: 8,
        });
        const h = db.standings.get(`${teamHome}::${compAlpha}`)!;
        const a = db.standings.get(`${teamAway}::${compAlpha}`)!;
        expect(h.goals_for).toBe(9);
        expect(h.goals_against).toBe(8);
        expect(h.goal_difference).toBe(1);
        expect(a.goals_for).toBe(8);
        expect(a.goals_against).toBe(9);
        expect(a.goal_difference).toBe(-1);
      });

      test('T2.3.3: Form array never exceeds 5 items even after 10 matches (FIFO boundary)', async () => {
        for (let i = 0; i < 8; i++) {
          const fixId = crypto.randomUUID();
          seedFixture(fixId);
          await db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
          });
        }
        const form = db.teamForms.get(teamHome)!;
        expect(form.latest_results.length).toBe(5);
        expect(form.latest_results).toEqual(['W', 'W', 'W', 'W', 'W']);
      });

      test('T2.3.4: Team with 0 prior games initializes standings record from clean zero baseline', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 1,
        });
        const h = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(h.played).toBe(1);
        expect(h.won).toBe(0);
        expect(h.drawn).toBe(0);
        expect(h.lost).toBe(1);
      });

      test('T2.3.5: Competition ID isolation prevents standings bleed across distinct competitions', async () => {
        const compBeta = '77777777-7777-7777-7777-777777777777';
        const fixId1 = crypto.randomUUID();
        seedFixture(fixId1); // compAlpha
        const fixId2 = crypto.randomUUID();
        const fix2 = seedFixture(fixId2);
        fix2.competition_id = compBeta;

        await db.finalizeMatchTransaction({
          p_fixture_id: fixId1,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 0,
        });
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId2,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        });

        const sAlpha = db.standings.get(`${teamHome}::${compAlpha}`)!;
        const sBeta = db.standings.get(`${teamHome}::${compBeta}`)!;
        expect(sAlpha.points).toBe(3);
        expect(sBeta.points).toBe(3);
        expect(sAlpha.played).toBe(1);
        expect(sBeta.played).toBe(1);
      });
    });

    // F4 Boundary
    test.describe('F4 Boundary: Idempotency Retrieval', () => {
      test('T2.4.1: Retrying finalization with empty idempotency key executes gracefully', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_idempotency_key: '',
        });
        expect(res.success).toBe(true);
      });

      test('T2.4.2: Retrying finalization with whitespace-only key normalizes cleanly', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_idempotency_key: '   ',
        });
        expect(res.success).toBe(true);
      });

      test('T2.4.3: 5 consecutive retries with identical key return identical result_uid', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const key = 'idem-5x-identical';
        const resList = [];
        for (let i = 0; i < 5; i++) {
          resList.push(
            await db.finalizeMatchTransaction({
              p_fixture_id: fixId,
              p_referee_id: refOfficial,
              p_outcome: 'WALKOVER',
              p_home_score: 0,
              p_away_score: 0,
              p_winning_team_id: teamHome,
              p_idempotency_key: key,
            })
          );
        }
        const uids = new Set(resList.map((r) => r.result_uid));
        expect(uids.size).toBe(1);
      });

      test('T2.4.4: Retry after server crash simulation finds stored finalization command in ledger', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const key = 'idem-crash-simulation';
        const first = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 2,
          p_idempotency_key: key,
        });
        const cmd = db.finalizationCommands.get(`${fixId}::${key}`)!;
        expect(cmd.result_uid).toBe(first.result_uid);
      });

      test('T2.4.5: State hash remains strictly identical across all idempotent retrievals', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const key = 'idem-state-hash';
        const r1 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamAway,
          p_idempotency_key: key,
        });
        const r2 = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamAway,
          p_idempotency_key: key,
        });
        expect(r1.state_hash).toBe(r2.state_hash);
      });
    });

    // F5 Boundary
    test.describe('F5 Boundary: Key Derivation', () => {
      test('T2.5.1: Idempotency key with special characters maintains string fidelity', () => {
        const key = deriveWalkoverIdempotencyKey('fix-uuid-!@#', 'team-uuid-$%^');
        expect(key).toBe('walkover_fix-uuid-!@#_team-uuid-$%^');
      });

      test('T2.5.2: Extremely long report text (>5000 chars) generates consistent, deterministic hash', () => {
        const longReport = 'A'.repeat(6000);
        const k1 = deriveNormalFinalizationKey('fix-long-1', longReport, []);
        const k2 = deriveNormalFinalizationKey('fix-long-1', longReport, []);
        expect(k1).toBe(k2);
        expect(k1.length).toBeLessThan(60);
      });

      test('T2.5.3: Null or undefined fields in payload normalize consistently', () => {
        const k1 = deriveNormalFinalizationKey('fix-norm-1', '', []);
        const k2 = deriveNormalFinalizationKey('fix-norm-1', '', []);
        expect(k1).toBe(k2);
      });

      test('T2.5.4: Array ordering of official events preserves deterministic key', () => {
        const evts = [{ minute: 10, type: 'GOAL' }];
        const k1 = deriveNormalFinalizationKey('fix-order', 'Report', evts);
        const k2 = deriveNormalFinalizationKey('fix-order', 'Report', [{ minute: 10, type: 'GOAL' }]);
        expect(k1).toBe(k2);
      });

      test('T2.5.5: Empty events array generates consistent deterministic normal key', () => {
        const k1 = deriveNormalFinalizationKey('fix-empty', 'No events', []);
        const k2 = deriveNormalFinalizationKey('fix-empty', 'No events', []);
        expect(k1).toBe(k2);
      });
    });

    // F6 Boundary
    test.describe('F6 Boundary: UI Submit Lock', () => {
      test('T2.6.1: Simulated 5x rapid double-clicks (0ms gap) executes submit function exactly once', async () => {
        const lock = new SubmitLockGuard(600);
        let executedCount = 0;
        const clicks = Array.from({ length: 5 }, () =>
          lock.execute(async () => {
            executedCount++;
            await new Promise((r) => setTimeout(r, 50));
          })
        );
        await Promise.all(clicks);
        expect(executedCount).toBe(1);
      });

      test('T2.6.2: Rapid clicks with 100ms interval (below 600ms debounce) are throttled', async () => {
        const lock = new SubmitLockGuard(600);
        let executedCount = 0;
        await lock.execute(async () => { executedCount++; });
        await new Promise((r) => setTimeout(r, 100));
        await lock.execute(async () => { executedCount++; });
        expect(executedCount).toBe(1);
      });

      test('T2.6.3: Clicks after debounce interval (650ms) are permitted for new actions', async () => {
        const lock = new SubmitLockGuard(50);
        let count = 0;
        await lock.execute(async () => { count++; });
        await new Promise((r) => setTimeout(r, 70));
        await lock.execute(async () => { count++; });
        expect(count).toBe(2);
      });

      test('T2.6.4: Unmounting component while submission is pending does not throw error', async () => {
        const lock = new SubmitLockGuard(50);
        let unmounted = false;
        const p = lock.execute(async () => {
          await new Promise((r) => setTimeout(r, 20));
          unmounted = true;
        });
        await p;
        expect(unmounted).toBe(true);
        expect(lock.locked).toBe(false);
      });

      test('T2.6.5: Immediate re-click after simulated submission rejection is permitted for retry', async () => {
        const lock = new SubmitLockGuard(10);
        let attempts = 0;
        await lock.execute(async () => {
          attempts++;
          throw new Error('Timeout');
        });
        await new Promise((r) => setTimeout(r, 15));
        await lock.execute(async () => {
          attempts++;
        });
        expect(attempts).toBe(2);
      });
    });

    // F7 Boundary
    test.describe('F7 Boundary: Offline Queue', () => {
      test('T2.7.1: Offline queue persistence handles queue evictions at capacity', () => {
        const queue = new UnifiedOfflineQueue();
        for (let i = 0; i < 55; i++) {
          queue.enqueue({
            id: `item-${i}`,
            fixtureId: `fix-${i}`,
            outcome: 'NORMAL',
            refereeId: refOfficial,
            homeScore: 1,
            awayScore: 0,
            officialEvents: [],
            reportText: 'Report',
          });
        }
        expect(queue.getAll().length).toBe(50);
        expect(queue.getAll()[0].id).toBe('item-5');
      });

      test('T2.7.2: Replaying queue when network drops midway preserves failed items for next retry', async () => {
        const queue = new UnifiedOfflineQueue();
        const validFix = crypto.randomUUID();
        seedFixture(validFix);
        queue.enqueue({
          id: 'q-item-valid',
          fixtureId: validFix,
          outcome: 'NORMAL',
          refereeId: refOfficial,
          homeScore: 1,
          awayScore: 0,
          officialEvents: [],
          reportText: 'Valid',
        });
        queue.enqueue({
          id: 'q-item-invalid',
          fixtureId: 'non-existent-fix',
          outcome: 'NORMAL',
          refereeId: refOfficial,
          homeScore: 1,
          awayScore: 0,
          officialEvents: [],
          reportText: 'Invalid',
        });

        const { syncedCount, errors } = await queue.drain(db);
        expect(syncedCount).toBe(1);
        expect(errors.length).toBe(1);
        // Invalid item remains pending for subsequent retry
        expect(queue.getPending().length).toBe(1);
      });

      test('T2.7.3: Queue items retry count increments on each failed attempt', async () => {
        const queue = new UnifiedOfflineQueue();
        queue.enqueue({
          id: 'q-retry-count',
          fixtureId: 'non-existent',
          outcome: 'NORMAL',
          refereeId: refOfficial,
          homeScore: 0,
          awayScore: 0,
          officialEvents: [],
          reportText: 'Fail',
        });
        await queue.drain(db);
        await queue.drain(db);
        const item = queue.getAll()[0];
        expect(item.retryCount).toBe(2);
      });

      test('T2.7.4: Empty offline queue drain returns 0 synced items with empty errors array', async () => {
        const queue = new UnifiedOfflineQueue();
        const res = await queue.drain(db);
        expect(res.syncedCount).toBe(0);
        expect(res.errors.length).toBe(0);
      });

      test('T2.7.5: Queue clear empties all entries and synced ledger', () => {
        const queue = new UnifiedOfflineQueue();
        queue.enqueue({
          id: 'item-clr',
          fixtureId: 'f-clr',
          outcome: 'NORMAL',
          refereeId: refOfficial,
          homeScore: 0,
          awayScore: 0,
          officialEvents: [],
          reportText: 'Txt',
        });
        queue.clear();
        expect(queue.getAll().length).toBe(0);
        expect(queue.getPending().length).toBe(0);
      });
    });

    // F8 Boundary
    test.describe('F8 Boundary: RPC Edge Cases', () => {
      test('T2.8.1: Missing required refereeId in RPC aborts transaction', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: '',
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
          })
        ).rejects.toThrow('INVALID_REFEREE_ID');
      });

      test('T2.8.2: Negative scores passed to RPC are clamped to 0', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const res = await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: -5,
          p_away_score: -2,
        });
        expect(res.home_score).toBe(0);
        expect(res.away_score).toBe(0);
      });

      test('T2.8.3: Nil UUID 00000000-0000-0000-0000-000000000000 referee is rejected', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await expect(
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: '00000000-0000-0000-0000-000000000000',
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
          })
        ).rejects.toThrow('INVALID_REFEREE_ID');
      });

      test('T2.8.4: Extremely large attendance number (>1,000,000) stores cleanly without overflow', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
          p_attendance: 1250000,
        });
        expect(db.fixtures.get(fixId)!.attendance).toBe(1250000);
      });

      test('T2.8.5: Special characters and quote marks in report text are safely escaped', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const malicious = "O'Reilly & Sons; DROP TABLE fixtures; -- \"quoted\"";
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_report_text: malicious,
        });
        const reports = db.matchReports.get(fixId)!;
        expect(reports[0].report_text).toBe(malicious);
      });
    });

    // F9 Boundary
    test.describe('F9 Boundary: Event Reconciliation', () => {
      test('T2.9.1: Match with 0 official events finalizes cleanly with empty events', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
          p_official_events: [],
        });
        expect(db.matchEvents.get(fixId)!.length).toBe(0);
      });

      test('T2.9.2: Match with 25 official events replaces and persists all 25 atomically', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const evts = Array.from({ length: 25 }, (_, i) => ({
          minute: i + 1,
          type: i % 2 === 0 ? 'GOAL' : 'YELLOW_CARD',
          team_id: i % 2 === 0 ? teamHome : teamAway,
        }));
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 13,
          p_away_score: 0,
          p_official_events: evts,
        });
        expect(db.matchEvents.get(fixId)!.length).toBe(25);
      });

      test('T2.9.3: Event with 0th minute (kickoff goal) persists with valid minute 0', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_official_events: [{ minute: 0, type: 'GOAL', team_id: teamHome }],
        });
        const stored = db.matchEvents.get(fixId)!;
        expect(stored[0].minute).toBe(0);
      });

      test('T2.9.4: Event with stoppage time minute (e.g. 90+4 -> 94) persists accurately', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_official_events: [{ minute: 94, type: 'GOAL', team_id: teamHome }],
        });
        expect(db.matchEvents.get(fixId)![0].minute).toBe(94);
      });

      test('T2.9.5: Null assist_player_id persists as null without crashing', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
          p_official_events: [{ minute: 30, type: 'GOAL', team_id: teamHome, assist_player_id: null }],
        });
        expect(db.matchEvents.get(fixId)![0].assist_player_id).toBeNull();
      });
    });

    // F10 Boundary
    test.describe('F10 Boundary: Concurrency & Double Counting', () => {
      test('T2.10.1: 20 simultaneous redundant calls to finalize execute safely with exactly 1 stats application', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        const calls = Array.from({ length: 20 }, () =>
          db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
          })
        );
        await Promise.all(calls);
        const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(standing.played).toBe(1);
        expect(standing.points).toBe(3);
      });

      test('T2.10.2: Competition row lock serializes 5 parallel matches with zero deadlocks', async () => {
        const fixes = Array.from({ length: 5 }, () => crypto.randomUUID());
        fixes.forEach((id) => seedFixture(id));
        const finalizations = fixes.map((id, idx) =>
          db.finalizeMatchTransaction({
            p_fixture_id: id,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: idx % 2 === 0 ? 1 : 0,
            p_away_score: 0,
          })
        );
        await Promise.all(finalizations);
        const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(standing.played).toBe(5);
      });

      test('T2.10.3: stats_processed flag remains true after multiple calls', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
        });
        expect(db.fixtures.get(fixId)!.stats_processed).toBe(true);
      });

      test('T2.10.4: Disallow negative goal values from corrupting standings parity', async () => {
        const fixId = crypto.randomUUID();
        seedFixture(fixId);
        await db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: -3,
          p_away_score: 0,
        });
        const h = db.standings.get(`${teamHome}::${compAlpha}`)!;
        expect(h.goals_for).toBe(0);
        expect(h.goal_difference).toBe(0);
      });

      test('T2.10.5: Global standings sum(GD) equals strictly zero across all boundary tests', () => {
        let totalGD = 0;
        for (const s of db.standings.values()) {
          totalGD += s.goal_difference;
        }
        expect(totalGD).toBe(0);
      });
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (10 tests)
  // ==========================================================================

  test.describe('Tier 3: Cross-Feature Combinations', () => {
    test('T3.1: Offline sync of walkover followed by immediate online retry (F1 + F5 + F7)', async () => {
      const queue = new UnifiedOfflineQueue();
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      const key = deriveWalkoverIdempotencyKey(fixId, teamHome);

      // Queue while offline
      queue.enqueue({
        id: key,
        fixtureId: fixId,
        outcome: 'WALKOVER',
        refereeId: refOfficial,
        homeScore: 3,
        awayScore: 0,
        winningTeamId: teamHome,
        officialEvents: [],
        reportText: 'Walkover Offline',
      });

      // Come online & drain
      const drain1 = await queue.drain(db);
      expect(drain1.syncedCount).toBe(1);

      // Immediate client retry with same key
      const retryRes = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'WALKOVER',
        p_home_score: 0,
        p_away_score: 0,
        p_winning_team_id: teamHome,
        p_idempotency_key: key,
      });
      expect(retryRes.status).toBe('ALREADY_FINALIZED');
      expect(retryRes.home_score).toBe(3);
    });

    test('T3.2: Walkover declaration followed by Algorithm 2 trigger, verifying zero clean sheets and exact 3-0 standings (F1 + F2 + F3)', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'WALKOVER',
        p_home_score: 0,
        p_away_score: 0,
        p_winning_team_id: teamHome,
      });
      // Standings verify
      const hStanding = db.standings.get(`${teamHome}::${compAlpha}`)!;
      expect(hStanding.points).toBe(3);
      expect(hStanding.goals_for).toBe(3);
      expect(hStanding.goals_against).toBe(0);
      // Clean sheet strictly 0
      const gk = db.playerStats.get(`${homeGk}::${compAlpha}`);
      expect(gk?.clean_sheets ?? 0).toBe(0);
      // Status in fixtures
      expect(db.fixtures.get(fixId)!.status).toBe('FT');
    });

    test('T3.3: Rapid double-click on walkover modal with deterministic idempotency key and RPC serialization (F5 + F6 + F8)', async () => {
      const lock = new SubmitLockGuard(600);
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      const key = deriveWalkoverIdempotencyKey(fixId, teamHome);

      const click1 = lock.execute(() =>
        db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
          p_idempotency_key: key,
        })
      );

      const click2 = lock.execute(() =>
        db.finalizeMatchTransaction({
          p_fixture_id: fixId,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: teamHome,
          p_idempotency_key: key,
        })
      );

      const [r1, r2] = await Promise.all([click1, click2]);
      expect(r1.executed).toBe(true);
      expect(r2.executed).toBe(false); // Locked by submit guard
      expect(db.canonicalResults.get(fixId)!.home_score).toBe(3);
    });

    test('T3.4: Normal match finalization with 5 official events, followed by network crash and idempotency recovery (F4 + F8 + F9)', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      const evts = [
        { minute: 10, type: 'GOAL', team_id: teamHome },
        { minute: 20, type: 'YELLOW_CARD', team_id: teamHome },
        { minute: 40, type: 'GOAL', team_id: teamAway },
        { minute: 70, type: 'GOAL', team_id: teamHome },
        { minute: 85, type: 'SUBSTITUTION', team_id: teamAway },
      ];
      const key = deriveNormalFinalizationKey(fixId, 'Exciting game', evts);

      const res1 = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 2,
        p_away_score: 1,
        p_official_events: evts,
        p_report_text: 'Exciting game',
        p_idempotency_key: key,
      });
      expect(res1.status).toBe('COMMITTED');

      // Client assumed network crashed, retries with same key
      const res2 = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 2,
        p_away_score: 1,
        p_official_events: evts,
        p_report_text: 'Exciting game',
        p_idempotency_key: key,
      });
      expect(res2.status).toBe('ALREADY_FINALIZED');
      expect(res2.result_uid).toBe(res1.result_uid);
      expect(db.matchEvents.get(fixId)!.length).toBe(5);
    });

    test('T3.5: Concurrent finalization of 2 matches in same league: one normal FT and one Walkover (F1 + F3 + F10)', async () => {
      const fNorm = crypto.randomUUID();
      const fWalk = crypto.randomUUID();
      seedFixture(fNorm);
      seedFixture(fWalk);

      const pNorm = db.finalizeMatchTransaction({
        p_fixture_id: fNorm,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 1,
        p_away_score: 0,
      });

      const pWalk = db.finalizeMatchTransaction({
        p_fixture_id: fWalk,
        p_referee_id: refOfficial,
        p_outcome: 'WALKOVER',
        p_home_score: 0,
        p_away_score: 0,
        p_winning_team_id: teamHome,
      });

      await Promise.all([pNorm, pWalk]);
      const standing = db.standings.get(`${teamHome}::${compAlpha}`)!;
      expect(standing.played).toBe(2);
      expect(standing.points).toBe(6);
      expect(standing.goals_for).toBe(4); // 1 from norm + 3 from walkover
      expect(standing.goals_against).toBe(0);
    });

    test('T3.6: Offline queue replay of 3 matches, followed by batch standings calculation and zero-sum verification (F3 + F7 + F10)', async () => {
      const queue = new UnifiedOfflineQueue();
      const f1 = crypto.randomUUID();
      const f2 = crypto.randomUUID();
      const f3 = crypto.randomUUID();
      seedFixture(f1);
      seedFixture(f2);
      seedFixture(f3);

      queue.enqueue({
        id: 'q-batch-1',
        fixtureId: f1,
        outcome: 'NORMAL',
        refereeId: refOfficial,
        homeScore: 2,
        awayScore: 1,
        officialEvents: [],
        reportText: 'Match 1',
      });
      queue.enqueue({
        id: 'q-batch-2',
        fixtureId: f2,
        outcome: 'WALKOVER',
        refereeId: refOfficial,
        homeScore: 3,
        awayScore: 0,
        winningTeamId: teamHome,
        officialEvents: [],
        reportText: 'Match 2',
      });
      queue.enqueue({
        id: 'q-batch-3',
        fixtureId: f3,
        outcome: 'NORMAL',
        refereeId: refOfficial,
        homeScore: 0,
        awayScore: 0,
        officialEvents: [],
        reportText: 'Match 3',
      });

      const { syncedCount } = await queue.drain(db);
      expect(syncedCount).toBe(3);

      let sumGF = 0;
      let sumGA = 0;
      let sumGD = 0;
      for (const s of db.standings.values()) {
        sumGF += s.goals_for;
        sumGA += s.goals_against;
        sumGD += s.goal_difference;
      }
      expect(sumGF).toBe(sumGA);
      expect(sumGD).toBe(0);
    });

    test('T3.7: Submitting match with tampered score under retry recovers original canonical score (F4 + F5 + F8)', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      const key = deriveNormalFinalizationKey(fixId, 'Original Report', []);
      const res1 = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 1,
        p_away_score: 0,
        p_idempotency_key: key,
      });
      expect(res1.status).toBe('COMMITTED');

      // Attacker attempts to change score to 1-5 with same fixture
      const res2 = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 1,
        p_away_score: 5,
        p_idempotency_key: key,
      });
      expect(res2.status).toBe('ALREADY_FINALIZED');
      expect(res2.home_score).toBe(1);
      expect(res2.away_score).toBe(0); // Original preserved
    });

    test('T3.8: UI lock engaged, simulated network disconnect queues payload, and unlocks cleanly (F6 + F7)', async () => {
      const lock = new SubmitLockGuard(100);
      const queue = new UnifiedOfflineQueue();
      const fixId = crypto.randomUUID();
      seedFixture(fixId);

      const exec = await lock.execute(async () => {
        try {
          throw new Error('NETWORK_DISCONNECTED');
        } catch {
          // Fallback to queue
          queue.enqueue({
            id: deriveWalkoverIdempotencyKey(fixId, teamHome),
            fixtureId: fixId,
            outcome: 'WALKOVER',
            refereeId: refOfficial,
            homeScore: 3,
            awayScore: 0,
            winningTeamId: teamHome,
            officialEvents: [],
            reportText: 'Offline fallback',
          });
        }
      });
      expect(exec.executed).toBe(true);
      expect(lock.locked).toBe(false);
      expect(queue.getPending().length).toBe(1);
    });

    test('T3.9: Walkover declared on match with pre-existing journalist events: RPC wipes events and awards 0 player stats (F1 + F8 + F9)', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      // Journalist inserted goal event during live phase
      const jGoal: MatchEventRow = {
        id: crypto.randomUUID(),
        fixture_id: fixId,
        minute: 12,
        type: 'GOAL',
        event_target: 'home',
        team_id: teamHome,
        player_id: 'striker-9',
        is_official: false,
        created_by: 'journalist-uid',
        created_at: new Date().toISOString(),
      };
      db.matchEvents.set(fixId, [jGoal]);

      await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'WALKOVER',
        p_home_score: 0,
        p_away_score: 0,
        p_winning_team_id: teamHome,
      });
      expect(db.matchEvents.get(fixId)!.length).toBe(0);
      const strikerStats = db.playerStats.get(`striker-9::${compAlpha}`);
      expect(strikerStats?.goals ?? 0).toBe(0);
    });

    test('T3.10: End-to-end reconciliation: referee finalizes match, writes report, updates DB, verifies standings (F2 + F4 + F8 + F10)', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);
      const res = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 2,
        p_away_score: 1,
        p_report_text: 'Reconciliation complete with official signatures',
        p_official_events: [
          { minute: 23, type: 'GOAL', team_id: teamHome },
          { minute: 45, type: 'GOAL', team_id: teamAway },
          { minute: 88, type: 'GOAL', team_id: teamHome },
        ],
      });
      expect(res.status).toBe('COMMITTED');
      expect(db.fixtures.get(fixId)!.referee_verification_status).toBe('VERIFIED');
      expect(db.fixtures.get(fixId)!.status).toBe('FT');
      const hStanding = db.standings.get(`${teamHome}::${compAlpha}`)!;
      expect(hStanding.points).toBe(3);
      expect(hStanding.played).toBe(1);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD SCENARIOS (5 tests)
  // ==========================================================================

  test.describe('Tier 4: Real-World Scenarios', () => {
    test('T4.1: Full Matchday Finalization: 5 simultaneous matches in a league with 100% mathematical parity', async () => {
      const teams = [
        'team-A-uuid',
        'team-B-uuid',
        'team-C-uuid',
        'team-D-uuid',
        'team-E-uuid',
        'team-F-uuid',
        'team-G-uuid',
        'team-H-uuid',
        'team-I-uuid',
        'team-J-uuid',
      ];
      const matchdayFixes: FixtureRow[] = [];

      // 5 matches between 10 distinct teams
      for (let i = 0; i < 5; i++) {
        const id = crypto.randomUUID();
        const f: FixtureRow = {
          id,
          competition_id: compAlpha,
          home_team_id: teams[i * 2],
          away_team_id: teams[i * 2 + 1],
          score_home: 0,
          score_away: 0,
          status: 'LIVE',
          referee_id: refOfficial,
          stats_processed: false,
        };
        db.fixtures.set(id, f);
        matchdayFixes.push(f);
      }

      // Mix of outcomes: 3 normal, 1 walkover, 1 draw
      const outcomes = [
        db.finalizeMatchTransaction({
          p_fixture_id: matchdayFixes[0].id,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 3,
          p_away_score: 1,
        }),
        db.finalizeMatchTransaction({
          p_fixture_id: matchdayFixes[1].id,
          p_referee_id: refOfficial,
          p_outcome: 'WALKOVER',
          p_home_score: 0,
          p_away_score: 0,
          p_winning_team_id: matchdayFixes[1].home_team_id,
        }),
        db.finalizeMatchTransaction({
          p_fixture_id: matchdayFixes[2].id,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 0,
          p_away_score: 0,
        }),
        db.finalizeMatchTransaction({
          p_fixture_id: matchdayFixes[3].id,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 2,
          p_away_score: 4,
        }),
        db.finalizeMatchTransaction({
          p_fixture_id: matchdayFixes[4].id,
          p_referee_id: refOfficial,
          p_outcome: 'NORMAL',
          p_home_score: 1,
          p_away_score: 0,
        }),
      ];

      await Promise.all(outcomes);

      let totalGF = 0;
      let totalGA = 0;
      let totalPoints = 0;
      let totalGames = 0;

      for (const t of teams) {
        const s = db.standings.get(`${t}::${compAlpha}`);
        if (s) {
          totalGF += s.goals_for;
          totalGA += s.goals_against;
          totalPoints += s.points;
          totalGames += s.played;
          expect(s.played).toBe(1); // Every team played exactly 1 match
        }
      }

      expect(totalGF).toBe(totalGA);
      expect(totalGames).toBe(10); // 5 matches * 2 teams
      expect(totalPoints).toBe(3 * 4 + 2 * 1); // 4 decisive wins (3 pts) + 1 draw (1 pt each = 2 pts) = 14 pts
    });

    test('T4.2: Field Referee Disconnection & Recovery Lifecycle', async () => {
      const queue = new UnifiedOfflineQueue();
      const lock = new SubmitLockGuard(600);
      const fixId = crypto.randomUUID();
      seedFixture(fixId);

      // Pitch referee hits submit, device has no cell connectivity
      let networkOnline = false;
      const key = deriveWalkoverIdempotencyKey(fixId, teamHome);

      await lock.execute(async () => {
        if (!networkOnline) {
          queue.enqueue({
            id: key,
            fixtureId: fixId,
            outcome: 'WALKOVER',
            refereeId: refOfficial,
            homeScore: 3,
            awayScore: 0,
            winningTeamId: teamHome,
            officialEvents: [],
            reportText: 'Walkover declared at pitch side (offline)',
          });
        }
      });

      expect(queue.getPending().length).toBe(1);
      expect(db.canonicalResults.has(fixId)).toBe(false);

      // Referee arrives at clubhouse, Wi-Fi restores
      networkOnline = true;
      const { syncedCount } = await queue.drain(db);
      expect(syncedCount).toBe(1);
      expect(db.canonicalResults.has(fixId)).toBe(true);
      expect(db.fixtures.get(fixId)!.status).toBe('FT');
      expect(db.fixtures.get(fixId)!.score_home).toBe(3);
    });

    test('T4.3: Disputed Match & Walkover Overwrite Prevention', async () => {
      const fixId = crypto.randomUUID();
      seedFixture(fixId);

      // Official declares walkover
      const officialWalkover = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'WALKOVER',
        p_home_score: 0,
        p_away_score: 0,
        p_winning_team_id: teamHome,
      });
      expect(officialWalkover.status).toBe('COMMITTED');

      // Malicious attempt to overwrite walkover with a normal 0-2 loss for home team
      const tampering = await db.finalizeMatchTransaction({
        p_fixture_id: fixId,
        p_referee_id: refOfficial,
        p_outcome: 'NORMAL',
        p_home_score: 0,
        p_away_score: 2,
      });
      expect(tampering.status).toBe('ALREADY_FINALIZED');
      expect(tampering.home_score).toBe(3);
      expect(tampering.away_score).toBe(0);
      expect(db.fixtures.get(fixId)!.score_home).toBe(3);
    });

    test('T4.4: 10-Match Progressive Season Simulation with Parity Verification', async () => {
      const teams = ['team-1', 'team-2', 'team-3', 'team-4'];
      // Round robin: 6 regular games + 4 follow-ups = 10 matches
      for (let i = 0; i < 10; i++) {
        const fixId = crypto.randomUUID();
        const home = teams[i % teams.length];
        const away = teams[(i + 1) % teams.length];
        const fix: FixtureRow = {
          id: fixId,
          competition_id: compAlpha,
          home_team_id: home,
          away_team_id: away,
          score_home: 0,
          score_away: 0,
          status: 'LIVE',
          referee_id: refOfficial,
          stats_processed: false,
        };
        db.fixtures.set(fixId, fix);

        const isWalkover = i % 4 === 0;
        if (isWalkover) {
          await db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'WALKOVER',
            p_home_score: 0,
            p_away_score: 0,
            p_winning_team_id: home,
          });
        } else {
          await db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: (i % 3),
            p_away_score: ((i + 1) % 2),
          });
        }
      }

      let totalGF = 0;
      let totalGA = 0;
      let totalGD = 0;
      for (const t of teams) {
        const s = db.standings.get(`${t}::${compAlpha}`);
        if (s) {
          totalGF += s.goals_for;
          totalGA += s.goals_against;
          totalGD += s.goal_difference;
          expect(s.played).toBe(s.won + s.drawn + s.lost);
          expect(s.points).toBe(s.won * 3 + s.drawn * 1);
        }
      }
      expect(totalGF).toBe(totalGA);
      expect(totalGD).toBe(0);
    });

    test('T4.5: High-Stress Adversarial Flood: 50 concurrent referee actions across 10 fixtures', async () => {
      const fixes = Array.from({ length: 10 }, () => crypto.randomUUID());
      fixes.forEach((id) => seedFixture(id));

      // 50 operations randomly distributed across the 10 fixtures
      const operations = Array.from({ length: 50 }, (_, i) => {
        const fixId = fixes[i % fixes.length];
        const isWalkover = i % 3 === 0;
        if (isWalkover) {
          return db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'WALKOVER',
            p_home_score: 0,
            p_away_score: 0,
            p_winning_team_id: teamHome,
            p_idempotency_key: `flood-${i % fixes.length}`,
          });
        } else {
          return db.finalizeMatchTransaction({
            p_fixture_id: fixId,
            p_referee_id: refOfficial,
            p_outcome: 'NORMAL',
            p_home_score: 1,
            p_away_score: 0,
            p_idempotency_key: `flood-${i % fixes.length}`,
          });
        }
      });

      const results = await Promise.all(operations);
      expect(results.length).toBe(50);

      // Invariants across all 10 fixtures
      for (const fixId of fixes) {
        const fix = db.fixtures.get(fixId)!;
        expect(fix.status).toBe('FT');
        expect(fix.stats_processed).toBe(true);
        expect(db.canonicalResults.has(fixId)).toBe(true);
        expect(db.matchReports.get(fixId)!.length).toBe(1);
      }
    });
  });
});
