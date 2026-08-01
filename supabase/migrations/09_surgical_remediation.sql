-- Migration 09: Surgical Business Logic & RLS Remediation
-- 1. Fix Cross-Team Lineup & Tactical Scoping (RLS Security Hole)
-- 2. Add missing schema columns to prevent runtime database SQL errors
-- 3. Create seasons table for pre-season management

-- 1. RLS Policy Fixes for Team Scoping
DROP POLICY IF EXISTS "Coaches & Captains insert match lineups" ON public.match_lineups;
CREATE POLICY "Coaches & Captains insert match lineups"
  ON public.match_lineups FOR INSERT WITH CHECK (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND (t.coach_id = auth.uid() OR t.captain_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches & Captains manage squad configurations" ON public.squad_configurations;
CREATE POLICY "Coaches & Captains manage squad configurations"
  ON public.squad_configurations FOR ALL USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND (t.coach_id = auth.uid() OR t.captain_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Captains and coaches insert squad requests" ON public.squad_requests;
CREATE POLICY "Captains and coaches insert squad requests"
  ON public.squad_requests FOR INSERT WITH CHECK (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND (t.coach_id = auth.uid() OR t.captain_id = auth.uid())
    )
  );

-- 2. Add missing schema columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixtures' AND column_name = 'assignment_status'
  ) THEN
    ALTER TABLE public.fixtures ADD COLUMN assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN ('pending', 'accepted', 'rejected'));
  END IF;
END $$;

-- 3. Create seasons table for pre-season management
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  registration_cutoff DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seasons readable by everyone" ON public.seasons;
CREATE POLICY "Seasons readable by everyone"
  ON public.seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage seasons" ON public.seasons;
CREATE POLICY "Admins manage seasons"
  ON public.seasons FOR ALL USING (public.get_auth_role() = 'admin');
