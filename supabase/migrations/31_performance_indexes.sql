-- Migration 31: High-Performance Database Indexes
-- Strictly adds non-destructive B-tree indexes for rapid query filtering and sorting without modifying tables, data, functions, or RLS.

-- 1. Fixtures Indexes
CREATE INDEX IF NOT EXISTS idx_fixtures_scheduled_time 
  ON public.fixtures (scheduled_time);

CREATE INDEX IF NOT EXISTS idx_fixtures_comp_scheduled 
  ON public.fixtures (competition_id, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_fixtures_status_scheduled 
  ON public.fixtures (status, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_fixtures_home_team 
  ON public.fixtures (home_team_id);

CREATE INDEX IF NOT EXISTS idx_fixtures_away_team 
  ON public.fixtures (away_team_id);

CREATE INDEX IF NOT EXISTS idx_fixtures_referee 
  ON public.fixtures (referee_id);

CREATE INDEX IF NOT EXISTS idx_fixtures_assignment 
  ON public.fixtures (assignment_status);

-- 2. Match Events & Lineups Indexes
CREATE INDEX IF NOT EXISTS idx_match_events_fixture_minute 
  ON public.match_events (fixture_id, minute);

CREATE INDEX IF NOT EXISTS idx_match_events_player 
  ON public.match_events (player_id);

CREATE INDEX IF NOT EXISTS idx_match_events_team 
  ON public.match_events (team_id);

CREATE INDEX IF NOT EXISTS idx_match_lineups_fixture_team 
  ON public.match_lineups (fixture_id, team_id);

-- 3. News Articles Indexes
CREATE INDEX IF NOT EXISTS idx_news_status_published 
  ON public.news_articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_category_published 
  ON public.news_articles (category, published_at DESC) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_news_author 
  ON public.news_articles (author_id);

-- 4. Announcements Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created 
  ON public.announcements (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_target_role 
  ON public.announcements (target_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_target_team 
  ON public.announcements (target_team_id, created_at DESC);

-- 5. Teams & Players Indexes
CREATE INDEX IF NOT EXISTS idx_teams_competition 
  ON public.teams (competition_id);

CREATE INDEX IF NOT EXISTS idx_teams_status 
  ON public.teams (status);

CREATE INDEX IF NOT EXISTS idx_players_team 
  ON public.players (team_id);

CREATE INDEX IF NOT EXISTS idx_players_profile 
  ON public.players (profile_id);

CREATE INDEX IF NOT EXISTS idx_players_position 
  ON public.players (position);

-- 6. Player Stats & Clean Sheets
DO  BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_stats') THEN
    CREATE INDEX IF NOT EXISTS idx_player_stats_fixture_player 
      ON public.player_stats (fixture_id, player_id);
    CREATE INDEX IF NOT EXISTS idx_player_stats_clean_sheets 
      ON public.player_stats (clean_sheets DESC) 
      WHERE clean_sheets > 0;
  END IF;
END ;

-- 7. System Audit Logs & Reports
CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
  ON public.audit_logs (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_match_reports_fixture 
  ON public.match_reports (fixture_id);

-- 8. Anonymous Devices (if table exists)
DO  BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anonymous_devices') THEN
    CREATE INDEX IF NOT EXISTS idx_anon_devices_device_id 
      ON public.anonymous_devices (device_id);
  END IF;
END ;
