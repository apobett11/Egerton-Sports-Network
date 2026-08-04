export type AdminTabType =
  | 'overview'
  | 'overviews'
  | 'insights'
  | 'users'
  | 'roles'
  | 'audit_logs'
  | 'performance'
  | 'settings'
  | 'profile';

export interface PlatformHealthMetrics {
  totalUsers: number;
  activeUsersToday: number;
  onlineUsers: number;
  totalTeams: number;
  totalPlayers: number;
  totalReferees: number;
  totalJournalists: number;
  totalCoaches: number;
  totalCaptains: number;
  totalArticles: number;
  scheduledMatches: number;
  completedMatches: number;
}

export type HealthStatusType = 'healthy' | 'warning' | 'offline';

export interface SystemHealthMetrics {
  apiStatus: HealthStatusType;
  apiLatencyMs: number;
  dbStatus: HealthStatusType;
  dbLatencyMs: number;
  authStatus: HealthStatusType;
  storageStatus: HealthStatusType;
  realtimeStatus: HealthStatusType;
  lastChecked: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  iconType: 'coach' | 'referee' | 'journalist' | 'president' | 'player' | 'admin' | 'system';
}

export interface PlatformErrorItem {
  id: string;
  timestamp: string;
  source: string;
  errorType: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  resolved: boolean;
}

export interface JournalistOverviewSummary {
  totalJournalists: number;
  articlesToday: number;
  draftsCount: number;
  publishedCount: number;
  flaggedCount: number;
  totalViews: number;
  mostViewedArticle: {
    id: string;
    title: string;
    views: number;
    author: string;
  } | null;
  latestPublication: {
    id: string;
    title: string;
    author: string;
    publishedAt: string;
  } | null;
  journalistsList: Array<{
    id: string;
    name: string;
    email: string;
    articlesCount: number;
    totalViews: number;
    impressions: number;
    status: 'active' | 'suspended';
    latestPublishDate: string;
  }>;
}

export interface TeamOverviewSummary {
  totalTeams: number;
  avgPlayersPerTeam: number;
  avgSquadCompletion: number; // percentage
  practiceSchedulesCount: number;
  upcomingFixturesCount: number;
  latestSquadSubmission: {
    teamName: string;
    submittedAt: string;
    coachName: string;
  } | null;
  teamsNeedingAttentionCount: number;
  teamsList: Array<{
    id: string;
    name: string;
    coachName: string;
    captainName: string;
    playersCount: number;
    status: 'complete' | 'incomplete' | 'attention_needed';
    lastSubmission: string;
  }>;
}

export interface RefereeOverviewSummary {
  totalReferees: number;
  availableReferees: number;
  assignedToday: number;
  completedMatches: number;
  pendingReportsCount: number;
  cancelledMatchesCount: number;
  avgReportCompletionTimeMins: number;
  refereesList: Array<{
    id: string;
    name: string;
    email: string;
    assignedFixturesCount: number;
    completedFixturesCount: number;
    pendingReportsCount: number;
    status: 'available' | 'assigned' | 'inactive';
    performanceRating: number; // percentage or score out of 5
  }>;
}

export interface PresidentOverviewSummary {
  totalAnnouncements: number;
  fixtureGenerationsCount: number;
  currentCompetition: string;
  latestBroadcastsCount: number;
  latestActions: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

export interface UserProfileRow {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'admin' | 'president' | 'coach' | 'captain' | 'referee' | 'linesman' | 'journalist' | 'player' | 'guest';
  email: string;
  phone: string;
  teamName?: string;
  lastLogin: string;
  status: 'active' | 'suspended';
  avatarUrl?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  affectedRecord: string;
  resourceType: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
  details?: string;
}

export interface PlatformInsightItem {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  actionRequired?: string;
  targetTab?: AdminTabType;
}

export interface PlatformPerformanceMetrics {
  avgLoginTimeMs: number;
  avgApiResponseMs: number;
  dbLatencyMs: number;
  realtimeLatencyMs: number;
  storageUsageMb: number;
  articlesPerDay: number;
  uploadsToday: number;
  avgSessionDurationMins: number;
  peakConcurrentUsers: number;
}

// Backward Compatibility Interfaces for Legacy Widgets
export interface Journalist {
  id: string;
  name: string;
  role: string;
  faculty: string;
  articlesCount: number;
  totalEngagement: number;
  anonymousTipsVolume: number;
  isDisputed: boolean;
  disputedReason?: string;
  lastArticleTitle: string;
}

export interface SupabaseSlowQuery {
  id: string;
  query: string;
  durationMs: number;
  tableName: string;
  recommendedIndex: string;
  isOptimized: boolean;
}

export interface DauDataPoint {
  day: string;
  dau: number;
  sessionMins: number;
  predictions: number;
  dopamineHits: number;
}

export interface PsychSystemDataPoint {
  name: string;
  value: number;
  color: string;
}
