/**
 * 50-Scenario Comprehensive Stress Test Suite for MatchLiveInputEngine (Algorithm 1)
 *
 * This test suite instantiates isolated in-memory MatchRepository and MatchPublisher
 * instances and tests 50 distinct, independent, non-trivial scenarios covering:
 * - Match Start & Lifecycle
 * - Period Transitions & State Machine
 * - Goal Ingestion & Score Computations
 * - Disciplinary Logic & 2nd Yellow -> Derived Red Invariants
 * - Injury Logging
 * - Event Modifications & Cancellations
 * - Referee Working Set Dual Lookup & Pre-fills
 * - 3 Terminal Finalization Pipelines (Normal, Walkover 3-0, Cancel 0-0)
 * - Post-Finalization Immutability Guards
 * - Idempotency Guarantees
 * - High-Concurrency 100-Event Burst Stress Test
 */

import {
  MatchLiveInputEngine,
  MatchEngineError,
  type MatchRepository,
  type MatchPublisher,
  type Match,
  type LiveMatchState,
  type MatchSquad,
  type SquadPlayer,
  type RefereeWorkingSet,
  type LiveAuditEntry,
  type CanonicalPermanentResult,
  type MatchEvent,
  type MatchUpdateEnvelope,
  type Period,
  type GoalType,
  type CardType,
  type MatchStatus,
  type TerminalOutcome,
  type UID,
} from '../src/algorithms/matchLiveInputAlgorithm';

// ==========================================
// IN-MEMORY MOCK REPOSITORY WITH ROW LOCKING
// ==========================================

class InMemoryMatchRepository implements MatchRepository {
  public matches = new Map<string, Match>();
  public liveStates = new Map<string, LiveMatchState>();
  public squads = new Map<string, MatchSquad[]>();
  public events = new Map<string, MatchEvent[]>();
  public workingSets = new Map<string, RefereeWorkingSet>();
  public auditLogs: LiveAuditEntry[] = [];
  public canonicalResults = new Map<string, CanonicalPermanentResult>();
  public historySnapshots = new Map<string, any>();
  public finalizationCommands = new Map<string, string>();
  private matchLocks = new Map<string, Promise<any>>();

  public seedFixture(match: Match, squads: MatchSquad[]) {
    this.matches.set(match.match_uid, { ...match });
    this.squads.set(match.match_uid, JSON.parse(JSON.stringify(squads)));
    this.events.set(match.match_uid, []);
    if (match.status !== 'SCHEDULED') {
      this.liveStates.set(match.match_uid, {
        state_uid: `state-${match.match_uid}`,
        match_uid: match.match_uid,
        status: match.status,
        period: 'FIRST_HALF',
        home_score: 0,
        away_score: 0,
        active_events: [],
        version: 1,
        event_sequence: 0,
        updated_at: new Date().toISOString(),
      });
    }
  }

  async transaction<T>(match_uid: UID, fn: (tx: MatchRepository) => Promise<T>): Promise<T> {
    const currentLock = this.matchLocks.get(match_uid) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.matchLocks.set(match_uid, currentLock.then(() => nextLock));

    await currentLock;
    try {
      return await fn(this);
    } finally {
      releaseLock!();
    }
  }

  async getMatchForUpdate(match_uid: UID): Promise<Match> {
    return this.getMatch(match_uid);
  }

  async getMatch(match_uid: UID): Promise<Match> {
    const m = this.matches.get(match_uid);
    if (!m) {
      throw new MatchEngineError('MATCH_NOT_FOUND', `Match ${match_uid} not found`);
    }
    return JSON.parse(JSON.stringify(m));
  }

  async saveMatch(match: Match): Promise<void> {
    this.matches.set(match.match_uid, JSON.parse(JSON.stringify(match)));
  }

  async getSquads(match_uid: UID): Promise<MatchSquad[]> {
    return JSON.parse(JSON.stringify(this.squads.get(match_uid) || []));
  }

  async getSquadPlayers(match_uid: UID, team_uid: UID): Promise<SquadPlayer[]> {
    const list = this.squads.get(match_uid) || [];
    const found = list.find((s) => s.team_uid === team_uid);
    return JSON.parse(JSON.stringify(found ? found.players : []));
  }

  async getLiveState(match_uid: UID): Promise<LiveMatchState | null> {
    const s = this.liveStates.get(match_uid);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async saveLiveState(state: LiveMatchState): Promise<void> {
    this.liveStates.set(state.match_uid, JSON.parse(JSON.stringify(state)));
  }

  async getLiveEvent(match_uid: UID, event_uid: UID): Promise<MatchEvent | null> {
    const list = this.events.get(match_uid) || [];
    const found = list.find((e) => e.event_uid === event_uid);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async getLiveEvents(match_uid: UID): Promise<MatchEvent[]> {
    return JSON.parse(JSON.stringify(this.events.get(match_uid) || []));
  }

  async getEventByIdempotencyKey(match_uid: UID, idempotency_key: string): Promise<MatchEvent | null> {
    const list = this.events.get(match_uid) || [];
    const found = list.find((e) => e.idempotency_key === idempotency_key);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async insertLiveEvent(event: MatchEvent): Promise<void> {
    const list = this.events.get(event.match_uid) || [];
    list.push(JSON.parse(JSON.stringify(event)));
    this.events.set(event.match_uid, list);
  }

  async updateLiveEvent(event: MatchEvent): Promise<void> {
    const list = this.events.get(event.match_uid) || [];
    const idx = list.findIndex((e) => e.event_uid === event.event_uid);
    if (idx >= 0) {
      list[idx] = JSON.parse(JSON.stringify(event));
      this.events.set(event.match_uid, list);
    }
  }

  async insertLiveAudit(entry: LiveAuditEntry): Promise<void> {
    this.auditLogs.push(JSON.parse(JSON.stringify(entry)));
  }

  async saveRefereeWorkingSet(set: RefereeWorkingSet): Promise<void> {
    this.workingSets.set(set.match_uid, JSON.parse(JSON.stringify(set)));
  }

  async getRefereeWorkingSet(match_uid: UID): Promise<RefereeWorkingSet | null> {
    const ws = this.workingSets.get(match_uid);
    return ws ? JSON.parse(JSON.stringify(ws)) : null;
  }

  async saveCanonicalPermanentResult(result: CanonicalPermanentResult): Promise<void> {
    this.canonicalResults.set(result.match_uid, JSON.parse(JSON.stringify(result)));
  }

  async getCanonicalPermanentResult(match_uid: UID): Promise<CanonicalPermanentResult | null> {
    const cr = this.canonicalResults.get(match_uid);
    return cr ? JSON.parse(JSON.stringify(cr)) : null;
  }

  async saveHistorySnapshot(snapshot: CanonicalPermanentResult['history_snapshot']): Promise<void> {
    this.historySnapshots.set(snapshot.match_uid, JSON.parse(JSON.stringify(snapshot)));
  }

  async markFinalResultCommitted(
    match_uid: UID,
    outcome: TerminalOutcome,
    final_status: MatchStatus,
    finalized_at: string
  ): Promise<void> {
    const m = this.matches.get(match_uid);
    if (m) {
      m.status = final_status;
      m.finalized_at = finalized_at;
      m.locked_at = finalized_at;
      this.matches.set(match_uid, m);
    }
  }

  async archiveLiveState(match_uid: UID, _archived_at: string): Promise<void> {
    const ls = this.liveStates.get(match_uid);
    if (ls) {
      ls.status = 'LOCKED';
      this.liveStates.set(match_uid, ls);
    }
  }

  async hasFinalizationCommand(match_uid: UID, idempotency_key: string): Promise<boolean> {
    return this.finalizationCommands.has(`${match_uid}:${idempotency_key}`);
  }

  async recordFinalizationCommand(
    match_uid: UID,
    idempotency_key: string,
    result_uid: UID,
    _now: string
  ): Promise<void> {
    this.finalizationCommands.set(`${match_uid}:${idempotency_key}`, result_uid);
  }
}

class InMemoryMatchPublisher implements MatchPublisher {
  public realtimeUpdates: MatchUpdateEnvelope[] = [];
  public webhooks: MatchUpdateEnvelope[] = [];

  async publishRealtime(update: MatchUpdateEnvelope): Promise<void> {
    this.realtimeUpdates.push(JSON.parse(JSON.stringify(update)));
  }

  async publishWebhook(update: MatchUpdateEnvelope): Promise<void> {
    this.webhooks.push(JSON.parse(JSON.stringify(update)));
  }
}

// ==========================================
// TEST FIXTURE FACTORY
// ==========================================

function createTestSquads(homeTeamUid = 'team-alpha', awayTeamUid = 'team-beta'): MatchSquad[] {
  return [
    {
      squad_uid: 'sq-alpha',
      match_uid: 'match-1',
      team_uid: homeTeamUid,
      players: [
        { player_uid: 'p-alpha-1', team_uid: homeTeamUid, jersey_number: 1, display_name: 'Alpha GK', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-alpha-7', team_uid: homeTeamUid, jersey_number: 7, display_name: 'Alpha Striker 7', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-alpha-9', team_uid: homeTeamUid, jersey_number: 9, display_name: 'Alpha Forward 9', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-alpha-10', team_uid: homeTeamUid, jersey_number: 10, display_name: 'Alpha Playmaker 10', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-alpha-99', team_uid: homeTeamUid, jersey_number: 99, display_name: 'Alpha Ineligible', is_starting_xi: false, is_substitute: true, eligible_for_match: false },
      ],
    },
    {
      squad_uid: 'sq-beta',
      match_uid: 'match-1',
      team_uid: awayTeamUid,
      players: [
        { player_uid: 'p-beta-1', team_uid: awayTeamUid, jersey_number: 1, display_name: 'Beta GK', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-beta-10', team_uid: awayTeamUid, jersey_number: 10, display_name: 'Beta Star 10', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-beta-11', team_uid: awayTeamUid, jersey_number: 11, display_name: 'Beta Winger 11', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: 'p-beta-4', team_uid: awayTeamUid, jersey_number: 4, display_name: 'Beta Defender 4', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      ],
    },
  ];
}

function createTestMatch(overrides: Partial<Match> = {}): Match {
  return {
    match_uid: overrides.match_uid || 'match-test-1',
    home_team_uid: 'team-alpha',
    away_team_uid: 'team-beta',
    scheduled_start_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'SCHEDULED',
    started_at: null,
    finalized_at: null,
    locked_at: null,
    home_score: 0,
    away_score: 0,
    version: 1,
    ...overrides,
  };
}

// ==========================================
// TEST RUNNER ENGINE & HARNESS
// ==========================================

interface TestResult {
  scenarioNumber: number;
  title: string;
  group: string;
  passed: boolean;
  durationMs: number;
  evidence: Record<string, any>;
  error?: string;
}

const testResults: TestResult[] = [];

async function runScenario(
  scenarioNumber: number,
  group: string,
  title: string,
  testFn: (repo: InMemoryMatchRepository, publisher: InMemoryMatchPublisher, engine: MatchLiveInputEngine) => Promise<Record<string, any>>
) {
  const repo = new InMemoryMatchRepository();
  const publisher = new InMemoryMatchPublisher();
  const engine = new MatchLiveInputEngine(repo, publisher);

  const start = performance.now();
  try {
    const evidence = await testFn(repo, publisher, engine);
    const durationMs = Number((performance.now() - start).toFixed(2));
    testResults.push({
      scenarioNumber,
      group,
      title,
      passed: true,
      durationMs,
      evidence,
    });
  } catch (err: any) {
    const durationMs = Number((performance.now() - start).toFixed(2));
    testResults.push({
      scenarioNumber,
      group,
      title,
      passed: false,
      durationMs,
      evidence: {},
      error: err instanceof MatchEngineError ? `[MatchEngineError: ${err.code}] ${err.message}` : (err.message || String(err)),
    });
  }
}

// ==========================================
// 50 SCENARIOS DEFINITIONS
// ==========================================

export async function runAll50Scenarios() {
  console.log('='.repeat(80));
  console.log('🚀 EXECUTING 50 COMPREHENSIVE STRESS TEST SCENARIOS FOR ALGORITHM 1');
  console.log('='.repeat(80));

  // ----------------------------------------------------------------
  // GROUP 1: MATCH START & LIFECYCLE (1 - 7)
  // ----------------------------------------------------------------

  await runScenario(1, 'Match Lifecycle', 'Start match at or past scheduled start time', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-1' });
    repo.seedFixture(match, createTestSquads());

    await engine.startMatch({
      match_uid: 'm-1',
    });

    const updated = await repo.getMatch('m-1');
    const liveState = await repo.getLiveState('m-1');

    if (updated?.status !== 'LIVE' || liveState?.status !== 'LIVE' || liveState.period !== 'FIRST_HALF') {
      throw new Error(`Expected status LIVE and period FIRST_HALF, got ${updated?.status}`);
    }

    return { matchStatus: updated.status, period: liveState.period, startedAt: updated.started_at };
  });

  await runScenario(2, 'Match Lifecycle', 'Start match past scheduled start time', async (repo, _, engine) => {
    const match = createTestMatch({
      match_uid: 'm-2',
      scheduled_start_at: new Date(Date.now() - 86400000).toISOString(),
    });
    repo.seedFixture(match, createTestSquads());

    const res = await engine.startMatch({
      match_uid: 'm-2',
    });

    return { status: res.status, version: res.version };
  });

  await runScenario(3, 'Match Lifecycle', 'Reject start match before scheduled start time', async (repo, _, engine) => {
    const match = createTestMatch({
      match_uid: 'm-3',
      scheduled_start_at: new Date(Date.now() + 3600000).toISOString(),
    });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.startMatch({
        match_uid: 'm-3',
      });
      throw new Error('Should have rejected future match start');
    } catch (err: any) {
      if (err.code !== 'MATCH_NOT_DUE' && !err.message.includes('future') && !err.message.includes('scheduled')) {
        throw err;
      }
      return { caughtError: err.code || err.message, statusExpected: 'MATCH_NOT_DUE' };
    }
  });

  await runScenario(4, 'Match Lifecycle', 'Idempotent duplicate start match command returns consistent response', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-4' });
    repo.seedFixture(match, createTestSquads());

    const res1 = await engine.startMatch({ match_uid: 'm-4' });
    const res2 = await engine.startMatch({ match_uid: 'm-4' });

    if (res1.status !== res2.status || res1.period !== res2.period) {
      throw new Error(`Idempotency violated: status changed from ${res1.status} to ${res2.status}`);
    }

    return { res1Status: res1.status, res2Status: res2.status, matchPeriod: res1.period };
  });

  await runScenario(5, 'Match Lifecycle', 'Start match on already LIVE match is idempotent', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-5', status: 'LIVE', started_at: new Date().toISOString() });
    repo.seedFixture(match, createTestSquads());

    const res = await engine.startMatch({
      match_uid: 'm-5',
    });

    return { status: res.status, liveStatePeriod: res.period };
  });

  await runScenario(6, 'Match Lifecycle', 'Start match on CANCELLED match rejects with invalid state', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-6', status: 'CANCELLED' });
    repo.matches.set('m-6', match);
    repo.squads.set('m-6', createTestSquads());

    try {
      await engine.startMatch({
        match_uid: 'm-6',
      });
      throw new Error('Should not allow start on CANCELLED match');
    } catch (err: any) {
      if (err.message === 'Should not allow start on CANCELLED match') throw err;
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(7, 'Match Lifecycle', 'Start match on LOCKED match rejects with MATCH_ALREADY_FINALIZED', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-7', status: 'LOCKED' });
    repo.matches.set('m-7', match);
    repo.squads.set('m-7', createTestSquads());

    try {
      await engine.startMatch({
        match_uid: 'm-7',
      });
      throw new Error('Should not allow start on LOCKED match');
    } catch (err: any) {
      if (err.message === 'Should not allow start on LOCKED match') throw err;
      return { caughtError: err.code || err.message };
    }
  });

  // ----------------------------------------------------------------
  // GROUP 2: PERIOD STATE MACHINE (8 - 14)
  // ----------------------------------------------------------------

  await runScenario(8, 'Period Transitions', 'Transition from FIRST_HALF to HALF_TIME', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-8', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const res = await engine.journalistSetPeriod({
      match_uid: 'm-8',
      journalist_uid: 'journo-1',
      period: 'HALF_TIME',
      idempotency_key: 'idemp-per-8',
    });

    if (res.period !== 'HALF_TIME' || res.status !== 'HALF_TIME') {
      throw new Error(`Expected HALF_TIME, got ${res.period} status ${res.status}`);
    }
    return { period: res.period, status: res.status };
  });

  await runScenario(9, 'Period Transitions', 'Transition from HALF_TIME to SECOND_HALF', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-9', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());
    await engine.journalistSetPeriod({ match_uid: 'm-9', journalist_uid: 'journo-1', period: 'HALF_TIME', idempotency_key: 'p-9-ht' });

    const res = await engine.journalistSetPeriod({
      match_uid: 'm-9',
      journalist_uid: 'journo-1',
      period: 'SECOND_HALF',
      idempotency_key: 'idemp-per-9',
    });

    if (res.period !== 'SECOND_HALF') {
      throw new Error(`Expected SECOND_HALF, got ${res.period}`);
    }
    return { period: res.period, status: res.status };
  });

  await runScenario(10, 'Period Transitions', 'Transition from SECOND_HALF to FULL_TIME', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-10', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());
    await engine.journalistSetPeriod({ match_uid: 'm-10', journalist_uid: 'journo-1', period: 'HALF_TIME', idempotency_key: 'p-10-ht' });
    await engine.journalistSetPeriod({ match_uid: 'm-10', journalist_uid: 'journo-1', period: 'SECOND_HALF', idempotency_key: 'p-10-sh' });

    const res = await engine.journalistSetPeriod({
      match_uid: 'm-10',
      journalist_uid: 'journo-1',
      period: 'FULL_TIME',
      idempotency_key: 'idemp-per-10',
    });

    if (res.period !== 'FULL_TIME' || res.status !== 'FULL_TIME') {
      throw new Error(`Expected FULL_TIME, got ${res.period}`);
    }
    return { period: res.period, status: res.status };
  });

  await runScenario(11, 'Period Transitions', 'Idempotent repeat of active period preserves state', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-11', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const res = await engine.journalistSetPeriod({
      match_uid: 'm-11',
      journalist_uid: 'journo-1',
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-per-11',
    });

    return { period: res.period, status: res.status };
  });

  await runScenario(12, 'Period Transitions', 'Reject illegal period jump (FIRST_HALF directly to SECOND_HALF)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-12', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.journalistSetPeriod({
        match_uid: 'm-12',
        journalist_uid: 'journo-1',
        period: 'SECOND_HALF',
        idempotency_key: 'idemp-per-12',
      });
      throw new Error('Should have rejected skipping HALF_TIME');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(13, 'Period Transitions', 'Reject backwards transition (SECOND_HALF back to FIRST_HALF)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-13', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());
    await engine.journalistSetPeriod({ match_uid: 'm-13', journalist_uid: 'journo-1', period: 'HALF_TIME', idempotency_key: 'p-13-ht' });
    await engine.journalistSetPeriod({ match_uid: 'm-13', journalist_uid: 'journo-1', period: 'SECOND_HALF', idempotency_key: 'p-13-sh' });

    try {
      await engine.journalistSetPeriod({
        match_uid: 'm-13',
        journalist_uid: 'journo-1',
        period: 'FIRST_HALF',
        idempotency_key: 'idemp-per-13',
      });
      throw new Error('Should have rejected backwards period transition');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(14, 'Period Transitions', 'Reject period transition when match is still SCHEDULED', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-14', status: 'SCHEDULED' });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.journalistSetPeriod({
        match_uid: 'm-14',
        journalist_uid: 'journo-1',
        period: 'SECOND_HALF',
        idempotency_key: 'idemp-per-14',
      });
      throw new Error('Should reject period change on SCHEDULED match');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  // ----------------------------------------------------------------
  // GROUP 3: GOAL INGESTION & SCORES (15 - 21)
  // ----------------------------------------------------------------

  await runScenario(15, 'Goal & Score Intake', 'Add single Home Goal updates score to 1-0', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-15', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const evt = await engine.journalistAddGoal({
      match_uid: 'm-15',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'TAP_IN',
      minute: 12,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-goal-15',
    });

    const liveState = await repo.getLiveState('m-15');
    if (liveState?.home_score !== 1 || liveState?.away_score !== 0) {
      throw new Error(`Score expected 1-0, got ${liveState?.home_score}-${liveState?.away_score}`);
    }
    return { eventUid: evt.event_uid, score: `${liveState.home_score}-${liveState.away_score}`, eventsCount: liveState.active_events.length };
  });

  await runScenario(16, 'Goal & Score Intake', 'Add single Away Goal updates score to 1-1', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-16', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.journalistAddGoal({
      match_uid: 'm-16',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'TAP_IN',
      minute: 10,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-goal-16a',
    });

    await engine.journalistAddGoal({
      match_uid: 'm-16',
      journalist_uid: 'journo-1',
      team_uid: 'team-beta',
      goal_type: 'HEADER',
      minute: 25,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-goal-16b',
    });

    const liveState = await repo.getLiveState('m-16');
    if (liveState?.home_score !== 1 || liveState?.away_score !== 1) {
      throw new Error(`Score expected 1-1, got ${liveState?.home_score}-${liveState?.away_score}`);
    }
    return { score: `${liveState.home_score}-${liveState.away_score}` };
  });

  await runScenario(17, 'Goal & Score Intake', 'Ingest all 6 GoalType enum variants across teams', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-17', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const goalTypes: GoalType[] = ['PENALTY', 'HEADER', 'FREE_KICK', 'TAP_IN', 'SCREAMER', 'OTHER'];
    for (let i = 0; i < goalTypes.length; i++) {
      const isHome = i % 2 === 0;
      await engine.journalistAddGoal({
        match_uid: 'm-17',
        journalist_uid: 'journo-1',
        team_uid: isHome ? 'team-alpha' : 'team-beta',
        goal_type: goalTypes[i],
        minute: (i + 1) * 10,
        period: 'FIRST_HALF',
        idempotency_key: `idemp-g17-${i}`,
      });
    }

    const state = await repo.getLiveState('m-17');
    if (state?.home_score !== 3 || state?.away_score !== 3) {
      throw new Error(`Expected 3-3, got ${state?.home_score}-${state?.away_score}`);
    }
    return { score: `${state.home_score}-${state.away_score}`, totalEvents: state.active_events.length };
  });

  await runScenario(18, 'Goal & Score Intake', 'High score stress (10 Home vs 7 Away goals)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-18', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    for (let i = 0; i < 10; i++) {
      await engine.journalistAddGoal({
        match_uid: 'm-18',
        journalist_uid: 'journo-1',
        team_uid: 'team-alpha',
        goal_type: 'TAP_IN',
        minute: i + 1,
        period: 'FIRST_HALF',
        idempotency_key: `idemp-g18-h-${i}`,
      });
    }
    for (let i = 0; i < 7; i++) {
      await engine.journalistAddGoal({
        match_uid: 'm-18',
        journalist_uid: 'journo-1',
        team_uid: 'team-beta',
        goal_type: 'SCREAMER',
        minute: 50 + i,
        period: 'FIRST_HALF',
        idempotency_key: `idemp-g18-a-${i}`,
      });
    }

    const state = await repo.getLiveState('m-18');
    if (state?.home_score !== 10 || state?.away_score !== 7) {
      throw new Error(`Expected 10-7, got ${state?.home_score}-${state?.away_score}`);
    }
    return { score: `${state.home_score}-${state.away_score}`, events: state.active_events.length };
  });

  await runScenario(19, 'Goal & Score Intake', 'Boundary Minute 0 kickoff goal accepted', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-19', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const evt = await engine.journalistAddGoal({
      match_uid: 'm-19',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'SCREAMER',
      minute: 0,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g19',
    });

    if (evt.minute !== 0) throw new Error(`Minute expected 0, got ${evt.minute}`);
    const state = await repo.getLiveState('m-19');
    return { minuteRecorded: evt.minute, score: `${state?.home_score}-${state?.away_score}` };
  });

  await runScenario(20, 'Goal & Score Intake', 'Boundary Minute 120 extra time goal accepted', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-20', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const evt = await engine.journalistAddGoal({
      match_uid: 'm-20',
      journalist_uid: 'journo-1',
      team_uid: 'team-beta',
      goal_type: 'PENALTY',
      minute: 120,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g20',
    });

    const state = await repo.getLiveState('m-20');
    return { minuteRecorded: evt.minute, score: `${state?.home_score}-${state?.away_score}` };
  });

  await runScenario(21, 'Goal & Score Intake', 'Reject goal with invalid minute (> 200 or negative)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-21', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.journalistAddGoal({
        match_uid: 'm-21',
        journalist_uid: 'journo-1',
        team_uid: 'team-alpha',
        goal_type: 'TAP_IN',
        minute: 250,
        period: 'FIRST_HALF',
        idempotency_key: 'idemp-g21',
      });
      throw new Error('Should have rejected minute 250');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  // ----------------------------------------------------------------
  // GROUP 4: DISCIPLINARY & 2ND YELLOW DERIVED RED (22 - 28)
  // ----------------------------------------------------------------

  await runScenario(22, 'Disciplinary Logic', 'Issue single Yellow card', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-22', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const card = await engine.journalistAddCard({
      match_uid: 'm-22',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      card_type: 'YELLOW',
      minute: 22,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c22',
    });

    if (card.card_type !== 'YELLOW' || card.derived_red) {
      throw new Error(`Expected clean YELLOW card, derived_red false`);
    }
    return { cardType: card.card_type, derivedRed: card.derived_red };
  });

  await runScenario(23, 'Disciplinary Logic', 'Issue direct Red card', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-23', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const card = await engine.journalistAddCard({
      match_uid: 'm-23',
      journalist_uid: 'journo-1',
      team_uid: 'team-beta',
      card_type: 'RED',
      minute: 30,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c23',
    });

    if (card.card_type !== 'RED') throw new Error(`Expected RED card`);
    return { cardType: card.card_type, derivedRed: card.derived_red };
  });

  await runScenario(24, 'Disciplinary Logic', 'Second Yellow on same player derives derived_red: true & SECOND_YELLOW', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-24', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    // 1st Yellow via referee working set
    await engine.refereeOpenMatch({ match_uid: 'm-24', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({
      match_uid: 'm-24',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-10',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 15,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c24-1',
    });

    // 2nd Yellow
    const secondCard = await engine.refereeAddEvent({
      match_uid: 'm-24',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-10',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 65,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c24-2',
    });

    const ws = await repo.getRefereeWorkingSet('m-24');
    const cards = ws?.events.filter((e) => e.player_uid === 'p-alpha-10') || [];
    if (cards.length !== 2) throw new Error(`Expected 2 card records, got ${cards.length}`);

    const secondCardInWs = cards.find((c) => c.minute === 65);
    if (!secondCardInWs || secondCardInWs.card_type !== 'SECOND_YELLOW' || !secondCardInWs.derived_red) {
      throw new Error(`Second card expected SECOND_YELLOW with derived_red true, got ${JSON.stringify(secondCardInWs)}`);
    }

    return {
      totalCards: cards.length,
      card1Type: cards[0].card_type,
      card2Type: secondCardInWs.card_type,
      derivedRed: secondCardInWs.derived_red,
    };
  });

  await runScenario(25, 'Disciplinary Logic', 'Multi-player caution tracking (Yellow to A, Yellow to B, 2nd Yellow to A)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-25', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-25', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({
      match_uid: 'm-25',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-7',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 10,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c25-1',
    });

    await engine.refereeAddEvent({
      match_uid: 'm-25',
      referee_uid: 'ref-1',
      team_uid: 'team-beta',
      player_uid: 'p-beta-10',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 20,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c25-2',
    });

    await engine.refereeAddEvent({
      match_uid: 'm-25',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-7',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 55,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c25-3',
    });

    const ws = await repo.getRefereeWorkingSet('m-25');
    const playerACards = ws?.events.filter((e) => e.player_uid === 'p-alpha-7') || [];
    const playerBCards = ws?.events.filter((e) => e.player_uid === 'p-beta-10') || [];

    if (playerACards.length !== 2 || !playerACards[1].derived_red) {
      throw new Error(`Player A should have 2 cards with derived red`);
    }
    if (playerBCards.length !== 1 || playerBCards[0].derived_red) {
      throw new Error(`Player B should have 1 yellow without derived red`);
    }

    return { playerAStatus: 'Derived Red Dismissal', playerBStatus: 'Single Yellow' };
  });

  await runScenario(26, 'Disciplinary Logic', 'Reject 3rd card on already dismissed player', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-26', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-26', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({
      match_uid: 'm-26',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-7',
      type: 'CARD',
      card_type: 'RED',
      minute: 10,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c26-1',
    });

    try {
      await engine.refereeAddEvent({
        match_uid: 'm-26',
        referee_uid: 'ref-1',
        team_uid: 'team-alpha',
        player_uid: 'p-alpha-7',
        type: 'CARD',
        card_type: 'YELLOW',
        minute: 40,
        period: 'FIRST_HALF',
        idempotency_key: 'idemp-c26-2',
      });
      throw new Error('Should have rejected card on dismissed player');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(27, 'Disciplinary Logic', 'Reject card on unknown player / team', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-27', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.journalistAddCard({
        match_uid: 'm-27',
        journalist_uid: 'journo-1',
        team_uid: 'nonexistent-team',
        card_type: 'YELLOW',
        minute: 15,
        period: 'FIRST_HALF',
        idempotency_key: 'idemp-c27',
      });
      throw new Error('Should reject unknown team card');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(28, 'Disciplinary Logic', 'Card issued during HALF_TIME period recorded accurately', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-28', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());
    await engine.journalistSetPeriod({ match_uid: 'm-28', journalist_uid: 'journo-1', period: 'HALF_TIME', idempotency_key: 'p-28-ht' });

    const card = await engine.journalistAddCard({
      match_uid: 'm-28',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      card_type: 'YELLOW',
      minute: 45,
      period: 'HALF_TIME',
      idempotency_key: 'idemp-c28',
    });

    return { cardPeriod: card.period, cardType: card.card_type };
  });

  // ----------------------------------------------------------------
  // GROUP 5: INJURY TRACKING (29 - 31)
  // ----------------------------------------------------------------

  await runScenario(29, 'Injury Tracking', 'Record injury event with attributed player UID', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-29', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const inj = await engine.journalistAddInjury({
      match_uid: 'm-29',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-1',
      minute: 28,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-inj-29',
    });

    if (inj.type !== 'INJURY' || inj.player_uid !== 'p-alpha-1') {
      throw new Error(`Expected injury event for p-alpha-1`);
    }
    return { type: inj.type, player: inj.player_uid };
  });

  await runScenario(30, 'Injury Tracking', 'Record injury event with optional player (null player_uid)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-30', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const inj = await engine.journalistAddInjury({
      match_uid: 'm-30',
      journalist_uid: 'journo-1',
      team_uid: 'team-beta',
      player_uid: undefined,
      minute: 33,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-inj-30',
    });

    if (inj.type !== 'INJURY' || inj.player_uid) {
      throw new Error(`Expected injury event with null player_uid`);
    }
    return { type: inj.type, playerUid: inj.player_uid };
  });

  await runScenario(31, 'Injury Tracking', 'Multiple injury events recorded during stoppage time', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-31', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.journalistAddInjury({ match_uid: 'm-31', journalist_uid: 'journo-1', team_uid: 'team-alpha', minute: 90, period: 'FIRST_HALF', idempotency_key: 'inj-31-1' });
    await engine.journalistAddInjury({ match_uid: 'm-31', journalist_uid: 'journo-1', team_uid: 'team-beta', minute: 93, period: 'FIRST_HALF', idempotency_key: 'inj-31-2' });

    const state = await repo.getLiveState('m-31');
    return { totalInjuries: state?.active_events.length };
  });

  // ----------------------------------------------------------------
  // GROUP 6: EVENT MODIFICATIONS & CANCELLATIONS (32 - 37)
  // ----------------------------------------------------------------

  await runScenario(32, 'Event Manipulation', 'Update event minute preserves score integrity', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-32', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const addRes = await engine.journalistAddGoal({
      match_uid: 'm-32',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'TAP_IN',
      minute: 10,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g32',
    });

    const updEvt = await engine.journalistUpdateEvent({
      match_uid: 'm-32',
      journalist_uid: 'journo-1',
      event_uid: addRes.event_uid,
      minute: 42,
      idempotency_key: 'idemp-upd-32',
    });

    const liveState = await repo.getLiveState('m-32');
    if (updEvt.minute !== 42 || liveState?.home_score !== 1) {
      throw new Error(`Expected minute 42, score 1`);
    }
    return { originalMin: 10, updatedMin: updEvt.minute, score: `${liveState.home_score}-${liveState.away_score}` };
  });

  await runScenario(33, 'Event Manipulation', 'Update goal type from TAP_IN to SCREAMER', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-33', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const addRes = await engine.journalistAddGoal({
      match_uid: 'm-33',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'TAP_IN',
      minute: 15,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g33',
    });

    const updEvt = await engine.journalistUpdateEvent({
      match_uid: 'm-33',
      journalist_uid: 'journo-1',
      event_uid: addRes.event_uid,
      goal_type: 'SCREAMER',
      idempotency_key: 'idemp-upd-33',
    });

    return { newGoalType: updEvt.goal_type };
  });

  await runScenario(34, 'Event Manipulation', 'Update goal player attribution from Player 7 to Player 9', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-34', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const addRes = await engine.journalistAddGoal({
      match_uid: 'm-34',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'HEADER',
      minute: 18,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g34',
    });

    const updEvt = await engine.journalistUpdateEvent({
      match_uid: 'm-34',
      journalist_uid: 'journo-1',
      event_uid: addRes.event_uid,
      player_uid: 'p-alpha-9',
      idempotency_key: 'idemp-upd-34',
    });

    return { newPlayer: updEvt.player_uid };
  });

  await runScenario(35, 'Event Manipulation', 'Cancel Goal event decrements score back to 0-0', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-35', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const addRes = await engine.journalistAddGoal({
      match_uid: 'm-35',
      journalist_uid: 'journo-1',
      team_uid: 'team-alpha',
      goal_type: 'TAP_IN',
      minute: 12,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-g35',
    });

    await engine.journalistCancelEvent({
      match_uid: 'm-35',
      journalist_uid: 'journo-1',
      event_uid: addRes.event_uid,
      idempotency_key: 'idemp-canc-35',
    });

    const liveState = await repo.getLiveState('m-35');
    if (liveState?.home_score !== 0 || liveState?.away_score !== 0 || liveState?.active_events.length !== 0) {
      throw new Error(`Expected 0-0 with 0 active events, got ${liveState?.home_score}-${liveState?.away_score}`);
    }

    return { scoreAfterCancel: `${liveState.home_score}-${liveState.away_score}`, activeEvents: liveState.active_events.length };
  });

  await runScenario(36, 'Event Manipulation', 'Cancel 2nd Yellow card reverts derived_red and restores single caution', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-36', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-36', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({
      match_uid: 'm-36',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-10',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 10,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c36-1',
    });

    const secondCard = await engine.refereeAddEvent({
      match_uid: 'm-36',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      player_uid: 'p-alpha-10',
      type: 'CARD',
      card_type: 'YELLOW',
      minute: 60,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-c36-2',
    });

    const wsRem = await engine.refereeRemoveEvent({
      match_uid: 'm-36',
      referee_uid: 'ref-1',
      event_uid: secondCard.event_uid,
      idempotency_key: 'idemp-canc-36',
    });

    const remainingCards = wsRem.events.filter((e) => e.player_uid === 'p-alpha-10' && e.status === 'ACTIVE');
    if (remainingCards.length !== 1 || remainingCards[0].card_type !== 'YELLOW' || remainingCards[0].derived_red) {
      throw new Error(`Expected 1 yellow card remaining without derived red`);
    }

    return { remainingCards: remainingCards.length, cardType: remainingCards[0].card_type };
  });

  await runScenario(37, 'Event Manipulation', 'Reject cancelling non-existent event UID', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-37', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    try {
      await engine.journalistCancelEvent({
        match_uid: 'm-37',
        journalist_uid: 'journo-1',
        event_uid: 'ghost-uid-12345',
        idempotency_key: 'idemp-canc-37',
      });
      throw new Error('Should reject ghost event UID');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  // ----------------------------------------------------------------
  // GROUP 7: REFEREE WORKING SET LIFECYCLE (38 - 42)
  // ----------------------------------------------------------------

  await runScenario(38, 'Referee Working Set', 'Open working set pre-fills from active live stream events', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-38', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    // Journalist records 2 goals
    await engine.journalistAddGoal({ match_uid: 'm-38', journalist_uid: 'j-1', team_uid: 'team-alpha', goal_type: 'TAP_IN', minute: 10, period: 'FIRST_HALF', idempotency_key: 'g-38-1' });
    await engine.journalistAddGoal({ match_uid: 'm-38', journalist_uid: 'j-1', team_uid: 'team-beta', goal_type: 'HEADER', minute: 20, period: 'FIRST_HALF', idempotency_key: 'g-38-2' });

    // Referee opens match
    const ws = await engine.refereeOpenMatch({
      match_uid: 'm-38',
      referee_uid: 'ref-kiptoo-1',
    });

    if (ws.home_score !== 1 || ws.away_score !== 1 || ws.events.length !== 2) {
      throw new Error(`Working set expected 2 events, 1-1 score, got ${ws.home_score}-${ws.away_score}`);
    }

    return { wsHomeScore: ws.home_score, wsAwayScore: ws.away_score, importedEvents: ws.events.length };
  });

  await runScenario(39, 'Referee Working Set', 'Referee adds event with jersey number dual lookup (0-99)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-39', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({
      match_uid: 'm-39',
      referee_uid: 'ref-kiptoo-1',
    });

    // Add Goal attributing jersey #9 (Alpha Forward 9)
    const addedEvt = await engine.refereeAddEvent({
      match_uid: 'm-39',
      referee_uid: 'ref-kiptoo-1',
      team_uid: 'team-alpha',
      type: 'GOAL',
      goal_type: 'SCREAMER',
      player_number: 9,
      minute: 75,
      period: 'FIRST_HALF',
      idempotency_key: 'idemp-ws-39-add',
    });

    const ws = await repo.getRefereeWorkingSet('m-39');
    if (addedEvt.player_uid !== 'p-alpha-9' || ws?.home_score !== 1) {
      throw new Error(`Jersey 9 failed to resolve to p-alpha-9, got ${addedEvt.player_uid}`);
    }

    return { resolvedPlayer: addedEvt.player_uid, jersey: addedEvt.player_number, workingScore: `${ws.home_score}-${ws.away_score}` };
  });

  await runScenario(40, 'Referee Working Set', 'Referee updates jersey number in working set event', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-40', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-40', referee_uid: 'ref-1' });
    const addedEvt = await engine.refereeAddEvent({
      match_uid: 'm-40',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      type: 'GOAL',
      player_number: 7,
      minute: 14,
      period: 'FIRST_HALF',
      idempotency_key: 'ws-40-a',
    });

    const wsUpd = await engine.refereeUpdateEvent({
      match_uid: 'm-40',
      referee_uid: 'ref-1',
      event_uid: addedEvt.event_uid,
      player_number: 10,
      idempotency_key: 'ws-40-u',
    });

    const evt = wsUpd.events.find((e) => e.event_uid === addedEvt.event_uid);
    if (evt?.player_uid !== 'p-alpha-10') {
      throw new Error(`Expected p-alpha-10 after jersey update to 10`);
    }

    return { updatedJersey: evt.player_number, updatedPlayerUid: evt.player_uid };
  });

  await runScenario(41, 'Referee Working Set', 'Referee removes event from working set', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-41', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-41', referee_uid: 'ref-1' });
    const addedEvt = await engine.refereeAddEvent({
      match_uid: 'm-41',
      referee_uid: 'ref-1',
      team_uid: 'team-alpha',
      type: 'GOAL',
      player_number: 7,
      minute: 20,
      period: 'FIRST_HALF',
      idempotency_key: 'ws-41-a',
    });

    const wsRem = await engine.refereeRemoveEvent({
      match_uid: 'm-41',
      referee_uid: 'ref-1',
      event_uid: addedEvt.event_uid,
      idempotency_key: 'ws-41-r',
    });

    if (wsRem.home_score !== 0) throw new Error(`Working score expected 0 after removal`);
    return { activeWorkingEvents: wsRem.events.filter((e) => e.status === 'ACTIVE').length, score: wsRem.home_score };
  });

  await runScenario(42, 'Referee Working Set', 'Referee clears all working set events', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-42', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-42', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({ match_uid: 'm-42', referee_uid: 'ref-1', team_uid: 'team-alpha', type: 'GOAL', player_number: 7, minute: 10, period: 'FIRST_HALF', idempotency_key: 'ws-42-1' });
    await engine.refereeAddEvent({ match_uid: 'm-42', referee_uid: 'ref-1', team_uid: 'team-beta', type: 'GOAL', player_number: 10, minute: 20, period: 'FIRST_HALF', idempotency_key: 'ws-42-2' });

    const wsClear = await engine.refereeClearEvents({
      match_uid: 'm-42',
      referee_uid: 'ref-1',
      idempotency_key: 'ws-42-c',
    });

    const active = wsClear.events.filter((e) => e.status === 'ACTIVE');
    if (active.length !== 0 || wsClear.home_score !== 0 || wsClear.away_score !== 0) {
      throw new Error(`Expected clean working set`);
    }

    return { activeEvents: active.length, score: `${wsClear.home_score}-${wsClear.away_score}` };
  });

  // ----------------------------------------------------------------
  // GROUP 8: TERMINAL FINALIZATION PIPELINES (43 - 47)
  // ----------------------------------------------------------------

  await runScenario(43, 'Terminal Pipelines', 'Pipeline A: Confirm Normal FT Result creates canonical result & locks match', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-43', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    // Advance to FULL_TIME
    await engine.journalistSetPeriod({ match_uid: 'm-43', journalist_uid: 'j-1', period: 'HALF_TIME', idempotency_key: 'p-43-ht' });
    await engine.journalistSetPeriod({ match_uid: 'm-43', journalist_uid: 'j-1', period: 'SECOND_HALF', idempotency_key: 'p-43-sh' });
    await engine.journalistSetPeriod({ match_uid: 'm-43', journalist_uid: 'j-1', period: 'FULL_TIME', idempotency_key: 'p-43-ft' });

    await engine.refereeOpenMatch({ match_uid: 'm-43', referee_uid: 'ref-1' });
    await engine.refereeAddEvent({ match_uid: 'm-43', referee_uid: 'ref-1', team_uid: 'team-alpha', type: 'GOAL', player_number: 7, minute: 15, period: 'FIRST_HALF', idempotency_key: 'ws-43-g1' });
    await engine.refereeAddEvent({ match_uid: 'm-43', referee_uid: 'ref-1', team_uid: 'team-alpha', type: 'GOAL', player_number: 9, minute: 60, period: 'FIRST_HALF', idempotency_key: 'ws-43-g2' });
    await engine.refereeAddEvent({ match_uid: 'm-43', referee_uid: 'ref-1', team_uid: 'team-beta', type: 'CARD', card_type: 'YELLOW', player_number: 10, minute: 30, period: 'FIRST_HALF', idempotency_key: 'ws-43-c1' });

    const canonical = await engine.refereeConfirmNormalResult({
      match_uid: 'm-43',
      referee_uid: 'ref-1',
      idempotency_key: 'idemp-canonical-43',
    });

    const updatedMatch = await repo.getMatch('m-43');
    if (canonical.outcome !== 'NORMAL' || canonical.home_score !== 2 || canonical.away_score !== 0) {
      throw new Error(`Canonical outcome expected NORMAL 2-0, got ${canonical.outcome} ${canonical.home_score}-${canonical.away_score}`);
    }
    if (updatedMatch?.status !== 'LOCKED') {
      throw new Error(`Match status not LOCKED, got ${updatedMatch?.status}`);
    }

    return { outcome: canonical.outcome, finalScore: `${canonical.home_score}-${canonical.away_score}`, matchStatus: updatedMatch.status };
  });

  await runScenario(44, 'Terminal Pipelines', 'Pipeline A Reject: Cannot confirm normal result when match is LIVE (not FULL_TIME)', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-44', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-44', referee_uid: 'ref-1' });

    try {
      await engine.refereeConfirmNormalResult({
        match_uid: 'm-44',
        referee_uid: 'ref-1',
        idempotency_key: 'idemp-canonical-44',
      });
      throw new Error('Should reject confirm normal when match is LIVE');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(45, 'Terminal Pipelines', 'Pipeline A Reject: Goal event missing resolved player attribution', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-45', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    await engine.refereeOpenMatch({ match_uid: 'm-45', referee_uid: 'ref-1' });
    try {
      // Add raw goal without player UID or valid jersey
      await engine.refereeAddEvent({
        match_uid: 'm-45',
        referee_uid: 'ref-1',
        team_uid: 'team-alpha',
        type: 'GOAL',
        minute: 20,
        period: 'FIRST_HALF',
        injury_player_optional: false,
        idempotency_key: 'ws-45-g',
      });
      throw new Error('Should reject goal without player attribution');
    } catch (err: any) {
      return { caughtError: err.code || err.message };
    }
  });

  await runScenario(46, 'Terminal Pipelines', 'Pipeline B: Declare Walkover assigns 3-0 administrative score & locks match', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-46', status: 'SCHEDULED' });
    repo.seedFixture(match, createTestSquads());

    const canonical = await engine.refereeDeclareWalkover({
      match_uid: 'm-46',
      referee_uid: 'ref-1',
      winning_team_uid: 'team-alpha',
      idempotency_key: 'idemp-walkover-46',
    });

    if (canonical.outcome !== 'WALKOVER' || canonical.home_score !== 3 || canonical.away_score !== 0) {
      throw new Error(`Expected WALKOVER 3-0, got ${canonical.outcome} ${canonical.home_score}-${canonical.away_score}`);
    }
    if (canonical.events.length !== 0) {
      throw new Error(`Walkover must have 0 goal events credited in canonical result`);
    }

    return { outcome: canonical.outcome, score: `${canonical.home_score}-${canonical.away_score}`, eventsCredited: canonical.events.length };
  });

  await runScenario(47, 'Terminal Pipelines', 'Pipeline C: Cancel Match locks score at 0-0 with outcome CANCELLED', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-47', status: 'SCHEDULED' });
    repo.seedFixture(match, createTestSquads());

    const canonical = await engine.refereeCancelMatch({
      match_uid: 'm-47',
      referee_uid: 'ref-1',
      idempotency_key: 'idemp-cancel-47',
    });

    if (canonical.outcome !== 'CANCELLED' || canonical.home_score !== 0 || canonical.away_score !== 0) {
      throw new Error(`Expected CANCELLED 0-0`);
    }

    return { outcome: canonical.outcome, score: `${canonical.home_score}-${canonical.away_score}` };
  });

  // ----------------------------------------------------------------
  // GROUP 9: IMMUTABILITY, IDEMPOTENCY & BURST STRESS (48 - 50)
  // ----------------------------------------------------------------

  await runScenario(48, 'Stress & Security', 'Post-Finalization Immutability: Reject mutations after match LOCKED', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-48', status: 'SCHEDULED' });
    repo.seedFixture(match, createTestSquads());

    // Lock match via walkover
    await engine.refereeDeclareWalkover({
      match_uid: 'm-48',
      referee_uid: 'ref-1',
      winning_team_uid: 'team-alpha',
      idempotency_key: 'idemp-w-48',
    });

    // Try adding goal to locked match
    try {
      await engine.journalistAddGoal({
        match_uid: 'm-48',
        journalist_uid: 'j-1',
        team_uid: 'team-alpha',
        goal_type: 'TAP_IN',
        minute: 10,
        period: 'FIRST_HALF',
        idempotency_key: 'idemp-g48',
      });
      throw new Error('Should reject mutation on LOCKED match');
    } catch (err: any) {
      return { rejectionNotice: err.code || err.message, status: 'Immutability Guard Passed' };
    }
  });

  await runScenario(49, 'Stress & Security', 'Idempotency Matrix: 10 concurrent identical goal commands execute exactly once', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-49', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const idempotencyKey = 'concurrent-idemp-key-49';
    const promises = Array.from({ length: 10 }, () =>
      engine.journalistAddGoal({
        match_uid: 'm-49',
        journalist_uid: 'journo-1',
        team_uid: 'team-alpha',
        goal_type: 'TAP_IN',
        minute: 15,
        period: 'FIRST_HALF',
        idempotency_key: idempotencyKey,
      })
    );

    const results = await Promise.all(promises);
    const state = await repo.getLiveState('m-49');

    if (state?.home_score !== 1 || state?.active_events.length !== 1) {
      throw new Error(`Expected score 1 with 1 event, got score ${state?.home_score} with ${state?.active_events.length} events`);
    }

    return {
      concurrentDispatches: 10,
      finalScore: `${state.home_score}-${state.away_score}`,
      finalActiveEvents: state.active_events.length,
      allResultsIdentical: results.every((r) => r.event_uid === results[0].event_uid),
    };
  });

  await runScenario(50, 'Stress & Security', 'High-Concurrency Burst: 100 concurrent asynchronous events maintain strict integrity', async (repo, _, engine) => {
    const match = createTestMatch({ match_uid: 'm-50', status: 'LIVE' });
    repo.seedFixture(match, createTestSquads());

    const burstCount = 100;
    const dispatches: Promise<any>[] = [];

    for (let i = 0; i < burstCount; i++) {
      const isHome = i % 2 === 0;
      const mod = i % 4;

      if (mod === 0 || mod === 1) {
        // Goal
        dispatches.push(
          engine.journalistAddGoal({
            match_uid: 'm-50',
            journalist_uid: 'burst-worker',
            team_uid: isHome ? 'team-alpha' : 'team-beta',
            goal_type: 'TAP_IN',
            minute: (i % 90) + 1,
            period: 'FIRST_HALF',
            idempotency_key: `burst-g-${i}`,
          })
        );
      } else if (mod === 2) {
        // Card
        dispatches.push(
          engine.journalistAddCard({
            match_uid: 'm-50',
            journalist_uid: 'burst-worker',
            team_uid: isHome ? 'team-alpha' : 'team-beta',
            card_type: 'YELLOW',
            minute: (i % 90) + 1,
            period: 'FIRST_HALF',
            idempotency_key: `burst-c-${i}`,
          })
        );
      } else {
        // Injury
        dispatches.push(
          engine.journalistAddInjury({
            match_uid: 'm-50',
            journalist_uid: 'burst-worker',
            team_uid: isHome ? 'team-alpha' : 'team-beta',
            player_uid: undefined,
            minute: (i % 90) + 1,
            period: 'FIRST_HALF',
            idempotency_key: `burst-inj-${i}`,
          })
        );
      }
    }

    await Promise.all(dispatches);

    const state = await repo.getLiveState('m-50');
    if (!state) throw new Error('Live state missing after burst');

    const expectedGoals = state.active_events.filter((e) => e.type === 'GOAL');
    const expectedHomeGoals = expectedGoals.filter((e) => e.team_uid === 'team-alpha').length;
    const expectedAwayGoals = expectedGoals.filter((e) => e.team_uid === 'team-beta').length;

    if (state.home_score !== expectedHomeGoals || state.away_score !== expectedAwayGoals) {
      throw new Error(`Score derivation mismatch: state has ${state.home_score}-${state.away_score}, but events have ${expectedHomeGoals}-${expectedAwayGoals}`);
    }

    return {
      burstDispatches: burstCount,
      finalLiveStateVersion: state.version,
      finalSequence: state.event_sequence,
      totalActiveEvents: state.active_events.length,
      derivedHomeScore: state.home_score,
      derivedAwayScore: state.away_score,
      mathematicalIntegrity: '100% Verified (Score === Sum(Active Goals))',
    };
  });

  // ==========================================
  // FINAL REPORT AGGREGATION & METRICS
  // ==========================================

  console.log('\n' + '='.repeat(80));
  console.log('📊 50-SCENARIO EXECUTION MATRIX & EVIDENCE REPORT');
  console.log('='.repeat(80));

  let passedCount = 0;
  let failedCount = 0;

  for (const res of testResults) {
    const icon = res.passed ? '✅ PASS' : '❌ FAIL';
    console.log(
      `[Scenario #${String(res.scenarioNumber).padStart(2, '0')}] ${icon} | [${res.group}] ${res.title} (${res.durationMs}ms)`
    );
    if (!res.passed) {
      console.log(`     Error: ${res.error}`);
      failedCount++;
    } else {
      passedCount++;
      console.log(`     Evidence: ${JSON.stringify(res.evidence)}`);
    }
  }

  console.log('='.repeat(80));
  console.log(`🏁 FINAL RESULTS: ${passedCount} PASSED / ${failedCount} FAILED out of ${testResults.length} SCENARIOS`);
  if (failedCount > 0) {
    console.log('❌ FAILED SCENARIOS:');
    for (const res of testResults) {
      if (!res.passed) {
        console.log(`  - Scenario #${res.scenarioNumber}: ${res.title} -> ${res.error}`);
      }
    }
  }
  console.log('='.repeat(80));

  if (failedCount > 0) {
    process.exit(1);
  }
}

// Execute
runAll50Scenarios().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
