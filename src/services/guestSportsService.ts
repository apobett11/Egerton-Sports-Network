import { supabase } from '../lib/supabase';
import type { Match, LeagueTableEntry } from '../types';

// ============================================================================
// GUEST SPORTS SERVICE v3 — Ultra-Fast Cached In-Memory Lookups & Clean Queries
// ============================================================================

const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';

// In-memory caches for static master data (60 second TTL)
let cachedTeamsMap: Map<string, any> | null = null;
let teamsCacheTimestamp = 0;
let cachedCompetitionsMap: Map<string, string> | null = null;
let competitionsCacheTimestamp = 0;

const CACHE_TTL = 60000; // 60 seconds

async function getTeamsMap(): Promise<Map<string, any>> {
  const now = Date.now();
  if (cachedTeamsMap && now - teamsCacheTimestamp < CACHE_TTL) {
    return cachedTeamsMap;
  }
  const { data } = await supabase
    .from('teams')
    .select('id, name, short_name, logo_url, color_code');
  
  cachedTeamsMap = new Map<string, any>((data || []).map((t: any) => [t.id, t]));
  teamsCacheTimestamp = now;
  return cachedTeamsMap;
}

async function getCompetitionsMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedCompetitionsMap && now - competitionsCacheTimestamp < CACHE_TTL) {
    return cachedCompetitionsMap;
  }
  const { data } = await supabase
    .from('competitions')
    .select('id, name');
  
  cachedCompetitionsMap = new Map<string, string>((data || []).map((c: any) => [c.id, c.name]));
  competitionsCacheTimestamp = now;
  return cachedCompetitionsMap;
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

// ============================================================================
// SECTION 1: FIXTURES
// ============================================================================

export async function getGuestFixtures(params?: {
  competitionId?: string;
  date?: string; // YYYY-MM-DD
  matchday?: number;
}): Promise<GuestFixture[]> {
  try {
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
      .order('scheduled_time', { ascending: true });

    if (params?.competitionId && params.competitionId !== 'all' && params.competitionId !== 'ALL') {
      query = query.eq('competition_id', params.competitionId);
    }
    if (params?.matchday) {
      query = query.eq('matchday', params.matchday);
    }
    if (params?.date && params.date !== 'all') {
      const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(params.date)
        ? params.date
        : new Date(params.date).toISOString().split('T')[0];
      query = query
        .gte('scheduled_time', `${dateStr}T00:00:00.000Z`)
        .lte('scheduled_time', `${dateStr}T23:59:59.999Z`);
    }

    const [fixtureRes, teamMap, compMap] = await Promise.all([
      query,
      getTeamsMap(),
      getCompetitionsMap()
    ]);

    const fixtureRows = fixtureRes.data;
    if (fixtureRes.error || !fixtureRows || fixtureRows.length === 0) {
      return [];
    }

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
        home_team: {
          id: home.id || '',
          name: home.name || 'Home Team',
          short_name: home.short_name || null,
          logo_url: home.logo_url || DEFAULT_LOGO,
          color_code: home.color_code || '#059669',
        },
        away_team: {
          id: away.id || '',
          name: away.name || 'Away Team',
          short_name: away.short_name || null,
          logo_url: away.logo_url || DEFAULT_LOGO,
          color_code: away.color_code || '#2563EB',
        },
      };
    });
  } catch (err: any) {
    console.error('[guestSportsService] getGuestFixtures exception:', err);
    return [];
  }
}

// ============================================================================
// SECTION 2: STANDINGS
// ============================================================================

export async function getGuestStandings(competitionId?: string): Promise<GuestStanding[]> {
  try {
    let query = supabase
      .from('league_standings')
      .select('team_id, competition_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points')
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false });

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      query = query.eq('competition_id', competitionId);
    }

    const [standingsRes, teamMap] = await Promise.all([
      query,
      getTeamsMap()
    ]);

    const rows = standingsRes.data;
    if (standingsRes.error || !rows || rows.length === 0) {
      return [];
    }

    return rows.map((row: any): GuestStanding => {
      const tm = teamMap.get(row.team_id) || {};
      return {
        team_id: row.team_id || '',
        team_name: tm.name || 'Campus Team',
        logo_url: tm.logo_url || DEFAULT_LOGO,
        played: Number(row.played) || 0,
        won: Number(row.won) || 0,
        drawn: Number(row.drawn) || 0,
        lost: Number(row.lost) || 0,
        goals_for: Number(row.goals_for) || 0,
        goals_against: Number(row.goals_against) || 0,
        goal_difference: Number(row.goal_difference) || 0,
        points: Number(row.points) || 0,
      };
    });
  } catch (err: any) {
    console.error('[guestSportsService] getGuestStandings exception:', err);
    return [];
  }
}

// ============================================================================
// SECTION 3: TOP SCORERS
// ============================================================================

export async function getGuestTopScorers(limitCount = 10, competitionId?: string): Promise<GuestTopScorer[]> {
  try {
    let psQuery = supabase
      .from('player_stats')
      .select('player_id, competition_id, goals')
      .gt('goals', 0)
      .order('goals', { ascending: false })
      .limit(limitCount * 3);

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const { data: psRows, error: psErr } = await psQuery;

    if (psErr || !psRows || psRows.length === 0) {
      return await getTopScorersFromEvents(limitCount, competitionId);
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

    return [...aggregated.values()]
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limitCount);
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

    return [...aggregated.values()]
      .sort((a, b) => b.assists - a.assists)
      .slice(0, limitCount);
  } catch (err: any) {
    console.error('[guestSportsService] getGuestAssists exception:', err);
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
    referee: 'Appointed Official',
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
  return standings.map((s, idx) => guestStandingToLeagueTableEntry(s, idx));
}
