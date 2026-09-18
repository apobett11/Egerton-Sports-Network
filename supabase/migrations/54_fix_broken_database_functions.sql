-- Migration 54: Fix 3 critical broken database functions
-- 1. get_player_stats_leaderboard: p.name does not exist → use first_name/last_name
-- 2. register_official_and_invite: TEXT vs user_role ENUM type mismatch → add cast
-- 3. finalize_match_transaction + fn_canonical_generate_state_hash: digest() not on search_path → use extensions.digest()

-- ============================================================================
-- FIX 1: get_player_stats_leaderboard — players table has first_name/last_name, not name
-- ============================================================================
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
            COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.assists), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.assists > 0
        GROUP BY p.id, p.first_name, p.last_name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    ELSIF LOWER(p_category) = 'clean_sheets' THEN
        RETURN QUERY
        SELECT 
            p.id AS player_id,
            COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.clean_sheets), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.clean_sheets > 0
        GROUP BY p.id, p.first_name, p.last_name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    ELSE
        RETURN QUERY
        SELECT 
            p.id AS player_id,
            COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Player') AS player_name,
            COALESCE(t.name, 'Independent') AS team_name,
            COALESCE(t.logo_url, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80') AS team_logo,
            COALESCE(SUM(ps.goals), 0)::INT AS category_count
        FROM public.player_stats ps
        JOIN public.players p ON p.id = ps.player_id
        LEFT JOIN public.teams t ON t.id = p.team_id
        WHERE (p_competition_id IS NULL OR ps.competition_id = p_competition_id)
          AND ps.goals > 0
        GROUP BY p.id, p.first_name, p.last_name, t.name, t.logo_url
        ORDER BY category_count DESC, player_name ASC
        LIMIT COALESCE(p_limit, 10);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX 2: register_official_and_invite — cast p_role TEXT to user_role ENUM
-- ============================================================================
DROP FUNCTION IF EXISTS public.register_official_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION register_official_and_invite(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'coach',
    p_league_name TEXT DEFAULT NULL,
    p_team_name TEXT DEFAULT NULL,
    p_badge_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_comp_id UUID;
    v_team_id UUID;
    v_sheet_url TEXT;
    v_ref_name TEXT;
BEGIN
    -- Strict Role Assertion
    IF p_role NOT IN ('referee', 'coach') THEN
        RAISE EXCEPTION 'Unauthorized official role: %', p_role;
    END IF;

    -- Resolve Competition ID if provided (UUID string or Name/Slug matching)
    IF p_league_name IS NOT NULL AND TRIM(p_league_name) <> '' THEN
        IF p_league_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            SELECT id INTO v_comp_id
            FROM public.competitions
            WHERE id = p_league_name::UUID
            LIMIT 1;
        END IF;

        IF v_comp_id IS NULL THEN
            SELECT id INTO v_comp_id
            FROM public.competitions
            WHERE LOWER(name) = LOWER(TRIM(p_league_name))
               OR LOWER(slug) = LOWER(TRIM(p_league_name))
               OR (LOWER(TRIM(p_league_name)) LIKE '%premier%' AND LOWER(name) LIKE '%premier%')
               OR (LOWER(TRIM(p_league_name)) LIKE '%champ%' AND LOWER(name) LIKE '%champ%')
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;
    END IF;

    -- Default to EPL if coach role and competition couldn't be resolved
    IF p_role = 'coach' AND v_comp_id IS NULL THEN
        v_comp_id := '11111111-1111-1111-1111-111111111111'::UUID;
    END IF;

    -- Check if user already exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_email));

    -- Upsert Profile — FIX: cast p_role to user_role ENUM
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        badge_number,
        is_verified,
        updated_at
    )
    VALUES (
        COALESCE(v_user_id, gen_random_uuid()),
        LOWER(TRIM(p_email)),
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_phone,
        p_role::user_role,
        p_badge_number,
        TRUE,
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = EXCLUDED.role,
        badge_number = COALESCE(EXCLUDED.badge_number, profiles.badge_number),
        is_verified = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- If role is 'referee', also upsert into public.referees table
    IF p_role = 'referee' THEN
        v_ref_name := TRIM(p_first_name || ' ' || COALESCE(p_last_name, ''));
        INSERT INTO public.referees (
            id,
            name,
            email,
            phone,
            status,
            badge_level,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            v_ref_name,
            LOWER(TRIM(p_email)),
            COALESCE(p_phone, '0700000000'),
            'Active',
            COALESCE(p_badge_number, 'FKF National Level 2'),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = COALESCE(EXCLUDED.phone, referees.phone),
            status = 'Active',
            badge_level = COALESCE(EXCLUDED.badge_level, referees.badge_level),
            updated_at = NOW();
    END IF;

    -- Handle Team Assignment for Coaches
    IF p_role = 'coach' AND p_team_name IS NOT NULL AND TRIM(p_team_name) <> '' THEN
        SELECT id, player_sheet_url INTO v_team_id, v_sheet_url
        FROM public.teams
        WHERE LOWER(name) = LOWER(TRIM(p_team_name))
           OR LOWER(short_name) = LOWER(TRIM(p_team_name))
           OR LOWER(REPLACE(name, ' FC', '')) = LOWER(REPLACE(TRIM(p_team_name), ' FC', ''))
        LIMIT 1;

        IF v_team_id IS NOT NULL THEN
            UPDATE public.teams
            SET
                coach_id = v_user_id,
                competition_id = COALESCE(v_comp_id, competition_id),
                status = 'approved',
                updated_at = NOW()
            WHERE id = v_team_id;
        ELSE
            v_team_id := gen_random_uuid();
            INSERT INTO public.teams (
                id,
                name,
                short_name,
                competition_id,
                coach_id,
                color_code,
                status,
                created_at,
                updated_at
            )
            VALUES (
                v_team_id,
                TRIM(p_team_name),
                UPPER(SUBSTRING(REGEXP_REPLACE(TRIM(p_team_name), '[^a-zA-Z0-9]', '', 'g'), 1, 3)),
                v_comp_id,
                v_user_id,
                CASE WHEN v_comp_id = '22222222-2222-2222-2222-222222222222'::UUID THEN '#2563EB' ELSE '#D4AF37' END,
                'approved',
                NOW(),
                NOW()
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'role', p_role,
        'team_id', v_team_id,
        'competition_id', v_comp_id,
        'team_sheet_url', v_sheet_url
    );
END;
$$;

-- ============================================================================
-- FIX 3a: fn_canonical_generate_state_hash — use extensions.digest()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_canonical_generate_state_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state_hash IS NULL OR NEW.state_hash = '' THEN
        NEW.state_hash := encode(extensions.digest(NEW.match_uid::text || ':' || NEW.outcome || ':' || NEW.home_score::text || ':' || NEW.away_score::text || ':' || NEW.events::text, 'sha256'), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX 3b: Create public.digest() wrapper so finalize_match_transaction resolves
-- This avoids re-creating the massive 500-line function — the wrapper makes
-- the unqualified digest() call find extensions.digest() via the public schema.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.digest(data text, type text)
RETURNS bytea AS $$
    SELECT extensions.digest(data, type);
$$ LANGUAGE sql IMMUTABLE STRICT SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.digest(data bytea, type text)
RETURNS bytea AS $$
    SELECT extensions.digest(data, type);
$$ LANGUAGE sql IMMUTABLE STRICT SECURITY DEFINER;
