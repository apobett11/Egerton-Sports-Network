import { useCallback, useEffect, useRef, useState } from 'react';
import { TEAM_ADMIN_COLUMNS } from '../../../../lib/teamColumns';
import { supabase } from '../../../../lib/supabase';
import { isSessionActive } from '../../../../lib/inactivityManager';
import { canMakeDashboardCall, recordSessionCall } from '../../../../lib/sessionBudgetManager';

export type CacheOption = 'kits' | 'squad' | 'events' | 'logo';

export interface PreparednessCoach {
  name: string;
  email: string;
  phone: string;
}

export interface KitFlags {
  kit1: boolean;
  kit2: boolean;
  kit3: boolean;
  gk: boolean;
}

export interface MatchCell {
  opponentName: string;
  isHome: boolean;
  squad: boolean;
  events: boolean;
  squadNames: string[];
  eventLines: string[];
}

export interface PreparednessTeam {
  id: string;
  index: number;
  name: string;
  logoUrl: string | null;
  leagueName: string;
  hasCoach: boolean;
  coach: PreparednessCoach | null;
  kits: KitFlags;
  hasLogo: boolean;
  cells: Record<number, MatchCell>;
}

export interface PreparednessLeague {
  id: string;
  name: string;
  matchdayTo: number;
  matchdays: number[];
  teams: PreparednessTeam[];
}

export interface PreparednessSummary {
  headline: string;
  detail: string;
  filed: number;
  expected: number;
  completeTeams: number;
  totalTeams: number;
}

interface RawBundle {
  teams: any[];
  profiles: any[];
  competitions: any[];
  fixtures: any[];
  lineups: any[];
  events: any[];
  players: any[];
}

const PAGE = 1000;

const SLOT_IDS: Record<keyof KitFlags, string[]> = {
  kit1: ['home', 'kit1', 'kit_1', '1', 'first'],
  kit2: ['away', 'kit2', 'kit_2', '2', 'second'],
  kit3: ['third', 'kit3', 'kit_3', '3'],
  gk: ['gk', 'goalkeeper', 'keeper', 'goalkeeper_kit'],
};

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

function isUploadedAsset(url: unknown): boolean {
  const value = typeof url === 'string' ? url.trim() : '';
  if (value.length < 8) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith('data:')) return false;
  if (lower.startsWith('blob:')) return false;
  if (lower.includes('placeholder')) return false;
  if (lower.includes('unsplash.com')) return false;
  if (lower.includes('picsum.photos')) return false;
  return true;
}

function kitEntryUploaded(entry: unknown): boolean {
  if (typeof entry === 'string') return isUploadedAsset(entry);
  if (!entry || typeof entry !== 'object') return false;
  const rec = entry as Record<string, unknown>;
  return isUploadedAsset(rec.imageUrl || rec.image_url || rec.url || rec.src);
}

function readKits(value: unknown): KitFlags {
  const flags: KitFlags = { kit1: false, kit2: false, kit3: false, gk: false };
  if (typeof value === 'string' && value.trim()) {
    try {
      return readKits(JSON.parse(value));
    } catch {
      return flags;
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    let keyed = false;
    (Object.keys(SLOT_IDS) as (keyof KitFlags)[]).forEach((slot) => {
      const key = Object.keys(obj).find((candidate) => SLOT_IDS[slot].includes(candidate.toLowerCase()));
      if (!key) return;
      keyed = true;
      flags[slot] = kitEntryUploaded(obj[key]);
    });
    if (keyed) return flags;
    if (Array.isArray(obj.kits)) return readKits(obj.kits);
    return flags;
  }

  asList(value).forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const rec = item as Record<string, unknown>;
    const id = String(rec.id || rec.slot || rec.key || '').toLowerCase();
    const uploaded = kitEntryUploaded(item);
    const slot = (Object.keys(SLOT_IDS) as (keyof KitFlags)[]).find((candidate) => SLOT_IDS[candidate].includes(id));
    if (slot) {
      flags[slot] = flags[slot] || uploaded;
      return;
    }
    if (!id) {
      const order: (keyof KitFlags)[] = ['kit1', 'kit2', 'kit3', 'gk'];
      const fallback = order[index];
      if (fallback) flags[fallback] = flags[fallback] || uploaded;
    }
  });

  return flags;
}

function isFriendlyCompetition(name: string): boolean {
  return name.toLowerCase().includes('friend');
}

function leagueRank(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('premier')) return 0;
  if (lower.includes('championship')) return 1;
  return 2;
}

function entryId(entry: unknown): string {
  if (typeof entry === 'string') return entry.trim();
  if (!entry || typeof entry !== 'object') return '';
  const rec = entry as Record<string, unknown>;
  const id = rec.id || rec.player_id || rec.playerId;
  return typeof id === 'string' ? id.trim() : '';
}

function playerName(player: any): string {
  if (!player) return '';
  return `${player.first_name || ''} ${player.last_name || ''}`.trim();
}

export function buildPreparednessLeagues(raw: RawBundle): PreparednessLeague[] {
  const competitionName = new Map<string, string>();
  raw.competitions.forEach((competition) => {
    if (competition?.id) competitionName.set(String(competition.id), String(competition.name || 'League'));
  });

  const profileById = new Map<string, any>();
  raw.profiles.forEach((profile) => {
    if (profile?.id) profileById.set(String(profile.id), profile);
  });

  const teamName = new Map<string, string>();
  raw.teams.forEach((team) => {
    if (team?.id) teamName.set(String(team.id), String(team.name || 'Team'));
  });

  const playerById = new Map<string, string>();
  raw.players.forEach((player) => {
    const name = playerName(player);
    if (player?.id && name) playerById.set(String(player.id), name);
  });

  const lineupMap = new Map<string, string[]>();
  raw.lineups.forEach((row) => {
    if (!row?.fixture_id || !row?.team_id) return;
    const names = asList(row.starting_xi)
      .map((entry) => playerById.get(entryId(entry)) || '')
      .filter(Boolean);
    if (names.length === 0) return;
    lineupMap.set(`${row.fixture_id}__${row.team_id}`, names);
  });

  const eventLines = new Map<string, string[]>();
  const confirmedKeys = new Set<string>();
  raw.events.forEach((row) => {
    if (!row?.fixture_id || !row?.team_id) return;
    if (row.is_official !== true) return;
    const key = `${row.fixture_id}__${row.team_id}`;
    const type = String(row.type || '').toLowerCase();
    const scorer = playerById.get(String(row.player_id || ''));
    const assist = playerById.get(String(row.assist_player_id || ''));
    if ((type === 'goal' || type === 'penalty') && scorer) {
      const lines = eventLines.get(key) || [];
      lines.push(assist ? `${scorer}, assist ${assist}` : scorer);
      eventLines.set(key, lines);
    } else if ((type === 'yellow' || type === 'red') && scorer) {
      const lines = eventLines.get(key) || [];
      lines.push(`${type === 'red' ? 'Red' : 'Yellow'}: ${scorer}`);
      eventLines.set(key, lines);
    } else if (type === 'ft') {
      confirmedKeys.add(key);
    }
  });
  confirmedKeys.forEach((key) => {
    if (!eventLines.has(key)) eventLines.set(key, ['Coach confirmed. No scorer selected.']);
  });

  const leagueIds = new Set<string>();
  raw.teams.forEach((team) => {
    if (team?.competition_id) leagueIds.add(String(team.competition_id));
  });

  const leagues: PreparednessLeague[] = [];

  leagueIds.forEach((leagueId) => {
    const name = competitionName.get(leagueId) || 'League';
    if (isFriendlyCompetition(name)) return;

    const leagueTeams = raw.teams.filter((team) => String(team.competition_id) === leagueId);
    const leagueFixtures = raw.fixtures.filter((fixture) => {
      if (!fixture?.id) return false;
      const matchday = Number(fixture.matchday) || 0;
      if (matchday <= 0) return false;
      if (fixture.competition_id) return String(fixture.competition_id) === leagueId;
      return leagueTeams.some((team) => team.id === fixture.home_team_id || team.id === fixture.away_team_id);
    });

    const latest = leagueFixtures.reduce((max, fixture) => Math.max(max, Number(fixture.matchday) || 0), 0);
    const matchdays = latest > 0 ? Array.from({ length: latest }, (_, index) => index + 1) : [];

    const teams: PreparednessTeam[] = leagueTeams
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((team, index) => {
        const coachProfile = team.coach_id ? profileById.get(String(team.coach_id)) : null;
        const coachName = coachProfile
          ? `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim()
          : '';
        const hasCoach = Boolean(coachProfile && (coachName || coachProfile.email));
        const cells: Record<number, MatchCell> = {};

        leagueFixtures.forEach((fixture) => {
          const involved = fixture.home_team_id === team.id || fixture.away_team_id === team.id;
          if (!involved) return;
          const matchday = Number(fixture.matchday) || 0;
          if (!matchday) return;
          const isHome = fixture.home_team_id === team.id;
          const opponentId = isHome ? fixture.away_team_id : fixture.home_team_id;
          const key = `${fixture.id}__${team.id}`;
          const squadNames = lineupMap.get(key) || [];
          const lines = eventLines.get(key) || [];
          const squad = squadNames.length > 0;
          const events = lines.length > 0;
          const existing = cells[matchday];
          if (existing) {
            existing.squad = existing.squad || squad;
            existing.events = existing.events || events;
            if (squadNames.length > existing.squadNames.length) existing.squadNames = squadNames;
            if (lines.length > existing.eventLines.length) existing.eventLines = lines;
            return;
          }
          cells[matchday] = {
            opponentName: teamName.get(String(opponentId)) || 'Opponent',
            isHome,
            squad,
            events,
            squadNames,
            eventLines: lines,
          };
        });

        const logoUrl = typeof team.logo_url === 'string' && team.logo_url.trim() ? team.logo_url : null;

        return {
          id: String(team.id),
          index: index + 1,
          name: String(team.name || 'Team'),
          logoUrl,
          leagueName: name,
          hasCoach,
          coach: hasCoach
            ? {
                name: coachName || 'Coach',
                email: String(coachProfile.email || ''),
                phone: String(coachProfile.phone || ''),
              }
            : null,
          kits: readKits(team.kits_config),
          hasLogo: isUploadedAsset(logoUrl),
          cells,
        };
      });

    leagues.push({
      id: leagueId,
      name,
      matchdayTo: latest,
      matchdays,
      teams,
    });
  });

  leagues.sort((a, b) => leagueRank(a.name) - leagueRank(b.name) || a.name.localeCompare(b.name));
  return leagues;
}

export function summarizePreparedness(leagues: PreparednessLeague[], option: CacheOption): PreparednessSummary {
  const teams = leagues.flatMap((league) => league.teams);
  const totalTeams = teams.length;

  if (option === 'kits') {
    const filed = teams.reduce(
      (sum, team) => sum + Number(team.kits.kit1) + Number(team.kits.kit2) + Number(team.kits.kit3) + Number(team.kits.gk),
      0,
    );
    const completeTeams = teams.filter((team) => team.kits.kit1 && team.kits.kit2 && team.kits.kit3 && team.kits.gk).length;
    return {
      headline: 'Kit 1, Kit 2, Kit 3, and the goalkeeper kit',
      detail: `${filed} of ${totalTeams * 4} kit photos uploaded · ${completeTeams} of ${totalTeams} clubs complete`,
      filed,
      expected: totalTeams * 4,
      completeTeams,
      totalTeams,
    };
  }

  if (option === 'logo') {
    const filed = teams.filter((team) => team.hasLogo).length;
    return {
      headline: 'One crest per club',
      detail: `${filed} of ${totalTeams} clubs have uploaded a logo`,
      filed,
      expected: totalTeams,
      completeTeams: filed,
      totalTeams,
    };
  }

  const latest = leagues.reduce((max, league) => Math.max(max, league.matchdayTo), 0);
  let filed = 0;
  let expected = 0;
  let clubsWithMatches = 0;
  let completeTeams = 0;

  teams.forEach((team) => {
    const cells = Object.values(team.cells);
    if (cells.length === 0) return;
    clubsWithMatches += 1;
    const hits = cells.filter((cell) => (option === 'squad' ? cell.squad : cell.events)).length;
    filed += hits;
    expected += cells.length;
    if (hits === cells.length) completeTeams += 1;
  });

  const action = option === 'squad' ? 'match details' : 'match log entries';
  return {
    headline: latest > 0 ? `Matchday 1 to ${latest}` : 'No matchdays scheduled',
    detail:
      latest > 0
        ? `${latest} matchday${latest === 1 ? '' : 's'} · ${filed} of ${expected} ${action} filed · ${completeTeams} of ${clubsWithMatches} clubs complete`
        : 'Fixtures will appear here once the leagues have a matchday.',
    filed,
    expected,
    completeTeams,
    totalTeams,
  };
}

export function useCacheAnalysisData(enabled: boolean) {
  const [leagues, setLeagues] = useState<PreparednessLeague[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const enabledRef = useRef(enabled);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  enabledRef.current = enabled;

  const load = useCallback(async (initial: boolean) => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }

    if (!isSessionActive()) return;
    const budget = canMakeDashboardCall();
    if (!budget.allowed) {
      setError(budget.reason || 'Session call budget reached.');
      return;
    }
    recordSessionCall(true, 25000);

    inFlightRef.current = true;
    if (initial) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [teams, profiles, competitions, fixtures, lineups, events, players] = await Promise.all([
        fetchAll((from, to) => supabase.from('teams').select(TEAM_ADMIN_COLUMNS).range(from, to)),
        fetchAll((from, to) =>
          supabase.from('profiles').select('id, first_name, last_name, email, phone, role').range(from, to),
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
          supabase.from('match_lineups').select('fixture_id, team_id, starting_xi').range(from, to),
        ),
        fetchAll((from, to) =>
          supabase
            .from('match_events')
            .select('fixture_id, team_id, player_id, assist_player_id, type, is_official')
            .range(from, to),
        ),
        fetchAll((from, to) =>
          supabase.from('players').select('id, first_name, last_name').range(from, to),
        ),
      ]);

      if (!enabledRef.current) return;
      setLeagues(buildPreparednessLeagues({ teams, profiles, competitions, fixtures, lineups, events, players }));
      setUpdatedAt(new Date().toLocaleTimeString());
      setError(null);
    } catch (err: any) {
      if (!enabledRef.current) return;
      setError(err?.message || 'Failed to load team preparedness from the database.');
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
  }, [enabled, load]);

  return { leagues, isLoading, isRefreshing, error, updatedAt, reload: () => load(false) };
}
