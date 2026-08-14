-- Migration 18: Team Dashboard Schema Alignment, Role Separation, First 11/Subs Strings, and Tactical Configurations

-- 1. Ensure required columns on teams table
DO $$ BEGIN
  -- starting_xi_str
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'starting_xi_str') THEN
    ALTER TABLE public.teams ADD COLUMN starting_xi_str TEXT;
  END IF;

  -- substitutes_str
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'substitutes_str') THEN
    ALTER TABLE public.teams ADD COLUMN substitutes_str TEXT;
  END IF;

  -- temporary_match_squad
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'temporary_match_squad') THEN
    ALTER TABLE public.teams ADD COLUMN temporary_match_squad JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- tactics_config
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'tactics_config') THEN
    ALTER TABLE public.teams ADD COLUMN tactics_config JSONB DEFAULT '{
      "formation": "4-3-3 Attack",
      "attackingDepth": 55,
      "defensiveLineHeight": 65,
      "teamSupportWidth": 60,
      "pressingIntensity": 75,
      "buildUpStyle": "Short Pass"
    }'::jsonb;
  END IF;

  -- kits_config
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'kits_config') THEN
    ALTER TABLE public.teams ADD COLUMN kits_config JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- coach_id & captain_id check
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'coach_id') THEN
    ALTER TABLE public.teams ADD COLUMN coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'captain_id') THEN
    ALTER TABLE public.teams ADD COLUMN captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Indexes for Team Queries
CREATE INDEX IF NOT EXISTS idx_teams_coach ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain ON public.teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_away_team ON public.fixtures(home_team_id, away_team_id);

-- 3. Row Level Security for Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams"
  ON public.teams FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Coach and Captain update team configurations" ON public.teams;
CREATE POLICY "Coach and Captain update team configurations"
  ON public.teams FOR UPDATE
  USING (
    coach_id = auth.uid()
    OR captain_id = auth.uid()
    OR public.get_auth_role() IN ('admin', 'president', 'coach', 'captain')
  );

-- 4. Enable Realtime on Teams Table
ALTER TABLE public.teams REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
