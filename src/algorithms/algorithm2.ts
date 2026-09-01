/* ============================================================================
 * ALGORITHM 2 — SMART MATCHDAY + PLAYDAY SCHEDULER (Protocol Wrapper)
 * ============================================================================
 *
 * This file is the protocol boundary for Algorithm 2.
 *
 * It:
 *   1. Accepts an AlgorithmCommandEnvelope<Algorithm2Input> from Agent 0.
 *   2. Validates the envelope using the shared protocol.
 *   3. Extracts fixtures and signal from the payload.
 *   4. Passes them to the existing Algorithm 2 engine.
 *   5. Wraps the native output in an AlgorithmResultEnvelope<Algorithm2Output>.
 *   6. Returns the result envelope to Agent 0.
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
 * ALGORITHM 2 TYPES
 * (Copied verbatim from algorithm 2.txt — no mathematics changed)
 * ========================================================================== */

export type UUID = string;

export type Algorithm2Status = "success" | "failed";

export type ChangeType =
  | "INITIAL_SCHEDULING"
  | "MATCH_CAPACITY_CHANGED"
  | "PLAYDAY_ADDED"
  | "PLAYDAY_REMOVED"
  | "ACTIVE_MATCHDAY_CANCELLED"
  | "MULTIPLE_CHANGES"
  | "NO_CHANGE";

export type RequestedOperation =
  | "MATCHDAY_ONLY"
  | "PLAYDAY_ONLY"
  | "MATCHDAY_AND_PLAYDAY"
  | "NO_CHANGE";

export type MutationOperation = "UPDATE";

export interface FixtureInput {
  fixture_id: UUID;
  league_id: UUID;
  home_id: UUID;
  away_id: UUID;
  leg: 1 | 2;
  match_sequence: number;
  matchday_number: number | null;
  playday: string | null;
  completed: boolean;
  historical: boolean;
  scheduled_time?: string | null;
}

export interface PlaydayInput {
  date: string;
  mode: "ONE_TIME" | "PERMANENT";
  active: boolean;
}

export interface Agent0Signal {
  signal_id: string;
  change_type: ChangeType;
  requested_operation?: RequestedOperation;
  affected_leagues?: UUID[];
  matches_per_matchday?: Record<UUID, number>;
  playdays?: PlaydayInput[];
  cancelled_matchdays?: Array<{
    league_id: UUID;
    matchday_number: number;
  }>;
}

export interface FixtureScheduleMutation {
  fixture_id: UUID;
  league_id: UUID;
  home_id: UUID;
  away_id: UUID;
  leg: 1 | 2;
  match_sequence: number;
  matchday_number: number;
  playday: string;
  operation: MutationOperation;
}

export interface PreservedFixture {
  fixture_id: UUID;
  league_id: UUID;
  reason: "COMPLETED_HISTORY" | "HISTORICAL" | "UNAFFECTED_LEAGUE";
}

export interface ExecutionResult {
  operation: RequestedOperation;
  matchday_engine_run: boolean;
  playday_engine_run: boolean;
  affected_leagues: UUID[];
  cycle_number: 1;
}

export interface DatabaseOutput {
  operation: "UPDATE" | "NO_CHANGE";
  mutations: FixtureScheduleMutation[];
  preserved: PreservedFixture[];
  expected_update_count: number;
}

export interface Algorithm2Output {
  status: Algorithm2Status;
  signal_id: string;
  verification_logs: string[];
  execution: ExecutionResult;
  database: DatabaseOutput;
  final_schedule: Record<
    UUID,
    Array<{
      fixture_id: UUID;
      leg: 1 | 2;
      match_sequence: number;
      matchday_number: number;
      playday: string;
    }>
  >;
}

/* ============================================================================
 * ALGORITHM 2 INPUT — wraps the two parameters into one envelope payload
 * ========================================================================== */

export interface Algorithm2Input {
  fixtures: readonly FixtureInput[];
  signal: Agent0Signal;
}

/* ============================================================================
 * INTERNAL TYPES
 * ========================================================================== */

interface ExecutionDecision {
  operation: RequestedOperation;
  runMatchday: boolean;
  runPlayday: boolean;
  affectedLeagues: Set<UUID>;
}

interface WorkingFixture extends FixtureInput {
  matchday_number: number | null;
  playday: string | null;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const DEFAULT_MATCHES_PER_MATCHDAY = 9;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* ============================================================================
 * PROTOCOL ENTRY POINT (Part 5)
 *
 * OLD signature:  runAlgorithm2(fixtures, signal): Algorithm2Output
 * NEW signature:  runAlgorithm2(command: AlgorithmCommandEnvelope<Algorithm2Input>):
 *                               AlgorithmResultEnvelope<Algorithm2Output>
 * ========================================================================== */

export function runAlgorithm2(
  command: AlgorithmCommandEnvelope<Algorithm2Input>,
): AlgorithmResultEnvelope<Algorithm2Output> {
  // Validate the command envelope first
  validateCommandEnvelope(command, "ALGORITHM_2");

  // Extract the payload — fixtures and signal are bundled as Algorithm2Input
  const input = command.payload;

  // Run the EXISTING Algorithm 2 mathematical engine (unchanged)
  const nativeOutput = runAlgorithm2Engine(input.fixtures, input.signal);

  // Wrap the native output in the result envelope
  return createAlgorithmResult({
    execution_id: command.execution_id,
    season_id: command.season_id,
    algorithm: "ALGORITHM_2",
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
      operation: "UPDATE",
      expected_count: nativeOutput.database.expected_update_count,
    },
  });
}

/* ============================================================================
 * EXISTING ALGORITHM 2 MATHEMATICAL ENGINE
 * ============================================================================
 *
 * Everything below this line is THE ORIGINAL Algorithm 2 mathematics.
 *
 * NOTHING BELOW IS MODIFIED.
 *
 * The engine is now called `runAlgorithm2Engine` (was `runAlgorithm2`)
 * to avoid name collision with the protocol entry point above.
 *
 * PURPOSE:
 * Receives Algorithm 1 fixtures plus an Agent 0 signal.
 * Algorithm 2:
 *   1. Determines which scheduling subsystem must run.
 *   2. Runs the required subsystem(s) exactly once.
 *   3. Never touches completed/historical fixtures.
 *   4. Never regenerates fixture identities or pairings.
 *   5. Re-groups only future/unplayed fixtures when match capacity changes.
 *   6. Reassigns dates only when playable days change.
 *   7. Produces database-ready mutations for Agent 0.
 *   8. Stops after one execution cycle.
 *
 * NO DATABASE CONNECTION.
 * NO SQL.
 * NO RETRIES.
 * NO RECURSION.
 * NO WEBHOOKS.
 * ========================================================================== */

function runAlgorithm2Engine(
  fixtures: readonly FixtureInput[],
  signal: Agent0Signal,
): Algorithm2Output {
  const verification_logs: string[] = [];

  verification_logs.push(
    "Confirming: Algorithm 2 received Agent 0 signal...",
  );

  const validation = validateInput(fixtures, signal);

  if (!validation.success) {
    verification_logs.push(`Failed: ${validation.error}`);

    return failedOutput(signal.signal_id, verification_logs);
  }

  verification_logs.push(
    "Passed: Input structure, UUIDs, dates and fixture identities are valid.",
  );

  const decision = determineExecution(fixtures, signal, verification_logs);

  if (!decision) {
    return failedOutput(signal.signal_id, verification_logs);
  }

  verification_logs.push(
    `Confirmed: Execution operation = ${decision.operation}.`,
  );

  verification_logs.push(
    `Confirmed: Affected leagues = ${JSON.stringify(Array.from(decision.affectedLeagues))}.`,
  );

  /*
   * PRESERVE HISTORY FIRST
   */

  const preserved: PreservedFixture[] = [];

  for (const fixture of fixtures) {
    if (fixture.historical || fixture.completed) {
      preserved.push({
        fixture_id: fixture.fixture_id,
        league_id: fixture.league_id,
        reason: fixture.historical ? "HISTORICAL" : "COMPLETED_HISTORY",
      });
    }
  }

  verification_logs.push(
    `Passed: ${preserved.length} completed/historical fixtures locked.`,
  );

  /*
   * WORKING COPY
   */

  let working: WorkingFixture[] = fixtures.map((fixture) => ({
    ...fixture,
    matchday_number: fixture.matchday_number,
    playday: fixture.playday,
  }));

  /*
   * MATCHDAY ENGINE
   */

  if (decision.runMatchday) {
    verification_logs.push("Starting Matchday Engine exactly once...");

    const matchdayResult = runMatchdayEngine(
      working,
      signal,
      decision.affectedLeagues,
      verification_logs,
    );

    if (!matchdayResult.success) {
      verification_logs.push(`Failed: ${matchdayResult.error}`);
      return failedOutput(signal.signal_id, verification_logs);
    }

    working = matchdayResult.fixtures;

    verification_logs.push(
      "Passed: Matchday Engine completed its single execution.",
    );
  } else {
    verification_logs.push("Skipped: Matchday Engine not required.");
  }

  /*
   * PLAYDAY ENGINE
   */

  if (decision.runPlayday) {
    verification_logs.push("Starting Playday Engine exactly once...");

    const playdayResult = runPlaydayEngine(
      working,
      signal,
      decision.affectedLeagues,
      verification_logs,
    );

    if (!playdayResult.success) {
      verification_logs.push(`Failed: ${playdayResult.error}`);
      return failedOutput(signal.signal_id, verification_logs);
    }

    working = playdayResult.fixtures;

    verification_logs.push(
      "Passed: Playday Engine completed its single execution.",
    );
  } else {
    verification_logs.push("Skipped: Playday Engine not required.");
  }

  /*
   * FINAL INTEGRITY VERIFICATION
   */

  const integrity = verifyFinalSchedule(
    fixtures,
    working,
    decision,
    signal,
    verification_logs,
  );

  if (!integrity.success) {
    verification_logs.push(`Failed: ${integrity.error}`);
    return failedOutput(signal.signal_id, verification_logs);
  }

  /*
   * DATABASE-READY MUTATIONS
   */

  const mutations = buildMutations(
    fixtures,
    working,
    decision.affectedLeagues,
  );

  const database: DatabaseOutput = {
    operation: mutations.length > 0 ? "UPDATE" : "NO_CHANGE",
    mutations,
    preserved,
    expected_update_count: mutations.length,
  };

  verification_logs.push(
    `Passed: ${mutations.length} database-ready mutations prepared.`,
  );

  verification_logs.push(
    "Passed: Historical and completed fixtures remain untouched.",
  );

  verification_logs.push(
    "Passed: Fixture identities and pairings remain unchanged.",
  );

  verification_logs.push(
    "SUCCESS: Algorithm 2 completed one scheduling cycle.",
  );

  verification_logs.push(
    "STOP: Output handed to Agent 0. No second execution cycle will occur.",
  );

  return {
    status: "success",
    signal_id: signal.signal_id,
    verification_logs,
    execution: {
      operation: decision.operation,
      matchday_engine_run: decision.runMatchday,
      playday_engine_run: decision.runPlayday,
      affected_leagues: Array.from(decision.affectedLeagues),
      cycle_number: 1,
    },
    database,
    final_schedule: buildFinalSchedule(working),
  };
}

/* ============================================================================
 * INPUT VALIDATION
 * ========================================================================== */

function validateInput(
  fixtures: readonly FixtureInput[],
  signal: Agent0Signal,
): { success: true } | { success: false; error: string } {
  if (!Array.isArray(fixtures)) {
    return { success: false, error: "Fixtures must be an array." };
  }

  if (!signal || typeof signal !== "object") {
    return { success: false, error: "Agent 0 signal is missing." };
  }

  if (
    typeof signal.signal_id !== "string" ||
    signal.signal_id.trim() === ""
  ) {
    return { success: false, error: "Agent 0 signal_id is required." };
  }

  const fixtureIds = new Set<string>();

  for (const fixture of fixtures) {
    if (!UUID_PATTERN.test(fixture.fixture_id)) {
      return { success: false, error: `Invalid fixture UUID: ${fixture.fixture_id}` };
    }

    if (!UUID_PATTERN.test(fixture.league_id)) {
      return { success: false, error: `Invalid league UUID: ${fixture.league_id}` };
    }

    if (!UUID_PATTERN.test(fixture.home_id)) {
      return { success: false, error: `Invalid home-team UUID: ${fixture.home_id}` };
    }

    if (!UUID_PATTERN.test(fixture.away_id)) {
      return { success: false, error: `Invalid away-team UUID: ${fixture.away_id}` };
    }

    if (fixture.home_id === fixture.away_id) {
      return { success: false, error: `Self-play fixture detected: ${fixture.fixture_id}` };
    }

    if (fixtureIds.has(fixture.fixture_id)) {
      return { success: false, error: `Duplicate fixture UUID detected: ${fixture.fixture_id}` };
    }

    fixtureIds.add(fixture.fixture_id);

    if (fixture.leg !== 1 && fixture.leg !== 2) {
      return { success: false, error: `Invalid leg for fixture ${fixture.fixture_id}.` };
    }

    if (!Number.isInteger(fixture.match_sequence) || fixture.match_sequence < 1) {
      return { success: false, error: `Invalid match_sequence for ${fixture.fixture_id}.` };
    }

    if (
      fixture.playday !== null &&
      fixture.playday !== undefined &&
      !ISO_DATE_PATTERN.test(fixture.playday)
    ) {
      return { success: false, error: `Invalid playday date for ${fixture.fixture_id}.` };
    }
  }

  if (signal.matches_per_matchday !== undefined) {
    for (const [leagueId, capacity] of Object.entries(signal.matches_per_matchday)) {
      if (!UUID_PATTERN.test(leagueId)) {
        return { success: false, error: `Invalid league UUID in matches_per_matchday: ${leagueId}` };
      }

      if (!Number.isInteger(capacity) || capacity < 1) {
        return { success: false, error: `Invalid match capacity for league ${leagueId}.` };
      }
    }
  }

  if (signal.affected_leagues) {
    const seen = new Set<string>();
    for (const leagueId of signal.affected_leagues) {
      if (!UUID_PATTERN.test(leagueId)) {
        return { success: false, error: `Invalid affected league UUID: ${leagueId}` };
      }
      if (seen.has(leagueId)) {
        return { success: false, error: `Duplicate affected league: ${leagueId}` };
      }
      seen.add(leagueId);
    }
  }

  if (signal.playdays) {
    const seenDates = new Set<string>();
    for (const playday of signal.playdays) {
      if (!ISO_DATE_PATTERN.test(playday.date)) {
        return { success: false, error: `Invalid playday date: ${playday.date}` };
      }
      if (seenDates.has(playday.date)) {
        return { success: false, error: `Duplicate playday ${playday.date}.` };
      }
      seenDates.add(playday.date);
      if (playday.mode !== "ONE_TIME" && playday.mode !== "PERMANENT") {
        return { success: false, error: `Invalid playday mode for ${playday.date}.` };
      }
    }
  }

  return { success: true };
}

/* ============================================================================
 * SMART INTERFACE
 * ========================================================================== */

function determineExecution(
  fixtures: readonly FixtureInput[],
  signal: Agent0Signal,
  logs: string[],
): ExecutionDecision | null {
  const affectedLeagues = new Set<UUID>(signal.affected_leagues ?? []);

  if (signal.change_type === "MATCH_CAPACITY_CHANGED") {
    if (
      signal.matches_per_matchday &&
      Object.keys(signal.matches_per_matchday).length > 0
    ) {
      for (const leagueId of Object.keys(signal.matches_per_matchday)) {
        affectedLeagues.add(leagueId);
      }
    }

    if (affectedLeagues.size === 0) {
      for (const fixture of fixtures) {
        affectedLeagues.add(fixture.league_id);
      }
      logs.push(
        "Corrective routing: MATCH_CAPACITY_CHANGED had no explicit affected_leagues; all supplied leagues were inferred safely.",
      );
    }

    return { operation: "MATCHDAY_AND_PLAYDAY", runMatchday: true, runPlayday: true, affectedLeagues };
  }

  if (
    signal.change_type === "PLAYDAY_ADDED" ||
    signal.change_type === "PLAYDAY_REMOVED"
  ) {
    if (affectedLeagues.size === 0) {
      for (const fixture of fixtures) {
        affectedLeagues.add(fixture.league_id);
      }
    }
    return { operation: "PLAYDAY_ONLY", runMatchday: false, runPlayday: true, affectedLeagues };
  }

  if (signal.change_type === "ACTIVE_MATCHDAY_CANCELLED") {
    if (affectedLeagues.size === 0) {
      for (const cancelled of signal.cancelled_matchdays ?? []) {
        affectedLeagues.add(cancelled.league_id);
      }
    }
    if (affectedLeagues.size === 0) {
      for (const fixture of fixtures) {
        affectedLeagues.add(fixture.league_id);
      }
    }
    return { operation: "MATCHDAY_AND_PLAYDAY", runMatchday: true, runPlayday: true, affectedLeagues };
  }

  if (signal.change_type === "INITIAL_SCHEDULING") {
    if (affectedLeagues.size === 0) {
      for (const fixture of fixtures) {
        affectedLeagues.add(fixture.league_id);
      }
    }
    return { operation: "MATCHDAY_AND_PLAYDAY", runMatchday: true, runPlayday: true, affectedLeagues };
  }

  if (signal.change_type === "MULTIPLE_CHANGES") {
    const requested = signal.requested_operation;

    if (requested === "MATCHDAY_ONLY") {
      if (affectedLeagues.size === 0) {
        inferAllLeagues(fixtures, affectedLeagues);
      }
      return { operation: "MATCHDAY_ONLY", runMatchday: true, runPlayday: false, affectedLeagues };
    }

    if (requested === "PLAYDAY_ONLY") {
      if (affectedLeagues.size === 0) {
        inferAllLeagues(fixtures, affectedLeagues);
      }
      return { operation: "PLAYDAY_ONLY", runMatchday: false, runPlayday: true, affectedLeagues };
    }

    if (affectedLeagues.size === 0) {
      inferAllLeagues(fixtures, affectedLeagues);
    }
    return { operation: "MATCHDAY_AND_PLAYDAY", runMatchday: true, runPlayday: true, affectedLeagues };
  }

  if (signal.change_type === "NO_CHANGE") {
    return { operation: "NO_CHANGE", runMatchday: false, runPlayday: false, affectedLeagues };
  }

  logs.push(`Failed: Unsupported change type ${signal.change_type}.`);
  return null;
}

function inferAllLeagues(
  fixtures: readonly FixtureInput[],
  target: Set<UUID>,
): void {
  for (const fixture of fixtures) {
    target.add(fixture.league_id);
  }
}

/* ============================================================================
 * MATCHDAY ENGINE
 * ========================================================================== */

function runMatchdayEngine(
  fixtures: WorkingFixture[],
  signal: Agent0Signal,
  affectedLeagues: Set<UUID>,
  logs: string[],
):
  | { success: true; fixtures: WorkingFixture[] }
  | { success: false; error: string } {
  const result = fixtures.map((fixture) => ({ ...fixture }));
  const capacities = signal.matches_per_matchday ?? {};

  if (signal.cancelled_matchdays && signal.cancelled_matchdays.length > 0) {
    const cancelled = new Set(
      signal.cancelled_matchdays.map(
        (item) => `${item.league_id}:${item.matchday_number}`,
      ),
    );

    for (const fixture of result) {
      if (fixture.completed || fixture.historical) continue;
      const key = `${fixture.league_id}:${fixture.matchday_number}`;
      if (cancelled.has(key)) {
        fixture.matchday_number = null;
        fixture.playday = null;
      }
    }

    logs.push(
      "Passed: Cancelled matchday unplayed fixtures returned to future pool.",
    );
  }

  for (const leagueId of affectedLeagues) {
    const leagueFixtures = result.filter((f) => f.league_id === leagueId);
    if (leagueFixtures.length === 0) continue;

    const capacity =
      capacities[leagueId] ??
      inferExistingCapacity(leagueFixtures) ??
      DEFAULT_MATCHES_PER_MATCHDAY;

    if (!Number.isInteger(capacity) || capacity < 1) {
      return { success: false, error: `Invalid matchday capacity for league ${leagueId}.` };
    }

    const future = leagueFixtures.filter((f) => !f.completed && !f.historical);

    if (future.length === 0) {
      logs.push(
        `Skipped league ${leagueId}: no future fixtures require matchday redistribution.`,
      );
      continue;
    }

    future.sort(compareFixtureOrder);

    const firstFutureMatchday = findFirstFutureMatchday(leagueFixtures);
    let matchday = firstFutureMatchday;
    let matchdayCount = 0;
    const teamsInCurrentMatchday = new Set<string>();

    for (let index = 0; index < future.length; index++) {
      const fixture = future[index];
      const teamClash =
        teamsInCurrentMatchday.has(fixture.home_id) ||
        teamsInCurrentMatchday.has(fixture.away_id);

      if ((matchdayCount >= capacity || teamClash) && matchdayCount > 0) {
        matchday += 1;
        matchdayCount = 0;
        teamsInCurrentMatchday.clear();
      }

      fixture.matchday_number = matchday;
      matchdayCount += 1;
      teamsInCurrentMatchday.add(fixture.home_id);
      teamsInCurrentMatchday.add(fixture.away_id);
    }

    logs.push(
      `Passed: League ${leagueId} redistributed ${future.length} future fixtures at capacity ${capacity}.`,
    );
  }

  return { success: true, fixtures: result };
}

/* ============================================================================
 * PLAYDAY ENGINE
 * ========================================================================== */

function runPlaydayEngine(
  fixtures: WorkingFixture[],
  signal: Agent0Signal,
  affectedLeagues: Set<UUID>,
  logs: string[],
):
  | { success: true; fixtures: WorkingFixture[] }
  | { success: false; error: string } {
  if (!signal.playdays || signal.playdays.length === 0) {
    return {
      success: false,
      error: "Playday Engine requires at least one playable date.",
    };
  }

  const activePlaydays = signal.playdays
    .filter((playday) => playday.active)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (activePlaydays.length === 0) {
    return {
      success: false,
      error: "No active playable dates are available.",
    };
  }

  const dates = new Set<string>();
  for (const playday of activePlaydays) {
    if (dates.has(playday.date)) {
      return { success: false, error: `Duplicate active playday: ${playday.date}` };
    }
    dates.add(playday.date);
  }

  for (const leagueId of affectedLeagues) {
    const leagueFixtures = fixtures.filter((f) => f.league_id === leagueId);

    const future = leagueFixtures.filter(
      (f) => !f.completed && !f.historical && f.matchday_number !== null,
    );

    const groups = groupByMatchday(future);
    const matchdays = Array.from(groups.keys()).sort((a, b) => a - b);

    matchdays.forEach((matchdayNumber, index) => {
      const playday = resolvePlaydayForIndex(activePlaydays, index);
      if (!playday) return;
      const group = groups.get(matchdayNumber)!;
      for (const fixture of group) {
        fixture.playday = playday.date;
      }
    });

    logs.push(
      `Passed: League ${leagueId} future matchdays mapped chronologically to the supplied playday calendar.`,
    );
  }

  return { success: true, fixtures };
}

/* ============================================================================
 * PLAYDAY RESOLUTION
 * ========================================================================== */

function addDaysToIso(isoDate: string, daysToAdd: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolvePlaydayForIndex(
  playdays: PlaydayInput[],
  index: number,
): PlaydayInput | null {
  if (index < playdays.length) {
    return playdays[index];
  }

  const permanent = playdays.filter((day) => day.mode === "PERMANENT");

  if (permanent.length === 0) return null;

  const baseCount = permanent.length;
  const weekOffset = Math.floor(index / baseCount);
  const dayIndex = index % baseCount;
  const baseDay = permanent[dayIndex];

  const calculatedDate = addDaysToIso(baseDay.date, weekOffset * 7);

  return {
    date: calculatedDate,
    mode: "PERMANENT",
    active: true,
  };
}

/* ============================================================================
 * FINAL INTEGRITY CHECK
 * ========================================================================== */

function verifyFinalSchedule(
  original: readonly FixtureInput[],
  working: readonly WorkingFixture[],
  decision: ExecutionDecision,
  signal: Agent0Signal,
  logs: string[],
): { success: true } | { success: false; error: string } {
  if (original.length !== working.length) {
    return { success: false, error: "Fixture conservation failed: fixture count changed." };
  }

  const originalIds = new Set(original.map((f) => f.fixture_id));
  const workingIds = new Set(working.map((f) => f.fixture_id));

  if (originalIds.size !== workingIds.size) {
    return { success: false, error: "Fixture identity conservation failed." };
  }

  for (const id of originalIds) {
    if (!workingIds.has(id)) {
      return { success: false, error: `Fixture ${id} disappeared during recalibration.` };
    }
  }

  for (const originalFixture of original) {
    if (!originalFixture.completed && !originalFixture.historical) continue;

    const updated = working.find((f) => f.fixture_id === originalFixture.fixture_id);

    if (!updated) {
      return { success: false, error: `Protected fixture ${originalFixture.fixture_id} disappeared.` };
    }

    if (
      updated.matchday_number !== originalFixture.matchday_number ||
      updated.playday !== originalFixture.playday
    ) {
      return {
        success: false,
        error: `Historical/completed fixture ${originalFixture.fixture_id} was modified.`,
      };
    }
  }

  for (const originalFixture of original) {
    if (originalFixture.completed || originalFixture.historical) continue;
    if (decision.affectedLeagues.has(originalFixture.league_id)) continue;

    const updated = working.find((f) => f.fixture_id === originalFixture.fixture_id);

    if (!updated) {
      return { success: false, error: `Unaffected fixture ${originalFixture.fixture_id} disappeared.` };
    }

    if (
      updated.matchday_number !== originalFixture.matchday_number ||
      updated.playday !== originalFixture.playday
    ) {
      return {
        success: false,
        error: `Unaffected league fixture ${originalFixture.fixture_id} was modified.`,
      };
    }
  }

  if (decision.runMatchday) {
    const capacities = signal.matches_per_matchday ?? {};
    const grouped = new Map<string, number>();

    for (const fixture of working) {
      if (fixture.completed || fixture.historical || fixture.matchday_number === null) continue;
      const key = `${fixture.league_id}:${fixture.matchday_number}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    for (const [key, count] of grouped) {
      const separator = key.lastIndexOf(":");
      const leagueId = key.slice(0, separator);
      const capacity = capacities[leagueId] ?? DEFAULT_MATCHES_PER_MATCHDAY;

      if (count > capacity) {
        return {
          success: false,
          error: `Matchday capacity exceeded for ${key}: ${count}/${capacity}.`,
        };
      }
    }
  }

  const matchdayDates = new Map<string, Set<string>>();

  for (const fixture of working) {
    if (fixture.completed || fixture.historical || fixture.matchday_number === null) continue;
    if (!fixture.playday) continue;

    const key = `${fixture.league_id}:${fixture.matchday_number}`;
    if (!matchdayDates.has(key)) {
      matchdayDates.set(key, new Set());
    }
    matchdayDates.get(key)!.add(fixture.playday);
  }

  for (const [key, datess] of matchdayDates) {
    if (datess.size > 1) {
      return { success: false, error: `Matchday ${key} spans multiple playdays.` };
    }
  }

  for (const fixture of working) {
    if (fixture.home_id === fixture.away_id) {
      return {
        success: false,
        error: `Self-play detected after recalibration: ${fixture.fixture_id}`,
      };
    }
  }

  // Ensure no team is scheduled more than once on the same date within a league
  const teamDateOccupancy = new Map<string, Set<string>>();
  for (const fixture of working) {
    if (fixture.completed || fixture.historical) continue;
    if (fixture.matchday_number === null || !fixture.playday) continue;

    const dateKey = `${fixture.league_id}:${fixture.playday}`;
    if (!teamDateOccupancy.has(dateKey)) {
      teamDateOccupancy.set(dateKey, new Set());
    }
    const dayTeams = teamDateOccupancy.get(dateKey)!;
    if (dayTeams.has(fixture.home_id) || dayTeams.has(fixture.away_id)) {
      return {
        success: false,
        error: `Team double-booking detected on playday ${fixture.playday} for fixture ${fixture.fixture_id}`,
      };
    }
    dayTeams.add(fixture.home_id);
    dayTeams.add(fixture.away_id);
  }

  // Verify chronological monotonicity across matchdays
  const matchdayToDate = new Map<string, string>();
  for (const fixture of working) {
    if (fixture.matchday_number === null || !fixture.playday) continue;
    const mdKey = `${fixture.league_id}:${fixture.matchday_number}`;
    matchdayToDate.set(mdKey, fixture.playday);
  }
  for (const leagueId of decision.affectedLeagues) {
    const leagueMatchdays = Array.from(matchdayToDate.keys())
      .filter((k) => k.startsWith(`${leagueId}:`))
      .map((k) => parseInt(k.split(":")[1], 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < leagueMatchdays.length; i++) {
      const prevMd = leagueMatchdays[i - 1];
      const currMd = leagueMatchdays[i];
      const prevDate = matchdayToDate.get(`${leagueId}:${prevMd}`)!;
      const currDate = matchdayToDate.get(`${leagueId}:${currMd}`)!;
      if (currDate < prevDate) {
        return {
          success: false,
          error: `Chronological monotonicity violation in league ${leagueId}: Matchday ${currMd} (${currDate}) is earlier than Matchday ${prevMd} (${prevDate}).`,
        };
      }
    }
  }

  logs.push("Passed: Fixture conservation verified.");
  logs.push("Passed: Historical protection verified.");
  logs.push("Passed: League isolation verified.");
  logs.push("Passed: Matchday capacity integrity verified.");
  logs.push("Passed: Playday/date integrity verified.");
  logs.push("Passed: No self-play violations detected.");

  return { success: true };
}

/* ============================================================================
 * MUTATION BUILDER
 * ========================================================================== */

function buildMutations(
  original: readonly FixtureInput[],
  working: readonly WorkingFixture[],
  affectedLeagues: Set<UUID>,
): FixtureScheduleMutation[] {
  const mutations: FixtureScheduleMutation[] = [];

  for (const updated of working) {
    if (updated.completed || updated.historical) continue;
    if (!affectedLeagues.has(updated.league_id)) continue;

    const originalFixture = original.find(
      (f) => f.fixture_id === updated.fixture_id,
    );

    if (!originalFixture) continue;

    const matchdayChanged = originalFixture.matchday_number !== updated.matchday_number;
    const playdayChanged = originalFixture.playday !== updated.playday;

    if (!matchdayChanged && !playdayChanged) continue;
    if (updated.matchday_number === null || updated.playday === null) continue;

    mutations.push({
      fixture_id: updated.fixture_id,
      league_id: updated.league_id,
      home_id: updated.home_id,
      away_id: updated.away_id,
      leg: updated.leg,
      match_sequence: updated.match_sequence,
      matchday_number: updated.matchday_number,
      playday: updated.playday,
      operation: "UPDATE",
    });
  }

  mutations.sort((a, b) => {
    if (a.league_id !== b.league_id) {
      return a.league_id.localeCompare(b.league_id);
    }
    if (a.matchday_number !== b.matchday_number) {
      return a.matchday_number - b.matchday_number;
    }
    return a.match_sequence - b.match_sequence;
  });

  return mutations;
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function compareFixtureOrder(a: FixtureInput, b: FixtureInput): number {
  if (a.leg !== b.leg) return a.leg - b.leg;
  if (a.match_sequence !== b.match_sequence) return a.match_sequence - b.match_sequence;
  return a.fixture_id.localeCompare(b.fixture_id);
}

function inferExistingCapacity(fixtures: readonly FixtureInput[]): number | null {
  const counts = new Map<number, number>();

  for (const fixture of fixtures) {
    if (fixture.completed || fixture.historical || fixture.matchday_number === null) continue;
    const count = counts.get(fixture.matchday_number) ?? 0;
    counts.set(fixture.matchday_number, count + 1);
  }

  if (counts.size === 0) return null;
  return Math.max(...Array.from(counts.values()));
}

function findFirstFutureMatchday(fixtures: readonly FixtureInput[]): number {
  let highestProtected = 0;

  for (const fixture of fixtures) {
    if (fixture.completed || fixture.historical) {
      if (fixture.matchday_number !== null) {
        highestProtected = Math.max(highestProtected, fixture.matchday_number);
      }
    }
  }

  return highestProtected + 1;
}

function groupByMatchday(
  fixtures: readonly WorkingFixture[],
): Map<number, WorkingFixture[]> {
  const groups = new Map<number, WorkingFixture[]>();

  for (const fixture of fixtures) {
    if (fixture.matchday_number === null) continue;
    if (!groups.has(fixture.matchday_number)) {
      groups.set(fixture.matchday_number, []);
    }
    groups.get(fixture.matchday_number)!.push(fixture);
  }

  return groups;
}

function buildFinalSchedule(
  fixtures: readonly WorkingFixture[],
): Record<
  UUID,
  Array<{
    fixture_id: UUID;
    leg: 1 | 2;
    match_sequence: number;
    matchday_number: number;
    playday: string;
  }>
> {
  const output: Record<
    UUID,
    Array<{
      fixture_id: UUID;
      leg: 1 | 2;
      match_sequence: number;
      matchday_number: number;
      playday: string;
    }>
  > = {};

  for (const fixture of fixtures) {
    if (fixture.matchday_number === null || fixture.playday === null) continue;
    if (!output[fixture.league_id]) {
      output[fixture.league_id] = [];
    }
    output[fixture.league_id].push({
      fixture_id: fixture.fixture_id,
      leg: fixture.leg,
      match_sequence: fixture.match_sequence,
      matchday_number: fixture.matchday_number,
      playday: fixture.playday,
    });
  }

  for (const leagueId of Object.keys(output)) {
    output[leagueId].sort((a, b) => {
      if (a.matchday_number !== b.matchday_number) {
        return a.matchday_number - b.matchday_number;
      }
      return a.match_sequence - b.match_sequence;
    });
  }

  return output;
}

function failedOutput(signalId: string, logs: string[]): Algorithm2Output {
  return {
    status: "failed",
    signal_id: signalId,
    verification_logs: logs,
    execution: {
      operation: "NO_CHANGE",
      matchday_engine_run: false,
      playday_engine_run: false,
      affected_leagues: [],
      cycle_number: 1,
    },
    database: {
      operation: "NO_CHANGE",
      mutations: [],
      preserved: [],
      expected_update_count: 0,
    },
    final_schedule: {},
  };
}
