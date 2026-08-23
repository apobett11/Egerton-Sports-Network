/**
 * MATCH LIVE INPUT + REFEREE RECONCILIATION ENGINE
 * ------------------------------------------------
 * Purpose:
 *   Algorithm 1 for a football match platform.
 *
 * Owns:
 *   - match-start activation
 *   - journalist live-event intake
 *   - live event correction/cancellation
 *   - live snapshot generation
 *   - referee prefill/reconciliation
 *   - referee event add/update/remove/clear
 *   - second-yellow => red derivation
 *   - match cancellation
 *   - walkover (3-0, no goal scorer)
 *   - normal referee confirmation
 *   - canonical permanent result creation
 *   - realtime/webhook publication after commit
 *
 * Does NOT own:
 *   - league-table calculations
 *   - player-stat propagation
 *   - fixture generation
 *   - unrelated dashboard updates
 *
 * Boundary:
 *   Algorithm 2 reads the canonical permanent result produced here.
 *
 * IMPORTANT:
 *   The repository interface is deliberately abstract because the existing
 *   website schema/module names are not included in this prompt. The engine
 *   is designed to sit over Supabase/Postgres, but does not invent table names.
 */

//////////////////////////////
// 1. DOMAIN TYPES
//////////////////////////////

export type UID = string;

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALF_TIME"
  | "SECOND_HALF"
  | "FULL_TIME"
  | "UNDER_REVIEW"
  | "FINALIZED"
  | "WALKOVER"
  | "CANCELLED"
  | "LOCKED";

export type EventStatus = "ACTIVE" | "CANCELLED";

export type ActorRole = "JOURNALIST" | "REFEREE";

export type EventType = "GOAL" | "CARD" | "INJURY";

export type GoalType =
  | "PENALTY"
  | "HEADER"
  | "FREE_KICK"
  | "TAP_IN"
  | "SCREAMER"
  | "OTHER";

export type CardType =
  | "YELLOW"
  | "SECOND_YELLOW"
  | "RED";

export type Period =
  | "FIRST_HALF"
  | "HALF_TIME"
  | "SECOND_HALF"
  | "FULL_TIME";

export type TerminalOutcome = "NORMAL" | "WALKOVER" | "CANCELLED";

export interface Match {
  match_uid: UID;
  home_team_uid: UID;
  away_team_uid: UID;
  scheduled_start_at: string;
  status: MatchStatus;
  started_at: string | null;
  finalized_at: string | null;
  locked_at: string | null;
  home_score: number;
  away_score: number;
  version: number;
}

export interface SquadPlayer {
  player_uid: UID;
  team_uid: UID;
  jersey_number: number;
  display_name: string;
  is_starting_xi: boolean;
  is_substitute: boolean;
  eligible_for_match: boolean;
}

export interface MatchSquad {
  squad_uid: UID;
  match_uid: UID;
  team_uid: UID;
  players: SquadPlayer[];
}

export interface MatchEvent {
  event_uid: UID;
  match_uid: UID;

  // Identity is ALWAYS match_uid + event_uid.
  team_uid: UID;

  player_uid: UID | null;

  type: EventType;

  goal_type?: GoalType;
  card_type?: CardType;

  /**
   * Journalist may leave player_uid null.
   * Referee may resolve it from jersey number.
   */
  player_number?: number | null;

  /**
   * Match minute can be approximate during live reporting.
   * Referee may correct it.
   */
  minute: number | null;

  period: Period | null;

  /**
   * For injury, player is optional.
   */
  injury_player_optional: boolean;

  status: EventStatus;

  /**
   * True if a red outcome is derived from a second yellow sequence.
   * This is NOT a second database event.
   */
  derived_red: boolean;

  /**
   * Source metadata is descriptive/audit information only.
   * It is NEVER used to identify the match.
   */
  created_by_uid: UID;
  last_modified_by_uid: UID;
  created_by_role: ActorRole;
  last_modified_by_role: ActorRole;

  idempotency_key: string;

  created_at: string;
  updated_at: string;
}

export interface LiveMatchState {
  match_uid: UID;

  status: MatchStatus;
  period: Period | null;

  home_score: number;
  away_score: number;

  active_events: MatchEvent[];

  version: number;
  updated_at: string;

  /**
   * Incremented for every committed mutation of the live state.
   */
  event_sequence: number;
}

export interface RefereeWorkingSet {
  match_uid: UID;
  events: MatchEvent[];

  home_score: number;
  away_score: number;

  period: Period | null;

  base_live_version: number;

  opened_at: string;
  opened_by_uid: UID;
}

export interface CanonicalPermanentResult {
  match_uid: UID;

  outcome: TerminalOutcome;

  home_team_uid: UID;
  away_team_uid: UID;

  home_score: number;
  away_score: number;

  /**
   * NORMAL:
   *   Contains authoritative final events.
   *
   * WALKOVER:
   *   Empty event list unless future rules explicitly add non-goal events.
   *
   * CANCELLED:
   *   Empty event list.
   */
  events: MatchEvent[];

  /**
   * Canonical final squads attached to the match.
   * Algorithm 2 may consume them without knowing who produced them.
   */
  squads: MatchSquad[];

  confirmed_by_uid: UID;
  confirmed_at: string;

  source_live_version: number;

  /**
   * Snapshot intended for easy history retrieval.
   */
  history_snapshot: {
    match_uid: UID;
    outcome: TerminalOutcome;
    home_score: number;
    away_score: number;
    events: MatchEvent[];
    squads: MatchSquad[];
    generated_at: string;
  };
}

//////////////////////////////
// 2. COMMAND TYPES
//////////////////////////////

export interface StartMatchCommand {
  match_uid: UID;
  now?: string;
}

export interface JournalistAddGoalCommand {
  match_uid: UID;
  journalist_uid: UID;
  team_uid: UID;
  goal_type: GoalType;
  minute?: number;
  period?: Period;
  idempotency_key: string;
}

export interface JournalistAddCardCommand {
  match_uid: UID;
  journalist_uid: UID;
  team_uid: UID;
  card_type: CardType;
  minute?: number;
  period?: Period;
  idempotency_key: string;
}

export interface JournalistAddInjuryCommand {
  match_uid: UID;
  journalist_uid: UID;
  team_uid: UID;
  player_uid?: UID;
  minute?: number;
  period?: Period;
  idempotency_key: string;
}

export interface JournalistUpdateEventCommand {
  match_uid: UID;
  journalist_uid: UID;
  event_uid: UID;

  goal_type?: GoalType;
  card_type?: CardType;
  player_uid?: UID | null;
  minute?: number | null;
  period?: Period | null;

  idempotency_key: string;
}

export interface JournalistCancelEventCommand {
  match_uid: UID;
  journalist_uid: UID;
  event_uid: UID;
  idempotency_key: string;
}

export interface JournalistSetPeriodCommand {
  match_uid: UID;
  journalist_uid: UID;
  period: Period;
  idempotency_key: string;
}

export interface RefereeOpenCommand {
  match_uid: UID;
  referee_uid: UID;
}

export interface RefereeAddEventCommand {
  match_uid: UID;
  referee_uid: UID;

  team_uid: UID;
  player_number?: number;
  player_uid?: UID;

  type: EventType;
  goal_type?: GoalType;
  card_type?: CardType;

  minute?: number | null;
  period?: Period | null;

  injury_player_optional?: boolean;

  idempotency_key: string;
}

export interface RefereeUpdateEventCommand {
  match_uid: UID;
  referee_uid: UID;
  event_uid: UID;

  player_number?: number | null;
  player_uid?: UID | null;

  goal_type?: GoalType;
  card_type?: CardType;

  minute?: number | null;
  period?: Period | null;

  idempotency_key: string;
}

export interface RefereeRemoveEventCommand {
  match_uid: UID;
  referee_uid: UID;
  event_uid: UID;
  idempotency_key: string;
}

export interface RefereeClearEventsCommand {
  match_uid: UID;
  referee_uid: UID;
  idempotency_key: string;
}

export interface RefereeCancelMatchCommand {
  match_uid: UID;
  referee_uid: UID;
  idempotency_key: string;
}

export interface RefereeWalkoverCommand {
  match_uid: UID;
  referee_uid: UID;
  winning_team_uid: UID;
  idempotency_key: string;
}

export interface RefereeConfirmNormalResultCommand {
  match_uid: UID;
  referee_uid: UID;

  /**
   * The referee may confirm once the match has reached FULL_TIME.
   * The command intentionally does not accept a raw score:
   * score is derived from the authoritative final events.
   */
  idempotency_key: string;
}

//////////////////////////////
// 3. FAILURE MODEL
//////////////////////////////

export class MatchEngineError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "MatchEngineError";
  }
}

//////////////////////////////
// 4. REPOSITORY CONTRACT
//////////////////////////////

/**
 * Implement this over the existing DB.
 *
 * Every method that mutates data must be safe inside the provided
 * transaction. For Postgres/Supabase, the production adapter should
 * use database transactions / RPCs where required.
 */
export interface MatchRepository {
  transaction<T>(
    match_uid: UID,
    fn: (tx: MatchRepository) => Promise<T>
  ): Promise<T>;

  getMatchForUpdate(match_uid: UID): Promise<Match>;

  getMatch(match_uid: UID): Promise<Match>;

  saveMatch(match: Match): Promise<void>;

  getSquads(match_uid: UID): Promise<MatchSquad[]>;

  getSquadPlayers(match_uid: UID, team_uid: UID): Promise<SquadPlayer[]>;

  getLiveState(match_uid: UID): Promise<LiveMatchState | null>;

  saveLiveState(state: LiveMatchState): Promise<void>;

  getLiveEvent(match_uid: UID, event_uid: UID): Promise<MatchEvent | null>;

  getLiveEvents(match_uid: UID): Promise<MatchEvent[]>;

  getEventByIdempotencyKey(
    match_uid: UID,
    idempotency_key: string
  ): Promise<MatchEvent | null>;

  insertLiveEvent(event: MatchEvent): Promise<void>;

  updateLiveEvent(event: MatchEvent): Promise<void>;

  insertLiveAudit(entry: LiveAuditEntry): Promise<void>;

  saveRefereeWorkingSet(set: RefereeWorkingSet): Promise<void>;

  getRefereeWorkingSet(match_uid: UID): Promise<RefereeWorkingSet | null>;

  /**
   * Canonical permanent result.
   * Algorithm 2 can consume this without knowing whether it originated
   * from journalist data, referee edits, or a walkover.
   */
  saveCanonicalPermanentResult(
    result: CanonicalPermanentResult
  ): Promise<void>;

  getCanonicalPermanentResult(
    match_uid: UID
  ): Promise<CanonicalPermanentResult | null>;

  /**
   * Final history snapshot for easy retrieval.
   */
  saveHistorySnapshot(
    snapshot: CanonicalPermanentResult["history_snapshot"]
  ): Promise<void>;

  markFinalResultCommitted(
    match_uid: UID,
    outcome: TerminalOutcome,
    final_status: MatchStatus,
    finalized_at: string
  ): Promise<void>;

  /**
   * After permanent commit, temporary live state may be archived/removed.
   * The production adapter should make this safe and idempotent.
   */
  archiveLiveState(match_uid: UID, archived_at: string): Promise<void>;

  hasFinalizationCommand(
    match_uid: UID,
    idempotency_key: string
  ): Promise<boolean>;

  recordFinalizationCommand(
    match_uid: UID,
    idempotency_key: string,
    result_uid: UID,
    now: string
  ): Promise<void>;
}

export interface LiveAuditEntry {
  audit_uid: UID;
  match_uid: UID;
  event_uid: UID | null;
  actor_uid: UID;
  actor_role: ActorRole;

  action:
    | "MATCH_STARTED"
    | "EVENT_CREATED"
    | "EVENT_UPDATED"
    | "EVENT_CANCELLED"
    | "PERIOD_CHANGED"
    | "REFEREE_OPENED"
    | "REFEREE_EVENT_ADDED"
    | "REFEREE_EVENT_UPDATED"
    | "REFEREE_EVENT_REMOVED"
    | "REFEREE_EVENTS_CLEARED"
    | "MATCH_CANCELLED"
    | "WALKOVER"
    | "NORMAL_FINALIZED";

  payload: Record<string, unknown>;
  created_at: string;
}

//////////////////////////////
// 5. PUBLICATION CONTRACT
//////////////////////////////

export interface MatchUpdateEnvelope {
  type:
    | "MATCH_STARTED"
    | "LIVE_EVENT_CREATED"
    | "LIVE_EVENT_UPDATED"
    | "LIVE_EVENT_CANCELLED"
    | "MATCH_PERIOD_CHANGED"
    | "REFEREE_PREFILL_READY"
    | "MATCH_CANCELLED"
    | "MATCH_WALKOVER"
    | "MATCH_FINALIZED";

  match_uid: UID;

  version: number;

  occurred_at: string;

  payload: Record<string, unknown>;
}

export interface MatchPublisher {
  publishRealtime(update: MatchUpdateEnvelope): Promise<void>;

  /**
   * Future notification system can subscribe here.
   * This is intentionally an event contract, not a notification implementation.
   */
  publishWebhook(update: MatchUpdateEnvelope): Promise<void>;
}

//////////////////////////////
// 6. UID / TIME / VALIDATION
//////////////////////////////

export function requireUID(value: unknown, name: string): UID {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MatchEngineError(
      "INVALID_UID",
      `${name} must be a non-empty UID.`
    );
  }

  return value.trim();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseTime(value: string): number {
  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    throw new MatchEngineError(
      "INVALID_TIMESTAMP",
      `Invalid timestamp: ${value}`
    );
  }

  return time;
}

export function ensureMatchIdentity(
  match: Match,
  match_uid: UID
): void {
  if (match.match_uid !== match_uid) {
    throw new MatchEngineError(
      "MATCH_ID_MISMATCH",
      "The loaded match does not match the requested match UID."
    );
  }
}

export function assertTwoDifferentTeams(match: Match): void {
  if (match.home_team_uid === match.away_team_uid) {
    throw new MatchEngineError(
      "INVALID_FIXTURE",
      "A match cannot have the same home and away team."
    );
  }
}

export function assertTeamBelongsToMatch(
  match: Match,
  team_uid: UID
): void {
  if (
    team_uid !== match.home_team_uid &&
    team_uid !== match.away_team_uid
  ) {
    throw new MatchEngineError(
      "TEAM_NOT_IN_MATCH",
      `Team ${team_uid} does not belong to match ${match.match_uid}.`
    );
  }
}

export function assertPlayerBelongsToTeam(
  player: SquadPlayer,
  team_uid: UID
): void {
  if (player.team_uid !== team_uid) {
    throw new MatchEngineError(
      "PLAYER_TEAM_MISMATCH",
      `Player ${player.player_uid} does not belong to team ${team_uid}.`
    );
  }
}

export function assertEventWithinMatch(
  event: MatchEvent,
  match_uid: UID
): void {
  if (event.match_uid !== match_uid) {
    throw new MatchEngineError(
      "EVENT_MATCH_MISMATCH",
      "Event does not belong to the requested match."
    );
  }
}

export function assertMatchStarted(
  match: Match,
  now: string
): void {
  const nowMs = parseTime(now);
  const startMs = parseTime(match.scheduled_start_at);

  /**
   * The official configured match start time is the trigger.
   * At/after start time, the match may enter LIVE.
   */
  if (nowMs < startMs) {
    throw new MatchEngineError(
      "MATCH_NOT_STARTED",
      "This operation is not permitted before the scheduled match start time.",
      {
        scheduled_start_at: match.scheduled_start_at,
        now
      }
    );
  }
}

export function assertLiveJournalistWindow(
  match: Match,
  now: string
): void {
  assertMatchStarted(match, now);

  const allowed: MatchStatus[] = [
    "LIVE",
    "HALF_TIME",
    "SECOND_HALF",
    "FULL_TIME",
    "UNDER_REVIEW"
  ];

  /**
   * Journalist input remains available from the start trigger until
   * referee terminal confirmation. After finalization/lock it stops.
   */
  if (!allowed.includes(match.status)) {
    throw new MatchEngineError(
      "JOURNALIST_WINDOW_CLOSED",
      `Journalist input is unavailable while match status is ${match.status}.`
    );
  }
}

export function assertRefereeActionWindow(
  match: Match,
  now: string
): void {
  assertMatchStarted(match, now);

  if (
    match.status === "FINALIZED" ||
    match.status === "LOCKED" ||
    match.status === "CANCELLED" ||
    match.status === "WALKOVER"
  ) {
    throw new MatchEngineError(
      "MATCH_TERMINAL",
      `Match ${match.match_uid} is already terminal (${match.status}).`
    );
  }
}

export function assertNormalFinalizationWindow(match: Match): void {
  if (match.status !== "FULL_TIME") {
    throw new MatchEngineError(
      "FULL_TIME_REQUIRED",
      "Normal referee confirmation requires FULL_TIME."
    );
  }
}

//////////////////////////////
// 7. EVENT VALIDATION
//////////////////////////////

export function assertGoalType(
  value: unknown
): asserts value is GoalType {
  const valid: GoalType[] = [
    "PENALTY",
    "HEADER",
    "FREE_KICK",
    "TAP_IN",
    "SCREAMER",
    "OTHER"
  ];

  if (!valid.includes(value as GoalType)) {
    throw new MatchEngineError(
      "INVALID_GOAL_TYPE",
      `Unsupported goal type: ${String(value)}`
    );
  }
}

export function assertCardType(
  value: unknown
): asserts value is CardType {
  const valid: CardType[] = [
    "YELLOW",
    "SECOND_YELLOW",
    "RED"
  ];

  if (!valid.includes(value as CardType)) {
    throw new MatchEngineError(
      "INVALID_CARD_TYPE",
      `Unsupported card type: ${String(value)}`
    );
  }
}

export function assertPeriod(
  value: Period | null | undefined
): void {
  if (value === undefined || value === null) return;

  const valid: Period[] = [
    "FIRST_HALF",
    "HALF_TIME",
    "SECOND_HALF",
    "FULL_TIME"
  ];

  if (!valid.includes(value)) {
    throw new MatchEngineError(
      "INVALID_PERIOD",
      `Unsupported period: ${String(value)}`
    );
  }
}

export function assertMinute(
  minute: number | null | undefined
): void {
  if (minute === undefined || minute === null) return;

  if (!Number.isInteger(minute) || minute < 0 || minute > 200) {
    throw new MatchEngineError(
      "INVALID_MINUTE",
      "Match minute must be an integer between 0 and 200."
    );
  }
}

//////////////////////////////
// 8. MATCH EVENT FACTORIES
//////////////////////////////

function createEventBase(input: {
  match_uid: UID;
  team_uid: UID;
  actor_uid: UID;
  role: ActorRole;
  idempotency_key: string;
  now: string;
}): Omit<
  MatchEvent,
  | "event_uid"
  | "type"
  | "goal_type"
  | "card_type"
  | "player_uid"
  | "player_number"
  | "minute"
  | "period"
  | "injury_player_optional"
  | "derived_red"
> {
  return {
    match_uid: requireUID(input.match_uid, "match_uid"),
    team_uid: requireUID(input.team_uid, "team_uid"),
    status: "ACTIVE",
    created_by_uid: requireUID(input.actor_uid, "actor_uid"),
    last_modified_by_uid: requireUID(input.actor_uid, "actor_uid"),
    created_by_role: input.role,
    last_modified_by_role: input.role,
    idempotency_key: requireUID(
      input.idempotency_key,
      "idempotency_key"
    ),
    created_at: input.now,
    updated_at: input.now
  };
}

export function buildGoalEvent(input: {
  match_uid: UID;
  team_uid: UID;
  actor_uid: UID;
  role: ActorRole;
  goal_type: GoalType;
  minute?: number;
  period?: Period;
  idempotency_key: string;
  now: string;
  player_uid?: UID | null;
}): MatchEvent {
  assertGoalType(input.goal_type);
  assertMinute(input.minute);
  assertPeriod(input.period);

  const base = createEventBase(input);

  return {
    ...base,
    event_uid: crypto.randomUUID(),
    type: "GOAL",
    goal_type: input.goal_type,
    player_uid: input.player_uid ?? null,
    player_number: null,
    minute: input.minute ?? null,
    period: input.period ?? null,
    injury_player_optional: false,
    derived_red: false
  };
}

export function buildCardEvent(input: {
  match_uid: UID;
  team_uid: UID;
  actor_uid: UID;
  role: ActorRole;
  card_type: CardType;
  minute?: number;
  period?: Period;
  idempotency_key: string;
  now: string;
  player_uid?: UID | null;
  player_number?: number | null;
}): MatchEvent {
  assertCardType(input.card_type);
  assertMinute(input.minute);
  assertPeriod(input.period);

  const base = createEventBase(input);

  return {
    ...base,
    event_uid: crypto.randomUUID(),
    type: "CARD",
    card_type: input.card_type,
    player_uid: input.player_uid ?? null,
    player_number: input.player_number ?? null,
    minute: input.minute ?? null,
    period: input.period ?? null,
    injury_player_optional: false,
    derived_red: false
  };
}

export function buildInjuryEvent(input: {
  match_uid: UID;
  team_uid: UID;
  actor_uid: UID;
  role: ActorRole;
  player_uid?: UID | null;
  minute?: number;
  period?: Period;
  idempotency_key: string;
  now: string;
}): MatchEvent {
  assertMinute(input.minute);
  assertPeriod(input.period);

  const base = createEventBase(input);

  return {
    ...base,
    event_uid: crypto.randomUUID(),
    type: "INJURY",
    player_uid: input.player_uid ?? null,
    player_number: null,
    minute: input.minute ?? null,
    period: input.period ?? null,
    injury_player_optional: true,
    derived_red: false
  };
}

//////////////////////////////
// 9. DERIVED DISCIPLINARY LOGIC
//////////////////////////////

/**
 * Important:
 *   The first yellow is never deleted because of a second yellow.
 *   The second yellow remains an event.
 *   A red consequence is derived from the active card sequence.
 *
 * We do not create a second "fake" red database event. Instead,
 * derived_red marks the second-yellow event as producing the red outcome.
 */
export function recomputeDisciplinaryConsequences(
  events: MatchEvent[]
): MatchEvent[] {
  const cloned = events.map((event) => ({
    ...event,
    derived_red: false
  }));

  const byPlayer = new Map<UID, MatchEvent[]>();

  for (const event of cloned) {
    if (
      event.status !== "ACTIVE" ||
      event.type !== "CARD" ||
      !event.player_uid
    ) {
      continue;
    }

    const list = byPlayer.get(event.player_uid) ?? [];
    list.push(event);
    byPlayer.set(event.player_uid, list);
  }

  for (const playerEvents of byPlayer.values()) {
    const yellows = playerEvents
      .filter(
        (event) =>
          event.card_type === "YELLOW" ||
          event.card_type === "SECOND_YELLOW"
      )
      .sort((a, b) => {
        const aMinute = a.minute ?? Number.MAX_SAFE_INTEGER;
        const bMinute = b.minute ?? Number.MAX_SAFE_INTEGER;
        return aMinute - bMinute;
      });

    if (yellows.length >= 2) {
      const secondYellow = yellows[1];
      secondYellow.derived_red = true;
      secondYellow.card_type = "SECOND_YELLOW";
    }
  }

  return cloned;
}

//////////////////////////////
// 10. SCORE CALCULATION
//////////////////////////////

export function calculateLiveScore(
  match: Match,
  events: MatchEvent[]
): { home_score: number; away_score: number } {
  let home = 0;
  let away = 0;

  for (const event of events) {
    if (
      event.status !== "ACTIVE" ||
      event.type !== "GOAL"
    ) {
      continue;
    }

    if (event.team_uid === match.home_team_uid) home += 1;
    if (event.team_uid === match.away_team_uid) away += 1;
  }

  return {
    home_score: home,
    away_score: away
  };
}

//////////////////////////////
// 11. MAIN ENGINE
//////////////////////////////

export class MatchLiveInputEngine {
  private readonly repo: MatchRepository;
  private readonly publisher: MatchPublisher;

  constructor(
    repo: MatchRepository,
    publisher: MatchPublisher
  ) {
    this.repo = repo;
    this.publisher = publisher;
  }

  ////////////////////////////
  // 11.1 START MATCH
  ////////////////////////////

  /**
   * Trigger:
   *   scheduled_start_at is reached.
   *
   * This function is idempotent.
   */
  async startMatch(
    command: StartMatchCommand
  ): Promise<LiveMatchState> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const now = command.now ?? nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertTwoDifferentTeams(match);
      assertMatchStarted(match, now);

      if (
        match.status === "FINALIZED" ||
        match.status === "LOCKED" ||
        match.status === "WALKOVER" ||
        match.status === "CANCELLED"
      ) {
        const existing = await tx.getLiveState(match_uid);

        if (!existing) {
          throw new MatchEngineError(
            "MATCH_TERMINAL_NO_LIVE_STATE",
            "Terminal match cannot be activated."
          );
        }

        return existing;
      }

      const existingLive = await tx.getLiveState(match_uid);

      if (existingLive) {
        return existingLive;
      }

      match.status = "LIVE";
      match.started_at = match.started_at ?? now;
      match.version += 1;

      await tx.saveMatch(match);

      const state: LiveMatchState = {
        match_uid,
        status: "LIVE",
        period: "FIRST_HALF",
        home_score: 0,
        away_score: 0,
        active_events: [],
        version: 1,
        updated_at: now,
        event_sequence: 0
      };

      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: "SYSTEM",
        actor_role: "JOURNALIST",
        action: "MATCH_STARTED",
        payload: {
          scheduled_start_at: match.scheduled_start_at
        },
        created_at: now
      });

      return state;
    }).then(async (state) => {
      await this.publisher.publishRealtime({
        type: "MATCH_STARTED",
        match_uid,
        version: state.version,
        occurred_at: now,
        payload: {
          status: state.status,
          period: state.period
        }
      });

      await this.publisher.publishWebhook({
        type: "MATCH_STARTED",
        match_uid,
        version: state.version,
        occurred_at: now,
        payload: {
          status: state.status,
          period: state.period
        }
      });

      return state;
    });
  }

  ////////////////////////////
  // 11.2 JOURNALIST ADD GOAL
  ////////////////////////////

  async journalistAddGoal(
    command: JournalistAddGoalCommand
  ): Promise<MatchEvent> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    const team_uid = requireUID(command.team_uid, "team_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);
      assertTeamBelongsToMatch(match, team_uid);

      const existing = await tx.getEventByIdempotencyKey(
        match_uid,
        command.idempotency_key
      );

      if (existing) {
        return existing;
      }

      const event = buildGoalEvent({
        match_uid,
        team_uid,
        actor_uid: journalist_uid,
        role: "JOURNALIST",
        goal_type: command.goal_type,
        minute: command.minute,
        period: command.period,
        idempotency_key: command.idempotency_key,
        now
      });

      await tx.insertLiveEvent(event);

      const state = await this.rebuildLiveState(tx, match, now);

      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: event.event_uid,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "EVENT_CREATED",
        payload: {
          type: event.type,
          goal_type: event.goal_type
        },
        created_at: now
      });

      return event;
    }).then(async (event) => {
      const state = await this.repo.getLiveState(match_uid);

      await this.publishLiveMutation(
        "LIVE_EVENT_CREATED",
        match_uid,
        state?.version ?? 0,
        now,
        {
          event_uid: event.event_uid,
          event_type: event.type,
          goal_type: event.goal_type,
          team_uid: event.team_uid
        }
      );

      return event;
    });
  }

  ////////////////////////////
  // 11.3 JOURNALIST ADD CARD
  ////////////////////////////

  async journalistAddCard(
    command: JournalistAddCardCommand
  ): Promise<MatchEvent> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    const team_uid = requireUID(command.team_uid, "team_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);
      assertTeamBelongsToMatch(match, team_uid);

      const existing = await tx.getEventByIdempotencyKey(
        match_uid,
        command.idempotency_key
      );

      if (existing) {
        return existing;
      }

      const event = buildCardEvent({
        match_uid,
        team_uid,
        actor_uid: journalist_uid,
        role: "JOURNALIST",
        card_type: command.card_type,
        minute: command.minute,
        period: command.period,
        idempotency_key: command.idempotency_key,
        now
      });

      await tx.insertLiveEvent(event);

      const state = await this.rebuildLiveState(tx, match, now);
      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: event.event_uid,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "EVENT_CREATED",
        payload: {
          type: event.type,
          card_type: event.card_type
        },
        created_at: now
      });

      return event;
    }).then(async (event) => {
      const state = await this.repo.getLiveState(match_uid);

      await this.publishLiveMutation(
        "LIVE_EVENT_CREATED",
        match_uid,
        state?.version ?? 0,
        now,
        {
          event_uid: event.event_uid,
          event_type: event.type,
          card_type: event.card_type,
          team_uid: event.team_uid
        }
      );

      return event;
    });
  }

  ////////////////////////////
  // 11.4 JOURNALIST ADD INJURY
  ////////////////////////////

  async journalistAddInjury(
    command: JournalistAddInjuryCommand
  ): Promise<MatchEvent> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    const team_uid = requireUID(command.team_uid, "team_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);
      assertTeamBelongsToMatch(match, team_uid);

      const existing = await tx.getEventByIdempotencyKey(
        match_uid,
        command.idempotency_key
      );

      if (existing) {
        return existing;
      }

      if (command.player_uid) {
        await this.assertPlayerIsInMatchSquad(
          tx,
          match_uid,
          team_uid,
          command.player_uid
        );
      }

      const event = buildInjuryEvent({
        match_uid,
        team_uid,
        actor_uid: journalist_uid,
        role: "JOURNALIST",
        player_uid: command.player_uid ?? null,
        minute: command.minute,
        period: command.period,
        idempotency_key: command.idempotency_key,
        now
      });

      await tx.insertLiveEvent(event);

      const state = await this.rebuildLiveState(tx, match, now);
      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: event.event_uid,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "EVENT_CREATED",
        payload: {
          type: event.type,
          player_uid: event.player_uid
        },
        created_at: now
      });

      return event;
    }).then(async (event) => {
      const state = await this.repo.getLiveState(match_uid);

      await this.publishLiveMutation(
        "LIVE_EVENT_CREATED",
        match_uid,
        state?.version ?? 0,
        now,
        {
          event_uid: event.event_uid,
          event_type: event.type,
          player_uid: event.player_uid,
          team_uid: event.team_uid
        }
      );

      return event;
    });
  }

  ////////////////////////////
  // 11.5 JOURNALIST UPDATE
  ////////////////////////////

  async journalistUpdateEvent(
    command: JournalistUpdateEventCommand
  ): Promise<MatchEvent> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const event_uid = requireUID(command.event_uid, "event_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);

      const event = await tx.getLiveEvent(
        match_uid,
        event_uid
      );

      if (!event) {
        throw new MatchEngineError(
          "EVENT_NOT_FOUND",
          `Live event ${event_uid} does not exist.`
        );
      }

      assertEventWithinMatch(event, match_uid);

      if (event.status === "CANCELLED") {
        throw new MatchEngineError(
          "EVENT_CANCELLED",
          "Cancelled events cannot be edited. Create a new event instead."
        );
      }

      if (command.goal_type !== undefined) {
        if (event.type !== "GOAL") {
          throw new MatchEngineError(
            "INVALID_EVENT_UPDATE",
            "goal_type can only be changed on a goal."
          );
        }

        assertGoalType(command.goal_type);
        event.goal_type = command.goal_type;
      }

      if (command.card_type !== undefined) {
        if (event.type !== "CARD") {
          throw new MatchEngineError(
            "INVALID_EVENT_UPDATE",
            "card_type can only be changed on a card."
          );
        }

        assertCardType(command.card_type);
        event.card_type = command.card_type;
      }

      if (command.player_uid !== undefined) {
        if (
          event.type !== "GOAL" &&
          event.type !== "CARD" &&
          event.type !== "INJURY"
        ) {
          throw new MatchEngineError(
            "INVALID_EVENT_UPDATE",
            "player_uid is not valid for this event."
          );
        }

        if (command.player_uid !== null) {
          await this.assertPlayerIsInMatchSquad(
            tx,
            match_uid,
            event.team_uid,
            command.player_uid
          );
        }

        event.player_uid = command.player_uid;
      }

      if (command.minute !== undefined) {
        assertMinute(command.minute);
        event.minute = command.minute;
      }

      if (command.period !== undefined) {
        assertPeriod(command.period);
        event.period = command.period;
      }

      event.last_modified_by_uid = journalist_uid;
      event.last_modified_by_role = "JOURNALIST";
      event.updated_at = now;

      await tx.updateLiveEvent(event);

      const state = await this.rebuildLiveState(tx, match, now);
      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "EVENT_UPDATED",
        payload: {
          event: structuredClone(event)
        },
        created_at: now
      });

      return event;
    }).then(async (event) => {
      const state = await this.repo.getLiveState(match_uid);

      await this.publishLiveMutation(
        "LIVE_EVENT_UPDATED",
        match_uid,
        state?.version ?? 0,
        now,
        {
          event_uid: event.event_uid
        }
      );

      return event;
    });
  }

  ////////////////////////////
  // 11.6 JOURNALIST CANCEL
  ////////////////////////////

  async journalistCancelEvent(
    command: JournalistCancelEventCommand
  ): Promise<void> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const event_uid = requireUID(command.event_uid, "event_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    const now = nowIso();

    await this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);

      const event = await tx.getLiveEvent(
        match_uid,
        event_uid
      );

      if (!event) {
        throw new MatchEngineError(
          "EVENT_NOT_FOUND",
          `Live event ${event_uid} does not exist.`
        );
      }

      assertEventWithinMatch(event, match_uid);

      if (event.status === "CANCELLED") {
        return;
      }

      event.status = "CANCELLED";
      event.last_modified_by_uid = journalist_uid;
      event.last_modified_by_role = "JOURNALIST";
      event.updated_at = now;

      await tx.updateLiveEvent(event);

      const state = await this.rebuildLiveState(tx, match, now);
      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "EVENT_CANCELLED",
        payload: {
          cancelled_event: event_uid
        },
        created_at: now
      });
    });

    const state = await this.repo.getLiveState(match_uid);

    await this.publishLiveMutation(
      "LIVE_EVENT_CANCELLED",
      match_uid,
      state?.version ?? 0,
      now,
      {
        event_uid
      }
    );
  }

  ////////////////////////////
  // 11.7 JOURNALIST PERIOD
  ////////////////////////////

  async journalistSetPeriod(
    command: JournalistSetPeriodCommand
  ): Promise<LiveMatchState> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const journalist_uid = requireUID(
      command.journalist_uid,
      "journalist_uid"
    );
    assertPeriod(command.period);

    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertLiveJournalistWindow(match, now);

      const allowedTransitions: Record<
        MatchStatus,
        Partial<Record<Period, MatchStatus>>
      > = {
        SCHEDULED: {
          FIRST_HALF: "LIVE"
        },
        LIVE: {
          HALF_TIME: "HALF_TIME",
          SECOND_HALF: "SECOND_HALF",
          FULL_TIME: "FULL_TIME"
        },
        HALF_TIME: {
          SECOND_HALF: "SECOND_HALF"
        },
        SECOND_HALF: {
          FULL_TIME: "FULL_TIME"
        },
        FULL_TIME: {},
        UNDER_REVIEW: {},
        FINALIZED: {},
        WALKOVER: {},
        CANCELLED: {},
        LOCKED: {}
      };

      const newStatus =
        allowedTransitions[match.status]?.[command.period];

      if (!newStatus) {
        /**
         * Allow idempotent setting of the already-current state.
         */
        if (
          (match.status === "LIVE" &&
            command.period === "FIRST_HALF") ||
          (match.status === "HALF_TIME" &&
            command.period === "HALF_TIME") ||
          (match.status === "SECOND_HALF" &&
            command.period === "SECOND_HALF") ||
          (match.status === "FULL_TIME" &&
            command.period === "FULL_TIME")
        ) {
          const state = await this.ensureAndGetLiveState(
            tx,
            match,
            now
          );
          return state;
        }

        throw new MatchEngineError(
          "INVALID_PERIOD_TRANSITION",
          `Cannot move match from ${match.status} to ${command.period}.`
        );
      }

      match.status = newStatus;
      match.version += 1;

      await tx.saveMatch(match);

      const state = await this.rebuildLiveState(tx, match, now);
      state.period = command.period;
      state.status = newStatus;
      state.version += 1;
      state.updated_at = now;

      await tx.saveLiveState(state);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: journalist_uid,
        actor_role: "JOURNALIST",
        action: "PERIOD_CHANGED",
        payload: {
          period: command.period
        },
        created_at: now
      });

      return state;
    }).then(async (state) => {
      await this.publishLiveMutation(
        "MATCH_PERIOD_CHANGED",
        match_uid,
        state.version,
        now,
        {
          status: state.status,
          period: state.period
        }
      );

      return state;
    });
  }

  ////////////////////////////
  // 11.8 REFEREE OPEN/PREFILL
  ////////////////////////////

  async refereeOpenMatch(
    command: RefereeOpenCommand
  ): Promise<RefereeWorkingSet> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );

    const now = nowIso();

    const result = await this.repo.transaction(
      match_uid,
      async (tx) => {
        const match = await tx.getMatchForUpdate(match_uid);

        ensureMatchIdentity(match, match_uid);
        assertRefereeActionWindow(match, now);

        const existing = await tx.getRefereeWorkingSet(
          match_uid
        );

        if (existing) {
          return existing;
        }

        const liveEvents = await tx.getLiveEvents(
          match_uid
        );

        const activeEvents =
          recomputeDisciplinaryConsequences(
            liveEvents.filter(
              (event) => event.status === "ACTIVE"
            )
          );

        const score = this.calculateScoreFromEvents(
          match,
          activeEvents
        );

        const state = await this.ensureAndGetLiveState(
          tx,
          match,
          now
        );

        const workingSet: RefereeWorkingSet = {
          match_uid,
          events: activeEvents,
          home_score: score.home_score,
          away_score: score.away_score,
          period: state.period,
          base_live_version: state.version,
          opened_at: now,
          opened_by_uid: referee_uid
        };

        await tx.saveRefereeWorkingSet(workingSet);

        await tx.insertLiveAudit({
          audit_uid: crypto.randomUUID(),
          match_uid,
          event_uid: null,
          actor_uid: referee_uid,
          actor_role: "REFEREE",
          action: "REFEREE_OPENED",
          payload: {
            prefilling_events: activeEvents.length,
            live_version: state.version
          },
          created_at: now
        });

        return workingSet;
      }
    );

    await this.publisher.publishRealtime({
      type: "REFEREE_PREFILL_READY",
      match_uid,
      version: result.base_live_version,
      occurred_at: now,
      payload: {
        event_count: result.events.length
      }
    });

    return result;
  }

  ////////////////////////////
  // 11.9 REFEREE ADD EVENT
  ////////////////////////////

  async refereeAddEvent(
    command: RefereeAddEventCommand
  ): Promise<MatchEvent> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const team_uid = requireUID(command.team_uid, "team_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);
      assertTeamBelongsToMatch(match, team_uid);

      const existingCommand = await tx.getEventByIdempotencyKey(
        match_uid,
        command.idempotency_key
      );

      if (existingCommand) {
        return existingCommand;
      }

      const workingSet = await this.ensureRefereeWorkingSet(
        tx,
        match,
        referee_uid,
        now
      );

      const resolvedPlayer = await this.resolveRefereePlayer(
        tx,
        match_uid,
        team_uid,
        command.player_uid,
        command.player_number,
        command.type
      );

      const event: MatchEvent =
        command.type === "GOAL"
          ? buildGoalEvent({
              match_uid,
              team_uid,
              actor_uid: referee_uid,
              role: "REFEREE",
              goal_type:
                command.goal_type ?? "OTHER",
              minute:
                command.minute ?? undefined,
              period:
                command.period ?? undefined,
              idempotency_key: command.idempotency_key,
              now,
              player_uid:
                resolvedPlayer?.player_uid ?? null
            })
          : command.type === "CARD"
          ? buildCardEvent({
              match_uid,
              team_uid,
              actor_uid: referee_uid,
              role: "REFEREE",
              card_type:
                command.card_type ?? "YELLOW",
              minute:
                command.minute ?? undefined,
              period:
                command.period ?? undefined,
              idempotency_key: command.idempotency_key,
              now,
              player_uid:
                resolvedPlayer?.player_uid ?? null,
              player_number:
                resolvedPlayer?.jersey_number ??
                null
            })
          : buildInjuryEvent({
              match_uid,
              team_uid,
              actor_uid: referee_uid,
              role: "REFEREE",
              player_uid:
                resolvedPlayer?.player_uid ?? null,
              minute:
                command.minute ?? undefined,
              period:
                command.period ?? undefined,
              idempotency_key: command.idempotency_key,
              now
            });

      workingSet.events.push(event);

      const normalized = recomputeDisciplinaryConsequences(
        workingSet.events
      );

      workingSet.events = normalized;

      const score = this.calculateScoreFromEvents(
        match,
        normalized
      );

      workingSet.home_score = score.home_score;
      workingSet.away_score = score.away_score;
      workingSet.base_live_version = (
        await this.ensureAndGetLiveState(
          tx,
          match,
          now
        )
      ).version;

      await tx.saveRefereeWorkingSet(workingSet);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: event.event_uid,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "REFEREE_EVENT_ADDED",
        payload: {
          type: event.type
        },
        created_at: now
      });

      return event;
    });
  }

  ////////////////////////////
  // 11.10 REFEREE UPDATE
  ////////////////////////////

  async refereeUpdateEvent(
    command: RefereeUpdateEventCommand
  ): Promise<RefereeWorkingSet> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const event_uid = requireUID(command.event_uid, "event_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);

      const workingSet = await this.ensureRefereeWorkingSet(
        tx,
        match,
        referee_uid,
        now
      );

      const event = workingSet.events.find(
        (candidate) =>
          candidate.event_uid === event_uid &&
          candidate.status === "ACTIVE"
      );

      if (!event) {
        throw new MatchEngineError(
          "EVENT_NOT_FOUND",
          `Event ${event_uid} does not exist in the referee working set.`
        );
      }

      if (command.player_uid !== undefined ||
          command.player_number !== undefined) {
        const resolved = await this.resolveRefereePlayer(
          tx,
          match_uid,
          event.team_uid,
          command.player_uid ?? undefined,
          command.player_number ?? undefined,
          event.type
        );

        event.player_uid =
          resolved?.player_uid ?? null;
        event.player_number =
          resolved?.jersey_number ?? null;
      }

      if (command.goal_type !== undefined) {
        if (event.type !== "GOAL") {
          throw new MatchEngineError(
            "INVALID_EVENT_UPDATE",
            "goal_type can only be changed on GOAL."
          );
        }

        assertGoalType(command.goal_type);
        event.goal_type = command.goal_type;
      }

      if (command.card_type !== undefined) {
        if (event.type !== "CARD") {
          throw new MatchEngineError(
            "INVALID_EVENT_UPDATE",
            "card_type can only be changed on CARD."
          );
        }

        assertCardType(command.card_type);
        event.card_type = command.card_type;
      }

      if (command.minute !== undefined) {
        assertMinute(command.minute);
        event.minute = command.minute;
      }

      if (command.period !== undefined) {
        assertPeriod(command.period);
        event.period = command.period;
      }

      event.last_modified_by_uid = referee_uid;
      event.last_modified_by_role = "REFEREE";
      event.updated_at = now;

      workingSet.events =
        recomputeDisciplinaryConsequences(
          workingSet.events
        );

      const score = this.calculateScoreFromEvents(
        match,
        workingSet.events
      );

      workingSet.home_score = score.home_score;
      workingSet.away_score = score.away_score;

      await tx.saveRefereeWorkingSet(workingSet);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "REFEREE_EVENT_UPDATED",
        payload: {
          event_uid
        },
        created_at: now
      });

      return workingSet;
    });
  }

  ////////////////////////////
  // 11.11 REFEREE REMOVE
  ////////////////////////////

  async refereeRemoveEvent(
    command: RefereeRemoveEventCommand
  ): Promise<RefereeWorkingSet> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const event_uid = requireUID(command.event_uid, "event_uid");
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);

      const workingSet = await this.ensureRefereeWorkingSet(
        tx,
        match,
        referee_uid,
        now
      );

      const target = workingSet.events.find(
        (event) => event.event_uid === event_uid
      );

      if (!target) {
        throw new MatchEngineError(
          "EVENT_NOT_FOUND",
          `Event ${event_uid} does not exist in the working set.`
        );
      }

      target.status = "CANCELLED";
      target.last_modified_by_uid = referee_uid;
      target.last_modified_by_role = "REFEREE";
      target.updated_at = now;

      workingSet.events =
        recomputeDisciplinaryConsequences(
          workingSet.events
        );

      const score = this.calculateScoreFromEvents(
        match,
        workingSet.events
      );

      workingSet.home_score = score.home_score;
      workingSet.away_score = score.away_score;

      await tx.saveRefereeWorkingSet(workingSet);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "REFEREE_EVENT_REMOVED",
        payload: {},
        created_at: now
      });

      return workingSet;
    });
  }

  ////////////////////////////
  // 11.12 REFEREE CLEAR
  ////////////////////////////

  async refereeClearEvents(
    command: RefereeClearEventsCommand
  ): Promise<RefereeWorkingSet> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);

      const workingSet = await this.ensureRefereeWorkingSet(
        tx,
        match,
        referee_uid,
        now
      );

      for (const event of workingSet.events) {
        event.status = "CANCELLED";
        event.last_modified_by_uid = referee_uid;
        event.last_modified_by_role = "REFEREE";
        event.updated_at = now;
      }

      workingSet.events = [];
      workingSet.home_score = 0;
      workingSet.away_score = 0;

      await tx.saveRefereeWorkingSet(workingSet);

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "REFEREE_EVENTS_CLEARED",
        payload: {
          cleared_count: workingSet.events.length
        },
        created_at: now
      });

      return workingSet;
    });
  }

  ////////////////////////////
  // 11.13 REFEREE CANCEL MATCH
  ////////////////////////////

  /**
   * Independent pipeline.
   *
   * It does not use event processing, normal finalization, or walkover.
   */
  async refereeCancelMatch(
    command: RefereeCancelMatchCommand
  ): Promise<CanonicalPermanentResult> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);

      const alreadyFinalized = await tx.hasFinalizationCommand(
        match_uid,
        command.idempotency_key
      );

      if (alreadyFinalized) {
        const existing =
          await tx.getCanonicalPermanentResult(match_uid);

        if (!existing) {
          throw new MatchEngineError(
            "FINALIZATION_RECORD_MISSING",
            "Idempotent cancellation exists but the canonical result is missing."
          );
        }

        return existing;
      }

      const squads = await tx.getSquads(match_uid);

      const result: CanonicalPermanentResult = {
        match_uid,
        outcome: "CANCELLED",
        home_team_uid: match.home_team_uid,
        away_team_uid: match.away_team_uid,
        home_score: 0,
        away_score: 0,
        events: [],
        squads,
        confirmed_by_uid: referee_uid,
        confirmed_at: now,
        source_live_version:
          (await tx.getLiveState(match_uid))?.version ?? 0,
        history_snapshot: {
          match_uid,
          outcome: "CANCELLED",
          home_score: 0,
          away_score: 0,
          events: [],
          squads,
          generated_at: now
        }
      };

      match.status = "CANCELLED";
      match.home_score = 0;
      match.away_score = 0;
      match.finalized_at = now;
      match.locked_at = now;
      match.version += 1;

      await tx.saveMatch(match);
      await tx.saveCanonicalPermanentResult(result);
      await tx.saveHistorySnapshot(result.history_snapshot);
      await tx.markFinalResultCommitted(
        match_uid,
        "CANCELLED",
        "LOCKED",
        now
      );
      await tx.archiveLiveState(match_uid, now);
      await tx.recordFinalizationCommand(
        match_uid,
        command.idempotency_key,
        crypto.randomUUID(),
        now
      );

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "MATCH_CANCELLED",
        payload: {},
        created_at: now
      });

      return result;
    }).then(async (result) => {
      await this.publisher.publishRealtime({
        type: "MATCH_CANCELLED",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          outcome: result.outcome
        }
      });

      await this.publisher.publishWebhook({
        type: "MATCH_CANCELLED",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          outcome: result.outcome
        }
      });

      return result;
    });
  }

  ////////////////////////////
  // 11.14 WALKOVER PIPELINE
  ////////////////////////////

  /**
   * Independent pipeline.
   *
   * Rules:
   *   - match must have started
   *   - referee selects exactly one winning team
   *   - winning team receives 3
   *   - losing team receives 0
   *   - the 3 goals have NO PLAYER
   *   - no goal events are created for the 3 goals
   *   - no journalist events are carried into the permanent result
   *   - match becomes terminal
   *
   * This is deliberately separate from normal match finalization.
   */
  async refereeDeclareWalkover(
    command: RefereeWalkoverCommand
  ): Promise<CanonicalPermanentResult> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );
    const winning_team_uid = requireUID(
      command.winning_team_uid,
      "winning_team_uid"
    );

    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);
      assertTeamBelongsToMatch(match, winning_team_uid);

      const losing_team_uid =
        winning_team_uid === match.home_team_uid
          ? match.away_team_uid
          : match.home_team_uid;

      if (winning_team_uid === losing_team_uid) {
        throw new MatchEngineError(
          "INVALID_WALKOVER_WINNER",
          "Winning team and losing team cannot be the same team."
        );
      }

      const alreadyFinalized = await tx.hasFinalizationCommand(
        match_uid,
        command.idempotency_key
      );

      if (alreadyFinalized) {
        const existing =
          await tx.getCanonicalPermanentResult(match_uid);

        if (!existing) {
          throw new MatchEngineError(
            "FINALIZATION_RECORD_MISSING",
            "Idempotent walkover exists but canonical result is missing."
          );
        }

        return existing;
      }

      const homeWins =
        winning_team_uid === match.home_team_uid;

      const squads = await tx.getSquads(match_uid);

      const result: CanonicalPermanentResult = {
        match_uid,
        outcome: "WALKOVER",
        home_team_uid: match.home_team_uid,
        away_team_uid: match.away_team_uid,
        home_score: homeWins ? 3 : 0,
        away_score: homeWins ? 0 : 3,
        /**
         * Intentionally empty.
         * Walkover goals are administrative score, not scored events.
         */
        events: [],
        squads,
        confirmed_by_uid: referee_uid,
        confirmed_at: now,
        source_live_version:
          (await tx.getLiveState(match_uid))?.version ?? 0,
        history_snapshot: {
          match_uid,
          outcome: "WALKOVER",
          home_score: homeWins ? 3 : 0,
          away_score: homeWins ? 0 : 3,
          events: [],
          squads,
          generated_at: now
        }
      };

      match.status = "WALKOVER";
      match.home_score = result.home_score;
      match.away_score = result.away_score;
      match.finalized_at = now;
      match.locked_at = now;
      match.version += 1;

      await tx.saveMatch(match);
      await tx.saveCanonicalPermanentResult(result);
      await tx.saveHistorySnapshot(result.history_snapshot);
      await tx.markFinalResultCommitted(
        match_uid,
        "WALKOVER",
        "LOCKED",
        now
      );
      await tx.archiveLiveState(match_uid, now);
      await tx.recordFinalizationCommand(
        match_uid,
        command.idempotency_key,
        crypto.randomUUID(),
        now
      );

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "WALKOVER",
        payload: {
          winning_team_uid,
          losing_team_uid,
          administrative_score: "3-0"
        },
        created_at: now
      });

      return result;
    }).then(async (result) => {
      await this.publisher.publishRealtime({
        type: "MATCH_WALKOVER",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          winning_team_uid,
          home_score: result.home_score,
          away_score: result.away_score,
          goals_are_administrative: true
        }
      });

      await this.publisher.publishWebhook({
        type: "MATCH_WALKOVER",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          winning_team_uid,
          home_score: result.home_score,
          away_score: result.away_score,
          goals_are_administrative: true
        }
      });

      return result;
    });
  }

  ////////////////////////////
  // 11.15 NORMAL FINALIZATION
  ////////////////////////////

  /**
   * Independent from walkover and cancellation.
   *
   * The referee confirms the reconciled result.
   * Algorithm 1 stops at this boundary.
   */
  async refereeConfirmNormalResult(
    command: RefereeConfirmNormalResultCommand
  ): Promise<CanonicalPermanentResult> {
    const match_uid = requireUID(command.match_uid, "match_uid");
    const referee_uid = requireUID(
      command.referee_uid,
      "referee_uid"
    );

    const now = nowIso();

    return this.repo.transaction(match_uid, async (tx) => {
      const match = await tx.getMatchForUpdate(match_uid);

      ensureMatchIdentity(match, match_uid);
      assertRefereeActionWindow(match, now);
      assertNormalFinalizationWindow(match);

      const alreadyFinalized = await tx.hasFinalizationCommand(
        match_uid,
        command.idempotency_key
      );

      if (alreadyFinalized) {
        const existing =
          await tx.getCanonicalPermanentResult(match_uid);

        if (!existing) {
          throw new MatchEngineError(
            "FINALIZATION_RECORD_MISSING",
            "Idempotent finalization exists but canonical result is missing."
          );
        }

        return existing;
      }

      const workingSet =
        await this.ensureRefereeWorkingSet(
          tx,
          match,
          referee_uid,
          now
        );

      const activeEvents =
        recomputeDisciplinaryConsequences(
          workingSet.events.filter(
            (event) => event.status === "ACTIVE"
          )
        );

      await this.validateFinalEventSet(
        tx,
        match,
        activeEvents
      );

      const score =
        this.calculateScoreFromEvents(
          match,
          activeEvents
        );

      const squads = await tx.getSquads(match_uid);

      const result: CanonicalPermanentResult = {
        match_uid,
        outcome: "NORMAL",
        home_team_uid: match.home_team_uid,
        away_team_uid: match.away_team_uid,
        home_score: score.home_score,
        away_score: score.away_score,
        events: activeEvents,
        squads,
        confirmed_by_uid: referee_uid,
        confirmed_at: now,
        source_live_version:
          workingSet.base_live_version,
        history_snapshot: {
          match_uid,
          outcome: "NORMAL",
          home_score: score.home_score,
          away_score: score.away_score,
          events: activeEvents,
          squads,
          generated_at: now
        }
      };

      match.status = "FINALIZED";
      match.home_score = score.home_score;
      match.away_score = score.away_score;
      match.finalized_at = now;
      match.locked_at = now;
      match.version += 1;

      await tx.saveMatch(match);

      /**
       * One canonical result is committed here.
       * Algorithm 2 can consume this result from the database.
       */
      await tx.saveCanonicalPermanentResult(result);
      await tx.saveHistorySnapshot(result.history_snapshot);

      await tx.markFinalResultCommitted(
        match_uid,
        "NORMAL",
        "LOCKED",
        now
      );

      await tx.archiveLiveState(match_uid, now);

      await tx.recordFinalizationCommand(
        match_uid,
        command.idempotency_key,
        crypto.randomUUID(),
        now
      );

      await tx.insertLiveAudit({
        audit_uid: crypto.randomUUID(),
        match_uid,
        event_uid: null,
        actor_uid: referee_uid,
        actor_role: "REFEREE",
        action: "NORMAL_FINALIZED",
        payload: {
          home_score: score.home_score,
          away_score: score.away_score,
          event_count: activeEvents.length
        },
        created_at: now
      });

      return result;
    }).then(async (result) => {
      await this.publisher.publishRealtime({
        type: "MATCH_FINALIZED",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          outcome: result.outcome,
          home_score: result.home_score,
          away_score: result.away_score
        }
      });

      await this.publisher.publishWebhook({
        type: "MATCH_FINALIZED",
        match_uid,
        version: 1,
        occurred_at: now,
        payload: {
          outcome: result.outcome,
          home_score: result.home_score,
          away_score: result.away_score
        }
      });

      return result;
    });
  }

  ////////////////////////////
  // 11.16 INTERNAL HELPERS
  ////////////////////////////

  private async publishLiveMutation(
    type:
      | "LIVE_EVENT_CREATED"
      | "LIVE_EVENT_UPDATED"
      | "LIVE_EVENT_CANCELLED"
      | "MATCH_PERIOD_CHANGED",
    match_uid: UID,
    version: number,
    occurred_at: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const update: MatchUpdateEnvelope = {
      type,
      match_uid,
      version,
      occurred_at,
      payload
    };

    /**
     * The publication occurs ONLY after the database transaction
     * has committed.
     */
    await Promise.all([
      this.publisher.publishRealtime(update),
      this.publisher.publishWebhook(update)
    ]);
  }

  private async rebuildLiveState(
    tx: MatchRepository,
    match: Match,
    now: string
  ): Promise<LiveMatchState> {
    const existing =
      await tx.getLiveState(match.match_uid);

    const events = await tx.getLiveEvents(
      match.match_uid
    );

    const activeEvents =
      recomputeDisciplinaryConsequences(
        events.filter(
          (event) => event.status === "ACTIVE"
        )
      );

    const score =
      this.calculateScoreFromEvents(
        match,
        activeEvents
      );

    const nextVersion =
      (existing?.version ?? 0) + 1;

    const nextSequence =
      (existing?.event_sequence ?? 0) + 1;

    return {
      match_uid: match.match_uid,
      status: match.status,
      period: existing?.period ?? null,
      home_score: score.home_score,
      away_score: score.away_score,
      active_events: activeEvents,
      version: nextVersion,
      updated_at: now,
      event_sequence: nextSequence
    };
  }

  private calculateScoreFromEvents(
    match: Match,
    events: MatchEvent[]
  ): { home_score: number; away_score: number } {
    return calculateLiveScore(match, events);
  }

  private async ensureAndGetLiveState(
    tx: MatchRepository,
    match: Match,
    now: string
  ): Promise<LiveMatchState> {
    const existing =
      await tx.getLiveState(match.match_uid);

    if (existing) {
      return existing;
    }

    if (
      match.status === "FINALIZED" ||
      match.status === "LOCKED" ||
      match.status === "WALKOVER" ||
      match.status === "CANCELLED"
    ) {
      throw new MatchEngineError(
        "LIVE_STATE_UNAVAILABLE",
        "Terminal match has no active live state."
      );
    }

    const state: LiveMatchState = {
      match_uid: match.match_uid,
      status: match.status,
      period:
        match.status === "LIVE"
          ? "FIRST_HALF"
          : null,
      home_score: match.home_score,
      away_score: match.away_score,
      active_events: [],
      version: 1,
      updated_at: now,
      event_sequence: 0
    };

    await tx.saveLiveState(state);

    return state;
  }

  private async assertPlayerIsInMatchSquad(
    tx: MatchRepository,
    match_uid: UID,
    team_uid: UID,
    player_uid: UID
  ): Promise<SquadPlayer> {
    const players =
      await tx.getSquadPlayers(
        match_uid,
        team_uid
      );

    const player = players.find(
      (candidate) =>
        candidate.player_uid === player_uid
    );

    if (!player) {
      throw new MatchEngineError(
        "PLAYER_NOT_IN_SQUAD",
        `Player ${player_uid} is not part of team ${team_uid}'s match squad.`
      );
    }

    return player;
  }

  private async resolveRefereePlayer(
    tx: MatchRepository,
    match_uid: UID,
    team_uid: UID,
    player_uid: UID | undefined,
    player_number: number | undefined,
    eventType: EventType
  ): Promise<SquadPlayer | null> {
    /**
     * Goal/card referee input is expected to identify a player.
     * Injury may remain without a player.
     */
    if (!player_uid && player_number === undefined) {
      if (eventType === "INJURY") {
        return null;
      }

      throw new MatchEngineError(
        "PLAYER_REQUIRED",
        "Referee must identify the player for goal/card events."
      );
    }

    const players =
      await tx.getSquadPlayers(
        match_uid,
        team_uid
      );

    let player: SquadPlayer | undefined;

    if (player_uid) {
      player = players.find(
        (candidate) =>
          candidate.player_uid === player_uid
      );
    }

    if (!player && player_number !== undefined) {
      if (
        !Number.isInteger(player_number) ||
        player_number < 0 ||
        player_number > 99
      ) {
        throw new MatchEngineError(
          "INVALID_PLAYER_NUMBER",
          "Player number must be an integer between 0 and 99."
        );
      }

      player = players.find(
        (candidate) =>
          candidate.jersey_number === player_number
      );
    }

    if (!player) {
      throw new MatchEngineError(
        "PLAYER_NOT_FOUND",
        "The supplied player identity could not be resolved from the match squad."
      );
    }

    if (!player.eligible_for_match) {
      throw new MatchEngineError(
        "PLAYER_INELIGIBLE",
        `Player ${player.player_uid} is not eligible for this match.`
      );
    }

    assertPlayerBelongsToTeam(player, team_uid);

    return player;
  }

  private async ensureRefereeWorkingSet(
    tx: MatchRepository,
    match: Match,
    referee_uid: UID,
    now: string
  ): Promise<RefereeWorkingSet> {
    const existing =
      await tx.getRefereeWorkingSet(
        match.match_uid
      );

    if (existing) {
      return existing;
    }

    const liveEvents =
      await tx.getLiveEvents(
        match.match_uid
      );

    const activeEvents =
      recomputeDisciplinaryConsequences(
        liveEvents.filter(
          (event) => event.status === "ACTIVE"
        )
      );

    const score =
      this.calculateScoreFromEvents(
        match,
        activeEvents
      );

    const liveState =
      await this.ensureAndGetLiveState(
        tx,
        match,
        now
      );

    const workingSet: RefereeWorkingSet = {
      match_uid: match.match_uid,
      events: activeEvents,
      home_score: score.home_score,
      away_score: score.away_score,
      period: liveState.period,
      base_live_version: liveState.version,
      opened_at: now,
      opened_by_uid: referee_uid
    };

    await tx.saveRefereeWorkingSet(workingSet);

    return workingSet;
  }

  private async validateFinalEventSet(
    tx: MatchRepository,
    match: Match,
    events: MatchEvent[]
  ): Promise<void> {
    for (const event of events) {
      assertEventWithinMatch(
        event,
        match.match_uid
      );

      assertTeamBelongsToMatch(
        match,
        event.team_uid
      );

      if (event.type === "GOAL") {
        assertGoalType(event.goal_type);
      }

      if (event.type === "CARD") {
        assertCardType(event.card_type);

        if (!event.player_uid) {
          throw new MatchEngineError(
            "CARD_PLAYER_REQUIRED",
            `Final card ${event.event_uid} must have a resolved player.`
          );
        }
      }

      if (event.type === "GOAL" && !event.player_uid) {
        /**
         * Normal match goal may still be unattributed only if the referee
         * explicitly permits it. This engine defaults to requiring a player
         * for ordinary play. Walkover is the only permanently anonymous 3-0.
         */
        throw new MatchEngineError(
          "GOAL_PLAYER_REQUIRED",
          `Final goal ${event.event_uid} must have a resolved player.`
        );
      }

      if (event.player_uid) {
        await this.assertPlayerIsInMatchSquad(
          tx,
          match.match_uid,
          event.team_uid,
          event.player_uid
        );
      }

      if (event.player_number !== undefined &&
          event.player_number !== null) {
        const player =
          await tx.getSquadPlayers(
            match.match_uid,
            event.team_uid
          );

        const found = player.find(
          (candidate) =>
            candidate.jersey_number ===
            event.player_number
        );

        if (!found) {
          throw new MatchEngineError(
            "PLAYER_NUMBER_NOT_IN_SQUAD",
            `Player number ${event.player_number} is not in the match squad.`
          );
        }

        if (
          event.player_uid &&
          found.player_uid !== event.player_uid
        ) {
          throw new MatchEngineError(
            "PLAYER_UID_NUMBER_CONFLICT",
            "Player UID and jersey number resolve to different players."
          );
        }
      }

      assertMinute(event.minute);
      assertPeriod(event.period);
    }
  }
}

/**
 * END OF ALGORITHM 1
 *
 * Required production guarantees in the DB adapter:
 *
 * 1. UNIQUE(match_uid, idempotency_key) for live events.
 * 2. UNIQUE(match_uid, finalization idempotency key).
 * 3. One live state per match_uid.
 * 4. One referee working set per match_uid.
 * 5. Row/advisory locking by match_uid around mutations.
 * 6. All permanent terminal-result writes occur in one transaction.
 * 7. Realtime/webhook publications occur only after commit.
 * 8. The permanent result is the sole handoff to Algorithm 2.
 */
