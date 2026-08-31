import { supabase } from '../../../../lib/supabase';
import type {
  TeamItem,
  RefereeItem,
  PitchItem,
  SeasonFixture,
  GeneratedCompetitionFixtures,
  GeneratedLegFixtures,
  GenerationServiceResult,
  PreviewValidationResult,
} from '../types';
import { COMPETITIONS } from '../constants';
import { generateFixtures as invokeAlgorithm1, type LeagueInput } from '../../../../algorithms/algorithm1';
import { createAlgorithmCommand, validateResultEnvelope } from '../../../../shared/algorithmProtocol';
import { PresidentActionBridge } from '../../../../services/presidentAgent0Bridge';

export const fixturesService = {
  /**
   * Fetches official saved fixtures from database tables in a single consolidated query.
   * Primary: public.matchday_schedules + public.base_fixtures (authoritative Agent 0 tables)
   * Fallback: public.fixtures (legacy / fallback mode)
   * Strict UID decoding: returns null if an entity is unassigned or missing in the DB.
   */
  async fetchFixtures(
    cachedTeams?: TeamItem[],
    cachedReferees?: RefereeItem[],
    cachedPitches?: PitchItem[]
  ): Promise<{ fixtures: SeasonFixture[]; error: string | null }> {
    try {
      // 1. Consolidated parallel fetch of schedules, base pairings, and metadata
      const [schedulesRes, baseRes, teamsRes, refereesRes, pitchesRes] = await Promise.all([
        supabase
          .from('matchday_schedules')
          .select('*')
          .order('matchday_number', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('base_fixtures')
          .select('*')
          .order('match_sequence', { ascending: true }),
        cachedTeams && cachedTeams.length > 0
          ? Promise.resolve({ data: cachedTeams, error: null })
          : supabase
              .from('teams')
              .select('id, name, short_name, logo_url, color_code, competition_id')
              .neq('status', 'rejected')
              .is('deleted_at', null),
        cachedReferees && cachedReferees.length > 0
          ? Promise.resolve({ data: cachedReferees, error: null })
          : supabase
              .from('referees')
              .select('id, name, status, badge_level')
              .is('deleted_at', null),
        cachedPitches && cachedPitches.length > 0
          ? Promise.resolve({ data: cachedPitches, error: null })
          : supabase
              .from('pitches')
              .select('id, name, short_code, location, capacity, surface_type, has_lighting, status')
              .order('name'),
      ]);

      const schedules = schedulesRes.data || [];
      const baseFixtures = baseRes.data || [];
      const teamsList = (teamsRes.data || []) as any[];
      const refereesList = (refereesRes.data || []) as any[];
      const pitchesList = (pitchesRes.data || []) as any[];

      // 2. Fast Map Lookups for O(1) correlation by UID
      const teamsMap = new Map<string, any>();
      teamsList.forEach((t) => teamsMap.set(t.id, t));

      const refereesMap = new Map<string, any>();
      refereesList.forEach((r) => refereesMap.set(r.id, r));

      const pitchesMap = new Map<string, any>();
      pitchesList.forEach((p) => pitchesMap.set(p.id, p));

      const baseMap = new Map<string, any>();
      baseFixtures.forEach((bf: any) => baseMap.set(bf.id, bf));

      // 3. Primary Path: Matchday Schedules Table (Agent 0 Authoritative Schedules)
      if (schedules.length > 0) {
        const formattedMatches: SeasonFixture[] = schedules.map((s: any) => {
          const bf = baseMap.get(s.fixture_id);
          const homeTeamId = bf?.home_team_id || '';
          const awayTeamId = bf?.away_team_id || '';

          const homeTeam = homeTeamId ? teamsMap.get(homeTeamId) || null : null;
          const awayTeam = awayTeamId ? teamsMap.get(awayTeamId) || null : null;
          const referee = s.center_referee_id ? refereesMap.get(s.center_referee_id) || null : null;
          const pitch = s.pitch_id ? pitchesMap.get(s.pitch_id) || null : null;

          const venueName = pitch?.name || null;

          const timeStr = s.start_time
            ? s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time
            : null;
          const scheduledTime = s.play_date && timeStr
            ? `${s.play_date}T${timeStr}.000Z`
            : s.play_date
            ? `${s.play_date}T00:00:00.000Z`
            : null;

          const isEpl =
            s.league === 'EPL' ||
            s.competition_id === COMPETITIONS.PREMIER_LEAGUE.id ||
            s.competition_id?.includes('1111');

          const compObj = isEpl
            ? COMPETITIONS.PREMIER_LEAGUE
            : COMPETITIONS.CHAMPIONSHIP;

          return {
            id: s.fixture_id || s.id,
            competition_id: isEpl ? COMPETITIONS.PREMIER_LEAGUE.id : COMPETITIONS.CHAMPIONSHIP.id,
            home_team_id: homeTeamId,
            away_team_id: awayTeamId,
            scheduled_time: scheduledTime || new Date().toISOString(),
            status: (s.status || 'UPCOMING') as any,
            score_home: 0,
            score_away: 0,
            venue: venueName || '',
            referee_id: s.center_referee_id || null,
            matchday: s.matchday_number || 1,
            created_at: s.created_at || new Date().toISOString(),
            updated_at: s.updated_at || new Date().toISOString(),
            home_team: homeTeam,
            away_team: awayTeam,
            referee,
            competition: compObj,
          };
        });

        return { fixtures: formattedMatches, error: null };
      }

      // 4. Fallback Path: Legacy `fixtures` table if matchday_schedules is not yet populated
      const { data: legacyData, error: legacyErr } = await supabase
        .from('fixtures')
        .select(`
          id,
          competition_id,
          home_team_id,
          away_team_id,
          scheduled_time,
          status,
          score_home,
          score_away,
          venue,
          referee_id,
          matchday,
          created_at,
          updated_at,
          deleted_at,
          home_team:teams!fixtures_home_team_id_fkey (
            id, name, short_name, logo_url, color_code
          ),
          away_team:teams!fixtures_away_team_id_fkey (
            id, name, short_name, logo_url, color_code
          ),
          competition:competitions!fixtures_competition_id_fkey (
            id, name, slug, country, season, is_active
          )
        `)
        .is('deleted_at', null)
        .order('matchday', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (legacyErr) {
        const { data: simpleData, error: simpleErr } = await supabase
          .from('fixtures')
          .select('*')
          .is('deleted_at', null)
          .order('matchday', { ascending: true });

        if (simpleErr) {
          return { fixtures: [], error: simpleErr.message };
        }

        const fallbackFixtures: SeasonFixture[] = (simpleData || []).map((f: any) => ({
          ...f,
          home_team: f.home_team_id ? teamsMap.get(f.home_team_id) || null : null,
          away_team: f.away_team_id ? teamsMap.get(f.away_team_id) || null : null,
          referee: f.referee_id ? refereesMap.get(f.referee_id) || null : null,
          venue: f.venue || '',
        }));

        return { fixtures: fallbackFixtures, error: null };
      }

      const formattedLegacy: SeasonFixture[] = (legacyData || []).map((f: any) => ({
        ...f,
        home_team: Array.isArray(f.home_team) ? f.home_team[0] || null : f.home_team || (f.home_team_id ? teamsMap.get(f.home_team_id) || null : null),
        away_team: Array.isArray(f.away_team) ? f.away_team[0] || null : f.away_team || (f.away_team_id ? teamsMap.get(f.away_team_id) || null : null),
        competition: Array.isArray(f.competition) ? f.competition[0] || null : f.competition || null,
        referee: f.referee_id ? refereesMap.get(f.referee_id) || null : null,
      }));

      return { fixtures: formattedLegacy, error: null };
    } catch (err: any) {
      return { fixtures: [], error: err.message || 'Failed to fetch fixtures' };
    }
  },

  /**
   * Generates mathematical season preview pairings via Algorithm 1 (Agent 0 Stage 1 Engine).
   */
  generateSeasonFixtures(
    eplTeams: TeamItem[],
    championshipTeams: TeamItem[],
    _availableReferees: RefereeItem[],
    _availablePitches: PitchItem[]
  ): GenerationServiceResult {
    try {
      if (eplTeams.length < 2 && championshipTeams.length < 2) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: ['At least 2 teams are required in a competition to prepare season fixtures.'],
            warnings: [],
            totalFixtures: 0,
          },
          error: 'Insufficient teams registered across divisions to initiate season preparation.',
        };
      }

      const leaguesInput: LeagueInput[] = [];
      if (eplTeams.length >= 2) {
        leaguesInput.push({
          league_id: COMPETITIONS.PREMIER_LEAGUE.id,
          teams: eplTeams.map((t) => t.id),
        });
      }
      if (championshipTeams.length >= 2) {
        leaguesInput.push({
          league_id: COMPETITIONS.CHAMPIONSHIP.id,
          teams: championshipTeams.map((t) => t.id),
        });
      }

      const executionId = crypto.randomUUID();
      const command = createAlgorithmCommand<LeagueInput[]>({
        execution_id: executionId,
        season_id: '11111111-2026-4000-8000-000000000001',
        algorithm: 'ALGORITHM_1',
        command: 'GENERATE_FIXTURES',
        payload_schema_version: '1.0',
        payload: leaguesInput,
      });

      const algo1Result = invokeAlgorithm1(command);
      validateResultEnvelope(algo1Result, 'ALGORITHM_1', executionId);

      if (!algo1Result.database.ready_for_write) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: algo1Result.verification.errors || ['Algorithm 1 calculation failed.'],
            warnings: algo1Result.verification.warnings || [],
            totalFixtures: 0,
          },
          error: 'Algorithm 1 pairing engine failed verification.',
        };
      }

      const allTeams = [...eplTeams, ...championshipTeams];
      const teamsMap = new Map<string, TeamItem>();
      allTeams.forEach((t) => teamsMap.set(t.id, t));

      const eplData = algo1Result.payload.data[COMPETITIONS.PREMIER_LEAGUE.id];
      const eplResult = eplData
        ? this.formatAlgo1ToCompetitionFixtures(
            COMPETITIONS.PREMIER_LEAGUE.id,
            COMPETITIONS.PREMIER_LEAGUE.name,
            eplData,
            teamsMap
          )
        : undefined;

      const champData = algo1Result.payload.data[COMPETITIONS.CHAMPIONSHIP.id];
      const champResult = champData
        ? this.formatAlgo1ToCompetitionFixtures(
            COMPETITIONS.CHAMPIONSHIP.id,
            COMPETITIONS.CHAMPIONSHIP.name,
            champData,
            teamsMap
          )
        : undefined;

      const allGeneratedFixtures = [
        ...(eplResult?.all_fixtures || []),
        ...(champResult?.all_fixtures || []),
      ];

      const validation = this.validateGeneratedFixtures(allGeneratedFixtures, allTeams);

      return {
        success: validation.isValid,
        premierLeagueFixtures: eplResult,
        championshipFixtures: champResult,
        validation,
        error: validation.isValid ? null : 'Generated fixture structure failed validation rules.',
      };
    } catch (err: any) {
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [err.message || 'Generation execution error'],
          warnings: [],
          totalFixtures: 0,
        },
        error: err.message || 'Generation execution error',
      };
    }
  },

  /**
   * Helper formatting pure Algorithm 1 output into structured Leg 1 and Leg 2 fixtures.
   */
  formatAlgo1ToCompetitionFixtures(
    competitionId: string,
    competitionName: string,
    data: { leg_1: any[]; leg_2: any[] },
    teamsMap: Map<string, TeamItem>
  ): GeneratedCompetitionFixtures {
    const leg1Fixtures: SeasonFixture[] = (data.leg_1 || []).map((f: any) => ({
      id: f.fixture_id || crypto.randomUUID(),
      competition_id: competitionId,
      home_team_id: f.home_id,
      away_team_id: f.away_id,
      scheduled_time: new Date().toISOString(),
      status: 'UPCOMING',
      score_home: 0,
      score_away: 0,
      venue: '',
      referee_id: null,
      matchday: 1,
      home_team: teamsMap.get(f.home_id) || null,
      away_team: teamsMap.get(f.away_id) || null,
      referee: null,
    }));

    const leg2Fixtures: SeasonFixture[] = (data.leg_2 || []).map((f: any) => ({
      id: f.fixture_id || crypto.randomUUID(),
      competition_id: competitionId,
      home_team_id: f.home_id,
      away_team_id: f.away_id,
      scheduled_time: new Date().toISOString(),
      status: 'UPCOMING',
      score_home: 0,
      score_away: 0,
      venue: '',
      referee_id: null,
      matchday: 2,
      home_team: teamsMap.get(f.home_id) || null,
      away_team: teamsMap.get(f.away_id) || null,
      referee: null,
    }));

    const leg1Group: GeneratedLegFixtures = {
      leg: 1,
      matchday: 1,
      fixtures: leg1Fixtures,
    };

    const leg2Group: GeneratedLegFixtures = {
      leg: 2,
      matchday: 2,
      fixtures: leg2Fixtures,
    };

    return {
      competition_id: competitionId,
      competition_name: competitionName,
      teams_count: teamsMap.size,
      total_matchdays: 2,
      leg1_fixtures: [leg1Group],
      leg2_fixtures: [leg2Group],
      all_fixtures: [...leg1Fixtures, ...leg2Fixtures],
    };
  },

  /**
   * Preview Validation Engine verifying integrity criteria.
   */
  validateGeneratedFixtures(
    fixtures: SeasonFixture[],
    registeredTeams: TeamItem[]
  ): PreviewValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fixtures || fixtures.length === 0) {
      return {
        isValid: false,
        errors: ['No generated fixtures were provided for preview validation.'],
        warnings: [],
        totalFixtures: 0,
      };
    }

    const validTeamIds = new Set(registeredTeams.map((t) => t.id));

    fixtures.forEach((f, idx) => {
      if (f.home_team_id === f.away_team_id) {
        errors.push(`Fixture #${idx + 1}: Team "${f.home_team?.name || f.home_team_id}" is scheduled against itself.`);
      }
      if (!f.home_team_id || !f.away_team_id) {
        errors.push(`Fixture #${idx + 1}: Missing team identification records.`);
      }
      if (f.home_team_id && !validTeamIds.has(f.home_team_id)) {
        warnings.push(`Home team UUID "${f.home_team_id}" is not in the registered roster.`);
      }
      if (f.away_team_id && !validTeamIds.has(f.away_team_id)) {
        warnings.push(`Away team UUID "${f.away_team_id}" is not in the registered roster.`);
      }
      if (!f.competition_id) {
        errors.push(`Fixture #${idx + 1}: Missing competition classification ID.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalFixtures: fixtures.length,
    };
  },

  /**
   * Saves confirmed season fixtures by executing the complete Agent 0 orchestration pipeline.
   */
  async saveFixtures(
    _fixtures?: SeasonFixture[]
  ): Promise<{
    success: boolean;
    count: number;
    eplCount: number;
    champCount: number;
    reReadVerified: boolean;
    error: string | null;
  }> {
    try {
      const canonicalSeasonId = '11111111-2026-4000-8000-000000000001';
      const result = await PresidentActionBridge.beginSeason(canonicalSeasonId, '2026-09-05');

      if (!result.success) {
        return {
          success: false,
          count: 0,
          eplCount: 0,
          champCount: 0,
          reReadVerified: false,
          error: result.error?.message || 'Agent 0 pipeline execution failed.',
        };
      }

      const { data: fixturesData, error: fetchErr } = await supabase
        .from('matchday_schedules')
        .select('id, competition_id');

      if (fetchErr || !fixturesData || fixturesData.length === 0) {
        return {
          success: false,
          count: 0,
          eplCount: 0,
          champCount: 0,
          reReadVerified: false,
          error: 'Readback verification failed: no matchday schedules found in database after Agent 0 run.',
        };
      }

      const totalCount = fixturesData.length;
      const eplCount = fixturesData.filter((f: any) => f.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || f.competition_id?.includes('1111')).length;
      const champCount = fixturesData.filter((f: any) => f.competition_id === COMPETITIONS.CHAMPIONSHIP.id || f.competition_id?.includes('2222')).length;

      return {
        success: true,
        count: totalCount,
        eplCount,
        champCount,
        reReadVerified: true,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        eplCount: 0,
        champCount: 0,
        reReadVerified: false,
        error: err.message || 'An unexpected error occurred while executing Agent 0.',
      };
    }
  },
};
