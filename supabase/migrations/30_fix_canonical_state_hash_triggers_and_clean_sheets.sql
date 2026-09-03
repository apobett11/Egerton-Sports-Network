-- Migration 30: Canonical Permanent Results State Hash, Immutability Barrier, Live Synchronization & Clean Sheet Playing-Time Alignment

-- 1. Add state_hash column to canonical_permanent_results
ALTER TABLE public.canonical_permanent_results ADD COLUMN IF NOT EXISTS state_hash TEXT;

-- 2. State Hash Automatic Generator Trigger
CREATE OR REPLACE FUNCTION public.fn_canonical_generate_state_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state_hash IS NULL OR NEW.state_hash = '' THEN
        NEW.state_hash := encode(digest(NEW.match_uid::text || ':' || NEW.outcome || ':' || NEW.home_score::text || ':' || NEW.away_score::text || ':' || NEW.events::text, 'sha256'), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_canonical_state_hash ON public.canonical_permanent_results;
CREATE TRIGGER trg_canonical_state_hash
BEFORE INSERT ON public.canonical_permanent_results
FOR EACH ROW
EXECUTE FUNCTION public.fn_canonical_generate_state_hash();

-- 3. Prevent direct UPDATE on canonical_permanent_results (immutability barrier)
CREATE OR REPLACE FUNCTION public.fn_prevent_canonical_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CANONICAL_RESULT_IMMUTABLE: Direct UPDATE on canonical_permanent_results is strictly prohibited.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_canonical_immutability ON public.canonical_permanent_results;
CREATE TRIGGER trg_canonical_immutability
BEFORE UPDATE ON public.canonical_permanent_results
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_canonical_tampering();

-- 4. Update fn_handle_canonical_result_committed to lock verification status
CREATE OR REPLACE FUNCTION public.fn_handle_canonical_result_committed()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize fixtures table with the canonical permanent result
    UPDATE public.fixtures
    SET
        score_home = NEW.home_score,
        score_away = NEW.away_score,
        status = 'FT',
        referee_verification_status = 'VERIFIED',
        verified_by_referee_id = NEW.referee_uid,
        updated_at = NOW()
    WHERE id = NEW.match_uid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Sync live states to fixtures immediately when journalist updates live state
CREATE OR REPLACE FUNCTION public.fn_sync_live_state_to_fixture()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fixtures
    SET
        score_home = NEW.home_score,
        score_away = NEW.away_score,
        updated_at = NOW()
    WHERE id = NEW.match_uid
      AND status != 'FT';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_live_state ON public.match_live_states;
CREATE TRIGGER trg_sync_live_state
AFTER INSERT OR UPDATE ON public.match_live_states
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_live_state_to_fixture();

-- 6. Update fn_process_match_statistics with Playing-Time Rules for Goalkeeper Clean Sheets
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
BEGIN
    -- [IDEMPOTENCY CHECK] Never run twice for the same match
    IF NEW.stats_processed = TRUE THEN
        RETURN NEW;
    END IF;

    -- [CONCURRENCY LOCK] Lock the competition row
    IF NEW.competition_id IS NOT NULL THEN
        SELECT id INTO v_lock_check 
        FROM public.competitions 
        WHERE id = NEW.competition_id 
        FOR UPDATE;
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
    -- MODULE A: LEAGUE STANDINGS
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
    -- MODULE B: TEAM FORM (Last 5 Matches)
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
    -- ==========================================
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

    -- Mark Match as Processed
    NEW.stats_processed := TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
