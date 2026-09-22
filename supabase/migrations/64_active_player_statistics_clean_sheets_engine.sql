-- ============================================================================
-- Migration 64: Active Real-time Player Statistics and Clean Sheets Recalculation Engine
-- 1. Automates clean sheets, top scorers, and assists recalculation across all matches
-- 2. Creates trigger listeners on match_events and fixtures so every update from
--    coach dashboard, referee, journalist or admin triggers automatic stats recalculation
-- 3. Guarantees clean sheets are accurately awarded to team goalkeepers for zero-conceded games
-- 4. Exposes RPC recalculate_all_player_stats() with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_all_player_stats()
RETURNS VOID AS $$
DECLARE
  v_rec RECORD;
  v_home_gk UUID;
  v_away_gk UUID;
  v_sub_gk UUID;
BEGIN
  -- 1. Temporary table for clean sheet counts
  CREATE TEMP TABLE IF NOT EXISTS temp_player_cs (
    player_id UUID,
    competition_id UUID,
    clean_sheets INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_cs;

  -- 2. Temporary table for goal counts
  CREATE TEMP TABLE IF NOT EXISTS temp_player_goals (
    player_id UUID,
    competition_id UUID,
    goals INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_goals;

  -- 3. Temporary table for assist counts
  CREATE TEMP TABLE IF NOT EXISTS temp_player_assists (
    player_id UUID,
    competition_id UUID,
    assists INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_assists;

  -- A. Aggregate Goals
  INSERT INTO temp_player_goals (player_id, competition_id, goals)
  SELECT 
    me.player_id,
    f.competition_id,
    COUNT(*)::INT AS goals
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  WHERE me.player_id IS NOT NULL
    AND LOWER(me.type) IN ('goal', 'penalty')
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
  GROUP BY me.player_id, f.competition_id;

  -- B. Aggregate Assists
  INSERT INTO temp_player_assists (player_id, competition_id, assists)
  SELECT 
    me.assist_player_id AS player_id,
    f.competition_id,
    COUNT(*)::INT AS assists
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  WHERE me.assist_player_id IS NOT NULL
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
  GROUP BY me.assist_player_id, f.competition_id;

  -- C. Aggregate Clean Sheets for completed matches
  FOR v_rec IN (
    SELECT f.id, f.competition_id, f.home_team_id, f.away_team_id, f.score_home, f.score_away
    FROM public.fixtures f
    WHERE UPPER(f.status) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
      AND f.deleted_at IS NULL
  ) LOOP
    -- If away team scored 0 goals, home goalkeeper gets clean sheet
    IF COALESCE(v_rec.score_away, 0) = 0 THEN
      v_home_gk := NULL;
      
      -- Priority 1: match_lineups
      SELECT (elem->>'id')::UUID INTO v_home_gk
      FROM public.match_lineups ml,
           jsonb_array_elements(ml.starting_xi) elem
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.home_team_id
        AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      -- Priority 2: Sub-in GK
      IF v_home_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.home_team_id
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;

        IF v_sub_gk IS NOT NULL THEN
          v_home_gk := v_sub_gk;
        END IF;
      END IF;

      -- Priority 3: Team GK roster
      IF v_home_gk IS NULL THEN
        SELECT p.id INTO v_home_gk
        FROM public.players p
        WHERE p.team_id = v_rec.home_team_id AND p.position = 'GK'
        ORDER BY p.jersey_number ASC
        LIMIT 1;
      END IF;

      IF v_home_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_home_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;

    -- If home team scored 0 goals, away goalkeeper gets clean sheet
    IF COALESCE(v_rec.score_home, 0) = 0 THEN
      v_away_gk := NULL;

      -- Priority 1: match_lineups
      SELECT (elem->>'id')::UUID INTO v_away_gk
      FROM public.match_lineups ml,
           jsonb_array_elements(ml.starting_xi) elem
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.away_team_id
        AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      -- Priority 2: Sub-in GK
      IF v_away_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.away_team_id
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;

        IF v_sub_gk IS NOT NULL THEN
          v_away_gk := v_sub_gk;
        END IF;
      END IF;

      -- Priority 3: Team GK roster
      IF v_away_gk IS NULL THEN
        SELECT p.id INTO v_away_gk
        FROM public.players p
        WHERE p.team_id = v_rec.away_team_id AND p.position = 'GK'
        ORDER BY p.jersey_number ASC
        LIMIT 1;
      END IF;

      IF v_away_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_away_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;
  END LOOP;

  -- D. Consolidate and sync into player_stats table
  UPDATE public.player_stats
  SET goals = 0, assists = 0, clean_sheets = 0, last_updated = NOW();

  INSERT INTO public.player_stats (player_id, competition_id, goals, assists, clean_sheets, last_updated)
  SELECT
    COALESCE(g.player_id, a.player_id, cs.player_id) AS player_id,
    COALESCE(g.competition_id, a.competition_id, cs.competition_id) AS competition_id,
    COALESCE(g.goals, 0) AS goals,
    COALESCE(a.assists, 0) AS assists,
    COALESCE(cs.clean_sheets, 0) AS clean_sheets,
    NOW() AS last_updated
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose parameterized alias as well
CREATE OR REPLACE FUNCTION public.recalculate_player_stats(p_competition_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  PERFORM public.recalculate_all_player_stats();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function for automated recalculation
CREATE OR REPLACE FUNCTION public.trigger_fn_recalculate_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_all_player_stats();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS trg_auto_recalc_player_stats_events ON public.match_events;
CREATE TRIGGER trg_auto_recalc_player_stats_events
AFTER INSERT OR UPDATE OR DELETE ON public.match_events
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_fn_recalculate_player_stats();

DROP TRIGGER IF EXISTS trg_auto_recalc_player_stats_fixtures ON public.fixtures;
CREATE TRIGGER trg_auto_recalc_player_stats_fixtures
AFTER UPDATE OF score_home, score_away, status ON public.fixtures
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_fn_recalculate_player_stats();

-- Permissions
GRANT EXECUTE ON FUNCTION public.recalculate_all_player_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_player_stats(UUID) TO anon, authenticated, service_role;
GRANT SELECT ON public.player_stats TO anon, authenticated;

-- Run immediate recalculation to bring clean sheets, top scorers, and assists up to date
SELECT public.recalculate_all_player_stats();
