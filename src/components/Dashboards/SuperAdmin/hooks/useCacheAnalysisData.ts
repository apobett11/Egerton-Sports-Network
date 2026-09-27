import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export type CacheOption = 'kits' | 'squad' | 'events' | 'logo';

export type MatchMark = 'tick' | 'double' | 'cross' | 'none';

export interface CacheMatchCell {
  fixtureId: string;
  matchday: number;
  opponentName: string;
  isHome: boolean;
  mark: MatchMark;
}

export interface CacheCoach {
  name: string;
  email: string;
}

export interface CacheTeamRow {
  id: string;
  index: number;
  name: string;
  logoUrl: string | null;
  leagueId: string;
  leagueName: string;
  hasCoach: boolean;
  coach: CacheCoach | null;
  matchesPlayed: number;
  cells: Record<number, CacheMatchCell>;
}

export interface CacheLeagueTable {
  id: string;
  name: string;
  matchdays: number[];
  teams: CacheTeamRow[];
}

interface RawBundle {
  teams: any[];
  profiles: any[];
  competitions: any[];
  fixtures: any[];
  lineups: any[];
  events: any[];
}

const FINISHED_STATUSES = ['FT', 'FINISHED', 'FINALIZED', 'COMPLETED', 'AET', 'PEN', 'FULL_TIME', 'FULLTIME'];
const PAGE = 1000;

async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>) {
  const rows: any[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(',').map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

function teamHasKits(team: any): boolean {
  if (Array.isArray(team?.kits_config) && team.kits_config.length > 0) return true;
  if (team?.kits && typeof team.kits === 'object' && !Array.isArray(team.kits) && Object.keys(team.kits).length > 0) {
    return true;
  }
  return false;
}

function teamHasLogo(team: any): boolean {
  const url = typeof team?.logo_url === 'string' ? team.logo_url.trim() : '';
  if (url.length < 8) return false;
  if (url.startsWith('data:')) return false;
  if (url.toLowerCase().includes('placeholder')) return false;
  return true;
}

function isFinished(status: unknown): boolean {
  return FINISHED_STATUSES.includes(String(status || '').trim().toUpperCase());
}

function isFriendlyCompetition(name: string): boolean {
  return name.toLowerCase().includes('friend');
}

function squadMark(lineup: { starting_xi: unknown[]; substitutes: unknown[] } | undefined): MatchMark {
  if (!lineup) return 'cross';
  const xi = lineup.starting_xi.length >= 11;
  const subs = lineup.substitutes.length > 0;
  if (xi && subs) return 'double';
  if (xi) return 'tick';
  return 'cross';
}

function markForOption(
  option: CacheOption,
  team: any,
  lineup: { starting_xi: unknown[]; substitutes: unknown[] } | undefined,
  hasEvents: boolean,
): MatchMark {
  if (option === 'kits') return teamHasKits(team) ? 'tick' : 'cross';
  if (option === 'logo') return teamHasLogo(team) ? 'tick' : 'cross';
  if (option === 'events') return hasEvents ? 'tick' : 'cross';
  return squadMark(lineup);
}

function buildTables(raw: RawBundle, option: CacheOption): CacheLeagueTable[] {
  const competitionName = new Map<string, string>();
  raw.competitions.forEach((c) => {
    if (c?.id) competitionName.set(String(c.id), String(c.name || 'League'));
  });

  const profileById = new Map<string, any>();
  raw.profiles.forEach((p) => {
    if (p?.id) profileById.set(String(p.id), p);
  });

  const teamName = new Map<string, string>();
  raw.teams.forEach((t) => {
    if (t?.id) teamName.set(String(t.id), String(t.name || 'Team'));
  });

  const lineupMap = new Map<string, { starting_xi: unknown[]; substitutes: unknown[] }>();
  raw.lineups.forEach((row) => {
    if (!row?.fixture_id || !row?.team_id) return;
    lineupMap.set(`${row.fixture_id}__${row.team_id}`, {
      starting_xi: asList(row.starting_xi),
      substitutes: asList(row.substitutes),
    });
  });

  const eventKeys = new Set<string>();
  raw.events.forEach((row) => {
    if (row?.fixture_id && row?.team_id) eventKeys.add(`${row.fixture_id}__${row.team_id}`);
  });

  const finished = raw.fixtures.filter((f) => f?.id && isFinished(f.status));

  const leagueIds = new Set<string>();
  raw.teams.forEach((t) => {
    if (t?.competition_id) leagueIds.add(String(t.competition_id));
  });

  const leagues: CacheLeagueTable[] = [];

  leagueIds.forEach((leagueId) => {
    const name = competitionName.get(leagueId) || 'League';
    if (isFriendlyCompetition(name)) return;

    const leagueTeams = raw.teams.filter((t) => String(t.competition_id) === leagueId);
    const leagueFixtures = finished.filter((f) => {
      const homeIn = leagueTeams.some((t) => t.id === f.home_team_id);
      const awayIn = leagueTeams.some((t) => t.id === f.away_team_id);
      if (f.competition_id) return String(f.competition_id) === leagueId;
      return homeIn || awayIn;
    });

    const matchdays = Array.from(
      new Set(
        leagueFixtures
          .map((f) => Number(f.matchday) || 0)
          .filter((md) => md > 0),
      ),
    ).sort((a, b) => a - b);

    const teams: CacheTeamRow[] = leagueTeams
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((team, idx) => {
        const coachProfile = team.coach_id ? profileById.get(String(team.coach_id)) : null;
        const coachName = coachProfile
          ? `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim()
          : '';
        const hasCoach = Boolean(coachProfile && coachName);
        const cells: Record<number, CacheMatchCell> = {};

        leagueFixtures.forEach((fixture) => {
          const involved = fixture.home_team_id === team.id || fixture.away_team_id === team.id;
          if (!involved) return;
          const matchday = Number(fixture.matchday) || 0;
          if (!matchday || cells[matchday]) return;
          const isHome = fixture.home_team_id === team.id;
          const opponentId = isHome ? fixture.away_team_id : fixture.home_team_id;
          const key = `${fixture.id}__${team.id}`;
          cells[matchday] = {
            fixtureId: String(fixture.id),
            matchday,
            opponentName: teamName.get(String(opponentId)) || 'Opponent',
            isHome,
            mark: markForOption(option, team, lineupMap.get(key), eventKeys.has(key)),
          };
        });

        const matchesPlayed = Object.keys(cells).length;

        return {
          id: String(team.id),
          index: idx + 1,
          name: String(team.name || 'Team'),
          logoUrl: typeof team.logo_url === 'string' && team.logo_url.trim() ? team.logo_url : null,
          leagueId,
          leagueName: name,
          hasCoach,
          coach: hasCoach
            ? { name: coachName, email: String(coachProfile.email || '') }
            : null,
          matchesPlayed,
          cells,
        };
      });

    leagues.push({ id: leagueId, name, matchdays, teams });
  });

  leagues.sort((a, b) => a.name.localeCompare(b.name));
  return leagues;
}

export function useCacheAnalysisData(enabled: boolean, option: CacheOption | null) {
  const [raw, setRaw] = useState<RawBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const enabledRef = useRef(enabled);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  enabledRef.current = enabled;

  const leagues = useMemo(
    () => (raw && option ? buildTables(raw, option) : []),
    [raw, option],
  );

  const load = useCallback(async (initial: boolean) => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    if (initial) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [teams, profiles, competitions, fixtures, lineups, events] = await Promise.all([
        fetchAll((from, to) => supabase.from('teams').select('*').range(from, to)),
        fetchAll((from, to) =>
          supabase.from('profiles').select('id, first_name, last_name, email').range(from, to),
        ),
        fetchAll((from, to) => supabase.from('competitions').select('id, name').range(from, to)),
        fetchAll((from, to) =>
          supabase
            .from('fixtures')
            .select('id, home_team_id, away_team_id, matchday, competition_id, status')
            .order('matchday', { ascending: true })
            .range(from, to),
        ),
        fetchAll((from, to) =>
          supabase.from('match_lineups').select('fixture_id, team_id, starting_xi, substitutes').range(from, to),
        ),
        fetchAll((from, to) =>
          supabase.from('match_events').select('fixture_id, team_id').range(from, to),
        ),
      ]);

      if (!enabledRef.current) return;
      setRaw({ teams, profiles, competitions, fixtures, lineups, events });
      setUpdatedAt(new Date().toLocaleTimeString());
      setError(null);
    } catch (err: any) {
      if (!enabledRef.current) return;
      setError(err?.message || 'Failed to load cache analysis from the database.');
    } finally {
      inFlightRef.current = false;
      if (enabledRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      if (queuedRef.current && enabledRef.current) {
        queuedRef.current = false;
        void load(false);
      } else {
        queuedRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void load(true);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void load(false);
      }, 400);
    };

    const channel = supabase
      .channel('admin-cache-analysis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, schedule)
      .subscribe();

    const poll = window.setInterval(() => {
      void load(false);
    }, 12000);

    const onFocus = () => {
      void load(false);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (timer) clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [enabled, load]);

  return { leagues, isLoading, isRefreshing, error, updatedAt, reload: () => load(false) };
}
