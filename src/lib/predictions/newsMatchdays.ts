import type { Match, Team } from '../../types/predictions';
import { formatTeamName } from './utils';
import { matchdayFullyPlayed } from './votingWindow';

export function sameClub(favourite: string, team: Team): boolean {
  const fav = favourite.toLowerCase().trim();
  return (
    team.name.toLowerCase().trim() === fav ||
    team.shortName.toLowerCase().trim() === fav ||
    team.id === favourite
  );
}

/** The two matchdays a person can move between: the open week and the next, or the following pair once the earlier week is finished. */
export function visibleMatchdayPair(matchdays: number[], fixtures: Match[]): [number, number] {
  const days = (matchdays.length > 0 ? [...new Set(matchdays)] : [7, 8]).sort((a, b) => a - b);
  if (days.length === 1) return [days[0], days[0]];

  const openIndex = days.findIndex((day) => {
    const slate = fixtures.filter((match) => match.matchday === day);
    return slate.length === 0 || !matchdayFullyPlayed(slate);
  });
  const index = openIndex < 0 ? Math.max(0, days.length - 2) : Math.min(openIndex, days.length - 2);
  return [days[index], days[index + 1]];
}

export function matchdayTeamLine(matches: Match[], favourite: string | null): { team: string; line: string } {
  if (matches.length === 0) {
    return { team: 'No games', line: 'Nothing listed' };
  }

  if (favourite) {
    const game = matches.find(
      (match) => sameClub(favourite, match.homeTeam) || sameClub(favourite, match.awayTeam)
    );
    if (!game) {
      return { team: formatTeamName(favourite), line: 'Not playing' };
    }
    const atHome = sameClub(favourite, game.homeTeam);
    const opponent = atHome ? game.awayTeam.name : game.homeTeam.name;
    return { team: formatTeamName(favourite), line: `vs ${formatTeamName(opponent)}` };
  }

  const head = matches.find((match) => match.isDerby) || matches[0];
  return {
    team: formatTeamName(head.homeTeam.name),
    line: `vs ${formatTeamName(head.awayTeam.name)}`,
  };
}
