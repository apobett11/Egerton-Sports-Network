-- Migration 12: President RLS Alignment & Authorization Hardening
-- Grant President role strict least-privilege permissions for seasons, competitions, team approvals, and announcements

-- 1. Seasons Table Policies for President
DROP POLICY IF EXISTS "Admins manage seasons" ON public.seasons;
DROP POLICY IF EXISTS "Admins and Presidents manage seasons" ON public.seasons;
CREATE POLICY "Admins and Presidents manage seasons"
  ON public.seasons FOR ALL USING (
    public.get_auth_role() IN ('admin', 'president')
  );

-- 2. Competitions / Leagues Table Policies for President
DROP POLICY IF EXISTS "Admins manage competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins and Presidents manage competitions" ON public.competitions;
CREATE POLICY "Admins and Presidents manage competitions"
  ON public.competitions FOR ALL USING (
    public.get_auth_role() IN ('admin', 'president')
  );

-- 3. Teams Table Policies for President Approvals
DROP POLICY IF EXISTS "Presidents and Admins update teams" ON public.teams;
CREATE POLICY "Presidents and Admins update teams"
  ON public.teams FOR UPDATE USING (
    public.get_auth_role() IN ('admin', 'president')
  );
