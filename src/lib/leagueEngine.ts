import type { Match, Team, LeagueTableEntry } from '../types';

export interface BaseTeamInfo {
  id: string;
  name: string;
  logo: string;
}

/**
 * Calculates FIFA-grade league standings automatically from finalized match results (status === 'FT').
 * 
 * Rules:
 * 1. Win: Winner receives 3 points, loser receives 0 points.
 * 2. Draw: Both teams receive 1 point.
 * 3. Loss: Losing team receives 0 points.
 * 4. Goal Difference = Goals For - Goals Against.
 * 5. Deterministic Tie-Breakers:
 *    - Priority 1: Points (Descending)
 *    - Priority 2: Goal Difference (Descending)
 *    - Priority 3: Team Name (Ascending A -> Z)
 * 
 * Unfinalized matches (UPCOMING, LIVE, HT, POSTPONED, CANCELLED) have 0 impact on standings.
 */
export function calculateLeagueStandings(
  fixtures: Match[],
  teamsList?: BaseTeamInfo[],
  previousStandings?: LeagueTableEntry[]
): LeagueTableEntry[] {
  // Collect all unique teams from teamsList or fixtures
  const teamsMap = new Map<string, BaseTeamInfo>();

  if (teamsList && teamsList.length > 0) {
    teamsList.forEach((t) => {
      teamsMap.set(t.id, { id: t.id, name: t.name, logo: t.logo });
    });
  }

  fixtures.forEach((f) => {
    if (f.teamA && f.teamA.id && !teamsMap.has(f.teamA.id)) {
      teamsMap.set(f.teamA.id, { id: f.teamA.id, name: f.teamA.name, logo: f.teamA.logo });
    }
    if (f.teamB && f.teamB.id && !teamsMap.has(f.teamB.id)) {
      teamsMap.set(f.teamB.id, { id: f.teamB.id, name: f.teamB.name, logo: f.teamB.logo });
    }
  });

  // Initialize stats map for each team
  const statsMap = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      teamLogo: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }
  >();

  teamsMap.forEach((team, teamId) => {
    statsMap.set(teamId, {
      teamId,
      teamName: team.name,
      teamLogo: team.logo,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    });
  });

  // Process ONLY finalized matches (status === 'FT')
  const finalizedFixtures = fixtures.filter((f) => f.status === 'FT');

  finalizedFixtures.forEach((f) => {
    const homeStats = statsMap.get(f.teamA.id);
    const awayStats = statsMap.get(f.teamB.id);

    if (!homeStats || !awayStats) return;

    const scoreHome = Number(f.scoreA) || 0;
    const scoreAway = Number(f.scoreB) || 0;

    homeStats.played += 1;
    awayStats.played += 1;

    homeStats.goalsFor += scoreHome;
    homeStats.goalsAgainst += scoreAway;
    awayStats.goalsFor += scoreAway;
    awayStats.goalsAgainst += scoreHome;

    if (scoreHome > scoreAway) {
      // Home Win
      homeStats.won += 1;
      homeStats.points += 3;
      awayStats.lost += 1;
    } else if (scoreAway > scoreHome) {
      // Away Win
      awayStats.won += 1;
      awayStats.points += 3;
      homeStats.lost += 1;
    } else {
      // Draw
      homeStats.drawn += 1;
      homeStats.points += 1;
      awayStats.drawn += 1;
      awayStats.points += 1;
    }
  });

  // Map to array and compute goal difference
  const standingsList = Array.from(statsMap.values()).map((s) => ({
    ...s,
    goalDifference: s.goalsFor - s.goalsAgainst
  }));

  // Standard FIFA Sorting Engine
  standingsList.sort((a, b) => {
    // Priority 1: Highest Points (Descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // Priority 2: Goal Difference (Descending)
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // Priority 3: Alphabetical Order by Team Name (Ascending A -> Z)
    return a.teamName.localeCompare(b.teamName);
  });

  // Create previous position lookup map if available
  const prevPosMap = new Map<string, number>();
  if (previousStandings && previousStandings.length > 0) {
    previousStandings.forEach((entry) => {
      prevPosMap.set(entry.teamId, entry.position);
    });
  }

  const timestamp = new Date().toISOString();

  // Assign automatic positions (1, 2, 3...) & calculate movement
  const finalStandings: LeagueTableEntry[] = standingsList.map((entry, index) => {
    const position = index + 1;
    const prevPosition = prevPosMap.get(entry.teamId);

    let movement: 'up' | 'down' | 'same' = 'same';
    if (prevPosition !== undefined) {
      if (position < prevPosition) {
        movement = 'up';
      } else if (position > prevPosition) {
        movement = 'down';
      }
    }

    return {
      position,
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamLogo: entry.teamLogo,
      played: entry.played,
      won: entry.won,
      drawn: entry.drawn,
      lost: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      points: entry.points,
      movement,
      previousPosition: prevPosition,
      lastUpdated: timestamp
    };
  });

  return finalStandings;
}
