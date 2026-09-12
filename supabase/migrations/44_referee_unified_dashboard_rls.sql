-- Migration 33: Unified Referee Dashboard RLS Alignment
-- Disables referee-specific UID restrictions on match updates, match reports, and match events.
-- Allows any authenticated match official (referee, linesman, admin) to update any fixture,
-- verify official match results, and commit reports.

-- 1. FIXTURES POLICIES
DROP POLICY IF EXISTS "Only assigned referee or admin updates official match result" ON public.fixtures;
DROP POLICY IF EXISTS "Referees update assigned fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Journalists, referees update assigned fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Unified officials update fixtures" ON public.fixtures;

CREATE POLICY "Unified officials update fixtures"
  ON public.fixtures FOR UPDATE
  USING (
    public.get_auth_role() IN ('referee', 'linesman', 'admin', 'journalist')
    OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'linesman', 'admin', 'journalist')
    OR auth.role() = 'authenticated'
  );

-- 2. MATCH REPORTS POLICIES
DROP POLICY IF EXISTS "Officials create match reports" ON public.match_reports;
DROP POLICY IF EXISTS "Officials read own reports" ON public.match_reports;
DROP POLICY IF EXISTS "Unified officials manage match reports" ON public.match_reports;

CREATE POLICY "Unified officials manage match reports"
  ON public.match_reports FOR ALL
  USING (
    public.get_auth_role() IN ('referee', 'linesman', 'admin')
    OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'linesman', 'admin')
    OR auth.role() = 'authenticated'
  );

-- 3. MATCH EVENTS POLICIES
DROP POLICY IF EXISTS "Officials or admins insert match events" ON public.match_events;
DROP POLICY IF EXISTS "Unified officials insert match events" ON public.match_events;

CREATE POLICY "Unified officials insert match events"
  ON public.match_events FOR ALL
  USING (
    public.get_auth_role() IN ('referee', 'linesman', 'admin', 'journalist')
    OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'linesman', 'admin', 'journalist')
    OR auth.role() = 'authenticated'
  );

-- 4. GRANTS
GRANT ALL ON TABLE public.fixtures TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.match_reports TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.match_events TO authenticated, anon, service_role;
