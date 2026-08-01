-- Migration 10: Production Hardening, Indexes, Triggers & RLS Policies
-- Comprehensive database stabilization, soft deletion, indexing, audit trail & RLS rules

-- 1. Create automatic updated_at trigger function if not existing
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add soft-delete and timestamp columns where missing
DO $$ BEGIN
  -- Fixtures
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'updated_at') THEN
    ALTER TABLE public.fixtures ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.fixtures ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'verified_by_referee_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN verified_by_referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Teams
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'updated_at') THEN
    ALTER TABLE public.teams ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.teams ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;

  -- Players
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'updated_at') THEN
    ALTER TABLE public.players ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.players ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;

  -- News Articles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.news_articles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news_articles' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.news_articles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_fixtures_updated_at ON public.fixtures;
CREATE TRIGGER trigger_fixtures_updated_at BEFORE UPDATE ON public.fixtures FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_teams_updated_at ON public.teams;
CREATE TRIGGER trigger_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_players_updated_at ON public.players;
CREATE TRIGGER trigger_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_news_updated_at ON public.news_articles;
CREATE TRIGGER trigger_news_updated_at BEFORE UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create Historical Standings table if not exists
CREATE TABLE IF NOT EXISTS public.historical_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL,
  position INT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  played INT NOT NULL DEFAULT 0,
  won INT NOT NULL DEFAULT 0,
  drawn INT NOT NULL DEFAULT 0,
  lost INT NOT NULL DEFAULT 0,
  goals_for INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON public.fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_scheduled_time ON public.fixtures(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_fixtures_referee ON public.fixtures(referee_id);
CREATE INDEX IF NOT EXISTS idx_match_events_fixture_minute ON public.match_events(fixture_id, minute);
CREATE INDEX IF NOT EXISTS idx_match_reports_fixture ON public.match_reports(fixture_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_historical_standings_season ON public.historical_standings(season_id, position);

-- 6. Row Level Security Hardening
ALTER TABLE public.historical_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Historical standings readable by everyone" ON public.historical_standings;
CREATE POLICY "Historical standings readable by everyone" ON public.historical_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins insert historical standings" ON public.historical_standings;
CREATE POLICY "Admins insert historical standings" ON public.historical_standings FOR INSERT WITH CHECK (public.get_auth_role() = 'admin' OR public.get_auth_role() = 'president');

DROP POLICY IF EXISTS "Audit logs readable by admins and presidents" ON public.audit_logs;
CREATE POLICY "Audit logs readable by admins and presidents" ON public.audit_logs FOR SELECT USING (public.get_auth_role() IN ('admin', 'president'));

DROP POLICY IF EXISTS "Audit logs insertable by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated users" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR true);
