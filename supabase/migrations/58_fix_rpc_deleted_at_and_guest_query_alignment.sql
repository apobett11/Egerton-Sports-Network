-- Migration 58: Fix get_league_standings and get_top_scorers RPC 500 errors
-- Root cause: functions reference f.deleted_at / t.deleted_at which do NOT exist.
-- Must DROP and recreate because return type column name changes (position -> "position").

-- Drop old versions (handles any existing signature variants)
DROP FUNCTION IF EXISTS public.get_league_standings(UUID);
DROP FUNCTION IF EXISTS public.get_top_scorers(UUID, INT);

CREATE FUNCTION public.get_league_standings(p_competition_id UUID DEFAULT NULL)
RETURNS TABLE (
  "position" INT, team_id UUID, team_name TEXT, team_logo TEXT,
  played BIGINT, won BIGINT, drawn BIGINT, lost BIGINT,
  goals_for BIGINT, goals_against BIGINT, goal_difference BIGINT, points BIGINT
) AS $func$
BEGIN
  RETURN QUERY
  WITH team_matches AS (
    SELECT f.home_team_id AS tid, 1 AS p,
      CASE WHEN f.score_home > f.score_away THEN 1 ELSE 0 END AS w,
      CASE WHEN f.score_home = f.score_away THEN 1 ELSE 0 END AS d,
      CASE WHEN f.score_home < f.score_away THEN 1 ELSE 0 END AS l,
      f.score_home AS gf, f.score_away AS ga,
      CASE WHEN f.score_home > f.score_away THEN 3 WHEN f.score_home = f.score_away THEN 1 ELSE 0 END AS pts
    FROM public.fixtures f
    WHERE (p_competition_id IS NULL OR f.competition_id = p_competition_id) AND f.status = 'FT'
    UNION ALL
    SELECT f.away_team_id AS tid, 1 AS p,
      CASE WHEN f.score_away > f.score_home THEN 1 ELSE 0 END AS w,
      CASE WHEN f.score_away = f.score_home THEN 1 ELSE 0 END AS d,
      CASE WHEN f.score_away < f.score_home THEN 1 ELSE 0 END AS l,
      f.score_away AS gf, f.score_home AS ga,
      CASE WHEN f.score_away > f.score_home THEN 3 WHEN f.score_away = f.score_home THEN 1 ELSE 0 END AS pts
    FROM public.fixtures f
    WHERE (p_competition_id IS NULL OR f.competition_id = p_competition_id) AND f.status = 'FT'
  ),
  agg AS (
    SELECT t.id AS team_id, t.name AS team_name, t.logo_url AS team_logo,
      COALESCE(SUM(tm.p),0) AS played, COALESCE(SUM(tm.w),0) AS won,
      COALESCE(SUM(tm.d),0) AS drawn, COALESCE(SUM(tm.l),0) AS lost,
      COALESCE(SUM(tm.gf),0) AS goals_for, COALESCE(SUM(tm.ga),0) AS goals_against,
      COALESCE(SUM(tm.gf)-SUM(tm.ga),0) AS goal_difference, COALESCE(SUM(tm.pts),0) AS points
    FROM public.teams t
    LEFT JOIN team_matches tm ON t.id = tm.tid
    WHERE (p_competition_id IS NULL OR t.competition_id = p_competition_id)
    GROUP BY t.id, t.name, t.logo_url
  )
  SELECT ROW_NUMBER() OVER (ORDER BY agg.points DESC, agg.goal_difference DESC, agg.goals_for DESC, agg.team_name ASC)::INT,
    agg.team_id, agg.team_name, agg.team_logo, agg.played, agg.won, agg.drawn, agg.lost,
    agg.goals_for, agg.goals_against, agg.goal_difference, agg.points
  FROM agg ORDER BY 1;
END;
$func$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_league_standings(UUID) TO anon, authenticated;

CREATE FUNCTION public.get_top_scorers(p_competition_id UUID DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (
  player_id UUID, player_name TEXT, jersey_number INT, "position" TEXT,
  team_id UUID, team_name TEXT, team_logo TEXT, goals BIGINT
) AS $func$
BEGIN
  RETURN QUERY
  SELECT p.id,
    COALESCE(NULLIF(TRIM(COALESCE(pr.first_name,'')||' '||COALESCE(pr.last_name,'')),''),'Player'),
    p.jersey_number, p.position, t.id, t.name, t.logo_url, COUNT(me.id)
  FROM public.match_events me
  JOIN public.players p ON me.player_id = p.id
  JOIN public.profiles pr ON p.profile_id = pr.id
  JOIN public.teams t ON p.team_id = t.id
  JOIN public.fixtures f ON me.fixture_id = f.id
  WHERE me.type IN ('goal', 'penalty')
    AND (p_competition_id IS NULL OR f.competition_id = p_competition_id)
  GROUP BY p.id, pr.first_name, pr.last_name, p.jersey_number, p.position, t.id, t.name, t.logo_url
  ORDER BY COUNT(me.id) DESC LIMIT COALESCE(p_limit, 10);
END;
$func$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_top_scorers(UUID, INT) TO anon, authenticated;

GRANT SELECT ON public.fixtures TO anon;
GRANT SELECT ON public.teams TO anon;
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT ON public.league_standings TO anon;
GRANT SELECT ON public.players TO anon;
GRANT SELECT ON public.player_stats TO anon;
GRANT SELECT ON public.match_events TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.team_form TO anon;
