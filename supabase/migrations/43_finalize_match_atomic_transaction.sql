-- Migration 32: Atomic Match Finalization Transaction & Clean Sheets Alignment
-- Purpose:
-- 1. Create public.finalize_match_transaction stored procedure for 100% atomic match finalization,
--    idempotency, row locking, event replacement, canonical result persistence, and fixtures update.
-- 2. Patch public.fn_process_match_statistics() to strictly skip clean sheets on walkover matches.

-- ============================================================================
-- RPC: public.finalize_match_transaction
-- Guarantees 100% atomic match finalization, idempotency, event replacement,
-- canonical result persistence, and standings processing in a single transaction.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.finalize_match_transaction(
    p_fixture_id UUID,
    p_referee_id UUID,
    p_outcome TEXT,                     -- 'NORMAL' | 'WALKOVER'
    p_home_score INT,
    p_away_score INT,
    p_winning_team_id UUID DEFAULT NULL,-- Required if p_outcome = 'WALKOVER'
    p_report_text TEXT DEFAULT '',
    p_official_events JSONB DEFAULT '[]'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL,
    p_attendance INT DEFAULT NULL,
    p_weather TEXT DEFAULT NULL,
    p_incidents TEXT DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
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
    -- 0. VALIDATE REQUIRED REFEREE ID
    IF p_referee_id IS NULL OR p_referee_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        RAISE EXCEPTION 'INVALID_REFEREE_ID: Official referee ID is required.';
    END IF;

    -- 1. ROW-LEVEL CONCURRENCY LOCK
    -- Lock the fixture row to serialize concurrent finalization requests
    SELECT * INTO v_fixture
    FROM public.fixtures
    WHERE id = p_fixture_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FIXTURE_NOT_FOUND: Fixture % does not exist.', p_fixture_id;
    END IF;

    -- 2. IDEMPOTENCY CHECK
    -- 2a. Check direct canonical result existence
    SELECT * INTO v_existing_canonical
    FROM public.canonical_permanent_results
    WHERE match_uid = p_fixture_id;

    IF v_existing_canonical IS NOT NULL THEN
        -- Match is already finalized; return existing canonical result idempotently
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

    -- 2b. Check idempotency ledger
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

    -- 3. SCORE & OUTCOME MATHEMATICAL ENFORCEMENT
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

    -- 4. ATOMIC REPLACEMENT OF MATCH EVENTS (BEFORE STATS PROCESSING)
    -- Wipe existing temporary/live events for this fixture
    DELETE FROM public.match_events WHERE fixture_id = p_fixture_id;

    -- Insert official events batch if normal outcome and events provided
    IF p_outcome != 'WALKOVER' AND p_official_events IS NOT NULL AND jsonb_array_length(p_official_events) > 0 THEN
        INSERT INTO public.match_events (
            fixture_id,
            minute,
            type,
            event_target,
            team_id,
            player_id,
            assist_player_id,
            detail_text,
            is_official,
            created_by,
            created_at
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

    -- 5. DEDUPLICATED MATCH REPORT PERSISTENCE
    DELETE FROM public.match_reports WHERE fixture_id = p_fixture_id;
    INSERT INTO public.match_reports (
        fixture_id,
        official_id,
        official_role,
        report_text,
        submitted_at
    ) VALUES (
        p_fixture_id,
        p_referee_id,
        'referee',
        COALESCE(NULLIF(trim(p_report_text), ''), 'Official Match Report'),
        v_now
    );

    -- 6. CANONICAL PERMANENT RECORD PERSISTENCE
    v_canonical_uid := gen_random_uuid();
    v_state_hash := encode(digest(
        p_fixture_id::text || ':' || p_outcome || ':' || v_final_home_score::text || ':' || v_final_away_score::text || ':' || 
        (CASE WHEN p_outcome = 'WALKOVER' THEN '[]'::jsonb ELSE COALESCE(p_official_events, '[]'::jsonb) END)::text,
        'sha256'
    ), 'hex');

    INSERT INTO public.canonical_permanent_results (
        result_uid,
        match_uid,
        outcome,
        home_score,
        away_score,
        events,
        referee_uid,
        finalized_at,
        locked_at,
        state_hash
    ) VALUES (
        v_canonical_uid,
        p_fixture_id,
        p_outcome,
        v_final_home_score,
        v_final_away_score,
        CASE WHEN p_outcome = 'WALKOVER' THEN '[]'::jsonb ELSE COALESCE(p_official_events, '[]'::jsonb) END,
        p_referee_id,
        v_now,
        v_now,
        v_state_hash
    );

    -- 7. RECORD FINALIZATION COMMAND (IDEMPOTENCY LEDGER)
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) != '' THEN
        INSERT INTO public.finalization_commands (match_uid, idempotency_key, result_uid, created_at)
        VALUES (p_fixture_id, p_idempotency_key, v_canonical_uid, v_now)
        ON CONFLICT (match_uid, idempotency_key) DO NOTHING;
    END IF;

    -- 8. FIXTURES UPDATE & TRIGGER FIRING
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.finalize_match_transaction TO authenticated, service_role;

-- ============================================================================
-- TRIGGER FUNCTION: public.fn_process_match_statistics
-- Patched with walkover clean sheet guard:
-- Queries canonical_permanent_results.outcome for NEW.id.
-- If outcome = 'WALKOVER', strictly skip clean sheet attribution,
-- guaranteeing 0 clean sheets to any goalkeeper on walkovers.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_process_match_statistics()
RETURNS TRIGGER AS $$
DECLARE
    v_home_goals INTEGER;
    v_away_goals INTEGER;
    v_home_won INT := 0; v_home_drawn INT := 0; v_home_lost INT := 0;
    v_away_won INT := 0; v_away_drawn INT := 0; v_away_lost INT := 0;
    v_home_points INT := 0; v_away_points INT := 0;
    v_home_result TEXT; v_away_result TEXT;
    v_lock_check RECORD;
    v_home_gk_id UUID;
    v_away_gk_id UUID;
    v_sub_gk_id UUID;
    v_outcome TEXT;
    v_is_walkover BOOLEAN := FALSE;
BEGIN
    -- [IDEMPOTENCY CHECK] Never run twice for the same match
    IF NEW.stats_processed = TRUE THEN
        RETURN NEW;
    END IF;

    -- [CONCURRENCY LOCK] Lock the competition row to serialize concurrent finalizations
    IF NEW.competition_id IS NOT NULL THEN
        SELECT id INTO v_lock_check 
        FROM public.competitions 
        WHERE id = NEW.competition_id 
        FOR UPDATE;
    END IF;

    -- Query canonical outcome to detect walkover
    SELECT outcome INTO v_outcome
    FROM public.canonical_permanent_results
    WHERE match_uid = NEW.id;

    IF UPPER(COALESCE(v_outcome, '')) = 'WALKOVER' THEN
        v_is_walkover := TRUE;
    ELSE
        -- Fallback check on match reports or NEW.status
        SELECT EXISTS (
            SELECT 1 FROM public.match_reports
            WHERE fixture_id = NEW.id AND (report_text ILIKE '%WALKOVER%' OR report_text ILIKE '%3-0 win committed%')
        ) INTO v_is_walkover;
    END IF;

    -- Initialize Math Variables
    v_home_goals := COALESCE(NEW.score_home, 0);
    v_away_goals := COALESCE(NEW.score_away, 0);

    IF v_home_goals > v_away_goals THEN
        v_home_won := 1; v_away_lost := 1;
        v_home_points := 3; v_away_points := 0;
        v_home_result := 'W'; v_away_result := 'L';
    ELSIF v_home_goals < v_away_goals THEN
        v_home_lost := 1; v_away_won := 1;
        v_home_points := 0; v_away_points := 3;
        v_home_result := 'L'; v_away_result := 'W';
    ELSE
        v_home_drawn := 1; v_away_drawn := 1;
        v_home_points := 1; v_away_points := 1;
        v_home_result := 'D'; v_away_result := 'D';
    END IF;

    -- ==========================================
    -- MODULE A: LEAGUE STANDINGS (Deterministic Math)
    -- ==========================================
    BEGIN
        -- Upsert Home Team
        INSERT INTO public.league_standings (team_id, competition_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
        VALUES (NEW.home_team_id, NEW.competition_id, 1, v_home_won, v_home_drawn, v_home_lost, v_home_goals, v_away_goals, (v_home_goals - v_away_goals), v_home_points)
        ON CONFLICT (team_id, competition_id) DO UPDATE SET
            played = public.league_standings.played + 1,
            won = public.league_standings.won + EXCLUDED.won,
            drawn = public.league_standings.drawn + EXCLUDED.drawn,
            lost = public.league_standings.lost + EXCLUDED.lost,
            goals_for = public.league_standings.goals_for + EXCLUDED.goals_for,
            goals_against = public.league_standings.goals_against + EXCLUDED.goals_against,
            goal_difference = public.league_standings.goal_difference + EXCLUDED.goal_difference,
            points = public.league_standings.points + EXCLUDED.points,
            last_updated = NOW();

        -- Upsert Away Team
        INSERT INTO public.league_standings (team_id, competition_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
        VALUES (NEW.away_team_id, NEW.competition_id, 1, v_away_won, v_away_drawn, v_away_lost, v_away_goals, v_home_goals, (v_away_goals - v_home_goals), v_away_points)
        ON CONFLICT (team_id, competition_id) DO UPDATE SET
            played = public.league_standings.played + 1,
            won = public.league_standings.won + EXCLUDED.won,
            drawn = public.league_standings.drawn + EXCLUDED.drawn,
            lost = public.league_standings.lost + EXCLUDED.lost,
            goals_for = public.league_standings.goals_for + EXCLUDED.goals_for,
            goals_against = public.league_standings.goals_against + EXCLUDED.goals_against,
            goal_difference = public.league_standings.goal_difference + EXCLUDED.goal_difference,
            points = public.league_standings.points + EXCLUDED.points,
            last_updated = NOW();
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message) VALUES (NEW.id, 'MODULE_A_STANDINGS', SQLERRM);
    END;

    -- ==========================================
    -- MODULE B: TEAM FORM (Last 5 Matches FIFO)
    -- ==========================================
    BEGIN
        -- Home Team Form Append
        INSERT INTO public.team_form (team_id, competition_id, latest_results)
        VALUES (NEW.home_team_id, NEW.competition_id, ARRAY[v_home_result])
        ON CONFLICT (team_id) DO UPDATE SET
            competition_id = COALESCE(EXCLUDED.competition_id, public.team_form.competition_id),
            latest_results = (ARRAY_APPEND(public.team_form.latest_results, v_home_result))[
                GREATEST(1, ARRAY_LENGTH(ARRAY_APPEND(public.team_form.latest_results, v_home_result), 1) - 4):
            ],
            last_updated = NOW();

        -- Away Team Form Append
        INSERT INTO public.team_form (team_id, competition_id, latest_results)
        VALUES (NEW.away_team_id, NEW.competition_id, ARRAY[v_away_result])
        ON CONFLICT (team_id) DO UPDATE SET
            competition_id = COALESCE(EXCLUDED.competition_id, public.team_form.competition_id),
            latest_results = (ARRAY_APPEND(public.team_form.latest_results, v_away_result))[
                GREATEST(1, ARRAY_LENGTH(ARRAY_APPEND(public.team_form.latest_results, v_away_result), 1) - 4):
            ],
            last_updated = NOW();
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message) VALUES (NEW.id, 'MODULE_B_FORM', SQLERRM);
    END;

    -- ==========================================
    -- MODULE C: PLAYER STATS (Goals, Assists & Clean Sheets)
    -- Walkover Invariant: ZERO individual player goal attribution & ZERO goalkeeper clean sheets
    -- ==========================================
    IF NOT v_is_walkover THEN
        BEGIN
            -- 1. Aggregate Goals from Official Match Events
            INSERT INTO public.player_stats (player_id, competition_id, goals)
            SELECT 
                me.player_id, 
                NEW.competition_id, 
                COUNT(me.id)::INTEGER AS goals
            FROM public.match_events me
            WHERE me.fixture_id = NEW.id 
              AND (me.is_official = TRUE OR me.is_official IS NULL)
              AND LOWER(me.type) IN ('goal', 'penalty') 
              AND me.player_id IS NOT NULL
            GROUP BY me.player_id
            ON CONFLICT (player_id, competition_id) DO UPDATE SET
                goals = public.player_stats.goals + EXCLUDED.goals,
                last_updated = NOW();

            -- 2. Aggregate Assists from Official Match Events
            INSERT INTO public.player_stats (player_id, competition_id, assists)
            SELECT 
                me.assist_player_id, 
                NEW.competition_id, 
                COUNT(me.id)::INTEGER AS assists
            FROM public.match_events me
            WHERE me.fixture_id = NEW.id 
              AND (me.is_official = TRUE OR me.is_official IS NULL)
              AND LOWER(me.type) IN ('goal', 'penalty') 
              AND me.assist_player_id IS NOT NULL
            GROUP BY me.assist_player_id
            ON CONFLICT (player_id, competition_id) DO UPDATE SET
                assists = public.player_stats.assists + EXCLUDED.assists,
                last_updated = NOW();

            -- 3. Clean Sheets with Playing-Time Rules:
            IF v_away_goals = 0 THEN
                v_home_gk_id := NULL;
                SELECT (elem->>'id')::UUID INTO v_home_gk_id
                FROM public.match_lineups ml,
                     jsonb_array_elements(ml.starting_xi) elem
                WHERE ml.fixture_id = NEW.id AND ml.team_id = NEW.home_team_id
                  AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
                LIMIT 1;

                SELECT me.player_id INTO v_sub_gk_id
                FROM public.match_events me
                JOIN public.players p ON p.id = me.player_id
                WHERE me.fixture_id = NEW.id AND me.team_id = NEW.home_team_id
                  AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
                ORDER BY me.minute ASC LIMIT 1;

                IF v_sub_gk_id IS NOT NULL THEN
                    v_home_gk_id := v_sub_gk_id;
                END IF;

                IF v_home_gk_id IS NULL THEN
                    SELECT p.id INTO v_home_gk_id 
                    FROM public.players p
                    WHERE p.team_id = NEW.home_team_id AND p.position = 'GK'
                    ORDER BY p.jersey_number ASC
                    LIMIT 1;
                END IF;

                IF v_home_gk_id IS NOT NULL THEN
                    INSERT INTO public.player_stats (player_id, competition_id, clean_sheets)
                    VALUES (v_home_gk_id, NEW.competition_id, 1)
                    ON CONFLICT (player_id, competition_id) DO UPDATE SET
                        clean_sheets = public.player_stats.clean_sheets + 1,
                        last_updated = NOW();
                END IF;
            END IF;

            IF v_home_goals = 0 THEN
                v_away_gk_id := NULL;
                SELECT (elem->>'id')::UUID INTO v_away_gk_id
                FROM public.match_lineups ml,
                     jsonb_array_elements(ml.starting_xi) elem
                WHERE ml.fixture_id = NEW.id AND ml.team_id = NEW.away_team_id
                  AND UPPER(elem->>'position') IN ('GK', 'GOALKEEPER')
                LIMIT 1;

                SELECT me.player_id INTO v_sub_gk_id
                FROM public.match_events me
                JOIN public.players p ON p.id = me.player_id
                WHERE me.fixture_id = NEW.id AND me.team_id = NEW.away_team_id
                  AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
                ORDER BY me.minute ASC LIMIT 1;

                IF v_sub_gk_id IS NOT NULL THEN
                    v_away_gk_id := v_sub_gk_id;
                END IF;

                IF v_away_gk_id IS NULL THEN
                    SELECT p.id INTO v_away_gk_id 
                    FROM public.players p
                    WHERE p.team_id = NEW.away_team_id AND p.position = 'GK'
                    ORDER BY p.jersey_number ASC
                    LIMIT 1;
                END IF;

                IF v_away_gk_id IS NOT NULL THEN
                    INSERT INTO public.player_stats (player_id, competition_id, clean_sheets)
                    VALUES (v_away_gk_id, NEW.competition_id, 1)
                    ON CONFLICT (player_id, competition_id) DO UPDATE SET
                        clean_sheets = public.player_stats.clean_sheets + 1,
                        last_updated = NOW();
                END IF;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message) VALUES (NEW.id, 'MODULE_C_PLAYER_STATS', SQLERRM);
        END;
    END IF;

    -- Mark Match as Processed
    NEW.stats_processed := TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_match_end ON public.fixtures;

CREATE TRIGGER trg_process_match_end
BEFORE UPDATE ON public.fixtures
FOR EACH ROW
WHEN (NEW.status = 'FT' AND (OLD.status IS NULL OR OLD.status != 'FT') AND NEW.stats_processed = FALSE)
EXECUTE FUNCTION public.fn_process_match_statistics();
