-- Migration 07: Official Referee Verification & Journalist Live Media Separation
-- Ensures Journalist media events stay isolated from official match statistics and standings.
-- Enforces strict Assigned Referee authority for official match result verification.

-- 1. Add is_official column to match_events if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_events' AND column_name = 'is_official'
  ) THEN
    ALTER TABLE public.match_events ADD COLUMN is_official BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Add verified_by_referee_id column to fixtures if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixtures' AND column_name = 'verified_by_referee_id'
  ) THEN
    ALTER TABLE public.fixtures ADD COLUMN verified_by_referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Strict RLS Policy: Only assigned Referee or Admin can verify official match results
DROP POLICY IF EXISTS "Only assigned referee or admin updates official match result" ON public.fixtures;

CREATE POLICY "Only assigned referee or admin updates official match result"
  ON public.fixtures FOR UPDATE USING (
    -- Admin override or Assigned Referee validation
    public.get_auth_role() = 'admin' OR (
      public.get_auth_role() IN ('referee', 'linesman') AND referee_id = auth.uid()
    )
  );

-- 4. Update get_league_standings RPC function to aggregate ONLY official referee-verified match results
CREATE OR REPLACE FUNCTION public.get_league_standings(p_competition_id UUID)
RETURNS TABLE (
  position INT,
  team_id UUID,
  team_name TEXT,
  team_logo TEXT,
  played BIGINT,
  won BIGINT,
  drawn BIGINT,
  lost BIGINT,
  goals_for BIGINT,
  goals_against BIGINT,
  goal_difference BIGINT,
  points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH team_matches AS (
    -- Collect home match statistics for official referee-verified fixtures
    SELECT 
      f.home_team_id AS tid,
      1 AS p,
      CASE WHEN f.score_home > f.score_away THEN 1 ELSE 0 END AS w,
      CASE WHEN f.score_home = f.score_away THEN 1 ELSE 0 END AS d,
      CASE WHEN f.score_home < f.score_away THEN 1 ELSE 0 END AS l,
      f.score_home AS gf,
      f.score_away AS ga,
      CASE 
        WHEN f.score_home > f.score_away THEN 3 
        WHEN f.score_home = f.score_away THEN 1 
        ELSE 0 
      END AS pts
    FROM public.fixtures f
    WHERE f.competition_id = p_competition_id 
      AND f.status = 'FT'
      AND (f.referee_verification_status = 'VERIFIED' OR f.referee_verification_status = 'OVERRIDDEN')

    UNION ALL

    -- Collect away match statistics for official referee-verified fixtures
    SELECT 
      f.away_team_id AS tid,
      1 AS p,
      CASE WHEN f.score_away > f.score_home THEN 1 ELSE 0 END AS w,
      CASE WHEN f.score_away = f.score_home THEN 1 ELSE 0 END AS d,
      CASE WHEN f.score_away < f.score_home THEN 1 ELSE 0 END AS l,
      f.score_away AS gf,
      f.score_home AS ga,
      CASE 
        WHEN f.score_away > f.score_home THEN 3 
        WHEN f.score_away = f.score_home THEN 1 
        ELSE 0 
      END AS pts
    FROM public.fixtures f
    WHERE f.competition_id = p_competition_id 
      AND f.status = 'FT'
      AND (f.referee_verification_status = 'VERIFIED' OR f.referee_verification_status = 'OVERRIDDEN')
  ),
  aggregated_stats AS (
    SELECT 
      t.id AS team_id,
      t.name AS team_name,
      t.logo_url AS team_logo,
      COALESCE(SUM(tm.p), 0) AS played,
      COALESCE(SUM(tm.w), 0) AS won,
      COALESCE(SUM(tm.d), 0) AS drawn,
      COALESCE(SUM(tm.l), 0) AS lost,
      COALESCE(SUM(tm.gf), 0) AS goals_for,
      COALESCE(SUM(tm.ga), 0) AS goals_against,
      COALESCE(SUM(tm.gf) - SUM(tm.ga), 0) AS goal_difference,
      COALESCE(SUM(tm.pts), 0) AS points
    FROM public.teams t
    LEFT JOIN team_matches tm ON t.id = tm.tid
    WHERE t.competition_id = p_competition_id
    GROUP BY t.id, t.name, t.logo_url
  )
  SELECT 
    ROW_NUMBER() OVER (
      ORDER BY 
        ast.points DESC, 
        ast.goal_difference DESC, 
        ast.team_name ASC
    )::INT AS position,
    ast.team_id,
    ast.team_name,
    ast.team_logo,
    ast.played,
    ast.won,
    ast.drawn,
    ast.lost,
    ast.goals_for,
    ast.goals_against,
    ast.goal_difference,
    ast.points
  FROM aggregated_stats ast
  ORDER BY position ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
