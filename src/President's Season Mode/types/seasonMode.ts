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
  status: 'Active' | 'Suspended' | 'Deactivated' | 'Inactive';
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

export type SeasonModeView = 'overview' | 'teams' | 'referees' | 'pitches' | 'registration';
