-- Migration 19: Algorithm 2 - Match Statistics Engine (Standings, Form, Player Stats)
-- PostgreSQL native engine with Row-Level Locking, Subtransaction Isolation, and Upsert Precision.

-- ==========================================
-- 1. SCHEMA PREPARATION (TABLES & FLAGS)
-- ==========================================

-- 1. Add Idempotency Flag to Fixtures
ALTER TABLE public.fixtures ADD COLUMN IF NOT EXISTS stats_processed BOOLEAN DEFAULT FALSE;

-- 2. Create the Admin Error Logs Table
CREATE TABLE IF NOT EXISTS public.admin_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materialized League Standings
CREATE TABLE IF NOT EXISTS public.league_standings (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, competition_id)
);

-- 4. Materialized Team Form (Stores the exact W/D/L array)
CREATE TABLE IF NOT EXISTS public.team_form (
    team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    latest_results TEXT[], -- e.g., ['W', 'D', 'L', 'W', 'W']
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Materialized Player Stats
CREATE TABLE IF NOT EXISTS public.player_stats (
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (player_id, competition_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_league_standings_comp ON public.league_standings(competition_id, points DESC, goal_difference DESC);
CREATE INDEX IF NOT EXISTS idx_team_form_comp ON public.team_form(competition_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_comp ON public.player_stats(competition_id, goals DESC);
CREATE INDEX IF NOT EXISTS idx_admin_error_logs_fixture ON public.admin_error_logs(fixture_id);

-- ==========================================
-- 2. THE MASTER ALGORITHM (PL/pgSQL Function)
-- ==========================================

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
BEGIN
    -- [IDEMPOTENCY CHECK] Never run twice for the same match
    IF NEW.stats_processed = TRUE THEN
        RETURN NEW;
    END IF;

    -- [CONCURRENCY LOCK] Lock the competition row. 
    -- If two matches end simultaneously, Match B waits here until Match A is done.
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
            ], -- Keeps strictly the last 5
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
        -- 1. Aggregate Goals from Official Match Events for this specific match
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

        -- 3. Clean Sheets: If Away scored 0, Home GK gets clean sheet
        IF v_away_goals = 0 THEN
            SELECT p.id INTO v_home_gk_id 
            FROM public.players p
            WHERE p.team_id = NEW.home_team_id AND p.position = 'GK'
            LIMIT 1;

            IF v_home_gk_id IS NOT NULL THEN
                INSERT INTO public.player_stats (player_id, competition_id, clean_sheets)
                VALUES (v_home_gk_id, NEW.competition_id, 1)
                ON CONFLICT (player_id, competition_id) DO UPDATE SET
                    clean_sheets = public.player_stats.clean_sheets + 1,
                    last_updated = NOW();
            END IF;
        END IF;

        -- If Home scored 0, Away GK gets clean sheet
        IF v_home_goals = 0 THEN
            SELECT p.id INTO v_away_gk_id 
            FROM public.players p
            WHERE p.team_id = NEW.away_team_id AND p.position = 'GK'
            LIMIT 1;

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

-- ==========================================
-- 3. THE DATABASE TRIGGER
-- ==========================================

DROP TRIGGER IF EXISTS trg_process_match_end ON public.fixtures;

CREATE TRIGGER trg_process_match_end
BEFORE UPDATE ON public.fixtures
FOR EACH ROW
WHEN (NEW.status = 'FT' AND (OLD.status IS NULL OR OLD.status != 'FT') AND NEW.stats_processed = FALSE)
EXECUTE FUNCTION public.fn_process_match_statistics();

-- ==========================================
-- 4. RLS POLICIES & REALTIME
-- ==========================================

ALTER TABLE public.admin_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read league standings" ON public.league_standings;
CREATE POLICY "Public read league standings" ON public.league_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read team form" ON public.team_form;
CREATE POLICY "Public read team form" ON public.team_form FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read player stats" ON public.player_stats;
CREATE POLICY "Public read player stats" ON public.player_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin read error logs" ON public.admin_error_logs;
CREATE POLICY "Admin read error logs" ON public.admin_error_logs FOR SELECT USING (true);

-- Realtime publication for immediate live tables update
ALTER TABLE public.league_standings REPLICA IDENTITY FULL;
ALTER TABLE public.team_form REPLICA IDENTITY FULL;
ALTER TABLE public.player_stats REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.league_standings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_form;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.player_stats;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
