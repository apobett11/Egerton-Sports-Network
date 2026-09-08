-- Migration 35: Align Coach Exclusive Team Dashboard Authority
-- Description: Unifies team dashboard management exclusively under Head Coach (coach_id).
-- The captain role is preserved in the database (as an in-squad player position and lineup designation),
-- but all administrative RLS policies for managing teams, lineups, squad configurations,
-- and requests are revoked for captains and granted exclusively to coaches and administrators.

-- 1. Teams Table Management: Head Coach Authority Exclusive
DROP POLICY IF EXISTS "Coach and Captain update team configurations" ON public.teams;
DROP POLICY IF EXISTS "Coach updates team configurations" ON public.teams;

CREATE POLICY "Coach updates team configurations"
  ON public.teams FOR UPDATE
  USING (
    coach_id = auth.uid()
    OR public.get_auth_role() IN ('admin', 'president', 'coach')
  );

-- 2. Match Lineups: Head Coach Authority Exclusive
DROP POLICY IF EXISTS "Coaches & Captains insert match lineups" ON public.match_lineups;
DROP POLICY IF EXISTS "Coach inserts match lineups" ON public.match_lineups;

CREATE POLICY "Coach inserts match lineups"
  ON public.match_lineups FOR INSERT WITH CHECK (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coach updates match lineups" ON public.match_lineups;
CREATE POLICY "Coach updates match lineups"
  ON public.match_lineups FOR UPDATE USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

-- 3. Squad Configurations: Head Coach Authority Exclusive
DROP POLICY IF EXISTS "Coaches & Captains manage squad configurations" ON public.squad_configurations;
DROP POLICY IF EXISTS "Coach manages squad configurations" ON public.squad_configurations;

CREATE POLICY "Coach manages squad configurations"
  ON public.squad_configurations FOR ALL USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

-- 4. Squad Requests: Head Coach Authority Exclusive
DROP POLICY IF EXISTS "Captains and coaches insert squad requests" ON public.squad_requests;
DROP POLICY IF EXISTS "Coach inserts squad requests" ON public.squad_requests;

CREATE POLICY "Coach inserts squad requests"
  ON public.squad_requests FOR INSERT WITH CHECK (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coach views squad requests" ON public.squad_requests;
CREATE POLICY "Coach views squad requests"
  ON public.squad_requests FOR SELECT USING (
    public.get_auth_role() IN ('admin', 'president', 'coach') OR requester_id = auth.uid()
  );

-- 5. Announcements / Articles Publishing: Ensure Coach Authority
DROP POLICY IF EXISTS "Presidents, Coaches, Captains & Admins create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Presidents, Coaches & Admins create announcements" ON public.announcements;

CREATE POLICY "Presidents, Coaches & Admins create announcements"
  ON public.announcements FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('president', 'coach', 'admin')
  );
