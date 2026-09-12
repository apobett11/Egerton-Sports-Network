-- Migration 45: Player of the Week (POTW) System Foundation
-- Description: Man of the Match nominations, anonymous device-verified votes, historical winners, RLS, and lifecycle routines.

-- ============================================================================
-- 1. TABLE: man_of_the_match_nominations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.man_of_the_match_nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_motm_fixture UNIQUE (fixture_id)
);

CREATE INDEX IF NOT EXISTS idx_motm_fixture ON public.man_of_the_match_nominations(fixture_id);
CREATE INDEX IF NOT EXISTS idx_motm_competition_created ON public.man_of_the_match_nominations(competition_id, created_at);
CREATE INDEX IF NOT EXISTS idx_motm_player ON public.man_of_the_match_nominations(player_id);

-- ============================================================================
-- 2. TABLE: player_of_the_week_votes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.player_of_the_week_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    matchweek INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_device_competition_matchweek UNIQUE (device_id, competition_id, matchweek)
);

CREATE INDEX IF NOT EXISTS idx_potw_votes_tally ON public.player_of_the_week_votes(competition_id, matchweek, player_id);
CREATE INDEX IF NOT EXISTS idx_potw_votes_device ON public.player_of_the_week_votes(device_id);

-- ============================================================================
-- 3. TABLE: player_of_the_week_winners
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.player_of_the_week_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    matchweek INT NOT NULL,
    season_id UUID,
    vote_count INT NOT NULL DEFAULT 0,
    vote_share_percentage NUMERIC NOT NULL DEFAULT 0.0,
    player_name TEXT,
    team_name TEXT,
    team_logo TEXT,
    stats_summary JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_potw_winner_comp_week UNIQUE (competition_id, matchweek)
);

CREATE INDEX IF NOT EXISTS idx_potw_winners_comp_week ON public.player_of_the_week_winners(competition_id, matchweek);
CREATE INDEX IF NOT EXISTS idx_potw_winners_status ON public.player_of_the_week_winners(status, competition_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.man_of_the_match_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_of_the_week_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_of_the_week_winners ENABLE ROW LEVEL SECURITY;

-- 4.1 man_of_the_match_nominations: Public Read, Authenticated/Referees/Anon Upsert
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'man_of_the_match_nominations' AND policyname = 'Public read motm nominations'
    ) THEN
        CREATE POLICY "Public read motm nominations"
        ON public.man_of_the_match_nominations FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'man_of_the_match_nominations' AND policyname = 'Officials insert motm nominations'
    ) THEN
        CREATE POLICY "Officials insert motm nominations"
        ON public.man_of_the_match_nominations FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'man_of_the_match_nominations' AND policyname = 'Officials update motm nominations'
    ) THEN
        CREATE POLICY "Officials update motm nominations"
        ON public.man_of_the_match_nominations FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- 4.2 player_of_the_week_votes: Public Insert with Device ID; Restricted SELECT
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_of_the_week_votes' AND policyname = 'Public insert potw votes'
    ) THEN
        CREATE POLICY "Public insert potw votes"
        ON public.player_of_the_week_votes FOR INSERT
        TO anon, authenticated
        WITH CHECK (device_id IS NOT NULL);
    END IF;
END $$;

-- RESTRICT SELECT:
-- 1. Admins have unrestricted access to full unvarnished tallies.
-- 2. Non-admins/public can ONLY read rows matching their own device_id (preventing premature tally scraping before Tuesday 5:00 PM).
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_of_the_week_votes' AND policyname = 'Restricted select on potw votes'
    ) THEN
        CREATE POLICY "Restricted select on potw votes"
        ON public.player_of_the_week_votes FOR SELECT
        TO anon, authenticated
        USING (
            -- SuperAdmins/Admins can see all
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role::text IN ('admin', 'superadmin')
            )
            -- Or voter checking their own device vote
            OR device_id = NULLIF(current_setting('request.headers', true)::json->>'x-device-id', '')::UUID
        );
    END IF;
END $$;

-- 4.3 player_of_the_week_winners: Public Read, Admin Manage
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_of_the_week_winners' AND policyname = 'Public read potw winners'
    ) THEN
        CREATE POLICY "Public read potw winners"
        ON public.player_of_the_week_winners FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'player_of_the_week_winners' AND policyname = 'Admins manage potw winners'
    ) THEN
        CREATE POLICY "Admins manage potw winners"
        ON public.player_of_the_week_winners FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role::text IN ('admin', 'superadmin')
            )
        );
    END IF;
END $$;

-- ============================================================================
-- 5. IDEMPOTENT MAINTENANCE & BUSINESS FUNCTIONS
-- ============================================================================

-- 5.1 purge_potw_weekly_cycle: Friday 11:00 AM Reset Routine
-- Purges active transient nominations and votes while strictly preserving player_of_the_week_winners
CREATE OR REPLACE FUNCTION public.purge_potw_weekly_cycle()
RETURNS JSONB AS $$
DECLARE
    v_votes_purged INT := 0;
    v_nominations_purged INT := 0;
BEGIN
    -- 1. Purge active votes
    WITH deleted_votes AS (
        DELETE FROM public.player_of_the_week_votes
        RETURNING id
    )
    SELECT COUNT(*) INTO v_votes_purged FROM deleted_votes;

    -- 2. Purge active nominations
    WITH deleted_noms AS (
        DELETE FROM public.man_of_the_match_nominations
        RETURNING id
    )
    SELECT COUNT(*) INTO v_nominations_purged FROM deleted_noms;

    -- Note: player_of_the_week_winners is strictly preserved!

    RETURN jsonb_build_object(
        'success', true,
        'purged_votes', v_votes_purged,
        'purged_nominations', v_nominations_purged,
        'purged_at', timezone('utc'::text, now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 fn_finalize_potw_winners: Tuesday 5:00 PM Finalization
-- Computes the winner from votes for a competition & matchweek and writes to player_of_the_week_winners
CREATE OR REPLACE FUNCTION public.fn_finalize_potw_winners(
    p_matchweek INT,
    p_competition_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_total_votes INT := 0;
    v_winner RECORD;
    v_player_name TEXT := '';
    v_team_name TEXT := '';
    v_team_logo TEXT := '';
    v_share_percentage NUMERIC := 0.0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Calculate total votes cast in this competition and matchweek
    SELECT COUNT(*) INTO v_total_votes
    FROM public.player_of_the_week_votes
    WHERE competition_id = p_competition_id AND matchweek = p_matchweek;

    IF v_total_votes = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No votes found for this matchweek and competition.',
            'matchweek', p_matchweek,
            'competition_id', p_competition_id
        );
    END IF;

    -- 2. Find leading candidate by vote count
    SELECT 
        v.player_id,
        pl.team_id,
        COUNT(v.id) AS candidate_votes
    INTO v_winner
    FROM public.player_of_the_week_votes v
    JOIN public.players pl ON pl.id = v.player_id
    WHERE v.competition_id = p_competition_id AND v.matchweek = p_matchweek
    GROUP BY v.player_id, pl.team_id
    ORDER BY candidate_votes DESC
    LIMIT 1;

    IF v_winner.player_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Failed to resolve winning player.'
        );
    END IF;

    -- 3. Resolve metadata (player name, team name, logo)
    SELECT COALESCE(pr.first_name || ' ' || pr.last_name, 'Player')
    INTO v_player_name
    FROM public.players pl
    LEFT JOIN public.profiles pr ON pl.profile_id = pr.id
    WHERE pl.id = v_winner.player_id;

    SELECT name, logo_url
    INTO v_team_name, v_team_logo
    FROM public.teams
    WHERE id = v_winner.team_id;

    -- Calculate percentage
    v_share_percentage := ROUND(((v_winner.candidate_votes::numeric / v_total_votes::numeric) * 100.0), 1);

    -- 4. Mark existing active winners for this competition as ARCHIVED
    UPDATE public.player_of_the_week_winners
    SET status = 'ARCHIVED'
    WHERE competition_id = p_competition_id AND status = 'ACTIVE';

    -- 5. Insert or update winner record
    INSERT INTO public.player_of_the_week_winners (
        player_id,
        team_id,
        competition_id,
        matchweek,
        vote_count,
        vote_share_percentage,
        player_name,
        team_name,
        team_logo,
        status,
        awarded_at
    ) VALUES (
        v_winner.player_id,
        v_winner.team_id,
        p_competition_id,
        p_matchweek,
        v_winner.candidate_votes,
        v_share_percentage,
        v_player_name,
        v_team_name,
        v_team_logo,
        'ACTIVE',
        v_now
    )
    ON CONFLICT (competition_id, matchweek) DO UPDATE SET
        player_id = EXCLUDED.player_id,
        team_id = EXCLUDED.team_id,
        vote_count = EXCLUDED.vote_count,
        vote_share_percentage = EXCLUDED.vote_share_percentage,
        player_name = EXCLUDED.player_name,
        team_name = EXCLUDED.team_name,
        team_logo = EXCLUDED.team_logo,
        status = 'ACTIVE',
        awarded_at = EXCLUDED.awarded_at;

    RETURN jsonb_build_object(
        'success', true,
        'matchweek', p_matchweek,
        'competition_id', p_competition_id,
        'winner_player_id', v_winner.player_id,
        'winner_name', v_player_name,
        'team_name', v_team_name,
        'vote_count', v_winner.candidate_votes,
        'total_votes', v_total_votes,
        'vote_share_percentage', v_share_percentage,
        'awarded_at', v_now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Helper function for checking device vote status safely
CREATE OR REPLACE FUNCTION public.has_device_voted_potw(
    p_device_id UUID,
    p_competition_id UUID,
    p_matchweek INT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.player_of_the_week_votes
        WHERE device_id = p_device_id 
          AND competition_id = p_competition_id 
          AND matchweek = p_matchweek
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON TABLE public.man_of_the_match_nominations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.player_of_the_week_votes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.player_of_the_week_winners TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.purge_potw_weekly_cycle() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_finalize_potw_winners(INT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_device_voted_potw(UUID, UUID, INT) TO anon, authenticated, service_role;
