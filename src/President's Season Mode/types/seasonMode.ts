// TypeScript Data Contracts for President's Season Mode
// Aligned strictly with PostgreSQL database schema in supabase/migrations/

export interface SeasonCompetition {
  id: string;
  name: string;
  slug: string;
  country: string;
  season: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SeasonTeam {
  id: string;
  club_id?: string | null;
  competition_id?: string | null;
  name: string;
  short_name: string;
  logo_url?: string | null;
  color_code?: string | null;
  coach_id?: string | null;
  captain_id?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at?: string;
  // Expanded database relationships
  coach_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
  } | null;
  captain_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
  } | null;
  competition?: SeasonCompetition | null;
}

export interface SeasonReferee {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  status: 'Active' | 'Suspended' | 'Deactivated' | 'Inactive' | 'Unavailable';
  badge_level?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Optional tier classification
  is_elite?: boolean;
  tier?: 'EPL_Exclusive' | 'Mixed' | 'Championship';
}

export interface SeasonPitch {
  id: string;
  name: string;
  short_code: string;
  location: string;
  capacity: number;
  surface_type: string;
  has_lighting: boolean;
  status: 'Available' | 'Maintenance' | 'Occupied' | 'Unavailable';
  created_at?: string;
  updated_at?: string;
}

export interface SeasonInformation {
  id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  registration_cutoff?: string | null;
  status: 'active' | 'inactive' | 'archived';
  is_locked: boolean;
  created_at?: string;
}

// Intake Form Payloads matching Google Forms integration requirements
export interface CoachIntakePayload {
  official_first_name: string;
  official_last_name: string;
  nickname?: string;
  team_name: string;
  phone_number: string;
  email: string;
  competition_id: string;
}

export interface RefereeIntakePayload {
  official_first_name: string;
  official_last_name: string;
  nickname?: string;
  phone_number: string;
  email: string;
  badge_level?: string;
}

export interface TeamNormalizationResult {
  raw_input: string;
  canonical_display_name: string;
  normalized_comparison_key: string;
  has_fc_suffix: boolean;
  changes_made: string[];
}

export type SeasonModeView =
  | 'overview'
  | 'matchdays'
  | 'referees'
  | 'pitches'
  | 'teams';

export interface SeasonFixture {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  status: 'UPCOMING' | 'LIVE' | 'HT' | 'FT' | 'POSTPONED' | 'CANCELLED';
  score_home: number;
  score_away: number;
  venue: string;
  referee_id?: string | null;
  matchday: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  home_team?: SeasonTeam | null;
  away_team?: SeasonTeam | null;
  referee?: SeasonReferee | null;
  competition?: SeasonCompetition | null;
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

// Additional Operational Contracts for President Season Control Centre
export interface LinesmanAssignment {
  linesman_team1_id?: string | null;
  linesman_team1_name?: string | null;
  linesman_team1_status: 'Assigned' | 'Defaulted' | 'Replaced' | 'Pending';
  linesman_team2_id?: string | null;
  linesman_team2_name?: string | null;
  linesman_team2_status: 'Assigned' | 'Defaulted' | 'Replaced' | 'Pending';
}

export interface OperationalMatch extends SeasonFixture {
  linesmen?: LinesmanAssignment;
  is_friendly?: boolean;
  friendly_name?: string;
  cancellation_reason?: string;
  spillover_status?: boolean;
}

export type PitchAvailabilityMode = 'Available' | 'Morning only' | 'Afternoon only' | 'Unavailable';

export interface PitchAvailabilityState {
  pitch_id: string;
  mode: PitchAvailabilityMode;
  notes?: string;
  affected_match_ids?: string[];
}

export interface RefereeEligibility {
  referee: SeasonReferee;
  is_eligible: boolean;
  rejection_reasons: string[];
  fatigue_warning?: boolean;
  tier_match: boolean;
  current_assignments_today: number;
}

export interface FriendlyMatchPayload {
  friendly_name: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  referee_id: string;
  pitch_id: string;
}

export interface FriendlyConflictResult {
  has_conflict: boolean;
  team_conflict?: string | null;
  referee_conflict?: string | null;
  pitch_conflict?: string | null;
  time_conflict?: string | null;
}

export interface OperationalAlert {
  id: string;
  type:
    | 'MATCH_CANCELLED'
    | 'REFEREE_UNAVAILABLE'
    | 'PITCH_UNAVAILABLE'
    | 'MATCH_POSTPONED'
    | 'SPILLOVER_DETECTED'
    | 'LINESMAN_DEFAULT'
    | 'SCHEDULING_CONFLICT'
    | 'UNASSIGNED_REFEREE';
  severity: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  related_id?: string;
  timestamp: string;
}

export interface CalendarDayState {
  date_str: string; // YYYY-MM-DD
  is_matchday: boolean;
  is_weekend: boolean;
  is_override_available: boolean;
  is_override_unavailable: boolean;
  matches: OperationalMatch[];
  matchday_number?: number | null;
}



