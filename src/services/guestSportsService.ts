import { supabase } from '../lib/supabase';
import type { Match, LeagueTableEntry } from '../types';
import { guestCache } from '../lib/guestCache';
import { resolveAllocatedOfficials } from '../lib/matchdayHelper';

// ============================================================================
// GUEST SPORTS SERVICE v3 — Ultra-Fast Cached In-Memory Lookups & Clean Queries
// ============================================================================

const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';

// In-memory caches for static master data (60 second TTL)
let cachedTeamsMap: Map<string, any> | null = null;
let teamsCacheTimestamp = 0;
let inFlightTeamsPromise: Promise<Map<string, any>> | null = null;

let cachedCompetitionsMap: Map<string, string> | null = null;
let competitionsCacheTimestamp = 0;
let inFlightCompetitionsPromise: Promise<Map<string, string>> | null = null;

// In-flight query deduplication maps (prevents duplicate parallel DB hits)
const inFlightFixturesPromises = new Map<string, Promise<GuestFixture[]>>();
const inFlightStandingsPromises = new Map<string, Promise<GuestStanding[]>>();
const inFlightScorersPromises = new Map<string, Promise<GuestTopScorer[]>>();
const inFlightAssistsPromises = new Map<string, Promise<GuestAssistLeader[]>>();

const CACHE_TTL = 300000; // 5 minutes static master cache TTL

async function getTeamsMap(): Promise<Map<string, any>> {
  const now = Date.now();
  if (cachedTeamsMap && now - teamsCacheTimestamp < CACHE_TTL) {
    return cachedTeamsMap;
  }
  if (inFlightTeamsPromise) {
    return inFlightTeamsPromise;
  }
  inFlightTeamsPromise = (async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, short_name, logo_url, color_code');
      
      cachedTeamsMap = new Map<string, any>((data || []).map((t: any) => [t.id, t]));
      teamsCacheTimestamp = Date.now();
      return cachedTeamsMap;
    } finally {
      inFlightTeamsPromise = null;
    }
  })();
  return inFlightTeamsPromise;
}

async function getCompetitionsMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedCompetitionsMap && now - competitionsCacheTimestamp < CACHE_TTL) {
    return cachedCompetitionsMap;
  }
  if (inFlightCompetitionsPromise) {
    return inFlightCompetitionsPromise;
  }
  inFlightCompetitionsPromise = (async () => {
    try {
      const { data } = await supabase
        .from('competitions')
        .select('id, name');
      
      cachedCompetitionsMap = new Map<string, string>((data || []).map((c: any) => [c.id, c.name]));
      competitionsCacheTimestamp = Date.now();
      return cachedCompetitionsMap;
    } finally {
      inFlightCompetitionsPromise = null;
    }
  })();
  return inFlightCompetitionsPromise;
}

// ============================================================================
// TYPES
// ============================================================================

export interface GuestTeam {
  id: string;
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
  color_code?: string | null;
}

export interface GuestFixture {
  id: string;
  competition_id: string;
  competition_name: string;
  matchday: number;
  scheduled_time: string;
  venue: string;
  status: 'SCHEDULED' | 'LIVE' | 'FT' | 'POSTPONED' | 'HT' | 'UPCOMING' | 'CANCELLED';
  home_team: GuestTeam;
  away_team: GuestTeam;
  score_home: number;
  score_away: number;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  referee?: string | null;
  referee_id?: string | null;
  linesman_team_a_name?: string | null;
  linesman_team_b_name?: string | null;
}

export interface GuestStanding {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface MatchFormMark {
  result: 'W' | 'D' | 'L';
  matchday: number;
}

const LEGENDS_FC_ID = '10000000-0000-4000-8000-000000000007';
const LEGENDS_POINTS_DEDUCTION = 2;
const matchFormByTeam = new Map<string, MatchFormMark[]>();

export function getCachedMatchForm(teamId: string): MatchFormMark[] {
  return matchFormByTeam.get(teamId) || [];
}

export interface GuestTopScorer {
  player_id: string;
  player_name: string;
  team_name: string;
  logo_url: string | null;
  goals: number;
}

export interface GuestAssistLeader {
  player_id: string;
  player_name: string;
  team_name: string;
  logo_url: string | null;
  assists: number;
}

export interface GuestCleanSheetLeader {
  player_id: string;
  player_name: string;
  team_name: string;
  logo_url: string | null;
  clean_sheets: number;
}

/**
 * Detects if a fixture list contains placeholder team names ('Home Team', 'Away Team', 'Home', 'Away', or empty strings).
 * Data containing placeholders must NEVER be cached or persisted.
 */
export function hasPlaceholderTeamData(fixtures: any[]): boolean {
  if (!fixtures || fixtures.length === 0) return false;
  return fixtures.some((f: any) => {
    const hName = (f.home_team?.name || f.teamA?.name || f.home_team_name || f.homeTeamName || '').trim().toLowerCase();
    const aName = (f.away_team?.name || f.teamB?.name || f.away_team_name || f.awayTeamName || '').trim().toLowerCase();
    return (
      !hName ||
      !aName ||
      hName === 'home team' ||
      aName === 'away team' ||
      hName === 'home' ||
      aName === 'away'
    );
  });
}

// ============================================================================
// SECTION 1: FIXTURES & PAST FIXTURES PRELOAD CACHE
// ============================================================================

async function fetchGuestFixturesNetwork(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<GuestFixture[]> {
  const cacheKey = `${params?.competitionId || 'all'}_${params?.date || 'all'}_m${params?.matchday || 'all'}`;

  if (inFlightFixturesPromises.has(cacheKey)) {
    return inFlightFixturesPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      // Range query on scheduled_time. The guest RPC's DATE() comparison
      // cannot use the fixtures index and was taking several seconds.
      const results = await _getGuestFixturesFallback(params);
      if (!hasPlaceholderTeamData(results)) {
        guestCache.set('fixtures', cacheKey, results, 60 * 1000, true);
      }
      return results;
    } catch (err: any) {
      console.error('[guestSportsService] getGuestFixtures exception:', err);
      return _getGuestFixturesFallback(params);
    } finally {
      inFlightFixturesPromises.delete(cacheKey);
    }
  })();

  inFlightFixturesPromises.set(cacheKey, promise);
  return promise;
}

const FIXTURES_CACHE_KEY = 'egerscore_guest_fixtures_v1';

export async function getGuestFixturesFast(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<GuestFixture[]> {
  const cacheKey = `${params?.competitionId || 'all'}_${params?.date || 'all'}_m${params?.matchday || 'all'}`;
  const scopedKey = `${FIXTURES_CACHE_KEY}_${cacheKey}`;

  // Screens paint from their own cache first. This call returns the database rows.
  const networkPromise = fetchGuestFixturesNetwork(params).then((data) => {
    if (data && data.length > 0 && !hasPlaceholderTeamData(data)) {
      try {
        localStorage.setItem(scopedKey, JSON.stringify(data));
      } catch {}
    }
    return data || [];
  });

  return networkPromise;
}

export async function getGuestFixtures(params?: {
  competitionId?: string;
  date?: string; // YYYY-MM-DD
  matchday?: number;
}): Promise<GuestFixture[]> {
  return getGuestFixturesFast(params);
}

// Internal fallback: original 3-query approach used only if RPC is unavailable
async function _getGuestFixturesFallback(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<GuestFixture[]> {
  try {
    let query = supabase
      .from('fixtures')
      .select('id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away,home_penalty_score,away_penalty_score')
      .order('scheduled_time', { ascending: true });

    if (params?.competitionId && params.competitionId !== 'all' && params.competitionId !== 'ALL') {
      const compId = (params.competitionId === 'friendlies' || params.competitionId === 'friendly')
        ? '33333333-3333-3333-3333-333333333333'
        : params.competitionId;
      query = query.eq('competition_id', compId);
    }
    if (params?.matchday) query = query.eq('matchday', params.matchday);
    if (params?.date && params.date !== 'all') {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : new Date(params.date).toISOString().split('T')[0];
      query = query.gte('scheduled_time', `${d}T00:00:00.000Z`).lte('scheduled_time', `${d}T23:59:59.999Z`);
    }

    const [fixtureRes, teamMap, compMap] = await Promise.all([query, getTeamsMap(), getCompetitionsMap()]);
    const fixtureRows = fixtureRes.data;
    if (fixtureRes.error || !fixtureRows || fixtureRows.length === 0) return [];

    return fixtureRows.map((f: any): GuestFixture => {
      const home = teamMap.get(f.home_team_id) || {};
      const away = teamMap.get(f.away_team_id) || {};
      return {
        id: f.id,
        competition_id: f.competition_id || '',
        competition_name: compMap.get(f.competition_id) || 'Campus Football',
        matchday: f.matchday || 1,
        scheduled_time: f.scheduled_time,
        venue: f.venue || 'Egerton Main Grounds',
        status: (f.status || 'UPCOMING') as any,
        score_home: typeof f.score_home === 'number' ? f.score_home : 0,
        score_away: typeof f.score_away === 'number' ? f.score_away : 0,
        home_penalty_score: f.home_penalty_score ?? null,
        away_penalty_score: f.away_penalty_score ?? null,
        home_team: { id: home.id || '', name: home.name || '', short_name: home.short_name || null, logo_url: home.logo_url || DEFAULT_LOGO, color_code: home.color_code || '#059669' },
        away_team: { id: away.id || '', name: away.name || '', short_name: away.short_name || null, logo_url: away.logo_url || DEFAULT_LOGO, color_code: away.color_code || '#2563EB' },
      };
    });
  } catch {
    return [];
  }
}

/**
 * Preload past fixtures into guestCache in the background once matchday fixtures load.
 * Bounded to 90 days back so the query never becomes an unbounded full-table scan.
 */
export async function preloadPastFixtures(currentDateStr?: string, competitionId?: string): Promise<void> {
  try {
    // Skip if the master cache is already populated (teams and comps already warm)
    if (guestCache.get<any[]>('fixtures', 'all_all_pall_sall')) {
      return;
    }

    const compKey = competitionId && competitionId !== 'all' ? competitionId : undefined;

    // Bound to 90 days back to avoid full-table scan growing every season
    const boundDate = new Date();
    boundDate.setDate(boundDate.getDate() - 90);
    const boundStr = boundDate.toISOString();

    let query = supabase
      .from('fixtures')
      .select(`
        id,
        competition_id,
        home_team_id,
        away_team_id,
        matchday,
        scheduled_time,
        venue,
        status,
        score_home,
        score_away,
        home_penalty_score,
        away_penalty_score
      `)
      .gte('scheduled_time', boundStr)
      .order('scheduled_time', { ascending: false });

    if (compKey) {
      query = query.eq('competition_id', compKey);
    }

    const [fixtureRes, teamMap, compMap] = await Promise.all([
      query,
      getTeamsMap(),
      getCompetitionsMap()
    ]);

    const fixtureRows = fixtureRes.data;
    if (!fixtureRows || fixtureRows.length === 0 || !teamMap || teamMap.size === 0) return;

    const byDate = new Map<string, Match[]>();
    const allPastMatches: Match[] = [];
    const curTime = currentDateStr ? new Date(`${currentDateStr}T00:00:00.000Z`).getTime() : Date.now();

    fixtureRows.forEach((f: any) => {
      const home = teamMap.get(f.home_team_id) || {};
      const away = teamMap.get(f.away_team_id) || {};
      const gf: GuestFixture = {
        id: f.id,
        competition_id: f.competition_id || '',
        competition_name: compMap.get(f.competition_id) || 'Campus Football',
        matchday: f.matchday || 1,
        scheduled_time: f.scheduled_time,
        venue: f.venue || 'Egerton Main Grounds',
        status: (f.status || 'FT') as any,
        score_home: typeof f.score_home === 'number' ? f.score_home : 0,
        score_away: typeof f.score_away === 'number' ? f.score_away : 0,
        home_penalty_score: f.home_penalty_score ?? null,
        away_penalty_score: f.away_penalty_score ?? null,
        home_team: {
          id: home.id || '',
          name: home.name || '',
          short_name: home.short_name || null,
          logo_url: home.logo_url || DEFAULT_LOGO,
          color_code: home.color_code || '#059669',
        },
        away_team: {
          id: away.id || '',
          name: away.name || '',
          short_name: away.short_name || null,
          logo_url: away.logo_url || DEFAULT_LOGO,
          color_code: away.color_code || '#2563EB',
        },
      };

      const match = guestFixtureToMatch(gf);
      const fixtureTime = f.scheduled_time ? new Date(f.scheduled_time).getTime() : 0;
      if (fixtureTime < curTime || f.status === 'FT') {
        allPastMatches.push(match);
      }

      if (f.scheduled_time) {
        const d = new Date(f.scheduled_time);
        if (!isNaN(d.getTime())) {
          const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!byDate.has(dKey)) byDate.set(dKey, []);
          byDate.get(dKey)!.push(match);
        }
      }
    });

    const cId = competitionId || 'all';
    byDate.forEach((matches, dKey) => {
      if (!hasPlaceholderTeamData(matches)) {
        guestCache.set('fixtures', `${cId}_${dKey}_pall_sall`, matches, 5 * 60 * 1000);
        guestCache.set('fixtures', `${cId}_${dKey}_mall`, matches, 5 * 60 * 1000);
      }
    });

    if (!hasPlaceholderTeamData(allPastMatches)) {
      guestCache.set('fixtures', `past_fixtures_${cId}`, allPastMatches, 5 * 60 * 1000);
    }

    const allMatches = fixtureRows.map((f: any) => {
      const home = teamMap.get(f.home_team_id) || {};
      const away = teamMap.get(f.away_team_id) || {};
      return guestFixtureToMatch({
        id: f.id,
        competition_id: f.competition_id || '',
        competition_name: compMap.get(f.competition_id) || 'Campus Football',
        matchday: f.matchday || 1,
        scheduled_time: f.scheduled_time,
        venue: f.venue || 'Egerton Main Grounds',
        status: (f.status || 'FT') as any,
        score_home: typeof f.score_home === 'number' ? f.score_home : 0,
        score_away: typeof f.score_away === 'number' ? f.score_away : 0,
        home_penalty_score: f.home_penalty_score ?? null,
        away_penalty_score: f.away_penalty_score ?? null,
        home_team: { id: home.id || '', name: home.name || '', short_name: home.short_name || null, logo_url: home.logo_url || DEFAULT_LOGO, color_code: home.color_code || '#059669' },
        away_team: { id: away.id || '', name: away.name || '', short_name: away.short_name || null, logo_url: away.logo_url || DEFAULT_LOGO, color_code: away.color_code || '#2563EB' }
      });
    });

    if (!hasPlaceholderTeamData(allMatches)) {
      guestCache.set('fixtures', 'all_all_pall_sall', allMatches, 5 * 60 * 1000);
    }
  } catch (err) {
    console.warn('[guestSportsService] preloadPastFixtures error:', err);
  }
}

// ============================================================================
// SECTION 2: STANDINGS
// ============================================================================

async function fetchGuestStandingsNetwork(competitionId?: string): Promise<GuestStanding[]> {
  const targetCompId = (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId))
    ? competitionId
    : '11111111-1111-1111-1111-111111111111'; // Default strictly to EPL to prevent mixing all 22 teams
  const cacheKey = `standings_${targetCompId}`;

  if (inFlightStandingsPromises.has(cacheKey)) {
    return inFlightStandingsPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const [teamsRes, fixturesRes] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url').eq('competition_id', targetCompId),
        supabase
          .from('fixtures')
          .select('home_team_id, away_team_id, score_home, score_away, matchday, scheduled_time, status')
          .eq('competition_id', targetCompId)
          .in('status', ['FT', 'FINISHED', 'ft', 'finished'])
          .order('matchday', { ascending: true })
          .order('scheduled_time', { ascending: true }),
      ]);

      if (teamsRes.error || fixturesRes.error || !teamsRes.data || teamsRes.data.length === 0) {
        return [];
      }

      type Acc = {
        played: number; won: number; drawn: number; lost: number;
        gf: number; ga: number; points: number; form: MatchFormMark[];
      };
      const blank = (): Acc => ({ played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] });
      const acc = new Map<string, Acc>(teamsRes.data.map((t: any) => [t.id, blank()]));

      const fixtures = [...(fixturesRes.data || [])].sort((a: any, b: any) => {
        const md = (Number(a.matchday) || 0) - (Number(b.matchday) || 0);
        if (md !== 0) return md;
        return new Date(a.scheduled_time || 0).getTime() - new Date(b.scheduled_time || 0).getTime();
      });

      const applySide = (teamId: string, goalsFor: number, goalsAgainst: number, matchday: number) => {
        if (!teamId) return;
        if (!acc.has(teamId)) acc.set(teamId, blank());
        const row = acc.get(teamId)!;
        row.played += 1;
        row.gf += goalsFor;
        row.ga += goalsAgainst;
        let result: 'W' | 'D' | 'L' = 'D';
        if (goalsFor > goalsAgainst) {
          row.won += 1;
          row.points += 3;
          result = 'W';
        } else if (goalsFor < goalsAgainst) {
          row.lost += 1;
          result = 'L';
        } else {
          row.drawn += 1;
          row.points += 1;
        }
        row.form.push({ result, matchday });
      };

      const now = Date.now();
      for (const fixture of fixtures) {
        const kickoff = fixture.scheduled_time ? new Date(fixture.scheduled_time).getTime() : 0;
        // A future matchday can be flagged FT before it is played. Count only kickoffs that have passed.
        if (kickoff && kickoff > now) continue;
        const scoreHome = Number(fixture.score_home) || 0;
        const scoreAway = Number(fixture.score_away) || 0;
        const matchday = Number(fixture.matchday) || 0;
        applySide(fixture.home_team_id, scoreHome, scoreAway, matchday);
        applySide(fixture.away_team_id, scoreAway, scoreHome, matchday);
      }

      const teamById = new Map<string, any>(teamsRes.data.map((t: any) => [t.id, t]));
      const results = [...acc.entries()].map(([teamId, row]): GuestStanding => {
        matchFormByTeam.set(teamId, row.form);
        const team = teamById.get(teamId) || {};
        const points = teamId === LEGENDS_FC_ID
          ? Math.max(0, row.points - LEGENDS_POINTS_DEDUCTION)
          : row.points;
        return {
          team_id: teamId,
          team_name: team.name || 'Campus Team',
          logo_url: team.logo_url || DEFAULT_LOGO,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goals_for: row.gf,
          goals_against: row.ga,
          goal_difference: row.gf - row.ga,
          points,
        };
      });

      // Strict FIFA Standings Ordering: Points (Desc) -> Goal Difference (Desc) -> Goals For (Desc) -> Name (Asc)
      results.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
        return a.team_name.localeCompare(b.team_name);
      });

      guestCache.set('standings', cacheKey, results, 2 * 60 * 1000, true);
      return results;
    } catch (err: any) {
      console.error('[guestSportsService] getGuestStandings exception:', err);
      return [];
    } finally {
      inFlightStandingsPromises.delete(cacheKey);
    }
  })();

  inFlightStandingsPromises.set(cacheKey, promise);
  return promise;
}

export async function getGuestStandings(competitionId?: string): Promise<GuestStanding[]> {
  return fetchGuestStandingsNetwork(competitionId);
}

export async function getMatchFormsForTeams(teamIds: string[]): Promise<Record<string, MatchFormMark[]>> {
  const missing = teamIds.filter((id) => !matchFormByTeam.has(id));
  if (missing.length > 0) {
    await Promise.all([
      getGuestStandings('11111111-1111-1111-1111-111111111111'),
      getGuestStandings('22222222-2222-2222-2222-222222222222'),
    ]);
  }
  const forms: Record<string, MatchFormMark[]> = {};
  for (const id of teamIds) {
    forms[id] = matchFormByTeam.get(id) || [];
  }
  return forms;
}

// ============================================================================
// SECTION 3: TOP SCORERS
// ============================================================================

export async function getGuestAllTimeTopScorers(limitCount = 10): Promise<GuestTopScorer[]> {
  return getGuestTopScorers(limitCount);
}

export async function getGuestTopScorers(limitCount = 10, competitionId?: string): Promise<GuestTopScorer[]> {
  const cacheKey = `scorers_${competitionId || 'all'}_${limitCount}`;

  try {
    let psQuery = supabase
      .from('player_stats')
      .select('player_id, competition_id, goals')
      .gt('goals', 0);

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const { data: psRows, error: psErr } = await psQuery;

    if (psErr || !psRows || psRows.length === 0) {
      const fallbackResults = await getTopScorersFromEvents(limitCount, competitionId);
      if (fallbackResults && fallbackResults.length > 0) {
        guestCache.set('players', cacheKey, fallbackResults, 2 * 60 * 1000);
      }
      return fallbackResults;
    }

    const playerIds = psRows.map((r: any) => r.player_id).filter(Boolean);
    const [playersRes, teamMap] = await Promise.all([
      supabase.from('players').select('id, first_name, last_name, team_id, profile_id').in('id', playerIds),
      getTeamsMap()
    ]);

    const playerRows = playersRes.data || [];
    const playerMap = new Map<string, any>(playerRows.map((p: any) => [p.id, p]));

    const profileIds = [...new Set(playerRows.map((p: any) => p.profile_id).filter(Boolean))];
    const { data: profileRows } = profileIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name').in('id', profileIds)
      : { data: [] };

    const profileMap = new Map<string, any>((profileRows || []).map((pr: any) => [pr.id, pr]));

    const aggregated = new Map<string, GuestTopScorer>();
    psRows.forEach((row: any) => {
      const pid = row.player_id;
      if (!pid) return;
      const player = playerMap.get(pid);
      const team = player ? teamMap.get(player.team_id) : null;
      const profile = player ? profileMap.get(player.profile_id) : null;

      const name = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : player
        ? `${player.first_name || ''} ${player.last_name || ''}`.trim()
        : 'Player';

      if (aggregated.has(pid)) {
        aggregated.get(pid)!.goals += Number(row.goals) || 0;
      } else {
        aggregated.set(pid, {
          player_id: pid,
          player_name: name || 'Player',
          team_name: team?.name || 'Campus Team',
          logo_url: team?.logo_url || DEFAULT_LOGO,
          goals: Number(row.goals) || 0,
        });
      }
    });

    const results = [...aggregated.values()]
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limitCount);

    if (results.length > 0) {
      guestCache.set('players', cacheKey, results, 2 * 60 * 1000);
    }
    return results;
  } catch (err: any) {
    console.error('[guestSportsService] getGuestTopScorers exception:', err);
    return [];
  }
}

async function getTopScorersFromEvents(limitCount: number, competitionId?: string): Promise<GuestTopScorer[]> {
  try {
    let evQuery = supabase
      .from('match_events')
      .select('player_id, fixture_id')
      .in('type', ['goal', 'penalty'])
      .limit(500);

    const [evRes, teamMap] = await Promise.all([
      evQuery,
      getTeamsMap()
    ]);

    const evRows = evRes.data;
    if (evRes.error || !evRows || evRows.length === 0) return [];

    const goalCount = new Map<string, number>();
    evRows.forEach((e: any) => {
      if (!e.player_id) return;
      goalCount.set(e.player_id, (goalCount.get(e.player_id) || 0) + 1);
    });

    if (goalCount.size === 0) return [];

    const topPlayerIds = [...goalCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount * 2)
      .map(([pid]) => pid);

    const { data: playerRows } = await supabase
      .from('players')
      .select('id, first_name, last_name, team_id, profile_id')
      .in('id', topPlayerIds);

    const playerMap = new Map<string, any>((playerRows || []).map((p: any) => [p.id, p]));

    return [...goalCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([pid, goals]) => {
        const player = playerMap.get(pid);
        const team = player ? teamMap.get(player.team_id) : null;
        const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'Player';
        return {
          player_id: pid,
          player_name: name || 'Player',
          team_name: team?.name || 'Campus Team',
          logo_url: team?.logo_url || DEFAULT_LOGO,
          goals,
        };
      });
  } catch {
    return [];
  }
}

// ============================================================================
// SECTION 4: ASSIST LEADERS
// ============================================================================

export async function getGuestAssists(limitCount = 10, competitionId?: string): Promise<GuestAssistLeader[]> {
  const cacheKey = `assists_${competitionId || 'all'}_${limitCount}`;
  const cached = guestCache.get<GuestAssistLeader[]>('players', cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    let psQuery = supabase
      .from('player_stats')
      .select('player_id, assists')
      .gt('assists', 0)
      .order('assists', { ascending: false })
      .limit(limitCount * 3);

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const [psRes, teamMap] = await Promise.all([
      psQuery,
      getTeamsMap()
    ]);

    const psRows = psRes.data;
    if (psRes.error || !psRows || psRows.length === 0) return [];

    const playerIds = psRows.map((r: any) => r.player_id).filter(Boolean);
    const { data: playerRows } = await supabase
      .from('players')
      .select('id, first_name, last_name, team_id, profile_id')
      .in('id', playerIds);

    const playerMap = new Map<string, any>((playerRows || []).map((p: any) => [p.id, p]));

    const aggregated = new Map<string, GuestAssistLeader>();
    psRows.forEach((row: any) => {
      const pid = row.player_id;
      if (!pid) return;
      const player = playerMap.get(pid);
      const team = player ? teamMap.get(player.team_id) : null;
      const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'Player';

      if (aggregated.has(pid)) {
        aggregated.get(pid)!.assists += Number(row.assists) || 0;
      } else {
        aggregated.set(pid, {
          player_id: pid,
          player_name: name || 'Player',
          team_name: team?.name || 'Campus Team',
          logo_url: team?.logo_url || DEFAULT_LOGO,
          assists: Number(row.assists) || 0,
        });
      }
    });

    const results = [...aggregated.values()]
      .sort((a, b) => b.assists - a.assists)
      .slice(0, limitCount);

    if (results.length > 0) {
      guestCache.set('players', cacheKey, results, 2 * 60 * 1000);
    }
    return results;
  } catch (err: any) {
    console.error('[guestSportsService] getGuestAssists exception:', err);
    return [];
  }
}

export async function getGuestCleanSheets(limitCount = 10, competitionId?: string): Promise<GuestCleanSheetLeader[]> {
  const cacheKey = `cleansheets_${competitionId || 'all'}_${limitCount}`;
  const cached = guestCache.get<GuestCleanSheetLeader[]>('players', cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    let psQuery = supabase
      .from('player_stats')
      .select('player_id, clean_sheets')
      .gt('clean_sheets', 0)
      .order('clean_sheets', { ascending: false })
      .limit(limitCount * 3);

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const [psRes, teamMap] = await Promise.all([
      psQuery,
      getTeamsMap()
    ]);

    const psRows = psRes.data;
    if (psRes.error || !psRows || psRows.length === 0) return [];

    const playerIds = psRows.map((r: any) => r.player_id).filter(Boolean);
    const { data: playerRows } = await supabase
      .from('players')
      .select('id, first_name, last_name, team_id, profile_id')
      .in('id', playerIds);

    const playerMap = new Map<string, any>((playerRows || []).map((p: any) => [p.id, p]));

    const aggregated = new Map<string, GuestCleanSheetLeader>();
    psRows.forEach((row: any) => {
      const pid = row.player_id;
      if (!pid) return;
      const player = playerMap.get(pid);
      const team = player ? teamMap.get(player.team_id) : null;
      const name = player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'Goalkeeper';

      if (aggregated.has(pid)) {
        aggregated.get(pid)!.clean_sheets += Number(row.clean_sheets) || 0;
      } else {
        aggregated.set(pid, {
          player_id: pid,
          player_name: name || 'Goalkeeper',
          team_name: team?.name || 'Campus Team',
          logo_url: team?.logo_url || DEFAULT_LOGO,
          clean_sheets: Number(row.clean_sheets) || 0,
        });
      }
    });

    const results = [...aggregated.values()]
      .sort((a, b) => b.clean_sheets - a.clean_sheets)
      .slice(0, limitCount);

    if (results.length > 0) {
      guestCache.set('players', cacheKey, results, 2 * 60 * 1000);
    }
    return results;
  } catch (err: any) {
    console.error('[guestSportsService] getGuestCleanSheets exception:', err);
    return [];
  }
}

// ============================================================================
// TYPE ADAPTERS
// ============================================================================

export function guestFixtureToMatch(gf: GuestFixture): Match {
  const d = new Date(gf.scheduled_time);
  const timeFormatted = isNaN(d.getTime())
    ? '15:00'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const officials = resolveAllocatedOfficials(gf.id);
  const cr = gf.referee || officials.centerReferee || undefined;
  const crId = gf.referee_id || officials.centerRefereeId || undefined;
  const lA = gf.linesman_team_a_name || officials.linesmanTeamA || undefined;
  const lB = gf.linesman_team_b_name || officials.linesmanTeamB || undefined;

  return {
    id: gf.id,
    status: gf.status as any,
    time: gf.status === 'FT' ? 'FT' : gf.status === 'HT' ? 'HT' : timeFormatted,
    minute: gf.status === 'LIVE' ? "85'" : gf.status === 'HT' ? 'HT' : gf.status === 'FT' ? 'FT' : '-',
    league: gf.competition_name,
    teamA: {
      id: gf.home_team.id,
      name: gf.home_team.name,
      shortName: gf.home_team.short_name || gf.home_team.name.substring(0, 3).toUpperCase(),
      logo: gf.home_team.logo_url || DEFAULT_LOGO,
      colorCode: gf.home_team.color_code || '#059669',
      club_id: '',
      competition_id: gf.competition_id,
    },
    teamB: {
      id: gf.away_team.id,
      name: gf.away_team.name,
      shortName: gf.away_team.short_name || gf.away_team.name.substring(0, 3).toUpperCase(),
      logo: gf.away_team.logo_url || DEFAULT_LOGO,
      colorCode: gf.away_team.color_code || '#2563EB',
      club_id: '',
      competition_id: gf.competition_id,
    },
    scoreA: gf.score_home,
    scoreB: gf.score_away,
    events: [],
    stats: [],
    lineups: { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' },
    venue: gf.venue,
    referee: cr || 'Accredited League Referee',
    centerReferee: cr,
    refereeId: crId,
    centerRefereeId: crId,
    linesmanTeamAName: lA,
    linesmanTeamBName: lB,
    matchday: gf.matchday,
    homePenaltyScore: gf.home_penalty_score ?? undefined,
    awayPenaltyScore: gf.away_penalty_score ?? undefined,
    scheduledTime: gf.scheduled_time,
  };
}


export function guestStandingToLeagueTableEntry(gs: GuestStanding, index: number): LeagueTableEntry {
  return {
    position: index + 1,
    teamId: gs.team_id,
    teamName: gs.team_name,
    teamLogo: gs.logo_url || DEFAULT_LOGO,
    played: gs.played,
    won: gs.won,
    drawn: gs.drawn,
    lost: gs.lost,
    goalsFor: gs.goals_for,
    goalsAgainst: gs.goals_against,
    goalDifference: gs.goal_difference,
    points: gs.points,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getGuestMatches(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<Match[]> {
  const fixtures = await getGuestFixtures(params);
  return fixtures.map(guestFixtureToMatch);
}

export async function getGuestLeagueTableEntries(competitionId?: string): Promise<LeagueTableEntry[]> {
  const standings = await getGuestStandings(competitionId);
  const entries = standings.map((s, idx) => guestStandingToLeagueTableEntry(s, idx));
  const targetCompId = (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId))
    ? competitionId
    : '11111111-1111-1111-1111-111111111111';
  if (entries.length > 0) {
    guestCache.set('standings', `standings_${targetCompId}`, entries, 2 * 60 * 1000);
  }
  return entries;
}
