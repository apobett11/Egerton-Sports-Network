export type PredictionOption = '1' | 'X' | '2';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  colorCode?: string;
}

export interface Match {
  id: string;
  competitionId: string;
  league: string;
  matchday: number;
  scheduledTime: string;
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'FT' | 'POSTPONED' | 'CANCELLED';
  scoreHome: number;
  scoreAway: number;
  venue: string;
  homeTeam: Team;
  awayTeam: Team;
  isDerby?: boolean;
  squads?: MatchSquadInfo;
}

export interface UserPrediction {
  matchId: string;
  prediction: PredictionOption;
  matchday: number;
  updatedAt: string;
}

export interface ConsensusData {
  matchId: string;
  homePct: number;
  drawPct: number;
  awayPct: number;
  totalVotes: number;
  pulseLabel: string;
}

export type ConsensusIQBand = 'Elite Pundit' | 'Sharp Tactical Read' | 'Dangerous Rebel Pick' | 'Building Profile';

export interface ConsensusIQResult {
  score: number; // 0 - 100
  band: ConsensusIQBand;
  statusLabel: string;
  analysisText: string;
  picksCompleted: number;
  totalRequired: number;
  isEligible: boolean;
}

export interface SquadMember {
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  number: number;
  isKeyPlayer?: boolean;
}

export interface MatchSquadInfo {
  homeFormation: string;
  awayFormation: string;
  homeKeyPlayers: SquadMember[];
  awayKeyPlayers: SquadMember[];
  homeInjuries?: string[];
  awayInjuries?: string[];
}

export type AuthorType = 'user' | 'journalist' | 'admin' | 'seed';
export type ReactionType = 'fire' | 'clown' | 'skull';
export type BanterFilterType = 'trending' | 'coach' | 'latest' | 'all' | 'top' | 'today' | 'mine';

export interface BanterPost {
  id: string;
  matchId?: string | null;
  leagueId?: string | null;
  matchContext?: {
    homeTeamName: string;
    awayTeamName: string;
    matchday?: number;
  };
  authorHandle: string;
  authorType: AuthorType;
  authorBadge?: string;
  content: string;
  imageUrl?: string;
  sourceType: 'user' | 'journalist' | 'seed' | 'admin';
  reactionFireCount: number;
  reactionClownCount: number;
  reactionSkullCount: number;
  commentCount: number;
  repostCount?: number;
  impressionsCount?: number;
  viewsCount?: number;
  isMine?: boolean;
  isLiked?: boolean;
  isReposted?: boolean;
  createdAt: string;
  userReactions?: {
    fire?: boolean;
    clown?: boolean;
    skull?: boolean;
  };
}

export interface BanterComment {
  id: string;
  postId: string;
  authorHandle: string;
  authorType: AuthorType;
  authorBadge?: string;
  content: string;
  createdAt: string;
}

export interface AnonymousDevice {
  deviceId: string;
  publicHandle: string;
  status: 'active' | 'throttled' | 'banned';
  createdAt: string;
  bound: boolean;
}

export interface DerbyConfig {
  competitionId: string;
  matchday: number;
  fixtureId: string;
  isActive: boolean;
}
