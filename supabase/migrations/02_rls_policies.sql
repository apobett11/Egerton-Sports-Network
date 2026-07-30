-- Migration 02: Row Level Security Policies
-- Strict least-privilege security posture across all application tables

-- Helper function to retrieve the authenticated user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN
    RETURN 'guest'::user_role;
  END IF;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------
-- PROFILES POLICIES
-------------------------------------------------------
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins full manage profiles"
  ON public.profiles FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- COMPETITIONS POLICIES
-------------------------------------------------------
CREATE POLICY "Competitions readable by everyone"
  ON public.competitions FOR SELECT USING (true);

CREATE POLICY "Admins manage competitions"
  ON public.competitions FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- CLUBS POLICIES
-------------------------------------------------------
CREATE POLICY "Clubs readable by everyone"
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "Presidents update own club"
  ON public.clubs FOR UPDATE USING (
    president_id = auth.uid() OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Admins manage clubs"
  ON public.clubs FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- TEAMS POLICIES
-------------------------------------------------------
CREATE POLICY "Teams readable by everyone"
  ON public.teams FOR SELECT USING (true);

CREATE POLICY "Admins manage teams"
  ON public.teams FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- PLAYERS POLICIES
-------------------------------------------------------
CREATE POLICY "Players readable by everyone"
  ON public.players FOR SELECT USING (true);

CREATE POLICY "Players update own record"
  ON public.players FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins manage players"
  ON public.players FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- FIXTURES POLICIES
-------------------------------------------------------
CREATE POLICY "Fixtures readable by everyone"
  ON public.fixtures FOR SELECT USING (true);

CREATE POLICY "Referees update assigned fixtures"
  ON public.fixtures FOR UPDATE USING (
    referee_id = auth.uid() OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Admins manage fixtures"
  ON public.fixtures FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- MATCH EVENTS POLICIES
-------------------------------------------------------
CREATE POLICY "Match events readable by everyone"
  ON public.match_events FOR SELECT USING (true);

CREATE POLICY "Officials or admins insert match events"
  ON public.match_events FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('referee', 'linesman', 'admin')
  );

CREATE POLICY "Admins manage match events"
  ON public.match_events FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- MATCH LINEUPS POLICIES
-------------------------------------------------------
CREATE POLICY "Match lineups readable by everyone"
  ON public.match_lineups FOR SELECT USING (true);

CREATE POLICY "Coaches & Captains insert match lineups"
  ON public.match_lineups FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('coach', 'captain', 'admin')
  );

CREATE POLICY "Admins manage match lineups"
  ON public.match_lineups FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- MATCH REPORTS POLICIES
-------------------------------------------------------
CREATE POLICY "Officials read own reports"
  ON public.match_reports FOR SELECT USING (
    official_id = auth.uid() OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Officials create match reports"
  ON public.match_reports FOR INSERT WITH CHECK (
    official_id = auth.uid() AND public.get_auth_role() IN ('referee', 'linesman', 'admin')
  );

CREATE POLICY "Admins manage match reports"
  ON public.match_reports FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- NEWS ARTICLES POLICIES
-------------------------------------------------------
CREATE POLICY "Published news readable by everyone"
  ON public.news_articles FOR SELECT USING (
    status = 'published' OR author_id = auth.uid() OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Journalists insert/update own articles"
  ON public.news_articles FOR INSERT WITH CHECK (
    author_id = auth.uid() AND public.get_auth_role() IN ('journalist', 'admin')
  );

CREATE POLICY "Journalists update own articles"
  ON public.news_articles FOR UPDATE USING (
    author_id = auth.uid() OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Admins manage news articles"
  ON public.news_articles FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- ANNOUNCEMENTS POLICIES
-------------------------------------------------------
CREATE POLICY "Announcements readable by target audience"
  ON public.announcements FOR SELECT USING (
    target_role = 'all' OR auth.uid() IS NOT NULL OR public.get_auth_role() = 'admin'
  );

CREATE POLICY "Presidents, Coaches, Captains & Admins create announcements"
  ON public.announcements FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('president', 'coach', 'captain', 'admin')
  );

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- SQUAD REQUESTS POLICIES
-------------------------------------------------------
CREATE POLICY "Squad requests readable by team leads or admins"
  ON public.squad_requests FOR SELECT USING (
    requester_id = auth.uid() OR public.get_auth_role() IN ('coach', 'captain', 'admin')
  );

CREATE POLICY "Captains and coaches insert squad requests"
  ON public.squad_requests FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('captain', 'coach', 'admin')
  );

CREATE POLICY "Admins manage squad requests"
  ON public.squad_requests FOR ALL USING (public.get_auth_role() = 'admin');

-------------------------------------------------------
-- SQUAD CONFIGURATIONS POLICIES
-------------------------------------------------------
CREATE POLICY "Squad configurations readable by authenticated users"
  ON public.squad_configurations FOR SELECT USING (true);

CREATE POLICY "Coaches & Captains manage squad configurations"
  ON public.squad_configurations FOR ALL USING (
    public.get_auth_role() IN ('coach', 'captain', 'admin')
  );

-------------------------------------------------------
-- AUDIT LOGS POLICIES
-------------------------------------------------------
CREATE POLICY "Admins read audit logs"
  ON public.audit_logs FOR SELECT USING (public.get_auth_role() = 'admin');

CREATE POLICY "Authenticated users insert audit logs"
  ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-------------------------------------------------------
-- SYSTEM SETTINGS POLICIES
-------------------------------------------------------
CREATE POLICY "System settings readable by everyone"
  ON public.system_settings FOR SELECT USING (true);

CREATE POLICY "Admins manage system settings"
  ON public.system_settings FOR ALL USING (public.get_auth_role() = 'admin');
