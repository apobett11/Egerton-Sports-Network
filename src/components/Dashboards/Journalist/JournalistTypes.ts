export type TabType = 'home' | 'articles' | 'analytics' | 'profile' | 'settings';

export type ArticleCategory =
  | 'breaking_news'
  | 'transfer_news'
  | 'club_news'
  | 'league_news'
  | 'official_statement'
  | 'press_conference'
  | 'coach_interview'
  | 'player_interview'
  | 'injury_update'
  | 'match_preview'
  | 'match_review'
  | 'feature_story'
  | 'opinion'
  | 'other';

export type PostStatus = 'published' | 'draft' | 'disputed';

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  breaking_news: 'Breaking News',
  transfer_news: 'Transfer News',
  club_news: 'Club News',
  league_news: 'League News',
  official_statement: 'Official Statement',
  press_conference: 'Press Conference',
  coach_interview: 'Coach Interview',
  player_interview: 'Player Interview',
  injury_update: 'Injury Update',
  match_preview: 'Match Preview',
  match_review: 'Match Review',
  feature_story: 'Feature Story',
  opinion: 'Opinion',
  other: 'Other',
};

export interface PostInteraction {
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  viewsCount: number;
  bookmarksCount: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

export interface ArticlePost {
  id: string; // UUID
  headline: string;
  subtitle?: string;
  body: string;
  category: ArticleCategory;
  timestamp: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isToday?: boolean;
  isYesterday?: boolean;
  isThisWeek?: boolean;
  isThisMonth?: boolean;
  monthKey?: string; // e.g. "2026-08"
  monthLabel?: string; // e.g. "August 2026"
  matchday?: number; // e.g. 1, 2, 3
  authorId?: string; // UUID references profiles(id)
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  isVerified?: boolean;
  roleBadge?: string;
  images?: string[];
  imageStoragePath?: string;
  status: PostStatus;
  viewsCount: number;
  matchId?: string; // UUID references fixtures(id)
  matchTitle?: string;
  teamId?: string; // UUID references teams(id)
  teamName?: string;
  competitionId?: string; // UUID references competitions(id)
  competitionName?: string;
  disputeReason?: string;
  interactions?: PostInteraction;
}

export interface CurrentMatchEvent {
  id: string; // UUID
  competition: string;
  competitionId?: string; // UUID
  homeTeam: string;
  homeTeamId?: string; // UUID
  homeLogo?: string;
  awayTeam: string;
  awayTeamId?: string; // UUID
  awayLogo?: string;
  scoreHome: number;
  scoreAway: number;
  status: 'LIVE' | 'HT' | 'FT' | 'UPCOMING';
  minute?: string;
  kickoff: string;
  time: string;
  venue: string;
  countdown?: string;
  matchday?: number;
}

export interface AnonymousTip {
  id: string;
  tipText: string;
  sourceCategory: string;
  timestamp: string;
  isRead: boolean;
  isSaved: boolean;
  matchContext?: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'repost' | 'comment' | 'follower' | 'tip' | 'dispute' | 'mention';
  actorName: string;
  targetArticleTitle?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface MonthlyStatsItem {
  monthKey: string;
  monthLabel: string;
  count: number;
  views: number;
}

export interface MatchdayStatsItem {
  matchday: number;
  label: string;
  count: number;
  views: number;
}

export interface PerformanceMetrics {
  articlesToday: number;
  articlesThisWeek: number;
  articlesThisMonth: number;
  publishedCount: number;
  draftsCount: number;
  flaggedCount: number;
  impressions: number;
  engagementRate: number;
  reads: number;
  avgReadTime: string;
  shares: number;
  topArticle: string;
  topCompetition: string;
  mostCoveredTeam: string;
  monthlyStats: MonthlyStatsItem[];
  matchdayStats: MatchdayStatsItem[];
}

export interface OptionItem {
  id: string; // UUID
  name: string;
}

export interface ProfileUser {
  id: string; // UUID
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  avatarUrl?: string;
}
