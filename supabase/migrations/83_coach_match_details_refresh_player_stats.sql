-- Coach match details are written after a match is already finished.
-- Migration 68 turned the player-stats trigger into a no-op so referee
-- finalize would not rebuild every player row. That also stopped later
-- coach events from refreshing goals, assists, and clean sheets.
--
-- This migration:
-- 1. Rebuilds player_stats from the full finished-match event log.
-- 2. Runs that rebuild when events change on a match that is already finished.
-- 3. Skips the rebuild inside referee finalize, which still applies that
--    match incrementally and must stay fast.

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
  SELECT
    me.player_id,
    f.competition_id,
    COUNT(*)::INT AS goals
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  WHERE me.player_id IS NOT NULL
    AND LOWER(me.type) IN ('goal', 'penalty')
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND (me.is_official IS TRUE OR me.is_official IS NULL)
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
    AND f.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.canonical_permanent_results c
      WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
    )
  GROUP BY me.player_id, f.competition_id;

  INSERT INTO temp_player_assists (player_id, competition_id, assists)
  SELECT
    me.assist_player_id AS player_id,
    f.competition_id,
    COUNT(*)::INT AS assists
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  WHERE me.assist_player_id IS NOT NULL
    AND LOWER(me.type) IN ('goal', 'penalty')
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND (me.is_official IS TRUE OR me.is_official IS NULL)
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

      SELECT (elem->>'id')::UUID INTO v_home_gk
      FROM public.match_lineups ml,
           jsonb_array_elements(ml.starting_xi) elem
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.home_team_id
        AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
      LIMIT 1;

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

    IF COALESCE(v_rec.score_home, 0) = 0 THEN
      v_away_gk := NULL;

      SELECT (elem->>'id')::UUID INTO v_away_gk
      FROM public.match_lineups ml,
           jsonb_array_elements(ml.starting_xi) elem
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.away_team_id
        AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
      LIMIT 1;

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
$$;

CREATE OR REPLACE FUNCTION public.mark_player_stats_rebuild()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fixture UUID;
  v_finished BOOLEAN := FALSE;
BEGIN
  IF current_setting('esn.skip_player_rebuild', true) = '1' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  v_fixture := CASE WHEN TG_OP = 'DELETE' THEN OLD.fixture_id ELSE NEW.fixture_id END;

  SELECT TRUE INTO v_finished
  FROM public.fixtures f
  WHERE f.id = v_fixture
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED');

  IF v_finished THEN
    PERFORM set_config('esn.needs_player_rebuild', '1', true);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_fn_recalculate_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME IS DISTINCT FROM 'match_events' THEN
    RETURN NULL;
  END IF;

  IF current_setting('esn.skip_player_rebuild', true) = '1' THEN
    RETURN NULL;
  END IF;

  IF current_setting('esn.needs_player_rebuild', true) = '1' THEN
    PERFORM set_config('esn.needs_player_rebuild', '0', true);
    PERFORM public.recalculate_all_player_stats();
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_player_stats_rebuild ON public.match_events;
CREATE TRIGGER trg_mark_player_stats_rebuild
BEFORE INSERT OR UPDATE OR DELETE ON public.match_events
FOR EACH ROW
EXECUTE FUNCTION public.mark_player_stats_rebuild();

-- Referee finalize rewrites events and then applies this match incrementally.
-- Skip the full rebuild in that transaction so goals are not counted twice
-- and the referee call is not held on a league-wide rebuild.
CREATE OR REPLACE FUNCTION public.finalize_match_transaction(
    p_fixture_id UUID,
    p_referee_id UUID,
    p_outcome TEXT,
    p_home_score INT,
    p_away_score INT,
    p_winning_team_id UUID DEFAULT NULL,
    p_report_text TEXT DEFAULT '',
    p_official_events JSONB DEFAULT '[]'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL,
    p_attendance INT DEFAULT NULL,
    p_weather TEXT DEFAULT NULL,
    p_incidents TEXT DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_fixture RECORD;
    v_existing_canonical RECORD;
    v_prev_cmd RECORD;
    v_canonical_uid UUID;
    v_state_hash TEXT;
    v_final_home_score INT;
    v_final_away_score INT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role'
       AND public.get_auth_role() NOT IN ('referee', 'admin', 'president') THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    IF p_referee_id IS NULL OR p_referee_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'INVALID_REFEREE_ID: Official referee ID is required.';
    END IF;

    SELECT * INTO v_fixture
    FROM public.fixtures
    WHERE id = p_fixture_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FIXTURE_NOT_FOUND: Fixture % does not exist.', p_fixture_id;
    END IF;

    SELECT * INTO v_existing_canonical
    FROM public.canonical_permanent_results
    WHERE match_uid = p_fixture_id;

    IF v_existing_canonical IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'ALREADY_FINALIZED',
            'result_uid', v_existing_canonical.result_uid,
            'match_uid', v_existing_canonical.match_uid,
            'outcome', v_existing_canonical.outcome,
            'home_score', v_existing_canonical.home_score,
            'away_score', v_existing_canonical.away_score,
            'state_hash', v_existing_canonical.state_hash
        );
    END IF;

    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) != '' THEN
        SELECT * INTO v_prev_cmd
        FROM public.finalization_commands
        WHERE match_uid = p_fixture_id AND idempotency_key = p_idempotency_key;

        IF v_prev_cmd IS NOT NULL THEN
            SELECT * INTO v_existing_canonical
            FROM public.canonical_permanent_results
            WHERE result_uid = v_prev_cmd.result_uid;

            IF v_existing_canonical IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'status', 'ALREADY_FINALIZED',
                    'result_uid', v_existing_canonical.result_uid,
                    'match_uid', v_existing_canonical.match_uid,
                    'outcome', v_existing_canonical.outcome,
                    'home_score', v_existing_canonical.home_score,
                    'away_score', v_existing_canonical.away_score,
                    'state_hash', v_existing_canonical.state_hash
                );
            END IF;
        END IF;
    END IF;

    IF p_outcome = 'WALKOVER' THEN
        IF p_winning_team_id IS NULL THEN
            RAISE EXCEPTION 'INVALID_WALKOVER: winning_team_id must be specified for a walkover.';
        END IF;
        IF v_fixture.home_team_id = v_fixture.away_team_id THEN
            RAISE EXCEPTION 'INVALID_WALKOVER_TEAMS: Winning team and losing team cannot be the same team.';
        END IF;
        IF p_winning_team_id = v_fixture.home_team_id THEN
            v_final_home_score := 3;
            v_final_away_score := 0;
        ELSIF p_winning_team_id = v_fixture.away_team_id THEN
            v_final_home_score := 0;
            v_final_away_score := 3;
        ELSE
            RAISE EXCEPTION 'INVALID_WALKOVER_WINNER: Winning team % does not belong to fixture %.', p_winning_team_id, p_fixture_id;
        END IF;
    ELSE
        v_final_home_score := GREATEST(0, COALESCE(p_home_score, 0));
        v_final_away_score := GREATEST(0, COALESCE(p_away_score, 0));
    END IF;

    PERFORM set_config('esn.skip_player_rebuild', '1', true);

    DELETE FROM public.match_events WHERE fixture_id = p_fixture_id;

    IF p_outcome != 'WALKOVER' AND p_official_events IS NOT NULL AND jsonb_array_length(p_official_events) > 0 THEN
        INSERT INTO public.match_events (
            fixture_id, minute, type, event_target, team_id, player_id,
            assist_player_id, detail_text, is_official, created_by, created_at
        )
        SELECT
            p_fixture_id,
            GREATEST(0, COALESCE((elem->>'minute')::INT, 1)),
            elem->>'type',
            COALESCE(elem->>'event_target', 'match'),
            CASE WHEN elem->>'team_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                 THEN (elem->>'team_id')::UUID ELSE NULL END,
            CASE WHEN elem->>'player_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                 THEN (elem->>'player_id')::UUID ELSE NULL END,
            CASE WHEN elem->>'assist_player_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                 THEN (elem->>'assist_player_id')::UUID ELSE NULL END,
            elem->>'detail_text',
            TRUE,
            p_referee_id,
            v_now
        FROM jsonb_array_elements(p_official_events) AS elem;
    END IF;

    DELETE FROM public.match_reports WHERE fixture_id = p_fixture_id;
    INSERT INTO public.match_reports (fixture_id, official_id, official_role, report_text, submitted_at)
    VALUES (
        p_fixture_id, p_referee_id, 'referee',
        COALESCE(NULLIF(trim(p_report_text), ''), 'Official Match Report'),
        v_now
    );

    v_canonical_uid := gen_random_uuid();
    v_state_hash := encode(digest(
        p_fixture_id::text || ':' || p_outcome || ':' || v_final_home_score::text || ':' || v_final_away_score::text || ':' ||
        (CASE WHEN p_outcome = 'WALKOVER' THEN '[]'::jsonb ELSE COALESCE(p_official_events, '[]'::jsonb) END)::text,
        'sha256'
    ), 'hex');

    INSERT INTO public.canonical_permanent_results (
        result_uid, match_uid, outcome, home_score, away_score, events,
        referee_uid, finalized_at, locked_at, state_hash
    ) VALUES (
        v_canonical_uid, p_fixture_id, p_outcome, v_final_home_score, v_final_away_score,
        CASE WHEN p_outcome = 'WALKOVER' THEN '[]'::jsonb ELSE COALESCE(p_official_events, '[]'::jsonb) END,
        p_referee_id, v_now, v_now, v_state_hash
    );

    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) != '' THEN
        INSERT INTO public.finalization_commands (match_uid, idempotency_key, result_uid, created_at)
        VALUES (p_fixture_id, p_idempotency_key, v_canonical_uid, v_now)
        ON CONFLICT (match_uid, idempotency_key) DO NOTHING;
    END IF;

    UPDATE public.fixtures
    SET
        score_home = v_final_home_score,
        score_away = v_final_away_score,
        status = 'FT',
        referee_verification_status = 'VERIFIED',
        verified_by_referee_id = p_referee_id,
        attendance = COALESCE(p_attendance, attendance),
        weather = COALESCE(p_weather, weather),
        updated_at = v_now
    WHERE id = p_fixture_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'COMMITTED',
        'result_uid', v_canonical_uid,
        'match_uid', p_fixture_id,
        'outcome', p_outcome,
        'home_score', v_final_home_score,
        'away_score', v_final_away_score,
        'state_hash', v_state_hash
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_all_player_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_player_stats(UUID) TO authenticated, service_role;

SELECT public.recalculate_all_player_stats();
