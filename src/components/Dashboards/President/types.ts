export type PresidentTab =
  | 'overview'
  | 'season_engine'
  | 'fixture_engine'
  | 'megaphone'
  | 'teams'
  | 'referees'
  | 'registration'
  | 'profile'
  | 'wizard';

export type LeagueTab = 'premier' | 'championship';

export interface SeasonItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  registrationCutoff: string;
  status: 'active' | 'inactive' | 'archived';
  isLocked: boolean;
}

export interface LeagueItem {
  id: string;
  name: string;
  tier: string;
  maxTeams: number;
  currentTeamsCount: number;
  status: 'Active' | 'Inactive';
  isArchived: boolean;
}

export interface PendingTeam {
  id: string;
  name: string;
  code: string;
  requestedLeague: 'premier' | 'championship';
  division: string;
  coachName: string;
  coachAssigned: boolean;
  playerCount: number;
  submittedAt: string;
  doctorAssigned: boolean;
}

export interface TeamItem {
  id: string;
  name: string;
  code: string;
  league: 'premier' | 'championship';
  coach: string;
  captain: string;
  playerCount: number;
  maxRoster: number;
  doctorStatus: 'Assigned' | 'Unassigned';
  doctorName?: string;
  hasCoach: boolean;
  hasCaptain: boolean;
}

export interface RefereeItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'Active' | 'Suspended' | 'Deactivated' | 'Pending Verification';
  badgeLevel?: string;
  availability?: 'Available' | 'Assigned' | 'Unavailable';
  experience?: string;
  assignedMatchesCount?: number;
  seasonAssigned?: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target_role: string;
  author_id?: string;
  created_at: string;
  read_count?: number;
}

export interface DraftFixture {
  id: string;
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  timeSlot: string;
  pitch: string;
  hasConflict: boolean;
  conflictReason?: string;
}

export interface PitchItem {
  id: string;
  name: string;
  short_code?: string;
  location?: string;
  capacity?: number;
  surface_type?: string;
  has_lighting?: boolean;
  status?: 'Available' | 'Maintenance' | 'Occupied' | 'Unavailable' | string;
}

export interface SeasonFixture {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'FT' | 'POSTPONED' | 'CANCELLED' | string;
  score_home: number;
  score_away: number;
  venue: string;
  referee_id?: string | null;
  matchday: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  home_team?: {
    id: string;
    name: string;
    short_name?: string | null;
    logo_url?: string | null;
    color_code?: string | null;
  } | null;
  away_team?: {
    id: string;
    name: string;
    short_name?: string | null;
    logo_url?: string | null;
    color_code?: string | null;
  } | null;
  referee?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  competition?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
}

export interface GeneratedLegFixtures {
  leg: 1 | 2;
  matchday: number;
  fixtures: SeasonFixture[];
}

export interface GeneratedCompetitionFixtures {
  competition_id: string;
  competition_name: string;
  teams_count: number;
  total_matchdays: number;
  leg1_fixtures: GeneratedLegFixtures[];
  leg2_fixtures: GeneratedLegFixtures[];
  all_fixtures: SeasonFixture[];
}

export interface PreviewValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalFixtures: number;
}

export interface GenerationServiceResult {
  success: boolean;
  premierLeagueFixtures?: GeneratedCompetitionFixtures;
  championshipFixtures?: GeneratedCompetitionFixtures;
  validation: PreviewValidationResult;
  error: string | null;
}

export type SeasonState =
  | 'SEASON_NOT_GENERATED'
  | 'PREVIEW_READY'
  | 'AWAITING_FINAL_CONFIRMATION'
  | 'SEASON_OFFICIAL'
  | 'GENERATION_ERROR';


