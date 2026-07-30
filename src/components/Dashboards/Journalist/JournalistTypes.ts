export type TabType = 'home' | 'compose' | 'notifications' | 'analytics' | 'profile' | 'settings';

export type ProfileTabType = 'published' | 'media' | 'drafts' | 'flagged' | 'analytics' | 'bookmarks';

export type ArticleCategory = 'match_report' | 'transfer_rumour' | 'interview' | 'breaking_news' | 'photo_story' | 'opinion';

export type PostStatus = 'published' | 'draft' | 'failed' | 'disputed';

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

export interface Comment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isVerified?: boolean;
  timestamp: string;
  content: string;
}

export interface ArticlePost {
  id: string;
  headline: string;
  subtitle?: string;
  body: string;
  category: ArticleCategory;
  timestamp: string;
  isToday?: boolean;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isVerified: boolean;
  roleBadge: string;
  images?: string[];
  videoThumbnail?: string;
  status: PostStatus;
  isPinned?: boolean;
  disputeReason?: string;
  flaggedDate?: string;
  isFlaggedToday?: boolean;
  interactions: PostInteraction;
  comments?: Comment[];
}

export interface MatchHeroData {
  isLive: boolean;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  minute?: string;
  time?: string;
  venue?: string;
  league?: string;
}

export interface JournalistRatingInfo {
  rating: number;
  starCount: number;
  badgeText: string;
  rankText: string;
}

export interface AnonymousTip {
  id: string;
  tipText: string;
  sourceCategory: 'Player' | 'Fan' | 'Ref Squad' | 'Campus Insider';
  timestamp: string;
  isRead: boolean;
  isSaved: boolean;
  matchContext?: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'repost' | 'comment' | 'follower' | 'tip' | 'dispute' | 'mention';
  actorName: string;
  actorHandle?: string;
  actorAvatar?: string;
  targetArticleTitle?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  timeGroup: 'Today' | 'Yesterday' | 'Earlier';
}

export interface JournalistAnalytics {
  totalImpressions: number;
  articleViews: number;
  engagementRate: number;
  profileVisits: number;
  followersGrowth: number;
  reach: number;
  shares: number;
  avgReadingTime: string;
  bestPostingTime: string;
  topPerformingArticle: {
    title: string;
    impressions: number;
    engagement: number;
  };
  dailyMetrics: { day: string; views: number; engagement: number }[];
}

export type MockAnalytics = JournalistAnalytics & {
  totalViews?: number;
  earnings?: number;
};

export interface HeroMatchLive {
  homeTeam: string;
  awayTeam: string;
  venue: string;
  league: string;
}

export interface HeroMatchNext {
  homeTeam: string;
  awayTeam: string;
  venue: string;
  time: string;
}

export interface TrendingTeam {
  name: string;
  trend: string;
}
