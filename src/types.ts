export type UserRole = 
  | 'guest' 
  | 'player' 
  | 'captain' 
  | 'coach' 
  | 'journalist' 
  | 'referee' 
  | 'linesman' 
  | 'president' 
  | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  colorCode: string;
  club_id?: string;
  competition_id?: string;
  coach_id?: string;
  captain_id?: string;
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  isCaptain: boolean;
  isSub: boolean;
  profile_id?: string;
  team_id?: string;
  height?: number;
  weight?: number;
  preferred_foot?: 'left' | 'right' | 'both';
  nationality?: string;
  status?: string;
  rating?: number;
  cardImage?: string;
  medicalClearance?: boolean;
  isInjured?: boolean;
  yellowCards?: number;
  redCards?: number;
  isSuspended?: boolean;
}

export type MatchEventType = 
  | 'goal' 
  | 'yellow' 
  | 'red' 
  | 'sub_in' 
  | 'sub_out' 
  | 'injury' 
  | 'penalty' 
  | 'own_goal'
  | 'kickoff' 
  | 'ht' 
  | 'second_half' 
  | 'ft' 
  | 'suspended' 
  | 'resumed' 
  | 'extra_time' 
  | 'shootout' 
  | 'abandoned';

export interface MatchEvent {
  id: string;
  fixtureId?: string;
  minute: number;
  type: MatchEventType;
  eventTarget?: 'home' | 'away' | 'match';
  teamId?: string;
  playerId?: string;
  assistPlayerId?: string;
  detailText?: string;
  createdBy?: string;
  createdAt?: string;
  isOfficial?: boolean;
}

export interface MatchStat {
  label: string;
  teamAValue: number;
  teamBValue: number;
}

export type MatchStatus = 
  | 'LIVE' 
  | 'FT' 
  | 'UPCOMING' 
  | 'HT' 
  | 'POSTPONED' 
  | 'CANCELLED' 
  | 'FT_PENDING_VERIFICATION' 
  | 'FINAL' 
  | 'ARCHIVED';

export interface Match {
  id: string;
  status: MatchStatus;
  time: string;           // E.g., "16:00" or "FT"
  minute: string;         // E.g., "82'", "HT", "-"
  league: string;         // League name
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: {
    teamA: Player[];
    teamB: Player[];
    formationA: string;   // E.g., "4-3-3"
    formationB: string;   // E.g., "3-5-2"
  };
  venue: string;
  referee: string;
  refereeId?: string;
  verifiedByRefereeId?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  authorRole: string;
  verified: boolean;
  category: 'transfer' | 'match_report' | 'injury' | 'general' | 'announcement';
  slug?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'published' | 'archived';
}

export interface LeagueTableEntry {
  position: number;
  teamId: string;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  movement?: 'up' | 'down' | 'same';
  previousPosition?: number;
  lastUpdated?: string;
}

export interface HistoricalSeasonStandings {
  seasonId: string;
  seasonName: string;
  competitionName: string;
  archivedAt: string;
  entries: LeagueTableEntry[];
}

export interface Competition {
  id: string;
  name: string;
  slug: string;
  country: string;
  season: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Club {
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  stadium?: string;
  founded?: number;
  president_id?: string;
}

export interface MatchReport {
  id: string;
  fixture_id: string;
  official_id: string;
  official_role: 'referee' | 'linesman';
  report_text: string;
  submitted_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  target_team_id?: string;
  author_id: string;
  created_at: string;
}

export interface SquadRequest {
  id: string;
  team_id: string;
  requester_id: string;
  request_type: string;
  details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
}
