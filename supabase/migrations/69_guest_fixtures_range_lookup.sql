-- get_guest_fixtures compared DATE(scheduled_time), which cannot use
-- idx_fixtures_scheduled_time. A half-open range can.

CREATE OR REPLACE FUNCTION public.get_guest_fixtures(
  p_competition_id UUID DEFAULT NULL,
  p_date          DATE   DEFAULT NULL,
  p_matchday      INT    DEFAULT NULL
)
RETURNS TABLE (
  id                  UUID,
  competition_id      UUID,
  competition_name    TEXT,
  matchday            INT,
  scheduled_time      TIMESTAMPTZ,
  venue               TEXT,
  status              TEXT,
  score_home          INT,
  score_away          INT,
  home_penalty_score  INT,
  away_penalty_score  INT,
  home_team_id        UUID,
  home_team_name      TEXT,
  home_short_name     TEXT,
  home_logo_url       TEXT,
  home_color_code     TEXT,
  away_team_id        UUID,
  away_team_name      TEXT,
  away_short_name     TEXT,
  away_logo_url       TEXT,
  away_color_code     TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    f.id,
    f.competition_id,
    COALESCE(c.name, 'Campus Football') AS competition_name,
    COALESCE(f.matchday, 1) AS matchday,
    f.scheduled_time,
    COALESCE(f.venue, 'Egerton Main Grounds') AS venue,
    COALESCE(f.status, 'UPCOMING') AS status,
    COALESCE(f.score_home, 0) AS score_home,
    COALESCE(f.score_away, 0) AS score_away,
    f.home_penalty_score,
    f.away_penalty_score,
    ht.id   AS home_team_id,
    ht.name AS home_team_name,
    ht.short_name AS home_short_name,
    ht.logo_url   AS home_logo_url,
    ht.color_code AS home_color_code,
    at.id   AS away_team_id,
    at.name AS away_team_name,
    at.short_name AS away_short_name,
    at.logo_url   AS away_logo_url,
    at.color_code AS away_color_code
  FROM public.fixtures f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id
  LEFT JOIN public.competitions c ON c.id = f.competition_id
  WHERE (f.deleted_at IS NULL OR f.deleted_at > NOW())
    AND (p_competition_id IS NULL OR f.competition_id = p_competition_id)
    AND (
      p_date IS NULL
      OR (
        f.scheduled_time >= (p_date::timestamp AT TIME ZONE 'UTC')
        AND f.scheduled_time < ((p_date + 1)::timestamp AT TIME ZONE 'UTC')
      )
    )
    AND (p_matchday IS NULL OR f.matchday = p_matchday)
  ORDER BY f.scheduled_time ASC;
$$;
