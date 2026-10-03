-- Player tables must follow records that exist.
-- A clean sheet is credited only to the goalkeeper named in that match's lineup,
-- or to a goalkeeper who actually came on. It is not given to the first keeper
-- on the club list.
-- Goals and assists count only from official events whose players exist.

CREATE OR REPLACE FUNCTION public.recalculate_all_player_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_home_gk UUID;
  v_away_gk UUID;
  v_sub_gk UUID;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_player_cs (
    player_id UUID,
    competition_id UUID,
    clean_sheets INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_cs;

  CREATE TEMP TABLE IF NOT EXISTS temp_player_goals (
    player_id UUID,
    competition_id UUID,
    goals INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_goals;

  CREATE TEMP TABLE IF NOT EXISTS temp_player_assists (
    player_id UUID,
    competition_id UUID,
    assists INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_assists;

  INSERT INTO temp_player_goals (player_id, competition_id, goals)
  SELECT me.player_id, f.competition_id, COUNT(*)::INT
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  JOIN public.players p ON p.id = me.player_id
  WHERE LOWER(me.type) IN ('goal', 'penalty')
    AND me.is_official IS TRUE
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
    AND f.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.canonical_permanent_results c
      WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
    )
  GROUP BY me.player_id, f.competition_id;

  INSERT INTO temp_player_assists (player_id, competition_id, assists)
  SELECT me.assist_player_id, f.competition_id, COUNT(*)::INT
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  JOIN public.players p ON p.id = me.assist_player_id
  WHERE me.assist_player_id IS NOT NULL
    AND LOWER(me.type) IN ('goal', 'penalty')
    AND me.is_official IS TRUE
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
    AND f.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.canonical_permanent_results c
      WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
    )
  GROUP BY me.assist_player_id, f.competition_id;

  FOR v_rec IN (
    SELECT f.id, f.competition_id, f.home_team_id, f.away_team_id, f.score_home, f.score_away
    FROM public.fixtures f
    WHERE UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
      AND f.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.canonical_permanent_results c
        WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
      )
  ) LOOP
    IF COALESCE(v_rec.score_away, 0) = 0 THEN
      v_home_gk := NULL;

      SELECT p.id INTO v_home_gk
      FROM public.match_lineups ml
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ml.starting_xi, '[]'::jsonb)) elem
      JOIN public.players p ON p.id::text = elem->>'id'
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.home_team_id
        AND UPPER(COALESCE(elem->>'position', p.position, '')) IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      IF v_home_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.home_team_id
          AND me.is_official IS TRUE
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;
        IF v_sub_gk IS NOT NULL THEN
          v_home_gk := v_sub_gk;
        END IF;
      END IF;

      IF v_home_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_home_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;

    IF COALESCE(v_rec.score_home, 0) = 0 THEN
      v_away_gk := NULL;

      SELECT p.id INTO v_away_gk
      FROM public.match_lineups ml
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ml.starting_xi, '[]'::jsonb)) elem
      JOIN public.players p ON p.id::text = elem->>'id'
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.away_team_id
        AND UPPER(COALESCE(elem->>'position', p.position, '')) IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      IF v_away_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.away_team_id
          AND me.is_official IS TRUE
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;
        IF v_sub_gk IS NOT NULL THEN
          v_away_gk := v_sub_gk;
        END IF;
      END IF;

      IF v_away_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_away_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.player_stats
  SET goals = 0, assists = 0, clean_sheets = 0, last_updated = NOW();

  INSERT INTO public.player_stats (player_id, competition_id, goals, assists, clean_sheets, last_updated)
  SELECT
    COALESCE(g.player_id, a.player_id, cs.player_id),
    COALESCE(g.competition_id, a.competition_id, cs.competition_id),
    COALESCE(g.goals, 0),
    COALESCE(a.assists, 0),
    COALESCE(cs.clean_sheets, 0),
    NOW()
  FROM temp_player_goals g
  FULL OUTER JOIN temp_player_assists a
    ON g.player_id = a.player_id AND g.competition_id = a.competition_id
  FULL OUTER JOIN temp_player_cs cs
    ON COALESCE(g.player_id, a.player_id) = cs.player_id
   AND COALESCE(g.competition_id, a.competition_id) = cs.competition_id
  ON CONFLICT (player_id, competition_id)
  DO UPDATE SET
    goals = EXCLUDED.goals,
    assists = EXCLUDED.assists,
    clean_sheets = EXCLUDED.clean_sheets,
    last_updated = NOW();
END;
$$;
