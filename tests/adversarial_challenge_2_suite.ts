import {
  createAlgorithmCommand,
  type AlgorithmCommandEnvelope,
} from "../src/shared/algorithmProtocol.ts";
import {
  allocateMatches,
  type Algorithm3Signal,
} from "../src/algorithms/algorithm3.ts";
import {
  runAlgorithm2,
  type Algorithm2Input,
  type FixtureRecord,
} from "../src/algorithms/algorithm2.ts";
import {
  generateFixtures,
  type LeagueInput,
} from "../src/algorithms/algorithm1.ts";
import {
  handleEvent,
  Agent0Error,
  type Agent0Adapters,
  type PresidentEvent,
} from "../src/services/agent0.ts";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: unknown;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string, details?: unknown) {
  if (!condition) {
    const err = new Error(`Assertion failed: ${message}`);
    (err as any).details = details;
    throw err;
  }
}

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ suite, name, passed: true });
    console.log(`  [PASS] ${suite} -> ${name}`);
  } catch (error: any) {
    results.push({
      suite,
      name,
      passed: false,
      error: error?.message || String(error),
      details: error?.details,
    });
    console.error(`  [FAIL] ${suite} -> ${name}: ${error?.message || error}`);
    if (error?.details) {
      console.error(`         Details:`, JSON.stringify(error.details, null, 2));
    }
  }
}

// ============================================================================
// SUITE 1: ALGORITHM 3 ADVERSARIAL CHALLENGES
// ============================================================================

async function suiteAlgorithm3() {
  console.log("\n=== SUITE 1: Algorithm 3 Adversarial Challenges ===");

  // 1.1 Arbitrary League IDs (UUID v4, la_liga, serie_a, custom_cup)
  await runTest(
    "Algorithm 3",
    "Arbitrary League IDs (UUID-v4, 'la_liga', 'serie_a', 'custom_cup')",
    () => {
      const leagueUuids = [
        "d3b07384-d113-4673-9a3b-1f81f1853612",
        "la_liga",
        "serie_a",
        "custom_cup_2026",
      ];

      const pitches = [
        { pitch_id: "pitch-north", state: "available" as const },
        { pitch_id: "pitch-south", state: "available" as const },
        { pitch_id: "pitch-east", state: "available" as const },
      ];

      const time_configuration = leagueUuids.map((lid) => ({
        league_id: lid,
        slots: [
          { slot_number: 1, start_time: "09:00", end_time: "11:00" },
          { slot_number: 2, start_time: "11:30", end_time: "13:30" },
        ],
      }));

      let matchIdCounter = 1;
      const matchdays = [
        {
          matchday_number: 1,
          play_date: "2026-10-01",
          matches: leagueUuids.flatMap((lid) => [
            {
              match_id: `match-${matchIdCounter++}`,
              league_id: lid,
              home_id: `team-${lid}-1`,
              away_id: `team-${lid}-2`,
              matchday_number: 1,
              status: "scheduled" as const,
            },
            {
              match_id: `match-${matchIdCounter++}`,
              league_id: lid,
              home_id: `team-${lid}-3`,
              away_id: `team-${lid}-4`,
              matchday_number: 1,
              status: "scheduled" as const,
            },
          ]),
        },
      ];

      const signal: Algorithm3Signal = {
        run_id: "algo3-arbitrary-leagues-run-1",
        change_type: "INITIAL_ALLOCATION",
        matchdays,
        pitches,
        time_configuration,
        existing_allocations: [],
      };

      const cmd = createAlgorithmCommand<Algorithm3Signal>({
        execution_id: "exec-algo3-arb-1",
        season_id: "season-arb-1",
        algorithm: "ALGORITHM_3",
        command: "ALLOCATE_PITCH_SLOTS",
        payload_schema_version: "1.0",
        payload: signal,
      });

      const res = allocateMatches(cmd);

      assert(res.status === "success", "Algorithm 3 must succeed with arbitrary league IDs", res);
      assert(res.payload.status === "success", "Payload status must be success");
      assert(res.payload.summary.by_league !== undefined, "Summary must include by_league breakdown");

      // Verify that every arbitrary league is represented in by_league
      for (const lid of leagueUuids) {
        assert(
          lid in res.payload.summary.by_league,
          `League ${lid} must be present in by_league summary`,
          res.payload.summary.by_league
        );
        const leagueStats = res.payload.summary.by_league[lid];
        assert(
          leagueStats.allocated + leagueStats.spillover === 2,
          `League ${lid} total allocated + spillover must equal 2 matches`,
          leagueStats
        );
      }
    }
  );

  // 1.2 Arbitrary Pitch Counts (1 pitch, 2 pitches, 4 pitches, 6 pitches)
  for (const pitchCount of [1, 2, 4, 6]) {
    await runTest(
      "Algorithm 3",
      `Arbitrary Pitch Count (${pitchCount} pitches)`,
      () => {
        const pitches = Array.from({ length: pitchCount }, (_, i) => ({
          pitch_id: `pitch-${i + 1}`,
          state: "available" as const,
        }));

        const time_configuration = [
          {
            league_id: "league_x",
            slots: [
              { slot_number: 1, start_time: "08:00", end_time: "10:00" },
              { slot_number: 2, start_time: "10:30", end_time: "12:30" },
              { slot_number: 3, start_time: "14:00", end_time: "16:00" },
            ],
          },
        ];

        // 8 matches for league_x
        const matches = Array.from({ length: 8 }, (_, i) => ({
          match_id: `match-x-${i + 1}`,
          league_id: "league_x",
          home_id: `team-x-${i * 2 + 1}`,
          away_id: `team-x-${i * 2 + 2}`,
          matchday_number: 1,
          status: "scheduled" as const,
        }));

        const signal: Algorithm3Signal = {
          run_id: `algo3-pitch-${pitchCount}-run`,
          change_type: "INITIAL_ALLOCATION",
          matchdays: [
            {
              matchday_number: 1,
              play_date: "2026-10-05",
              matches,
            },
          ],
          pitches,
          time_configuration,
          existing_allocations: [],
        };

        const cmd = createAlgorithmCommand<Algorithm3Signal>({
          execution_id: `exec-algo3-pitch-${pitchCount}`,
          season_id: "season-pitch-test",
          algorithm: "ALGORITHM_3",
          command: "ALLOCATE_PITCH_SLOTS",
          payload_schema_version: "1.0",
          payload: signal,
        });

        const res = allocateMatches(cmd);

        assert(
          res.status === "success",
          `Algorithm 3 must succeed dynamically with ${pitchCount} pitches`,
          res
        );

        const dailyCapacity = pitchCount * time_configuration[0].slots.length; // pitchCount * 3
        const expectedAllocated = Math.min(8, dailyCapacity);
        const expectedSpillover = Math.max(0, 8 - dailyCapacity);

        assert(
          res.payload.summary.total_allocated === expectedAllocated,
          `Expected ${expectedAllocated} allocations for ${pitchCount} pitches (got ${res.payload.summary.total_allocated})`
        );
        assert(
          res.payload.summary.total_spillover === expectedSpillover,
          `Expected ${expectedSpillover} spillovers for ${pitchCount} pitches (got ${res.payload.summary.total_spillover})`
        );

        // Verify allocated pitches exist in input pitch set
        const inputPitchIds = new Set(pitches.map((p) => p.pitch_id));
        for (const alloc of res.payload.database_operations.allocations) {
          assert(
            inputPitchIds.has(alloc.pitch_id),
            `Allocated pitch ${alloc.pitch_id} must belong to input pitches set`
          );
        }
      }
    );
  }

  // 1.3 Missing / Empty Time Configuration
  await runTest(
    "Algorithm 3",
    "Missing / Empty signal.time_configuration -> Fails with clear error message",
    () => {
      const pitches = [{ pitch_id: "pitch-1", state: "available" as const }];
      const signalEmpty: Algorithm3Signal = {
        run_id: "algo3-empty-timeconfig",
        change_type: "INITIAL_ALLOCATION",
        matchdays: [
          {
            matchday_number: 1,
            play_date: "2026-10-05",
            matches: [
              {
                match_id: "m-1",
                league_id: "league_a",
                home_id: "t1",
                away_id: "t2",
                matchday_number: 1,
                status: "scheduled",
              },
            ],
          },
        ],
        pitches,
        time_configuration: [] as any,
        existing_allocations: [],
      };

      const cmd = createAlgorithmCommand<Algorithm3Signal>({
        execution_id: "exec-algo3-missing-tc",
        season_id: "season-tc-test",
        algorithm: "ALGORITHM_3",
        command: "ALLOCATE_PITCH_SLOTS",
        payload_schema_version: "1.0",
        payload: signalEmpty,
      });

      const res = allocateMatches(cmd);

      assert(res.status === "failed", "Algorithm 3 must fail when time_configuration is empty");
      assert(
        res.verification.errors.some((e) =>
          e.toLowerCase().includes("time_configuration is required")
        ),
        `Verification errors must mention time_configuration requirement (got: ${res.verification.errors.join(", ")})`
      );
    }
  );
}

// ============================================================================
// SUITE 2: ALGORITHM 2 ADVERSARIAL CHALLENGES
// ============================================================================

async function suiteAlgorithm2() {
  console.log("\n=== SUITE 2: Algorithm 2 Adversarial Challenges ===");

  await runTest(
    "Algorithm 2",
    "Missing Capacity (no signal capacity, no inferable history) -> Fails with clear error",
    () => {
      // Create unassigned fixtures with no matchday_number and no completed fixtures
      const unassignedFixtures: FixtureRecord[] = [
        {
          fixture_id: "fix-1",
          league_id: "unknown_league_xyz",
          home_id: "team_1",
          away_id: "team_2",
          leg: 1,
          match_sequence: 1,
          matchday_number: null,
          playday: null,
          completed: false,
          historical: false,
        },
        {
          fixture_id: "fix-2",
          league_id: "unknown_league_xyz",
          home_id: "team_3",
          away_id: "team_4",
          leg: 1,
          match_sequence: 2,
          matchday_number: null,
          playday: null,
          completed: false,
          historical: false,
        },
      ];

      // Signal provides playdays, but NO matches_per_matchday for unknown_league_xyz
      const signal = {
        signal_id: "algo2-no-cap-sig",
        change_type: "INITIAL_DISTRIBUTION" as const,
        requested_operation: "MATCHDAY_AND_PLAYDAY" as const,
        playdays: [
          { date: "2026-10-01", mode: "PERMANENT" as const, active: true },
          { date: "2026-10-08", mode: "PERMANENT" as const, active: true },
        ],
        matches_per_matchday: undefined, // Explicitly missing
      };

      const cmd = createAlgorithmCommand<Algorithm2Input>({
        execution_id: "exec-algo2-missing-cap",
        season_id: "season-algo2-test",
        algorithm: "ALGORITHM_2",
        command: "SCHEDULE_MATCHDAYS",
        payload_schema_version: "1.0",
        payload: {
          fixtures: unassignedFixtures,
          signal,
        },
      });

      const res = runAlgorithm2(cmd);

      assert(res.status === "failed", "Algorithm 2 must return status 'failed' when capacity cannot be determined");
      assert(res.database?.ready_for_write === false, "database.ready_for_write must be false");
      assert(
        res.verification.errors.some((e) =>
          e.includes("Matchday capacity must be provided for league")
        ),
        `Verification errors must state that capacity must be provided (got: ${res.verification.errors.join(", ")})`
      );
    }
  );
}

// ============================================================================
// SUITE 3: ALGORITHM 1 SEED REPRODUCIBILITY & VARIANCE
// ============================================================================

async function suiteAlgorithm1() {
  console.log("\n=== SUITE 3: Algorithm 1 Determinism & Seed Variance ===");

  const sampleTeams = [
    { team_id: "team-1", team_name: "Alpha" },
    { team_id: "team-2", team_name: "Beta" },
    { team_id: "team-3", team_name: "Gamma" },
    { team_id: "team-4", team_name: "Delta" },
    { team_id: "team-5", team_name: "Epsilon" },
    { team_id: "team-6", team_name: "Zeta" },
  ];

  const leagueInput: LeagueInput[] = [
    {
      league_id: "league_premier_custom",
      teams: sampleTeams,
    },
  ];

  // 3.1 Determinism: Same season_id + league_id produces identical fixture sequences
  await runTest(
    "Algorithm 1",
    "Deterministic: Same season_id + league_id produces 100% identical fixture sequence",
    () => {
      const seasonId = "season_2026_fixed";

      const cmd1 = createAlgorithmCommand<LeagueInput[]>({
        execution_id: "exec-algo1-det-1",
        season_id: seasonId,
        algorithm: "ALGORITHM_1",
        command: "GENERATE_FIXTURES",
        payload_schema_version: "1.0",
        payload: leagueInput,
      });

      const cmd2 = createAlgorithmCommand<LeagueInput[]>({
        execution_id: "exec-algo1-det-2",
        season_id: seasonId,
        algorithm: "ALGORITHM_1",
        command: "GENERATE_FIXTURES",
        payload_schema_version: "1.0",
        payload: leagueInput,
      });

      const res1 = generateFixtures(cmd1);
      const res2 = generateFixtures(cmd2);

      assert(res1.status === "success", "Run 1 must succeed");
      assert(res2.status === "success", "Run 2 must succeed");

      const leg1_run1 = res1.payload.data["league_premier_custom"].leg_1;
      const leg1_run2 = res2.payload.data["league_premier_custom"].leg_1;

      assert(leg1_run1.length === leg1_run2.length, "Leg 1 lengths must match");
      for (let i = 0; i < leg1_run1.length; i++) {
        assert(
          leg1_run1[i].home_id === leg1_run2[i].home_id &&
            leg1_run1[i].away_id === leg1_run2[i].away_id &&
            leg1_run1[i].match_sequence === leg1_run2[i].match_sequence,
          `Fixture at index ${i} must be identical across both runs with same season_id`
        );
      }
    }
  );

  // 3.2 Variance: Different season_id values produce distinct fixture sequences
  await runTest(
    "Algorithm 1",
    "Seed Variance: Different season_id values produce different chronological match sequences",
    () => {
      const seasonA = "season_2026_fall";
      const seasonB = "season_2027_spring";
      const seasonC = "season_2028_winter";

      const runForSeason = (seasonId: string) => {
        const cmd = createAlgorithmCommand<LeagueInput[]>({
          execution_id: `exec-algo1-${seasonId}`,
          season_id: seasonId,
          algorithm: "ALGORITHM_1",
          command: "GENERATE_FIXTURES",
          payload_schema_version: "1.0",
          payload: leagueInput,
        });
        const res = generateFixtures(cmd);
        assert(res.status === "success", `Generation for ${seasonId} must succeed`);
        return res.payload.data["league_premier_custom"].leg_1.map(
          (f) => `${f.match_sequence}:${f.home_id}v${f.away_id}`
        ).join("|");
      };

      const hashA = runForSeason(seasonA);
      const hashB = runForSeason(seasonB);
      const hashC = runForSeason(seasonC);

      assert(
        hashA !== hashB,
        `Season A (${seasonA}) and Season B (${seasonB}) must produce different fixture sequences`
      );
      assert(
        hashA !== hashC,
        `Season A (${seasonA}) and Season C (${seasonC}) must produce different fixture sequences`
      );
      assert(
        hashB !== hashC,
        `Season B (${seasonB}) and Season C (${seasonC}) must produce different fixture sequences`
      );
    }
  );
}

// ============================================================================
// SUITE 4: AGENT 0 ERROR BOUNDARIES
// ============================================================================

async function suiteAgent0() {
  console.log("\n=== SUITE 4: Agent 0 Orchestrator Error Boundaries ===");

  function createMockAdapters(overrides?: Partial<Awaited<ReturnType<Agent0Adapters["fetchCurrentState"]>>>): Agent0Adapters {
    const baseState: Awaited<ReturnType<Agent0Adapters["fetchCurrentState"]>> = {
      fixtures: [
        {
          fixture_id: "fix-1",
          league_id: "epl-uuid-1",
          home_id: "t1",
          away_id: "t2",
          leg: 1,
          match_sequence: 1,
          matchday_number: 1,
          playday: "2026-10-01",
          completed: false,
          historical: false,
        },
        {
          fixture_id: "fix-2",
          league_id: "champ-uuid-2",
          home_id: "t3",
          away_id: "t4",
          leg: 1,
          match_sequence: 2,
          matchday_number: 1,
          playday: "2026-10-01",
          completed: false,
          historical: false,
        },
      ],
      matchdays: [
        {
          matchday_id: "md-1",
          matchday_number: 1,
          play_date: "2026-10-01",
          playable: true,
          match_ids: ["fix-1", "fix-2"],
        },
      ],
      matchAssignments: [],
      playdays: [{ date: "2026-10-01", mode: "PERMANENT", active: true }],
      capacity: { EPL: 2, Championship: 2 },
      pitches: [
        { pitch_id: "p1", state: "available" },
        { pitch_id: "p2", state: "available" },
        { pitch_id: "p3", state: "available" },
      ],
      referees: [
        { referee_id: "ref-1", tier: "EPL_Exclusive" },
        { referee_id: "ref-2", tier: "Mixed" },
        { referee_id: "ref-3", tier: "Mixed" },
      ],
      teams: [
        { team_id: "t1", league_type: "EPL" },
        { team_id: "t2", league_type: "EPL" },
        { team_id: "t3", league_type: "CHAMPIONSHIP" },
        { team_id: "t4", league_type: "CHAMPIONSHIP" },
      ],
      timeConfiguration: [
        {
          league_id: "epl",
          slots: [
            { slot_number: 1, start_time: "09:00", end_time: "11:00" },
            { slot_number: 2, start_time: "11:30", end_time: "13:30" },
          ],
        },
        {
          league_id: "championship",
          slots: [
            { slot_number: 1, start_time: "14:00", end_time: "16:00" },
            { slot_number: 2, start_time: "16:30", end_time: "18:30" },
          ],
        },
      ],
      ...overrides,
    };

    return {
      async fetchCurrentState() {
        return baseState;
      },
      async readBackAndVerify() {},
      async getLeagueConfigs() {
        return [];
      },
    };
  }

  // 4.1 Missing play date -> Agent0Error("MISSING_PLAY_DATE")
  await runTest(
    "Agent 0",
    "Missing play date -> Throws/Returns Agent0Error('MISSING_PLAY_DATE')",
    async () => {
      // Construct state where fixtures and matchdays have NO play date, and event has no date/seasonStartDate
      const adapters = createMockAdapters({
        fixtures: [
          {
            fixture_id: "fix-1",
            league_id: "epl-uuid-1",
            home_id: "t1",
            away_id: "t2",
            leg: 1,
            match_sequence: 1,
            matchday_number: 1,
            playday: null, // No playday
            completed: false,
            historical: false,
          },
        ],
        matchdays: [
          {
            matchday_id: "md-1",
            matchday_number: 1,
            play_date: "" as any, // Missing/empty play_date
            playable: true,
            match_ids: ["fix-1"],
          },
        ],
      });

      const event: PresidentEvent = {
        type: "CHANGE_PITCH_STATE",
        seasonId: "season-missing-playdate",
        pitchId: "p1",
        amAvailable: false,
      };

      const result = await handleEvent(event, adapters);

      assert(result.success === false, "Agent 0 must fail on missing play date");
      assert(
        result.error?.code === "MISSING_PLAY_DATE",
        `Error code must be MISSING_PLAY_DATE (got: ${result.error?.code})`
      );
    }
  );

  // 4.2 Empty distinctLeagueIds -> Agent0Error("NO_LEAGUES_FOUND")
  await runTest(
    "Agent 0",
    "Empty distinctLeagueIds -> Throws/Returns Agent0Error('NO_LEAGUES_FOUND')",
    async () => {
      // State has fixtures with empty or undefined league_id
      const adapters = createMockAdapters({
        fixtures: [
          {
            fixture_id: "fix-1",
            league_id: "", // empty
            home_id: "t1",
            away_id: "t2",
            leg: 1,
            match_sequence: 1,
            matchday_number: 1,
            playday: "2026-10-01",
            completed: false,
            historical: false,
          },
        ],
      });

      const event: PresidentEvent = {
        type: "CHANGE_MATCH_CAPACITY",
        seasonId: "season-empty-leagues",
        eplMatchesPerMatchday: 2,
        championshipMatchesPerMatchday: 2,
      };

      const result = await handleEvent(event, adapters);

      assert(result.success === false, "Agent 0 must fail on empty distinctLeagueIds");
      assert(
        result.error?.code === "NO_LEAGUES_FOUND",
        `Error code must be NO_LEAGUES_FOUND (got: ${result.error?.code})`
      );
    }
  );

  // 4.3 Missing capacity -> Agent0Error("MISSING_MATCH_CAPACITY")
  await runTest(
    "Agent 0",
    "Missing match capacity -> Throws/Returns Agent0Error('MISSING_MATCH_CAPACITY')",
    async () => {
      // State has no capacity, and event does not supply it
      const adapters = createMockAdapters({
        capacity: undefined as any,
      });

      const event: PresidentEvent = {
        type: "ADD_PLAYDAY_ONCE",
        seasonId: "season-missing-capacity",
        date: "2026-10-15",
      };

      const result = await handleEvent(event, adapters);

      assert(result.success === false, "Agent 0 must fail on missing match capacity");
      assert(
        result.error?.code === "MISSING_MATCH_CAPACITY",
        `Error code must be MISSING_MATCH_CAPACITY (got: ${result.error?.code})`
      );
    }
  );

  // 4.4 Missing time config -> Agent0Error("MISSING_TIME_CONFIGURATION")
  await runTest(
    "Agent 0",
    "Missing time configuration -> Throws/Returns Agent0Error('MISSING_TIME_CONFIGURATION')",
    async () => {
      // State has empty timeConfiguration, and event does not supply slots
      const adapters = createMockAdapters({
        timeConfiguration: [] as any,
      });

      const event: PresidentEvent = {
        type: "CHANGE_PITCH_STATE",
        seasonId: "season-missing-timeconfig",
        pitchId: "p2",
        amAvailable: true,
      };

      const result = await handleEvent(event, adapters);

      assert(result.success === false, "Agent 0 must fail on missing time configuration");
      assert(
        result.error?.code === "MISSING_TIME_CONFIGURATION",
        `Error code must be MISSING_TIME_CONFIGURATION (got: ${result.error?.code})`
      );
    }
  );
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function main() {
  console.log("=================================================================");
  console.log("CHALLENGER 2: ADVERSARIAL STRESS TEST & VERIFICATION HARNESS");
  console.log("=================================================================");

  await suiteAlgorithm3();
  await suiteAlgorithm2();
  await suiteAlgorithm1();
  await suiteAgent0();

  console.log("\n=================================================================");
  console.log("SUMMARY OF RESULTS:");
  console.log("=================================================================");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error("\nFAILURES DETECTED:");
    for (const r of results.filter((r) => !r.passed)) {
      console.error(`- [FAIL] ${r.suite} -> ${r.name}: ${r.error}`);
    }
    process.exit(1);
  } else {
    console.log("\nALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
