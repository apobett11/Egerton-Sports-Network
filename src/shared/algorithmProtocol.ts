/* ============================================================================
 * ALGORITHM PROTOCOL — SHARED TRANSPORT LAYER
 * ============================================================================
 *
 * This is the ONE shared file that defines the communication contract between
 * Agent 0 and every scheduling algorithm.
 *
 * THE ENVELOPE IS STANDARDIZED.
 * THE PAYLOAD IS ALGORITHM-SPECIFIC.
 *
 * Usage:
 *   Algorithm 1  →  AlgorithmCommandEnvelope<LeagueInput[]>
 *                   AlgorithmResultEnvelope<Algo1Output>
 *
 *   Algorithm 2  →  AlgorithmCommandEnvelope<Algorithm2Input>
 *                   AlgorithmResultEnvelope<Algorithm2Output>
 *
 *   Algorithm 3  →  AlgorithmCommandEnvelope<Algorithm3AgentSignal>
 *                   AlgorithmResultEnvelope<Algorithm3Output>
 *
 *   Algorithm 4+5 → AlgorithmCommandEnvelope<Algorithm45Input>
 *                   AlgorithmResultEnvelope<OfficiatingOutput>
 *
 * ========================================================================== */

/* ============================================================================
 * PART 1A — COMMAND ENVELOPE
 * ========================================================================== */

export type AlgorithmId =
  | "ALGORITHM_1"
  | "ALGORITHM_2"
  | "ALGORITHM_3"
  | "ALGORITHM_4_5";

export interface AlgorithmCommandEnvelope<TPayload> {
  protocol_version: "1.0";

  execution_id: string;
  season_id: string;

  algorithm: AlgorithmId;

  command: string;

  issued_at: string;

  source: "AGENT_0";

  payload_schema_version: string;

  payload: TPayload;

  integrity: {
    expected_record_count?: number;
    affected_leagues?: string[];
    affected_matchdays?: number[];
    affected_fixtures?: string[];
  };
}

/* ============================================================================
 * PART 1B — RESULT ENVELOPE
 * ========================================================================== */

export interface AlgorithmVerification {
  passed: boolean;

  logs: string[];

  errors: string[];

  warnings: string[];
}

export type DatabaseOperation =
  | "INSERT"
  | "UPDATE"
  | "UPSERT"
  | "NO_WRITE";

export interface AlgorithmResultEnvelope<TPayload> {
  protocol_version: "1.0";

  execution_id: string;
  season_id: string;

  algorithm: AlgorithmId;

  status: "success" | "failed";

  completed: boolean;

  cycle_count: 1;

  verification: AlgorithmVerification;

  payload: TPayload;

  database: {
    ready_for_write: boolean;

    operation: DatabaseOperation;

    expected_count: number;
  };
}

/* ============================================================================
 * PART 1C — PROTOCOL VALIDATION HELPERS
 * ========================================================================== */

export function validateCommandEnvelope<T>(
  envelope: AlgorithmCommandEnvelope<T>,
  expectedAlgorithm: AlgorithmId,
): void {
  if (envelope.protocol_version !== "1.0") {
    throw new Error("Invalid protocol version.");
  }

  if (!envelope.execution_id) {
    throw new Error("Missing execution_id.");
  }

  if (!envelope.season_id) {
    throw new Error("Missing season_id.");
  }

  if (envelope.algorithm !== expectedAlgorithm) {
    throw new Error(
      `Algorithm mismatch. Expected ${expectedAlgorithm}, received ${envelope.algorithm}.`,
    );
  }

  if (envelope.source !== "AGENT_0") {
    throw new Error("Invalid command source.");
  }

  if (!envelope.issued_at) {
    throw new Error("Missing issued_at.");
  }

  if (!envelope.payload_schema_version) {
    throw new Error("Missing payload_schema_version.");
  }

  if (envelope.payload === undefined) {
    throw new Error("Missing algorithm payload.");
  }
}

export function validateResultEnvelope<T>(
  envelope: AlgorithmResultEnvelope<T>,
  expectedAlgorithm: AlgorithmId,
  expectedExecutionId: string,
): void {
  if (envelope.protocol_version !== "1.0") {
    throw new Error("Invalid protocol version.");
  }

  if (envelope.algorithm !== expectedAlgorithm) {
    throw new Error(
      `Algorithm mismatch. Expected ${expectedAlgorithm}, received ${envelope.algorithm}.`,
    );
  }

  if (envelope.execution_id !== expectedExecutionId) {
    throw new Error(
      "Execution ID mismatch.",
    );
  }

  if (!envelope.season_id) {
    throw new Error("Missing season_id.");
  }

  if (envelope.cycle_count !== 1) {
    throw new Error(
      "Algorithm violated single-cycle execution rule.",
    );
  }

  if (envelope.completed !== true) {
    throw new Error(
      "Algorithm did not return a completed execution state.",
    );
  }

  if (
    envelope.status !== "success" &&
    envelope.status !== "failed"
  ) {
    throw new Error(
      "Invalid algorithm status.",
    );
  }

  if (
    envelope.status === "success" &&
    envelope.verification.passed !== true
  ) {
    throw new Error(
      "Algorithm reported success without passed verification.",
    );
  }

  if (
    envelope.status === "success" &&
    envelope.database.ready_for_write !== true
  ) {
    throw new Error(
      "Algorithm reported success but is not database-write-ready.",
    );
  }

  if (
    envelope.status === "failed" &&
    envelope.database.ready_for_write !== false
  ) {
    throw new Error(
      "Failed algorithm cannot be marked database-write-ready.",
    );
  }

  if (envelope.payload === undefined) {
    throw new Error(
      "Result payload is missing.",
    );
  }
}

/* ============================================================================
 * PART 2 — PROTOCOL WRAPPER FUNCTIONS
 * ========================================================================== */

export function createAlgorithmCommand<TPayload>(
  args: {
    execution_id: string;
    season_id: string;
    algorithm: AlgorithmId;
    command: string;
    payload_schema_version: string;
    payload: TPayload;
    integrity?: {
      expected_record_count?: number;
      affected_leagues?: string[];
      affected_matchdays?: number[];
      affected_fixtures?: string[];
    };
  },
): AlgorithmCommandEnvelope<TPayload> {
  return {
    protocol_version: "1.0",
    execution_id: args.execution_id,
    season_id: args.season_id,
    algorithm: args.algorithm,
    command: args.command,
    issued_at: new Date().toISOString(),
    source: "AGENT_0",
    payload_schema_version: args.payload_schema_version,
    payload: args.payload,
    integrity: args.integrity ?? {},
  };
}

export function createAlgorithmResult<TPayload>(
  args: {
    execution_id: string;
    season_id: string;
    algorithm: AlgorithmId;
    status: "success" | "failed";
    payload: TPayload;
    verification: AlgorithmVerification;
    database: {
      ready_for_write: boolean;
      operation: DatabaseOperation;
      expected_count: number;
    };
  },
): AlgorithmResultEnvelope<TPayload> {
  return {
    protocol_version: "1.0",
    execution_id: args.execution_id,
    season_id: args.season_id,
    algorithm: args.algorithm,
    status: args.status,
    completed: true,
    cycle_count: 1,
    verification: args.verification,
    payload: args.payload,
    database: args.database,
  };
}
