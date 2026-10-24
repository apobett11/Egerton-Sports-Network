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

export type AuthorType = 'user' | 'journalist' | 'coach' | 'admin' | 'seed';
export type ReactionType = 'fire' | 'clown' | 'skull';
export type BanterFilterType = 'all' | 'trending' | 'coach' | 'analytics' | 'banter' | 'latest' | 'top' | 'today' | 'mine';

export interface BanterPollOption {
  id: number;
  text: string;
  votes: number;
}

export interface BanterPoll {
  id: string;
  postId: string;
  question: string;
  options: BanterPollOption[];
  totalVotes: number;
  voters: Record<string, number>; // { device_id: option_id }
  expiresAt: string;
}

export type BanterMediaType = 'NONE' | 'IMAGE' | 'DUAL_IMAGE' | 'VIDEO';

export interface BanterPost {
  id: string;
  parentId?: string | null;
  rootId?: string | null;
  depth?: number;
  userId?: string;
  authorHandle: string;
  authorName?: string;
  authorAvatar?: string;
  authorType: AuthorType;
  authorBadge?: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: BanterMediaType;
  imageUrl?: string;
  matchId?: string | null;
  leagueId?: string | null;
  matchContext?: {
    homeTeamName: string;
    awayTeamName: string;
    matchday?: number;
  };
  sourceType: 'user' | 'journalist' | 'seed' | 'admin';
  likesCount?: number;
  repliesCount?: number;
  repostsCount?: number;
  reactionFireCount: number;
  reactionClownCount: number;
  reactionSkullCount: number;
  commentCount: number;
  repostCount?: number;
  impressionsCount?: number;
  viewsCount?: number;
  pollId?: string | null;
  poll?: BanterPoll | null;
  taggedTeamId?: string | null;
  taggedTeamName?: string | null;
  authorDeviceId?: string;
  isMine?: boolean;
  isLiked?: boolean;
  isReposted?: boolean;
  createdAt: string;
  userReactions?: {
    fire?: boolean;
    clown?: boolean;
    skull?: boolean;
  };
  children?: BanterPost[];
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

export interface JournalistAnalytics {
  total_posts_7d: number;
  total_replies_7d: number;
  active_devices_7d: number;
  top_tagged_teams: Array<{
    tagged_team_id: string;
    tagged_team_name: string;
    tag_count: number;
  }>;
  hourly_distribution_24h: Array<{
    hour_of_day: number;
    post_count: number;
  }>;
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
