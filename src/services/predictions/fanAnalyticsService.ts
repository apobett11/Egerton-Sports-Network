import { supabase } from '../../lib/supabase';
import { EPL_TEAMS } from '../../lib/predictions/eplTeams';
import type { Team } from '../../types/predictions';

export interface TeamFanAnalytics {
  teamId: string;
  teamName: string;
  shortName: string;
  logoUrl?: string;
  actualFans: number;
  shownFans: number;
  sharePct: number;
  rank: number;
}

// Baseline actual fan tallies reflecting campus club fanbases
const BASELINE_ACTUAL_FANS: Record<string, number> = {
  'Super Eagles': 28,
  'Wazito FC': 24,
  'BCOM FC': 20,
  'Celtics FC': 18,
  'Santos FC': 16,
  'Legends FC': 15,
  'Blue Blazers': 14,
  'Giants FC': 12,
  'Med FC': 11,
  'Five Stars FC': 10,
  'Mighty Blacks': 9,
  'Rising Stars': 8,
};

// Team logos lookup
const TEAM_LOGOS: Record<string, string> = {
  'Super Eagles': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
  'BCOM FC': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
  'Santos FC': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
  'Mighty Blacks': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80',
  'Blue Blazers': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
  'Legends FC': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
  'Celtics FC': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
  'Wazito FC': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80',
  'Giants FC': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80',
  'Med FC': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
  'Five Stars FC': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
  'Rising Stars': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
};

export class FanAnalyticsService {
  public async getTeamFanPopularity(availableTeams: Team[] = EPL_TEAMS): Promise<TeamFanAnalytics[]> {
    const countsMap = new Map<string, number>();

    // 1. Seed with baseline actual fan counts
    availableTeams.forEach((team) => {
      const base = BASELINE_ACTUAL_FANS[team.name] || 10;
      countsMap.set(team.name.toLowerCase(), base);
    });

    // 2. Query remote anonymous devices and profiles
    try {
      const { data: devices, error } = await supabase
        .from('anonymous_devices')
        .select('favorite_team_id, favorite_team_label')
        .limit(1000);

      if (!error && Array.isArray(devices)) {
        devices.forEach((dev) => {
          const label = dev.favorite_team_label;
          if (label && typeof label === 'string') {
            const key = label.toLowerCase();
            const current = countsMap.get(key) || 0;
            countsMap.set(key, current + 1);
          }
        });
      }
    } catch {
      // Graceful offline fallback
    }

    // 3. Include local user selection
    try {
      const localFavorite =
        localStorage.getItem('esn_favorite_team_label') ||
        localStorage.getItem('esn_favourite_team');
      if (localFavorite) {
        const key = localFavorite.toLowerCase();
        const current = countsMap.get(key) || 0;
        countsMap.set(key, current + 1);
      }
    } catch {}

    // 4. Calculate total actual fans across all teams
    const totalActualFans = availableTeams.reduce((sum, team) => {
      const key = team.name.toLowerCase();
      const actual = countsMap.get(key) || BASELINE_ACTUAL_FANS[team.name] || 10;
      return sum + actual;
    }, 0) || 1;

    // 5. Map into TeamFanAnalytics: percentage * 10 without decimals to produce realistic numbers (e.g. 163 instead of 160)
    const list: Omit<TeamFanAnalytics, 'rank' | 'sharePct'>[] = availableTeams.map((team) => {
      const key = team.name.toLowerCase();
      const actualFans = countsMap.get(key) || BASELINE_ACTUAL_FANS[team.name] || 10;
      const shownFans = Math.round((actualFans / totalActualFans) * 1000);
      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.shortName || team.name.slice(0, 3).toUpperCase(),
        logoUrl: team.logoUrl || TEAM_LOGOS[team.name],
        actualFans,
        shownFans,
      };
    });

    // Sort descending by popularity
    list.sort((a, b) => b.shownFans - a.shownFans);

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
      sharePct: Math.max(1, Math.round((item.actualFans * 100) / totalActualFans)),
    }));
  }
}

export const fanAnalyticsService = new FanAnalyticsService();
