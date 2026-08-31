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
          home_team: teamsMap.get(f.home_team_id) || null,
          away_team: teamsMap.get(f.away_team_id) || null,
          referee: f.referee_id ? refereesMap.get(f.referee_id) || null : null,
          venue: f.venue || resolvePitchName(null),
        }));

        return { fixtures: fallbackFixtures, error: null };
      }

      const formattedLegacy: SeasonFixture[] = (legacyData || []).map((f: any) => ({
        ...f,
        home_team: Array.isArray(f.home_team) ? f.home_team[0] || null : f.home_team || teamsMap.get(f.home_team_id) || null,
        away_team: Array.isArray(f.away_team) ? f.away_team[0] || null : f.away_team || teamsMap.get(f.away_team_id) || null,
        competition: Array.isArray(f.competition) ? f.competition[0] || null : f.competition || null,
        referee: f.referee_id ? refereesMap.get(f.referee_id) || null : null,
      }));

      return { fixtures: formattedLegacy, error: null };
    } catch (err: any) {
      return { fixtures: [], error: err.message || 'Failed to fetch fixtures' };
    }
  },

  /**
   * Double Round-Robin Fixture Generation Engine
   * Inputs: EPL Teams, Championship Teams, Available Referees, Available Pitches
   * Output: Structured Preview Fixtures (EPL & Championship) divided by Leg 1 and Leg 2.
   */
  generateSeasonFixtures(
    eplTeams: TeamItem[],
    championshipTeams: TeamItem[],
    availableReferees: RefereeItem[],
    availablePitches: PitchItem[]
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

      const eplResult = eplTeams.length >= 2
        ? this.createCompetitionFixtures(eplTeams, COMPETITIONS.PREMIER_LEAGUE.id, COMPETITIONS.PREMIER_LEAGUE.name, availableReferees, availablePitches)
        : undefined;

      const champResult = championshipTeams.length >= 2
        ? this.createCompetitionFixtures(championshipTeams, COMPETITIONS.CHAMPIONSHIP.id, COMPETITIONS.CHAMPIONSHIP.name, availableReferees, availablePitches)
        : undefined;

      const allGeneratedFixtures = [
        ...(eplResult?.all_fixtures || []),
        ...(champResult?.all_fixtures || []),
      ];

      // Perform strict Preview Validation
      const validation = this.validateGeneratedFixtures(
        allGeneratedFixtures,
        [...eplTeams, ...championshipTeams]
      );

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
   * Creates structured double-round robin preview fixtures for a single competition.
   * Leg 1 (Matchdays 1..N-1) & Leg 2 (Matchdays N..2N-2).
   */
  createCompetitionFixtures(
    teams: TeamItem[],
    competitionId: string,
    competitionName: string,
    referees: RefereeItem[],
    pitches: PitchItem[]
  ): GeneratedCompetitionFixtures {
    const activePitches = pitches.filter((p) => !p.status || p.status === 'Available');
    const pitchNames = activePitches.length > 0 ? activePitches.map((p) => p.name) : ['Egerton Main Stadium Pitch'];

    const activeRefs = referees.filter((r) => r.status === 'Active');

    const leg1Matchdays: GeneratedLegFixtures[] = [];
    const leg2Matchdays: GeneratedLegFixtures[] = [];
    const allFixtures: SeasonFixture[] = [];

    const numTeams = teams.length;
    const isOdd = numTeams % 2 !== 0;
    const teamList: Array<Partial<TeamItem> & { id: string; name: string }> = teams.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
    }));

    if (isOdd) {
      teamList.push({ id: 'BYE', name: 'BYE', code: 'BYE' });
    }

    const n = teamList.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + ((6 - startDate.getDay() + 7) % 7));
    startDate.setHours(15, 0, 0, 0);

    let fixtureCounter = 1;

    for (let round = 0; round < rounds; round++) {
      const leg1MatchdayFixtures: SeasonFixture[] = [];
      const leg2MatchdayFixtures: SeasonFixture[] = [];

      const matchdayDateLeg1 = new Date(startDate.getTime() + round * 7 * 24 * 60 * 60 * 1000);
      const matchdayDateLeg2 = new Date(startDate.getTime() + (rounds + round) * 7 * 24 * 60 * 60 * 1000);

      for (let match = 0; match < matchesPerRound; match++) {
        const homeIdx = (round + match) % (n - 1);
        let awayIdx = (n - 1 - match + round) % (n - 1);

        if (match === 0) {
          awayIdx = n - 1;
        }

        const homeTeam = teamList[homeIdx];
        const awayTeam = teamList[awayIdx];

        if (homeTeam.id === 'BYE' || awayTeam.id === 'BYE') {
          continue;
        }

        const pitchName = pitchNames[fixtureCounter % pitchNames.length];
        const refereeObj = activeRefs.length > 0 ? activeRefs[fixtureCounter % activeRefs.length] : null;

        // Leg 1 Fixture
        const fixtureLeg1: SeasonFixture = {
          id: `preview-leg1-${competitionId.slice(0, 4)}-${fixtureCounter}`,
          competition_id: competitionId,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          scheduled_time: matchdayDateLeg1.toISOString(),
          status: 'UPCOMING',
          score_home: 0,
          score_away: 0,
          venue: pitchName,
          referee_id: refereeObj?.id || null,
          matchday: round + 1,
          home_team: { id: homeTeam.id, name: homeTeam.name, short_name: homeTeam.code },
          away_team: { id: awayTeam.id, name: awayTeam.name, short_name: awayTeam.code },
          referee: refereeObj ? { id: refereeObj.id, name: refereeObj.name, phone: refereeObj.phone } : null,
        };

        // Leg 2 Fixture (Reversed home/away)
        const fixtureLeg2: SeasonFixture = {
          id: `preview-leg2-${competitionId.slice(0, 4)}-${fixtureCounter}`,
          competition_id: competitionId,
          home_team_id: awayTeam.id,
          away_team_id: homeTeam.id,
          scheduled_time: matchdayDateLeg2.toISOString(),
          status: 'UPCOMING',
          score_home: 0,
          score_away: 0,
          venue: pitchName,
          referee_id: refereeObj?.id || null,
          matchday: rounds + round + 1,
          home_team: { id: awayTeam.id, name: awayTeam.name, short_name: awayTeam.code },
          away_team: { id: homeTeam.id, name: homeTeam.name, short_name: homeTeam.code },
          referee: refereeObj ? { id: refereeObj.id, name: refereeObj.name, phone: refereeObj.phone } : null,
        };

        leg1MatchdayFixtures.push(fixtureLeg1);
        leg2MatchdayFixtures.push(fixtureLeg2);
        allFixtures.push(fixtureLeg1, fixtureLeg2);

        fixtureCounter++;
      }

      if (leg1MatchdayFixtures.length > 0) {
        leg1Matchdays.push({
          leg: 1,
          matchday: round + 1,
          fixtures: leg1MatchdayFixtures,
        });
      }

      if (leg2MatchdayFixtures.length > 0) {
        leg2Matchdays.push({
          leg: 2,
          matchday: rounds + round + 1,
          fixtures: leg2MatchdayFixtures,
        });
      }
    }

    return {
      competition_id: competitionId,
      competition_name: competitionName,
      teams_count: teams.length,
      total_matchdays: rounds * 2,
      leg1_fixtures: leg1Matchdays,
      leg2_fixtures: leg2Matchdays,
      all_fixtures: allFixtures,
    };
  },

  /**
   * Preview Validation Engine verifying integrity criteria
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
    const seenMatchdayPairs = new Set<string>();

    let hasLeg1 = false;
    let hasLeg2 = false;

    fixtures.forEach((f, idx) => {
      // 1. No team playing itself
      if (f.home_team_id === f.away_team_id) {
        errors.push(`Fixture #${idx + 1}: Team "${f.home_team?.name || f.home_team_id}" is scheduled against itself.`);
      }

      // 2. Every fixture has two distinct teams
      if (!f.home_team_id || !f.away_team_id) {
        errors.push(`Fixture #${idx + 1}: Missing team identification records.`);
      }

      // 3. Valid team UUIDs
      if (f.home_team_id && !validTeamIds.has(f.home_team_id)) {
        warnings.push(`Home team ID "${f.home_team_id}" is not in registered roster.`);
      }
      if (f.away_team_id && !validTeamIds.has(f.away_team_id)) {
        warnings.push(`Away team ID "${f.away_team_id}" is not in registered roster.`);
      }

      // 4. Competition ID presence
      if (!f.competition_id) {
        errors.push(`Fixture #${idx + 1}: Missing competition classification ID.`);
      }

      // 5. Matchday & Leg checks
      if (!f.matchday || f.matchday < 1) {
        errors.push(`Fixture #${idx + 1}: Invalid matchday index number.`);
      } else {
        if (f.matchday <= 10) hasLeg1 = true;
        if (f.matchday > 1) hasLeg2 = true;
      }

      // 6. Duplicate team matchday conflict check
      const homeMatchdayKey = `${f.competition_id}-M${f.matchday}-T${f.home_team_id}`;
      const awayMatchdayKey = `${f.competition_id}-M${f.matchday}-T${f.away_team_id}`;

      if (seenMatchdayPairs.has(homeMatchdayKey)) {
        errors.push(`Team scheduling conflict: Home team is scheduled multiple times in Matchday ${f.matchday}.`);
      }
      if (seenMatchdayPairs.has(awayMatchdayKey)) {
        errors.push(`Team scheduling conflict: Away team is scheduled multiple times in Matchday ${f.matchday}.`);
      }

      seenMatchdayPairs.add(homeMatchdayKey);
      seenMatchdayPairs.add(awayMatchdayKey);
    });

    if (!hasLeg1) errors.push('Validation error: Leg 1 fixtures are missing from generated schedule.');
    if (!hasLeg2 && fixtures.length > 2) errors.push('Validation error: Leg 2 fixtures are missing from generated schedule.');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalFixtures: fixtures.length,
    };
  },

  /**
   * Saves confirmed official season fixtures into `public.fixtures` table.
   * Includes batch insert, re-read verification, and audit logging.
   */
  async saveFixtures(
    fixtures: SeasonFixture[]
  ): Promise<{
    success: boolean;
    count: number;
    eplCount: number;
    champCount: number;
    reReadVerified: boolean;
    error: string | null;
  }> {
    try {
      if (!fixtures || fixtures.length === 0) {
        return {
          success: false,
          count: 0,
          eplCount: 0,
          champCount: 0,
          reReadVerified: false,
          error: 'No fixtures were provided for database save.',
        };
      }

      // Pre-save Transaction Safety Check: Ensure no team plays itself
      const invalidSelfMatches = fixtures.filter((f) => f.home_team_id === f.away_team_id);
      if (invalidSelfMatches.length > 0) {
        return {
          success: false,
          count: 0,
          eplCount: 0,
          champCount: 0,
          reReadVerified: false,
          error: 'Transaction aborted: Invalid fixture detected where a team is scheduled to play itself.',
        };
      }

      // Check existing saved fixtures in DB for active competitions
      const targetCompIds = Array.from(new Set(fixtures.map((f) => f.competition_id)));
      const { data: existingRows } = await supabase
        .from('fixtures')
        .select('id')
        .in('competition_id', targetCompIds)
        .is('deleted_at', null);

      const existingCount = existingRows ? existingRows.length : 0;

      // Format insert payloads strictly adhering to database schema
      const insertPayloads = fixtures.map((f) => ({
        competition_id: f.competition_id,
        home_team_id: f.home_team_id,
        away_team_id: f.away_team_id,
        scheduled_time: f.scheduled_time,
        status: 'UPCOMING',
        score_home: 0,
        score_away: 0,
        venue: f.venue || 'Egerton Main Stadium Pitch',
        referee_id: f.referee_id || null,
        matchday: f.matchday,
      }));

      // Perform batch database write
      const { data: savedRows, error: insertError } = await supabase
        .from('fixtures')
        .insert(insertPayloads)
        .select();

      if (insertError) {
        return {
          success: false,
          count: 0,
          eplCount: 0,
          champCount: 0,
          reReadVerified: false,
          error: `Database save failed: ${insertError.message}`,
        };
      }

      const totalCount = savedRows ? savedRows.length : insertPayloads.length;
      const eplCount = insertPayloads.filter((f) => f.competition_id === COMPETITIONS.PREMIER_LEAGUE.id).length;
      const champCount = insertPayloads.filter((f) => f.competition_id === COMPETITIONS.CHAMPIONSHIP.id).length;

      // DATABASE RE-READ VERIFICATION
      const { data: reReadRows, error: reReadError } = await supabase
        .from('fixtures')
        .select('id, competition_id, matchday')
        .in('competition_id', targetCompIds)
        .is('deleted_at', null);

      let reReadVerified = false;
      if (!reReadError && reReadRows && reReadRows.length >= totalCount) {
        reReadVerified = true;
      }

      // Log President operational audit
      await supabase.from('audit_logs').insert([
        {
          action: 'SEASON_FIXTURES_GENERATED_AND_SAVED',
          resource_type: 'fixtures',
          resource_id: 'SEASON-2027/2028',
          details: {
            existing_fixtures_before: existingCount,
            newly_generated_saved: totalCount,
            epl_fixtures_saved: eplCount,
            championship_fixtures_saved: champCount,
            transaction_status: 'Batch Insert with Pre-Save & Re-Read Verification',
            re_read_verified: reReadVerified,
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      return {
        success: true,
        count: totalCount,
        eplCount,
        champCount,
        reReadVerified,
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        eplCount: 0,
        champCount: 0,
        reReadVerified: false,
        error: err.message || 'An unexpected error occurred while saving fixtures to the database.',
      };
    }
  },
};
