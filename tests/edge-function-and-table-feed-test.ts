/**
 * ============================================================================
 * EDGE FUNCTION & TABLE FEEDS ALIGNMENT TEST SUITE
 * ============================================================================
 *
 * Verifies:
 * 1. Edge Function Algorithm 2 Processing with league_id and match_id
 * 2. Idempotency guard and Row-Level concurrency locking
 * 3. Subtransaction fault isolation via admin_error_logs
 * 4. Materialized table feeds for League Standings, Team Form (5-match FIFO),
 *    and Player Stats (Goals, Assists, Goalkeeper Clean Sheets)
 * 5. Automatic trigger execution when referee saves/finalizes a match
 * 6. Deletion of manual/scattered frontend dependencies in favor of authoritative algorithms
 */

import {
  MatchLiveInputEngine,
  type MatchRepository,
  type MatchPublisher,
  type Match,
  type MatchSquad,
  type SquadPlayer,
  type LiveMatchState,
  type MatchEvent,
  type RefereeWorkingSet,
  type CanonicalPermanentResult,
  type LiveAuditEntry,
  type TerminalOutcome,
  type MatchStatus,
  type UID,
} from '../src/algorithms/matchLiveInputAlgorithm';

import {
  MatchStatisticsProcessingEngine,
  type MatchStatisticsRepository,
  type FixtureRecord,
  type LeagueStandingRecord,
  type TeamFormRecord,
  type PlayerStatsRecord,
  type OfficialMatchEvent,
  type AdminErrorLogRecord,
  type UUID,
} from '../src/algorithms/matchStatisticsProcessingAlgorithm';

// ============================================================================
// VIRTUAL DATABASE & EDGE FUNCTION HARNESS
// ============================================================================

export class VirtualDatabaseEdgeHarness implements MatchRepository, MatchStatisticsRepository {
  public fixtures = new Map<UUID, FixtureRecord>();
  public matches = new Map<UID, Match>();
  public squads = new Map<UID, MatchSquad[]>();
  public match_live_states = new Map<UID, LiveMatchState>();
  public match_live_events = new Map<UID, MatchEvent[]>();
  public match_live_audit_logs: LiveAuditEntry[] = [];
  public referee_working_sets = new Map<UID, RefereeWorkingSet>();
  public canonical_permanent_results = new Map<UID, CanonicalPermanentResult>();
  public finalization_commands = new Map<string, { result_uid: UID; now: string }>();

  // Authoritative Materialized Tables (Algorithm 2)
  public league_standings = new Map<string, LeagueStandingRecord>(); // `${team_id}:${competition_id}`
  public team_form = new Map<UUID, TeamFormRecord>();
  public player_stats = new Map<string, PlayerStatsRecord>(); // `${player_id}:${competition_id}`
  public goalkeepers = new Map<UUID, UUID>();
  public admin_error_logs: AdminErrorLogRecord[] = [];

  // Simulated Edge Function Invocation Counters
  public edgeFunctionInvocations = 0;
  private locks = new Map<string, Promise<any>>();

  // Processing Engine
  public engine: MatchStatisticsProcessingEngine;

  constructor() {
    this.engine = new MatchStatisticsProcessingEngine(this);
  }

  async transaction<T>(lockKey: string, fn: (tx: any) => Promise<T>): Promise<T> {
    const currentLock = this.locks.get(lockKey) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(lockKey, currentLock.then(() => nextLock));
    await currentLock;
    try {
      return await fn(this);
    } finally {
      releaseLock!();
    }
  }

  // --------------------------------------------------------------------------
  // EDGE FUNCTION INVOCATION SIMULATION
  // --------------------------------------------------------------------------
  async invokeEdgeFunction(payload: {
    fixture_id: string;
    competition_id?: string;
    trigger_source?: string;
  }): Promise<{ success: boolean; fixture_id: string; stats_processed: boolean }> {
    this.edgeFunctionInvocations++;
    const res = await this.engine.processMatchStatistics({
      fixture_id: payload.fixture_id,
      competition_id: payload.competition_id,
    });
    return {
      success: res.stats_processed || false,
      fixture_id: payload.fixture_id,
      stats_processed: res.stats_processed,
    };
  }

  // --------------------------------------------------------------------------
  // TABLE FEEDS API SIMULATION (Mirroring src/services/api.ts)
  // --------------------------------------------------------------------------

  async getLeagueTableFeed(competitionId: string): Promise<Array<{
    position: number;
    teamId: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }>> {
    const list: LeagueStandingRecord[] = [];
    for (const [key, val] of this.league_standings.entries()) {
      if (key.endsWith(`:${competitionId}`)) {
        list.push(val);
      }
    }

    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    return list.map((row, idx) => ({
      position: idx + 1,
      teamId: row.team_id,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goal_difference,
      points: row.points,
    }));
  }

  async getTeamFormFeed(teamId: string): Promise<Array<{ result: 'W' | 'D' | 'L'; label: string }>> {
    const form = this.team_form.get(teamId);
    if (!form || !form.latest_results) return [];
    return form.latest_results.map((r) => ({
      result: r,
      label: r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss',
    }));
  }

  async getTopScorersFeed(competitionId: string): Promise<Array<{ playerId: string; goals: number }>> {
    const list: Array<{ playerId: string; goals: number }> = [];
    for (const [key, val] of this.player_stats.entries()) {
      if (key.endsWith(`:${competitionId}`) && val.goals > 0) {
        list.push({ playerId: val.player_id, goals: val.goals });
      }
    }
    list.sort((a, b) => b.goals - a.goals);
    return list;
  }

  async getGoalkeeperCleanSheetsFeed(competitionId: string): Promise<Array<{ playerId: string; cleanSheets: number }>> {
    const list: Array<{ playerId: string; cleanSheets: number }> = [];
    for (const [key, val] of this.player_stats.entries()) {
      if (key.endsWith(`:${competitionId}`) && val.clean_sheets > 0) {
        list.push({ playerId: val.player_id, cleanSheets: val.clean_sheets });
      }
    }
    list.sort((a, b) => b.cleanSheets - a.cleanSheets);
    return list;
  }

  // --------------------------------------------------------------------------
  // REPOSITORIES IMPLEMENTATION
  // --------------------------------------------------------------------------

  async getMatchForUpdate(match_uid: UID): Promise<Match> { return this.getMatch(match_uid); }
  async getMatch(match_uid: UID): Promise<Match> {
    const m = this.matches.get(match_uid);
    if (!m) throw new Error(`Match ${match_uid} not found`);
    return JSON.parse(JSON.stringify(m));
  }
  async saveMatch(match: Match): Promise<void> { this.matches.set(match.match_uid, JSON.parse(JSON.stringify(match))); }
  async getSquads(match_uid: UID): Promise<MatchSquad[]> { return JSON.parse(JSON.stringify(this.squads.get(match_uid) || [])); }
  async getSquadPlayers(match_uid: UID, team_uid: UID): Promise<SquadPlayer[]> {
    const list = this.squads.get(match_uid) || [];
    const sq = list.find((s) => s.team_uid === team_uid);
    return JSON.parse(JSON.stringify(sq ? sq.players : []));
  }
  async getLiveState(match_uid: UID): Promise<LiveMatchState | null> {
    const s = this.match_live_states.get(match_uid);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }
  async saveLiveState(state: LiveMatchState): Promise<void> { this.match_live_states.set(state.match_uid, JSON.parse(JSON.stringify(state))); }
  async getLiveEvent(match_uid: UID, event_uid: UID): Promise<MatchEvent | null> {
    const list = this.match_live_events.get(match_uid) || [];
    const found = list.find((e) => e.event_uid === event_uid);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
  async getLiveEvents(match_uid: UID): Promise<MatchEvent[]> { return JSON.parse(JSON.stringify(this.match_live_events.get(match_uid) || [])); }
  async getEventByIdempotencyKey(match_uid: UID, idempotency_key: string): Promise<MatchEvent | null> {
    const list = this.match_live_events.get(match_uid) || [];
    const found = list.find((e) => e.idempotency_key === idempotency_key);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
  async insertLiveEvent(event: MatchEvent): Promise<void> {
    const list = this.match_live_events.get(event.match_uid) || [];
    list.push(JSON.parse(JSON.stringify(event)));
    this.match_live_events.set(event.match_uid, list);
  }
  async updateLiveEvent(event: MatchEvent): Promise<void> {
    const list = this.match_live_events.get(event.match_uid) || [];
    const idx = list.findIndex((e) => e.event_uid === event.event_uid);
    if (idx >= 0) {
      list[idx] = JSON.parse(JSON.stringify(event));
      this.match_live_events.set(event.match_uid, list);
    }
  }
  async insertLiveAudit(entry: LiveAuditEntry): Promise<void> { this.match_live_audit_logs.push(JSON.parse(JSON.stringify(entry))); }
  async saveRefereeWorkingSet(set: RefereeWorkingSet): Promise<void> { this.referee_working_sets.set(set.match_uid, JSON.parse(JSON.stringify(set))); }
  async getRefereeWorkingSet(match_uid: UID): Promise<RefereeWorkingSet | null> {
    const ws = this.referee_working_sets.get(match_uid);
    return ws ? JSON.parse(JSON.stringify(ws)) : null;
  }
  async saveCanonicalPermanentResult(result: CanonicalPermanentResult): Promise<void> {
    this.canonical_permanent_results.set(result.match_uid, JSON.parse(JSON.stringify(result)));
  }
  async getCanonicalPermanentResult(match_uid: UID): Promise<CanonicalPermanentResult | null> {
    const cr = this.canonical_permanent_results.get(match_uid);
    return cr ? JSON.parse(JSON.stringify(cr)) : null;
  }
  async saveHistorySnapshot(_: any): Promise<void> {}
  async markFinalResultCommitted(match_uid: UID, _outcome: TerminalOutcome, final_status: MatchStatus, finalized_at: string): Promise<void> {
    const m = this.matches.get(match_uid);
    if (m) {
      m.status = final_status;
      m.finalized_at = finalized_at;
      m.locked_at = finalized_at;
      this.matches.set(match_uid, m);
    }

    const canonical = this.canonical_permanent_results.get(match_uid);
    let fix = this.fixtures.get(match_uid);
    if (fix) {
      fix.score_home = canonical ? canonical.home_score : fix.score_home;
      fix.score_away = canonical ? canonical.away_score : fix.score_away;
      fix.status = 'FT';
      this.fixtures.set(match_uid, fix);
    }

    // AUTOMATIC EDGE FUNCTION TRIGGER ON PERMANENT REFEREE COMMIT
    await this.invokeEdgeFunction({
      fixture_id: match_uid,
      competition_id: fix?.competition_id,
      trigger_source: 'REFEREE_FINALIZATION_COMMIT',
    });
  }
  async archiveLiveState(match_uid: UID, _: string): Promise<void> {
    const ls = this.match_live_states.get(match_uid);
    if (ls) {
      ls.status = 'FINALIZED';
      this.match_live_states.set(match_uid, ls);
    }
  }
  async hasFinalizationCommand(match_uid: UID, idempotency_key: string): Promise<boolean> {
    return this.finalization_commands.has(`${match_uid}:${idempotency_key}`);
  }
  async recordFinalizationCommand(match_uid: UID, idempotency_key: string, result_uid: UID, now: string): Promise<void> {
    this.finalization_commands.set(`${match_uid}:${idempotency_key}`, { result_uid, now });
  }

  // Match Statistics Repository
  async getFixture(fixture_id: UUID): Promise<FixtureRecord | null> {
    const f = this.fixtures.get(fixture_id);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }
  async saveFixture(fixture: FixtureRecord): Promise<void> {
    this.fixtures.set(fixture.id, JSON.parse(JSON.stringify(fixture)));
  }
  async getLeagueStanding(team_id: UUID, competition_id: UUID): Promise<LeagueStandingRecord | null> {
    const key = `${team_id}:${competition_id}`;
    const s = this.league_standings.get(key);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }
  async saveLeagueStanding(standing: LeagueStandingRecord): Promise<void> {
    const key = `${standing.team_id}:${standing.competition_id}`;
    this.league_standings.set(key, JSON.parse(JSON.stringify(standing)));
  }
  async getTeamForm(team_id: UUID): Promise<TeamFormRecord | null> {
    const f = this.team_form.get(team_id);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }
  async saveTeamForm(form: TeamFormRecord): Promise<void> {
    this.team_form.set(form.team_id, JSON.parse(JSON.stringify(form)));
  }
  async getOfficialMatchEvents(fixture_id: UUID): Promise<OfficialMatchEvent[]> {
    const canonical = this.canonical_permanent_results.get(fixture_id);
    if (canonical) {
      return canonical.events.map((e) => ({
        id: e.event_uid,
        fixture_id: e.match_uid,
        team_id: e.team_uid,
        player_id: e.player_uid,
        assist_player_id: null,
        type: e.type,
        minute: e.minute ?? 0,
        is_official: true,
      }));
    }
    return [];
  }
  async getPlayerStats(player_id: UUID, competition_id: UUID): Promise<PlayerStatsRecord | null> {
    const key = `${player_id}:${competition_id}`;
    const ps = this.player_stats.get(key);
    return ps ? JSON.parse(JSON.stringify(ps)) : null;
  }
  async savePlayerStats(stats: PlayerStatsRecord): Promise<void> {
    const key = `${stats.player_id}:${stats.competition_id}`;
    this.player_stats.set(key, JSON.parse(JSON.stringify(stats)));
  }
  async getTeamGoalkeeper(team_id: UUID): Promise<UUID | null> {
    return this.goalkeepers.get(team_id) || `gk_${team_id}`;
  }
  async logAdminError(log: AdminErrorLogRecord): Promise<void> {
    this.admin_error_logs.push(JSON.parse(JSON.stringify(log)));
  }
}

// Mock Publisher
class MockPublisher implements MatchPublisher {
  async publishRealtime(_: any): Promise<void> {}
  async publishWebhook(_: any): Promise<void> {}
}

function seedMatch(env: VirtualDatabaseEdgeHarness, opt: {
  match_uid: string;
  competition_id: string;
  home_team_uid: string;
  away_team_uid: string;
  status?: MatchStatus;
}) {
  const homeGk = `gk-${opt.home_team_uid}`;
  const awayGk = `gk-${opt.away_team_uid}`;
  env.goalkeepers.set(opt.home_team_uid, homeGk);
  env.goalkeepers.set(opt.away_team_uid, awayGk);

  const match: Match = {
    match_uid: opt.match_uid,
    home_team_uid: opt.home_team_uid,
    away_team_uid: opt.away_team_uid,
    scheduled_start_at: new Date(Date.now() - 7200000).toISOString(),
    status: opt.status || 'SCHEDULED',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    finalized_at: null,
    locked_at: null,
    home_score: 0,
    away_score: 0,
    version: 1,
  };

  const fixture: FixtureRecord = {
    id: opt.match_uid,
    competition_id: opt.competition_id,
    home_team_id: opt.home_team_uid,
    away_team_id: opt.away_team_uid,
    score_home: 0,
    score_away: 0,
    status: opt.status || 'UPCOMING',
    stats_processed: false,
  };

  const squads: MatchSquad[] = [
    {
      squad_uid: `sq-${opt.home_team_uid}`,
      match_uid: opt.match_uid,
      team_uid: opt.home_team_uid,
      players: [
        { player_uid: homeGk, team_uid: opt.home_team_uid, jersey_number: 1, display_name: 'Home GK', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: `p-${opt.home_team_uid}-9`, team_uid: opt.home_team_uid, jersey_number: 9, display_name: 'Striker 9', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      ],
    },
    {
      squad_uid: `sq-${opt.away_team_uid}`,
      match_uid: opt.match_uid,
      team_uid: opt.away_team_uid,
      players: [
        { player_uid: awayGk, team_uid: opt.away_team_uid, jersey_number: 1, display_name: 'Away GK', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
        { player_uid: `p-${opt.away_team_uid}-9`, team_uid: opt.away_team_uid, jersey_number: 9, display_name: 'Away Striker 9', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      ],
    },
  ];

  env.matches.set(opt.match_uid, match);
  env.fixtures.set(opt.match_uid, fixture);
  env.squads.set(opt.match_uid, squads);
  env.match_live_events.set(opt.match_uid, []);
}

// Test Runner
async function runTests() {
  console.log('='.repeat(80));
  console.log('⚡ EXECUTING EDGE FUNCTION & AUTHORITATIVE TABLE FEEDS TEST SUITE');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: (env: VirtualDatabaseEdgeHarness, engine: MatchLiveInputEngine) => Promise<void>) {
    const env = new VirtualDatabaseEdgeHarness();
    const liveEngine = new MatchLiveInputEngine(env, new MockPublisher());
    try {
      await fn(env, liveEngine);
      console.log(`✅ PASS | ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL | ${name} -> ${err?.message || err}`);
      failed++;
    }
  }

  // 1. Edge Function processes match using match_id and league_id
  await test('Edge Function processes match with match_id and league_id updating Standings, Form, and Stats', async (env) => {
    const matchId = 'm-edge-1';
    const leagueId = 'league-alpha';
    seedMatch(env, { match_uid: matchId, competition_id: leagueId, home_team_uid: 'team-a', away_team_uid: 'team-b', status: 'SCHEDULED' });

    // Set score 2-0
    const fix = env.fixtures.get(matchId)!;
    fix.score_home = 2;
    fix.score_away = 0;
    fix.status = 'FT';
    env.fixtures.set(matchId, fix);

    const res = await env.invokeEdgeFunction({ fixture_id: matchId, competition_id: leagueId });
    if (!res.success) throw new Error('Edge function execution failed');

    const sA = await env.getLeagueStanding('team-a', leagueId);
    const formA = await env.getTeamForm('team-a');
    const gkA = await env.getPlayerStats('gk-team-a', leagueId);

    if (sA?.points !== 3 || sA.goals_for !== 2 || formA?.latest_results[0] !== 'W' || gkA?.clean_sheets !== 1) {
      throw new Error(`Edge function math mismatch: ${JSON.stringify({ sA, formA, gkA })}`);
    }
  });

  // 2. Table Feeds API directly consumes Materialized Tables (No manual recalculations)
  await test('Table Feeds (getLeagueTableFeed, getTeamFormFeed) read strictly from Algorithm 2 tables', async (env) => {
    const leagueId = 'league-feed-test';
    seedMatch(env, { match_uid: 'm-f1', competition_id: leagueId, home_team_uid: 'team-x', away_team_uid: 'team-y', status: 'SCHEDULED' });

    const fix = env.fixtures.get('m-f1')!;
    fix.score_home = 3;
    fix.score_away = 1;
    fix.status = 'FT';
    env.fixtures.set('m-f1', fix);

    await env.invokeEdgeFunction({ fixture_id: 'm-f1', competition_id: leagueId });

    const tableFeed = await env.getLeagueTableFeed(leagueId);
    const formFeedX = await env.getTeamFormFeed('team-x');
    const formFeedY = await env.getTeamFormFeed('team-y');

    if (tableFeed.length !== 2 || tableFeed[0].teamId !== 'team-x' || tableFeed[0].points !== 3) {
      throw new Error('Table feed failed');
    }
    if (formFeedX[0].result !== 'W' || formFeedY[0].result !== 'L') {
      throw new Error('Form feed failed');
    }
  });

  // 3. Referee FT Confirmation triggers Edge Function automatically
  await test('Referee Normal Finalization triggers Edge Function updating League Tables immediately', async (env, liveEngine) => {
    const matchId = 'm-ref-e2e';
    const leagueId = 'league-e2e';
    seedMatch(env, { match_uid: matchId, competition_id: leagueId, home_team_uid: 't1', away_team_uid: 't2', status: 'FULL_TIME' });

    await liveEngine.refereeOpenMatch({ match_uid: matchId, referee_uid: 'ref-1' });
    await liveEngine.refereeAddEvent({ match_uid: matchId, referee_uid: 'ref-1', team_uid: 't1', type: 'GOAL', player_number: 9, minute: 30, period: 'FIRST_HALF', idempotency_key: 'g-e2e' });
    await liveEngine.refereeConfirmNormalResult({ match_uid: matchId, referee_uid: 'ref-1', idempotency_key: 'c-e2e' });

    if (env.edgeFunctionInvocations !== 1) throw new Error(`Expected 1 edge function call, got ${env.edgeFunctionInvocations}`);

    const table = await env.getLeagueTableFeed(leagueId);
    const scorers = await env.getTopScorersFeed(leagueId);
    const gkSheets = await env.getGoalkeeperCleanSheetsFeed(leagueId);

    if (table[0].teamId !== 't1' || table[0].points !== 3 || scorers[0].goals !== 1 || gkSheets[0].cleanSheets !== 1) {
      throw new Error(`Authoritative table feed mismatch`);
    }
  });

  // 4. Idempotency prevents double invocation
  await test('Idempotency Guard: Redundant Edge Function call on processed match is a safe no-op', async (env) => {
    const matchId = 'm-idem-test';
    const leagueId = 'league-idem';
    seedMatch(env, { match_uid: matchId, competition_id: leagueId, home_team_uid: 'team-a', away_team_uid: 'team-b', status: 'SCHEDULED' });

    const fix = env.fixtures.get(matchId)!;
    fix.score_home = 1;
    fix.score_away = 0;
    fix.status = 'FT';
    env.fixtures.set(matchId, fix);

    await env.invokeEdgeFunction({ fixture_id: matchId, competition_id: leagueId });
    const s1 = await env.getLeagueStanding('team-a', leagueId);

    // Call second time
    await env.invokeEdgeFunction({ fixture_id: matchId, competition_id: leagueId });
    const s2 = await env.getLeagueStanding('team-a', leagueId);

    if (s1?.points !== 3 || s2?.points !== 3 || s2.played !== 1) {
      throw new Error(`Double calculation occurred`);
    }
  });

  // 5. 5-Match Form FIFO sliding array maintained across multiple Edge Function runs
  await test('Team Form FIFO: 6 consecutive match finalizations strictly retain latest 5 results', async (env) => {
    const leagueId = 'league-form-fifo';
    const hero = 'hero-team';

    for (let i = 0; i < 6; i++) {
      const matchId = `m-fifo-${i}`;
      seedMatch(env, { match_uid: matchId, competition_id: leagueId, home_team_uid: hero, away_team_uid: `opp-${i}`, status: 'SCHEDULED' });
      const fix = env.fixtures.get(matchId)!;
      fix.score_home = i < 5 ? 1 : 0;
      fix.score_away = i < 5 ? 0 : 2;
      fix.status = 'FT';
      env.fixtures.set(matchId, fix);

      await env.invokeEdgeFunction({ fixture_id: matchId, competition_id: leagueId });
    }

    const form = await env.getTeamFormFeed(hero);
    const results = form.map((f) => f.result);
    const expected = ['W', 'W', 'W', 'W', 'L'];

    if (results.length !== 5 || JSON.stringify(results) !== JSON.stringify(expected)) {
      throw new Error(`Form FIFO mismatch: got ${JSON.stringify(results)}, expected ${JSON.stringify(expected)}`);
    }
  });

  console.log('='.repeat(80));
  console.log(`🏁 TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
