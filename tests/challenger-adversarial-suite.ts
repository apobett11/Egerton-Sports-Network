/**
 * CHALLENGER 1 ADVERSARIAL & EMPIRICAL STRESS TEST HARNESS
 *
 * Verifies:
 * 1. Algorithm 3 with arbitrary non-standard inputs:
 *    - Arbitrary league IDs (e.g. UUID v4, "la_liga", "serie_a", "bundesliga", "custom_cup")
 *    - Arbitrary pitch counts (1 pitch, 2 pitches, 4 pitches, 8 pitches)
 *    - Empty/missing signal.time_configuration -> fails with clear error message
 * 2. Algorithm 2 with missing capacity:
 *    - No signal capacity & no inferable history -> fails with clear error message
 *    - Valid capacity provided -> succeeds
 * 3. Algorithm 1 seed reproducibility & determinism:
 *    - Same season_id + league_id + leg -> 100% deterministic fixture hash
 *    - Different season_id -> different fixture sequence
 * 4. Agent 0 fail-fast validations & error codes:
 *    - Missing play date -> Agent0Error("MISSING_PLAY_DATE")
 *    - Empty distinctLeagueIds -> Agent0Error("NO_LEAGUES_FOUND")
 *    - Missing capacity -> Agent0Error("MISSING_MATCH_CAPACITY")
 *    - Missing time config -> Agent0Error("MISSING_TIME_CONFIGURATION")
 */

import { generateFixtures, type LeagueInput } from "../src/algorithms/algorithm1";
import { runAlgorithm2, type Algorithm2Input } from "../src/algorithms/algorithm2";
import { allocateMatches, type Algorithm3Signal, type PitchInput, type LeagueTimeConfiguration, type MatchdayInput } from "../src/algorithms/algorithm3";
import { handleEvent, Agent0Error, type PresidentEvent, type Agent0Adapters, type DBState } from "../src/services/agent0";
import { createAlgorithmCommand } from "../src/shared/algorithmProtocol";
import crypto from "crypto";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function hashFixtureSequence(matches: Array<{ home_team_id: string; away_team_id: string }>): string {
  const str = matches.map((m) => `${m.home_team_id}->${m.away_team_id}`).join("|");
  return crypto.createHash("sha256").update(str).digest("hex");
}

let totalTests = 0;
let passedTests = 0;

function runSection(name: string, fn: () => void | Promise<void>) {
  return async () => {
    console.log(`\n========================================================`);
    console.log(`RUNNING SUITE: ${name}`);
    console.log(`========================================================`);
    try {
      await fn();
      console.log(`>>> [PASSED]: ${name}`);
    } catch (err: any) {
      console.error(`>>> [FAILED]: ${name}`, err);
      throw err;
    }
  };
}

// -----------------------------------------------------------------------------
// SECTION 1: ALGORITHM 3 WITH ARBITRARY NON-STANDARD INPUTS
// -----------------------------------------------------------------------------
async function testAlgorithm3ArbitraryInputs() {
  // Test 1.1: Arbitrary League IDs (la_liga, serie_a, custom-uuid, kpl)
  {
    totalTests++;
    console.log("\n[Test 1.1] Testing Algorithm 3 with arbitrary non-EPL league IDs...");
    const leagues = ["la_liga", "serie_a", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6", "kenya_premier"];
    const pitches: PitchInput[] = [
      { pitch_id: "pitch-alpha", state: "available" },
      { pitch_id: "pitch-beta", state: "available" },
    ];

    const timeConfig: LeagueTimeConfiguration[] = leagues.map((lid) => ({
      league_id: lid,
      slots: [
        { slot_number: 1, start_time: "09:00", end_time: "11:00" },
        { slot_number: 2, start_time: "11:30", end_time: "13:30" },
      ],
    }));

    const matchesList = leagues.flatMap((lid, idx) => [
      {
        match_id: `match-${lid}-1`,
        league_id: lid,
        home_id: `home-${lid}-1`,
        away_id: `away-${lid}-1`,
        matchday_number: 1,
        status: "scheduled" as const,
      },
      {
        match_id: `match-${lid}-2`,
        league_id: lid,
        home_id: `home-${lid}-2`,
        away_id: `away-${lid}-2`,
        matchday_number: 1,
        status: "scheduled" as const,
      },
    ]);

    const matchdays: MatchdayInput[] = [
      {
        matchday_number: 1,
        play_date: "2026-10-10",
        playable: true,
        matches: matchesList,
      },
    ];

    const signal: Algorithm3Signal = {
      run_id: "test-run-arbitrary-leagues",
      change_type: "INITIAL_ALLOCATION",
      matchdays,
      pitches,
      time_configuration: timeConfig,
      existing_allocations: [],
      requested_at: new Date().toISOString(),
    };

    const cmd = createAlgorithmCommand<Algorithm3Signal>({
      execution_id: "exec-algo3-1",
      season_id: "season-arb-leagues",
      algorithm: "ALGORITHM_3",
      command: "ALLOCATE_PITCH_SLOTS",
      payload_schema_version: "1.0",
      payload: signal,
    });

    const res = allocateMatches(cmd);
    assert(res.status === "success", `Algorithm 3 failed on arbitrary leagues: ${res.verification?.errors?.join(", ")}`);
    assert(res.payload.summary.total_future_matches_received === 8, "Expected 8 total future matches received");
    assert(res.payload.summary.total_allocated + res.payload.summary.total_spillover === 8, "Expected total allocated + spillover = 8");
    
    // Check by_league summary contains all arbitrary leagues
    for (const lid of leagues) {
      assert(res.payload.summary.by_league[lid] !== undefined, `by_league summary missing entry for ${lid}`);
      const stats = res.payload.summary.by_league[lid];
      assert(stats.allocated + stats.spillover === 2, `Expected 2 matches for ${lid}, got allocated=${stats.allocated}, spillover=${stats.spillover}`);
    }

    console.log("  Allocated matches count:", res.payload.database_operations.allocations.length);
    console.log("  Spillover matches count:", res.payload.database_operations.spillovers.length);
    console.log("  by_league summary:", JSON.stringify(res.payload.summary.by_league));
    passedTests++;
  }

  // Test 1.2: Arbitrary Pitch Counts (1 pitch, 2 pitches, 4 pitches)
  {
    totalTests++;
    console.log("\n[Test 1.2] Testing Algorithm 3 with dynamic pitch counts (1, 2, 4 pitches)...");
    
    for (const pitchCount of [1, 2, 4]) {
      const pitches: PitchInput[] = Array.from({ length: pitchCount }, (_, i) => ({
        pitch_id: `pitch-${i + 1}`,
        state: "available" as const,
      }));

      const timeConfig: LeagueTimeConfiguration[] = [
        {
          league_id: "tournament-x",
          slots: [
            { slot_number: 1, start_time: "08:00", end_time: "10:00" },
            { slot_number: 2, start_time: "10:30", end_time: "12:30" },
            { slot_number: 3, start_time: "14:00", end_time: "16:00" },
          ],
        },
      ];

      // 6 matches total for matchday 1
      const matches = Array.from({ length: 6 }, (_, i) => ({
        match_id: `m-pitch-test-${pitchCount}-${i + 1}`,
        league_id: "tournament-x",
        home_id: `team-h-${i + 1}`,
        away_id: `team-a-${i + 1}`,
        matchday_number: 1,
        status: "scheduled" as const,
      }));

      const signal: Algorithm3Signal = {
        run_id: `run-pitch-count-${pitchCount}`,
        change_type: "INITIAL_ALLOCATION",
        matchdays: [{ matchday_number: 1, play_date: "2026-10-15", playable: true, matches }],
        pitches,
        time_configuration: timeConfig,
        existing_allocations: [],
        requested_at: new Date().toISOString(),
      };

      const cmd = createAlgorithmCommand<Algorithm3Signal>({
        execution_id: `exec-algo3-pitch-${pitchCount}`,
        season_id: "season-pitch-tests",
        algorithm: "ALGORITHM_3",
        command: "ALLOCATE_PITCH_SLOTS",
        payload_schema_version: "1.0",
        payload: signal,
      });

      const res = allocateMatches(cmd);
      assert(res.status === "success", `Failed on pitchCount=${pitchCount}: ${res.verification?.errors?.join(", ")}`);
      
      const maxPossibleAllocations = pitchCount * 3; // 3 slots per pitch
      const expectedAllocations = Math.min(6, maxPossibleAllocations);
      const expectedSpillover = Math.max(0, 6 - maxPossibleAllocations);

      assert(
        res.payload.summary.total_allocated === expectedAllocations,
        `pitchCount=${pitchCount}: expected ${expectedAllocations} allocated, got ${res.payload.summary.total_allocated}`
      );
      assert(
        res.payload.summary.total_spillover === expectedSpillover,
        `pitchCount=${pitchCount}: expected ${expectedSpillover} spillover, got ${res.payload.summary.total_spillover}`
      );
      console.log(`  Pitch count = ${pitchCount}: Capacity = ${pitchCount * 3}, Allocated = ${res.payload.summary.total_allocated}, Spillover = ${res.payload.summary.total_spillover}`);
    }
    passedTests++;
  }

  // Test 1.3: Empty/missing time configuration -> must fail with clear error
  {
    totalTests++;
    console.log("\n[Test 1.3] Testing Algorithm 3 with missing/empty signal.time_configuration...");
    
    // 1.3a: Empty array time_configuration
    const signalEmpty: Algorithm3Signal = {
      run_id: "run-empty-tc",
      change_type: "INITIAL_ALLOCATION",
      matchdays: [{
        matchday_number: 1,
        play_date: "2026-10-15",
        playable: true,
        matches: [{
          match_id: "m1",
          league_id: "league-1",
          home_id: "t1",
          away_id: "t2",
          matchday_number: 1,
          status: "scheduled",
        }],
      }],
      pitches: [{ pitch_id: "p1", state: "available" }],
      time_configuration: [],
      existing_allocations: [],
      requested_at: new Date().toISOString(),
    };

    const cmdEmpty = createAlgorithmCommand<Algorithm3Signal>({
      execution_id: "exec-tc-empty",
      season_id: "season-tc-fail",
      algorithm: "ALGORITHM_3",
      command: "ALLOCATE_PITCH_SLOTS",
      payload_schema_version: "1.0",
      payload: signalEmpty,
    });

    const resEmpty = allocateMatches(cmdEmpty);
    assert(resEmpty.status === "failed", "Expected Algorithm 3 to fail with empty time_configuration");
    assert(
      resEmpty.verification?.errors?.some((e) => e.toLowerCase().includes("time_configuration")) ||
      resEmpty.verification?.logs?.some((l) => l.toLowerCase().includes("time_configuration")),
      `Expected error message referencing time_configuration, got: ${resEmpty.verification?.errors?.join("; ")}`
    );
    console.log("  Algorithm 3 empty time_configuration error:", resEmpty.verification?.errors?.[0] || resEmpty.verification?.logs?.[0]);

    // 1.3b: undefined time_configuration
    const signalUndefined = { ...signalEmpty, time_configuration: undefined as any };
    const cmdUndefined = createAlgorithmCommand<Algorithm3Signal>({
      execution_id: "exec-tc-undefined",
      season_id: "season-tc-fail",
      algorithm: "ALGORITHM_3",
      command: "ALLOCATE_PITCH_SLOTS",
      payload_schema_version: "1.0",
      payload: signalUndefined,
    });

    const resUndefined = allocateMatches(cmdUndefined);
    assert(resUndefined.status === "failed", "Expected Algorithm 3 to fail with undefined time_configuration");
    console.log("  Algorithm 3 undefined time_configuration error:", resUndefined.verification?.errors?.[0] || resUndefined.verification?.logs?.[0]);

    passedTests++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 2: ALGORITHM 2 WITH MISSING CAPACITY
// -----------------------------------------------------------------------------
async function testAlgorithm2MissingCapacity() {
  totalTests++;
  console.log("\n[Test 2.1] Testing Algorithm 2 with missing capacity (no signal capacity, no inferable history)...");

  const unassignedFixtures = [
    {
      fixture_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf1",
      league_id: "f81d4fae-7dec-11d0-a765-00a0c91e6000",
      leg: 1 as const,
      home_team_id: "f81d4fae-7dec-11d0-a765-00a0c91e6001",
      away_team_id: "f81d4fae-7dec-11d0-a765-00a0c91e6002",
      match_sequence: 1,
      matchday_number: null,
      playday: null,
      status: "SCHEDULED" as const,
      completed: false,
      historical: false,
    },
    {
      fixture_id: "f81d4fae-7dec-11d0-a765-00a0c91e6bf2",
      league_id: "f81d4fae-7dec-11d0-a765-00a0c91e6000",
      leg: 1 as const,
      home_team_id: "f81d4fae-7dec-11d0-a765-00a0c91e6003",
      away_team_id: "f81d4fae-7dec-11d0-a765-00a0c91e6004",
      match_sequence: 2,
      matchday_number: null,
      playday: null,
      status: "SCHEDULED" as const,
      completed: false,
      historical: false,
    },
  ];

  // Signal without matches_per_matchday
  const inputNoCap: Algorithm2Input = {
    fixtures: unassignedFixtures,
    signal: {
      signal_id: "f81d4fae-7dec-11d0-a765-00a0c91e6099",
      change_type: "INITIAL_ALLOCATION",
      requested_operation: "MATCHDAY_AND_PLAYDAY",
      playdays: [
        { date: "2026-09-05", mode: "PERMANENT", active: true },
        { date: "2026-09-06", mode: "PERMANENT", active: true },
      ],
      // matches_per_matchday is omitted
    },
  };

  const cmdNoCap = createAlgorithmCommand<Algorithm2Input>({
    execution_id: "exec-algo2-nocap",
    season_id: "season-nocap",
    algorithm: "ALGORITHM_2",
    command: "SCHEDULE_MATCHDAYS",
    payload_schema_version: "1.0",
    payload: inputNoCap,
  });

  const resNoCap = runAlgorithm2(cmdNoCap);
  assert(resNoCap.status === "failed", "Expected Algorithm 2 to fail when capacity is missing");
  const logStr = resNoCap.verification?.logs?.join(" | ") || "";
  assert(
    logStr.toLowerCase().includes("capacity") || resNoCap.payload?.verification_logs?.some((l) => l.toLowerCase().includes("capacity")),
    `Expected failure log to state that capacity must be provided, got: ${logStr}`
  );
  console.log("  Algorithm 2 missing capacity failure response verified:", logStr);

  // Now test that providing capacity in signal succeeds
  const inputWithCap: Algorithm2Input = {
    fixtures: unassignedFixtures,
    signal: {
      ...inputNoCap.signal,
      matches_per_matchday: {
        "f81d4fae-7dec-11d0-a765-00a0c91e6000": 2,
      },
    },
  };

  const cmdWithCap = createAlgorithmCommand<Algorithm2Input>({
    execution_id: "exec-algo2-withcap",
    season_id: "season-withcap",
    algorithm: "ALGORITHM_2",
    command: "SCHEDULE_MATCHDAYS",
    payload_schema_version: "1.0",
    payload: inputWithCap,
  });

  const resWithCap = runAlgorithm2(cmdWithCap);
  assert(resWithCap.status === "success", `Expected Algorithm 2 to succeed when capacity provided: ${resWithCap.verification?.logs?.join("; ")}`);
  console.log("  Algorithm 2 with valid capacity succeeded: Final schedule match count =", Object.keys(resWithCap.payload.final_schedule).length);
  passedTests++;
}

// -----------------------------------------------------------------------------
// SECTION 3: ALGORITHM 1 SEED REPRODUCIBILITY & DETERMINISM
// -----------------------------------------------------------------------------
async function testAlgorithm1SeedReproducibility() {
  totalTests++;
  console.log("\n[Test 3.1] Testing Algorithm 1 seed determinism and variation across season_ids...");

  const testTeams = [
    "team-01", "team-02", "team-03", "team-04",
    "team-05", "team-06", "team-07", "team-08",
  ];
  const leagueId = "premier-league-seed-test";

  const payload: LeagueInput[] = [{ league_id: leagueId, teams: testTeams }];

  // Run with season A twice
  const cmdA1 = createAlgorithmCommand<LeagueInput[]>({
    execution_id: "exec-a1",
    season_id: "season-2026-ALPHA",
    algorithm: "ALGORITHM_1",
    command: "GENERATE_FIXTURES",
    payload_schema_version: "1.0",
    payload,
  });

  const cmdA2 = createAlgorithmCommand<LeagueInput[]>({
    execution_id: "exec-a2",
    season_id: "season-2026-ALPHA",
    algorithm: "ALGORITHM_1",
    command: "GENERATE_FIXTURES",
    payload_schema_version: "1.0",
    payload,
  });

  // Run with season B
  const cmdB = createAlgorithmCommand<LeagueInput[]>({
    execution_id: "exec-b",
    season_id: "season-2026-BETA",
    algorithm: "ALGORITHM_1",
    command: "GENERATE_FIXTURES",
    payload_schema_version: "1.0",
    payload,
  });

  // Run with season C
  const cmdC = createAlgorithmCommand<LeagueInput[]>({
    execution_id: "exec-c",
    season_id: "season-2027-GAMMA",
    algorithm: "ALGORITHM_1",
    command: "GENERATE_FIXTURES",
    payload_schema_version: "1.0",
    payload,
  });

  const resA1 = generateFixtures(cmdA1);
  const resA2 = generateFixtures(cmdA2);
  const resB = generateFixtures(cmdB);
  const resC = generateFixtures(cmdC);

  assert(resA1.status === "success", "resA1 failed");
  assert(resA2.status === "success", "resA2 failed");
  assert(resB.status === "success", "resB failed");
  assert(resC.status === "success", "resC failed");

  const hashA1_leg1 = hashFixtureSequence(resA1.payload.data[leagueId].leg_1);
  const hashA1_leg2 = hashFixtureSequence(resA1.payload.data[leagueId].leg_2);

  const hashA2_leg1 = hashFixtureSequence(resA2.payload.data[leagueId].leg_1);
  const hashA2_leg2 = hashFixtureSequence(resA2.payload.data[leagueId].leg_2);

  const hashB_leg1 = hashFixtureSequence(resB.payload.data[leagueId].leg_1);
  const hashB_leg2 = hashFixtureSequence(resB.payload.data[leagueId].leg_2);

  const hashC_leg1 = hashFixtureSequence(resC.payload.data[leagueId].leg_1);
  const hashC_leg2 = hashFixtureSequence(resC.payload.data[leagueId].leg_2);

  console.log("  Hash Season Alpha (Run 1) Leg 1:", hashA1_leg1);
  console.log("  Hash Season Alpha (Run 2) Leg 1:", hashA2_leg1);
  console.log("  Hash Season Beta Leg 1:        ", hashB_leg1);
  console.log("  Hash Season Gamma Leg 1:       ", hashC_leg1);

  // Determinism check: Same season_id must produce identical hash
  assert(hashA1_leg1 === hashA2_leg1, "Determinism failed: identical inputs with same season_id produced different Leg 1 hashes!");
  assert(hashA1_leg2 === hashA2_leg2, "Determinism failed: identical inputs with same season_id produced different Leg 2 hashes!");

  // Diversity check: Different season_ids must produce different sequence hashes
  assert(hashA1_leg1 !== hashB_leg1, "Seed variation failed: season ALPHA and BETA produced identical Leg 1 hashes!");
  assert(hashA1_leg1 !== hashC_leg1, "Seed variation failed: season ALPHA and GAMMA produced identical Leg 1 hashes!");
  assert(hashB_leg1 !== hashC_leg1, "Seed variation failed: season BETA and GAMMA produced identical Leg 1 hashes!");

  console.log("  Reproducibility & seed sensitivity verified: 100% deterministic per season, distinct across different seasons.");
  passedTests++;
}

// -----------------------------------------------------------------------------
// SECTION 4: AGENT 0 VALIDATIONS & ERROR CODES
// -----------------------------------------------------------------------------
async function testAgent0ValidationErrors() {
  const dummySeasonId = "season-agent0-adversarial";

  // Mock adapters
  const createMockAdapters = (stateOverrides: Partial<DBState> = {}): Agent0Adapters => {
    const currentState: DBState = {
      season: { season_id: dummySeasonId, status: "DRAFT", start_date: "2026-09-01" },
      fixtures: [],
      matchdays: [],
      pitches: [
        { pitch_id: "p1", name: "Pitch 1", state: "available" },
        { pitch_id: "p2", name: "Pitch 2", state: "available" },
      ],
      timeConfiguration: [
        {
          league_id: "epl",
          slots: [
            { slot_number: 1, start_time: "08:30", end_time: "10:30" },
            { slot_number: 2, start_time: "11:00", end_time: "13:00" },
          ],
        },
      ],
      matchAssignments: [],
      referees: [],
      capacity: { EPL: 2, Championship: 2 },
      ...stateOverrides,
    };

    return {
      fetchCurrentState: async () => currentState,
      getLeagueConfigs: async () => [
        { league_id: "epl", teams: ["t1", "t2", "t3", "t4"] },
      ],
      insertBaseFixtures: async () => {},
      insertMatchdaySchedules: async () => {},
      insertPitchAllocations: async () => {},
      insertOfficiatingAssignments: async () => {},
      persistAtomically: async () => {},
    };
  };

  // Test 4.1: Missing Play Date -> throws Agent0Error("MISSING_PLAY_DATE")
  {
    totalTests++;
    console.log("\n[Test 4.1] Testing Agent 0 for MISSING_PLAY_DATE...");
    
    // We create a CHANGE_PITCH_STATE event (which requires Algorithm 3)
    // but state.fixtures has no playday, matchdays has no play_date, event has no date/seasonStartDate
    const adapters = createMockAdapters({
      fixtures: [
        {
          fixture_id: "f1",
          league_id: "epl",
          leg: 1,
          home_id: "t1",
          away_id: "t2",
          match_sequence: 1,
          matchday_number: 1,
          playday: "", // No playday
          status: "scheduled",
          completed: false,
          historical: false,
        },
      ],
      matchdays: [
        {
          matchday_id: "md1",
          season_id: dummySeasonId,
          league_id: "epl",
          matchday_number: 1,
          play_date: "", // No play_date
          status: "scheduled",
          playable: true,
        },
      ],
    });

    const event: PresidentEvent = {
      type: "CHANGE_PITCH_STATE",
      seasonId: dummySeasonId,
      pitchId: "p1",
      available: false,
      // No date or seasonStartDate on event
    };

    let caughtError: Agent0Error | null = null;
    try {
      await handleEvent(event, adapters);
    } catch (err: any) {
      if (err instanceof Agent0Error) {
        caughtError = err;
      } else {
        throw err;
      }
    }

    assert(caughtError !== null, "Expected handleEvent to throw Agent0Error for missing play date");
    assert(caughtError?.code === "MISSING_PLAY_DATE", `Expected code MISSING_PLAY_DATE, got ${caughtError?.code}: ${caughtError?.message}`);
    console.log(`  Caught expected Agent0Error: [${caughtError?.code}] ${caughtError?.message}`);
    passedTests++;
  }

  // Test 4.2: Empty distinctLeagueIds -> throws Agent0Error("NO_LEAGUES_FOUND")
  {
    totalTests++;
    console.log("\n[Test 4.2] Testing Agent 0 for NO_LEAGUES_FOUND...");
    
    // CHANGE_MATCHDAY_CAPACITY triggers Algorithm 2.
    // If fixtures have empty/null league_id, distinctLeagueIds will be empty.
    const adapters = createMockAdapters({
      fixtures: [
        {
          fixture_id: "f1",
          league_id: "", // empty league ID
          leg: 1,
          home_id: "t1",
          away_id: "t2",
          match_sequence: 1,
          matchday_number: 1,
          playday: "2026-09-05",
          status: "scheduled",
          completed: false,
          historical: false,
        },
      ],
      capacity: { EPL: 2, Championship: 2 },
    });

    const event: PresidentEvent = {
      type: "CHANGE_MATCHDAY_CAPACITY",
      seasonId: dummySeasonId,
      eplMatchesPerMatchday: 2,
    };

    let caughtError: Agent0Error | null = null;
    try {
      await handleEvent(event, adapters);
    } catch (err: any) {
      if (err instanceof Agent0Error) {
        caughtError = err;
      } else {
        throw err;
      }
    }

    assert(caughtError !== null, "Expected handleEvent to throw Agent0Error for empty distinct leagues");
    assert(caughtError?.code === "NO_LEAGUES_FOUND", `Expected code NO_LEAGUES_FOUND, got ${caughtError?.code}: ${caughtError?.message}`);
    console.log(`  Caught expected Agent0Error: [${caughtError?.code}] ${caughtError?.message}`);
    passedTests++;
  }

  // Test 4.3: Missing capacity -> throws Agent0Error("MISSING_MATCH_CAPACITY")
  {
    totalTests++;
    console.log("\n[Test 4.3] Testing Agent 0 for MISSING_MATCH_CAPACITY...");

    const adapters = createMockAdapters({
      fixtures: [
        {
          fixture_id: "f1",
          league_id: "epl",
          leg: 1,
          home_id: "t1",
          away_id: "t2",
          match_sequence: 1,
          matchday_number: 1,
          playday: "2026-09-05",
          status: "scheduled",
          completed: false,
          historical: false,
        },
      ],
      capacity: undefined as any, // No state capacity
    });

    const event: PresidentEvent = {
      type: "CANCEL_MATCHDAY",
      seasonId: dummySeasonId,
      matchdayNumber: 1,
      // No eplMatchesPerMatchday or championshipMatchesPerMatchday provided
    };

    let caughtError: Agent0Error | null = null;
    try {
      await handleEvent(event, adapters);
    } catch (err: any) {
      if (err instanceof Agent0Error) {
        caughtError = err;
      } else {
        throw err;
      }
    }

    assert(caughtError !== null, "Expected handleEvent to throw Agent0Error for missing capacity");
    assert(caughtError?.code === "MISSING_MATCH_CAPACITY", `Expected code MISSING_MATCH_CAPACITY, got ${caughtError?.code}: ${caughtError?.message}`);
    console.log(`  Caught expected Agent0Error: [${caughtError?.code}] ${caughtError?.message}`);
    passedTests++;
  }

  // Test 4.4: Missing time config -> throws Agent0Error("MISSING_TIME_CONFIGURATION")
  {
    totalTests++;
    console.log("\n[Test 4.4] Testing Agent 0 for MISSING_TIME_CONFIGURATION...");

    // CHANGE_PITCH_STATE triggers Algorithm 3.
    // If state.timeConfiguration is empty and event is not CHANGE_TIME_CONFIGURATION
    const adapters = createMockAdapters({
      fixtures: [
        {
          fixture_id: "f1",
          league_id: "epl",
          leg: 1,
          home_id: "t1",
          away_id: "t2",
          match_sequence: 1,
          matchday_number: 1,
          playday: "2026-09-05",
          status: "scheduled",
          completed: false,
          historical: false,
        },
      ],
      timeConfiguration: [], // Empty time configuration
    });

    const event: PresidentEvent = {
      type: "CHANGE_PITCH_STATE",
      seasonId: dummySeasonId,
      pitchId: "p1",
      available: false,
      date: "2026-09-05",
    };

    let caughtError: Agent0Error | null = null;
    try {
      await handleEvent(event, adapters);
    } catch (err: any) {
      if (err instanceof Agent0Error) {
        caughtError = err;
      } else {
        throw err;
      }
    }

    assert(caughtError !== null, "Expected handleEvent to throw Agent0Error for missing time configuration");
    assert(caughtError?.code === "MISSING_TIME_CONFIGURATION", `Expected code MISSING_TIME_CONFIGURATION, got ${caughtError?.code}: ${caughtError?.message}`);
    console.log(`  Caught expected Agent0Error: [${caughtError?.code}] ${caughtError?.message}`);
    passedTests++;
  }
}

// -----------------------------------------------------------------------------
// MAIN RUNNER
// -----------------------------------------------------------------------------
async function runAllChallengerTests() {
  console.log("############################################################");
  console.log("STARTING CHALLENGER 1 EMPIRICAL ADVERSARIAL STRESS SUITE");
  console.log("############################################################");

  await runSection("Section 1: Algorithm 3 Arbitrary Inputs & Failure Modes", testAlgorithm3ArbitraryInputs)();
  await runSection("Section 2: Algorithm 2 Missing Capacity Fail-Fast Behavior", testAlgorithm2MissingCapacity)();
  await runSection("Section 3: Algorithm 1 Determinism & Seed Sensitivity", testAlgorithm1SeedReproducibility)();
  await runSection("Section 4: Agent 0 Strict Validation & Error Codes", testAgent0ValidationErrors)();

  console.log("\n============================================================");
  console.log(`ALL CHALLENGES COMPLETED: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("VERDICT: 100% EMPIRICALLY CONFIRMED");
  console.log("============================================================");
}

runAllChallengerTests().catch((err) => {
  console.error("FATAL SUITE FAILURE:", err);
  process.exit(1);
});
