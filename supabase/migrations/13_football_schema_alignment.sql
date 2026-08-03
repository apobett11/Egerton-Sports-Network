-- Migration 13: Football Schema Alignment & RPC Functions for Guest Engine
-- Extends football tables with missing official IDs, match metadata, penalty scores, and lineup captain notes.

-- 1. Extend public.fixtures table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'assistant_referee_1_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN assistant_referee_1_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'assistant_referee_2_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN assistant_referee_2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'fourth_official_id') THEN
    ALTER TABLE public.fixtures ADD COLUMN fourth_official_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'attendance') THEN
    ALTER TABLE public.fixtures ADD COLUMN attendance INT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'weather') THEN
    ALTER TABLE public.fixtures ADD COLUMN weather TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'added_time') THEN
    ALTER TABLE public.fixtures ADD COLUMN added_time INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'home_penalty_score') THEN
    ALTER TABLE public.fixtures ADD COLUMN home_penalty_score INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'away_penalty_score') THEN
    ALTER TABLE public.fixtures ADD COLUMN away_penalty_score INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name = 'referee_verification_status') THEN
    ALTER TABLE public.fixtures ADD COLUMN referee_verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (referee_verification_status IN ('UNVERIFIED', 'VERIFIED', 'OVERRIDDEN'));
  END IF;
END $$;

-- 2. Extend public.match_lineups table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_lineups' AND column_name = 'captain_id') THEN
    ALTER TABLE public.match_lineups ADD COLUMN captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_lineups' AND column_name = 'vice_captain_id') THEN
    ALTER TABLE public.match_lineups ADD COLUMN vice_captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_lineups' AND column_name = 'captain_notes') THEN
    ALTER TABLE public.match_lineups ADD COLUMN captain_notes TEXT;
  END IF;
END $$;

-- 3. RPC Function: get_league_standings (returns calculated table based on completed fixtures)
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
    WHERE (p_competition_id IS NULL OR f.competition_id = p_competition_id)
      AND f.status = 'FT'
      AND f.deleted_at IS NULL

    UNION ALL

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
    WHERE (p_competition_id IS NULL OR f.competition_id = p_competition_id)
      AND f.status = 'FT'
      AND f.deleted_at IS NULL
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
    WHERE (p_competition_id IS NULL OR t.competition_id = p_competition_id)
      AND t.deleted_at IS NULL
    GROUP BY t.id, t.name, t.logo_url
  )
  SELECT 
    ROW_NUMBER() OVER (
      ORDER BY 
        ast.points DESC, 
        ast.goal_difference DESC, 
        ast.goals_for DESC,
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

-- 4. RPC Function: get_top_scorers (aggregated from match_events)
CREATE OR REPLACE FUNCTION public.get_top_scorers(p_competition_id UUID DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  jersey_number INT,
  "position" TEXT,
  team_id UUID,
  team_name TEXT,
  team_logo TEXT,
  goals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS player_id,
    (pr.first_name || ' ' || pr.last_name) AS player_name,
    p.jersey_number,
    p.position,
    t.id AS team_id,
    t.name AS team_name,
    t.logo_url AS team_logo,
    COUNT(me.id) AS goals
  FROM public.match_events me
  JOIN public.players p ON me.player_id = p.id
  JOIN public.profiles pr ON p.profile_id = pr.id
  JOIN public.teams t ON p.team_id = t.id
  JOIN public.fixtures f ON me.fixture_id = f.id
  WHERE me.type IN ('goal', 'penalty')
    AND (p_competition_id IS NULL OR f.competition_id = p_competition_id)
    AND f.deleted_at IS NULL
  GROUP BY p.id, pr.first_name, pr.last_name, p.jersey_number, p.position, t.id, t.name, t.logo_url
  ORDER BY goals DESC, player_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
