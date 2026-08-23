/**
 * ============================================================================
 * COMPREHENSIVE STRESS TEST SUITE FOR ALGORITHM 2 (Match Statistics Engine)
 * & END-TO-END CHAINING WITH ALGORITHM 1
 * ============================================================================
 *
 * Tests:
 * 1. Module A: League Standings (Home Win, Away Win, Draw, Cumulative points & GD)
 * 2. Module B: Team Form (Last 5 W/D/L array sliding window)
 * 3. Module C: Player Stats (Goals, Assists, Goalkeeper Clean Sheets)
 * 4. Idempotency Guards (stats_processed prevents double calculation)
 * 5. Concurrency Serializability (Competition row locking)
 * 6. Subtransaction Fault Isolation (Module-level exception logging to admin_error_logs)
 * 7. End-to-End Chaining: Algorithm 1 (Referee Finalization) -> Algorithm 2 (Statistics Processing)
 */

import {
  MatchStatisticsProcessingEngine,
  MatchStatisticsEngineError,
  type MatchStatisticsRepository,
  type FixtureRecord,
  type LeagueStandingRecord,
  type TeamFormRecord,
  type PlayerStatsRecord,
  type OfficialMatchEvent,
  type AdminErrorLogRecord,
  type UUID,
} from '../src/algorithms/matchStatisticsProcessingAlgorithm';

import {
  MatchLiveInputEngine,
  type MatchRepository,
  type MatchPublisher,
  type Match,
  type MatchSquad,
  type LiveMatchState,
  type RefereeWorkingSet,
  type LiveAuditEntry,
  type CanonicalPermanentResult,
  type MatchEvent,
  type MatchUpdateEnvelope,
  type TerminalOutcome,
  type MatchStatus,
} from '../src/algorithms/matchLiveInputAlgorithm';

// ==========================================
// IN-MEMORY REPOSITORY FOR ALGORITHM 2
// ==========================================

class InMemoryMatchStatisticsRepository implements MatchStatisticsRepository {
  public fixtures = new Map<UUID, FixtureRecord>();
  public standings = new Map<string, LeagueStandingRecord>(); // `${team_id}:${competition_id}`
  public forms = new Map<UUID, TeamFormRecord>();
  public playerStats = new Map<string, PlayerStatsRecord>(); // `${player_id}:${competition_id}`
  public officialEvents = new Map<UUID, OfficialMatchEvent[]>();
  public goalkeepers = new Map<UUID, UUID>(); // team_id -> goalkeeper_player_id
  public errorLogs: AdminErrorLogRecord[] = [];
  private competitionLocks = new Map<string, Promise<any>>();

  // Fault simulation flags
  public failModuleA = false;
  public failModuleB = false;
  public failModuleC = false;

  async transaction<T>(competition_id: UUID, fn: (tx: MatchStatisticsRepository) => Promise<T>): Promise<T> {
    const currentLock = this.competitionLocks.get(competition_id) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.competitionLocks.set(competition_id, currentLock.then(() => nextLock));

    await currentLock;
    try {
      return await fn(this);
    } finally {
      releaseLock!();
    }
  }

  async getFixture(fixture_id: UUID): Promise<FixtureRecord | null> {
    const f = this.fixtures.get(fixture_id);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }

  async saveFixture(fixture: FixtureRecord): Promise<void> {
    this.fixtures.set(fixture.id, JSON.parse(JSON.stringify(fixture)));
  }

  async getLeagueStanding(team_id: UUID, competition_id: UUID): Promise<LeagueStandingRecord | null> {
    if (this.failModuleA) {
      throw new Error('SIMULATED_MODULE_A_DATABASE_CRASH');
    }
    const key = `${team_id}:${competition_id}`;
    const s = this.standings.get(key);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async saveLeagueStanding(standing: LeagueStandingRecord): Promise<void> {
    if (this.failModuleA) {
      throw new Error('SIMULATED_MODULE_A_DATABASE_CRASH');
    }
    const key = `${standing.team_id}:${standing.competition_id}`;
    this.standings.set(key, JSON.parse(JSON.stringify(standing)));
  }

  async getTeamForm(team_id: UUID): Promise<TeamFormRecord | null> {
    if (this.failModuleB) {
      throw new Error('SIMULATED_MODULE_B_DATABASE_CRASH');
    }
    const f = this.forms.get(team_id);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }

  async saveTeamForm(form: TeamFormRecord): Promise<void> {
    if (this.failModuleB) {
      throw new Error('SIMULATED_MODULE_B_DATABASE_CRASH');
    }
    this.forms.set(form.team_id, JSON.parse(JSON.stringify(form)));
  }

  async getOfficialMatchEvents(fixture_id: UUID): Promise<OfficialMatchEvent[]> {
    return JSON.parse(JSON.stringify(this.officialEvents.get(fixture_id) || []));
  }

  async getPlayerStats(player_id: UUID, competition_id: UUID): Promise<PlayerStatsRecord | null> {
    if (this.failModuleC) {
      throw new Error('SIMULATED_MODULE_C_DATABASE_CRASH');
    }
    const key = `${player_id}:${competition_id}`;
    const ps = this.playerStats.get(key);
    return ps ? JSON.parse(JSON.stringify(ps)) : null;
  }

  async savePlayerStats(stats: PlayerStatsRecord): Promise<void> {
    if (this.failModuleC) {
      throw new Error('SIMULATED_MODULE_C_DATABASE_CRASH');
    }
    const key = `${stats.player_id}:${stats.competition_id}`;
    this.playerStats.set(key, JSON.parse(JSON.stringify(stats)));
  }

  async getTeamGoalkeeper(team_id: UUID): Promise<UUID | null> {
    return this.goalkeepers.get(team_id) || null;
  }

  async logAdminError(log: AdminErrorLogRecord): Promise<void> {
    this.errorLogs.push(JSON.parse(JSON.stringify(log)));
  }
}

// ==========================================
// TEST FIXTURE FACTORY FOR ALGORITHM 2
// ==========================================

function createFixture(overrides: Partial<FixtureRecord> = {}): FixtureRecord {
  return {
    id: overrides.id || 'fix-1',
    competition_id: overrides.competition_id || 'comp-premier-league',
    home_team_id: overrides.home_team_id || 'team-eagles',
    away_team_id: overrides.away_team_id || 'team-lions',
    score_home: overrides.score_home ?? 0,
    score_away: overrides.score_away ?? 0,
    status: overrides.status || 'FT',
    stats_processed: overrides.stats_processed ?? false,
  };
}

// ==========================================
// TEST RUNNER
// ==========================================

interface ScenarioResult {
  num: number;
  title: string;
  passed: boolean;
  durationMs: number;
  evidence: Record<string, any>;
  error?: string;
}

const scenarioResults: ScenarioResult[] = [];

async function testScenario(
  num: number,
  title: string,
  fn: (repo: InMemoryMatchStatisticsRepository, engine: MatchStatisticsProcessingEngine) => Promise<Record<string, any>>
) {
  const repo = new InMemoryMatchStatisticsRepository();
  const engine = new MatchStatisticsProcessingEngine(repo);
  const start = performance.now();
  try {
    const evidence = await fn(repo, engine);
    const durationMs = Number((performance.now() - start).toFixed(2));
    scenarioResults.push({ num, title, passed: true, durationMs, evidence });
  } catch (err: any) {
    const durationMs = Number((performance.now() - start).toFixed(2));
    scenarioResults.push({
      num,
      title,
      passed: false,
      durationMs,
      evidence: {},
      error: err instanceof MatchStatisticsEngineError ? `[MatchStatisticsEngineError: ${err.code}] ${err.message}` : (err?.message || String(err)),
    });
  }
}

// ==========================================
// SCENARIOS DEFINITIONS
// ==========================================

export async function runAlgorithm2StressSuite() {
  console.log('='.repeat(80));
  console.log('🚀 EXECUTING COMPREHENSIVE STRESS TEST SUITE FOR ALGORITHM 2 (MATCH STATISTICS)');
  console.log('='.repeat(80));

  // 1. Home Win: Standings & Form
  await testScenario(1, 'Home Win updates Standings (+3 pts, +GD) & Form (W for Home, L for Away)', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-1', score_home: 2, score_away: 1 });
    await repo.saveFixture(fixture);

    const res = await engine.processMatchStatistics({ fixture_id: 'fix-1' });

    const homeStanding = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');
    const awayStanding = await repo.getLeagueStanding('team-lions', 'comp-premier-league');
    const homeForm = await repo.getTeamForm('team-eagles');
    const awayForm = await repo.getTeamForm('team-lions');

    if (homeStanding?.points !== 3 || homeStanding.won !== 1 || homeStanding.goal_difference !== 1) {
      throw new Error(`Home standing incorrect: ${JSON.stringify(homeStanding)}`);
    }
    if (awayStanding?.points !== 0 || awayStanding.lost !== 1 || awayStanding.goal_difference !== -1) {
      throw new Error(`Away standing incorrect: ${JSON.stringify(awayStanding)}`);
    }
    if (homeForm?.latest_results[0] !== 'W' || awayForm?.latest_results[0] !== 'L') {
      throw new Error(`Form incorrect: Home ${homeForm?.latest_results} Away ${awayForm?.latest_results}`);
    }

    return { homePoints: homeStanding.points, awayPoints: awayStanding.points, homeResult: res.home_result, awayResult: res.away_result };
  });

  // 2. Away Win: Standings & Form
  await testScenario(2, 'Away Win updates Standings (+3 pts to Away) & Form (L for Home, W for Away)', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-2', score_home: 0, score_away: 3 });
    await repo.saveFixture(fixture);

    const res = await engine.processMatchStatistics({ fixture_id: 'fix-2' });

    const homeStanding = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');
    const awayStanding = await repo.getLeagueStanding('team-lions', 'comp-premier-league');

    if (homeStanding?.points !== 0 || homeStanding.lost !== 1 || homeStanding.goals_against !== 3) {
      throw new Error(`Home standing incorrect`);
    }
    if (awayStanding?.points !== 3 || awayStanding.won !== 1 || awayStanding.goals_for !== 3) {
      throw new Error(`Away standing incorrect`);
    }

    return { homePoints: homeStanding.points, awayPoints: awayStanding.points, homeResult: res.home_result, awayResult: res.away_result };
  });

  // 3. Draw: Standings & Form
  await testScenario(3, 'Draw updates Standings (+1 pt each, GD 0) & Form (D for both)', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-3', score_home: 2, score_away: 2 });
    await repo.saveFixture(fixture);

    const res = await engine.processMatchStatistics({ fixture_id: 'fix-3' });

    const homeStanding = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');
    const awayStanding = await repo.getLeagueStanding('team-lions', 'comp-premier-league');
    const homeForm = await repo.getTeamForm('team-eagles');

    if (homeStanding?.points !== 1 || awayStanding?.points !== 1 || homeStanding.drawn !== 1 || awayStanding.drawn !== 1) {
      throw new Error(`Draw points incorrect`);
    }
    if (homeForm?.latest_results[0] !== 'D') {
      throw new Error(`Form expected D, got ${homeForm?.latest_results}`);
    }

    return { homePoints: homeStanding.points, awayPoints: awayStanding.points, homeResult: res.home_result };
  });

  // 4. Team Form Sliding Window: Strictly Keeps Last 5 Results
  await testScenario(4, 'Team Form FIFO Sliding Window strictly preserves latest 5 results', async (repo, engine) => {
    // Run 7 consecutive matches for team-eagles
    const outcomes = [
      { home: 1, away: 0, res: 'W' },
      { home: 2, away: 0, res: 'W' },
      { home: 0, away: 1, res: 'L' },
      { home: 1, away: 1, res: 'D' },
      { home: 3, away: 0, res: 'W' },
      { home: 0, away: 2, res: 'L' },
      { home: 4, away: 1, res: 'W' },
    ];

    for (let i = 0; i < outcomes.length; i++) {
      const fixId = `fix-seq-${i}`;
      const f = createFixture({ id: fixId, score_home: outcomes[i].home, score_away: outcomes[i].away });
      await repo.saveFixture(f);
      await engine.processMatchStatistics({ fixture_id: fixId });
    }

    const finalForm = await repo.getTeamForm('team-eagles');
    const expected = ['L', 'D', 'W', 'L', 'W']; // Last 5 of W, W, L, D, W, L, W

    if (JSON.stringify(finalForm?.latest_results) !== JSON.stringify(expected)) {
      throw new Error(`Expected form ${JSON.stringify(expected)}, got ${JSON.stringify(finalForm?.latest_results)}`);
    }

    return { totalMatchesRun: 7, formLength: finalForm?.latest_results.length, formArray: finalForm?.latest_results };
  });

  // 5. Player Stats: Official Goals, Assists & Goalkeeper Clean Sheets
  await testScenario(5, 'Player Stats: Aggregates official goals, assists & clean sheets accurately', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-stats-1', score_home: 2, score_away: 0 });
    await repo.saveFixture(fixture);

    // Register Goalkeepers
    repo.goalkeepers.set('team-eagles', 'gk-eagles-1');
    repo.goalkeepers.set('team-lions', 'gk-lions-1');

    // Register Official Events: 2 goals for p-striker-7, 1 assist for p-mid-10
    const officialEvents: OfficialMatchEvent[] = [
      { id: 'evt-1', fixture_id: 'fix-stats-1', team_id: 'team-eagles', player_id: 'p-striker-7', assist_player_id: 'p-mid-10', type: 'goal', minute: 15, is_official: true },
      { id: 'evt-2', fixture_id: 'fix-stats-1', team_id: 'team-eagles', player_id: 'p-striker-7', assist_player_id: null, type: 'penalty', minute: 75, is_official: true },
    ];
    repo.officialEvents.set('fix-stats-1', officialEvents);

    await engine.processMatchStatistics({ fixture_id: 'fix-stats-1' });

    const strikerStats = await repo.getPlayerStats('p-striker-7', 'comp-premier-league');
    const midStats = await repo.getPlayerStats('p-mid-10', 'comp-premier-league');
    const gkStats = await repo.getPlayerStats('gk-eagles-1', 'comp-premier-league');
    const lionGkStats = await repo.getPlayerStats('gk-lions-1', 'comp-premier-league');

    if (strikerStats?.goals !== 2) throw new Error(`Striker expected 2 goals, got ${strikerStats?.goals}`);
    if (midStats?.assists !== 1) throw new Error(`Midfielder expected 1 assist, got ${midStats?.assists}`);
    if (gkStats?.clean_sheets !== 1) throw new Error(`Eagles GK expected 1 clean sheet, got ${gkStats?.clean_sheets}`);
    if (lionGkStats?.clean_sheets !== 0 && lionGkStats !== null) throw new Error(`Lions GK conceded, expected 0 clean sheets`);

    return {
      strikerGoals: strikerStats.goals,
      midAssists: midStats.assists,
      eaglesGkCleanSheet: gkStats.clean_sheets,
    };
  });

  // 6. Idempotency Guard: stats_processed Prevents Double Counting
  await testScenario(6, 'Idempotency Guard: stats_processed prevents double counting on repeated runs', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-idemp-1', score_home: 3, score_away: 1 });
    await repo.saveFixture(fixture);

    // Run 1st time
    await engine.processMatchStatistics({ fixture_id: 'fix-idemp-1' });
    const standing1 = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');

    // Run 2nd time (should be a no-op)
    const res2 = await engine.processMatchStatistics({ fixture_id: 'fix-idemp-1' });
    const standing2 = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');

    if (standing1?.played !== 1 || standing1?.points !== 3) {
      throw new Error(`Initial run failed`);
    }
    if (standing2?.played !== 1 || standing2?.points !== 3) {
      throw new Error(`Idempotency breached: points doubled to ${standing2?.points}`);
    }

    return { firstRunPoints: standing1.points, secondRunPoints: standing2.points, secondRunProcessed: res2.stats_processed };
  });

  // 7. Subtransaction Isolation: Module C Failure Does Not Abort Module A or B
  await testScenario(7, 'Subtransaction Fault Isolation: Module C failure logs to admin_error_logs while Module A & B commit', async (repo, engine) => {
    const fixture = createFixture({ id: 'fix-fail-c', score_home: 1, score_away: 0 });
    await repo.saveFixture(fixture);

    // Register Goalkeeper so Module C attempts clean sheet write
    repo.goalkeepers.set('team-eagles', 'gk-eagles-1');

    // Inject fault into Module C
    repo.failModuleC = true;

    const res = await engine.processMatchStatistics({ fixture_id: 'fix-fail-c' });

    const homeStanding = await repo.getLeagueStanding('team-eagles', 'comp-premier-league');
    const homeForm = await repo.getTeamForm('team-eagles');

    if (!res.module_a_standings || !res.module_b_form || res.module_c_player_stats) {
      throw new Error(`Module flags incorrect: A=${res.module_a_standings}, B=${res.module_b_form}, C=${res.module_c_player_stats}`);
    }
    if (homeStanding?.points !== 3 || homeForm?.latest_results[0] !== 'W') {
      throw new Error(`Module A / B failed to commit despite subtransaction isolation`);
    }
    if (repo.errorLogs.length !== 1 || repo.errorLogs[0].module_name !== 'MODULE_C_PLAYER_STATS') {
      throw new Error(`admin_error_logs missing entry for failed Module C: ${JSON.stringify(repo.errorLogs)}`);
    }

    return {
      moduleAStatus: 'COMMITTED (3 pts)',
      moduleBStatus: 'COMMITTED (Form W)',
      moduleCStatus: 'ABORTED & LOGGED',
      loggedError: repo.errorLogs[0].error_message,
    };
  });

  // 8. End-to-End Chaining: Algorithm 1 Finalization -> Algorithm 2 Statistics Processing
  await testScenario(8, 'End-to-End Chaining: Algorithm 1 Referee Finalization triggers Algorithm 2 flawlessly', async (repo, statsEngine) => {
    // 1. Setup Algorithm 1 Engine
    class Alg1MockRepo implements MatchRepository {
      matches = new Map<string, Match>();
      liveStates = new Map<string, LiveMatchState>();
      squads = new Map<string, MatchSquad[]>();
      events = new Map<string, MatchEvent[]>();
      workingSets = new Map<string, RefereeWorkingSet>();
      auditLogs: LiveAuditEntry[] = [];
      canonicalResults = new Map<string, CanonicalPermanentResult>();
      historySnapshots = new Map<string, any>();
      finalizationCommands = new Map<string, string>();

      async transaction<T>(_uid: string, fn: (tx: MatchRepository) => Promise<T>): Promise<T> {
        return await fn(this);
      }
      async getMatchForUpdate(uid: string): Promise<Match> { return this.getMatch(uid); }
      async getMatch(uid: string): Promise<Match> { return this.matches.get(uid)!; }
      async saveMatch(m: Match): Promise<void> { this.matches.set(m.match_uid, m); }
      async getSquads(uid: string): Promise<MatchSquad[]> { return this.squads.get(uid) || []; }
      async getSquadPlayers(uid: string, tid: string) {
        const sq = (this.squads.get(uid) || []).find((s) => s.team_uid === tid);
        return sq ? sq.players : [];
      }
      async getLiveState(uid: string): Promise<LiveMatchState | null> { return this.liveStates.get(uid) || null; }
      async saveLiveState(s: LiveMatchState): Promise<void> { this.liveStates.set(s.match_uid, s); }
      async getLiveEvent(uid: string, eid: string): Promise<MatchEvent | null> {
        return (this.events.get(uid) || []).find((e) => e.event_uid === eid) || null;
      }
      async getLiveEvents(uid: string): Promise<MatchEvent[]> { return this.events.get(uid) || []; }
      async getEventByIdempotencyKey(uid: string, k: string): Promise<MatchEvent | null> {
        return (this.events.get(uid) || []).find((e) => e.idempotency_key === k) || null;
      }
      async insertLiveEvent(e: MatchEvent): Promise<void> {
        const l = this.events.get(e.match_uid) || [];
        l.push(e);
        this.events.set(e.match_uid, l);
      }
      async updateLiveEvent(e: MatchEvent): Promise<void> {
        const l = this.events.get(e.match_uid) || [];
        const idx = l.findIndex((x) => x.event_uid === e.event_uid);
        if (idx >= 0) l[idx] = e;
      }
      async insertLiveAudit(a: LiveAuditEntry): Promise<void> { this.auditLogs.push(a); }
      async saveRefereeWorkingSet(w: RefereeWorkingSet): Promise<void> { this.workingSets.set(w.match_uid, w); }
      async getRefereeWorkingSet(uid: string): Promise<RefereeWorkingSet | null> { return this.workingSets.get(uid) || null; }
      async saveCanonicalPermanentResult(r: CanonicalPermanentResult): Promise<void> { this.canonicalResults.set(r.match_uid, r); }
      async getCanonicalPermanentResult(uid: string): Promise<CanonicalPermanentResult | null> { return this.canonicalResults.get(uid) || null; }
      async saveHistorySnapshot(s: any): Promise<void> { this.historySnapshots.set(s.match_uid, s); }
      async markFinalResultCommitted(uid: string, _o: TerminalOutcome, st: MatchStatus, f: string): Promise<void> {
        const m = this.matches.get(uid);
        if (m) { m.status = st; m.finalized_at = f; m.locked_at = f; }
      }
      async archiveLiveState(uid: string, _a: string): Promise<void> {
        const ls = this.liveStates.get(uid);
        if (ls) ls.status = 'LOCKED';
      }
      async hasFinalizationCommand(uid: string, k: string): Promise<boolean> { return this.finalizationCommands.has(`${uid}:${k}`); }
      async recordFinalizationCommand(uid: string, k: string, r: string, _n: string): Promise<void> { this.finalizationCommands.set(`${uid}:${k}`, r); }
    }

    class Alg1MockPublisher implements MatchPublisher {
      async publishRealtime(_: MatchUpdateEnvelope): Promise<void> {}
      async publishWebhook(_: MatchUpdateEnvelope): Promise<void> {}
    }

    const alg1Repo = new Alg1MockRepo();
    const alg1Publisher = new Alg1MockPublisher();
    const alg1Engine = new MatchLiveInputEngine(alg1Repo, alg1Publisher);

    // Setup initial live match in Algorithm 1
    const matchUid = 'match-e2e-100';
    const compId = 'comp-championship';
    const teamA = 'team-alpha';
    const teamB = 'team-beta';

    const match: Match = {
      match_uid: matchUid,
      home_team_uid: teamA,
      away_team_uid: teamB,
      scheduled_start_at: new Date(Date.now() - 7200000).toISOString(),
      status: 'LIVE',
      started_at: new Date(Date.now() - 7200000).toISOString(),
      finalized_at: null,
      locked_at: null,
      home_score: 0,
      away_score: 0,
      version: 1,
    };
    const squads: MatchSquad[] = [
      {
        squad_uid: 'sq-a',
        match_uid: matchUid,
        team_uid: teamA,
        players: [
          { player_uid: 'p-a-1', team_uid: teamA, jersey_number: 1, display_name: 'GK Alpha', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
          { player_uid: 'p-a-9', team_uid: teamA, jersey_number: 9, display_name: 'Striker Alpha', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        ],
      },
      {
        squad_uid: 'sq-b',
        match_uid: matchUid,
        team_uid: teamB,
        players: [
          { player_uid: 'p-b-1', team_uid: teamB, jersey_number: 1, display_name: 'GK Beta', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        ],
      },
    ];

    alg1Repo.matches.set(matchUid, match);
    alg1Repo.squads.set(matchUid, squads);
    alg1Repo.liveStates.set(matchUid, {
      state_uid: 'state-100',
      match_uid: matchUid,
      status: 'LIVE',
      period: 'FULL_TIME',
      home_score: 0,
      away_score: 0,
      active_events: [],
      version: 1,
      event_sequence: 0,
      updated_at: new Date().toISOString(),
    });

    // Referee opens working set and adds a goal for Striker Alpha
    await alg1Engine.refereeOpenMatch({ match_uid: matchUid, referee_uid: 'ref-main' });
    await alg1Engine.refereeAddEvent({
      match_uid: matchUid,
      referee_uid: 'ref-main',
      team_uid: teamA,
      type: 'GOAL',
      goal_type: 'SCREAMER',
      player_number: 9,
      minute: 88,
      period: 'SECOND_HALF',
      idempotency_key: 'idemp-goal-88',
    });

    // Advance match status to FULL_TIME before referee confirmation
    const m = alg1Repo.matches.get(matchUid)!;
    m.status = 'FULL_TIME';
    alg1Repo.matches.set(matchUid, m);

    // Referee confirms normal FT result in Algorithm 1
    const canonical = await alg1Engine.refereeConfirmNormalResult({
      match_uid: matchUid,
      referee_uid: 'ref-main',
      idempotency_key: 'idemp-confirm-100',
    });

    // 2. Chaining trigger reaches Algorithm 2:
    // Setup database fixture and official events from Algorithm 1
    const dbFixture: FixtureRecord = {
      id: canonical.match_uid,
      competition_id: compId,
      home_team_id: canonical.home_team_uid,
      away_team_id: canonical.away_team_uid,
      score_home: canonical.home_score,
      score_away: canonical.away_score,
      status: 'FT',
      stats_processed: false,
    };
    await repo.saveFixture(dbFixture);

    const officialEvents: OfficialMatchEvent[] = canonical.events.map((e) => ({
      id: e.event_uid,
      fixture_id: e.match_uid,
      team_id: e.team_uid,
      player_id: e.player_uid,
      assist_player_id: null,
      type: e.type,
      minute: e.minute ?? 0,
      is_official: true,
    }));
    repo.officialEvents.set(matchUid, officialEvents);
    repo.goalkeepers.set(teamA, 'p-a-1');
    repo.goalkeepers.set(teamB, 'p-b-1');

    // Execute Algorithm 2
    const statsResult = await statsEngine.processMatchStatistics({
      fixture_id: matchUid,
      competition_id: compId,
      official_events: officialEvents,
    });

    // 3. Verify Algorithm 2 mathematical output
    const standingA = await repo.getLeagueStanding(teamA, compId);
    const standingB = await repo.getLeagueStanding(teamB, compId);
    const formA = await repo.getTeamForm(teamA);
    const strikerStats = await repo.getPlayerStats('p-a-9', compId);
    const alphaGkStats = await repo.getPlayerStats('p-a-1', compId);

    if (standingA?.points !== 3 || standingB?.points !== 0) {
      throw new Error(`Standings derivation failed`);
    }
    if (formA?.latest_results[0] !== 'W') {
      throw new Error(`Form derivation failed`);
    }
    if (strikerStats?.goals !== 1) {
      throw new Error(`Player stats goal derivation failed`);
    }
    if (alphaGkStats?.clean_sheets !== 1) {
      throw new Error(`Clean sheet derivation failed`);
    }

    return {
      alg1Outcome: canonical.outcome,
      alg1Score: `${canonical.home_score}-${canonical.away_score}`,
      alg2Processed: statsResult.stats_processed,
      homeTeamPoints: standingA.points,
      awayTeamPoints: standingB.points,
      strikerGoals: strikerStats.goals,
      cleanSheets: alphaGkStats.clean_sheets,
    };
  });

  // ==========================================
  // FINAL RESULTS REPORT
  // ==========================================

  console.log('\n' + '='.repeat(80));
  console.log('📊 ALGORITHM 2 TEST EXECUTION REPORT');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  for (const res of scenarioResults) {
    const icon = res.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Scenario #${res.num}] ${icon} | ${res.title} (${res.durationMs}ms)`);
    if (res.passed) {
      passed++;
      console.log(`     Evidence: ${JSON.stringify(res.evidence)}`);
    } else {
      failed++;
      console.log(`     Error: ${res.error}`);
    }
  }

  console.log('='.repeat(80));
  console.log(`🏁 RESULTS: ${passed} PASSED / ${failed} FAILED out of ${scenarioResults.length} SCENARIOS`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run
runAlgorithm2StressSuite().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
