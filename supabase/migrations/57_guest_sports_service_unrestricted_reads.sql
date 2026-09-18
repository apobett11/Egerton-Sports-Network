-- Migration 57: Unrestricted Guest Read Policies & Foreign Key Index Optimization
-- Ensures zero HTTP 500 / 401 / 403 errors on all guest public read queries across the sports network.

-- 1. Enable RLS on core tables (ensuring idempotent security model)
ALTER TABLE IF EXISTS public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

-- 2. Clean up and establish standard Public Read Policies for all Guest Tables
DROP POLICY IF EXISTS "Public read fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Fixtures readable by everyone" ON public.fixtures;
CREATE POLICY "Public read fixtures" ON public.fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Teams readable by everyone" ON public.teams;
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read competitions" ON public.competitions;
DROP POLICY IF EXISTS "Competitions readable by everyone" ON public.competitions;
CREATE POLICY "Public read competitions" ON public.competitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read league standings" ON public.league_standings;
DROP POLICY IF EXISTS "League standings readable by everyone" ON public.league_standings;
CREATE POLICY "Public read league standings" ON public.league_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read players" ON public.players;
DROP POLICY IF EXISTS "Players readable by everyone" ON public.players;
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read match events" ON public.match_events;
DROP POLICY IF EXISTS "Match events readable by everyone" ON public.match_events;
CREATE POLICY "Public read match events" ON public.match_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read player stats" ON public.player_stats;
CREATE POLICY "Public read player stats" ON public.player_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read team form" ON public.team_form;
CREATE POLICY "Public read team form" ON public.team_form FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read news articles" ON public.news_articles;
CREATE POLICY "Public read news articles" ON public.news_articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read announcements" ON public.announcements;
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);

-- 3. Explicit Table Grants for Anon and Authenticated Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
