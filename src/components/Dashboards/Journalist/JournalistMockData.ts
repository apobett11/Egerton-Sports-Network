import {
  ArticlePost,
  AnonymousTip,
  NotificationItem,
  JournalistAnalytics,
  MatchHeroData,
  JournalistRatingInfo
} from './JournalistTypes';

export const HERO_MATCH_LIVE: MatchHeroData = {
  isLive: true,
  homeTeam: 'Engineering FC',
  awayTeam: 'Agriculture FC',
  score: '2 – 1',
  minute: "56'",
  venue: 'Pavilion Main Pitch',
  league: 'Egerton Premier League'
};

export const HERO_MATCH_NEXT: MatchHeroData = {
  isLive: false,
  homeTeam: 'Engineering FC',
  awayTeam: 'Computer Science FC',
  time: 'Tomorrow, 3:00 PM',
  venue: 'Njoro Grounds',
  league: 'Egerton Premier League'
};

export const JOURNALIST_RATING_DATA: JournalistRatingInfo = {
  rating: 4.8,
  starCount: 5,
  badgeText: 'Top 5% this month',
  rankText: 'Lead Sports Correspondent #1'
};

export const TRENDING_TEAMS = [
  { name: 'Tatton FC', league: 'Premier League', points: '28 pts', trend: '+3' },
  { name: 'Engineering Strikers', league: 'Premier League', points: '25 pts', trend: '+1' },
  { name: 'Maragoli FC', league: 'Championship', points: '22 pts', trend: '+4' }
];

export const INITIAL_ARTICLES: ArticlePost[] = [
  // TODAY'S JOURNALS
  {
    id: 'post-today-1',
    headline: 'BREAKING: Egerton Premier League Title Race Heats Up as Tatton FC Edge Njoro City 2-1!',
    subtitle: 'A dramatic 88th-minute header sealed the victory at Pavilion Grounds.',
    body: 'In a thrilling derby at Pavilion Grounds, Tatton FC secured a pivotal 2-1 victory over rivals Njoro City. Captain Brian Ombati delivered a masterclass performance, scoring early and assisting the match-winner in the 88th minute. With this result, Tatton move 3 points clear at the top of the ESN Premier League standings with 4 rounds remaining.',
    category: 'breaking_news',
    timestamp: '18m ago',
    isToday: true,
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'
    ],
    status: 'published',
    isPinned: true,
    interactions: {
      likesCount: 342,
      repostsCount: 89,
      commentsCount: 24,
      viewsCount: 4890,
      bookmarksCount: 67,
      isLiked: true,
      isReposted: false,
      isBookmarked: true
    },
    comments: [
      {
        id: 'c1',
        authorName: 'Coach Ochieng',
        authorHandle: 'tatton_coach',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        isVerified: true,
        timestamp: '12m ago',
        content: 'Tactical discipline made the difference today. Proud of the boys! 🟢⚪'
      },
      {
        id: 'c2',
        authorName: 'Mercy Chebet',
        authorHandle: 'chebet_sports',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        isVerified: false,
        timestamp: '5m ago',
        content: 'That 88th min goal was pure class! Best match of the semester.'
      }
    ]
  },
  {
    id: 'post-today-2',
    headline: 'MATCH REPORT: Egerton Falcons Basketball Dominate University Games Qualifiers 78-62',
    subtitle: 'Kevin Omwamba dropped 32 points in a sensational MVP display.',
    body: 'The Egerton Falcons basketball team showcased unstoppable offence against Nairobi Varsity, clinching their spot in the East Africa Inter-Varsity Championship. Omwamba sank six 3-pointers while controlling the defensive glass.',
    category: 'match_report',
    timestamp: '2h ago',
    isToday: true,
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&q=80&w=800'
    ],
    status: 'published',
    interactions: {
      likesCount: 276,
      repostsCount: 52,
      commentsCount: 14,
      viewsCount: 3410,
      bookmarksCount: 42,
      isLiked: true,
      isReposted: true,
      isBookmarked: true
    }
  },

  // TODAY'S FLAGGED ARTICLE
  {
    id: 'post-disputed-today',
    headline: '⚠ Transfer Rumours at Njoro FC',
    subtitle: 'Alleged mid-season transfer negotiations with rival club.',
    body: 'Reports emerged early today regarding potential player moves from Njoro FC.',
    category: 'transfer_rumour',
    timestamp: 'Flagged today',
    isToday: true,
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    status: 'disputed',
    isFlaggedToday: true,
    disputeReason: 'Transfer not officially confirmed by Njoro FC Management.',
    interactions: {
      likesCount: 45,
      repostsCount: 8,
      commentsCount: 12,
      viewsCount: 980,
      bookmarksCount: 4
    }
  },

  // OLDER JOURNALS (LOAD BELOW IN INFINITE SCROLL)
  {
    id: 'post-older-1',
    headline: 'TRANSFER RUMOUR: Maragoli Strikers Target Campus Top Scorer Ahead of Mid-Season Window',
    subtitle: 'Internal sources suggest a record scholarship swap deal.',
    body: 'Scouts from Maragoli Strikers were spotted in the stands during Thursday\'s clash. Reliable campus insiders reveal talks are underway for a mid-season move. The transfer could mark one of the biggest player movements in Egerton ESN history.',
    category: 'transfer_rumour',
    timestamp: 'Yesterday',
    isToday: false,
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    images: [
      'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&q=80&w=800'
    ],
    status: 'published',
    interactions: {
      likesCount: 198,
      repostsCount: 45,
      commentsCount: 18,
      viewsCount: 2310,
      bookmarksCount: 31,
      isLiked: false,
      isReposted: true,
      isBookmarked: false
    }
  },
  {
    id: 'post-older-2',
    headline: 'PHOTO ESSAY: Egerton Women\'s Volleyball Squad Reaches Inter-Varsity Finals',
    subtitle: 'High energy photos from the semi-final thriller against Kenyatta University.',
    body: 'The Egerton Falcons volleyed their way to victory in a five-set thriller! Check out the action-packed match photos from today\'s semi-final.',
    category: 'photo_story',
    timestamp: '3 days ago',
    isToday: false,
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    images: [
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1592656670411-b9199081e64e?auto=format&fit=crop&q=80&w=800'
    ],
    status: 'published',
    interactions: {
      likesCount: 520,
      repostsCount: 112,
      commentsCount: 38,
      viewsCount: 6420,
      bookmarksCount: 94
    }
  }
];

export const DRAFT_ARTICLES: ArticlePost[] = [
  {
    id: 'draft-1',
    headline: 'EXCLUSIVE: Interview with Egerton Basketball MVP Kevin Omwamba',
    subtitle: 'Discussing championship goals and balancing academics with varsity sports.',
    body: 'We sat down with Kevin Omwamba after his 32-point performance against Nairobi University...',
    category: 'interview',
    timestamp: 'Drafted 3h ago',
    authorName: 'Alex Kiptoo',
    authorHandle: 'kiptoo_esn',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isVerified: true,
    roleBadge: 'Lead ESN Journalist',
    status: 'draft',
    interactions: {
      likesCount: 0, repostsCount: 0, commentsCount: 0, viewsCount: 0, bookmarksCount: 0
    }
  }
];

export const ANONYMOUS_TIPS: AnonymousTip[] = [
  {
    id: 'tip-1',
    tipText: 'Maragoli FC wing wizard Dennis Omondi was seen training with Tatton FC fitness coaches at Kilimo Gym early this morning. Potential secret transfer?',
    sourceCategory: 'Campus Insider',
    timestamp: '25m ago',
    isRead: false,
    isSaved: true,
    matchContext: 'Mid-season Transfer Rumours'
  },
  {
    id: 'tip-2',
    tipText: 'Main pitch floodlights maintenance is scheduled for Thursday 6 PM, which might force the night fixture between Engineering XI and Medical Stars to be moved to Friday.',
    sourceCategory: 'Ref Squad',
    timestamp: '2h ago',
    isRead: false,
    isSaved: false,
    matchContext: 'Fixture Scheduling'
  }
];

export const NOTIFICATIONS_DATA: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'tip',
    actorName: 'Anonymous Tipster',
    message: 'submitted a new anonymous tip: "Maragoli FC wing wizard Dennis Omondi..."',
    timestamp: '25m ago',
    isRead: false,
    timeGroup: 'Today'
  },
  {
    id: 'notif-2',
    type: 'dispute',
    actorName: 'FA President',
    targetArticleTitle: 'Transfer Rumours at Njoro FC',
    message: 'flagged your article for administrative review.',
    timestamp: '2h ago',
    isRead: false,
    timeGroup: 'Today'
  }
];

export const MOCK_ANALYTICS: JournalistAnalytics = {
  totalImpressions: 142500,
  articleViews: 89200,
  engagementRate: 6.4,
  profileVisits: 12300,
  followersGrowth: 420,
  reach: 32100,
  shares: 3100,
  avgReadingTime: '2m 14s',
  bestPostingTime: '7:30 PM (Post Match Peak)',
  topPerformingArticle: {
    title: 'Tatton FC Edge Njoro City 2-1 in Derby Thriller',
    impressions: 48900,
    engagement: 9.2
  },
  dailyMetrics: [
    { day: 'Mon', views: 4200, engagement: 5.1 },
    { day: 'Tue', views: 6800, engagement: 6.0 },
    { day: 'Wed', views: 11200, engagement: 7.2 },
    { day: 'Thu', views: 9500, engagement: 6.5 },
    { day: 'Fri', views: 18400, engagement: 8.4 },
    { day: 'Sat', views: 24500, engagement: 9.1 },
    { day: 'Sun', views: 14600, engagement: 6.8 }
  ]
};
