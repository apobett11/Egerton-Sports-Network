-- Migration 28: Purge All Fixtures, Matchdays, and Match Details & Align Management Permissions
-- 1. Complete truncation/deletion of all matchdays, fixtures, and match details across database
-- 2. Aligns permissions so the season begins with a completely clean slate

-- 1. CLEAR ALL MATCHDAYS, FIXTURES, AND DERIVED MATCH DETAILS
DELETE FROM public.matchday_schedules;
DELETE FROM public.base_fixtures;
DELETE FROM public.match_events;
DELETE FROM public.match_lineups;
DELETE FROM public.match_reports;
DELETE FROM public.match_live_audit_logs;
DELETE FROM public.match_live_events;
DELETE FROM public.match_live_states;
DELETE FROM public.canonical_permanent_results;
DELETE FROM public.finalization_commands;
DELETE FROM public.referee_working_sets;
DELETE FROM public.league_standings;
DELETE FROM public.team_form;
DELETE FROM public.player_stats;
DELETE FROM public.historical_standings;
DELETE FROM public.fixtures;

-- 2. RLS & PERMISSION ALIGNMENT FOR FIXTURES AND SCHEDULES
GRANT ALL ON TABLE public.fixtures TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.base_fixtures TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.matchday_schedules TO anon, authenticated, service_role, postgres;

DROP POLICY IF EXISTS "Admins and Presidents manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Allow manage fixtures" ON public.fixtures;
CREATE POLICY "Allow manage fixtures"
  ON public.fixtures FOR ALL USING (true) WITH CHECK (true);

-- 3. RESET SYSTEM SETTINGS SEASON MODE STATUS
UPDATE public.system_settings 
SET value = jsonb_build_object(
  'is_season_mode', false,
  'mode', 'PRE_SEASON',
  'fixtures_count', 0,
  'manual_override', false,
  'updated_at', NOW()
)
WHERE key = 'season_mode';
