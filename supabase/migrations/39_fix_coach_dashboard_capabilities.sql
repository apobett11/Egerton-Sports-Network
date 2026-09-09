-- Migration 39: Fix Coach Dashboard Capabilities, Schema Alignment, and Permissions
-- 1. Extend public.teams table with missing operational columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'description') THEN
    ALTER TABLE public.teams ADD COLUMN description TEXT DEFAULT 'Official high-performance university varsity squad competing in the Premier Division.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'primary_color') THEN
    ALTER TABLE public.teams ADD COLUMN primary_color TEXT DEFAULT '#D4AF37';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'secondary_color') THEN
    ALTER TABLE public.teams ADD COLUMN secondary_color TEXT DEFAULT '#1E293B';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'accent_color') THEN
    ALTER TABLE public.teams ADD COLUMN accent_color TEXT DEFAULT '#FFFFFF';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'stadium') THEN
    ALTER TABLE public.teams ADD COLUMN stadium TEXT DEFAULT 'Egerton Main Pavilion Arena';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'practice_schedule') THEN
    ALTER TABLE public.teams ADD COLUMN practice_schedule JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Extend public.players with availability status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'status') THEN
    ALTER TABLE public.players ADD COLUMN status TEXT DEFAULT 'Fit';
  END IF;
END $$;

-- 3. RLS: Allow Coaches to update player availability status for their own team
DROP POLICY IF EXISTS "Coach updates own team players" ON public.players;
CREATE POLICY "Coach updates own team players"
  ON public.players FOR UPDATE
  USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

-- 4. RLS: Allow Coaches to update match lineups for their own team
DROP POLICY IF EXISTS "Coach updates match lineups" ON public.match_lineups;
CREATE POLICY "Coach updates match lineups"
  ON public.match_lineups FOR UPDATE
  USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

-- 5. Link coach@egerton.ac.ke to Egerton FC First Team
DO $$ 
DECLARE
  v_coach_uid UUID;
BEGIN
  SELECT id INTO v_coach_uid FROM auth.users WHERE LOWER(email) = 'coach@egerton.ac.ke' LIMIT 1;
  IF v_coach_uid IS NOT NULL THEN
    UPDATE public.teams
    SET coach_id = v_coach_uid
    WHERE id = '66666666-6666-6666-6666-666666666666';
  END IF;
END $$;

-- 6. Ensure default practice sessions exist if empty
UPDATE public.teams
SET practice_schedule = '[
  {"id": "ps_1", "day": "Tuesday", "time": "16:00 - 18:00", "location": "Pavilion Main Stadium", "activity": "Gegenpressing & Defensive Shape", "assignedBy": "Coach Marcus", "coachApproved": true, "intensity": "High", "focusArea": "Tactical"},
  {"id": "ps_2", "day": "Wednesday", "time": "16:30 - 18:00", "location": "Field B Drill Ground", "activity": "Rondo Passing & Ball Retention", "assignedBy": "Coach Marcus", "coachApproved": true, "intensity": "Medium", "focusArea": "Passing"},
  {"id": "ps_3", "day": "Friday", "time": "15:00 - 17:00", "location": "Pavilion Main Stadium", "activity": "Tactical Positioning & Set-Piece Routines", "assignedBy": "Coach Marcus", "coachApproved": false, "intensity": "High", "focusArea": "Set-Pieces"}
]'::jsonb
WHERE (practice_schedule IS NULL OR practice_schedule = '[]'::jsonb)
  AND id = '66666666-6666-6666-6666-666666666666';
