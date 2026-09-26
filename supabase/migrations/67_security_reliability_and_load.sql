-- Migration 67: Close open writes, keep existing roles working, cut anonymous load.
-- Does not change dashboard behavior for president, admin, referee, journalist, or coach.

-- ---------------------------------------------------------------------------
-- Fixtures: drop the "any authenticated JWT" write. Keep the roles that
-- already operate matches.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Officials manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Allow manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Authenticated referee or admin updates fixture" ON public.fixtures;
DROP POLICY IF EXISTS "Unified officials update fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "President and admin manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Referees update fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Journalists update live fixtures" ON public.fixtures;

CREATE POLICY "President and admin manage fixtures"
  ON public.fixtures
  FOR ALL
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('admin', 'president'));

CREATE POLICY "Referees update fixtures"
  ON public.fixtures
  FOR UPDATE
  TO authenticated
  USING (public.get_auth_role() = 'referee')
  WITH CHECK (public.get_auth_role() = 'referee');

CREATE POLICY "Journalists update live fixtures"
  ON public.fixtures
  FOR UPDATE
  TO authenticated
  USING (public.get_auth_role() = 'journalist')
  WITH CHECK (public.get_auth_role() = 'journalist');

-- ---------------------------------------------------------------------------
-- Agent 0 schedule tables: president/admin only. Guests keep read access.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "base_fixtures writable by authenticated and service" ON public.base_fixtures;
DROP POLICY IF EXISTS "matchday_schedules writable by authenticated and service" ON public.matchday_schedules;
DROP POLICY IF EXISTS "President and admin manage base fixtures" ON public.base_fixtures;
DROP POLICY IF EXISTS "President and admin manage matchday schedules" ON public.matchday_schedules;

CREATE POLICY "President and admin manage base fixtures"
  ON public.base_fixtures
  FOR ALL
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('admin', 'president'));

CREATE POLICY "President and admin manage matchday schedules"
  ON public.matchday_schedules
  FOR ALL
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('admin', 'president'));

REVOKE ALL ON TABLE public.base_fixtures FROM anon;
REVOKE ALL ON TABLE public.matchday_schedules FROM anon;
GRANT SELECT ON TABLE public.base_fixtures TO anon;
GRANT SELECT ON TABLE public.matchday_schedules TO anon;

-- ---------------------------------------------------------------------------
-- Agent 0 logs: officials write, not the world.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "agent0_logs writable by everyone" ON public.agent0_logs;
DROP POLICY IF EXISTS "agent0_logs readable by everyone" ON public.agent0_logs;
DROP POLICY IF EXISTS "Officials read agent0 logs" ON public.agent0_logs;
DROP POLICY IF EXISTS "Officials write agent0 logs" ON public.agent0_logs;

CREATE POLICY "Officials read agent0 logs"
  ON public.agent0_logs
  FOR SELECT
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'president'));

CREATE POLICY "Officials write agent0 logs"
  ON public.agent0_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_auth_role() IN ('admin', 'president'));

REVOKE ALL ON TABLE public.agent0_logs FROM anon;

-- ---------------------------------------------------------------------------
-- Live match tables: the roles that already run a match, not every login.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth write match_live_states" ON public.match_live_states;
DROP POLICY IF EXISTS "Auth write match_live_events" ON public.match_live_events;
DROP POLICY IF EXISTS "Auth write match_live_audit_logs" ON public.match_live_audit_logs;
DROP POLICY IF EXISTS "Auth write referee_working_sets" ON public.referee_working_sets;
DROP POLICY IF EXISTS "Auth write canonical_permanent_results" ON public.canonical_permanent_results;
DROP POLICY IF EXISTS "Auth write finalization_commands" ON public.finalization_commands;

CREATE POLICY "Match officials write live states"
  ON public.match_live_states FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'));

CREATE POLICY "Match officials write live events"
  ON public.match_live_events FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'));

CREATE POLICY "Match officials write live audit"
  ON public.match_live_audit_logs FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'journalist', 'admin', 'president'));

CREATE POLICY "Match officials write working sets"
  ON public.referee_working_sets FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'admin', 'president'));

CREATE POLICY "Match officials write canonical results"
  ON public.canonical_permanent_results FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'admin', 'president'));

CREATE POLICY "Match officials write finalization commands"
  ON public.finalization_commands FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('referee', 'admin', 'president'))
  WITH CHECK (public.get_auth_role() IN ('referee', 'admin', 'president'));

-- ---------------------------------------------------------------------------
-- Referees pool and team logo writes.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Presidents and Admins manage referees" ON public.referees;
CREATE POLICY "Presidents and Admins manage referees"
  ON public.referees
  FOR ALL
  TO authenticated
  USING (public.get_auth_role() IN ('president', 'admin'))
  WITH CHECK (public.get_auth_role() IN ('president', 'admin'));

DROP POLICY IF EXISTS "Coaches and admins update team logo and info" ON public.teams;
CREATE POLICY "Coaches and admins update team logo and info"
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role() IN ('admin', 'president')
    OR (public.get_auth_role() = 'coach' AND coach_id = auth.uid())
  )
  WITH CHECK (
    public.get_auth_role() IN ('admin', 'president')
    OR (public.get_auth_role() = 'coach' AND coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can upload team-logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update team-logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete team-logos" ON storage.objects;
DROP POLICY IF EXISTS "Officials upload team-logos" ON storage.objects;
DROP POLICY IF EXISTS "Officials update team-logos" ON storage.objects;
DROP POLICY IF EXISTS "Officials delete team-logos" ON storage.objects;

CREATE POLICY "Officials upload team-logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-logos'
    AND public.get_auth_role() IN ('coach', 'admin', 'president')
  );

CREATE POLICY "Officials update team-logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'team-logos'
    AND public.get_auth_role() IN ('coach', 'admin', 'president')
  )
  WITH CHECK (
    bucket_id = 'team-logos'
    AND public.get_auth_role() IN ('coach', 'admin', 'president')
  );

CREATE POLICY "Officials delete team-logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-logos'
    AND public.get_auth_role() IN ('coach', 'admin', 'president')
  );

-- ---------------------------------------------------------------------------
-- News: guests see published rows. Journalists still see their own drafts
-- through the existing author policy, which we tighten the same way.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read news articles" ON public.news_articles;
DROP POLICY IF EXISTS "Journalists view own or published articles" ON public.news_articles;
CREATE POLICY "Journalists view own or published articles"
  ON public.news_articles
  FOR SELECT
  USING (
    (status = 'published' AND deleted_at IS NULL)
    OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
    OR public.get_auth_role() IN ('admin', 'president')
  );

-- Anonymous clients cannot read profile emails or phone numbers.
REVOKE SELECT ON TABLE public.profiles FROM anon;
GRANT SELECT (id, first_name, last_name, avatar_url, role, country) ON TABLE public.profiles TO anon;

-- ---------------------------------------------------------------------------
-- Caller checks for privileged functions. Triggers stay owner-executed.
-- ---------------------------------------------------------------------------
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

REVOKE ALL ON FUNCTION public.finalize_match_transaction(
    UUID, UUID, TEXT, INT, INT, UUID, TEXT, JSONB, TEXT, INT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_match_transaction(
    UUID, UUID, TEXT, INT, INT, UUID, TEXT, JSONB, TEXT, INT, TEXT, TEXT, TEXT
) TO authenticated, service_role;

-- One stats rebuild per transaction, not once per trigger in the same write.
CREATE OR REPLACE FUNCTION public.trigger_fn_recalculate_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('esn.player_stats_done', true) = '1' THEN
    RETURN NULL;
  END IF;
  PERFORM set_config('esn.player_stats_done', '1', true);
  PERFORM public.recalculate_all_player_stats();
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_all_player_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalculate_player_stats(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_player_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_player_stats(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.purge_potw_weekly_cycle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_votes_purged INT := 0;
    v_nominations_purged INT := 0;
BEGIN
    IF public.get_auth_role() NOT IN ('admin', 'president')
       AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    WITH deleted_votes AS (
        DELETE FROM public.player_of_the_week_votes
        RETURNING id
    )
    SELECT COUNT(*) INTO v_votes_purged FROM deleted_votes;

    WITH deleted_noms AS (
        DELETE FROM public.man_of_the_match_nominations
        RETURNING id
    )
    SELECT COUNT(*) INTO v_nominations_purged FROM deleted_noms;

    RETURN jsonb_build_object(
        'success', true,
        'purged_votes', v_votes_purged,
        'purged_nominations', v_nominations_purged,
        'purged_at', timezone('utc'::text, now())
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_finalize_potw_winners(
    p_matchweek INT,
    p_competition_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_votes INT := 0;
    v_winner RECORD;
    v_player_name TEXT := '';
    v_team_name TEXT := '';
    v_team_logo TEXT := '';
    v_share_percentage NUMERIC := 0.0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF public.get_auth_role() NOT IN ('admin', 'president')
       AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

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

    SELECT v.player_id, pl.team_id, COUNT(v.id) AS candidate_votes
    INTO v_winner
    FROM public.player_of_the_week_votes v
    JOIN public.players pl ON pl.id = v.player_id
    WHERE v.competition_id = p_competition_id AND v.matchweek = p_matchweek
    GROUP BY v.player_id, pl.team_id
    ORDER BY candidate_votes DESC
    LIMIT 1;

    IF v_winner.player_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Failed to resolve winning player.');
    END IF;

    SELECT COALESCE(pr.first_name || ' ' || pr.last_name, 'Player')
    INTO v_player_name
    FROM public.players pl
    LEFT JOIN public.profiles pr ON pl.profile_id = pr.id
    WHERE pl.id = v_winner.player_id;

    SELECT name, logo_url INTO v_team_name, v_team_logo
    FROM public.teams WHERE id = v_winner.team_id;

    v_share_percentage := ROUND(((v_winner.candidate_votes::numeric / v_total_votes::numeric) * 100.0), 1);

    UPDATE public.player_of_the_week_winners
    SET status = 'ARCHIVED'
    WHERE competition_id = p_competition_id AND status = 'ACTIVE';

    INSERT INTO public.player_of_the_week_winners (
        player_id, team_id, competition_id, matchweek, vote_count,
        vote_share_percentage, player_name, team_name, team_logo, status, awarded_at
    ) VALUES (
        v_winner.player_id, v_winner.team_id, p_competition_id, p_matchweek,
        v_winner.candidate_votes, v_share_percentage, v_player_name,
        v_team_name, v_team_logo, 'ACTIVE', v_now
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
$$;

REVOKE ALL ON FUNCTION public.purge_potw_weekly_cycle() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_finalize_potw_winners(INT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_potw_weekly_cycle() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_finalize_potw_winners(INT, UUID) TO authenticated, service_role;

-- One transaction for a season fixture replace. Same rows the client used to write.
CREATE OR REPLACE FUNCTION public.replace_competition_fixtures(p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base JSONB;
BEGIN
    IF public.get_auth_role() NOT IN ('admin', 'president')
       AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.matchday_schedules
    WHERE id <> '00000000-0000-0000-0000-000000000000'::uuid;

    DELETE FROM public.base_fixtures
    WHERE id <> '00000000-0000-0000-0000-000000000000'::uuid;

    DELETE FROM public.fixtures
    WHERE competition_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    );

    WITH inserted AS (
        INSERT INTO public.base_fixtures (
            competition_id, league, home_team_id, away_team_id, leg, match_sequence
        )
        SELECT
            competition_id,
            league,
            home_team_id,
            away_team_id,
            leg,
            match_sequence
        FROM jsonb_to_recordset(COALESCE(p_rows, '[]'::jsonb)) AS x(
            competition_id text,
            league text,
            home_team_id text,
            away_team_id text,
            leg int,
            match_sequence int
        )
        RETURNING id, competition_id, league, home_team_id, away_team_id, leg, match_sequence
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb) INTO v_base FROM inserted;

    INSERT INTO public.fixtures (
        id, competition_id, home_team_id, away_team_id,
        scheduled_time, status, score_home, score_away, matchday
    )
    SELECT
        (row->>'id')::uuid,
        (row->>'competition_id')::uuid,
        (row->>'home_team_id')::uuid,
        (row->>'away_team_id')::uuid,
        '2026-09-01T00:00:00.000Z'::timestamptz,
        'UPCOMING',
        0,
        0,
        1
    FROM jsonb_array_elements(v_base) AS row;

    RETURN jsonb_build_object('rows', v_base);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_competition_fixtures(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_competition_fixtures(JSONB) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_match_events_player_type
  ON public.match_events (player_id, type)
  WHERE player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fixtures_competition_matchday
  ON public.fixtures (competition_id, matchday, scheduled_time);
