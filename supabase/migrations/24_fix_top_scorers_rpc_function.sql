-- Migration 24: Fix get_top_scorers RPC to properly construct player_name from players table
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
        COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Player') AS player_name,
        COALESCE(t.name, 'Independent') AS team_name,
        COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
        COALESCE(SUM(ps.goals), 0)::INT AS goals
    FROM public.player_stats ps
    JOIN public.players p ON p.id = ps.player_id
    LEFT JOIN public.teams t ON t.id = p.team_id
    WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
      AND ps.goals > 0
    GROUP BY p.id, p.first_name, p.last_name, t.name, t.logo_url
    ORDER BY goals DESC, player_name ASC
    LIMIT COALESCE(p_limit, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
