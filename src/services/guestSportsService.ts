import { supabase } from '../lib/supabaseClient';
import type { Match, LeagueTableEntry, Team } from '../types';

// ============================================================================
// 1. STRICT DATA TRANSFER INTERFACES (GUEST DATA CONTRACT)
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

const DEFAULT_TEAM_LOGO = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';

// ============================================================================
// 2. RESILIENT FIXTURE RETRIEVAL (Supports Date Filters & Matchdays)
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
        matchday,
        scheduled_time,
        venue,
        status,
        score_home,
        score_away,
        home_penalty_score,
        away_penalty_score,
        home_team:teams!fixtures_home_team_id_fkey(id, name, short_name, logo_url, color_code),
        away_team:teams!fixtures_away_team_id_fkey(id, name, short_name, logo_url, color_code)
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

    const { data, error } = await query;

    if (error) {
      console.warn('[guestSportsService.getGuestFixtures fallback]:', error.message);
      // Fallback query if constraint name is unaliased
      const fallbackQuery = supabase
        .from('fixtures')
        .select(`
          id,
          competition_id,
          matchday,
          scheduled_time,
          venue,
          status,
          score_home,
          score_away,
          home_penalty_score,
          away_penalty_score,
          home_team_id,
          away_team_id
        `)
        .order('scheduled_time', { ascending: true });

      const { data: fbData, error: fbErr } = await fallbackQuery;
      if (fbErr || !fbData) {
        console.error('[guestSportsService.getGuestFixtures ERROR]:', fbErr?.message);
        return [];
      }

      // Fetch teams separately to reconstruct fixtures
      const { data: teamsData } = await supabase.from('teams').select('id, name, short_name, logo_url, color_code');
      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]));

      return fbData.map((row: any) => {
        const home = teamMap.get(row.home_team_id) || {};
        const away = teamMap.get(row.away_team_id) || {};
        return normalizeFixtureRow({
          ...row,
          home_team: home,
          away_team: away
        });
      });
    }

    // Defensive Normalization: ensure no undefined team objects reach the view
    return (data || []).map(normalizeFixtureRow);
  } catch (err: any) {
    console.error('[guestSportsService.getGuestFixtures EXCEPTION]:', err);
    return [];
  }
}

function normalizeFixtureRow(row: any): GuestFixture {
  const home = Array.isArray(row.home_team) ? row.home_team[0] : row.home_team;
  const away = Array.isArray(row.away_team) ? row.away_team[0] : row.away_team;

  return {
    id: row.id,
    competition_id: row.competition_id || '',
    matchday: row.matchday || 1,
    scheduled_time: row.scheduled_time,
    venue: row.venue || 'Egerton Main Grounds',
    status: (row.status || 'SCHEDULED') as any,
    score_home: typeof row.score_home === 'number' ? row.score_home : 0,
    score_away: typeof row.score_away === 'number' ? row.score_away : 0,
    home_penalty_score: row.home_penalty_score ?? null,
    away_penalty_score: row.away_penalty_score ?? null,
    home_team: {
      id: home?.id || '',
      name: home?.name || 'Home Team',
      short_name: home?.short_name || null,
      logo_url: home?.logo_url || DEFAULT_TEAM_LOGO,
      color_code: home?.color_code || '#059669'
    },
    away_team: {
      id: away?.id || '',
      name: away?.name || 'Away Team',
      short_name: away?.short_name || null,
      logo_url: away?.logo_url || DEFAULT_TEAM_LOGO,
      color_code: away?.color_code || '#2563EB'
    }
  };
}

// ============================================================================
// 3. RESILIENT STANDINGS FETCHER (Direct table query with inner join)
// ============================================================================

export async function getGuestStandings(competitionId?: string): Promise<GuestStanding[]> {
  try {
    let query = supabase
      .from('league_standings')
      .select(`
        played,
        won,
        drawn,
        lost,
        goals_for,
        goals_against,
        goal_difference,
        points,
        team:teams!league_standings_team_id_fkey(id, name, logo_url)
      `)
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false });

    if (competitionId && competitionId !== 'all' && competitionId !== 'ALL' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      query = query.eq('competition_id', competitionId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[guestSportsService.getGuestStandings fallback]:', error.message);
      // Fallback: select without join and merge teams table
      let fbQuery = supabase
        .from('league_standings')
        .select(`team_id, competition_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points`)
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false });

      if (competitionId && competitionId !== 'all' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
        fbQuery = fbQuery.eq('competition_id', competitionId);
      }

      const { data: fbData, error: fbErr } = await fbQuery;
      if (fbErr || !fbData) {
        console.error('[guestSportsService.getGuestStandings ERROR]:', fbErr?.message);
        return [];
      }

      const { data: teamsData } = await supabase.from('teams').select('id, name, logo_url');
      const teamMap = new Map((teamsData || []).map((t: any) => [t.id, t]));

      return fbData.map((row: any) => {
        const tm = teamMap.get(row.team_id) || {};
        return {
          team_id: row.team_id || '',
          team_name: tm.name || 'Campus Team',
          logo_url: tm.logo_url || DEFAULT_TEAM_LOGO,
          played: Number(row.played) || 0,
          won: Number(row.won) || 0,
          drawn: Number(row.drawn) || 0,
          lost: Number(row.lost) || 0,
          goals_for: Number(row.goals_for) || 0,
          goals_against: Number(row.goals_against) || 0,
          goal_difference: Number(row.goal_difference) || 0,
          points: Number(row.points) || 0
        };
      });
    }

    return (data || []).map((row: any) => {
      const tm = Array.isArray(row.team) ? row.team[0] : row.team;
      return {
        team_id: tm?.id || '',
        team_name: tm?.name || 'Club',
        logo_url: tm?.logo_url || DEFAULT_TEAM_LOGO,
        played: Number(row.played) || 0,
        won: Number(row.won) || 0,
        drawn: Number(row.drawn) || 0,
        lost: Number(row.lost) || 0,
        goals_for: Number(row.goals_for) || 0,
        goals_against: Number(row.goals_against) || 0,
        goal_difference: Number(row.goal_difference) || 0,
        points: Number(row.points) || 0
      };
    });
  } catch (err: any) {
    console.error('[guestSportsService.getGuestStandings EXCEPTION]:', err);
    return [];
  }
}

// ============================================================================
// 4. RESILIENT TOP SCORERS (Direct aggregation without RPC vulnerability)
// ============================================================================

export async function getGuestTopScorers(limitCount = 10, competitionId?: string): Promise<GuestTopScorer[]> {
  try {
    // 1. Query match_events directly
    let query = supabase
      .from('match_events')
      .select(`
        player_id,
        player:players!match_events_player_id_fkey(id, first_name, last_name),
        team:teams!match_events_team_id_fkey(name, logo_url)
      `)
      .in('type', ['goal', 'penalty'])
      .limit(500);

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Tally goals in-memory to prevent database lockups & RPC schema mismatches
      const goalMap: Record<string, { name: string; team: string; logo: string | null; count: number }> = {};

      data.forEach((evt: any) => {
        if (!evt.player_id) return;
        const pid = evt.player_id;
        const p = Array.isArray(evt.player) ? evt.player[0] : evt.player;
        const tm = Array.isArray(evt.team) ? evt.team[0] : evt.team;
        const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Player';
        const teamName = tm?.name || 'Club';
        const logoUrl = tm?.logo_url || DEFAULT_TEAM_LOGO;

        if (!goalMap[pid]) {
          goalMap[pid] = { name: fullName || 'Player', team: teamName, logo: logoUrl, count: 0 };
        }
        goalMap[pid].count += 1;
      });

      const scorers = Object.entries(goalMap)
        .map(([playerId, stats]) => ({
          player_id: playerId,
          player_name: stats.name,
          team_name: stats.team,
          logo_url: stats.logo,
          goals: stats.count
        }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, limitCount);

      if (scorers.length > 0) return scorers;
    }

    // 2. Fallback: player_stats table
    let psQuery = supabase
      .from('player_stats')
      .select(`
        player_id,
        goals,
        player:players!player_stats_player_id_fkey(id, first_name, last_name, team:teams!players_team_id_fkey(name, logo_url))
      `)
      .gt('goals', 0)
      .order('goals', { ascending: false })
      .limit(limitCount);

    if (competitionId && competitionId !== 'all' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const { data: psData } = await psQuery;
    if (psData && psData.length > 0) {
      return psData.map((row: any) => {
        const p = Array.isArray(row.player) ? row.player[0] : row.player;
        const tm = Array.isArray(p?.team) ? p.team[0] : p?.team;
        return {
          player_id: row.player_id,
          player_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Player',
          team_name: tm?.name || 'Club',
          logo_url: tm?.logo_url || DEFAULT_TEAM_LOGO,
          goals: Number(row.goals) || 0
        };
      });
    }

    return [];
  } catch (err: any) {
    console.error('[guestSportsService.getGuestTopScorers ERROR]:', err);
    return [];
  }
}

// ============================================================================
// 5. RESILIENT ASSIST LEADERS (Direct aggregation)
// ============================================================================

export async function getGuestAssists(limitCount = 10, competitionId?: string): Promise<GuestAssistLeader[]> {
  try {
    let psQuery = supabase
      .from('player_stats')
      .select(`
        player_id,
        assists,
        player:players!player_stats_player_id_fkey(id, first_name, last_name, team:teams!players_team_id_fkey(name, logo_url))
      `)
      .gt('assists', 0)
      .order('assists', { ascending: false })
      .limit(limitCount);

    if (competitionId && competitionId !== 'all' && /^[0-9a-fA-F-]{36}$/.test(competitionId)) {
      psQuery = psQuery.eq('competition_id', competitionId);
    }

    const { data, error } = await psQuery;
    if (!error && data && data.length > 0) {
      return data.map((row: any) => {
        const p = Array.isArray(row.player) ? row.player[0] : row.player;
        const tm = Array.isArray(p?.team) ? p.team[0] : p?.team;
        return {
          player_id: row.player_id,
          player_name: p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Player',
          team_name: tm?.name || 'Club',
          logo_url: tm?.logo_url || DEFAULT_TEAM_LOGO,
          assists: Number(row.assists) || 0
        };
      });
    }

    return [];
  } catch (err: any) {
    console.error('[guestSportsService.getGuestAssists ERROR]:', err);
    return [];
  }
}

// ============================================================================
// 6. TYPE-SAFE NORMALIZATION ADAPTERS (For seamless component consumption)
// ============================================================================

export function guestFixtureToMatch(gf: GuestFixture): Match {
  const isEpl = gf.competition_id === '11111111-1111-1111-1111-111111111111';
  const isChamp = gf.competition_id === '22222222-2222-2222-2222-222222222222';
  const leagueName = isEpl ? 'Egerton Premier League' : isChamp ? 'Egerton Championship' : 'Campus Football League';

  const d = new Date(gf.scheduled_time);
  const timeFormatted = isNaN(d.getTime())
    ? '15:00'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const teamA: Team = {
    id: gf.home_team.id,
    name: gf.home_team.name,
    shortName: gf.home_team.short_name || gf.home_team.name.substring(0, 3).toUpperCase(),
    logo: gf.home_team.logo_url || DEFAULT_TEAM_LOGO,
    colorCode: gf.home_team.color_code || '#059669',
    club_id: '',
    competition_id: gf.competition_id
  };

  const teamB: Team = {
    id: gf.away_team.id,
    name: gf.away_team.name,
    shortName: gf.away_team.short_name || gf.away_team.name.substring(0, 3).toUpperCase(),
    logo: gf.away_team.logo_url || DEFAULT_TEAM_LOGO,
    colorCode: gf.away_team.color_code || '#2563EB',
    club_id: '',
    competition_id: gf.competition_id
  };

  return {
    id: gf.id,
    status: gf.status as any,
    time: gf.status === 'FT' ? 'FT' : gf.status === 'HT' ? 'HT' : timeFormatted,
    minute: gf.status === 'LIVE' ? "85'" : gf.status === 'HT' ? 'HT' : gf.status === 'FT' ? 'FT' : '-',
    league: leagueName,
    teamA,
    teamB,
    scoreA: gf.score_home,
    scoreB: gf.score_away,
    events: [],
    stats: [],
    lineups: {
      teamA: [],
      teamB: [],
      formationA: '4-3-3',
      formationB: '4-3-3'
    },
    venue: gf.venue,
    referee: 'Appointed Official',
    matchday: gf.matchday,
    homePenaltyScore: gf.home_penalty_score ?? undefined,
    awayPenaltyScore: gf.away_penalty_score ?? undefined,
    scheduledTime: gf.scheduled_time
  };
}

export function guestStandingToLeagueTableEntry(gs: GuestStanding, index: number): LeagueTableEntry {
  return {
    position: index + 1,
    teamId: gs.team_id,
    teamName: gs.team_name,
    teamLogo: gs.logo_url || DEFAULT_TEAM_LOGO,
    played: gs.played,
    won: gs.won,
    drawn: gs.drawn,
    lost: gs.lost,
    goalsFor: gs.goals_for,
    goalsAgainst: gs.goals_against,
    goalDifference: gs.goal_difference,
    points: gs.points,
    lastUpdated: new Date().toISOString()
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
