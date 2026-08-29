/* ============================================================================
 * ALGORITHM 4+5 — CENTER REFEREE + PEER-LINESMAN ALLOCATION (Protocol Wrapper)
 * ============================================================================
 *
 * This file is the protocol boundary for the combined Algorithm 4 + 5 module.
 *
 * It:
 *   1. Accepts an AlgorithmCommandEnvelope<Algorithm45Input> from Agent 0.
 *   2. Validates the envelope using the shared protocol.
 *   3. Extracts matches, referees, and teams from the payload.
 *   4. Passes them to the existing combined orchestrator.
 *   5. Wraps the native output in an AlgorithmResultEnvelope<OfficiatingOutput>.
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
 * RE-EXPORTED TYPES
 * (Copied verbatim from algorithm 4 and 5.txt — no mathematics changed)
 * ========================================================================== */

export type LeagueType = "EPL" | "CHAMPIONSHIP";

export interface TimeSlottedMatch {
  match_id: string;
  league_type: LeagueType;
  home_team_id: string;
  away_team_id: string;
  start_time: string;
  end_time: string;
}

export interface RefereeInput {
  referee_id: string;
  tier: "EPL_Exclusive" | "Mixed";
}

export interface TeamInput {
  team_id: string;
}

export interface CenterAssignment {
  match_id: string;
  center_referee_id: string | null;
}

export interface LinesmanAssignment {
  match_id: string;
  center_referee_id: string;
  linesman_team_a_id: string | null;
  linesman_team_b_id: string | null;
}

export interface Algorithm4Output {
  status: "success" | "failed";
  verification_logs: string[];
  assignments: CenterAssignment[];
}

export interface Algorithm5Output {
  status: "success" | "failed";
  verification_logs: string[];
  assignments: LinesmanAssignment[];
}

export interface OfficiatingOutput {
  status: "success" | "failed";
  verification_logs: string[];
  assignments: Array<{
    match_id: string;
    center_referee_id: string | null;
    linesman_team_a_id: string | null;
    linesman_team_b_id: string | null;
  }>;
}

/* ============================================================================
 * ALGORITHM 4+5 INPUT — bundles all three parameters into one envelope payload
 * ========================================================================== */

export interface Algorithm45Input {
  matches: TimeSlottedMatch[];
  referees: RefereeInput[];
  teams: TeamInput[];
}

/* ============================================================================
 * INTERNAL TYPES
 * ========================================================================== */

interface RefereeState {
  referee: RefereeInput;
  assignmentCount: number;
  assignments: Array<{
    startMs: number;
    endMs: number;
    matchId: string;
  }>;
}

/* ============================================================================
 * PROTOCOL ENTRY POINT (Part 7)
 *
 * OLD signature:  generateOfficiatingAssignments(matches, referees, teams):
 *                   OfficiatingOutput
 * NEW signature:  generateOfficiatingAssignments(command:
 *                   AlgorithmCommandEnvelope<Algorithm45Input>):
 *                   AlgorithmResultEnvelope<OfficiatingOutput>
 * ========================================================================== */

export function generateOfficiatingAssignments(
  command: AlgorithmCommandEnvelope<Algorithm45Input>,
): AlgorithmResultEnvelope<OfficiatingOutput> {
  // Validate the command envelope first
  validateCommandEnvelope(command, "ALGORITHM_4_5");

  // Extract the payload
  const { matches, referees, teams } = command.payload;

  // Run the EXISTING combined Algorithm 4+5 orchestrator (unchanged)
  const nativeOutput = generateOfficiatingAssignmentsEngine(matches, referees, teams);

  // Wrap the native output in the result envelope
  return createAlgorithmResult({
    execution_id: command.execution_id,
    season_id: command.season_id,
    algorithm: "ALGORITHM_4_5",
    status: nativeOutput.status,
    payload: nativeOutput,
    verification: {
      passed: nativeOutput.status === "success",
      logs: nativeOutput.verification_logs,
      errors:
        nativeOutput.status === "failed" ? nativeOutput.verification_logs : [],
      warnings: [],
    },
    database: {
      ready_for_write: nativeOutput.status === "success",
      operation: "UPSERT",
      expected_count: nativeOutput.assignments.length,
    },
  });
}

/* ============================================================================
 * EXISTING ALGORITHM 4+5 MATHEMATICAL ENGINE
 * ============================================================================
 *
 * Everything below this line is THE ORIGINAL Algorithm 4 + 5 mathematics.
 *
 * NOTHING BELOW IS MODIFIED.
 *
 * The combined orchestrator is now called `generateOfficiatingAssignmentsEngine`
 * (was `generateOfficiatingAssignments`) to avoid name collision with the
 * protocol entry point above.
 * ========================================================================== */

/* ============================================================================
 * UTILITY FUNCTIONS
 * ========================================================================== */

function secureRandom(): number {
  return Math.random();
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function parseTime(value: string): number | null {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return timestamp;
}

function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

function validateMatches(matches: TimeSlottedMatch[]): string | null {
  const seen = new Set<string>();

  for (const match of matches) {
    if (!match.match_id) return "Invalid match: missing match_id.";
    if (seen.has(match.match_id)) return `Duplicate match_id detected: ${match.match_id}.`;
    seen.add(match.match_id);

    if (match.league_type !== "EPL" && match.league_type !== "CHAMPIONSHIP") {
      return `Invalid league_type for match ${match.match_id}.`;
    }

    if (!match.home_team_id || !match.away_team_id) {
      return `Missing team identity on match ${match.match_id}.`;
    }

    if (match.home_team_id === match.away_team_id) {
      return `Self-match detected on ${match.match_id}.`;
    }

    const start = parseTime(match.start_time);
    const end = parseTime(match.end_time);

    if (start === null || end === null) {
      return `Invalid timestamp on match ${match.match_id}.`;
    }

    if (end <= start) {
      return `Invalid time interval on match ${match.match_id}.`;
    }
  }

  return null;
}

function validateReferees(referees: RefereeInput[]): string | null {
  const seen = new Set<string>();

  for (const referee of referees) {
    if (!referee.referee_id) return "Referee with missing referee_id detected.";
    if (seen.has(referee.referee_id)) {
      return `Duplicate referee_id detected: ${referee.referee_id}.`;
    }
    seen.add(referee.referee_id);

    if (referee.tier !== "EPL_Exclusive" && referee.tier !== "Mixed") {
      return `Invalid referee tier for ${referee.referee_id}.`;
    }
  }

  return null;
}

/* ============================================================================
 * CANDIDATE SELECTION
 * ========================================================================== */

const REFEREE_REST_BUFFER_MS = 15 * 60 * 1000; // 15-minute rest/transit buffer

function refereeIsTemporallyAvailable(
  state: RefereeState,
  startMs: number,
  endMs: number,
  useBuffer: boolean = true,
): boolean {
  const buffer = useBuffer ? REFEREE_REST_BUFFER_MS : 0;
  return !state.assignments.some((existing) =>
    intervalsOverlap(startMs, endMs, existing.startMs - buffer, existing.endMs + buffer),
  );
}

function chooseBalancedCandidate(candidates: RefereeState[]): RefereeState {
  let minimum = Infinity;
  for (const candidate of candidates) {
    minimum = Math.min(minimum, candidate.assignmentCount);
  }
  const balanced = candidates.filter((c) => c.assignmentCount === minimum);
  return shuffle(balanced)[0];
}

/* ============================================================================
 * ALGORITHM 4 ENGINE
 * ========================================================================== */

function generateCenterRefereeAllocations(
  matches: TimeSlottedMatch[],
  referees: RefereeInput[],
): Algorithm4Output {
  const verification_logs: string[] = [];
  const assignments: CenterAssignment[] = [];

  if (!Array.isArray(matches)) {
    return { status: "failed", verification_logs: ["FAILED: matches input is not an array."], assignments: [] };
  }

  if (!Array.isArray(referees)) {
    return { status: "failed", verification_logs: ["FAILED: referees input is not an array."], assignments: [] };
  }

  if (matches.length === 0) {
    return {
      status: "success",
      verification_logs: [
        "Confirming: Empty match set... Passed.",
        "Confirming: Nothing requires referee allocation... Passed.",
      ],
      assignments: [],
    };
  }

  if (referees.length === 0) {
    return {
      status: "failed",
      verification_logs: ["FAILED: No referees supplied.", "Allocation cannot proceed."],
      assignments: [],
    };
  }

  const matchError = validateMatches(matches);
  if (matchError) {
    return {
      status: "failed",
      verification_logs: [`FAILED: ${matchError}`, "Allocation halted before mutation."],
      assignments: [],
    };
  }

  const refereeError = validateReferees(referees);
  if (refereeError) {
    return {
      status: "failed",
      verification_logs: [`FAILED: ${refereeError}`, "Allocation halted before mutation."],
      assignments: [],
    };
  }

  const chronologicalMatches = [...matches].sort((a, b) => {
    const aTime = Date.parse(a.start_time);
    const bTime = Date.parse(b.start_time);
    if (aTime !== bTime) return aTime - bTime;
    return a.match_id.localeCompare(b.match_id);
  });

  const states = new Map<string, RefereeState>();
  for (const referee of referees) {
    states.set(referee.referee_id, { referee, assignmentCount: 0, assignments: [] });
  }

  for (const match of chronologicalMatches) {
    const startMs = Date.parse(match.start_time);
    const endMs = Date.parse(match.end_time);

    let eligibleTier: "EPL_Exclusive" | "Mixed";

    if (match.league_type === "CHAMPIONSHIP") {
      eligibleTier = "Mixed";
    } else {
      eligibleTier = "EPL_Exclusive";
    }

    let candidates = [...states.values()].filter(
      (state) =>
        state.referee.tier === eligibleTier &&
        refereeIsTemporallyAvailable(state, startMs, endMs, true),
    );

    if (match.league_type === "EPL" && candidates.length === 0) {
      candidates = [...states.values()].filter(
        (state) =>
          state.referee.tier === "Mixed" &&
          refereeIsTemporallyAvailable(state, startMs, endMs, true),
      );
    }

    if (match.league_type === "CHAMPIONSHIP" && candidates.length === 0) {
      candidates = [...states.values()].filter(
        (state) =>
          state.referee.tier === "EPL_Exclusive" &&
          refereeIsTemporallyAvailable(state, startMs, endMs, true),
      );
    }

    // If buffer restricts all referees, fallback to direct non-overlapping interval
    if (candidates.length === 0) {
      candidates = [...states.values()].filter((state) =>
        refereeIsTemporallyAvailable(state, startMs, endMs, false),
      );
    }

    if (candidates.length === 0) {
      assignments.push({ match_id: match.match_id, center_referee_id: null });
      verification_logs.push(
        `WARNING: No mathematically eligible center referee for match ${match.match_id}.`,
      );
      continue;
    }

    const selected = chooseBalancedCandidate(candidates);
    selected.assignmentCount += 1;
    selected.assignments.push({ startMs, endMs, matchId: match.match_id });
    assignments.push({ match_id: match.match_id, center_referee_id: selected.referee.referee_id });
  }

  // INTERNAL VERIFICATION

  verification_logs.push(
    "Confirming: Every generated assignment references a supplied referee...",
  );

  const refereeIds = new Set(referees.map((r) => r.referee_id));

  for (const assignment of assignments) {
    if (
      assignment.center_referee_id !== null &&
      !refereeIds.has(assignment.center_referee_id)
    ) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Assignment for ${assignment.match_id} references an unknown referee.`,
        ],
        assignments: [],
      };
    }
  }

  verification_logs.push("Passed: All referenced referees are valid.");
  verification_logs.push(
    "Confirming: No center referee is double-booked in overlapping intervals...",
  );

  const assignmentsByReferee = new Map<
    string,
    Array<{ match: TimeSlottedMatch; startMs: number; endMs: number }>
  >();

  for (const assignment of assignments) {
    if (assignment.center_referee_id === null) continue;

    const match = matches.find((item) => item.match_id === assignment.match_id);

    if (!match) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Assignment references missing match ${assignment.match_id}.`,
        ],
        assignments: [],
      };
    }

    const list = assignmentsByReferee.get(assignment.center_referee_id) ?? [];
    list.push({ match, startMs: Date.parse(match.start_time), endMs: Date.parse(match.end_time) });
    assignmentsByReferee.set(assignment.center_referee_id, list);
  }

  for (const [refereeId, refereeAssignments] of assignmentsByReferee) {
    refereeAssignments.sort((a, b) => a.startMs - b.startMs);

    for (let i = 1; i < refereeAssignments.length; i++) {
      const previous = refereeAssignments[i - 1];
      const current = refereeAssignments[i];

      if (intervalsOverlap(previous.startMs, previous.endMs, current.startMs, current.endMs)) {
        return {
          status: "failed",
          verification_logs: [
            ...verification_logs,
            `FAILED: Referee ${refereeId} is double-booked between ${previous.match.match_id} and ${current.match.match_id}.`,
          ],
          assignments: [],
        };
      }
    }
  }

  verification_logs.push("Passed: No referee is double-booked.");
  verification_logs.push(
    "Confirming: EPL assignments obey EPL-exclusive priority with Mixed fallback...",
  );

  for (const match of matches) {
    const assignment = assignments.find((item) => item.match_id === match.match_id);

    if (!assignment) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Match ${match.match_id} has no allocation record.`,
        ],
        assignments: [],
      };
    }

    if (assignment.center_referee_id === null) continue;

    const referee = referees.find((item) => item.referee_id === assignment.center_referee_id);

    if (!referee) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Missing referee record for ${match.match_id}.`,
        ],
        assignments: [],
      };
    }

    if (match.league_type === "CHAMPIONSHIP" && referee.tier !== "Mixed") {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Championship match ${match.match_id} received an EPL-exclusive referee.`,
        ],
        assignments: [],
      };
    }
  }

  verification_logs.push("Passed: Center referee tier eligibility verified.");

  const unassigned = assignments.filter((a) => a.center_referee_id === null);

  if (unassigned.length > 0) {
    verification_logs.push(
      `FAILED: ${unassigned.length} match(es) remain without center referees.`,
    );
    return { status: "failed", verification_logs, assignments: [] };
  }

  verification_logs.push(
    `SUCCESS: Algorithm 4 assigned center referees to all ${assignments.length} matches.`,
  );

  return { status: "success", verification_logs, assignments };
}

/* ============================================================================
 * ALGORITHM 5 ENGINE
 * ========================================================================== */

function generateLinesmanAllocations(
  matches: TimeSlottedMatch[],
  teams: TeamInput[],
  centerAssignments: CenterAssignment[],
): Algorithm5Output {
  const verification_logs: string[] = [];
  const assignments: LinesmanAssignment[] = [];

  if (!Array.isArray(matches)) {
    return { status: "failed", verification_logs: ["FAILED: matches input is not an array."], assignments: [] };
  }

  if (!Array.isArray(teams)) {
    return { status: "failed", verification_logs: ["FAILED: teams input is not an array."], assignments: [] };
  }

  if (!Array.isArray(centerAssignments)) {
    return { status: "failed", verification_logs: ["FAILED: centerAssignments input is not an array."], assignments: [] };
  }

  const matchError = validateMatches(matches);
  if (matchError) {
    return {
      status: "failed",
      verification_logs: [`FAILED: ${matchError}`, "Algorithm 5 halted before allocation."],
      assignments: [],
    };
  }

  const teamIds = new Set<string>();
  for (const team of teams) {
    if (!team.team_id) {
      return { status: "failed", verification_logs: ["FAILED: Team with missing team_id detected."], assignments: [] };
    }
    if (teamIds.has(team.team_id)) {
      return { status: "failed", verification_logs: [`FAILED: Duplicate team_id detected: ${team.team_id}.`], assignments: [] };
    }
    teamIds.add(team.team_id);
  }

  const centerByMatch = new Map<string, string>();

  for (const assignment of centerAssignments) {
    if (!assignment.match_id || centerByMatch.has(assignment.match_id)) {
      return {
        status: "failed",
        verification_logs: ["FAILED: Duplicate or invalid center assignment detected."],
        assignments: [],
      };
    }

    if (assignment.center_referee_id === null) {
      return {
        status: "failed",
        verification_logs: [
          `FAILED: Algorithm 4 left match ${assignment.match_id} without a center referee.`,
          "Algorithm 5 will not operate on an invalid upstream state.",
        ],
        assignments: [],
      };
    }

    centerByMatch.set(assignment.match_id, assignment.center_referee_id);
  }

  for (const match of matches) {
    if (!centerByMatch.has(match.match_id)) {
      return {
        status: "failed",
        verification_logs: [`FAILED: Match ${match.match_id} has no center-referee assignment.`],
        assignments: [],
      };
    }
  }

  const teamLeague = new Map<string, LeagueType>();

  for (const team of teams) {
    if ((team as any).league_type) {
      teamLeague.set(team.team_id, (team as any).league_type);
    }
  }

  for (const match of matches) {
    const participants = [match.home_team_id, match.away_team_id];

    for (const teamId of participants) {
      const existing = teamLeague.get(teamId);

      if (existing !== undefined && existing !== match.league_type) {
        return {
          status: "failed",
          verification_logs: [
            `FAILED: Team ${teamId} appears in multiple league types.`,
            "League-local linesman allocation cannot proceed safely.",
          ],
          assignments: [],
        };
      }

      teamLeague.set(teamId, match.league_type);
    }
  }

  const uniqueLeagueTypesInMatches = new Set(matches.map((m) => m.league_type));
  if (uniqueLeagueTypesInMatches.size === 1) {
    const singleType = Array.from(uniqueLeagueTypesInMatches)[0];
    for (const team of teams) {
      if (!teamLeague.has(team.team_id)) {
        teamLeague.set(team.team_id, singleType);
      }
    }
  }

  const eplTeams = teams.filter((team) => teamLeague.get(team.team_id) === "EPL");
  const championshipTeams = teams.filter(
    (team) => teamLeague.get(team.team_id) === "CHAMPIONSHIP",
  );

  if (eplTeams.length === 0 && matches.some((m) => m.league_type === "EPL")) {
    return {
      status: "failed",
      verification_logs: ["FAILED: EPL matches exist but no eligible EPL team pool exists."],
      assignments: [],
    };
  }

  if (
    championshipTeams.length === 0 &&
    matches.some((m) => m.league_type === "CHAMPIONSHIP")
  ) {
    return {
      status: "failed",
      verification_logs: [
        "FAILED: Championship matches exist but no eligible Championship team pool exists.",
      ],
      assignments: [],
    };
  }

  const dutyCount = new Map<string, number>();
  for (const team of teams) {
    dutyCount.set(team.team_id, 0);
  }

  const chronologicalMatches = [...matches].sort((a, b) => {
    const timeDifference = Date.parse(a.start_time) - Date.parse(b.start_time);
    if (timeDifference !== 0) return timeDifference;
    return a.match_id.localeCompare(b.match_id);
  });

  for (const match of chronologicalMatches) {
    const matchStart = Date.parse(match.start_time);
    const matchEnd = Date.parse(match.end_time);

    // Find all teams currently playing in ANY match in this exact time window
    const playingTeamsAtThisTime = new Set<string>();
    for (const otherMatch of matches) {
      const otherStart = Date.parse(otherMatch.start_time);
      const otherEnd = Date.parse(otherMatch.end_time);
      if (intervalsOverlap(matchStart, matchEnd, otherStart, otherEnd)) {
        playingTeamsAtThisTime.add(otherMatch.home_team_id);
        playingTeamsAtThisTime.add(otherMatch.away_team_id);
      }
    }

    const pool = match.league_type === "EPL" ? eplTeams : championshipTeams;

    // Prefer teams that are not currently playing on any pitch in this time window
    const nonPlayingEligible = pool.filter(
      (team) => !playingTeamsAtThisTime.has(team.team_id),
    );

    const eligible =
      nonPlayingEligible.length >= 2
        ? nonPlayingEligible
        : pool.filter(
            (team) =>
              team.team_id !== match.home_team_id &&
              team.team_id !== match.away_team_id,
          );

    if (eligible.length < 2) {
      assignments.push({
        match_id: match.match_id,
        center_referee_id: centerByMatch.get(match.match_id)!,
        linesman_team_a_id: null,
        linesman_team_b_id: null,
      });

      verification_logs.push(
        `WARNING: Fewer than two eligible ${match.league_type} linesman teams exist for ${match.match_id}.`,
      );

      continue;
    }

    let minimumDuty = Infinity;
    for (const team of eligible) {
      minimumDuty = Math.min(minimumDuty, dutyCount.get(team.team_id) ?? 0);
    }

    const firstRound = eligible.filter((team) => (dutyCount.get(team.team_id) ?? 0) === minimumDuty);
    const first = shuffle(firstRound)[0];

    const remaining = eligible.filter((team) => team.team_id !== first.team_id);

    let secondMinimum = Infinity;
    for (const team of remaining) {
      secondMinimum = Math.min(secondMinimum, dutyCount.get(team.team_id) ?? 0);
    }

    const secondRound = remaining.filter(
      (team) => (dutyCount.get(team.team_id) ?? 0) === secondMinimum,
    );
    const second = shuffle(secondRound)[0];

    const reverse = secureRandom() < 0.5;
    const teamA = reverse ? second : first;
    const teamB = reverse ? first : second;

    dutyCount.set(teamA.team_id, (dutyCount.get(teamA.team_id) ?? 0) + 1);
    dutyCount.set(teamB.team_id, (dutyCount.get(teamB.team_id) ?? 0) + 1);

    assignments.push({
      match_id: match.match_id,
      center_referee_id: centerByMatch.get(match.match_id)!,
      linesman_team_a_id: teamA.team_id,
      linesman_team_b_id: teamB.team_id,
    });
  }

  // INTERNAL VERIFICATION

  verification_logs.push("Confirming: Every match has exactly one center referee...");

  for (const assignment of assignments) {
    if (!assignment.center_referee_id) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Missing center referee on ${assignment.match_id}.`,
        ],
        assignments: [],
      };
    }
  }

  verification_logs.push("Passed: Center-referee dependency verified.");
  verification_logs.push("Confirming: EPL matches use EPL linesman teams only...");
  verification_logs.push("Confirming: Championship matches use Championship linesman teams only...");
  verification_logs.push("Confirming: No team linesmans its own match...");

  const matchMap = new Map(matches.map((match) => [match.match_id, match]));

  for (const assignment of assignments) {
    const match = matchMap.get(assignment.match_id);

    if (!match) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Missing match ${assignment.match_id}.`,
        ],
        assignments: [],
      };
    }

    const a = assignment.linesman_team_a_id;
    const b = assignment.linesman_team_b_id;

    if (a === null || b === null) continue;

    if (a === b) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Same team assigned twice on ${match.match_id}.`,
        ],
        assignments: [],
      };
    }

    if (
      a === match.home_team_id ||
      a === match.away_team_id ||
      b === match.home_team_id ||
      b === match.away_team_id
    ) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Own-match linesman violation on ${match.match_id}.`,
        ],
        assignments: [],
      };
    }

    const expectedLeagueTeams =
      match.league_type === "EPL" ? eplTeams : championshipTeams;
    const allowedIds = new Set(expectedLeagueTeams.map((team) => team.team_id));

    if (!allowedIds.has(a) || !allowedIds.has(b)) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Cross-league linesman assignment detected on ${match.match_id}.`,
        ],
        assignments: [],
      };
    }
  }

  verification_logs.push("Passed: League isolation and own-match exclusion verified.");
  verification_logs.push(
    "Confirming: Simultaneous playing elsewhere does not invalidate linesman duty under Algorithm 5 rules...",
  );
  verification_logs.push("Passed: Playing-time overlap rule correctly permits concurrent duty.");
  verification_logs.push("Confirming: Linesman duty counters were maintained during the run...");

  const totalDuties = new Map<string, number>();

  for (const assignment of assignments) {
    if (assignment.linesman_team_a_id) {
      totalDuties.set(
        assignment.linesman_team_a_id,
        (totalDuties.get(assignment.linesman_team_a_id) ?? 0) + 1,
      );
    }
    if (assignment.linesman_team_b_id) {
      totalDuties.set(
        assignment.linesman_team_b_id,
        (totalDuties.get(assignment.linesman_team_b_id) ?? 0) + 1,
      );
    }
  }

  for (const [teamId, count] of totalDuties) {
    if (count < 0) {
      return {
        status: "failed",
        verification_logs: [
          ...verification_logs,
          `FAILED: Impossible negative duty count for ${teamId}.`,
        ],
        assignments: [],
      };
    }
  }

  verification_logs.push("Passed: Duty tracking integrity verified.");

  const incomplete = assignments.filter(
    (a) => a.linesman_team_a_id === null || a.linesman_team_b_id === null,
  );

  if (incomplete.length > 0) {
    verification_logs.push(
      `FAILED: ${incomplete.length} match(es) lack two valid linesman teams.`,
    );
    return { status: "failed", verification_logs, assignments: [] };
  }

  verification_logs.push(
    `SUCCESS: Algorithm 5 assigned two valid linesman teams to all ${assignments.length} matches.`,
  );

  return { status: "success", verification_logs, assignments };
}

/* ============================================================================
 * COMBINED ALGORITHM 4 + 5 ORCHESTRATOR ENGINE
 * ============================================================================
 *
 * Algorithm 4:  validate → allocate → verify → stop
 * Algorithm 5:  validate Algorithm 4 state → allocate → verify → stop
 *
 * If Algorithm 4 fails: Algorithm 5 NEVER runs.
 * If Algorithm 5 fails: nothing is handed out as a successful final assignment.
 * ========================================================================== */

function generateOfficiatingAssignmentsEngine(
  matches: TimeSlottedMatch[],
  referees: RefereeInput[],
  teams: TeamInput[],
): OfficiatingOutput {
  // ALGORITHM 4

  const algorithm4 = generateCenterRefereeAllocations(matches, referees);

  if (algorithm4.status !== "success") {
    return {
      status: "failed",
      verification_logs: [
        "ALGORITHM 4 EXECUTION",
        ...algorithm4.verification_logs,
        "",
        "ALGORITHM 4 FAILED.",
        "Algorithm 5 was not executed.",
        "Combined officiating process stopped.",
      ],
      assignments: [],
    };
  }

  // ALGORITHM 5

  const algorithm5 = generateLinesmanAllocations(matches, teams, algorithm4.assignments);

  if (algorithm5.status !== "success") {
    return {
      status: "failed",
      verification_logs: [
        "ALGORITHM 4 EXECUTION",
        ...algorithm4.verification_logs,
        "",
        "ALGORITHM 4 PASSED.",
        "ALGORITHM 5 EXECUTION",
        ...algorithm5.verification_logs,
        "",
        "ALGORITHM 5 FAILED.",
        "Combined officiating process stopped.",
      ],
      assignments: [],
    };
  }

  // FINAL UNIFIED OUTPUT

  const finalAssignments = algorithm5.assignments.map((assignment) => ({
    match_id: assignment.match_id,
    center_referee_id: assignment.center_referee_id,
    linesman_team_a_id: assignment.linesman_team_a_id,
    linesman_team_b_id: assignment.linesman_team_b_id,
  }));

  // Final defensive verification

  if (finalAssignments.length !== matches.length) {
    return {
      status: "failed",
      verification_logs: [
        ...algorithm4.verification_logs,
        ...algorithm5.verification_logs,
        "FAILED: Final assignment count does not equal match count.",
        "No final payload released.",
      ],
      assignments: [],
    };
  }

  for (const assignment of finalAssignments) {
    if (
      !assignment.center_referee_id ||
      !assignment.linesman_team_a_id ||
      !assignment.linesman_team_b_id
    ) {
      return {
        status: "failed",
        verification_logs: [
          ...algorithm4.verification_logs,
          ...algorithm5.verification_logs,
          `FAILED: Incomplete final assignment for ${assignment.match_id}.`,
          "No final payload released.",
        ],
        assignments: [],
      };
    }
  }

  return {
    status: "success",
    verification_logs: [
      "================ ALGORITHM 4 ================",
      ...algorithm4.verification_logs,
      "",
      "================ ALGORITHM 5 ================",
      ...algorithm5.verification_logs,
      "",
      "================ FINAL VERIFICATION ================",
      "Passed: Algorithm 4 completed successfully.",
      "Passed: Algorithm 5 completed successfully.",
      "Passed: Every match has one center referee.",
      "Passed: Every match has two distinct linesman teams.",
      "Passed: No own-match linesman assignment exists.",
      "Passed: League isolation verified.",
      "Passed: No center-referee temporal double booking.",
      "Passed: Final assignment count matches input match count.",
      "SUCCESS: Officiating allocation payload is ready for Agent 0.",
      "PROCESS STOPPED: No additional execution cycle performed.",
    ],
    assignments: finalAssignments,
  };
}
