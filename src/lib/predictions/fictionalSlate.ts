import type { BanterComment, BanterPost, ConsensusData, Match, MatchSquadInfo, Team } from '../../types/predictions';
import { EPL_TEAMS } from './eplTeams';
import { EPL_COMPETITION_ID, weekendDates } from './weekendSlate';

/**
 * Local test slate for this app only. It is used on localhost and is never
 * written to the shared database.
 */

const LOOK: Record<string, { color: string; logo: string }> = {
  'epl-bcom': { color: '#ff0046', logo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80' },
  'epl-blue-blazers': { color: '#1565c0', logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80' },
  'epl-celtics': { color: '#00b04f', logo: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=120&auto=format&fit=crop&q=80' },
  'epl-five-stars': { color: '#f9a825', logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80' },
  'epl-giants': { color: '#6a1b9a', logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80' },
  'epl-legends': { color: '#c62828', logo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&auto=format&fit=crop&q=80' },
  'epl-med': { color: '#00897b', logo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=120&auto=format&fit=crop&q=80' },
  'epl-mighty-blacks': { color: '#ff9800', logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80' },
  'epl-rising-stars': { color: '#ef6c00', logo: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=120&auto=format&fit=crop&q=80' },
  'epl-santos': { color: '#1b5e20', logo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80' },
  'epl-super-eagles': { color: '#0d47a1', logo: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=120&auto=format&fit=crop&q=80' },
  'epl-wazito': { color: '#ad1457', logo: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=120&auto=format&fit=crop&q=80' },
};

interface FixtureSpec {
  id: string;
  matchday: number;
  day: 'saturday' | 'sunday';
  hour: number;
  minute: number;
  status: Match['status'];
  scoreHome: number;
  scoreAway: number;
  venue: string;
  homeId: string;
  awayId: string;
  isDerby?: boolean;
  homeFormation: string;
  awayFormation: string;
  consensus: { homePct: number; drawPct: number; awayPct: number; totalVotes: number };
}

const FIXTURES: FixtureSpec[] = [
  {
    id: 'f1000000-0000-4000-8000-000000000801',
    matchday: 8,
    day: 'saturday',
    hour: 14,
    minute: 0,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch A — Main Stadium Pitch',
    homeId: 'epl-santos',
    awayId: 'epl-bcom',
    homeFormation: '4-3-3 Attacking',
    awayFormation: '4-2-3-1 Compact',
    consensus: { homePct: 58, drawPct: 22, awayPct: 20, totalVotes: 186 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000802',
    matchday: 8,
    day: 'saturday',
    hour: 14,
    minute: 0,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch B — Pavilion Grounds',
    homeId: 'epl-blue-blazers',
    awayId: 'epl-mighty-blacks',
    homeFormation: '4-4-2 Wide',
    awayFormation: '5-3-2 Low Block',
    consensus: { homePct: 31, drawPct: 27, awayPct: 42, totalVotes: 142 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000803',
    matchday: 8,
    day: 'saturday',
    hour: 16,
    minute: 0,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch C — Complex Turf',
    homeId: 'epl-celtics',
    awayId: 'epl-five-stars',
    homeFormation: '4-3-3 High Press',
    awayFormation: '4-1-4-1 Counter',
    consensus: { homePct: 36, drawPct: 40, awayPct: 24, totalVotes: 97 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000804',
    matchday: 8,
    day: 'saturday',
    hour: 16,
    minute: 30,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch A — Main Stadium Pitch (Super Clash)',
    homeId: 'epl-giants',
    awayId: 'epl-legends',
    isDerby: true,
    homeFormation: '3-4-3 Wing Backs',
    awayFormation: '4-3-3 Direct',
    consensus: { homePct: 44, drawPct: 18, awayPct: 38, totalVotes: 264 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000805',
    matchday: 8,
    day: 'saturday',
    hour: 18,
    minute: 0,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch D — Hostel Field',
    homeId: 'epl-med',
    awayId: 'epl-rising-stars',
    homeFormation: '4-2-3-1',
    awayFormation: '4-3-3 Youth',
    consensus: { homePct: 29, drawPct: 33, awayPct: 38, totalVotes: 74 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000806',
    matchday: 8,
    day: 'saturday',
    hour: 18,
    minute: 30,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch E — Tatton Ground',
    homeId: 'epl-super-eagles',
    awayId: 'epl-wazito',
    homeFormation: '4-3-3',
    awayFormation: '4-4-2 Diamond',
    consensus: { homePct: 51, drawPct: 26, awayPct: 23, totalVotes: 121 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000901',
    matchday: 9,
    day: 'sunday',
    hour: 13,
    minute: 0,
    status: 'FT',
    scoreHome: 2,
    scoreAway: 1,
    venue: 'Pitch B — Pavilion Grounds',
    homeId: 'epl-five-stars',
    awayId: 'epl-blue-blazers',
    homeFormation: '4-4-2',
    awayFormation: '4-3-3',
    consensus: { homePct: 27, drawPct: 24, awayPct: 49, totalVotes: 203 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000902',
    matchday: 9,
    day: 'sunday',
    hour: 13,
    minute: 30,
    status: 'FT',
    scoreHome: 1,
    scoreAway: 1,
    venue: 'Pitch C — Complex Turf',
    homeId: 'epl-rising-stars',
    awayId: 'epl-giants',
    homeFormation: '4-2-3-1',
    awayFormation: '3-5-2',
    consensus: { homePct: 22, drawPct: 31, awayPct: 47, totalVotes: 158 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000903',
    matchday: 9,
    day: 'sunday',
    hour: 15,
    minute: 0,
    status: 'UPCOMING',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch D — Hostel Field',
    homeId: 'epl-wazito',
    awayId: 'epl-celtics',
    homeFormation: '5-4-1',
    awayFormation: '4-3-3 Press',
    consensus: { homePct: 19, drawPct: 28, awayPct: 53, totalVotes: 88 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000904',
    matchday: 9,
    day: 'sunday',
    hour: 15,
    minute: 30,
    status: 'POSTPONED',
    scoreHome: 0,
    scoreAway: 0,
    venue: 'Pitch E — Tatton Ground',
    homeId: 'epl-med',
    awayId: 'epl-super-eagles',
    homeFormation: '4-4-2',
    awayFormation: '4-2-3-1',
    consensus: { homePct: 34, drawPct: 36, awayPct: 30, totalVotes: 41 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000905',
    matchday: 9,
    day: 'sunday',
    hour: 16,
    minute: 0,
    status: 'LIVE',
    scoreHome: 2,
    scoreAway: 1,
    venue: 'Pitch A — Main Stadium Pitch',
    homeId: 'epl-bcom',
    awayId: 'epl-legends',
    homeFormation: '4-3-3',
    awayFormation: '4-4-2 Narrow',
    consensus: { homePct: 41, drawPct: 21, awayPct: 38, totalVotes: 231 },
  },
  {
    id: 'f1000000-0000-4000-8000-000000000906',
    matchday: 9,
    day: 'sunday',
    hour: 18,
    minute: 0,
    status: 'HT',
    scoreHome: 1,
    scoreAway: 1,
    venue: 'Pitch A — Main Stadium Pitch (Super Clash)',
    homeId: 'epl-mighty-blacks',
    awayId: 'epl-santos',
    isDerby: true,
    homeFormation: '4-2-3-1 Compact',
    awayFormation: '4-3-3 Attacking',
    consensus: { homePct: 33, drawPct: 29, awayPct: 38, totalVotes: 276 },
  },
];

/** Fictional table after seven completed rounds, for the derby standings card. */
export const FICTIONAL_STANDINGS = [
  { position: 1, teamName: 'Legends FC', played: 7, won: 5, drawn: 1, lost: 1, gd: 9, points: 16 },
  { position: 2, teamName: 'Santos FC', played: 7, won: 5, drawn: 0, lost: 2, gd: 7, points: 15 },
  { position: 3, teamName: 'Giants FC', played: 7, won: 4, drawn: 2, lost: 1, gd: 6, points: 14 },
  { position: 4, teamName: 'BCOM FC', played: 7, won: 4, drawn: 1, lost: 2, gd: 4, points: 13 },
  { position: 5, teamName: 'Mighty Blacks', played: 7, won: 3, drawn: 3, lost: 1, gd: 3, points: 12 },
  { position: 6, teamName: 'Blue Blazers', played: 7, won: 3, drawn: 2, lost: 2, gd: 1, points: 11 },
  { position: 7, teamName: 'Super Eagles', played: 7, won: 3, drawn: 1, lost: 3, gd: 0, points: 10 },
  { position: 8, teamName: 'Celtics FC', played: 7, won: 2, drawn: 3, lost: 2, gd: -1, points: 9 },
  { position: 9, teamName: 'Five Stars FC', played: 7, won: 2, drawn: 2, lost: 3, gd: -2, points: 8 },
  { position: 10, teamName: 'Rising Stars', played: 7, won: 2, drawn: 1, lost: 4, gd: -4, points: 7 },
  { position: 11, teamName: 'Med FC', played: 7, won: 1, drawn: 2, lost: 4, gd: -8, points: 5 },
  { position: 12, teamName: 'Wazito FC', played: 7, won: 0, drawn: 2, lost: 5, gd: -15, points: 2 },
];

export function usesLocalFictionalSlate(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function club(id: string): Team {
  const base = EPL_TEAMS.find((team) => team.id === id);
  if (!base) throw new Error(`Unknown EPL club ${id}`);
  const look = LOOK[id];
  return {
    ...base,
    colorCode: look?.color || '#00b04f',
    logoUrl: look?.logo,
  };
}

function atNairobi(dayKey: string, hour: number, minute: number): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, 0)).toISOString();
}

function squad(home: Team, away: Team, homeFormation: string, awayFormation: string): MatchSquadInfo {
  const homeTag = home.shortName;
  const awayTag = away.shortName;
  return {
    homeFormation,
    awayFormation,
    homeKeyPlayers: [
      { name: `${homeTag} #9 Kamau`, position: 'FWD', number: 9, isKeyPlayer: true },
      { name: `${homeTag} #10 Otieno`, position: 'MID', number: 10, isKeyPlayer: true },
      { name: `${homeTag} #4 Mwangi`, position: 'DEF', number: 4, isKeyPlayer: false },
      { name: `${homeTag} #1 Cheruiyot`, position: 'GK', number: 1, isKeyPlayer: false },
    ],
    awayKeyPlayers: [
      { name: `${awayTag} #11 Wanjiku`, position: 'FWD', number: 11, isKeyPlayer: true },
      { name: `${awayTag} #6 Kiprono`, position: 'MID', number: 6, isKeyPlayer: true },
      { name: `${awayTag} #5 Kariuki`, position: 'DEF', number: 5, isKeyPlayer: false },
      { name: `${awayTag} #1 Odhiambo`, position: 'GK', number: 1, isKeyPlayer: false },
    ],
    homeInjuries: [`${homeTag} #7 Mutua (hamstring, 2 weeks)`],
    awayInjuries: [`${awayTag} #8 Wekesa (knock, doubtful)`],
  };
}

function buildMatches(now: Date): Match[] {
  const { saturday, sunday } = weekendDates(now);
  return FIXTURES.map((spec) => {
    const home = club(spec.homeId);
    const away = club(spec.awayId);
    return {
      id: spec.id,
      competitionId: EPL_COMPETITION_ID,
      league: 'EPL',
      matchday: spec.matchday,
      scheduledTime: atNairobi(spec.day === 'saturday' ? saturday : sunday, spec.hour, spec.minute),
      status: spec.status,
      scoreHome: spec.scoreHome,
      scoreAway: spec.scoreAway,
      venue: spec.venue,
      homeTeam: home,
      awayTeam: away,
      isDerby: Boolean(spec.isDerby),
      squads: squad(home, away, spec.homeFormation, spec.awayFormation),
    };
  });
}

function buildConsensus(): Map<string, ConsensusData> {
  const map = new Map<string, ConsensusData>();
  FIXTURES.forEach((spec) => {
    map.set(spec.id, {
      matchId: spec.id,
      homePct: spec.consensus.homePct,
      drawPct: spec.consensus.drawPct,
      awayPct: spec.consensus.awayPct,
      totalVotes: spec.consensus.totalVotes,
      pulseLabel: `${spec.consensus.totalVotes} fan predictions`,
    });
  });
  return map;
}

interface Bundle {
  saturday: string;
  matches: Match[];
  consensus: Map<string, ConsensusData>;
  posts: BanterPost[];
  comments: Record<string, BanterComment[]>;
}

let bundle: Bundle | null = null;

function comment(id: string, postId: string, handle: string, content: string, minutesAgo: number): BanterComment {
  return {
    id,
    postId,
    authorHandle: handle,
    authorType: 'user',
    content,
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
  };
}

function buildPosts(matches: Match[]): { posts: BanterPost[]; comments: Record<string, BanterComment[]> } {
  const byId = new Map(matches.map((match) => [match.id, match]));
  const context = (id: string) => {
    const match = byId.get(id);
    if (!match) return undefined;
    return {
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      matchday: match.matchday,
    };
  };

  const posts: BanterPost[] = [
    {
      id: 'post-md8-santos-bcom',
      matchId: 'f1000000-0000-4000-8000-000000000801',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000801'),
      authorHandle: 'Tatton Ultras #42',
      authorType: 'user',
      content: 'Santos are already singing. BCOM scored three in transition last week. Home crowd will not save a high line. #Matchday',
      sourceType: 'seed',
      reactionFireCount: 46,
      reactionClownCount: 11,
      reactionSkullCount: 18,
      commentCount: 3,
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'post-md8-derby-desk',
      matchId: 'f1000000-0000-4000-8000-000000000804',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000804'),
      authorHandle: 'EgerSports Desk',
      authorType: 'journalist',
      authorBadge: 'JOURNALIST',
      content: 'Giants vs Legends is the Matchday 8 derby. Table says Legends, the pitch says Giants win the second balls. Split vote, as it should be. #Derby',
      sourceType: 'journalist',
      reactionFireCount: 72,
      reactionClownCount: 6,
      reactionSkullCount: 9,
      commentCount: 2,
      createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    },
    {
      id: 'post-md8-giants-coach',
      matchId: 'f1000000-0000-4000-8000-000000000804',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000804'),
      authorHandle: 'Giants FC Coach',
      authorType: 'journalist',
      authorBadge: 'COACH',
      content: 'Press the first pass. Legends will sit in and wait for the ball in behind. First 20 minutes, no hero passes.',
      sourceType: 'journalist',
      reactionFireCount: 19,
      reactionClownCount: 1,
      reactionSkullCount: 0,
      commentCount: 1,
      createdAt: new Date(Date.now() - 80 * 60000).toISOString(),
    },
    {
      id: 'post-md8-blazers',
      matchId: 'f1000000-0000-4000-8000-000000000802',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000802'),
      authorHandle: 'Campus Oracle #19',
      authorType: 'user',
      content: 'Blue Blazers midfield is walking. Mighty Blacks keep a clean sheet and nick it. That is the take. #EPL',
      sourceType: 'seed',
      reactionFireCount: 28,
      reactionClownCount: 4,
      reactionSkullCount: 15,
      commentCount: 2,
      createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
    },
    {
      id: 'post-md8-draw',
      matchId: null,
      leagueId: EPL_COMPETITION_ID,
      authorHandle: 'Ruiru Pundit #88',
      authorType: 'user',
      content: 'Celtics against Five Stars is the draw on Matchday 8. Who else is on X and staying quiet? #Matchday',
      sourceType: 'user',
      reactionFireCount: 33,
      reactionClownCount: 8,
      reactionSkullCount: 2,
      commentCount: 1,
      createdAt: new Date(Date.now() - 140 * 60000).toISOString(),
    },
    {
      id: 'post-md8-eagles',
      matchId: 'f1000000-0000-4000-8000-000000000806',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000806'),
      authorHandle: 'North Bank Fan #14',
      authorType: 'user',
      content: 'Super Eagles at Tatton under the lights. Wazito have one point from seven. This is not a debate. #EPL',
      sourceType: 'seed',
      reactionFireCount: 17,
      reactionClownCount: 9,
      reactionSkullCount: 3,
      commentCount: 1,
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: 'post-md9-live',
      matchId: 'f1000000-0000-4000-8000-000000000905',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000905'),
      authorHandle: 'Press Box Eye #07',
      authorType: 'journalist',
      authorBadge: 'JOURNALIST',
      content: 'BCOM 2-1 Legends, still live. The away side has the ball. The home side has the score. Matchday 9 is not quiet. #EPL',
      sourceType: 'journalist',
      reactionFireCount: 54,
      reactionClownCount: 3,
      reactionSkullCount: 7,
      commentCount: 2,
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    },
    {
      id: 'post-md9-derby-coach',
      matchId: 'f1000000-0000-4000-8000-000000000906',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000906'),
      authorHandle: 'Santos FC Coach',
      authorType: 'journalist',
      authorBadge: 'COACH',
      content: 'Half time, 1-1 with Mighty Blacks. We start the second half higher. Win the second ball and the derby is there.',
      sourceType: 'journalist',
      reactionFireCount: 22,
      reactionClownCount: 2,
      reactionSkullCount: 1,
      commentCount: 1,
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    },
    {
      id: 'post-md9-ft',
      matchId: 'f1000000-0000-4000-8000-000000000901',
      leagueId: EPL_COMPETITION_ID,
      matchContext: context('f1000000-0000-4000-8000-000000000901'),
      authorHandle: 'East Stand #09',
      authorType: 'user',
      content: 'Five Stars 2-1 Blue Blazers. Full time. The crowd had the away win. The pitch did not. #Matchday',
      sourceType: 'seed',
      reactionFireCount: 39,
      reactionClownCount: 14,
      reactionSkullCount: 6,
      commentCount: 1,
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    },
  ];

  const comments: Record<string, BanterComment[]> = {
    'post-md8-santos-bcom': [
      comment('c-md8-1', 'post-md8-santos-bcom', 'East Stand #09', 'BCOM on the break is the only honest pick.', 18),
      comment('c-md8-2', 'post-md8-santos-bcom', 'Pavilion Pundit #21', 'Santos at home still. I am not folding.', 11),
      comment('c-md8-3', 'post-md8-santos-bcom', 'Main Terrace #33', 'Draw and we all look clever at 6.', 6),
    ],
    'post-md8-derby-desk': [
      comment('c-md8-4', 'post-md8-derby-desk', 'Kipchoge End #12', 'Giants win the derby. Legends are tired of being top.', 30),
      comment('c-md8-5', 'post-md8-derby-desk', 'Varsity Striker #04', 'Table does not play. I still have Legends.', 14),
    ],
    'post-md8-giants-coach': [
      comment('c-md8-6', 'post-md8-giants-coach', 'The Touchline #55', 'That note is the whole match.', 40),
    ],
    'post-md8-blazers': [
      comment('c-md8-7', 'post-md8-blazers', 'Midfield Maestro #16', 'Mighty Blacks away is the rebel pick I can live with.', 70),
      comment('c-md8-8', 'post-md8-blazers', 'Campus Oracle #02', 'Blazers draw. Not a clean sheet.', 22),
    ],
    'post-md8-draw': [
      comment('c-md8-9', 'post-md8-draw', 'Ruiru Pundit #11', 'X on Celtics. Say it with me.', 90),
    ],
    'post-md8-eagles': [
      comment('c-md8-10', 'post-md8-eagles', 'Wazito End #3', 'One point from seven and you still write us off. Fine.', 100),
    ],
    'post-md9-live': [
      comment('c-md9-1', 'post-md9-live', 'Tatton Ultras #18', 'Legends equalise or this timeline is wrong.', 8),
      comment('c-md9-2', 'post-md9-live', 'BCOM Block #6', 'Leave it. 2-1 is enough.', 4),
    ],
    'post-md9-derby-coach': [
      comment('c-md9-3', 'post-md9-derby-coach', 'Santos Side #27', 'Half time draw in a derby is a win until it is not.', 9),
    ],
    'post-md9-ft': [
      comment('c-md9-4', 'post-md9-ft', 'Blue End #44', 'We had that. The last ten minutes were a gift.', 20),
    ],
  };

  return { posts, comments };
}

function currentBundle(now = new Date()): Bundle {
  const { saturday } = weekendDates(now);
  if (bundle && bundle.saturday === saturday) return bundle;
  const matches = buildMatches(now);
  const { posts, comments } = buildPosts(matches);
  bundle = { saturday, matches, consensus: buildConsensus(), posts, comments };
  return bundle;
}

export function fictionalMatches(now = new Date()): Match[] {
  return currentBundle(now).matches;
}

export function fictionalConsensusFor(matchIds: string[], now = new Date()): Map<string, ConsensusData> {
  const source = currentBundle(now).consensus;
  const map = new Map<string, ConsensusData>();
  matchIds.forEach((id) => {
    const row = source.get(id);
    if (row) map.set(id, row);
  });
  return map;
}

export function fictionalBanterPosts(now = new Date()): BanterPost[] {
  return currentBundle(now).posts;
}

export function fictionalComments(postId: string, now = new Date()): BanterComment[] {
  return currentBundle(now).comments[postId] || [];
}
