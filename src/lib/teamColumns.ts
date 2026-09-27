/**
 * Scalar team columns used by lists and dashboards.
 * `founded_year` is not a column on `public.teams`, so it is not selected.
 * Heavy JSON (kits, tactics blobs, match squads) stays off list queries.
 */

export const TEAM_LIST_COLUMNS =
  'id, name, short_name, logo_url, faculty, color_code, status, competition_id, coach_id, captain_id, updated_at';

/** Coach home screen. Crest bytes stay in the asset cache, not in this row. */
export const TEAM_DASHBOARD_COLUMNS =
  'id, name, short_name, faculty, color_code, status, competition_id, coach_id, captain_id, description, contact_email, contact_phone, stadium, primary_color, secondary_color, accent_color, season, starting_xi_str, substitutes_str, practice_schedule, tactics_config, created_at, updated_at';

/** Admin readiness still needs kit and squad scalars. Crest files are not repeated here. */
export const TEAM_ADMIN_COLUMNS =
  'id, name, short_name, logo_url, faculty, color_code, status, competition_id, coach_id, captain_id, starting_xi_str, substitutes_str, kits_config, tactics_config, temporary_match_squad, created_at, updated_at';

export const TEAM_CACHE_COLUMNS =
  'id, name, short_name, logo_url, faculty, competition_id, coach_id, kits_config';
