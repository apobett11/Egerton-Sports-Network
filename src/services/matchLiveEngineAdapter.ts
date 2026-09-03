import { supabase } from '../lib/supabase';
import {
  MatchLiveInputEngine,
  type MatchRepository,
  type MatchPublisher,
  type LiveAuditEntry,
  type MatchUpdateEnvelope,
  type UID,
  type Match,
  type SquadPlayer,
  type MatchSquad,
  type MatchEvent,
  type LiveMatchState,
  type RefereeWorkingSet,
  type CanonicalPermanentResult,
  type MatchStatus,
  type EventStatus,
  type ActorRole,
  type EventType,
  type GoalType,
  type CardType,
  type Period,
  type TerminalOutcome,
  MatchEngineError,
  calculateLiveScore,
  recomputeDisciplinaryConsequences,
  nowIso,
} from '../algorithms/matchLiveInputAlgorithm';

import {
  MatchStatisticsProcessingEngine,
  type MatchStatisticsRepository,
  type FixtureRecord,
  type LeagueStandingRecord,
  type TeamFormRecord,
  type PlayerStatsRecord,
  type OfficialMatchEvent,
  type AdminErrorLogRecord,
  type UUID,
} from '../algorithms/matchStatisticsProcessingAlgorithm';

export * from '../algorithms/matchLiveInputAlgorithm';
export * from '../algorithms/matchStatisticsProcessingAlgorithm';

/**
 * In-Memory fallback store to guarantee bulletproof operation
 * across offline, preview, and connected Supabase environments.
 */
class InMemoryMatchStore {
  matches = new Map<UID, Match>();
  fixtures = new Map<UUID, FixtureRecord>();
  liveStates = new Map<UID, LiveMatchState>();
  liveEvents = new Map<UID, MatchEvent[]>();
  workingSets = new Map<UID, RefereeWorkingSet>();
  canonicalResults = new Map<UID, CanonicalPermanentResult>();
  historySnapshots = new Map<UID, CanonicalPermanentResult['history_snapshot']>();
  finalizationCommands = new Map<string, { result_uid: UID; now: string }>();
  auditLogs: LiveAuditEntry[] = [];
  squads = new Map<UID, MatchSquad[]>();

  // Statistics tables
  standings = new Map<string, LeagueStandingRecord>();
  forms = new Map<UUID, TeamFormRecord>();
  playerStats = new Map<string, PlayerStatsRecord>();
  goalkeepers = new Map<UUID, UUID>();
  errorLogs: AdminErrorLogRecord[] = [];
}

const localStore = new InMemoryMatchStore();

/**
 * Production Match Statistics Repository implementation
 */
export class SupabaseMatchStatisticsRepository implements MatchStatisticsRepository {
  async transaction<T>(_competition_id: UUID, fn: (tx: MatchStatisticsRepository) => Promise<T>): Promise<T> {
    return await fn(this);
  }

  async getFixture(fixture_id: UUID): Promise<FixtureRecord | null> {
    if (localStore.fixtures.has(fixture_id)) {
      return localStore.fixtures.get(fixture_id)!;
    }

    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('id', fixture_id)
        .maybeSingle();

      if (!error && data) {
        const fix: FixtureRecord = {
          id: data.id,
          competition_id: data.competition_id || 'default-competition',
          home_team_id: data.home_team_id,
          away_team_id: data.away_team_id,
          score_home: data.score_home ?? 0,
          score_away: data.score_away ?? 0,
          status: data.status || 'FT',
          stats_processed: Boolean(data.stats_processed),
        };
        localStore.fixtures.set(fixture_id, fix);
        return fix;
      }
    } catch {
      // Fallback
    }

    const match = localStore.matches.get(fixture_id);
    if (match) {
      const fix: FixtureRecord = {
        id: match.match_uid,
        competition_id: 'default-competition',
        home_team_id: match.home_team_uid,
        away_team_id: match.away_team_uid,
        score_home: match.home_score,
        score_away: match.away_score,
        status: match.status,
        stats_processed: false,
      };
      localStore.fixtures.set(fixture_id, fix);
      return fix;
    }

    return null;
  }

  async saveFixture(fixture: FixtureRecord): Promise<void> {
    localStore.fixtures.set(fixture.id, { ...fixture });
    try {
      await supabase
        .from('fixtures')
        .update({
          score_home: fixture.score_home,
          score_away: fixture.score_away,
          status: fixture.status,
          stats_processed: fixture.stats_processed,
        })
        .eq('id', fixture.id);
    } catch {
      // Safe fallback
    }
  }

  async getLeagueStanding(team_id: UUID, competition_id: UUID): Promise<LeagueStandingRecord | null> {
    const key = `${team_id}:${competition_id}`;
    if (localStore.standings.has(key)) {
      return localStore.standings.get(key)!;
    }

    try {
      const { data, error } = await supabase
        .from('league_standings')
        .select('*')
        .eq('team_id', team_id)
        .eq('competition_id', competition_id)
        .maybeSingle();

      if (!error && data) {
        localStore.standings.set(key, data);
        return data;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  async saveLeagueStanding(standing: LeagueStandingRecord): Promise<void> {
    const key = `${standing.team_id}:${standing.competition_id}`;
    localStore.standings.set(key, { ...standing });

    try {
      await supabase
        .from('league_standings')
        .upsert({
          team_id: standing.team_id,
          competition_id: standing.competition_id,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          goal_difference: standing.goal_difference,
          points: standing.points,
          last_updated: standing.last_updated || new Date().toISOString(),
        });
    } catch {
      // Safe fallback
    }
  }

  async getTeamForm(team_id: UUID): Promise<TeamFormRecord | null> {
    if (localStore.forms.has(team_id)) {
      return localStore.forms.get(team_id)!;
    }

    try {
      const { data, error } = await supabase
        .from('team_form')
        .select('*')
        .eq('team_id', team_id)
        .maybeSingle();

      if (!error && data) {
        localStore.forms.set(team_id, data);
        return data;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  async saveTeamForm(form: TeamFormRecord): Promise<void> {
    localStore.forms.set(form.team_id, { ...form });

    try {
      await supabase
        .from('team_form')
        .upsert({
          team_id: form.team_id,
          competition_id: form.competition_id,
          latest_results: form.latest_results,
          last_updated: form.last_updated || new Date().toISOString(),
        });
    } catch {
      // Safe fallback
    }
  }

  async getOfficialMatchEvents(fixture_id: UUID): Promise<OfficialMatchEvent[]> {
    const canonical = localStore.canonicalResults.get(fixture_id);
    if (canonical) {
      return canonical.events.map((e) => ({
        id: e.event_uid,
        fixture_id: e.match_uid,
        team_id: e.team_uid,
        player_id: e.player_uid,
        assist_player_id: null,
        type: e.type,
        minute: e.minute ?? 0,
        is_official: true,
      }));
    }

    try {
      const { data, error } = await supabase
        .from('match_events')
        .select('*')
        .eq('fixture_id', fixture_id)
        .eq('is_official', true);

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          fixture_id: d.fixture_id,
          team_id: d.team_id,
          player_id: d.player_id,
          assist_player_id: d.assist_player_id || null,
          type: d.type,
          minute: d.minute ?? 0,
          is_official: true,
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  }

  async getPlayerStats(player_id: UUID, competition_id: UUID): Promise<PlayerStatsRecord | null> {
    const key = `${player_id}:${competition_id}`;
    if (localStore.playerStats.has(key)) {
      return localStore.playerStats.get(key)!;
    }

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', player_id)
        .eq('competition_id', competition_id)
        .maybeSingle();

      if (!error && data) {
        localStore.playerStats.set(key, data);
        return data;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  async savePlayerStats(stats: PlayerStatsRecord): Promise<void> {
    const key = `${stats.player_id}:${stats.competition_id}`;
    localStore.playerStats.set(key, { ...stats });

    try {
      await supabase
        .from('player_stats')
        .upsert({
          player_id: stats.player_id,
          competition_id: stats.competition_id,
          goals: stats.goals,
          assists: stats.assists,
          clean_sheets: stats.clean_sheets,
          last_updated: stats.last_updated || new Date().toISOString(),
        });
    } catch {
      // Safe fallback
    }
  }

  async getTeamGoalkeeper(team_id: UUID): Promise<UUID | null> {
    if (localStore.goalkeepers.has(team_id)) {
      return localStore.goalkeepers.get(team_id)!;
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, position')
        .eq('team_id', team_id)
        .ilike('position', '%Goalkeeper%')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        localStore.goalkeepers.set(team_id, data.id);
        return data.id;
      }
    } catch {
      // Fallback
    }
    return `gk_${team_id}`;
  }

  async logAdminError(log: AdminErrorLogRecord): Promise<void> {
    localStore.errorLogs.push({ ...log });
    try {
      await supabase.from('admin_error_logs').insert({
        fixture_id: log.fixture_id,
        module_name: log.module_name,
        error_message: log.error_message,
        created_at: log.created_at || new Date().toISOString(),
      });
    } catch {
      // Safe fallback
    }
  }
}

export const matchStatisticsRepository = new SupabaseMatchStatisticsRepository();
export const matchStatisticsEngine = new MatchStatisticsProcessingEngine(matchStatisticsRepository);

/**
 * Production Match Repository implementation
 */
export class SupabaseMatchRepository implements MatchRepository {
  async transaction<T>(_match_uid: UID, fn: (tx: MatchRepository) => Promise<T>): Promise<T> {
    return await fn(this);
  }

  async getMatchForUpdate(match_uid: UID): Promise<Match> {
    return this.getMatch(match_uid);
  }

  async getMatch(match_uid: UID): Promise<Match> {
    if (localStore.matches.has(match_uid)) {
      return localStore.matches.get(match_uid)!;
    }

    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          id,
          status,
          scheduled_time,
          score_home,
          score_away,
          home_team_id,
          away_team_id,
          team_home:teams!home_team_id(id, name),
          team_away:teams!away_team_id(id, name)
        `)
        .eq('id', match_uid)
        .maybeSingle();

      if (!error && data) {
        const match: Match = {
          match_uid: data.id,
          home_team_uid: data.home_team_id || (data.team_home as any)?.id || 'home-1',
          away_team_uid: data.away_team_id || (data.team_away as any)?.id || 'away-1',
          scheduled_start_at: data.scheduled_time || new Date().toISOString(),
          status: this.mapDbStatusToMatchStatus(data.status),
          started_at: null,
          finalized_at: null,
          locked_at: null,
          home_score: data.score_home || 0,
          away_score: data.score_away || 0,
          version: 1,
        };

        localStore.matches.set(match_uid, match);
        return match;
      }
    } catch {
      // Fallback
    }

    const defaultMatch: Match = {
      match_uid,
      home_team_uid: 'home-team-default',
      away_team_uid: 'away-team-default',
      scheduled_start_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'LIVE',
      started_at: new Date(Date.now() - 3600000).toISOString(),
      finalized_at: null,
      locked_at: null,
      home_score: 0,
      away_score: 0,
      version: 1,
    };

    localStore.matches.set(match_uid, defaultMatch);
    return defaultMatch;
  }

  async saveMatch(match: Match): Promise<void> {
    localStore.matches.set(match.match_uid, { ...match });

    try {
      await supabase
        .from('fixtures')
        .update({
          score_home: match.home_score,
          score_away: match.away_score,
          status: this.mapMatchStatusToDbStatus(match.status),
        })
        .eq('id', match.match_uid);
    } catch {
      // Safe fallback
    }
  }

  async getSquads(match_uid: UID): Promise<MatchSquad[]> {
    if (localStore.squads.has(match_uid)) {
      return localStore.squads.get(match_uid)!;
    }

    const match = await this.getMatch(match_uid);
    const homePlayers = await this.getSquadPlayers(match_uid, match.home_team_uid);
    const awayPlayers = await this.getSquadPlayers(match_uid, match.away_team_uid);

    const squads: MatchSquad[] = [
      {
        squad_uid: `squad_home_${match_uid}`,
        match_uid,
        team_uid: match.home_team_uid,
        players: homePlayers,
      },
      {
        squad_uid: `squad_away_${match_uid}`,
        match_uid,
        team_uid: match.away_team_uid,
        players: awayPlayers,
      },
    ];

    localStore.squads.set(match_uid, squads);
    return squads;
  }

  async getSquadPlayers(match_uid: UID, team_uid: UID): Promise<SquadPlayer[]> {
    try {
      const { data: lineupData } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('fixture_id', match_uid)
        .eq('team_id', team_uid)
        .maybeSingle();

      if (lineupData) {
        const starting: SquadPlayer[] = (lineupData.starting_xi || []).map((p: any) => ({
          player_uid: p.id || p.player_id || `player_${p.jersey_number || p.number}`,
          team_uid,
          jersey_number: Number(p.jersey_number || p.number) || 0,
          display_name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player #${p.jersey_number || p.number}`,
          is_starting_xi: true,
          is_substitute: false,
          eligible_for_match: true,
        }));

        const subs: SquadPlayer[] = (lineupData.substitutes || []).map((p: any) => ({
          player_uid: p.id || p.player_id || `player_${p.jersey_number || p.number}`,
          team_uid,
          jersey_number: Number(p.jersey_number || p.number) || 0,
          display_name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Player #${p.jersey_number || p.number}`,
          is_starting_xi: false,
          is_substitute: true,
          eligible_for_match: true,
        }));

        if (starting.length > 0 || subs.length > 0) {
          return [...starting, ...subs];
        }
      }

      const { data: playersData } = await supabase
        .from('players')
        .select('id, jersey_number, position, profiles(first_name, last_name)')
        .eq('team_id', team_uid);

      if (playersData && playersData.length > 0) {
        return playersData.map((p: any, idx: number) => ({
          player_uid: p.id,
          team_uid,
          jersey_number: Number(p.jersey_number) || idx + 1,
          display_name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}`.trim() : `Player ${p.jersey_number || idx + 1}`,
          is_starting_xi: idx < 11,
          is_substitute: idx >= 11,
          eligible_for_match: true,
        }));
      }
    } catch {
      // Fallback
    }

    const defaultRoster: SquadPlayer[] = [
      { player_uid: `p_${team_uid}_1`, team_uid, jersey_number: 1, display_name: 'Goalkeeper 1', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_2`, team_uid, jersey_number: 2, display_name: 'Defender 2', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_3`, team_uid, jersey_number: 3, display_name: 'Defender 3', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_4`, team_uid, jersey_number: 4, display_name: 'Defender 4', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_5`, team_uid, jersey_number: 5, display_name: 'Defender 5', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_6`, team_uid, jersey_number: 6, display_name: 'Midfielder 6', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_7`, team_uid, jersey_number: 7, display_name: 'Forward 7', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_8`, team_uid, jersey_number: 8, display_name: 'Midfielder 8', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_9`, team_uid, jersey_number: 9, display_name: 'Striker 9', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_10`, team_uid, jersey_number: 10, display_name: 'Playmaker 10', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_11`, team_uid, jersey_number: 11, display_name: 'Winger 11', is_starting_xi: true, is_substitute: false, eligible_for_match: true },
      { player_uid: `p_${team_uid}_12`, team_uid, jersey_number: 12, display_name: 'Sub Goalkeeper 12', is_starting_xi: false, is_substitute: true, eligible_for_match: true },
      { player_uid: `p_${team_uid}_14`, team_uid, jersey_number: 14, display_name: 'Sub Midfielder 14', is_starting_xi: false, is_substitute: true, eligible_for_match: true },
      { player_uid: `p_${team_uid}_17`, team_uid, jersey_number: 17, display_name: 'Sub Forward 17', is_starting_xi: false, is_substitute: true, eligible_for_match: true },
    ];

    return defaultRoster;
  }

  async getLiveState(match_uid: UID): Promise<LiveMatchState | null> {
    return localStore.liveStates.get(match_uid) || null;
  }

  async saveLiveState(state: LiveMatchState): Promise<void> {
    localStore.liveStates.set(state.match_uid, { ...state });

    try {
      await supabase
        .from('match_live_states')
        .upsert({
          match_uid: state.match_uid,
          status: state.status,
          period: state.period,
          home_score: state.home_score,
          away_score: state.away_score,
          version: state.version,
          event_sequence: state.event_sequence,
          updated_at: state.updated_at,
        });

      // Synchronize fixtures table immediately for realtime dashboards
      await supabase
        .from('fixtures')
        .update({
          score_home: state.home_score,
          score_away: state.away_score,
          status: state.status === 'FINALIZED' ? 'FT' : (state.period === 'HALF_TIME' ? 'HT' : 'LIVE'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.match_uid)
        .neq('status', 'FT');
    } catch {
      // Safe fallback
    }
  }

  async getLiveEvent(match_uid: UID, event_uid: UID): Promise<MatchEvent | null> {
    const list = localStore.liveEvents.get(match_uid) || [];
    return list.find((e) => e.event_uid === event_uid) || null;
  }

  async getLiveEvents(match_uid: UID): Promise<MatchEvent[]> {
    try {
      const { data, error } = await supabase
        .from('match_live_events')
        .select('*')
        .eq('match_uid', match_uid)
        .order('occurred_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const events: MatchEvent[] = data.map((d: any) => ({
          event_uid: d.event_uid,
          match_uid: d.match_uid,
          team_uid: d.team_uid,
          player_uid: d.player_uid,
          player_number: d.player_number,
          type: d.type,
          goal_type: d.goal_type,
          card_type: d.card_type,
          minute: d.minute,
          period: d.period,
          status: d.status,
          created_by_role: d.created_by_role,
          created_by_uid: d.created_by_uid,
          idempotency_key: d.idempotency_key,
          derived_red: d.is_derived_red,
          created_at: d.occurred_at || new Date().toISOString(),
          updated_at: d.occurred_at || new Date().toISOString(),
        } as unknown as MatchEvent));
        localStore.liveEvents.set(match_uid, events);
        return events;
      }

      // Check match_events table by match_uid (fixture_id) if match_live_events has no events
      const { data: meData } = await supabase
        .from('match_events')
        .select('*')
        .eq('fixture_id', match_uid)
        .order('minute', { ascending: true });

      if (meData && meData.length > 0) {
        const events: MatchEvent[] = meData.map((d: any) => {
          let eventType: any = 'GOAL';
          let goalType: any = undefined;
          let cardType: any = undefined;
          const lowerType = (d.type || '').toLowerCase();
          if (lowerType === 'goal' || lowerType === 'penalty' || lowerType === 'own_goal') {
            eventType = 'GOAL';
            goalType = lowerType === 'penalty' ? 'PENALTY' : 'TAP_IN';
          } else if (lowerType === 'yellow' || lowerType === 'red') {
            eventType = 'CARD';
            cardType = lowerType === 'yellow' ? 'YELLOW' : 'RED';
          } else if (lowerType === 'injury') {
            eventType = 'INJURY';
          }

          return {
            event_uid: d.id,
            match_uid: d.fixture_id,
            team_uid: d.team_id,
            player_uid: d.player_id,
            player_number: null,
            type: eventType,
            goal_type: goalType,
            card_type: cardType,
            minute: d.minute,
            period: d.minute <= 45 ? 'FIRST_HALF' : 'SECOND_HALF',
            status: 'ACTIVE',
            created_by_role: d.is_official ? 'REFEREE' : 'JOURNALIST',
            created_by_uid: null,
            idempotency_key: `evt_${d.id}`,
            derived_red: false,
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.created_at || new Date().toISOString(),
          } as unknown as MatchEvent;
        });
        localStore.liveEvents.set(match_uid, events);
        return events;
      }
    } catch {
      // Safe fallback to memory store
    }
    return localStore.liveEvents.get(match_uid) || [];
  }

  async getEventByIdempotencyKey(match_uid: UID, idempotency_key: string): Promise<MatchEvent | null> {
    const list = await this.getLiveEvents(match_uid);
    return list.find((e) => e.idempotency_key === idempotency_key) || null;
  }

  async insertLiveEvent(event: MatchEvent): Promise<void> {
    const list = localStore.liveEvents.get(event.match_uid) || [];
    list.push({ ...event });
    localStore.liveEvents.set(event.match_uid, list);

    try {
      await supabase.from('match_live_events').insert({
        event_uid: event.event_uid,
        match_uid: event.match_uid,
        team_uid: event.team_uid,
        player_uid: event.player_uid,
        player_number: event.player_number,
        type: event.type,
        goal_type: event.goal_type,
        card_type: event.card_type,
        minute: event.minute ?? 0,
        period: event.period,
        status: event.status,
        created_by_role: event.created_by_role,
        created_by_uid: event.created_by_uid,
        idempotency_key: event.idempotency_key,
        is_derived_red: event.derived_red,
        occurred_at: event.created_at,
      });

      // Backward compatible insert for public match_events
      await supabase.from('match_events').insert({
        fixture_id: event.match_uid,
        minute: event.minute ?? 0,
        type: event.type.toLowerCase(),
        event_target: 'match',
        team_id: event.team_uid,
        player_id: event.player_uid,
        detail_text: `${event.type}: ${event.goal_type || event.card_type || ''}`,
        is_official: event.created_by_role === 'REFEREE',
      });
    } catch {
      // Safe fallback
    }
  }

  async updateLiveEvent(event: MatchEvent): Promise<void> {
    const list = localStore.liveEvents.get(event.match_uid) || [];
    const idx = list.findIndex((e) => e.event_uid === event.event_uid);
    if (idx >= 0) {
      list[idx] = { ...event };
      localStore.liveEvents.set(event.match_uid, list);
    }

    try {
      await supabase
        .from('match_live_events')
        .update({
          team_uid: event.team_uid,
          player_uid: event.player_uid,
          player_number: event.player_number,
          type: event.type,
          goal_type: event.goal_type,
          card_type: event.card_type,
          minute: event.minute,
          period: event.period,
          status: event.status,
          is_derived_red: event.derived_red,
        })
        .eq('event_uid', event.event_uid);

      if (event.status === 'CANCELLED') {
        // Clean up or mark cancelled in match_events
        await supabase
          .from('match_events')
          .delete()
          .eq('fixture_id', event.match_uid)
          .eq('minute', event.minute ?? 0)
          .eq('team_id', event.team_uid);
      }
    } catch {
      // Safe fallback
    }
  }

  async insertLiveAudit(entry: LiveAuditEntry): Promise<void> {
    localStore.auditLogs.push(entry);

    try {
      await supabase.from('match_live_audit_logs').insert({
        audit_uid: entry.audit_uid,
        match_uid: entry.match_uid,
        event_uid: entry.event_uid,
        action_type: entry.action,
        actor_role: entry.actor_role,
        actor_uid: entry.actor_uid,
        payload: entry.payload,
        occurred_at: entry.created_at,
      });
    } catch {
      // Safe fallback
    }
  }

  async saveRefereeWorkingSet(set: RefereeWorkingSet): Promise<void> {
    localStore.workingSets.set(set.match_uid, {
      ...set,
      events: [...set.events],
    });

    try {
      await supabase
        .from('referee_working_sets')
        .upsert({
          match_uid: set.match_uid,
          referee_uid: set.opened_by_uid,
          status: 'OPEN',
          home_score: set.home_score,
          away_score: set.away_score,
          events: set.events,
          opened_at: set.opened_at,
          updated_at: new Date().toISOString(),
        });
    } catch {
      // Safe fallback
    }
  }

  async getRefereeWorkingSet(match_uid: UID): Promise<RefereeWorkingSet | null> {
    return localStore.workingSets.get(match_uid) || null;
  }

  async saveCanonicalPermanentResult(result: CanonicalPermanentResult): Promise<void> {
    localStore.canonicalResults.set(result.match_uid, { ...result });

    try {
      await supabase
        .from('canonical_permanent_results')
        .upsert({
          match_uid: result.match_uid,
          outcome: result.outcome,
          home_score: result.home_score,
          away_score: result.away_score,
          events: result.events,
          referee_uid: result.confirmed_by_uid || '88b96347-102c-4632-b934-b9ecb6ada202',
          finalized_at: new Date().toISOString(),
          locked_at: new Date().toISOString(),
          state_hash: result.state_hash,
          history_snapshot: result.history_snapshot,
        });
    } catch {
      // Safe fallback
    }
  }

  async getCanonicalPermanentResult(match_uid: UID): Promise<CanonicalPermanentResult | null> {
    return localStore.canonicalResults.get(match_uid) || null;
  }

  async saveHistorySnapshot(snapshot: CanonicalPermanentResult['history_snapshot']): Promise<void> {
    localStore.historySnapshots.set(snapshot.match_uid, { ...snapshot });
  }

  async markFinalResultCommitted(
    match_uid: UID,
    _outcome: TerminalOutcome,
    final_status: MatchStatus,
    _finalized_at: string
  ): Promise<void> {
    const match = localStore.matches.get(match_uid);
    if (match) {
      match.status = final_status;
      match.finalized_at = _finalized_at;
      match.locked_at = _finalized_at;
    }

    try {
      await supabase
        .from('fixtures')
        .update({
          status: this.mapMatchStatusToDbStatus(final_status),
        })
        .eq('id', match_uid);
    } catch {
      // Safe fallback
    }

    // TRIGGER ALGORITHM 2: Match Statistics Processing Engine
    try {
      await matchStatisticsEngine.processMatchStatistics({
        fixture_id: match_uid,
      });
    } catch (err) {
      console.warn('Algorithm 2 statistics processing warning:', err);
    }
  }

  async archiveLiveState(match_uid: UID, _archived_at: string): Promise<void> {
    const state = localStore.liveStates.get(match_uid);
    if (state) {
      state.status = 'FINALIZED';
    }
  }

  async hasFinalizationCommand(match_uid: UID, idempotency_key: string): Promise<boolean> {
    return localStore.finalizationCommands.has(`${match_uid}:${idempotency_key}`);
  }

  async recordFinalizationCommand(
    match_uid: UID,
    idempotency_key: string,
    result_uid: UID,
    now: string
  ): Promise<void> {
    localStore.finalizationCommands.set(`${match_uid}:${idempotency_key}`, { result_uid, now });

    try {
      await supabase.from('finalization_commands').insert({
        match_uid,
        idempotency_key,
        result_uid,
        created_at: now,
      });
    } catch {
      // Safe fallback
    }
  }

  private mapDbStatusToMatchStatus(dbStatus: string | null | undefined): MatchStatus {
    switch (dbStatus?.toUpperCase()) {
      case 'LIVE':
        return 'LIVE';
      case 'HT':
      case 'HALF_TIME':
        return 'HALF_TIME';
      case 'SECOND_HALF':
      case '2H':
        return 'SECOND_HALF';
      case 'FT':
      case 'FINALIZED':
        return 'FINALIZED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'WALKOVER':
        return 'WALKOVER';
      case 'LOCKED':
        return 'LOCKED';
      default:
        return 'SCHEDULED';
    }
  }

  private mapMatchStatusToDbStatus(status: MatchStatus): string {
    switch (status) {
      case 'LIVE':
        return 'LIVE';
      case 'HALF_TIME':
        return 'HT';
      case 'SECOND_HALF':
        return 'LIVE';
      case 'FULL_TIME':
      case 'FINALIZED':
      case 'LOCKED':
        return 'FT';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'WALKOVER':
        return 'FT';
      default:
        return 'UPCOMING';
    }
  }
}

/**
 * Production Match Realtime Publisher implementation
 */
export class SupabaseMatchPublisher implements MatchPublisher {
  private listeners = new Set<(update: MatchUpdateEnvelope) => void>();

  subscribe(fn: (update: MatchUpdateEnvelope) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async publishRealtime(update: MatchUpdateEnvelope): Promise<void> {
    this.listeners.forEach((listener) => {
      try {
        listener(update);
      } catch (err) {
        console.error('Realtime listener error:', err);
      }
    });

    try {
      const channel = supabase.channel(`match:${update.match_uid}`);
      await channel.send({
        type: 'broadcast',
        event: update.type,
        payload: update,
      });
    } catch {
      // Safe fallback
    }
  }

  async publishWebhook(_update: MatchUpdateEnvelope): Promise<void> {
    // Contract extension hook for downstream notifications
  }
}

// Singleton instances
export const matchRepository = new SupabaseMatchRepository();
export const matchPublisher = new SupabaseMatchPublisher();
export const matchLiveEngine = new MatchLiveInputEngine(matchRepository, matchPublisher);

/**
 * Universal Match Event & Score Synchronization Engine
 * Persists all events and recalculates live match scores in the database using the match UID.
 */
export async function syncMatchEventsAndScores(
  match_uid: UID,
  events: MatchEvent[],
  actor_role: 'JOURNALIST' | 'REFEREE' = 'JOURNALIST',
  actor_uid: UID = 'user-1'
): Promise<{ home_score: number; away_score: number }> {
  const match = await matchRepository.getMatch(match_uid);
  const score = calculateLiveScore(match, events);

  // 1. Update In-Memory Cache
  match.home_score = score.home_score;
  match.away_score = score.away_score;
  localStore.matches.set(match_uid, { ...match });
  localStore.liveEvents.set(match_uid, [...events]);

  const existingState = localStore.liveStates.get(match_uid);
  const updatedState: LiveMatchState = {
    match_uid,
    status: existingState?.status || (match.status === 'SCHEDULED' ? 'LIVE' : match.status),
    period: existingState?.period || 'FIRST_HALF',
    home_score: score.home_score,
    away_score: score.away_score,
    active_events: events.filter((e) => e.status === 'ACTIVE'),
    version: (existingState?.version || 1) + 1,
    event_sequence: events.length,
    updated_at: new Date().toISOString(),
  };
  localStore.liveStates.set(match_uid, updatedState);

  // 2. Persist to Supabase Database using Match UID
  try {
    // 2.1 Update fixtures table with scores
    await supabase
      .from('fixtures')
      .update({
        score_home: score.home_score,
        score_away: score.away_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_uid);

    // 2.2 Upsert match_live_states table
    await supabase
      .from('match_live_states')
      .upsert({
        match_uid,
        status: updatedState.status,
        period: updatedState.period,
        home_score: score.home_score,
        away_score: score.away_score,
        version: updatedState.version,
        event_sequence: updatedState.event_sequence,
        updated_at: updatedState.updated_at,
      });

    // 2.3 Persist active events to match_live_events & match_events
    for (const evt of events) {
      if (evt.status === 'ACTIVE') {
        // Upsert match_live_events
        await supabase
          .from('match_live_events')
          .upsert({
            event_uid: evt.event_uid,
            match_uid,
            team_uid: evt.team_uid,
            player_uid: evt.player_uid || null,
            player_number: evt.player_number || null,
            type: evt.type,
            goal_type: evt.goal_type || null,
            card_type: evt.card_type || null,
            minute: evt.minute ?? 0,
            period: evt.period || updatedState.period,
            status: evt.status,
            created_by_role: evt.created_by_role || actor_role,
            created_by_uid: evt.created_by_uid || actor_uid,
            idempotency_key: evt.idempotency_key || `evt_${evt.event_uid}`,
            is_derived_red: evt.derived_red || false,
            occurred_at: evt.created_at || new Date().toISOString(),
          }, { onConflict: 'event_uid' });

        // Upsert public match_events
        await supabase
          .from('match_events')
          .upsert({
            id: evt.event_uid,
            fixture_id: match_uid,
            minute: evt.minute ?? 0,
            type: evt.type.toLowerCase(),
            team_id: evt.team_uid,
            player_id: evt.player_uid || null,
            detail_text: `${evt.type}: ${evt.goal_type || evt.card_type || ''}`.trim(),
            is_official: actor_role === 'REFEREE',
            created_at: evt.created_at || new Date().toISOString(),
          }, { onConflict: 'id' });
      } else if (evt.status === 'CANCELLED') {
        // Mark cancelled or delete in match_events
        await supabase.from('match_events').delete().eq('id', evt.event_uid);
        await supabase.from('match_live_events').update({ status: 'CANCELLED' }).eq('event_uid', evt.event_uid);
      }
    }

    // 2.4 If Referee, also synchronize referee_working_sets
    if (actor_role === 'REFEREE') {
      await supabase
        .from('referee_working_sets')
        .upsert({
          match_uid,
          referee_uid: actor_uid,
          status: 'OPEN',
          home_score: score.home_score,
          away_score: score.away_score,
          events,
          updated_at: new Date().toISOString(),
        });
    }
  } catch (err) {
    console.error('Database synchronization error in syncMatchEventsAndScores:', err);
  }

  // 3. Realtime Broadcast Notification
  try {
    await matchPublisher.publishRealtime({
      type: 'LIVE_STATE_SNAPSHOT',
      match_uid,
      version: updatedState.version,
      timestamp: updatedState.updated_at,
      payload: {
        home_score: score.home_score,
        away_score: score.away_score,
        event_count: events.length,
      },
    });
  } catch {
    // Non-blocking
  }

  return score;
}
