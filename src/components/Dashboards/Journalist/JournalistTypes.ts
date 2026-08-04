export type TabType = 'home' | 'articles' | 'analytics' | 'profile' | 'settings';

export type ArticleCategory =
  | 'match_report'
  | 'transfer_rumour'
  | 'breaking_news'
  | 'press_conference'
  | 'coach_interview'
  | 'player_interview'
  | 'injury_update'
  | 'match_preview'
  | 'match_review'
  | 'opinion'
  | 'feature_story'
  | 'league_news'
  | 'club_news'
  | 'official_statement'
  | 'other';

export type PostStatus = 'published' | 'draft' | 'disputed';

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  match_report: 'Match Report',
  transfer_rumour: 'Transfer Rumour',
  breaking_news: 'Breaking News',
  press_conference: 'Press Conference',
  coach_interview: 'Coach Interview',
  player_interview: 'Player Interview',
  injury_update: 'Injury Update',
  match_preview: 'Match Preview',
  match_review: 'Match Review',
  opinion: 'Opinion',
  feature_story: 'Feature Story',
  league_news: 'League News',
  club_news: 'Club News',
  official_statement: 'Official Statement',
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
  id: string;
  headline: string;
  subtitle?: string;
  body: string;
  category: ArticleCategory;
  timestamp: string;
  publishedAt?: string;
  isToday?: boolean;
  isYesterday?: boolean;
  isThisWeek?: boolean;
  isThisMonth?: boolean;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  isVerified?: boolean;
  roleBadge?: string;
  images?: string[];
  status: PostStatus;
  viewsCount: number;
  matchId?: string;
  matchTitle?: string;
  teamId?: string;
  teamName?: string;
  competitionId?: string;
  competitionName?: string;
  disputeReason?: string;
  interactions?: PostInteraction;
}

export interface CurrentMatchEvent {
  id: string;
  competition: string;
  competitionId?: string;
  homeTeam: string;
  homeTeamId?: string;
  homeLogo?: string;
  awayTeam: string;
  awayTeamId?: string;
  awayLogo?: string;
  scoreHome: number;
  scoreAway: number;
  status: 'LIVE' | 'HT' | 'FT' | 'UPCOMING';
  minute?: string;
  kickoff: string;
  time: string;
  venue: string;
  countdown?: string;
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
}

export interface OptionItem {
  id: string;
  name: string;
}
