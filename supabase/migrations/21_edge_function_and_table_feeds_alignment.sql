-- Migration 21: Align Frontend Feeds & Edge Function Triggers with Algorithm 2 Materialized Tables
-- Ensures all dashboards, tables, form, and player statistics feed directly from the authoritative algorithms.

-- 1. Ensure RPC Function: get_league_standings reads directly from materialized league_standings table
DROP FUNCTION IF EXISTS public.get_league_standings(UUID);
CREATE OR REPLACE FUNCTION public.get_league_standings(p_competition_id UUID)
RETURNS TABLE (
    "position" BIGINT,
    team_id UUID,
    team_name TEXT,
    team_logo TEXT,
    played INT,
    won INT,
    drawn INT,
    lost INT,
    goals_for INT,
    goals_against INT,
    goal_difference INT,
    points INT
) AS $$
BEGIN
    RETURN QUERY
    WITH standings_with_teams AS (
        SELECT 
            t.id AS t_id,
            t.name AS t_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS t_logo,
            COALESCE(ls.played, 0)::INT AS m_played,
            COALESCE(ls.won, 0)::INT AS m_won,
            COALESCE(ls.drawn, 0)::INT AS m_drawn,
            COALESCE(ls.lost, 0)::INT AS m_lost,
            COALESCE(ls.goals_for, 0)::INT AS m_gf,
            COALESCE(ls.goals_against, 0)::INT AS m_ga,
            COALESCE(ls.goal_difference, 0)::INT AS m_gd,
            COALESCE(ls.points, 0)::INT AS m_pts
        FROM public.teams t
        LEFT JOIN public.league_standings ls 
            ON ls.team_id = t.id AND ls.competition_id = p_competition_id
        WHERE (p_competition_id IS NULL OR t.competition_id = p_competition_id OR ls.competition_id = p_competition_id)
    )
    SELECT 
        ROW_NUMBER() OVER (
            ORDER BY 
                s.m_pts DESC, 
                s.m_gd DESC, 
                s.m_gf DESC, 
                s.t_name ASC
        )::BIGINT AS "position",
        s.t_id AS team_id,
        s.t_name AS team_name,
        s.t_logo AS team_logo,
        s.m_played AS played,
        s.m_won AS won,
        s.m_drawn AS drawn,
        s.m_lost AS lost,
        s.m_gf AS goals_for,
        s.m_ga AS goals_against,
        s.m_gd AS goal_difference,
        s.m_pts AS points
    FROM standings_with_teams s
    ORDER BY "position" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RPC Function: get_top_scorers reads directly from materialized player_stats table
DROP FUNCTION IF EXISTS public.get_top_scorers(UUID, INT);
CREATE OR REPLACE FUNCTION public.get_top_scorers(p_competition_id UUID DEFAULT NULL, p_limit INT DEFAULT 10)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    team_name TEXT,
    team_logo TEXT,
    goals INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS player_id,
        COALESCE(p.name, 'Player') AS player_name,
        COALESCE(t.name, 'Independent') AS team_name,
        COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
        COALESCE(SUM(ps.goals), 0)::INT AS goals
    FROM public.player_stats ps
    JOIN public.players p ON p.id = ps.player_id
    LEFT JOIN public.teams t ON t.id = p.team_id
    WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
      AND ps.goals > 0
    GROUP BY p.id, p.name, t.name, t.logo_url
    ORDER BY goals DESC, player_name ASC
    LIMIT COALESCE(p_limit, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure RPC Function: get_team_form reads directly from materialized team_form table
DROP FUNCTION IF EXISTS public.get_team_form(UUID);
CREATE OR REPLACE FUNCTION public.get_team_form(p_team_id UUID)
RETURNS TABLE (
    result TEXT,
    label TEXT
) AS $$
DECLARE
    v_results TEXT[];
    v_item TEXT;
BEGIN
    SELECT tf.latest_results INTO v_results
    FROM public.team_form tf
    WHERE tf.team_id = p_team_id;

    IF v_results IS NOT NULL THEN
        FOREACH v_item IN ARRAY v_results
        LOOP
            result := v_item;
            label := CASE 
                WHEN v_item = 'W' THEN 'Win'
                WHEN v_item = 'D' THEN 'Draw'
                ELSE 'Loss'
            END;
            RETURN NEXT;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RPC Function: get_player_stats_leaderboard reads directly from player_stats table
DROP FUNCTION IF EXISTS public.get_player_stats_leaderboard(UUID, TEXT, INT);
CREATE OR REPLACE FUNCTION public.get_player_stats_leaderboard(
    p_competition_id UUID DEFAULT NULL,
    p_category TEXT DEFAULT 'goals',
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    team_name TEXT,
    team_logo TEXT,
    category_count INT
) AS $$
BEGIN
    IF LOWER(p_category) = 'assists' THEN
        RETURN QUERY
        SELECT 
            p.id AS player_id,
            COALESCE(p.name, 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.assists), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.assists > 0
        GROUP BY p.id, p.name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    ELSIF LOWER(p_category) = 'clean_sheets' THEN
        RETURN QUERY
        SELECT 
            p.id AS player_id,
            COALESCE(p.name, 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.clean_sheets), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.clean_sheets > 0
        GROUP BY p.id, p.name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    ELSE
        RETURN QUERY
        SELECT 
            p.id AS player_id,
            COALESCE(p.name, 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.goals), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.goals > 0
        GROUP BY p.id, p.name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger on canonical_permanent_results to guarantee fixtures update and stats processing
CREATE OR REPLACE FUNCTION public.fn_handle_canonical_result_committed()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize fixtures table with the canonical permanent result
    UPDATE public.fixtures
    SET 
        score_home = NEW.home_score,
        score_away = NEW.away_score,
        status = 'FT',
        updated_at = NOW()
    WHERE id = NEW.match_uid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_canonical_result_committed ON public.canonical_permanent_results;

CREATE TRIGGER trg_canonical_result_committed
AFTER INSERT OR UPDATE ON public.canonical_permanent_results
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_canonical_result_committed();
