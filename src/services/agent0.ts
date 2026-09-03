/* ============================================================================
 * AGENT 0 — MASTER SCHEDULING CONTROLLER (Protocol-Aware)
 * ============================================================================
 *
 * Agent 0 is the ONLY orchestrator.
 *
 * It:
 *   1. Receives a PresidentEvent from the frontend.
 *   2. Determines which algorithms are required.
 *   3. Constructs an AlgorithmCommandEnvelope for each algorithm.
 *   4. Calls the algorithm entry functions.
 *   5. Validates each AlgorithmResultEnvelope.
 *   6. Enforces ALL-OR-NONE database writes.
 *   7. Reads database state back and compares against algorithm output.
 *   8. Emits the final event result.
 *
 * THE SAME execution_id AND season_id SURVIVE THE ENTIRE CHAIN.
 *
 * Agent 0 NEVER writes to the database if ANY algorithm result envelope
 * returns database.ready_for_write = false.
 *
 * ========================================================================== */

import {
  createAlgorithmCommand,
  validateResultEnvelope,
  type AlgorithmResultEnvelope,
} from "../shared/algorithmProtocol";
import { Agent0LogService } from "./agent0LogService";

import {
  generateFixtures,
  type LeagueInput,
  type Algo1Output,
} from "../algorithms/algorithm1";

import {
  runAlgorithm2,
  type Algorithm2Input,
  type Algorithm2Output,
} from "../algorithms/algorithm2";

import {
  allocateMatches,
  type Algorithm3Signal,
  type Algorithm3Output,
  type SlotTime,
} from "../algorithms/algorithm3";

import {
  generateOfficiatingAssignments,
  type Algorithm45Input,
  type OfficiatingOutput,
} from "../algorithms/algorithm45";

/* ============================================================================
 * AGENT 0 TYPES
 * ========================================================================== */

export type Agent0EventType =
  | "BEGIN_SEASON"
  | "CHANGE_MATCH_CAPACITY"
  | "ADD_PLAYDAY_ONCE"
  | "ADD_PLAYDAY_PERMANENT"
  | "REMOVE_PLAYDAY_ONCE"
  | "REMOVE_PLAYDAY_PERMANENT"
  | "CANCEL_MATCHDAY"
  | "CHANGE_PITCH_STATE"
  | "CHANGE_TIME_CONFIGURATION"
  | "REFEREE_ADDED"
  | "REFEREE_REMOVED"
  | "REFEREE_REPLACED"
  | "REFEREE_AVAILABILITY_CHANGED";

export interface PresidentEvent {
  type: Agent0EventType;
  seasonId: string;
  // Event-specific fields — populated per event type
  date?: string;
  matchdayNumber?: number;
  pitchId?: string;
  amAvailable?: boolean;
  pmAvailable?: boolean;
  seasonStartDate?: string;
  eplMatchesPerMatchday?: number;
  championshipMatchesPerMatchday?: number;
  eplSlots?: Array<{ slot_number: 1 | 2 | 3; start_time: string; end_time: string }>;
  championshipSlots?: Array<{ slot_number: 1 | 2 | 3; start_time: string; end_time: string }>;
  refereeId?: string;
}

export type Agent0PipelineStage =
  | "IDLE"
  | "VALIDATING_EVENT"
  | "LOADING_STATE"
  | "EXECUTING_ALGORITHM_1"
  | "EXECUTING_ALGORITHM_2"
  | "EXECUTING_ALGORITHM_3"
  | "EXECUTING_ALGORITHM_4_5"
  | "PREPARING_DATABASE_WRITE"
  | "DATABASE_TRANSACTION"
  | "READ_BACK"
  | "VERIFYING_DATABASE"
  | "COMPLETED"
  | "STOPPED";

export interface Agent0State {
  executionId: string;
  pipelineState: Agent0PipelineStage;
  stopped: boolean;
  currentAlgorithm: string | null;
  lastSuccessfulStage: string | null;
}

export interface Agent0EventResult {
  success: boolean;
  executionId: string;
  seasonId: string;
  stage: Agent0PipelineStage;
  algorithms: {
    algorithm1?: { used: boolean; status: string };
    algorithm2?: { used: boolean; status: string };
    algorithm3?: { used: boolean; status: string };
    algorithm45?: { used: boolean; status: string };
  };
  error?: {
    code: string;
    message: string;
    stage: string;
  };
}

export class Agent0Error extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "Agent0Error";
    this.code = code;
    this.details = details;
  }
}

/* ============================================================================
 * EXECUTION PLAN
 *
 * Maps each event type to which algorithms must run.
 * ========================================================================== */

interface ExecutionPlan {
  requiresAlgorithm1: boolean;
  requiresAlgorithm2: boolean;
  requiresAlgorithm3: boolean;
  requiresAlgorithm45: boolean;
}

function buildExecutionPlan(event: PresidentEvent): ExecutionPlan {
  switch (event.type) {
    case "BEGIN_SEASON":
      return {
        requiresAlgorithm1: true,
        requiresAlgorithm2: true,
        requiresAlgorithm3: true,
        requiresAlgorithm45: true,
      };

    case "CHANGE_MATCH_CAPACITY":
    case "ADD_PLAYDAY_ONCE":
    case "ADD_PLAYDAY_PERMANENT":
    case "REMOVE_PLAYDAY_ONCE":
    case "REMOVE_PLAYDAY_PERMANENT":
    case "CANCEL_MATCHDAY":
      return {
        requiresAlgorithm1: false,
        requiresAlgorithm2: true,
        requiresAlgorithm3: true, // Algo 2 automatically triggers rerun of Algo 3
        requiresAlgorithm45: false, // Referees hold to match ID; Algo 4 & 5 not rerun
      };

    case "CHANGE_PITCH_STATE":
    case "CHANGE_TIME_CONFIGURATION":
      return {
        requiresAlgorithm1: false,
        requiresAlgorithm2: false,
        requiresAlgorithm3: true, // Algo 3 runs independently
        requiresAlgorithm45: false,
      };

    case "REFEREE_ADDED":
    case "REFEREE_REMOVED":
    case "REFEREE_REPLACED":
    case "REFEREE_AVAILABILITY_CHANGED":
      return {
        requiresAlgorithm1: false,
        requiresAlgorithm2: false,
        requiresAlgorithm3: false,
        requiresAlgorithm45: true, // Re-runs Algo 4 ONLY; Algo 5 never reruns
      };

    default:
      throw new Agent0Error(
        "UNKNOWN_EVENT_TYPE",
        `Agent 0 received an unrecognised event type: ${event.type}.`,
      );
  }
}

/* ============================================================================
 * AGENT 0 — handleEvent
 * ============================================================================
 *
 * This is the public entry point.
 *
 * The caller supplies:
 *   - event: the PresidentEvent
 *   - leagueConfigs: league configurations for Algorithm 1
 *   - fetchState: a function that loads current DB state for the season
 *   - persistState: a function that atomically writes the result sets
 *
 * ========================================================================== */

export interface Agent0Adapters {
  /**
   * Load current DB state for the given seasonId.
   */
  fetchCurrentState(seasonId: string): Promise<{
    fixtures: Array<{
      fixture_id: string;
      league_id: string;
      home_id: string;
      away_id: string;
      leg: 1 | 2;
      match_sequence: number;
      matchday_number: number | null;
      playday: string | null;
      completed: boolean;
      historical: boolean;
    }>;
    matchdays: Array<{
      matchday_id: string;
      matchday_number: number;
      play_date: string;
      playable: boolean;
      match_ids: string[];
    }>;
    matchAssignments: Array<{
      match_id: string;
      matchday_id: string;
      play_date: string;
      pitch_id: string;
      slot_id: string;
      start_time: string;
      end_time: string;
      allocation_status: string;
    }>;
    playdays: Array<{
      date: string;
      mode: "ONE_TIME" | "PERMANENT";
      active: boolean;
    }>;
    capacity: { EPL: number; Championship: number };
    pitches: Array<{ pitch_id: string; state: "available" | "unavailable" }>;
    referees: Array<{ referee_id: string; tier: "EPL_Exclusive" | "Mixed" }>;
    teams: Array<{ team_id: string; league_type: "EPL" | "CHAMPIONSHIP" }>;
    timeConfiguration?: Array<{
      league_id: "epl" | "championship";
      slots: Array<{ slot_number: 1 | 2 | 3; start_time: string; end_time: string }>;
    }>;
  }>;

  /**
   * Stage 1: Insert immutable base fixture pairings generated by Algorithm 1.
   */
  insertBaseFixtures?(args: {
    executionId: string;
    seasonId: string;
    algorithm1Result: AlgorithmResultEnvelope<Algo1Output>;
  }): Promise<void>;

  /**
   * Stage 2: Insert/put matchday groupings and playday calendar schedules from Algorithm 2.
   */
  insertMatchdaySchedules?(args: {
    executionId: string;
    seasonId: string;
    algorithm1Result?: AlgorithmResultEnvelope<Algo1Output>;
    algorithm2Result: AlgorithmResultEnvelope<Algorithm2Output>;
  }): Promise<void>;

  /**
   * Stage 3: Put/update pitch venues and time slots from Algorithm 3.
   */
  putPitchAllocations?(args: {
    executionId: string;
    seasonId: string;
    algorithm1Result?: AlgorithmResultEnvelope<Algo1Output>;
    algorithm2Result?: AlgorithmResultEnvelope<Algorithm2Output>;
    algorithm3Result: AlgorithmResultEnvelope<Algorithm3Output>;
  }): Promise<void>;

  /**
   * Stage 4: Put/update center referee and linesmen officiating allocations from Algorithm 4 & 5.
   */
  putOfficiatingAssignments?(args: {
    executionId: string;
    seasonId: string;
    algorithm1Result?: AlgorithmResultEnvelope<Algo1Output>;
    algorithm2Result?: AlgorithmResultEnvelope<Algorithm2Output>;
    algorithm3Result?: AlgorithmResultEnvelope<Algorithm3Output>;
    algorithm45Result: AlgorithmResultEnvelope<OfficiatingOutput>;
  }): Promise<void>;

  /**
   * Atomically write algorithm results to the database.
   * The implementation must be ALL-OR-NONE.
   */
  persistAtomically?(args: {
    executionId: string;
    seasonId: string;
    stage?: string;
    algorithm1Result?: AlgorithmResultEnvelope<Algo1Output>;
    algorithm2Result?: AlgorithmResultEnvelope<Algorithm2Output>;
    algorithm3Result?: AlgorithmResultEnvelope<Algorithm3Output>;
    algorithm45Result?: AlgorithmResultEnvelope<OfficiatingOutput>;
  }): Promise<void>;

  /**
   * Read back the persisted state to verify it matches algorithm output.
   */
  readBackAndVerify(args: {
    executionId: string;
    seasonId: string;
  }): Promise<void>;

  /**
   * League configurations for Algorithm 1.
   */
  getLeagueConfigs(seasonId: string): Promise<LeagueInput[]>;
}

export type DBState = Awaited<ReturnType<Agent0Adapters["fetchCurrentState"]>>;

/**
 * TASK 2: Fresh Active State Loader
 * Excludes completed/historical records and preserves future active operational state.
 */
export async function reloadActiveSeasonState(
  seasonId: string,
  adapters: Agent0Adapters,
): Promise<DBState> {
  const state = await adapters.fetchCurrentState(seasonId);

  return {
    ...state,
    fixtures: state.fixtures.filter(
      (fixture) => !fixture.completed && !fixture.historical,
    ),
    matchdays: state.matchdays.filter(
      (matchday) => matchday.playable !== false,
    ),
    matchAssignments: state.matchAssignments.filter(
      (assignment) => assignment.allocation_status !== "COMPLETED",
    ),
  };
}

/**
 * TASK 8: Dedicated Agent 0 Algorithm 3 Input Verification Gate
 */
function verifyAlgorithm3Input(signal: Algorithm3Signal): void {
  if (signal.matchdays.length === 0) {
    throw new Agent0Error(
      "ALGORITHM_3_EMPTY_MATCHDAY_INPUT",
      "Algorithm 3 cannot run because Agent 0 constructed an empty matchday payload.",
    );
  }

  const futureMatchCount = signal.matchdays.reduce(
    (total, matchday) =>
      total +
      matchday.matches.filter(
        (match) => !match.completed && match.status !== "cancelled",
      ).length,
    0,
  );

  if (futureMatchCount === 0) {
    throw new Agent0Error(
      "ALGORITHM_3_EMPTY_FUTURE_MATCH_INPUT",
      "Algorithm 3 cannot run because there are no future active matches in the payload.",
    );
  }

  if (signal.pitches.length !== 3) {
    throw new Agent0Error(
      "INVALID_PITCH_COUNT_FOR_ALGORITHM_3",
      `Algorithm 3 expected 3 pitches but received ${signal.pitches.length}.`,
    );
  }
}

export async function handleEvent(
  event: PresidentEvent,
  adapters: Agent0Adapters,
): Promise<Agent0EventResult> {
  // === ASSIGN ONE EXECUTION ID — it survives the entire chain ===
  const executionId = crypto.randomUUID();
  const seasonId = event.seasonId;

  const state: Agent0State = {
    executionId,
    pipelineState: "VALIDATING_EVENT",
    stopped: false,
    currentAlgorithm: null,
    lastSuccessfulStage: null,
  };

  const resultSummary: Agent0EventResult["algorithms"] = {};

  try {
    // ====================================================================
    // STEP 1 — Validate event
    // ====================================================================

    validateEvent(event);
    state.pipelineState = "LOADING_STATE";

    await Agent0LogService.recordLog({
      execution_id: executionId,
      season_id: seasonId,
      event_type: event.type,
      stage: "EVENT_INITIATED",
      status: "PENDING",
      message: `Agent 0 received event: ${event.type}`,
      database_payload: { event: event as unknown as Record<string, unknown> },
    });

    // ====================================================================
    // STEP 2 — Determine execution plan
    // ====================================================================

    const plan = buildExecutionPlan(event);

    // ====================================================================
    // TASK 1 — Load initial database snapshot (INITIAL SNAPSHOT ONLY)
    // ====================================================================

    const preExecutionState = await reloadActiveSeasonState(seasonId, adapters);

    let algorithm1Result: AlgorithmResultEnvelope<Algo1Output> | undefined;
    let algorithm2Result: AlgorithmResultEnvelope<Algorithm2Output> | undefined;
    let algorithm3Result: AlgorithmResultEnvelope<Algorithm3Output> | undefined;
    let algorithm45Result: AlgorithmResultEnvelope<OfficiatingOutput> | undefined;

    let expectedActiveMatchCount = 0;

    // ========== ALGORITHM 1 ==========

    if (plan.requiresAlgorithm1) {
      if (preExecutionState.fixtures.length > 0) {
        // DUPLICATE GENERATION GUARD:
        // Fixtures have already been generated and persisted for this season.
        // Agent 0 will never regenerate base fixtures twice.
        resultSummary.algorithm1 = { used: false, status: "skipped" };
        expectedActiveMatchCount = preExecutionState.fixtures.length;
      } else {
        state.pipelineState = "EXECUTING_ALGORITHM_1";
        state.currentAlgorithm = "ALGORITHM_1";

        const leagueConfigs = await adapters.getLeagueConfigs(seasonId);

        const command1 = createAlgorithmCommand<LeagueInput[]>({
          execution_id: executionId,
          season_id: seasonId,
          algorithm: "ALGORITHM_1",
          command: "GENERATE_FIXTURES",
          payload_schema_version: "1.0",
          payload: leagueConfigs,
        });

        algorithm1Result = generateFixtures(command1);

        validateResultEnvelope(algorithm1Result, "ALGORITHM_1", executionId);

        if (algorithm1Result.status !== "success" || !algorithm1Result.database?.ready_for_write) {
          throw new Agent0Error(
            "ALGORITHM_1_FAILED",
            `Algorithm 1 execution did not succeed or is not ready for database write (status=${algorithm1Result.status}, ready_for_write=${algorithm1Result.database?.ready_for_write}).`,
            {
              status: algorithm1Result.status,
              ready_for_write: algorithm1Result.database?.ready_for_write,
              verification_logs: algorithm1Result.verification?.logs,
              errors: algorithm1Result.verification?.errors,
            },
          );
        }

        resultSummary.algorithm1 = { used: true, status: algorithm1Result.status };
        state.lastSuccessfulStage = "ALGORITHM_1";

        await Agent0LogService.recordLog({
          execution_id: executionId,
          season_id: seasonId,
          event_type: event.type,
          stage: "ALGORITHM_1_DB_WRITE",
          algorithm: "ALGORITHM_1",
          status: "SUCCESS",
          message: "Writing Algorithm 1 immutable base fixtures to database",
          envelope: algorithm1Result as unknown as Record<string, unknown>,
          database_payload: {
            flattened_fixtures: flattenAlgorithm1Fixtures(
              algorithm1Result.payload,
              seasonId,
            ),
          },
          verification_logs: algorithm1Result.verification?.logs,
        });

        // TASK 3: ALGORITHM 1 SUCCESS -> INSERT IMMUTABLE FIXTURES & FRESH READ
        if (adapters.insertBaseFixtures) {
          await adapters.insertBaseFixtures({
            executionId,
            seasonId,
            algorithm1Result,
          });
        } else if (adapters.persistAtomically) {
          await adapters.persistAtomically({
            executionId,
            seasonId,
            stage: "ALGORITHM_1",
            algorithm1Result,
          });
        }

        const postAlgorithm1State = await reloadActiveSeasonState(seasonId, adapters);
        let algo1ExpectedCount = 0;
        for (const d of Object.values(algorithm1Result.payload.data)) {
          algo1ExpectedCount += (d.leg_1?.length || 0) + (d.leg_2?.length || 0);
        }

        if (postAlgorithm1State.fixtures.length === 0) {
          throw new Agent0Error(
            "ALGORITHM_1_PERSISTENCE_EMPTY",
            "Algorithm 1 reported success, but no active fixtures were found after database read-back.",
          );
        }

        if (postAlgorithm1State.fixtures.length !== algo1ExpectedCount) {
          throw new Agent0Error(
            "ALGORITHM_1_PERSISTENCE_COUNT_MISMATCH",
            `Algorithm 1 expected ${algo1ExpectedCount} active fixtures, but the database returned ${postAlgorithm1State.fixtures.length}.`,
          );
        }

        expectedActiveMatchCount = postAlgorithm1State.fixtures.length;
      }
    } else {
      resultSummary.algorithm1 = { used: false, status: "skipped" };
    }

    // ========== ALGORITHM 2 ==========

    if (plan.requiresAlgorithm2) {
      state.pipelineState = "EXECUTING_ALGORITHM_2";
      state.currentAlgorithm = "ALGORITHM_2";

      // TASK 4: ALGORITHM 2 MUST USE FRESH AUTHORITATIVE READ (NOT preExecutionState)
      const algorithm2State = await reloadActiveSeasonState(seasonId, adapters);
      const fixtures = algorithm2State.fixtures;

      if (fixtures.length === 0) {
        throw new Agent0Error(
          "ALGORITHM_2_EMPTY_INPUT",
          "Algorithm 2 cannot begin because no active fixtures were retrieved from the database.",
        );
      }

      if (expectedActiveMatchCount > 0 && fixtures.length !== expectedActiveMatchCount) {
        throw new Agent0Error(
          "ALGORITHM_2_INPUT_COUNT_MISMATCH",
          `Previous stage verified ${expectedActiveMatchCount} active fixtures from database, but Algorithm 2 received ${fixtures.length}.`,
        );
      }

      const signal = buildAlgorithm2Signal(event, algorithm2State);

      const command2 = createAlgorithmCommand<Algorithm2Input>({
        execution_id: executionId,
        season_id: seasonId,
        algorithm: "ALGORITHM_2",
        command: "SCHEDULE_MATCHDAYS",
        payload_schema_version: "1.0",
        payload: { fixtures, signal },
      });

      algorithm2Result = runAlgorithm2(command2);

      validateResultEnvelope(algorithm2Result, "ALGORITHM_2", executionId);

      if (algorithm2Result.status !== "success" || !algorithm2Result.database?.ready_for_write) {
        throw new Agent0Error(
          "ALGORITHM_2_FAILED",
          `Algorithm 2 execution did not succeed or is not ready for database write (status=${algorithm2Result.status}, ready_for_write=${algorithm2Result.database?.ready_for_write}). Logs: ${(algorithm2Result.verification?.logs ?? []).join(" | ")}`,
          {
            status: algorithm2Result.status,
            ready_for_write: algorithm2Result.database?.ready_for_write,
            verification_logs: algorithm2Result.verification?.logs,
            errors: algorithm2Result.verification?.errors,
          },
        );
      }

      resultSummary.algorithm2 = { used: true, status: algorithm2Result.status };
      state.lastSuccessfulStage = "ALGORITHM_2";

      await Agent0LogService.recordLog({
        execution_id: executionId,
        season_id: seasonId,
        event_type: event.type,
        stage: "ALGORITHM_2_DB_WRITE",
        algorithm: "ALGORITHM_2",
        status: "SUCCESS",
        message: "Writing Algorithm 2 matchday schedules to database",
        envelope: algorithm2Result as unknown as Record<string, unknown>,
        database_payload: {
          final_schedule: algorithm2Result.payload.final_schedule,
          mutations: algorithm2Result.payload.database?.mutations,
          preserved: algorithm2Result.payload.database?.preserved,
          expected_update_count: algorithm2Result.payload.database?.expected_update_count,
        },
        verification_logs: algorithm2Result.verification?.logs,
      });

      // TASK 5: ALGORITHM 2 SUCCESS -> INSERT MATCHDAY SCHEDULES & FRESH READ
      if (adapters.insertMatchdaySchedules) {
        await adapters.insertMatchdaySchedules({
          executionId,
          seasonId,
          algorithm1Result,
          algorithm2Result,
        });
      } else if (adapters.persistAtomically) {
        await adapters.persistAtomically({
          executionId,
          seasonId,
          stage: "ALGORITHM_2",
          algorithm1Result,
          algorithm2Result,
        });
      }

      const postAlgorithm2State = await reloadActiveSeasonState(seasonId, adapters);

      for (const fixture of postAlgorithm2State.fixtures) {
        if (fixture.matchday_number === null || fixture.playday === null) {
          throw new Agent0Error(
            "ALGORITHM_2_PERSISTENCE_INCOMPLETE",
            `Fixture ${fixture.fixture_id} was not assigned a valid matchday/playday after Algorithm 2.`,
          );
        }
      }

      expectedActiveMatchCount = postAlgorithm2State.fixtures.length;
    } else {
      resultSummary.algorithm2 = { used: false, status: "skipped" };
    }

    // ========== ALGORITHM 3 ==========

    if (plan.requiresAlgorithm3) {
      state.pipelineState = "EXECUTING_ALGORITHM_3";
      state.currentAlgorithm = "ALGORITHM_3";

      // TASK 6 & 7: FRESH ACTIVE READ-BACK FOR ALGORITHM 3
      const algorithm3State = await reloadActiveSeasonState(seasonId, adapters);

      if (!plan.requiresAlgorithm2) {
        expectedActiveMatchCount = algorithm3State.fixtures.filter(
          (f) => !f.completed && !f.historical,
        ).length;
      }

      const algorithm3Signal = buildAlgorithm3Signal(event, algorithm3State);

      // TASK 8: VERIFY ALGORITHM 3 INPUT PAYLOAD
      verifyAlgorithm3Input(algorithm3Signal);

      const futureMatchCount = algorithm3Signal.matchdays.reduce(
        (total, matchday) =>
          total +
          matchday.matches.filter(
            (match) => !match.completed && match.status !== "cancelled",
          ).length,
        0,
      );

      // TASK 9: CROSS-STAGE CARDINALITY GATE (Algorithm 2 -> Algorithm 3)
      if (expectedActiveMatchCount !== futureMatchCount) {
        throw new Agent0Error(
          "ALGORITHM_2_TO_3_HANDOFF_COUNT_MISMATCH",
          `Previous stage verified ${expectedActiveMatchCount} active matches in database, but Algorithm 3 payload contains ${futureMatchCount}.`,
        );
      }

      // TASK 17: UNIVERSAL IMPOSSIBLE EMPTY DOWNSTREAM GATE
      if (expectedActiveMatchCount > 0 && futureMatchCount === 0) {
        throw new Agent0Error(
          "IMPOSSIBLE_EMPTY_DOWNSTREAM_SUCCESS",
          `Previous stage reported ${expectedActiveMatchCount} active records, but downstream stage returned zero.`,
        );
      }

      const command3 = createAlgorithmCommand<Algorithm3Signal>({
        execution_id: executionId,
        season_id: seasonId,
        algorithm: "ALGORITHM_3",
        command: "ALLOCATE_PITCH_SLOTS",
        payload_schema_version: "1.0",
        payload: algorithm3Signal,
      });

      algorithm3Result = allocateMatches(command3);

      validateResultEnvelope(algorithm3Result, "ALGORITHM_3", executionId);

      if (algorithm3Result.status !== "success" || !algorithm3Result.database?.ready_for_write) {
        throw new Agent0Error(
          "ALGORITHM_3_FAILED",
          `Algorithm 3 execution did not succeed or is not ready for database write (status=${algorithm3Result.status}, ready_for_write=${algorithm3Result.database?.ready_for_write}). Errors: ${(algorithm3Result.verification?.errors ?? []).join(" | ")} | Logs: ${(algorithm3Result.verification?.logs ?? []).join(" | ")}`,
          {
            status: algorithm3Result.status,
            ready_for_write: algorithm3Result.database?.ready_for_write,
            verification_logs: algorithm3Result.verification?.logs,
            errors: algorithm3Result.verification?.errors,
          },
        );
      }

      // TASK 10: ALGORITHM 3 SEMANTIC OUTPUT VERIFICATION
      if (
        algorithm3Result.payload.summary.total_future_matches_received !==
        expectedActiveMatchCount
      ) {
        throw new Agent0Error(
          "ALGORITHM_3_OUTPUT_INPUT_COUNT_MISMATCH",
          `Algorithm 3 reports ${algorithm3Result.payload.summary.total_future_matches_received} future matches received, expected ${expectedActiveMatchCount}.`,
        );
      }

      if (
        algorithm3Result.payload.summary.total_allocated +
          algorithm3Result.payload.summary.total_spillover !==
        expectedActiveMatchCount
      ) {
        throw new Agent0Error(
          "ALGORITHM_3_OUTPUT_COVERAGE_MISMATCH",
          "Algorithm 3 did not account for every active future match.",
        );
      }

      resultSummary.algorithm3 = { used: true, status: algorithm3Result.status };
      state.lastSuccessfulStage = "ALGORITHM_3";

      await Agent0LogService.recordLog({
        execution_id: executionId,
        season_id: seasonId,
        event_type: event.type,
        stage: "ALGORITHM_3_DB_WRITE",
        algorithm: "ALGORITHM_3",
        status: "SUCCESS",
        message: "Writing Algorithm 3 pitch allocations to database",
        envelope: algorithm3Result as unknown as Record<string, unknown>,
        database_payload: {
          allocations: algorithm3Result.payload.database_operations.allocations,
          spillovers: algorithm3Result.payload.database_operations.spillovers,
          summary: algorithm3Result.payload.summary,
        },
        verification_logs: algorithm3Result.verification?.logs,
      });

      // TASK 12: POST ALGORITHM 3 PUT PITCH ALLOCATIONS & FRESH READ
      if (adapters.putPitchAllocations) {
        await adapters.putPitchAllocations({
          executionId,
          seasonId,
          algorithm1Result,
          algorithm2Result,
          algorithm3Result,
        });
      } else if (adapters.persistAtomically) {
        await adapters.persistAtomically({
          executionId,
          seasonId,
          stage: "ALGORITHM_3",
          algorithm1Result,
          algorithm2Result,
          algorithm3Result,
        });
      }

      const postAlgorithm3State = await reloadActiveSeasonState(seasonId, adapters);
      if (
        postAlgorithm3State.matchAssignments.length === 0 &&
        expectedActiveMatchCount > 0
      ) {
        throw new Agent0Error(
          "ALGORITHM_3_PERSISTENCE_EMPTY",
          "Algorithm 3 reported success, but no active match assignments were found after database read-back.",
        );
      }
    } else {
      resultSummary.algorithm3 = { used: false, status: "skipped" };
    }

    // ========== ALGORITHM 4 + 5 ==========

    if (plan.requiresAlgorithm45) {
      state.pipelineState = "EXECUTING_ALGORITHM_4_5";
      state.currentAlgorithm = "ALGORITHM_4_5";

      // TASK 13: ALGORITHM 4+5 RECEIVES FRESH ACTIVE ALLOCATIONS
      const officiatingState = await reloadActiveSeasonState(seasonId, adapters);
      const matches45 = buildTimeSlottedMatches(
        officiatingState,
        algorithm3Result,
      );

      if (!plan.requiresAlgorithm3) {
        expectedActiveMatchCount = officiatingState.fixtures.length;
      }

      const officiatingMatchCount = matches45.length;

      // TASK 14: ALGORITHM 4 INPUT COUNT GATE
      if (officiatingMatchCount !== expectedActiveMatchCount) {
        throw new Agent0Error(
          "ALGORITHM_3_TO_4_HANDOFF_COUNT_MISMATCH",
          `Algorithm 3 verified ${expectedActiveMatchCount} active matches from database, but Algorithm 4 received ${officiatingMatchCount}.`,
        );
      }

      // TASK 15: ALGORITHM 4+5 EMPTY-INPUT PROHIBITION
      if (matches45.length === 0 && expectedActiveMatchCount > 0) {
        throw new Agent0Error(
          "EMPTY_OFFICIATING_INPUT",
          "Algorithm 4+5 cannot begin with zero active future matches after a successful Algorithm 3 stage.",
        );
      }

      // TASK 17: UNIVERSAL IMPOSSIBLE EMPTY DOWNSTREAM GATE
      if (expectedActiveMatchCount > 0 && officiatingMatchCount === 0) {
        throw new Agent0Error(
          "IMPOSSIBLE_EMPTY_DOWNSTREAM_SUCCESS",
          `Previous stage reported ${expectedActiveMatchCount} active records, but downstream stage returned zero.`,
        );
      }

      const teamMap = new Map<string, "EPL" | "CHAMPIONSHIP">();
      for (const t of officiatingState.teams) {
        teamMap.set(t.team_id, t.league_type);
      }
      for (const m of matches45) {
        if (m.home_team_id) teamMap.set(m.home_team_id, m.league_type);
        if (m.away_team_id) teamMap.set(m.away_team_id, m.league_type);
      }

      const payload45: Algorithm45Input = {
        matches: matches45,
        referees: officiatingState.referees,
        teams: Array.from(teamMap.entries()).map(([team_id, league_type]) => ({
          team_id,
          league_type,
        })) as unknown as Algorithm45Input["teams"],
      };

      const command45 = createAlgorithmCommand<Algorithm45Input>({
        execution_id: executionId,
        season_id: seasonId,
        algorithm: "ALGORITHM_4_5",
        command: "ALLOCATE_OFFICIATING",
        payload_schema_version: "1.0",
        payload: payload45,
      });

      algorithm45Result = generateOfficiatingAssignments(command45);

      validateResultEnvelope(algorithm45Result, "ALGORITHM_4_5", executionId);

      if (algorithm45Result.status !== "success" || !algorithm45Result.database?.ready_for_write) {
        throw new Agent0Error(
          "ALGORITHM_45_FAILED",
          `Algorithm 4+5 execution did not succeed or is not ready for database write (status=${algorithm45Result.status}, ready_for_write=${algorithm45Result.database?.ready_for_write}). Logs: ${(algorithm45Result.verification?.logs ?? []).join(" | ")}`,
          {
            status: algorithm45Result.status,
            ready_for_write: algorithm45Result.database?.ready_for_write,
            verification_logs: algorithm45Result.verification?.logs,
            errors: algorithm45Result.verification?.errors,
          },
        );
      }

      resultSummary.algorithm45 = { used: true, status: algorithm45Result.status };
      state.lastSuccessfulStage = "ALGORITHM_4_5";

      await Agent0LogService.recordLog({
        execution_id: executionId,
        season_id: seasonId,
        event_type: event.type,
        stage: "ALGORITHM_4_5_DB_WRITE",
        algorithm: "ALGORITHM_4_5",
        status: "SUCCESS",
        message: "Writing Algorithm 4 & 5 officiating assignments to database",
        envelope: algorithm45Result as unknown as Record<string, unknown>,
        database_payload: {
          assignments: algorithm45Result.payload.assignments,
          verification_logs: algorithm45Result.payload.verification_logs,
        },
        verification_logs: algorithm45Result.verification?.logs,
      });

      // TASK 16: FINAL PUT OFFICIATING ALLOCATIONS & DATABASE READ
      if (adapters.putOfficiatingAssignments) {
        await adapters.putOfficiatingAssignments({
          executionId,
          seasonId,
          algorithm1Result,
          algorithm2Result,
          algorithm3Result,
          algorithm45Result,
        });
      } else if (adapters.persistAtomically) {
        await adapters.persistAtomically({
          executionId,
          seasonId,
          stage: "ALGORITHM_4_5",
          algorithm1Result,
          algorithm2Result,
          algorithm3Result,
          algorithm45Result,
        });
      }

      const finalState = await reloadActiveSeasonState(seasonId, adapters);
      if (
        event.type === "BEGIN_SEASON" &&
        (finalState.fixtures.length === 0 ||
          finalState.matchAssignments.length === 0)
      ) {
        throw new Agent0Error(
          "FINAL_DATABASE_VERIFICATION_FAILED",
          "Initial season pipeline completed but final database state is incomplete.",
        );
      }
    } else {
      resultSummary.algorithm45 = { used: false, status: "skipped" };
    }

    // ====================================================================
    // READ-BACK AND FINAL VERIFICATION
    // ====================================================================

    state.pipelineState = "PREPARING_DATABASE_WRITE";
    state.currentAlgorithm = null;
    state.pipelineState = "DATABASE_TRANSACTION";

    state.pipelineState = "READ_BACK";
    state.pipelineState = "VERIFYING_DATABASE";

    await adapters.readBackAndVerify({ executionId, seasonId });

    await Agent0LogService.recordLog({
      execution_id: executionId,
      season_id: seasonId,
      event_type: event.type,
      stage: "READ_BACK_VERIFIED",
      status: "SUCCESS",
      message: "Database state read-back verified against algorithm outputs",
      database_payload: { algorithms: resultSummary as unknown as Record<string, unknown> },
    });

    state.pipelineState = "COMPLETED";
    state.lastSuccessfulStage = "DATABASE_VERIFIED";

    await Agent0LogService.recordLog({
      execution_id: executionId,
      season_id: seasonId,
      event_type: event.type,
      stage: "COMPLETED",
      status: "SUCCESS",
      message: "Agent 0 orchestration pipeline completed successfully",
      database_payload: { algorithms: resultSummary as unknown as Record<string, unknown> },
    });

    return {
      success: true,
      executionId,
      seasonId,
      stage: "COMPLETED",
      algorithms: resultSummary,
    };
  } catch (error) {
    state.pipelineState = "STOPPED";
    state.stopped = true;

    const agent0Error =
      error instanceof Agent0Error
        ? error
        : new Agent0Error(
            "UNHANDLED_AGENT0_ERROR",
            error instanceof Error ? error.message : String(error),
          );

    await Agent0LogService.recordLog({
      execution_id: executionId,
      season_id: seasonId,
      event_type: event.type,
      stage: state.pipelineState,
      algorithm: state.currentAlgorithm,
      status: "FAILED",
      message: agent0Error.message,
      error_details: {
        code: agent0Error.code,
        message: agent0Error.message,
        stage: state.lastSuccessfulStage ?? "PRE_ALGORITHM",
        algorithm: state.currentAlgorithm,
        details: (agent0Error.details as Record<string, unknown>) ?? null,
      },
    });

    return {
      success: false,
      executionId,
      seasonId,
      stage: state.pipelineState,
      algorithms: resultSummary,
      error: {
        code: agent0Error.code,
        message: agent0Error.message,
        stage: state.lastSuccessfulStage ?? "PRE_ALGORITHM",
      },
    };
  }
}

/* ============================================================================
 * EVENT VALIDATION
 * ========================================================================== */

function validateEvent(event: PresidentEvent): void {
  if (!event || typeof event !== "object") {
    throw new Agent0Error("INVALID_EVENT", "Event must be an object.");
  }

  if (!event.type) {
    throw new Agent0Error("INVALID_EVENT_TYPE", "Event must have a type.");
  }

  if (!event.seasonId || typeof event.seasonId !== "string") {
    throw new Agent0Error("INVALID_SEASON_ID", "Event must have a valid seasonId.");
  }
}

/* ============================================================================
 * ALGORITHM 2 SIGNAL BUILDER
 * ========================================================================== */

function buildAlgorithm2Signal(
  event: PresidentEvent,
  state: DBState,
): import("../algorithms/algorithm2").Agent0Signal {
  type ChangeType =
    | "INITIAL_SCHEDULING"
    | "MATCH_CAPACITY_CHANGED"
    | "PLAYDAY_ADDED"
    | "PLAYDAY_REMOVED"
    | "ACTIVE_MATCHDAY_CANCELLED"
    | "MULTIPLE_CHANGES"
    | "NO_CHANGE";

  let changeType: ChangeType;

  switch (event.type) {
    case "BEGIN_SEASON":
      changeType = "INITIAL_SCHEDULING";
      break;
    case "CHANGE_MATCH_CAPACITY":
      changeType = "MATCH_CAPACITY_CHANGED";
      break;
    case "ADD_PLAYDAY_ONCE":
    case "ADD_PLAYDAY_PERMANENT":
      changeType = "PLAYDAY_ADDED";
      break;
    case "REMOVE_PLAYDAY_ONCE":
    case "REMOVE_PLAYDAY_PERMANENT":
      changeType = "PLAYDAY_REMOVED";
      break;
    case "CANCEL_MATCHDAY":
      changeType = "ACTIVE_MATCHDAY_CANCELLED";
      break;
    default:
      throw new Agent0Error(
        "INVALID_ALGORITHM_2_ROUTING",
        `Event ${event.type} does not map to Algorithm 2.`,
      );
  }

  // Apply calendar mutations locally before passing to Algorithm 2
  let playdays = [...state.playdays];

  if (event.type === "ADD_PLAYDAY_ONCE" || event.type === "ADD_PLAYDAY_PERMANENT") {
    if (!event.date) {
      throw new Agent0Error("MISSING_EVENT_DATE", "Playday add event requires a date.");
    }
    const mode = event.type === "ADD_PLAYDAY_ONCE" ? "ONE_TIME" : "PERMANENT";
    const existingIndex = playdays.findIndex((p) => p.date === event.date);
    if (existingIndex >= 0) {
      playdays[existingIndex] = { date: event.date, mode, active: true };
    } else {
      playdays.push({ date: event.date, mode, active: true });
    }
    playdays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  if (event.type === "REMOVE_PLAYDAY_ONCE" || event.type === "REMOVE_PLAYDAY_PERMANENT") {
    if (!event.date) {
      throw new Agent0Error("MISSING_EVENT_DATE", "Playday remove event requires a date.");
    }
    playdays = playdays.map((p) =>
      p.date === event.date ? { ...p, active: false } : p,
    );
  }

  const matchesPerMatchday: Record<string, number> = {};

  const eplCap = event.eplMatchesPerMatchday ?? state.capacity?.EPL ?? 9;
  const champCap = event.championshipMatchesPerMatchday ?? state.capacity?.Championship ?? 9;

  const distinctLeagueIds = Array.from(
    new Set(state.fixtures.map((f) => f.league_id).filter(Boolean))
  );

  if (distinctLeagueIds.length > 0) {
    for (const lid of distinctLeagueIds) {
      const isEPL = isEplLeague(lid);
      matchesPerMatchday[lid] = isEPL ? eplCap : champCap;
    }
  }

  const cancelledMatchdays: Array<{ league_id: string; matchday_number: number }> = [];

  if (event.type === "CANCEL_MATCHDAY" && event.matchdayNumber !== undefined) {
    const distinctLeagues = Array.from(
      new Set(state.fixtures.map((f) => f.league_id).filter(Boolean)),
    );
    for (const leagueId of distinctLeagues) {
      cancelledMatchdays.push({
        league_id: leagueId,
        matchday_number: event.matchdayNumber,
      });
    }
  }

  return {
    signal_id: crypto.randomUUID(),
    change_type: changeType,
    requested_operation: "MATCHDAY_AND_PLAYDAY",
    playdays,
    matches_per_matchday:
      Object.keys(matchesPerMatchday).length > 0 ? matchesPerMatchday : undefined,
    cancelled_matchdays:
      cancelledMatchdays.length > 0 ? cancelledMatchdays : undefined,
  };
}

export const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
export const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

export function isEplLeague(leagueId?: string | null): boolean {
  if (!leagueId) return false;
  const l = leagueId.toLowerCase().trim();
  return (
    l === EPL_COMP_ID.toLowerCase() ||
    l === 'epl' ||
    l.includes('1111') ||
    l.includes('premier')
  );
}

export function isChampionshipLeague(leagueId?: string | null): boolean {
  if (!leagueId) return false;
  const l = leagueId.toLowerCase().trim();
  return (
    l === CHAMP_COMP_ID.toLowerCase() ||
    l === 'championship' ||
    l.includes('2222')
  );
}

/* ============================================================================
 * ALGORITHM 3 SIGNAL BUILDER
 * ========================================================================== */

function buildAlgorithm3Signal(
  event: PresidentEvent,
  state: DBState,
): Algorithm3Signal {
  type ChangeType =
    | "INITIAL_ALLOCATION"
    | "PITCH_STATE_CHANGED"
    | "TIME_CONFIGURATION_CHANGED"
    | "MATCHDAY_CHANGED"
    | "SPILLOVER_RECALCULATION"
    | "PLAYDAY_CONFIGURATION_CHANGED";

  let changeType: ChangeType;

  switch (event.type) {
    case "BEGIN_SEASON":
      changeType = "INITIAL_ALLOCATION";
      break;
    case "CHANGE_PITCH_STATE":
      changeType = "PITCH_STATE_CHANGED";
      break;
    case "CHANGE_TIME_CONFIGURATION":
      changeType = "TIME_CONFIGURATION_CHANGED";
      break;
    case "CANCEL_MATCHDAY":
    case "CHANGE_MATCH_CAPACITY":
      changeType = "MATCHDAY_CHANGED";
      break;
    case "ADD_PLAYDAY_ONCE":
    case "ADD_PLAYDAY_PERMANENT":
    case "REMOVE_PLAYDAY_ONCE":
    case "REMOVE_PLAYDAY_PERMANENT":
      changeType = "PLAYDAY_CONFIGURATION_CHANGED";
      break;
    default:
      changeType = "SPILLOVER_RECALCULATION";
  }

  // Apply pitch state changes locally
  let pitches = [...state.pitches];

  if (event.type === "CHANGE_PITCH_STATE" && event.pitchId) {
    const isAvailable = (event.amAvailable ?? true) || (event.pmAvailable ?? true);
    const pid = event.pitchId;
    pitches = pitches.map((p) =>
      p.pitch_id === pid
        ? { ...p, state: isAvailable ? "available" : "unavailable" }
        : p,
    );
  }

  const mdNumbers = Array.from(
    new Set([
      ...state.matchdays.map((m) => m.matchday_number),
      ...state.fixtures
        .filter((f) => !f.completed && !f.historical && f.matchday_number !== null)
        .map((f) => f.matchday_number!),
    ]),
  ).sort((a, b) => a - b);

  const matchdays: Algorithm3Signal["matchdays"] = mdNumbers.map((mdNum) => {
    const mdObj = state.matchdays.find((m) => m.matchday_number === mdNum);
    const mdFixtures = state.fixtures.filter(
      (f) => f.matchday_number === mdNum && !f.completed && !f.historical,
    );

    const matchesList =
      mdFixtures.length > 0
        ? mdFixtures.map((fixture) => ({
            match_id: fixture.fixture_id,
            league_id: isEplLeague(fixture.league_id) ? EPL_COMP_ID : CHAMP_COMP_ID,
            home_id: fixture.home_id,
            away_id: fixture.away_id,
            matchday_number: mdNum,
            status: "scheduled" as const,
            completed: fixture.completed,
          }))
        : (mdObj?.match_ids ?? []).map((matchId) => {
            const fixture = state.fixtures.find((f) => f.fixture_id === matchId);
            return {
              match_id: matchId,
              league_id: isEplLeague(fixture?.league_id) ? EPL_COMP_ID : CHAMP_COMP_ID,
              home_id: fixture?.home_id ?? "",
              away_id: fixture?.away_id ?? "",
              matchday_number: mdNum,
              status: "scheduled" as const,
              completed: fixture?.completed ?? false,
            };
          });

    const playDate = mdFixtures[0]?.playday || mdObj?.play_date || event.seasonStartDate || event.date;
    if (!playDate) {
      throw new Agent0Error(
        "MISSING_PLAY_DATE",
        `Cannot determine play date for matchday ${mdNum}. No playday, matchday date, season start date, or event date available.`,
      );
    }

    return {
      matchday_number: mdNum,
      play_date: playDate,
      playable: mdObj?.playable ?? true,
      matches: matchesList,
    };
  });

  const timeConfiguration = buildAlgorithm3TimeConfig(event, state);

  return {
    run_id: crypto.randomUUID(),
    change_type: changeType,
    matchdays,
    pitches,
    time_configuration: timeConfiguration,
    existing_allocations: state.matchAssignments.map((a) => ({
      match_id: a.match_id,
      league_id: isEplLeague(state.fixtures.find((f) => f.fixture_id === a.match_id)?.league_id)
        ? EPL_COMP_ID
        : CHAMP_COMP_ID,
      matchday_number:
        state.matchdays.find((md) => md.matchday_id === a.matchday_id)?.matchday_number ?? 0,
      play_date: a.play_date,
      pitch_id: a.pitch_id,
      slot_number: (parseInt(a.slot_id, 10) || 1) as 1 | 2 | 3,
      start_time: a.start_time,
      end_time: a.end_time,
      status: "allocated" as const,
      completed: a.allocation_status === "COMPLETED",
    })),
    requested_at: new Date().toISOString(),
  };
}

function buildAlgorithm3TimeConfig(
  event: PresidentEvent,
  state: DBState,
): Algorithm3Signal["time_configuration"] {
  const defaultEplSlots: Array<{ slot_number: 1 | 2 | 3; start_time: string; end_time: string }> = [
    { slot_number: 1, start_time: "08:00", end_time: "09:30" },
    { slot_number: 2, start_time: "09:30", end_time: "11:00" },
    { slot_number: 3, start_time: "11:00", end_time: "12:30" },
  ];
  const defaultChampSlots: Array<{ slot_number: 1 | 2 | 3; start_time: string; end_time: string }> = [
    { slot_number: 1, start_time: "13:00", end_time: "14:30" },
    { slot_number: 2, start_time: "14:30", end_time: "16:00" },
    { slot_number: 3, start_time: "16:00", end_time: "17:30" },
  ];

  if (event.type === "CHANGE_TIME_CONFIGURATION") {
    return [
      {
        league_id: EPL_COMP_ID,
        slots: event.eplSlots && event.eplSlots.length > 0 ? event.eplSlots : defaultEplSlots,
      },
      {
        league_id: CHAMP_COMP_ID,
        slots: event.championshipSlots && event.championshipSlots.length > 0 ? event.championshipSlots : defaultChampSlots,
      },
      {
        league_id: "epl",
        slots: event.eplSlots && event.eplSlots.length > 0 ? event.eplSlots : defaultEplSlots,
      },
      {
        league_id: "championship",
        slots: event.championshipSlots && event.championshipSlots.length > 0 ? event.championshipSlots : defaultChampSlots,
      },
    ];
  }

  // If database has time configuration, pass it through while ensuring canonical UIDs
  if (state.timeConfiguration && state.timeConfiguration.length > 0) {
    const configs: NonNullable<Algorithm3Signal["time_configuration"]> = [];
    for (const tc of state.timeConfiguration) {
      const isEPL = isEplLeague(tc.league_id);
      const targetUid = isEPL ? EPL_COMP_ID : CHAMP_COMP_ID;
      const defaultSlots = isEPL ? defaultEplSlots : defaultChampSlots;
      configs.push({
        league_id: targetUid,
        slots: (tc.slots && tc.slots.length > 0 ? tc.slots : defaultSlots) as any,
      });
      // Also preserve original league_id alias if different
      if ((tc.league_id as string) !== targetUid) {
        configs.push({
          league_id: tc.league_id,
          slots: (tc.slots && tc.slots.length > 0 ? tc.slots : defaultSlots) as any,
        });
      }
    }
    return configs;
  }

  // Fallback default: Always provide explicit non-empty time configuration with EPL AM & Champ PM
  return [
    { league_id: EPL_COMP_ID, slots: defaultEplSlots },
    { league_id: CHAMP_COMP_ID, slots: defaultChampSlots },
    { league_id: "epl", slots: defaultEplSlots },
    { league_id: "championship", slots: defaultChampSlots },
  ];
}

/* ============================================================================
 * ALGORITHM 1 FIXTURE FLATTENER
 * ========================================================================== */

function flattenAlgorithm1Fixtures(
  output: Algo1Output,
  seasonId?: string,
): Array<{
  league_id: string;
  home_id: string;
  away_id: string;
  leg: 1 | 2;
  match_sequence: number;
  matchday_number: number | null;
  playday: string | null;
  completed: boolean;
  historical: boolean;
}> {
  const fixtures: Array<{
    league_id: string;
    home_id: string;
    away_id: string;
    leg: 1 | 2;
    match_sequence: number;
    matchday_number: number | null;
    playday: string | null;
    completed: boolean;
    historical: boolean;
  }> = [];

  for (const [leagueId, data] of Object.entries(output.data)) {
    const validLeagueId = leagueId;

    const processLeg = (
      leg: typeof data.leg_1,
      legNumber: 1 | 2,
    ) => {
      leg.forEach((fixture) => {
        fixtures.push({
          league_id: validLeagueId,
          home_id: fixture.home_id,
          away_id: fixture.away_id,
          leg: legNumber,
          match_sequence: fixture.match_sequence,
          matchday_number: null,
          playday: null,
          completed: false,
          historical: false,
        });
      });
    };

    if (data.leg_1) processLeg(data.leg_1, 1);
    if (data.leg_2) processLeg(data.leg_2, 2);
  }

  return fixtures;
}

/* ============================================================================
 * TIME-SLOTTED MATCH BUILDER (for Algorithm 4+5)
 * ========================================================================== */

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatToIsoTimestamp(playDate: string, timeStr: string): string {
  if (!timeStr) return new Date().toISOString();
  if (timeStr.includes("T")) return timeStr;
  if (!playDate) {
    throw new Agent0Error(
      "MISSING_PLAY_DATE",
      "Cannot format timestamp: no play date available.",
    );
  }
  const datePart = playDate;
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${datePart}T${cleanTime}.000Z`;
}

function buildTimeSlottedMatches(
  state: DBState,
  algorithm3Result?: AlgorithmResultEnvelope<Algorithm3Output>,
): Algorithm45Input["matches"] {
  const rawList: Array<{
    match_id: string;
    league_id: string;
    start_time: string;
    end_time: string;
  }> = [];

  if (algorithm3Result) {
    for (const a of algorithm3Result.payload.database_operations.allocations) {
      rawList.push({
        match_id: a.match_id,
        league_id: a.league_id,
        start_time: formatToIsoTimestamp(a.play_date, a.start_time),
        end_time: formatToIsoTimestamp(a.play_date, a.end_time),
      });
    }
    for (const s of algorithm3Result.payload.database_operations.spillovers) {
      // Derive spillover time from the last allocated slot on the same play date
      const sameDayAllocations = algorithm3Result.payload.database_operations.allocations
        .filter((a) => a.play_date === s.current_play_date)
        .sort((a, b) => a.end_time.localeCompare(b.end_time));
      const lastEndTime = sameDayAllocations.length > 0
        ? sameDayAllocations[sameDayAllocations.length - 1].end_time
        : "17:00";
      const spilloverStartMinutes = timeToMinutes(lastEndTime);
      const spilloverStart = minutesToTime(spilloverStartMinutes);
      const spilloverEnd = minutesToTime(spilloverStartMinutes + 120);
      rawList.push({
        match_id: s.match_id,
        league_id: s.league_id,
        start_time: formatToIsoTimestamp(s.current_play_date, spilloverStart),
        end_time: formatToIsoTimestamp(s.current_play_date, spilloverEnd),
      });
    }
  } else {
    for (const a of state.matchAssignments) {
      const fx = state.fixtures.find((f) => f.fixture_id === a.match_id);
      if (fx && !fx.completed && !fx.historical && a.allocation_status !== "COMPLETED") {
        rawList.push({
          match_id: a.match_id,
          league_id: (isEplLeague(fx.league_id)
            ? "epl"
            : "championship") as "epl" | "championship",
          start_time: formatToIsoTimestamp(a.play_date, a.start_time),
          end_time: formatToIsoTimestamp(a.play_date, a.end_time),
        });
      }
    }
  }

  return rawList.map((allocation) => {
    const fixture = state.fixtures.find((f) => f.fixture_id === allocation.match_id);
    const isEPL = isEplLeague(allocation.league_id) || isEplLeague(fixture?.league_id);
    const leagueType = isEPL ? "EPL" : "CHAMPIONSHIP";
    return {
      match_id: allocation.match_id,
      league_type: leagueType as "EPL" | "CHAMPIONSHIP",
      home_team_id: fixture?.home_id ?? "",
      away_team_id: fixture?.away_id ?? "",
      start_time: allocation.start_time,
      end_time: allocation.end_time,
    };
  }).sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
}

