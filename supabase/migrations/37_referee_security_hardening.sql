-- Migration 37: Unified Referee Security Hardening & Matchday Integrity
-- Description:
-- 1. All referees operate through a single, close-guarded referee dashboard.
-- 2. Referees authenticate via Supabase password login (role: 'referee').
-- 3. Individual referee UIDs are NOT used to restrict which match can be officiated or ended;
--    any authenticated referee can submit official end match results for matches on the active matchday.
-- 4. Replaces insecure Migration 33 (which allowed any 'authenticated' user) with strict role guards
--    ('referee', 'admin', 'president'). Fans, players, and coaches cannot alter fixtures.

-- 1. FIXTURES POLICIES
DROP POLICY IF EXISTS "Unified officials update fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Assigned referee or admin updates fixture" ON public.fixtures;
DROP POLICY IF EXISTS "Authenticated referee or admin updates fixture" ON public.fixtures;

CREATE POLICY "Authenticated referee or admin updates fixture"
  ON public.fixtures FOR UPDATE
  USING (
    public.get_auth_role() IN ('referee', 'admin', 'president')
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'admin', 'president')
  );

-- 2. MATCH REPORTS POLICIES
DROP POLICY IF EXISTS "Unified officials manage match reports" ON public.match_reports;
DROP POLICY IF EXISTS "Assigned referee manages match reports" ON public.match_reports;
DROP POLICY IF EXISTS "Authenticated referee manages match reports" ON public.match_reports;

CREATE POLICY "Authenticated referee manages match reports"
  ON public.match_reports FOR ALL
  USING (
    public.get_auth_role() IN ('referee', 'admin', 'president')
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'admin', 'president')
  );

-- 3. MATCH EVENTS POLICIES
DROP POLICY IF EXISTS "Unified officials insert match events" ON public.match_events;
DROP POLICY IF EXISTS "Assigned official or journalist inserts match events" ON public.match_events;
DROP POLICY IF EXISTS "Authenticated referee or journalist inserts match events" ON public.match_events;

CREATE POLICY "Authenticated referee or journalist inserts match events"
  ON public.match_events FOR ALL
  USING (
    public.get_auth_role() IN ('referee', 'admin', 'journalist', 'president')
  )
  WITH CHECK (
    public.get_auth_role() IN ('referee', 'admin', 'journalist', 'president')
  );
