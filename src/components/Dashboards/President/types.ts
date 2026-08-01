export type PresidentTab =
  | 'overview'
  | 'season_engine'
  | 'fixture_engine'
  | 'megaphone'
  | 'teams'
  | 'referees'
  | 'registration'
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
