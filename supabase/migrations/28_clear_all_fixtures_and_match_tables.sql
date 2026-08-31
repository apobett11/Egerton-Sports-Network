-- Migration 28: Clear all fixtures, matchday schedules, base fixtures, and match details
-- Guarantees clean zero-row state across all matchday and fixture storage tables

-- 1. Truncate / Delete all match details, live state, and events
DELETE FROM public.match_live_audit_logs;
DELETE FROM public.match_live_events;
DELETE FROM public.match_live_states;
DELETE FROM public.canonical_permanent_results;
DELETE FROM public.finalization_commands;
DELETE FROM public.referee_working_sets;
DELETE FROM public.match_events;
DELETE FROM public.match_lineups;
DELETE FROM public.match_reports;
DELETE FROM public.league_standings;
DELETE FROM public.team_form;
DELETE FROM public.player_stats;
DELETE FROM public.historical_standings;

-- 2. Clear matchday schedules, base fixtures, and primary fixtures
DELETE FROM public.matchday_schedules;
DELETE FROM public.base_fixtures;
DELETE FROM public.fixtures;

-- 3. Reset season mode to PRE_SEASON in system_settings
INSERT INTO public.system_settings (key, value)
VALUES 
  ('season_mode', '{"mode": "PRE_SEASON", "fixtures_count": 0, "is_season_mode": false, "manual_override": false}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
