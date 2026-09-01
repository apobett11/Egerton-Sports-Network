/* ============================================================================
 * ALGORITHM 1 — MATHEMATICAL FIXTURE GENERATOR (Protocol Wrapper)
 * ============================================================================
 *
 * This file is the protocol boundary for Algorithm 1.
 *
 * It:
 *   1. Accepts an AlgorithmCommandEnvelope<LeagueInput[]> from Agent 0.
 *   2. Validates the envelope using the shared protocol.
 *   3. Extracts the payload and passes it to the existing Algorithm 1 engine.
 *   4. Wraps the native output in an AlgorithmResultEnvelope<Algo1Output>.
 *   5. Returns the result envelope to Agent 0.
 *
 * THE MATHEMATICAL ENGINE IS NOT MODIFIED.
 *
 * ========================================================================== */

import {
  validateCommandEnvelope,
  createAlgorithmResult,
  type AlgorithmCommandEnvelope,
  type AlgorithmResultEnvelope,
} from "../shared/algorithmProtocol";

/* ============================================================================
 * RE-EXPORTED ALGORITHM 1 TYPES
 * (Copied verbatim from algorithm 1.txt — no mathematics changed)
 * ========================================================================== */

export interface LeagueInput {
  league_id: string;
  teams: string[];
}

export interface Fixture {
  home_id: string;
  away_id: string;
  match_sequence: number;
}

export interface Algo1Output {
  status: "success" | "failed";
  verification_logs: string[];
  data: {
    [league_id: string]: {
      leg_1: Fixture[];
      leg_2: Fixture[];
    };
  };
}

/* ============================================================================
 * INTERNAL TYPES
 * ========================================================================== */

interface InternalFixture {
  home_id: string;
  away_id: string;
}

interface GeneratedLeg {
  matchdays: InternalFixture[][];
  fixtures: InternalFixture[];
}

interface VerificationResult {
  passed: boolean;
  logs: string[];
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const BYE = "__ALGORITHM_1_BYE__";

/* ============================================================================
 * HELPER: Calculate expected record count for database write
 * ========================================================================== */

function calculateAlgorithm1RecordCount(output: Algo1Output): number {
  if (output.status !== "success") return 0;
  let count = 0;
  for (const leagueId of Object.keys(output.data)) {
    const leagueData = output.data[leagueId];
    count += leagueData.leg_1.length + leagueData.leg_2.length;
  }
  return count;
}

/* ============================================================================
 * PROTOCOL ENTRY POINT (Part 4A/4B/4C)
 *
 * OLD signature:  generateFixtures(leagues: LeagueInput[]): Algo1Output
 * NEW signature:  generateFixtures(command: AlgorithmCommandEnvelope<LeagueInput[]>):
 *                                  AlgorithmResultEnvelope<Algo1Output>
 * ========================================================================== */

export function generateFixtures(
  command: AlgorithmCommandEnvelope<LeagueInput[]>,
): AlgorithmResultEnvelope<Algo1Output> {
  // Part 4B: Validate the command envelope first
  validateCommandEnvelope(command, "ALGORITHM_1");

  // Part 4B: Extract the payload
  const leagues = command.payload;

  // Run the EXISTING Algorithm 1 mathematical engine (unchanged)
  const nativeOutput = generateFixturesEngine(leagues, command.season_id);

  // Part 4C: Wrap the native output in the result envelope
  return createAlgorithmResult({
    execution_id: command.execution_id,
    season_id: command.season_id,
    algorithm: "ALGORITHM_1",
    status: nativeOutput.status,
    payload: nativeOutput,
    verification: {
      passed: nativeOutput.status === "success",
      logs: nativeOutput.verification_logs,
      errors:
        nativeOutput.status === "failed"
          ? nativeOutput.verification_logs
          : [],
      warnings: [],
    },
    database: {
      ready_for_write: nativeOutput.status === "success",
      operation: "INSERT",
      expected_count: calculateAlgorithm1RecordCount(nativeOutput),
    },
  });
}

/* ============================================================================
 * EXISTING ALGORITHM 1 MATHEMATICAL ENGINE
 * ============================================================================
 *
 * Everything below this line is THE ORIGINAL Algorithm 1 mathematics.
 *
 * NOTHING BELOW IS MODIFIED.
 *
 * The engine is now called `generateFixturesEngine` (was `generateFixtures`)
 * to avoid name collision with the protocol entry point above.
 *
 * Pure, database-independent, serverless-safe fixture generation engine.
 *
 * Responsibilities:
 *   1. Accept multiple leagues.
 *   2. Generate a mathematically valid Double Round-Robin schedule.
 *   3. Use the Berger Polygon / Circle Method.
 *   4. Automatically add a BYE for odd team counts.
 *   5. Remove BYE fixtures from the final result.
 *   6. Generate Leg 2 as the exact Home/Away inverse of Leg 1.
 *   7. Preserve matchday integrity.
 *   8. Assign a deterministic pseudo-random chronological sequence.
 *   9. Verify the generated mathematics exactly once.
 *  10. Return a strict Agent-0-ready payload.
 *
 * IMPORTANT:
 *   - No database access.
 *   - No SQL.
 *   - No network calls.
 *   - No webhooks.
 *   - No external dependencies.
 *   - No generation retry.
 *   - No regeneration after verification failure.
 *   - The generation engine executes exactly once per supplied league.
 *   - Verification executes exactly once per supplied league.
 * ========================================================================== */

function generateFixturesEngine(
  leagues: LeagueInput[],
  seasonId: string,
): Algo1Output {
  const verification_logs: string[] = [];

  /*
   * --------------------------------------------------------------------------
   * INPUT VALIDATION
   * --------------------------------------------------------------------------
   */

  verification_logs.push(
    "Confirming: Algorithm 1 received a valid league configuration array...",
  );

  if (!Array.isArray(leagues)) {
    verification_logs.push(
      "Failed: League configuration input is not an array.",
    );

    return {
      status: "failed",
      verification_logs,
      data: {},
    };
  }

  if (leagues.length === 0) {
    verification_logs.push(
      "Failed: No league configurations were supplied.",
    );

    return {
      status: "failed",
      verification_logs,
      data: {},
    };
  }

  const normalizedLeagues: LeagueInput[] = [];

  for (const league of leagues) {
    if (
      !league ||
      typeof league.league_id !== "string" ||
      league.league_id.trim().length === 0
    ) {
      verification_logs.push(
        "Failed: Every league must contain a non-empty league_id.",
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    if (!Array.isArray(league.teams)) {
      verification_logs.push(
        `Failed: League ${league.league_id} does not contain a valid teams array.`,
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    const teams = league.teams.map((team) => team.trim());

    if (teams.length < 2) {
      verification_logs.push(
        `Failed: League ${league.league_id} requires at least 2 teams.`,
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    if (teams.some((team) => team.length === 0)) {
      verification_logs.push(
        `Failed: League ${league.league_id} contains an empty team identifier.`,
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    const uniqueTeams = new Set(teams);

    if (uniqueTeams.size !== teams.length) {
      verification_logs.push(
        `Failed: League ${league.league_id} contains duplicate team identifiers.`,
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    normalizedLeagues.push({
      league_id: league.league_id.trim(),
      teams,
    });
  }

  /*
   * Duplicate league IDs would make the output object ambiguous.
   */

  const leagueIds = new Set<string>();

  for (const league of normalizedLeagues) {
    if (leagueIds.has(league.league_id)) {
      verification_logs.push(
        `Failed: Duplicate league_id detected: ${league.league_id}.`,
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }

    leagueIds.add(league.league_id);
  }

  /*
   * --------------------------------------------------------------------------
   * GENERATION
   * --------------------------------------------------------------------------
   *
   * IMPORTANT:
   * This is the ONLY generation pass.
   *
   * There is no "try again".
   * There is no regeneration if verification fails.
   */

  verification_logs.push(
    "Passed: Input structure and league uniqueness confirmed.",
  );

  verification_logs.push(
    "Confirming: Generating all supplied leagues in one mathematical generation pass...",
  );

  const generatedData: Record<
    string,
    {
      leg_1: Fixture[];
      leg_2: Fixture[];
    }
  > = {};

  for (const league of normalizedLeagues) {
    verification_logs.push(
      `Generating: League ${league.league_id} with ${league.teams.length} teams...`,
    );

    const generated = generateLeagueOnce(league.teams);

    generatedData[league.league_id] = {
      leg_1: assignChronologicalSequence(
        generated.leg1.matchdays,
        createSeed(seasonId, league.league_id, "LEG_1"),
      ),
      leg_2: assignChronologicalSequence(
        generated.leg2.matchdays,
        createSeed(seasonId, league.league_id, "LEG_2"),
      ),
    };
  }

  /*
   * --------------------------------------------------------------------------
   * INTERNAL VERIFICATION
   * --------------------------------------------------------------------------
   *
   * Verification is executed exactly once.
   *
   * It does not regenerate the fixtures.
   * It does not mutate the generated schedule.
   */

  verification_logs.push(
    "Confirming: Mathematical generation pass completed. Beginning single integrity verification pass...",
  );

  for (const league of normalizedLeagues) {
    const generated = generatedData[league.league_id];

    const verification = verifyIntegrity(
      league,
      generated.leg_1,
      generated.leg_2,
    );

    verification_logs.push(...verification.logs);

    if (!verification.passed) {
      verification_logs.push(
        `FAILED: Mathematical integrity verification failed for league ${league.league_id}.`,
      );

      verification_logs.push(
        "HALTED: Corrupted or mathematically invalid fixture data will not be handed to Agent 0.",
      );

      return {
        status: "failed",
        verification_logs,
        data: {},
      };
    }
  }

  /*
   * --------------------------------------------------------------------------
   * FINAL SUCCESS STATE
   * --------------------------------------------------------------------------
   */

  verification_logs.push(
    "Passed: All supplied leagues completed the single mathematical integrity verification.",
  );

  verification_logs.push(
    "Passed: No self-play violations detected.",
  );

  verification_logs.push(
    "Passed: No Leg 1 duplicate matchups detected.",
  );

  verification_logs.push(
    "Passed: Leg 2 is a perfect Home/Away mirror of Leg 1.",
  );

  verification_logs.push(
    "Passed: Matchday integrity confirmed for every league.",
  );

  verification_logs.push(
    "Passed: Total fixture counts match the mathematical N(N-1) requirement for every league.",
  );

  verification_logs.push(
    "SUCCESS: Algorithm 1 completed and produced an integrity-verified fixture payload.",
  );

  verification_logs.push(
    "STOP: Fixture generation and verification are complete. No regeneration will occur.",
  );

  return {
    status: "success",
    verification_logs,
    data: generatedData,
  };
}

/* ============================================================================
 * SINGLE-PASS LEAGUE GENERATION
 * ============================================================================
 *
 * Berger Polygon / Circle Method.
 *
 * For N teams:
 *
 *   Even N:
 *     rounds = N - 1
 *     matches per round = N / 2
 *
 *   Odd N:
 *     add BYE
 *     effective N = N + 1
 *     rounds = effective N - 1
 *     matches per round = effective N / 2
 *
 * The BYE is mathematical infrastructure only.
 * It is never returned.
 * ========================================================================== */

function generateLeagueOnce(teams: string[]): {
  leg1: GeneratedLeg;
  leg2: GeneratedLeg;
} {
  const polygon: string[] = [...teams];

  if (polygon.length % 2 !== 0) {
    polygon.push(BYE);
  }

  const teamCount = polygon.length;
  const rounds = teamCount - 1;
  const matchesPerRound = teamCount / 2;

  const leg1Matchdays: InternalFixture[][] = [];

  let current = [...polygon];

  for (let round = 0; round < rounds; round++) {
    const matchday: InternalFixture[] = [];

    for (let index = 0; index < matchesPerRound; index++) {
      const first = current[index];
      const second = current[teamCount - 1 - index];

      if (first === BYE || second === BYE) {
        continue;
      }

      const fixture: InternalFixture =
        round % 2 === 0
          ? {
              home_id: first,
              away_id: second,
            }
          : {
              home_id: second,
              away_id: first,
            };

      matchday.push(fixture);
    }

    leg1Matchdays.push(matchday);

    current = [
      current[0],
      current[teamCount - 1],
      ...current.slice(1, teamCount - 1),
    ];
  }

  const leg1Fixtures = flattenMatchdays(leg1Matchdays);

  const leg2Matchdays: InternalFixture[][] = leg1Matchdays.map(
    (matchday) =>
      matchday.map((fixture) => ({
        home_id: fixture.away_id,
        away_id: fixture.home_id,
      })),
  );

  const leg2Fixtures = flattenMatchdays(leg2Matchdays);

  return {
    leg1: {
      matchdays: leg1Matchdays,
      fixtures: leg1Fixtures,
    },
    leg2: {
      matchdays: leg2Matchdays,
      fixtures: leg2Fixtures,
    },
  };
}

/* ============================================================================
 * FLATTEN MATCHDAYS
 * ========================================================================== */

function flattenMatchdays(
  matchdays: InternalFixture[][],
): InternalFixture[] {
  const fixtures: InternalFixture[] = [];

  for (const matchday of matchdays) {
    for (const fixture of matchday) {
      fixtures.push({
        home_id: fixture.home_id,
        away_id: fixture.away_id,
      });
    }
  }

  return fixtures;
}

/* ============================================================================
 * INTERNAL VERIFICATION ENGINE
 * ========================================================================== */

function verifyIntegrity(
  league: LeagueInput,
  leg1: Fixture[],
  leg2: Fixture[],
): VerificationResult {
  const logs: string[] = [];

  const teams = league.teams;
  const teamCount = teams.length;

  logs.push(
    `Confirming: Total season match count for league ${league.league_id}...`,
  );

  const expectedLegMatches = (teamCount * (teamCount - 1)) / 2;
  const expectedSeasonMatches = teamCount * (teamCount - 1);

  if (leg1.length !== expectedLegMatches) {
    logs.push(
      `Failed: Leg 1 contains ${leg1.length} matches; expected ${expectedLegMatches}.`,
    );
    return { passed: false, logs };
  }

  if (leg2.length !== expectedLegMatches) {
    logs.push(
      `Failed: Leg 2 contains ${leg2.length} matches; expected ${expectedLegMatches}.`,
    );
    return { passed: false, logs };
  }

  if (leg1.length + leg2.length !== expectedSeasonMatches) {
    logs.push(
      `Failed: Season contains ${leg1.length + leg2.length} matches; expected ${expectedSeasonMatches}.`,
    );
    return { passed: false, logs };
  }

  logs.push(
    `Passed: Total match count equals N(N-1) = ${expectedSeasonMatches}.`,
  );

  logs.push("Confirming: No self-play violations in Leg 1...");

  for (const fixture of leg1) {
    if (fixture.home_id === fixture.away_id) {
      logs.push(
        `Failed: Self-play detected in Leg 1: ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }
  }

  logs.push("Passed: No self-play violations detected in Leg 1.");
  logs.push("Confirming: No self-play violations in Leg 2...");

  for (const fixture of leg2) {
    if (fixture.home_id === fixture.away_id) {
      logs.push(
        `Failed: Self-play detected in Leg 2: ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }
  }

  logs.push("Passed: No self-play violations detected in Leg 2.");
  logs.push("Confirming: Leg 1 contains every matchup exactly once...");

  const leg1Matchups = new Set<string>();

  for (const fixture of leg1) {
    const key = canonicalMatchupKey(fixture.home_id, fixture.away_id);

    if (leg1Matchups.has(key)) {
      logs.push(
        `Failed: Duplicate Leg 1 matchup detected: ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }

    leg1Matchups.add(key);
  }

  if (leg1Matchups.size !== expectedLegMatches) {
    logs.push(
      `Failed: Leg 1 contains ${leg1Matchups.size} unique matchups; expected ${expectedLegMatches}.`,
    );
    return { passed: false, logs };
  }

  logs.push("Passed: Every Leg 1 team pairing occurs exactly once.");
  logs.push("Confirming: Leg 2 contains every matchup exactly once...");

  const leg2Matchups = new Set<string>();

  for (const fixture of leg2) {
    const key = canonicalMatchupKey(fixture.home_id, fixture.away_id);

    if (leg2Matchups.has(key)) {
      logs.push(
        `Failed: Duplicate Leg 2 matchup detected: ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }

    leg2Matchups.add(key);
  }

  if (leg2Matchups.size !== expectedLegMatches) {
    logs.push(
      `Failed: Leg 2 contains ${leg2Matchups.size} unique matchups; expected ${expectedLegMatches}.`,
    );
    return { passed: false, logs };
  }

  logs.push("Passed: Every Leg 2 team pairing occurs exactly once.");
  logs.push("Confirming: Leg 2 is the exact Home/Away inverse of Leg 1...");

  const leg2OrientationMap = new Map<string, string>();

  for (const fixture of leg2) {
    const key = canonicalMatchupKey(fixture.home_id, fixture.away_id);

    if (leg2OrientationMap.has(key)) {
      logs.push(
        `Failed: Multiple Leg 2 orientations detected for matchup ${key}.`,
      );
      return { passed: false, logs };
    }

    leg2OrientationMap.set(key, orientationKey(fixture.home_id, fixture.away_id));
  }

  for (const fixture of leg1) {
    const matchupKey = canonicalMatchupKey(fixture.home_id, fixture.away_id);
    const expectedInverse = orientationKey(fixture.away_id, fixture.home_id);
    const actualLeg2 = leg2OrientationMap.get(matchupKey);

    if (actualLeg2 !== expectedInverse) {
      logs.push(
        `Failed: Leg 2 mirror violation for ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }
  }

  logs.push(
    "Passed: Every Leg 1 fixture has the exact inverse Home/Away fixture in Leg 2.",
  );

  logs.push(
    "Confirming: Leg 1 mathematically covers every possible team pairing...",
  );

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const key = canonicalMatchupKey(teams[i], teams[j]);

      if (!leg1Matchups.has(key)) {
        logs.push(
          `Failed: Missing Leg 1 matchup: ${teams[i]} vs ${teams[j]}.`,
        );
        return { passed: false, logs };
      }
    }
  }

  logs.push("Passed: Complete mathematical Leg 1 pairing coverage confirmed.");
  logs.push(
    "Confirming: No team appears twice within any generated matchday...",
  );

  const matchesPerRound = Math.floor(teamCount / 2);
  const totalRounds = teamCount % 2 === 0 ? teamCount - 1 : teamCount;

  for (let r = 0; r < totalRounds; r++) {
    const roundMatchesLeg1 = leg1.slice(r * matchesPerRound, (r + 1) * matchesPerRound);
    const roundTeamsLeg1 = new Set<string>();
    for (const f of roundMatchesLeg1) {
      if (roundTeamsLeg1.has(f.home_id) || roundTeamsLeg1.has(f.away_id)) {
        logs.push(`Failed: Team participation clash in Leg 1, round ${r + 1}.`);
        return { passed: false, logs };
      }
      roundTeamsLeg1.add(f.home_id);
      roundTeamsLeg1.add(f.away_id);
    }

    const roundMatchesLeg2 = leg2.slice(r * matchesPerRound, (r + 1) * matchesPerRound);
    const roundTeamsLeg2 = new Set<string>();
    for (const f of roundMatchesLeg2) {
      if (roundTeamsLeg2.has(f.home_id) || roundTeamsLeg2.has(f.away_id)) {
        logs.push(`Failed: Team participation clash in Leg 2, round ${r + 1}.`);
        return { passed: false, logs };
      }
      roundTeamsLeg2.add(f.home_id);
      roundTeamsLeg2.add(f.away_id);
    }
  }

  const firstLegTeamAppearances = new Map<string, number>();

  for (const fixture of leg1) {
    firstLegTeamAppearances.set(
      fixture.home_id,
      (firstLegTeamAppearances.get(fixture.home_id) ?? 0) + 1,
    );

    firstLegTeamAppearances.set(
      fixture.away_id,
      (firstLegTeamAppearances.get(fixture.away_id) ?? 0) + 1,
    );
  }

  const expectedAppearancesPerTeam = teamCount - 1;

  for (const team of teams) {
    const appearances = firstLegTeamAppearances.get(team) ?? 0;

    if (appearances !== expectedAppearancesPerTeam) {
      logs.push(
        `Failed: Team ${team} appears ${appearances} times in Leg 1; expected ${expectedAppearancesPerTeam}.`,
      );
      return { passed: false, logs };
    }
  }

  logs.push(
    "Passed: Berger Polygon pairing structure preserves matchday participation integrity.",
  );

  logs.push(
    "Confirming: Every fixture references a registered team identifier...",
  );

  const teamSet = new Set(teams);

  for (const fixture of [...leg1, ...leg2]) {
    if (!teamSet.has(fixture.home_id) || !teamSet.has(fixture.away_id)) {
      logs.push(
        `Failed: Fixture contains an unknown team identifier: ${fixture.home_id} vs ${fixture.away_id}.`,
      );
      return { passed: false, logs };
    }
  }

  logs.push(
    "Passed: All fixture team identifiers resolve to supplied league teams.",
  );

  logs.push(
    "Confirming: Every team plays every other team exactly twice across the season...",
  );

  const seasonPairCounts = new Map<string, number>();

  for (const fixture of [...leg1, ...leg2]) {
    const key = canonicalMatchupKey(fixture.home_id, fixture.away_id);
    seasonPairCounts.set(key, (seasonPairCounts.get(key) ?? 0) + 1);
  }

  for (const [key, count] of seasonPairCounts) {
    if (count !== 2) {
      logs.push(
        `Failed: Matchup ${key} occurs ${count} times across the season; expected exactly 2.`,
      );
      return { passed: false, logs };
    }
  }

  if (seasonPairCounts.size !== expectedLegMatches) {
    logs.push(
      `Failed: Season contains ${seasonPairCounts.size} unique team pairings; expected ${expectedLegMatches}.`,
    );
    return { passed: false, logs };
  }

  logs.push(
    "Passed: Every team pairing occurs exactly twice across the complete season.",
  );

  return { passed: true, logs };
}

/* ============================================================================
 * MATCHUP KEYS
 * ========================================================================== */

function canonicalMatchupKey(teamA: string, teamB: string): string {
  return teamA < teamB ? `${teamA}::${teamB}` : `${teamB}::${teamA}`;
}

function orientationKey(home: string, away: string): string {
  return `${home}::${away}`;
}

/* ============================================================================
 * PURE DETERMINISTIC CHRONOLOGICAL RANDOMIZATION
 * ========================================================================== */

function assignChronologicalSequence(
  matchdays: InternalFixture[][],
  seed: number,
): Fixture[] {
  const random = createDeterministicRandom(seed);
  const result: Fixture[] = [];
  let sequence = 1;

  for (const round of matchdays) {
    const roundFixtures = round.map((fixture) => ({
      home_id: fixture.home_id,
      away_id: fixture.away_id,
    }));

    // Deterministically shuffle matches WITHIN the round only (never mixing across rounds)
    for (let i = roundFixtures.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temporary = roundFixtures[i];
      roundFixtures[i] = roundFixtures[j];
      roundFixtures[j] = temporary;
    }

    for (const fixture of roundFixtures) {
      result.push({
        home_id: fixture.home_id,
        away_id: fixture.away_id,
        match_sequence: sequence++,
      });
    }
  }

  return result;
}

/* ============================================================================
 * PURE HASH SEED
 * ========================================================================== */

function createSeed(
  seasonId: string,
  leagueId: string,
  leg: "LEG_1" | "LEG_2",
): number {
  const input = `${seasonId}::${leagueId}::${leg}`;
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/* ============================================================================
 * PURE XORSHIFT32 PRNG
 * ========================================================================== */

function createDeterministicRandom(initialSeed: number): () => number {
  let state = initialSeed >>> 0;

  if (state === 0) {
    state = 0x6d2b79f5;
  }

  return (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}
