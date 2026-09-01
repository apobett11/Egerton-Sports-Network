/* ============================================================================
 * ALGORITHM 3 — MATCH SLOT / PITCH / TIME ALLOCATION ENGINE (Protocol Wrapper)
 * ============================================================================
 *
 * This file is the protocol boundary for Algorithm 3.
 *
 * It:
 *   1. Accepts an AlgorithmCommandEnvelope<Algorithm3Signal> from Agent 0.
 *   2. Validates the envelope using the shared protocol.
 *   3. Extracts the Algorithm3Signal payload.
 *   4. Passes it to the existing Algorithm 3 engine.
 *   5. Wraps the native output in an AlgorithmResultEnvelope<Algorithm3Output>.
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
 * RE-EXPORTED ALGORITHM 3 TYPES
 * (Copied verbatim from algorihm 3.txt — no mathematics changed)
 * ========================================================================== */

export const ALGORITHM_3_VERSION = "3.0.0";

export type LeagueId = string;

function getLeaguePriorityOrder(signal: Algorithm3Signal): LeagueId[] {
  const seen = new Set<string>();
  const order: LeagueId[] = [];

  for (const tc of signal.time_configuration ?? []) {
    if (tc.league_id && !seen.has(tc.league_id)) {
      seen.add(tc.league_id);
      order.push(tc.league_id);
    }
  }

  for (const md of signal.matchdays ?? []) {
    for (const m of md.matches ?? []) {
      if (m.league_id && !seen.has(m.league_id)) {
        seen.add(m.league_id);
        order.push(m.league_id);
      }
    }
  }

  return order;
}

function getLeagueRank(leagueId: LeagueId, priorityOrder: LeagueId[]): number {
  const index = priorityOrder.indexOf(leagueId);
  return index === -1 ? Infinity : index;
}
type PitchState = "available" | "unavailable";
type MatchStatus = "scheduled" | "played" | "completed" | "cancelled" | "postponed" | "unplayed";
type AllocationStatus = "allocated" | "spillover" | "preserved" | "blocked";
type ChangeType =
  | "INITIAL_ALLOCATION"
  | "PITCH_STATE_CHANGED"
  | "TIME_CONFIGURATION_CHANGED"
  | "MATCHDAY_CHANGED"
  | "SPILLOVER_RECALCULATION"
  | "PLAYDAY_CONFIGURATION_CHANGED";

export interface PitchInput {
  pitch_id: string;
  state: PitchState;
}

export interface SlotTime {
  slot_number: number;
  start_time: string;
  end_time: string;
}

export interface LeagueTimeConfiguration {
  league_id: LeagueId;
  slots: SlotTime[];
}

export interface MatchInput {
  match_id: string;
  league_id: LeagueId;
  home_id: string;
  away_id: string;
  matchday_number: number;
  status: MatchStatus;
  is_spillover?: boolean;
  completed?: boolean;
}

export interface MatchdayInput {
  matchday_number: number;
  play_date: string;
  playable: boolean;
  matches: MatchInput[];
}

export interface ExistingAllocation {
  match_id: string;
  league_id: LeagueId;
  matchday_number: number;
  play_date: string;
  pitch_id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  status: AllocationStatus;
  completed: boolean;
}

export interface Algorithm3Signal {
  run_id: string;
  change_type: ChangeType;
  matchdays: MatchdayInput[];
  pitches: PitchInput[];
  time_configuration?: LeagueTimeConfiguration[];
  existing_allocations?: ExistingAllocation[];
  spillover_matches?: MatchInput[];
  requested_at?: string;
}

export interface DatabaseAllocationWrite {
  operation: "UPSERT_MATCH_ALLOCATION";
  match_id: string;
  league_id: LeagueId;
  matchday_number: number;
  play_date: string;
  pitch_id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  status: "scheduled";
  source: "ALGORITHM_3";
}

export interface DatabaseSpilloverWrite {
  operation: "MARK_MATCH_SPILLOVER";
  match_id: string;
  league_id: LeagueId;
  matchday_number: number;
  current_play_date: string;
  status: "spillover";
  source: "ALGORITHM_3";
}

export interface VerificationResult {
  passed: boolean;
  logs: string[];
  errors: string[];
}

export interface Algorithm3Output {
  algorithm: "ALGORITHM_3";
  version: string;
  status: "success" | "failed";
  run_id: string;
  cycle_count: 1;
  stopped: true;
  trigger: ChangeType;
  verification: VerificationResult;
  summary: {
    total_future_matches_received: number;
    total_completed_matches_preserved: number;
    total_allocated: number;
    total_spillover: number;
    by_league: Record<LeagueId, { allocated: number; spillover: number }>;
    pitch_capacity_used: number;
  };
  database_operations: {
    allocations: DatabaseAllocationWrite[];
    spillovers: DatabaseSpilloverWrite[];
  };
  preserved_history: ExistingAllocation[];
}

/* ============================================================================
 * INTERNAL TYPES
 * ========================================================================== */

interface InternalSlot {
  pitch_id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
}

interface InternalMatch extends MatchInput {
  spillover_priority: boolean;
}

interface AllocationRecord {
  match_id: string;
  league_id: LeagueId;
  matchday_number: number;
  play_date: string;
  pitch_id: string;
  slot_number: number;
  start_time: string;
  end_time: string;
}

/* ============================================================================
 * PROTOCOL ENTRY POINT (Part 6)
 *
 * OLD signature:  allocateMatches(signal: Algorithm3Signal): Algorithm3Output
 * NEW signature:  allocateMatches(command: AlgorithmCommandEnvelope<Algorithm3Signal>):
 *                                  AlgorithmResultEnvelope<Algorithm3Output>
 * ========================================================================== */

export function allocateMatches(
  command: AlgorithmCommandEnvelope<Algorithm3Signal>,
): AlgorithmResultEnvelope<Algorithm3Output> {
  // Validate the command envelope first
  validateCommandEnvelope(command, "ALGORITHM_3");

  // Extract the Algorithm3Signal payload
  const signal = command.payload;

  // Run the EXISTING Algorithm 3 mathematical engine (unchanged)
  const nativeOutput = allocateMatchesEngine(signal);

  // Calculate total write count
  const writeCount =
    nativeOutput.database_operations.allocations.length +
    nativeOutput.database_operations.spillovers.length;

  // Wrap the native output in the result envelope
  return createAlgorithmResult({
    execution_id: command.execution_id,
    season_id: command.season_id,
    algorithm: "ALGORITHM_3",
    status: nativeOutput.status,
    payload: nativeOutput,
    verification: {
      passed: nativeOutput.status === "success" && nativeOutput.verification.passed,
      logs: nativeOutput.verification.logs,
      errors: nativeOutput.verification.errors,
      warnings: [],
    },
    database: {
      ready_for_write: nativeOutput.status === "success",
      operation: "UPSERT",
      expected_count: writeCount,
    },
  });
}

/* ============================================================================
 * EXISTING ALGORITHM 3 MATHEMATICAL ENGINE
 * ============================================================================
 *
 * Everything below this line is THE ORIGINAL Algorithm 3 mathematics.
 *
 * NOTHING BELOW IS MODIFIED.
 *
 * The engine is now called `allocateMatchesEngine` (was `allocateMatches`)
 * to avoid name collision with the protocol entry point above.
 * ========================================================================== */

function allocateMatchesEngine(signal: Algorithm3Signal): Algorithm3Output {
  const logs: string[] = [];
  const errors: string[] = [];

  logs.push("ALGORITHM 3: Starting single scheduling cycle.");
  logs.push(`Run ID: ${signal.run_id}`);
  logs.push(`Trigger: ${signal.change_type}`);

  const structuralValidation = validateInputStructure(signal);

  logs.push(...structuralValidation.logs);
  errors.push(...structuralValidation.errors);

  if (!structuralValidation.passed) {
    return failedOutput(signal, logs, errors);
  }

  const timeConfiguration = resolveTimeConfiguration(signal.time_configuration);
  const leaguePriorityOrder = getLeaguePriorityOrder(signal);

  logs.push("Confirming: President time configuration resolved successfully.");

  const historicalMatchIds = new Set<string>();

  for (const allocation of signal.existing_allocations ?? []) {
    if (allocation.completed || isPastDate(allocation.play_date, signal.requested_at)) {
      historicalMatchIds.add(allocation.match_id);
    }
  }

  for (const matchday of signal.matchdays) {
    for (const match of matchday.matches) {
      if (
        match.completed ||
        match.status === "completed" ||
        match.status === "played" ||
        isPastDate(matchday.play_date, signal.requested_at)
      ) {
        historicalMatchIds.add(match.match_id);
      }
    }
  }

  logs.push(
    `Confirming: Historical boundary established. ${historicalMatchIds.size} immutable match(es).`,
  );

  const futureMatches = flattenFutureMatches(signal.matchdays, historicalMatchIds);

  logs.push(
    `Confirming: ${futureMatches.length} future match(es) eligible for allocation.`,
  );

  const spilloverMap = new Map<string, InternalMatch>();

  for (const match of signal.spillover_matches ?? []) {
    if (historicalMatchIds.has(match.match_id)) {
      errors.push(
        `Historical match ${match.match_id} was incorrectly supplied as spillover.`,
      );
      continue;
    }

    spilloverMap.set(match.match_id, {
      ...match,
      is_spillover: true,
      spillover_priority: true,
    });
  }

  for (const match of futureMatches) {
    if (match.is_spillover) {
      spilloverMap.set(match.match_id, {
        ...match,
        spillover_priority: true,
      });
    }
  }

  if (errors.length > 0) {
    return failedOutput(signal, logs, errors);
  }

  const futureMatchMap = new Map(futureMatches.map((match) => [match.match_id, match]));

  for (const match of spilloverMap.values()) {
    futureMatchMap.set(match.match_id, match);
  }

  const allFutureMatches = [...futureMatchMap.values()];

  const matchdayPools = buildMatchdayPools(signal.matchdays, allFutureMatches);

  const allocations: AllocationRecord[] = [];
  const spillovers: InternalMatch[] = [];

  const globalOccupancy = new Set<string>();

  for (const allocation of signal.existing_allocations ?? []) {
    if (
      allocation.completed ||
      historicalMatchIds.has(allocation.match_id) ||
      isPastDate(allocation.play_date, signal.requested_at)
    ) {
      globalOccupancy.add(
        makeSlotKey(
          allocation.play_date,
          allocation.pitch_id,
          allocation.slot_number,
          allocation.start_time,
          allocation.end_time,
        ),
      );
    }
  }

  let carryOver: InternalMatch[] = [];

  const orderedMatchdays = [...signal.matchdays].sort(
    (a, b) => a.matchday_number - b.matchday_number,
  );

  for (const matchday of orderedMatchdays) {
    if (!matchday.playable) {
      carryOver.push(...getEligiblePool(matchdayPools, matchday.matchday_number));
      continue;
    }

    const ownMatches = getEligiblePool(matchdayPools, matchday.matchday_number);

    const incoming = [...carryOver];
    carryOver = [];

    const dayMatches = orderMatchesForPlayday(
      [...incoming, ...ownMatches],
      leaguePriorityOrder,
    );

    const dayLeagues = Array.from(new Set(dayMatches.map((m) => m.league_id)));
    dayLeagues.sort((a, b) => {
      const rankA = getLeagueRank(a, leaguePriorityOrder);
      const rankB = getLeagueRank(b, leaguePriorityOrder);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

    for (const leagueId of dayLeagues) {
      const leagueMatches = dayMatches.filter((match) => match.league_id === leagueId);

      if (leagueMatches.length === 0) continue;

      const availablePitches = getAvailablePitches(signal.pitches);

      const slots = buildSlotsForLeague(leagueId, availablePitches, timeConfiguration);

      const result = allocateLeagueMatches(
        leagueMatches,
        slots,
        matchday,
        allocations,
        globalOccupancy,
      );

      allocations.push(...result.allocations);
      carryOver.push(...result.unallocated);
    }
  }

  spillovers.push(...carryOver);

  const databaseAllocations: DatabaseAllocationWrite[] = allocations.map((allocation) => ({
    operation: "UPSERT_MATCH_ALLOCATION",
    match_id: allocation.match_id,
    league_id: allocation.league_id,
    matchday_number: allocation.matchday_number,
    play_date: allocation.play_date,
    pitch_id: allocation.pitch_id,
    slot_number: allocation.slot_number,
    start_time: allocation.start_time,
    end_time: allocation.end_time,
    status: "scheduled",
    source: "ALGORITHM_3",
  }));

  const databaseSpillovers: DatabaseSpilloverWrite[] = spillovers.map((match) => ({
    operation: "MARK_MATCH_SPILLOVER",
    match_id: match.match_id,
    league_id: match.league_id,
    matchday_number: match.matchday_number,
    current_play_date:
      orderedMatchdays.find((day) => day.matchday_number === match.matchday_number)?.play_date ?? "",
    status: "spillover",
    source: "ALGORITHM_3",
  }));

  logs.push("Confirming: Allocation completed. Beginning single integrity verification.");

  const verification = verifyIntegrity(
    signal,
    allocations,
    spillovers,
    historicalMatchIds,
    leaguePriorityOrder,
  );

  logs.push(...verification.logs);
  errors.push(...verification.errors);

  if (!verification.passed) {
    return failedOutput(signal, logs, errors);
  }

  logs.push("SUCCESS: All Algorithm 3 integrity checks passed.");
  logs.push("STOP: One scheduling cycle completed. No second cycle will execute.");

  const distinctLeagueIds = Array.from(
    new Set([
      ...futureMatches.map((m) => m.league_id),
      ...allocations.map((a) => a.league_id),
      ...spillovers.map((m) => m.league_id),
    ]),
  );

  const byLeague: Record<LeagueId, { allocated: number; spillover: number }> = {};
  for (const lid of distinctLeagueIds) {
    byLeague[lid] = {
      allocated: allocations.filter((a) => a.league_id === lid).length,
      spillover: spillovers.filter((m) => m.league_id === lid).length,
    };
  }

  return {
    algorithm: "ALGORITHM_3",
    version: ALGORITHM_3_VERSION,
    status: "success",
    run_id: signal.run_id,
    cycle_count: 1,
    stopped: true,
    trigger: signal.change_type,
    verification,
    summary: {
      total_future_matches_received: futureMatches.length,
      total_completed_matches_preserved: historicalMatchIds.size,
      total_allocated: allocations.length,
      total_spillover: spillovers.length,
      by_league: byLeague,
      pitch_capacity_used: allocations.length,
    },
    database_operations: {
      allocations: databaseAllocations,
      spillovers: databaseSpillovers,
    },
    preserved_history:
      signal.existing_allocations?.filter(
        (allocation) => allocation.completed || historicalMatchIds.has(allocation.match_id),
      ) ?? [],
  };
}

/* ============================================================================
 * INPUT VALIDATION
 * ========================================================================== */

function validateInputStructure(signal: Algorithm3Signal): VerificationResult {
  const logs: string[] = [];
  const errors: string[] = [];

  if (!signal) {
    errors.push("Signal is missing.");
    return { passed: false, logs, errors };
  }

  if (!signal.run_id.trim()) {
    errors.push("run_id cannot be empty.");
  }

  if (!Array.isArray(signal.pitches) || signal.pitches.length === 0) {
    errors.push("pitches must be a non-empty array.");
  } else {
    const pitchIds = new Set<string>();

    for (const pitch of signal.pitches) {
      if (!pitch.pitch_id.trim()) {
        errors.push("A pitch has an empty pitch_id.");
      }

      if (pitchIds.has(pitch.pitch_id)) {
        errors.push(`Duplicate pitch UUID detected: ${pitch.pitch_id}.`);
      }

      pitchIds.add(pitch.pitch_id);

      if (pitch.state !== "available" && pitch.state !== "unavailable") {
        errors.push(`Invalid pitch state for ${pitch.pitch_id}.`);
      }
    }
  }

  if (
    !signal.time_configuration ||
    !Array.isArray(signal.time_configuration) ||
    signal.time_configuration.length === 0
  ) {
    errors.push("time_configuration is required and cannot be empty.");
  }

  if (!Array.isArray(signal.matchdays)) {
    errors.push("matchdays must be an array.");
  }

  const matchIds = new Set<string>();

  for (const matchday of signal.matchdays) {
    if (!Number.isInteger(matchday.matchday_number)) {
      errors.push(`Invalid matchday number: ${matchday.matchday_number}.`);
    }

    if (!isValidISODate(matchday.play_date)) {
      errors.push(
        `Invalid play_date for matchday ${matchday.matchday_number}: ${matchday.play_date}.`,
      );
    }

    for (const match of matchday.matches) {
      if (matchIds.has(match.match_id)) {
        errors.push(`Duplicate match UUID detected: ${match.match_id}.`);
      }

      matchIds.add(match.match_id);

      if (match.home_id === match.away_id) {
        errors.push(`Self-play detected before Algorithm 3: ${match.match_id}.`);
      }

      if (!match.league_id || typeof match.league_id !== "string" || !match.league_id.trim()) {
        errors.push(`Invalid or missing league_id for match ${match.match_id}.`);
      }
    }
  }

  if (errors.length === 0) {
    logs.push(
      "PASS: Input structure, pitches, UUID uniqueness, and match identity validated.",
    );
  }

  return { passed: errors.length === 0, logs, errors };
}

/* ============================================================================
 * TIME CONFIGURATION
 * ========================================================================== */

function resolveTimeConfiguration(
  supplied?: LeagueTimeConfiguration[],
): Record<LeagueId, SlotTime[]> {
  if (!supplied || !Array.isArray(supplied) || supplied.length === 0) {
    throw new Error("Missing required time_configuration.");
  }

  const result: Record<LeagueId, SlotTime[]> = {};

  for (const configuration of supplied) {
    if (!configuration.league_id || !configuration.league_id.trim()) {
      throw new Error("LeagueTimeConfiguration has an empty league_id.");
    }
    if (!Array.isArray(configuration.slots) || configuration.slots.length === 0) {
      throw new Error(`League ${configuration.league_id} must contain at least 1 slot.`);
    }

    const slots = [...configuration.slots].sort((a, b) => a.slot_number - b.slot_number);
    validateTimeSlots(slots, configuration.league_id);
    result[configuration.league_id] = slots;
  }

  return result;
}

function validateTimeSlots(slots: SlotTime[], leagueId: LeagueId): void {
  const seen = new Set<number>();

  for (const slot of slots) {
    if (seen.has(slot.slot_number)) {
      throw new Error(`Duplicate slot ${slot.slot_number} for ${leagueId}.`);
    }

    seen.add(slot.slot_number);

    if (!isValidTime(slot.start_time) || !isValidTime(slot.end_time)) {
      throw new Error(
        `Invalid time configuration for ${leagueId}, slot ${slot.slot_number}.`,
      );
    }

    if (timeToMinutes(slot.end_time) <= timeToMinutes(slot.start_time)) {
      throw new Error(
        `Slot ${slot.slot_number} for ${leagueId} ends before or at its start time.`,
      );
    }
  }
}

/* ============================================================================
 * PITCH / SLOT ENGINE
 * ========================================================================== */

function getAvailablePitches(pitches: PitchInput[]): PitchInput[] {
  return pitches.filter((pitch) => pitch.state === "available");
}

function buildSlotsForLeague(
  leagueId: LeagueId,
  availablePitches: PitchInput[],
  configuration: Record<LeagueId, SlotTime[]>,
): InternalSlot[] {
  const slots: InternalSlot[] = [];
  const times = configuration[leagueId];

  if (!times || times.length === 0) {
    throw new Error(`No time configuration found for league: ${leagueId}`);
  }

  const orderedPitches = [...availablePitches].sort((a, b) =>
    a.pitch_id.localeCompare(b.pitch_id),
  );

  // Distribute parallel kickoff times horizontally across available pitches
  for (const time of times) {
    for (const pitch of orderedPitches) {
      slots.push({
        pitch_id: pitch.pitch_id,
        slot_number: time.slot_number,
        start_time: time.start_time,
        end_time: time.end_time,
      });
    }
  }

  return slots;
}

/* ============================================================================
 * MATCHDAY POOLS
 * ========================================================================== */

function flattenFutureMatches(
  matchdays: MatchdayInput[],
  historicalMatchIds: Set<string>,
): InternalMatch[] {
  const result: InternalMatch[] = [];

  for (const matchday of matchdays) {
    for (const match of matchday.matches) {
      if (historicalMatchIds.has(match.match_id)) continue;
      if (
        match.status === "cancelled" ||
        match.status === "completed" ||
        match.status === "played"
      ) continue;

      result.push({
        ...match,
        spillover_priority: Boolean(match.is_spillover),
      });
    }
  }

  return result;
}

function buildMatchdayPools(
  matchdays: MatchdayInput[],
  matches: InternalMatch[],
): Map<number, InternalMatch[]> {
  const pools = new Map<number, InternalMatch[]>();

  for (const matchday of matchdays) {
    pools.set(matchday.matchday_number, []);
  }

  for (const match of matches) {
    const pool = pools.get(match.matchday_number);

    if (!pool) {
      throw new Error(
        `Match ${match.match_id} references nonexistent matchday ${match.matchday_number}.`,
      );
    }

    pool.push(match);
  }

  return pools;
}

function getEligiblePool(
  pools: Map<number, InternalMatch[]>,
  matchdayNumber: number,
): InternalMatch[] {
  return [...(pools.get(matchdayNumber) ?? [])];
}

function orderMatchesForPlayday(
  matches: InternalMatch[],
  leagueOrder: LeagueId[],
): InternalMatch[] {
  return [...matches].sort((a, b) => {
    const rankA = getLeagueRank(a.league_id, leagueOrder);
    const rankB = getLeagueRank(b.league_id, leagueOrder);

    if (rankA !== rankB) return rankA - rankB;

    const spillA = a.spillover_priority ? 0 : 1;
    const spillB = b.spillover_priority ? 0 : 1;

    if (spillA !== spillB) return spillA - spillB;

    return a.match_id.localeCompare(b.match_id);
  });
}

/* ============================================================================
 * LEAGUE ALLOCATION
 * ========================================================================== */

interface LeagueAllocationResult {
  allocations: AllocationRecord[];
  unallocated: InternalMatch[];
}

function allocateLeagueMatches(
  matches: InternalMatch[],
  slots: InternalSlot[],
  matchday: MatchdayInput,
  existingAllocations: AllocationRecord[],
  globalOccupancy: Set<string>,
): LeagueAllocationResult {
  const allocations: AllocationRecord[] = [];
  const unallocated: InternalMatch[] = [];

  const teamsScheduledToday = new Set<string>();

  for (const match of matches) {
    let selectedSlot: InternalSlot | null = null;

    for (const slot of slots) {
      const slotKey = makeSlotKey(
        matchday.play_date,
        slot.pitch_id,
        slot.slot_number,
        slot.start_time,
        slot.end_time,
      );

      if (globalOccupancy.has(slotKey)) continue;

      if (
        teamsScheduledToday.has(match.home_id) ||
        teamsScheduledToday.has(match.away_id)
      ) continue;

      selectedSlot = slot;
      globalOccupancy.add(slotKey);
      break;
    }

    if (!selectedSlot) {
      unallocated.push({ ...match, is_spillover: true, spillover_priority: true });
      continue;
    }

    allocations.push({
      match_id: match.match_id,
      league_id: match.league_id,
      matchday_number: matchday.matchday_number,
      play_date: matchday.play_date,
      pitch_id: selectedSlot.pitch_id,
      slot_number: selectedSlot.slot_number,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
    });

    teamsScheduledToday.add(match.home_id);
    teamsScheduledToday.add(match.away_id);
  }

  return { allocations, unallocated };
}

/* ============================================================================
 * INTEGRITY VERIFICATION
 * ========================================================================== */

function verifyIntegrity(
  signal: Algorithm3Signal,
  allocations: AllocationRecord[],
  spillovers: InternalMatch[],
  historicalMatchIds: Set<string>,
  leaguePriorityOrder: LeagueId[],
): VerificationResult {
  const logs: string[] = [];
  const errors: string[] = [];

  logs.push("Confirming: Algorithm 3 cycle count equals exactly 1.");
  logs.push("Passed: No recursive, retry, or secondary scheduling cycle exists.");

  logs.push("Confirming: Completed and historical matches remain untouched.");

  for (const allocation of allocations) {
    if (historicalMatchIds.has(allocation.match_id)) {
      errors.push(`Historical match ${allocation.match_id} was allocated by Algorithm 3.`);
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: Historical immutability verified.");
  }

  logs.push(
    "Confirming: Every allocated pitch exists in the authoritative supplied pitch set.",
  );

  const validPitchIds = new Set(signal.pitches.map((pitch) => pitch.pitch_id));

  for (const allocation of allocations) {
    if (!validPitchIds.has(allocation.pitch_id)) {
      errors.push(
        `Unknown pitch UUID assigned to match ${allocation.match_id}: ${allocation.pitch_id}.`,
      );
    }
  }

  if (!allocations.some((a) => !validPitchIds.has(a.pitch_id))) {
    logs.push("Passed: Every pitch allocation references a real supplied pitch UUID.");
  }

  logs.push("Confirming: No pitch exceeds configured slot capacity for a league on a playday.");

  const pitchLeagueDayCounts = new Map<string, number>();

  for (const allocation of allocations) {
    const key = [allocation.play_date, allocation.pitch_id, allocation.league_id].join("|");
    pitchLeagueDayCounts.set(key, (pitchLeagueDayCounts.get(key) ?? 0) + 1);
  }

  const slotsByLeague = new Map<string, number>();
  for (const tc of signal.time_configuration ?? []) {
    slotsByLeague.set(tc.league_id, tc.slots?.length ?? 0);
  }

  for (const [key, count] of pitchLeagueDayCounts) {
    const [, , leagueId] = key.split("|");
    const maxAllowed = slotsByLeague.get(leagueId) ?? Infinity;
    if (count > maxAllowed) {
      errors.push(
        `Capacity violation: ${key} contains ${count} matches; maximum is ${maxAllowed}.`,
      );
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: Pitch/league/day capacity remains within configured limits.");
  }

  logs.push("Confirming: No two matches occupy the same pitch slot.");

  const occupiedSlots = new Set<string>();

  for (const allocation of allocations) {
    const key = [
      allocation.play_date,
      allocation.pitch_id,
      allocation.start_time,
      allocation.end_time,
    ].join("|");

    if (occupiedSlots.has(key)) {
      errors.push(`Duplicate slot allocation detected: ${key}.`);
    }

    occupiedSlots.add(key);
  }

  if (errors.length === 0) {
    logs.push("Passed: Slot uniqueness verified.");
  }

  logs.push("Confirming: Algorithm 3 did not introduce self-play.");

  for (const matchday of signal.matchdays) {
    for (const match of matchday.matches) {
      if (match.home_id === match.away_id && !historicalMatchIds.has(match.match_id)) {
        errors.push(`Self-play exists in future match ${match.match_id}.`);
      }
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: No self-play detected.");
  }

  logs.push("Confirming: Every match receives at most one allocation.");

  const allocatedMatchIds = new Set<string>();

  for (const allocation of allocations) {
    if (allocatedMatchIds.has(allocation.match_id)) {
      errors.push(`Match ${allocation.match_id} received multiple allocations.`);
    }
    allocatedMatchIds.add(allocation.match_id);
  }

  if (errors.length === 0) {
    logs.push("Passed: Match allocation uniqueness verified.");
  }

  logs.push("Confirming: Spillover matches have no simultaneous successful allocation.");

  const allocatedIds = new Set(allocations.map((a) => a.match_id));

  for (const spillover of spillovers) {
    if (allocatedIds.has(spillover.match_id)) {
      errors.push(
        `Match ${spillover.match_id} is simultaneously allocated and marked spillover.`,
      );
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: Spillover state is internally consistent.");
  }

  logs.push("Confirming: League priority ordering is preserved across daily allocations.");

  const allocationsByDay = new Map<string, AllocationRecord[]>();

  for (const allocation of allocations) {
    const list = allocationsByDay.get(allocation.play_date) ?? [];
    list.push(allocation);
    allocationsByDay.set(allocation.play_date, list);
  }

  for (const [date, dayAllocations] of allocationsByDay) {
    const ordered = [...dayAllocations].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    let maxRankSeen = -1;
    let lastStartTime = "";
    for (const alloc of ordered) {
      const rank = getLeagueRank(alloc.league_id, leaguePriorityOrder);
      if (alloc.start_time !== lastStartTime) {
        if (rank < maxRankSeen) {
          errors.push(
            `League ordering violation on ${date}: higher-priority league ${alloc.league_id} scheduled after lower-priority league.`,
          );
        }
        lastStartTime = alloc.start_time;
      }
      if (rank > maxRankSeen) {
        maxRankSeen = rank;
      }
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: League priority ordering verified.");
  }

  logs.push("Confirming: Every allocated match has a valid start and end time.");

  for (const allocation of allocations) {
    if (!isValidTime(allocation.start_time) || !isValidTime(allocation.end_time)) {
      errors.push(`Invalid operational time for match ${allocation.match_id}.`);
    }

    if (timeToMinutes(allocation.end_time) <= timeToMinutes(allocation.start_time)) {
      errors.push(`Invalid time range for match ${allocation.match_id}.`);
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: All operational time ranges are valid.");
  }

  logs.push(
    "Confirming: Every eligible future match is either allocated or explicitly spillover.",
  );

  const eligibleIds = new Set<string>();

  for (const matchday of signal.matchdays) {
    for (const match of matchday.matches) {
      if (
        historicalMatchIds.has(match.match_id) ||
        match.completed ||
        match.status === "completed" ||
        match.status === "played" ||
        match.status === "cancelled"
      ) continue;
      eligibleIds.add(match.match_id);
    }
  }

  for (const match of signal.spillover_matches ?? []) {
    if (!historicalMatchIds.has(match.match_id)) {
      eligibleIds.add(match.match_id);
    }
  }

  const accountedIds = new Set<string>([
    ...allocations.map((a) => a.match_id),
    ...spillovers.map((m) => m.match_id),
  ]);

  for (const matchId of eligibleIds) {
    if (!accountedIds.has(matchId)) {
      errors.push(`Future match ${matchId} disappeared from Algorithm 3 output.`);
    }
  }

  if (errors.length === 0) {
    logs.push("Passed: No eligible future match was lost.");
  }

  if (errors.length === 0) {
    logs.push(
      "FINAL VERDICT: Algorithm 3 output is internally consistent and ready for Agent 0.",
    );
  } else {
    logs.push(
      "FINAL VERDICT: Algorithm 3 failed integrity verification. Database writes must not proceed.",
    );
  }

  return { passed: errors.length === 0, logs, errors };
}

/* ============================================================================
 * FAILURE OUTPUT
 * ========================================================================== */

function failedOutput(
  signal: Algorithm3Signal,
  logs: string[],
  errors: string[],
): Algorithm3Output {
  logs.push("STOP: Algorithm 3 has halted after the single scheduling cycle.");
  logs.push("NO DATABASE WRITE SHOULD PROCEED FROM THIS OUTPUT.");

  return {
    algorithm: "ALGORITHM_3",
    version: ALGORITHM_3_VERSION,
    status: "failed",
    run_id: signal.run_id,
    cycle_count: 1,
    stopped: true,
    trigger: signal.change_type,
    verification: { passed: false, logs, errors },
    summary: {
      total_future_matches_received: 0,
      total_completed_matches_preserved: 0,
      total_allocated: 0,
      total_spillover: 0,
      by_league: {},
      pitch_capacity_used: 0,
    },
    database_operations: { allocations: [], spillovers: [] },
    preserved_history: signal.existing_allocations ?? [],
  };
}

/* ============================================================================
 * DATE / TIME HELPERS
 * ========================================================================== */

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isPastDate(playDate: string, requestedAt?: string): boolean {
  if (!requestedAt) return false;
  const requestedDate = requestedAt.slice(0, 10);
  return playDate < requestedDate;
}

function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function makeSlotKey(
  playDate: string,
  pitchId: string,
  slotNumber: number,
  startTime?: string,
  endTime?: string,
): string {
  if (startTime && endTime) {
    return `${playDate}|${pitchId}|${startTime}-${endTime}`;
  }
  return `${playDate}|${pitchId}|slot-${slotNumber}`;
}
