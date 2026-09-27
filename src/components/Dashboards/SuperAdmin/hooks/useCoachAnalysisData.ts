import { useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';

export interface MatchAnalysis {
  fixtureId: string;
  matchday: number;
  opponentName: string;
  isHome: boolean;
  // Per-match checks
  kits: boolean;
  squadXI: boolean;
  squadSubs: boolean;
  matchEvents: boolean;
  teamLogo: boolean;
}

export interface CoachAnalysisTeam {
  id: string;
  index: number;
  name: string;
  logoUrl: string | null;
  league: 'EPL' | 'Championship';
  hasCoach: boolean;
  coachId: string | null;
  coachName: string;
  coachEmail: string;
  matchesPlayed: number;
  matches: MatchAnalysis[];
  // Overall (team-level, not match-specific)
  hasUploadedKits: boolean;
  hasUploadedLogo: boolean;
}

export interface CoachAnalysisData {
  eplTeams: CoachAnalysisTeam[];
  championshipTeams: CoachAnalysisTeam[];
  isLoading: boolean;
  error: string | null;
}

export const useCoachAnalysisData = () => {
  const [data, setData] = useState<CoachAnalysisData>({
    eplTeams: [],
    championshipTeams: [],
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [
        { data: teams, error: teamErr },
        { data: profiles, error: profErr },
        { data: fixtures, error: fixErr },
        { data: matchLineups, error: lineupErr },
        { data: matchEvents, error: eventsErr },
      ] = await Promise.all([
        supabase.from('teams').select('*').limit(100),
        supabase.from('profiles').select('id, first_name, last_name, email, role').limit(300),
        supabase
          .from('fixtures')
          .select('id, home_team_id, away_team_id, matchday, competition_id, status')
          .eq('status', 'FT')
          .order('matchday', { ascending: true })
          .limit(500),
        supabase
          .from('match_lineups')
          .select('id, team_id, fixture_id, starting_xi, substitutes')
          .limit(500),
        supabase
          .from('match_events')
          .select('id, team_id, fixture_id')
          .limit(2000),
      ]);

      if (teamErr) throw teamErr;
      if (profErr) throw profErr;
      if (fixErr) throw fixErr;
      if (lineupErr) throw lineupErr;
      if (eventsErr) throw eventsErr;

      const allTeams = Array.isArray(teams) ? teams : [];
      const allProfiles = Array.isArray(profiles) ? profiles : [];
      const ftFixtures = Array.isArray(fixtures) ? fixtures : [];
      const allLineups = Array.isArray(matchLineups) ? matchLineups : [];
      const allEvents = Array.isArray(matchEvents) ? matchEvents : [];

      // Build team name map for opponent lookup
      const teamNameMap: Record<string, string> = {};
      allTeams.forEach((t) => {
        teamNameMap[t.id] = t.name;
      });

      // Build lookup sets for quick access
      // lineup per (fixture_id, team_id)
      type LineupKey = string;
      const lineupMap = new Map<LineupKey, { starting_xi: any[]; substitutes: any[] }>();
      allLineups.forEach((ml: any) => {
        const key = `${ml.fixture_id}__${ml.team_id}`;
        lineupMap.set(key, {
          starting_xi: Array.isArray(ml.starting_xi) ? ml.starting_xi : [],
          substitutes: Array.isArray(ml.substitutes) ? ml.substitutes : [],
        });
      });

      // events per (fixture_id, team_id)
      const eventsSet = new Set<string>();
      allEvents.forEach((ev: any) => {
        if (ev.fixture_id && ev.team_id) {
          eventsSet.add(`${ev.fixture_id}__${ev.team_id}`);
        }
      });

      let eplIndex = 0;
      let champIndex = 0;

      const eplTeams: CoachAnalysisTeam[] = [];
      const championshipTeams: CoachAnalysisTeam[] = [];

      allTeams.forEach((t: any) => {
        const coach = t.coach_id
          ? allProfiles.find((p) => p.id === t.coach_id)
          : null;

        const hasCoach = Boolean(coach);
        const coachName = coach
          ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim()
          : 'Unassigned';
        const coachEmail = coach?.email || '—';

        // Determine league
        const isChamp =
          t.competition_id === '22222222-2222-2222-2222-222222222222' ||
          t.competition_id?.includes('2222') ||
          t.name?.toLowerCase().includes('championship');
        const league: 'EPL' | 'Championship' = isChamp ? 'Championship' : 'EPL';

        // Team-level checks
        const hasUploadedKits = Boolean(
          (Array.isArray(t.kits_config) && t.kits_config.length > 0) ||
          (t.kits && typeof t.kits === 'object' && Object.keys(t.kits).length > 0) ||
          t.primary_kit ||
          t.secondary_kit
        );

        const hasUploadedLogo = Boolean(
          t.logo_url &&
          typeof t.logo_url === 'string' &&
          t.logo_url.trim().length > 10 &&
          !t.logo_url.startsWith('data:') &&
          !t.logo_url.includes('placeholder')
        );

        // Get all finished fixtures involving this team
        const teamFixtures = ftFixtures.filter(
          (f) => f.home_team_id === t.id || f.away_team_id === t.id
        );

        const matches: MatchAnalysis[] = teamFixtures.map((f: any) => {
          const isHome = f.home_team_id === t.id;
          const opponentId = isHome ? f.away_team_id : f.home_team_id;
          const opponentName = teamNameMap[opponentId] || 'Unknown';

          const lineupKey = `${f.id}__${t.id}`;
          const lineup = lineupMap.get(lineupKey);
          const squadXI = Boolean(lineup && lineup.starting_xi.length >= 11);
          const squadSubs = Boolean(squadXI && lineup && lineup.substitutes.length > 0);
          const hasMatchEvents = eventsSet.has(lineupKey);

          return {
            fixtureId: f.id,
            matchday: f.matchday || 0,
            opponentName,
            isHome,
            kits: hasUploadedKits,
            squadXI,
            squadSubs,
            matchEvents: hasMatchEvents,
            teamLogo: hasUploadedLogo,
          };
        });

        const teamEntry: CoachAnalysisTeam = {
          id: t.id,
          index: 0, // assigned below
          name: t.name,
          logoUrl: t.logo_url || null,
          league,
          hasCoach,
          coachId: t.coach_id || null,
          coachName,
          coachEmail,
          matchesPlayed: teamFixtures.length,
          matches,
          hasUploadedKits,
          hasUploadedLogo,
        };

        if (league === 'EPL') {
          eplIndex++;
          teamEntry.index = eplIndex;
          eplTeams.push(teamEntry);
        } else {
          champIndex++;
          teamEntry.index = champIndex;
          championshipTeams.push(teamEntry);
        }
      });

      setData({
        eplTeams,
        championshipTeams,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to load coach analysis data.',
      }));
    }
  }, []);

  return { ...data, fetchData };
};
