-- 1. Historical Standings Table for Archived Seasons
CREATE TABLE IF NOT EXISTS public.historical_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_logo TEXT,
  position INT NOT NULL,
  played INT NOT NULL DEFAULT 0,
  won INT NOT NULL DEFAULT 0,
  drawn INT NOT NULL DEFAULT 0,
  lost INT NOT NULL DEFAULT 0,
  goals_for INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(season_id, competition_id, team_id)
);

-- 2. Indexes for Fast Standings Lookups
CREATE INDEX IF NOT EXISTS idx_historical_standings_season ON public.historical_standings(season_id, competition_id);
CREATE INDEX IF NOT EXISTS idx_historical_standings_position ON public.historical_standings(position);

-- 3. PostgreSQL Computed Standings RPC Function
-- Computes real-time standings directly from finalized fixtures (status = 'FT')
CREATE OR REPLACE FUNCTION public.get_league_standings(p_competition_id UUID)
RETURNS TABLE (
  "position" INT,
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
    -- Collect home match statistics for finalized fixtures
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
    WHERE f.competition_id = p_competition_id AND f.status = 'FT'

    UNION ALL

    -- Collect away match statistics for finalized fixtures
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
    WHERE f.competition_id = p_competition_id AND f.status = 'FT'
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

-- 4. RLS Security Policies for Historical Standings
ALTER TABLE public.historical_standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Historical standings readable by everyone" ON public.historical_standings;
CREATE POLICY "Historical standings readable by everyone"
  ON public.historical_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage historical standings" ON public.historical_standings;
CREATE POLICY "Admins manage historical standings"
  ON public.historical_standings FOR ALL USING (public.get_auth_role() = 'admin');

-- 5. Realtime Publication
ALTER TABLE public.historical_standings REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_standings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
