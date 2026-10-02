import { supabase } from '../lib/supabase';
import type { Match, LeagueTableEntry } from '../types';
import { guestCache } from '../lib/guestCache';
import { resolveAllocatedOfficials } from '../lib/matchdayHelper';
import { DEFAULT_TEAM_LOGO, publicTeamLogo, reconcileLogoStamps } from '../lib/teamLogoCache';

// ============================================================================
// GUEST SPORTS SERVICE v3 — Ultra-Fast Cached In-Memory Lookups & Clean Queries
// ============================================================================

const DEFAULT_LOGO = DEFAULT_TEAM_LOGO;

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
const TEAMS_PROBE_MS = 60_000;
const TEAMS_META_KEY = 'meta_v1';
const TEAMS_REV_KEY = 'rev_v1';
const TEAM_META_COLUMNS = 'id, name, short_name, color_code, updated_at';

function teamRecord(row: any) {
  return {
    id: row.id,
    name: row.name,
    short_name: row.short_name,
    color_code: row.color_code,
    updated_at: row.updated_at || null,
    logo_url: publicTeamLogo(row.id),
  };
}

function readPersistedTeams(): Map<string, any> | null {
  const rows = guestCache.getStale<any[]>('teams', TEAMS_META_KEY);
  if (!rows || rows.length === 0) return null;
  return new Map(rows.map((row) => [row.id, teamRecord(row)]));
}

function persistTeams(rev: string) {
  if (!cachedTeamsMap) return;
  const rows = [...cachedTeamsMap.values()].map((row) => ({
    id: row.id,
    name: row.name,
    short_name: row.short_name,
    color_code: row.color_code,
    updated_at: row.updated_at || null,
  }));
  guestCache.set('teams', TEAMS_META_KEY, rows, 24 * 60 * 60 * 1000);
  if (rev) guestCache.set('teams', TEAMS_REV_KEY, rev, 24 * 60 * 60 * 1000);
  teamsCacheTimestamp = Date.now();
}

async function loadAllTeamMeta(revHint?: string): Promise<Map<string, any>> {
  let { data, error } = await supabase.from('teams').select(TEAM_META_COLUMNS);
  if (error) {
    const retry = await supabase.from('teams').select('id, name, short_name, color_code');
    data = (retry.data || []).map((team: any) => ({ ...team, updated_at: null }));
  }
  const rows = data || [];
  cachedTeamsMap = new Map(rows.map((row: any) => [row.id, teamRecord(row)]));
  const rev = revHint || rows.reduce((max: string, row: any) => (
    row.updated_at && row.updated_at > max ? row.updated_at : max
  ), '');
  persistTeams(rev);
  return cachedTeamsMap;
}

async function getTeamsMap(): Promise<Map<string, any>> {
  if (!cachedTeamsMap) cachedTeamsMap = readPersistedTeams();
  if (cachedTeamsMap && Date.now() - teamsCacheTimestamp < TEAMS_PROBE_MS) {
    return cachedTeamsMap;
  }
  if (inFlightTeamsPromise) return inFlightTeamsPromise;

  inFlightTeamsPromise = (async () => {
    try {
      const persistedRev = guestCache.getStale<string>('teams', TEAMS_REV_KEY) || '';
      const latest = await supabase
        .from('teams')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (latest.error || !cachedTeamsMap) {
        if (cachedTeamsMap && latest.error) return cachedTeamsMap;
        const rev = latest.data?.[0]?.updated_at || '';
        return loadAllTeamMeta(rev);
      }

      const rev = latest.data?.[0]?.updated_at || '';
      if (rev && rev === persistedRev) {
        teamsCacheTimestamp = Date.now();
        return cachedTeamsMap;
      }

      const stamps = await supabase.from('teams').select('id, updated_at');
      if (stamps.error || !stamps.data) return cachedTeamsMap;

      const seen = new Set<string>();
      const changedIds: string[] = [];
      for (const row of stamps.data) {
        seen.add(row.id);
        const prev = cachedTeamsMap.get(row.id);
        if (!prev || (prev.updated_at || '') !== (row.updated_at || '')) changedIds.push(row.id);
      }
      for (const id of [...cachedTeamsMap.keys()]) {
        if (!seen.has(id)) cachedTeamsMap.delete(id);
      }

      if (changedIds.length > 0) {
        const changed = await supabase.from('teams').select(TEAM_META_COLUMNS).in('id', changedIds);
        if (!changed.error && changed.data) {
          for (const row of changed.data) cachedTeamsMap.set(row.id, teamRecord(row));
          reconcileLogoStamps(changed.data.map((t: any) => ({ id: t.id, updated_at: t.updated_at })));
        }
      }

      persistTeams(rev);
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

const FIXTURE_COLUMNS = 'id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away,home_penalty_score,away_penalty_score,updated_at';
const FIXTURE_TTL = 6 * 60 * 60 * 1000;
const lastRevalidateTimes = new Map<string, number>();
const REVALIDATE_COOLDOWN_MS = 60_000;

function fixtureCacheKey(params?: { competitionId?: string; date?: string; matchday?: number }) {
  return `${params?.competitionId || 'all'}_${params?.date || 'all'}_m${params?.matchday || 'all'}`;
}

function fixtureStampKey(cacheKey: string) {
  return `stamps_${cacheKey}`;
}

function fixtureUiKey(params?: { competitionId?: string; date?: string }) {
  return `${params?.competitionId || 'all'}_${params?.date || 'all'}_pall_sall`;
}

function applyGuestFixtureFilters(query: any, params?: { competitionId?: string; date?: string; matchday?: number }) {
  let next = query;
  if (params?.competitionId && params.competitionId !== 'all' && params.competitionId !== 'ALL') {
    const compId = (params.competitionId === 'friendlies' || params.competitionId === 'friendly')
      ? '33333333-3333-3333-3333-333333333333'
      : params.competitionId;
    next = next.eq('competition_id', compId);
  }
  if (params?.matchday) next = next.eq('matchday', params.matchday);
  if (params?.date && params.date !== 'all') {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : new Date(params.date).toISOString().split('T')[0];
    next = next.gte('scheduled_time', `${d}T00:00:00.000Z`).lte('scheduled_time', `${d}T23:59:59.999Z`);
  }
  return next;
}

function publishGuestFixtures(
  params: { competitionId?: string; date?: string; matchday?: number } | undefined,
  cacheKey: string,
  fixtures: GuestFixture[],
  stamps: Record<string, string>,
  notify: boolean,
) {
  if (hasPlaceholderTeamData(fixtures)) return;
  guestCache.set('fixtures', cacheKey, fixtures, FIXTURE_TTL, false);
  guestCache.set('fixtures', fixtureStampKey(cacheKey), stamps, FIXTURE_TTL, false);
  const matches = fixtures.map((fixture) => guestFixtureToMatch(fixture)).filter(Boolean);
  if (hasPlaceholderTeamData(matches)) return;
  guestCache.set('fixtures', fixtureUiKey(params), matches, FIXTURE_TTL, notify);
}

async function probeFixtureStamps(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<Array<{ id: string; updated_at: string | null }> | null> {
  try {
    const query = applyGuestFixtureFilters(
      supabase.from('fixtures').select('id, updated_at').order('scheduled_time', { ascending: true }),
      params,
    );
    const { data, error } = await query;
    if (error) return null;
    return (data || []) as Array<{ id: string; updated_at: string | null }>;
  } catch {
    return null;
  }
}

async function fetchGuestFixturesByIds(ids: string[]): Promise<GuestFixture[] | null> {
  if (ids.length === 0) return [];
  try {
    const [fixtureRes, teamMap, compMap] = await Promise.all([
      supabase.from('fixtures').select(FIXTURE_COLUMNS).in('id', ids),
      getTeamsMap(),
      getCompetitionsMap(),
    ]);
    if (fixtureRes.error || !fixtureRes.data) return null;
    return fixtureRes.data.map((row: any) => rowToGuestFixture(row, teamMap, compMap));
  } catch {
    return null;
  }
}

async function revalidateGuestFixtures(
  params: { competitionId?: string; date?: string; matchday?: number } | undefined,
  cacheKey: string,
  cached: GuestFixture[],
) {
  const probe = await Promise.all([probeFixtureStamps(params), getTeamsMap()]).then(([stamps]) => stamps);
  if (!probe) return;

  const stamps = guestCache.getStale<Record<string, string>>('fixtures', fixtureStampKey(cacheKey)) || {};
  const probeById = new Map(probe.map((row) => [row.id, row.updated_at || '']));
  const changedIds = probe
    .filter((row) => stamps[row.id] !== (row.updated_at || ''))
    .map((row) => row.id);
  const removed = cached.some((fixture) => !probeById.has(fixture.id)) || cached.length !== probe.length;
  if (changedIds.length === 0 && !removed) return;

  const fetched = changedIds.length > 0 ? await fetchGuestFixturesByIds(changedIds) : [];
  if (fetched === null) return;

  const fetchedById = new Map(fetched.map((fixture) => [fixture.id, fixture]));
  const previous = new Map(cached.map((fixture) => [fixture.id, fixture]));
  const merged: GuestFixture[] = [];
  for (const row of probe) {
    const next = fetchedById.get(row.id) || previous.get(row.id);
    if (next) merged.push(next);
  }
  if (hasPlaceholderTeamData(merged)) return;

  const nextStamps: Record<string, string> = {};
  for (const row of probe) nextStamps[row.id] = row.updated_at || '';
  publishGuestFixtures(params, cacheKey, merged, nextStamps, true);
}

async function fetchGuestFixturesNetwork(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}, notify = false): Promise<GuestFixture[]> {
  const cacheKey = fixtureCacheKey(params);

  if (inFlightFixturesPromises.has(cacheKey)) {
    return inFlightFixturesPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const loaded = await loadGuestFixtureRows(params);
      if (loaded.fixtures.length > 0 && !hasPlaceholderTeamData(loaded.fixtures)) {
        publishGuestFixtures(params, cacheKey, loaded.fixtures, loaded.stamps, notify);
      }
      return loaded.fixtures;
    } catch (err: any) {
      console.error('[guestSportsService] getGuestFixtures exception:', err);
      const loaded = await loadGuestFixtureRows(params);
      return loaded.fixtures;
    } finally {
      inFlightFixturesPromises.delete(cacheKey);
    }
  })();

  inFlightFixturesPromises.set(cacheKey, promise);
  return promise;
}

function readStoredFixtures(cacheKey: string): GuestFixture[] | null {
  const stale = guestCache.getStale<GuestFixture[]>('fixtures', cacheKey);
  if (stale && stale.length > 0 && !hasPlaceholderTeamData(stale)) return stale;
  return null;
}

export async function getGuestFixturesFast(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<GuestFixture[]> {
  const cacheKey = fixtureCacheKey(params);
  const cached = readStoredFixtures(cacheKey);
  if (cached && cached.length > 0) {
    const now = Date.now();
    const lastReval = lastRevalidateTimes.get(cacheKey) || 0;
    if (now - lastReval > REVALIDATE_COOLDOWN_MS) {
      lastRevalidateTimes.set(cacheKey, now);
      void revalidateGuestFixtures(params, cacheKey, cached);
    }
    return cached;
  }

  const data = await fetchGuestFixturesNetwork(params, false);
  return data || [];
}

export async function getGuestFixtures(params?: {
  competitionId?: string;
  date?: string; // YYYY-MM-DD
  matchday?: number;
}): Promise<GuestFixture[]> {
  return getGuestFixturesFast(params);
}

function rowToGuestFixture(f: any, teamMap: Map<string, any>, compMap: Map<string, string>): GuestFixture {
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
}

async function loadGuestFixtureRows(params?: {
  competitionId?: string;
  date?: string;
  matchday?: number;
}): Promise<{ fixtures: GuestFixture[]; stamps: Record<string, string> }> {
  try {
    let query = applyGuestFixtureFilters(
      supabase.from('fixtures').select(FIXTURE_COLUMNS).order('scheduled_time', { ascending: true }),
      params,
    );
    let fixtureRes = await Promise.all([query, getTeamsMap(), getCompetitionsMap()]).then(async ([res, teamMap, compMap]) => {
      if (res.error && String(res.error.message || '').toLowerCase().includes('updated_at')) {
        const narrow = applyGuestFixtureFilters(
          supabase.from('fixtures').select('id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away,home_penalty_score,away_penalty_score').order('scheduled_time', { ascending: true }),
          params,
        );
        const retry = await narrow;
        return { res: retry, teamMap, compMap };
      }
      return { res, teamMap, compMap };
    });

    const fixtureRows = fixtureRes.res.data;
    if (fixtureRes.res.error || !fixtureRows) return { fixtures: [], stamps: {} };

    const stamps: Record<string, string> = {};
    for (const row of fixtureRows as any[]) {
      if (row?.id) stamps[row.id] = row.updated_at || '';
    }
    return {
      fixtures: (fixtureRows as any[]).map((row) => rowToGuestFixture(row, fixtureRes.teamMap, fixtureRes.compMap)),
      stamps,
    };
  } catch {
    return { fixtures: [], stamps: {} };
  }
}

/**
 * Adjacent matchdays are filled by the homepage date prefetch.
 * A 90-day preload downloaded the season and crest bytes on every visit.
 */
export async function preloadPastFixtures(_currentDateStr?: string, _competitionId?: string): Promise<void> {
  return;
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
        supabase.from('teams').select('id, name, updated_at').eq('competition_id', targetCompId),
        supabase
          .from('fixtures')
          .select('home_team_id, away_team_id, score_home, score_away, matchday, scheduled_time, status')
          .eq('competition_id', targetCompId)
          .in('status', ['FT', 'FINISHED', 'ft', 'finished'])
          .order('matchday', { ascending: true })
          .order('scheduled_time', { ascending: true }),
      ]);

      if (teamsRes.error || fixturesRes.error || !teamsRes.data || teamsRes.data.length === 0) {
        const stale = readCachedLeagueTable(targetCompId);
        return stale.map((row) => ({
          team_id: row.teamId,
          team_name: row.teamName,
          logo_url: publicTeamLogo(row.teamId, row.teamLogo),
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goals_for: row.goalsFor,
          goals_against: row.goalsAgainst,
          goal_difference: row.goalDifference,
          points: row.points,
        }));
      }

      reconcileLogoStamps((teamsRes.data || []).map((t: any) => ({ id: t.id, updated_at: t.updated_at })));

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
          logo_url: publicTeamLogo(teamId, team.logo_url),
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

      const forms: Record<string, MatchFormMark[]> = {};
      acc.forEach((row, teamId) => {
        forms[teamId] = row.form;
      });
      guestCache.set('standings', `forms_${targetCompId}`, forms, 6 * 60 * 60 * 1000);
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

function restoreCachedForms(compId: string): void {
  const cached = guestCache.getStale<Record<string, MatchFormMark[]>>('standings', `forms_${compId}`);
  if (!cached) return;
  Object.entries(cached).forEach(([teamId, marks]) => {
    if (!matchFormByTeam.has(teamId)) matchFormByTeam.set(teamId, marks);
  });
}

export async function getMatchFormsForTeams(teamIds: string[]): Promise<Record<string, MatchFormMark[]>> {
  restoreCachedForms('11111111-1111-1111-1111-111111111111');
  restoreCachedForms('22222222-2222-2222-2222-222222222222');
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

    if (psErr) {
      const stored = guestCache.getStale<GuestTopScorer[]>('players', cacheKey);
      if (stored && stored.length > 0) return stored;
    }

    if (psErr || !psRows || psRows.length === 0) {
      const fallbackResults = await getTopScorersFromEvents(limitCount, competitionId);
      if (fallbackResults && fallbackResults.length > 0) {
        guestCache.set('players', cacheKey, fallbackResults, 2 * 60 * 1000);
        return fallbackResults;
      }
      const stored = guestCache.getStale<GuestTopScorer[]>('players', cacheKey);
      if (psErr && stored && stored.length > 0) return stored;
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
    const stored = guestCache.getStale<GuestTopScorer[]>('players', cacheKey);
    return stored && stored.length > 0 ? stored : [];
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
    const stored = guestCache.getStale<GuestAssistLeader[]>('players', cacheKey);
    return stored && stored.length > 0 ? stored : [];
  }
}

export async function getGuestCleanSheets(limitCount = 10, competitionId?: string): Promise<GuestCleanSheetLeader[]> {
  const cacheKey = `cleansheets_${competitionId || 'all'}_${limitCount}`;

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
    const stored = guestCache.getStale<GuestCleanSheetLeader[]>('players', cacheKey);
    return stored && stored.length > 0 ? stored : [];
  }
}

// ============================================================================
// TYPE ADAPTERS
// ============================================================================

export function guestFixtureToMatch(gf: any): Match {
  if (!gf) return null as any;
  if (gf.teamA && gf.teamB && gf.teamA.id && gf.teamB.id) {
    return gf as Match;
  }

  const d = new Date(gf.scheduled_time || gf.scheduledTime || '');
  const timeFormatted = isNaN(d.getTime())
    ? '15:00'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const officials = resolveAllocatedOfficials(gf.id);
  const cr = gf.referee || officials.centerReferee || undefined;
  const crId = gf.referee_id || officials.centerRefereeId || undefined;
  const lA = gf.linesman_team_a_name || officials.linesmanTeamA || undefined;
  const lB = gf.linesman_team_b_name || officials.linesmanTeamB || undefined;

  const home = gf.home_team || gf.teamA || {};
  const away = gf.away_team || gf.teamB || {};
  const homeId = home.id || gf.home_team_id || gf.homeTeamId || '';
  const awayId = away.id || gf.away_team_id || gf.awayTeamId || '';

  return {
    id: gf.id,
    status: (gf.status || 'UPCOMING') as any,
    time: gf.status === 'FT' ? 'FT' : gf.status === 'HT' ? 'HT' : timeFormatted,
    minute: gf.status === 'LIVE' ? "85'" : gf.status === 'HT' ? 'HT' : gf.status === 'FT' ? 'FT' : '-',
    league: gf.competition_name || gf.league || 'Campus Football',
    teamA: {
      id: homeId,
      name: home.name || 'Home Team',
      shortName: home.short_name || home.shortName || (home.name ? home.name.substring(0, 3).toUpperCase() : 'HOM'),
      logo: publicTeamLogo(homeId, home.logo || home.logo_url),
      colorCode: home.color_code || home.colorCode || '#059669',
      club_id: home.club_id || '',
      competition_id: gf.competition_id || '',
    },
    teamB: {
      id: awayId,
      name: away.name || 'Away Team',
      shortName: away.short_name || away.shortName || (away.name ? away.name.substring(0, 3).toUpperCase() : 'AWY'),
      logo: publicTeamLogo(awayId, away.logo || away.logo_url),
      colorCode: away.color_code || away.colorCode || '#2563EB',
      club_id: away.club_id || '',
      competition_id: gf.competition_id || '',
    },
    scoreA: typeof gf.score_home === 'number' ? gf.score_home : (typeof gf.scoreA === 'number' ? gf.scoreA : 0),
    scoreB: typeof gf.score_away === 'number' ? gf.score_away : (typeof gf.scoreB === 'number' ? gf.scoreB : 0),
    events: gf.events || [],
    stats: gf.stats || [],
    lineups: gf.lineups || { teamA: [], teamB: [], formationA: '4-3-3', formationB: '4-3-3' },
    venue: gf.venue || 'Egerton Main Grounds',
    referee: cr || 'Accredited League Referee',
    centerReferee: cr,
    refereeId: crId,
    centerRefereeId: crId,
    linesmanTeamAName: lA,
    linesmanTeamBName: lB,
    matchday: gf.matchday || 1,
    homePenaltyScore: gf.home_penalty_score ?? gf.homePenaltyScore ?? undefined,
    awayPenaltyScore: gf.away_penalty_score ?? gf.awayPenaltyScore ?? undefined,
    scheduledTime: gf.scheduled_time || gf.scheduledTime,
  };
}


export function guestStandingToLeagueTableEntry(gs: any, index: number): LeagueTableEntry {
  if (!gs) return null as any;
  const teamId = gs.team_id || gs.teamId || '';
  const teamName = gs.team_name || gs.teamName || 'Team';
  const logoUrl = gs.logo_url || gs.teamLogo || null;
  return {
    position: typeof gs.position === 'number' ? gs.position : index + 1,
    teamId,
    teamName,
    teamLogo: publicTeamLogo(teamId, logoUrl),
    played: gs.played ?? 0,
    won: gs.won ?? 0,
    drawn: gs.drawn ?? 0,
    lost: gs.lost ?? 0,
    goalsFor: gs.goals_for ?? gs.goalsFor ?? 0,
    goalsAgainst: gs.goals_against ?? gs.goalsAgainst ?? 0,
    goalDifference: gs.goal_difference ?? gs.goalDifference ?? 0,
    points: gs.points ?? 0,
    lastUpdated: gs.lastUpdated || new Date().toISOString(),
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
    guestCache.set('standings', `standings_${targetCompId}`, entries, 6 * 60 * 60 * 1000);
    return entries;
  }
  return readCachedLeagueTable(targetCompId);
}

export function readCachedLeagueTable(compId: string): LeagueTableEntry[] {
  const rows = guestCache.getStale<any[]>('standings', `standings_${compId}`) || [];
  if (rows.length === 0) return [];
  if (rows[0]?.teamName) return rows as LeagueTableEntry[];
  if (rows[0]?.team_name || rows[0]?.team_id) {
    return rows.map((row, index) => guestStandingToLeagueTableEntry(row, index));
  }
  return [];
}
