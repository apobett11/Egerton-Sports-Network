/**
 * ============================================================================
 * ALGORITHM 2: MATCH STATISTICS PROCESSING ENGINE (Database & Edge Function)
 * ============================================================================
 *
 * This is the database-native / Edge Function statistics engine.
 * It is invoked automatically when a match reaches full-time / locked status.
 *
 * Core Guarantees:
 * 1. Idempotency Check: Ensures a match is never processed twice (stats_processed guard).
 * 2. Concurrency Lock: Row-level locking on competition/league row to serialize concurrent finalizations.
 * 3. Module Subtransaction Fault Tolerance:
 *    - Module A (League Standings): Increments played, W/D/L, GF/GA/GD, and points.
 *    - Module B (Team Form): Deterministic last-5 results sliding window (W/D/L array).
 *    - Module C (Player Stats): Aggregates official goals, assists, and goalkeeper clean sheets.
 *    - If any module fails, it logs to admin_error_logs and continues the remaining modules.
 * 4. Exact Mathematical Precision: Zero score or points overwrite.
 */

export type UUID = string;

export interface FixtureRecord {
  id: UUID;
  competition_id: UUID;
  home_team_id: UUID;
  away_team_id: UUID;
  score_home: number;
  score_away: number;
  status: string;
  stats_processed: boolean;
}

export interface OfficialMatchEvent {
  id: UUID;
  fixture_id: UUID;
  team_id: UUID;
  player_id?: UUID | null;
  assist_player_id?: UUID | null;
  type: string;
  minute: number;
  is_official: boolean;
}

export interface LeagueStandingRecord {
  team_id: UUID;
  competition_id: UUID;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  last_updated?: string;
}

export interface TeamFormRecord {
  team_id: UUID;
  competition_id: UUID;
  latest_results: string[]; // e.g. ['W', 'D', 'L', 'W', 'W']
  last_updated?: string;
}

export interface PlayerStatsRecord {
  player_id: UUID;
  competition_id: UUID;
  goals: number;
  assists: number;
  clean_sheets: number;
  last_updated?: string;
}

export interface AdminErrorLogRecord {
  id?: UUID;
  fixture_id: UUID;
  module_name: string;
  error_message: string;
  created_at?: string;
}

export interface MatchStatisticsRepository {
  transaction<T>(competition_id: UUID, fn: (tx: MatchStatisticsRepository) => Promise<T>): Promise<T>;
  getFixture(fixture_id: UUID): Promise<FixtureRecord | null>;
  saveFixture(fixture: FixtureRecord): Promise<void>;
  getLeagueStanding(team_id: UUID, competition_id: UUID): Promise<LeagueStandingRecord | null>;
  saveLeagueStanding(standing: LeagueStandingRecord): Promise<void>;
  getTeamForm(team_id: UUID): Promise<TeamFormRecord | null>;
  saveTeamForm(form: TeamFormRecord): Promise<void>;
  getOfficialMatchEvents(fixture_id: UUID): Promise<OfficialMatchEvent[]>;
  getPlayerStats(player_id: UUID, competition_id: UUID): Promise<PlayerStatsRecord | null>;
  savePlayerStats(stats: PlayerStatsRecord): Promise<void>;
  getTeamGoalkeeper(team_id: UUID): Promise<UUID | null>;
  logAdminError(log: AdminErrorLogRecord): Promise<void>;
}

export interface ProcessMatchStatisticsCommand {
  fixture_id: UUID;
  competition_id?: UUID;
  home_team_id?: UUID;
  away_team_id?: UUID;
  score_home?: number;
  score_away?: number;
  status?: string;
  official_events?: OfficialMatchEvent[];
  now?: string;
}

export interface ProcessMatchStatisticsResult {
  fixture_id: UUID;
  competition_id: UUID;
  stats_processed: boolean;
  module_a_standings: boolean;
  module_b_form: boolean;
  module_c_player_stats: boolean;
  home_result: 'W' | 'D' | 'L';
  away_result: 'W' | 'D' | 'L';
  home_points: number;
  away_points: number;
  error_logs: AdminErrorLogRecord[];
}

export class MatchStatisticsEngineError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'MatchStatisticsEngineError';
  }
}

export class MatchStatisticsProcessingEngine {
  public readonly repo: MatchStatisticsRepository;

  constructor(repo: MatchStatisticsRepository) {
    this.repo = repo;
  }

  /**
   * Master execution function for Algorithm 2.
   * Matches the exact database logic of `fn_process_match_statistics()`.
   */
  async processMatchStatistics(command: ProcessMatchStatisticsCommand): Promise<ProcessMatchStatisticsResult> {
    const fixture_id = command.fixture_id;
    if (!fixture_id) {
      throw new MatchStatisticsEngineError('INVALID_FIXTURE_ID', 'fixture_id is required');
    }

    const initialFixture = await this.repo.getFixture(fixture_id);
    const competition_id = command.competition_id || initialFixture?.competition_id;
    if (!competition_id) {
      throw new MatchStatisticsEngineError('INVALID_COMPETITION_ID', `competition_id missing for fixture ${fixture_id}`);
    }

    return await this.repo.transaction(competition_id, async (tx) => {
      const fixture = await tx.getFixture(fixture_id);
      if (!fixture) {
        throw new MatchStatisticsEngineError('FIXTURE_NOT_FOUND', `Fixture ${fixture_id} not found`);
      }

      // [IDEMPOTENCY CHECK] Never run twice for the same match
      if (fixture.stats_processed) {
        return {
          fixture_id,
          competition_id,
          stats_processed: true,
          module_a_standings: false,
          module_b_form: false,
          module_c_player_stats: false,
          home_result: 'D',
          away_result: 'D',
          home_points: 0,
          away_points: 0,
          error_logs: [],
        };
      }

      const home_team_id = command.home_team_id || fixture.home_team_id;
      const away_team_id = command.away_team_id || fixture.away_team_id;
      const v_home_goals = command.score_home !== undefined ? command.score_home : (fixture.score_home ?? 0);
      const v_away_goals = command.score_away !== undefined ? command.score_away : (fixture.score_away ?? 0);

      // Outcome derivation
      let v_home_won = 0;
      let v_home_drawn = 0;
      let v_home_lost = 0;
      let v_away_won = 0;
      let v_away_drawn = 0;
      let v_away_lost = 0;
      let v_home_points = 0;
      let v_away_points = 0;
      let v_home_result: 'W' | 'D' | 'L' = 'D';
      let v_away_result: 'W' | 'D' | 'L' = 'D';

      if (v_home_goals > v_away_goals) {
        v_home_won = 1;
        v_away_lost = 1;
        v_home_points = 3;
        v_away_points = 0;
        v_home_result = 'W';
        v_away_result = 'L';
      } else if (v_home_goals < v_away_goals) {
        v_home_lost = 1;
        v_away_won = 1;
        v_home_points = 0;
        v_away_points = 3;
        v_home_result = 'L';
        v_away_result = 'W';
      } else {
        v_home_drawn = 1;
        v_away_drawn = 1;
        v_home_points = 1;
        v_away_points = 1;
        v_home_result = 'D';
        v_away_result = 'D';
      }

      const error_logs: AdminErrorLogRecord[] = [];
      let module_a_ok = false;
      let module_b_ok = false;
      let module_c_ok = false;

      // ==========================================
      // MODULE A: LEAGUE STANDINGS
      // ==========================================
      try {
        // Upsert Home Team Standings
        const homeExisting = await tx.getLeagueStanding(home_team_id, competition_id);
        const homeStanding: LeagueStandingRecord = {
          team_id: home_team_id,
          competition_id,
          played: (homeExisting?.played ?? 0) + 1,
          won: (homeExisting?.won ?? 0) + v_home_won,
          drawn: (homeExisting?.drawn ?? 0) + v_home_drawn,
          lost: (homeExisting?.lost ?? 0) + v_home_lost,
          goals_for: (homeExisting?.goals_for ?? 0) + v_home_goals,
          goals_against: (homeExisting?.goals_against ?? 0) + v_away_goals,
          goal_difference: (homeExisting?.goal_difference ?? 0) + (v_home_goals - v_away_goals),
          points: (homeExisting?.points ?? 0) + v_home_points,
          last_updated: new Date().toISOString(),
        };
        await tx.saveLeagueStanding(homeStanding);

        // Upsert Away Team Standings
        const awayExisting = await tx.getLeagueStanding(away_team_id, competition_id);
        const awayStanding: LeagueStandingRecord = {
          team_id: away_team_id,
          competition_id,
          played: (awayExisting?.played ?? 0) + 1,
          won: (awayExisting?.won ?? 0) + v_away_won,
          drawn: (awayExisting?.drawn ?? 0) + v_away_drawn,
          lost: (awayExisting?.lost ?? 0) + v_away_lost,
          goals_for: (awayExisting?.goals_for ?? 0) + v_away_goals,
          goals_against: (awayExisting?.goals_against ?? 0) + v_home_goals,
          goal_difference: (awayExisting?.goal_difference ?? 0) + (v_away_goals - v_home_goals),
          points: (awayExisting?.points ?? 0) + v_away_points,
          last_updated: new Date().toISOString(),
        };
        await tx.saveLeagueStanding(awayStanding);

        module_a_ok = true;
      } catch (err: any) {
        const log: AdminErrorLogRecord = {
          fixture_id,
          module_name: 'MODULE_A_STANDINGS',
          error_message: err?.message || String(err),
          created_at: new Date().toISOString(),
        };
        await tx.logAdminError(log);
        error_logs.push(log);
      }

      // ==========================================
      // MODULE B: TEAM FORM (Last 5 Matches)
      // ==========================================
      try {
        // Home Team Form
        const homeForm = await tx.getTeamForm(home_team_id);
        const currentHomeResults = homeForm?.latest_results || [];
        const newHomeResults = [...currentHomeResults, v_home_result].slice(-5); // Keeps strictly last 5
        await tx.saveTeamForm({
          team_id: home_team_id,
          competition_id,
          latest_results: newHomeResults,
          last_updated: new Date().toISOString(),
        });

        // Away Team Form
        const awayForm = await tx.getTeamForm(away_team_id);
        const currentAwayResults = awayForm?.latest_results || [];
        const newAwayResults = [...currentAwayResults, v_away_result].slice(-5);
        await tx.saveTeamForm({
          team_id: away_team_id,
          competition_id,
          latest_results: newAwayResults,
          last_updated: new Date().toISOString(),
        });

        module_b_ok = true;
      } catch (err: any) {
        const log: AdminErrorLogRecord = {
          fixture_id,
          module_name: 'MODULE_B_FORM',
          error_message: err?.message || String(err),
          created_at: new Date().toISOString(),
        };
        await tx.logAdminError(log);
        error_logs.push(log);
      }

      // ==========================================
      // MODULE C: PLAYER STATS (Goals, Assists & Clean Sheets)
      // ==========================================
      try {
        const events = command.official_events || (await tx.getOfficialMatchEvents(fixture_id));

        // 1. Goals by player
        const goalsByPlayer = new Map<UUID, number>();
        const assistsByPlayer = new Map<UUID, number>();

        for (const e of events) {
          const typeLower = (e.type || '').toLowerCase();
          if (typeLower === 'goal' || typeLower === 'penalty') {
            if (e.player_id) {
              goalsByPlayer.set(e.player_id, (goalsByPlayer.get(e.player_id) || 0) + 1);
            }
            if (e.assist_player_id) {
              assistsByPlayer.set(e.assist_player_id, (assistsByPlayer.get(e.assist_player_id) || 0) + 1);
            }
          }
        }

        // Save goals
        for (const [playerId, goalCount] of goalsByPlayer.entries()) {
          const existing = await tx.getPlayerStats(playerId, competition_id);
          await tx.savePlayerStats({
            player_id: playerId,
            competition_id,
            goals: (existing?.goals ?? 0) + goalCount,
            assists: existing?.assists ?? 0,
            clean_sheets: existing?.clean_sheets ?? 0,
            last_updated: new Date().toISOString(),
          });
        }

        // Save assists
        for (const [playerId, assistCount] of assistsByPlayer.entries()) {
          const existing = await tx.getPlayerStats(playerId, competition_id);
          await tx.savePlayerStats({
            player_id: playerId,
            competition_id,
            goals: existing?.goals ?? 0,
            assists: (existing?.assists ?? 0) + assistCount,
            clean_sheets: existing?.clean_sheets ?? 0,
            last_updated: new Date().toISOString(),
          });
        }

        // 2. Clean sheets
        if (v_away_goals === 0) {
          const homeGk = await tx.getTeamGoalkeeper(home_team_id);
          if (homeGk) {
            const existing = await tx.getPlayerStats(homeGk, competition_id);
            await tx.savePlayerStats({
              player_id: homeGk,
              competition_id,
              goals: existing?.goals ?? 0,
              assists: existing?.assists ?? 0,
              clean_sheets: (existing?.clean_sheets ?? 0) + 1,
              last_updated: new Date().toISOString(),
            });
          }
        }

        if (v_home_goals === 0) {
          const awayGk = await tx.getTeamGoalkeeper(away_team_id);
          if (awayGk) {
            const existing = await tx.getPlayerStats(awayGk, competition_id);
            await tx.savePlayerStats({
              player_id: awayGk,
              competition_id,
              goals: existing?.goals ?? 0,
              assists: existing?.assists ?? 0,
              clean_sheets: (existing?.clean_sheets ?? 0) + 1,
              last_updated: new Date().toISOString(),
            });
          }
        }

        module_c_ok = true;
      } catch (err: any) {
        const log: AdminErrorLogRecord = {
          fixture_id,
          module_name: 'MODULE_C_PLAYER_STATS',
          error_message: err?.message || String(err),
          created_at: new Date().toISOString(),
        };
        await tx.logAdminError(log);
        error_logs.push(log);
      }

      // Mark match as processed
      fixture.stats_processed = true;
      fixture.score_home = v_home_goals;
      fixture.score_away = v_away_goals;
      fixture.status = 'FT';
      await tx.saveFixture(fixture);

      return {
        fixture_id,
        competition_id,
        stats_processed: true,
        module_a_standings: module_a_ok,
        module_b_form: module_b_ok,
        module_c_player_stats: module_c_ok,
        home_result: v_home_result,
        away_result: v_away_result,
        home_points: v_home_points,
        away_points: v_away_points,
        error_logs,
      };
    });
  }
}
