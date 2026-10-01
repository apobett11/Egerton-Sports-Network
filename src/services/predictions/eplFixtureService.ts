import { supabase } from '../../lib/supabase';
import { EPL_COMPETITION_ID, weekendFixtures } from '../../lib/predictions/weekendSlate';
import type { Match, Team, MatchSquadInfo } from '../../types/predictions';

export function generateSquadInfo(homeName: string, awayName: string): MatchSquadInfo {
  return {
    homeFormation: '4-3-3 Attacking',
    awayFormation: '4-2-3-1 Compact',
    homeKeyPlayers: [
      { name: `${homeName.slice(0, 3)} Striker #9`, position: 'FWD', number: 9, isKeyPlayer: true },
      { name: 'K. Otieno (Playmaker)', position: 'MID', number: 10, isKeyPlayer: true },
      { name: 'B. Kimani (Captain)', position: 'DEF', number: 4, isKeyPlayer: false },
      { name: 'D. Mwangi (Shotstopper)', position: 'GK', number: 1, isKeyPlayer: false }
    ],
    awayKeyPlayers: [
      { name: `${awayName.slice(0, 3)} Winger #11`, position: 'FWD', number: 11, isKeyPlayer: true },
      { name: 'S. Kiprono (Holding Mid)', position: 'MID', number: 6, isKeyPlayer: true },
      { name: 'J. Kariuki (Centre Back)', position: 'DEF', number: 5, isKeyPlayer: false },
      { name: 'E. Odhiambo (Keeper)', position: 'GK', number: 1, isKeyPlayer: false }
    ],
    homeInjuries: ['P. Mutua (Hamstring - 2 wks)'],
    awayInjuries: ['T. Wekesa (Knock - Doubtful)']
  };
}

function slateKickoff(weekday: number, hour: number, extraDays = 0): string {
  const kick = new Date();
  const delta = (weekday - kick.getDay() + 7) % 7;
  kick.setDate(kick.getDate() + delta + extraDays);
  kick.setHours(hour, 0, 0, 0);
  return kick.toISOString();
}

// Reliable fallback fixtures matching actual EgerScore EPL database teams.
// Matchday 7 is the next Saturday slate. Matchday 8 is the Sunday after it.
export const FALLBACK_EPL_FIXTURES: Match[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 7,
    scheduledTime: slateKickoff(6, 15),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch A — Main Stadium Pitch',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Santos FC',
      shortName: 'SAN',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
      colorCode: '#00b04f'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000004',
      name: 'BCOM FC',
      shortName: 'BCM',
      logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
      colorCode: '#ff0046'
    },
    isDerby: false,
    squads: {
      homeFormation: '4-3-3 High Press',
      awayFormation: '4-2-3-1 Counter Attack',
      homeKeyPlayers: [
        { name: 'M. Ochieng', position: 'FWD', number: 9, isKeyPlayer: true },
        { name: 'K. Otieno (C)', position: 'MID', number: 8, isKeyPlayer: true },
        { name: 'B. Kimani', position: 'DEF', number: 4, isKeyPlayer: false },
        { name: 'S. Njoroge', position: 'GK', number: 1, isKeyPlayer: false }
      ],
      awayKeyPlayers: [
        { name: 'D. Kiprono', position: 'FWD', number: 10, isKeyPlayer: true },
        { name: 'S. Mwangi', position: 'MID', number: 7, isKeyPlayer: true },
        { name: 'J. Kariuki', position: 'DEF', number: 5, isKeyPlayer: false },
        { name: 'P. Mutua', position: 'GK', number: 1, isKeyPlayer: false }
      ],
      homeInjuries: ['A. Omondi (Ankle - Out)'],
      awayInjuries: ['F. Barasa (Hamstring - 50%)']
    }
  },
  {
    id: 'f0000000-0000-4000-8000-000000000003',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 7,
    scheduledTime: slateKickoff(6, 17),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch B — Pavilion Grounds',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000005',
      name: 'Blue Blazers',
      shortName: 'BLZ',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
      colorCode: '#1565c0'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000006',
      name: 'Mighty Blacks',
      shortName: 'MBL',
      logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80',
      colorCode: '#ff9800'
    },
    isDerby: false
  },
  {
    id: 'f0000000-0000-4000-8000-000000000004',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 7,
    scheduledTime: slateKickoff(6, 19),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch C — Complex Turf',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000007',
      name: 'FASS Elites',
      shortName: 'FAS',
      logoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=120&auto=format&fit=crop&q=80',
      colorCode: '#c2185b'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000008',
      name: 'Law FC',
      shortName: 'LAW',
      logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80',
      colorCode: '#d32f2f'
    },
    isDerby: false
  },
  {
    id: 'f0000000-0000-4000-8000-000000000005',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 7,
    scheduledTime: slateKickoff(6, 20),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch A — Main Stadium Pitch (Super Clash)',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000009',
      name: 'Legends FC',
      shortName: 'LEG',
      logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&auto=format&fit=crop&q=80',
      colorCode: '#ff0046'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000010',
      name: 'Spartans United',
      shortName: 'SPA',
      logoUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=120&auto=format&fit=crop&q=80',
      colorCode: '#00b04f'
    },
    isDerby: true, // DESIGNATED MATCHDAY CLIMAX / DERBY
    squads: {
      homeFormation: '4-3-3 High Press Attack',
      awayFormation: '3-4-3 Wide Counter',
      homeKeyPlayers: [
        { name: 'J. Maina', position: 'FWD', number: 10, isKeyPlayer: true },
        { name: 'P. Korir (C)', position: 'MID', number: 8, isKeyPlayer: true },
        { name: 'S. Ndung\'u', position: 'DEF', number: 4, isKeyPlayer: false },
        { name: 'K. Chege', position: 'GK', number: 1, isKeyPlayer: false }
      ],
      awayKeyPlayers: [
        { name: 'K. Rotich', position: 'FWD', number: 9, isKeyPlayer: true },
        { name: 'D. Omondi', position: 'MID', number: 6, isKeyPlayer: true },
        { name: 'E. Kibet (Wall)', position: 'GK', number: 1, isKeyPlayer: true },
        { name: 'M. Wambua', position: 'DEF', number: 5, isKeyPlayer: false }
      ],
      homeInjuries: ['None — Full Squad Fit'],
      awayInjuries: ['B. Ngetich (Suspension - 1 Match)']
    }
  },
  // MATCHDAY 8 (Next Matchday preview)
  {
    id: 'f0000000-0000-4000-8000-000000000011',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 8,
    scheduledTime: slateKickoff(6, 15, 1),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch A — Main Stadium Pitch',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000004',
      name: 'BCOM FC',
      shortName: 'BCM',
      logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
      colorCode: '#ff0046'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000009',
      name: 'Legends FC',
      shortName: 'LEG',
      logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&auto=format&fit=crop&q=80',
      colorCode: '#00b04f'
    },
    isDerby: false
  },
  {
    id: 'f0000000-0000-4000-8000-000000000012',
    competitionId: EPL_COMPETITION_ID,
    league: 'EPL',
    matchday: 8,
    scheduledTime: slateKickoff(6, 17, 1),
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch B — Pavilion Grounds',
    homeTeam: {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Santos FC',
      shortName: 'SAN',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
      colorCode: '#00b04f'
    },
    awayTeam: {
      id: '10000000-0000-4000-8000-000000000005',
      name: 'Blue Blazers',
      shortName: 'BLZ',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
      colorCode: '#1565c0'
    },
    isDerby: true
  }
];

class EplFixtureService {
  private cache: Match[] | null = null;
  private cacheTimestamp = 0;
  private inFlightPromise: Promise<Match[]> | null = null;
  private readonly CACHE_TTL_MS = 60000; // 60s in-memory cache to safeguard database CPU

  public async getFixtures(matchday?: number): Promise<Match[]> {
    const all = await this.getAllEplFixtures();
    if (!matchday) return all;
    return all.filter(f => f.matchday === matchday);
  }

  public async getAllEplFixtures(): Promise<Match[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cache;
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = this.fetchFromDbOrFallback();
    try {
      const result = await this.inFlightPromise;
      const fallbackIds = new Set(FALLBACK_EPL_FIXTURES.map((match) => match.id));
      const isFallback = result.length > 0 && result.every((match) => fallbackIds.has(match.id));
      if (!isFallback) {
        this.cache = result;
        this.cacheTimestamp = Date.now();
      }
      return result;
    } finally {
      this.inFlightPromise = null;
    }
  }

  private async fetchFromDbOrFallback(): Promise<Match[]> {
    try {
      // 1. Fetch fixtures from DB using indexed scan
      const windowStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const { data: fixtures, error } = await supabase
        .from('fixtures')
        .select(`
          id,
          competition_id,
          matchday,
          scheduled_time,
          status,
          score_home,
          score_away,
          venue,
          home_team:teams!fixtures_home_team_id_fkey(id, name, short_name, logo_url, color_code),
          away_team:teams!fixtures_away_team_id_fkey(id, name, short_name, logo_url, color_code)
        `)
        .eq('competition_id', EPL_COMPETITION_ID)
        .gte('scheduled_time', windowStart)
        .order('scheduled_time', { ascending: true })
        .limit(40);

      if (error || !fixtures || fixtures.length === 0) {
        return weekendFixtures(FALLBACK_EPL_FIXTURES);
      }

      // Check if derby config exists in DB
      let derbyMap = new Map<string, boolean>();
      try {
        const { data: derbyConfigs } = await supabase
          .from('matchday_derby_config')
          .select('fixture_id')
          .eq('is_active', true);
        if (derbyConfigs) {
          derbyConfigs.forEach((d: any) => derbyMap.set(d.fixture_id, true));
        }
      } catch {
        // use default fallback derby rules
      }

      const parsed: Match[] = fixtures.map((f: any, idx: number) => {
        const home = Array.isArray(f.home_team) ? f.home_team[0] : f.home_team;
        const away = Array.isArray(f.away_team) ? f.away_team[0] : f.away_team;
        const isDerby = derbyMap.has(f.id);

        return {
          id: f.id,
          competitionId: f.competition_id,
          league: f.competition_id === EPL_COMPETITION_ID ? 'EPL' : 'OTHER',
          matchday: f.matchday || 7,
          scheduledTime: f.scheduled_time,
          status: f.status || 'UPCOMING',
          scoreHome: f.score_home || 0,
          scoreAway: f.score_away || 0,
          venue: f.venue || 'Pitch A',
          homeTeam: {
            id: home?.id || `team-h-${idx}`,
            name: home?.name || 'Home Club',
            shortName: home?.short_name || 'HOM',
            logoUrl: home?.logo_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
            colorCode: home?.color_code || '#00b04f'
          },
          awayTeam: {
            id: away?.id || `team-a-${idx}`,
            name: away?.name || 'Away Club',
            shortName: away?.short_name || 'AWY',
            logoUrl: away?.logo_url || 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
            colorCode: away?.color_code || '#ff0046'
          },
          isDerby,
          squads: generateSquadInfo(home?.name || 'Home Club', away?.name || 'Away Club')
        };
      });

      const weekend = weekendFixtures(parsed);
      return weekend.length > 0 ? weekend : weekendFixtures(FALLBACK_EPL_FIXTURES);
    } catch {
      return weekendFixtures(FALLBACK_EPL_FIXTURES);
    }
  }

  public peek(): Match[] | null {
    return this.cache;
  }

  public getAvailableMatchdays(matches: Match[]): number[] {
    const set = new Set<number>();
    matches.forEach(m => set.add(m.matchday));
    return Array.from(set).sort((a, b) => a - b);
  }
}

export const eplFixtureService = new EplFixtureService();

if (typeof window !== 'undefined') {
  void eplFixtureService.getAllEplFixtures();
}
