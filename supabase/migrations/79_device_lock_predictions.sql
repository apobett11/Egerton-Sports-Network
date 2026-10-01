-- Device lock for the prediction feature.
-- anonymous_devices stays the basic table: existing device_id plus a favourite
-- team that cannot be changed. The matchday slip (favorite_matches and
-- interaction_history) stays for announcements and saved fixtures.
-- Prediction slips, banter, and reactions are separate tables. A device reads
-- its own rows through a secret hash. Open USING (true) policies are removed.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.anonymous_devices
    ADD COLUMN IF NOT EXISTS favorite_team_label TEXT,
    ADD COLUMN IF NOT EXISTS device_secret_hash TEXT,
    ADD COLUMN IF NOT EXISTS device_platform TEXT,
    ADD COLUMN IF NOT EXISTS device_label TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_anonymous_devices_secret_hash
    ON public.anonymous_devices (device_secret_hash)
    WHERE device_secret_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anon_devices_last_seen
    ON public.anonymous_devices (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_anon_devices_favorite_team
    ON public.anonymous_devices (favorite_team_id);

CREATE INDEX IF NOT EXISTS idx_anon_devices_created
    ON public.anonymous_devices (created_at DESC);

-- A favourite club is written once. A later update cannot replace it.
-- Announcement writes merge into interaction_history so the matchday slip stays.
CREATE OR REPLACE FUNCTION public.protect_anonymous_device_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.favorite_team_id IS NOT NULL
       AND NEW.favorite_team_id IS DISTINCT FROM OLD.favorite_team_id THEN
        NEW.favorite_team_id := OLD.favorite_team_id;
    END IF;

    IF OLD.favorite_team_label IS NOT NULL
       AND btrim(OLD.favorite_team_label) <> ''
       AND NEW.favorite_team_label IS DISTINCT FROM OLD.favorite_team_label THEN
        NEW.favorite_team_label := OLD.favorite_team_label;
    END IF;

    IF NEW.favorite_team_id IS NOT NULL
       AND (NEW.favorite_team_label IS NULL OR btrim(NEW.favorite_team_label) = '') THEN
        SELECT name INTO NEW.favorite_team_label
        FROM public.teams
        WHERE id = NEW.favorite_team_id;
    END IF;

    IF NEW.favorite_matches IS NULL AND OLD.favorite_matches IS NOT NULL THEN
        NEW.favorite_matches := OLD.favorite_matches;
    END IF;

    IF NEW.device_secret_hash IS NULL AND OLD.device_secret_hash IS NOT NULL THEN
        NEW.device_secret_hash := OLD.device_secret_hash;
    END IF;

    IF NEW.device_secret_hash IS DISTINCT FROM OLD.device_secret_hash
       AND OLD.device_secret_hash IS NOT NULL THEN
        NEW.device_secret_hash := OLD.device_secret_hash;
    END IF;

    IF NEW.interaction_history IS NULL THEN
        NEW.interaction_history := OLD.interaction_history;
    ELSIF OLD.interaction_history IS NOT NULL THEN
        NEW.interaction_history := OLD.interaction_history || NEW.interaction_history;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_anonymous_device_row ON public.anonymous_devices;
CREATE TRIGGER trg_protect_anonymous_device_row
    BEFORE UPDATE ON public.anonymous_devices
    FOR EACH ROW EXECUTE FUNCTION public.protect_anonymous_device_row();

CREATE OR REPLACE FUNCTION public.device_secret_matches(p_device_id UUID, p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.anonymous_devices
        WHERE device_id = p_device_id
          AND p_secret IS NOT NULL
          AND char_length(p_secret) >= 16
          AND device_secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
    );
$$;

REVOKE ALL ON FUNCTION public.device_secret_matches(UUID, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.register_or_check_in_device(
    p_device_id UUID,
    p_secret TEXT,
    p_platform TEXT DEFAULT NULL,
    p_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
    v_row public.anonymous_devices%ROWTYPE;
BEGIN
    IF p_device_id IS NULL OR p_secret IS NULL OR char_length(p_secret) < 16 THEN
        RAISE EXCEPTION 'A device secret is required';
    END IF;

    v_hash := encode(extensions.digest(p_secret, 'sha256'), 'hex');

    SELECT * INTO v_row
    FROM public.anonymous_devices
    WHERE device_id = p_device_id;

    IF NOT FOUND THEN
        INSERT INTO public.anonymous_devices (
            device_id, device_secret_hash, device_platform, device_label, last_seen_at
        ) VALUES (
            p_device_id, v_hash, left(p_platform, 80), left(p_label, 120), NOW()
        )
        RETURNING * INTO v_row;
    ELSIF v_row.device_secret_hash IS NULL THEN
        UPDATE public.anonymous_devices
        SET device_secret_hash = v_hash,
            device_platform = COALESCE(left(p_platform, 80), device_platform),
            device_label = COALESCE(left(p_label, 120), device_label),
            last_seen_at = NOW()
        WHERE device_id = p_device_id
          AND device_secret_hash IS NULL
        RETURNING * INTO v_row;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'This device is already locked to another phone';
        END IF;
    ELSIF v_row.device_secret_hash IS DISTINCT FROM v_hash THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    ELSE
        UPDATE public.anonymous_devices
        SET device_platform = COALESCE(left(p_platform, 80), device_platform),
            device_label = COALESCE(left(p_label, 120), device_label),
            last_seen_at = NOW()
        WHERE device_id = p_device_id
        RETURNING * INTO v_row;
    END IF;

    RETURN jsonb_build_object(
        'device_id', v_row.device_id,
        'favorite_team_id', v_row.favorite_team_id,
        'favorite_team_label', v_row.favorite_team_label,
        'has_completed_onboarding', v_row.has_completed_onboarding,
        'favorite_matches', v_row.favorite_matches,
        'interaction_history', v_row.interaction_history,
        'last_seen_at', v_row.last_seen_at,
        'created_at', v_row.created_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_device_copy(
    p_candidates UUID[],
    p_secret TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT;
    v_id UUID;
BEGIN
    IF p_secret IS NULL OR char_length(p_secret) < 16 OR p_candidates IS NULL THEN
        RETURN NULL;
    END IF;
    v_hash := encode(extensions.digest(p_secret, 'sha256'), 'hex');
    SELECT device_id INTO v_id
    FROM public.anonymous_devices
    WHERE device_id = ANY (p_candidates)
      AND device_secret_hash = v_hash
    LIMIT 1;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_device_favorite_team(
    p_device_id UUID,
    p_secret TEXT,
    p_team_id UUID DEFAULT NULL,
    p_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_row public.anonymous_devices%ROWTYPE;
    v_team UUID;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;

    SELECT * INTO v_row FROM public.anonymous_devices WHERE device_id = p_device_id;

    IF v_row.favorite_team_id IS NOT NULL
       OR (v_row.favorite_team_label IS NOT NULL AND btrim(v_row.favorite_team_label) <> '') THEN
        RETURN jsonb_build_object(
            'device_id', v_row.device_id,
            'favorite_team_id', v_row.favorite_team_id,
            'favorite_team_label', v_row.favorite_team_label,
            'has_completed_onboarding', TRUE
        );
    END IF;

    v_team := p_team_id;
    IF v_team IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.teams WHERE id = v_team) THEN
        v_team := NULL;
    END IF;

    UPDATE public.anonymous_devices
    SET favorite_team_id = v_team,
        favorite_team_label = NULLIF(btrim(p_label), ''),
        has_completed_onboarding = TRUE,
        last_seen_at = NOW()
    WHERE device_id = p_device_id
      AND favorite_team_id IS NULL
      AND (favorite_team_label IS NULL OR btrim(favorite_team_label) = '')
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'device_id', v_row.device_id,
        'favorite_team_id', v_row.favorite_team_id,
        'favorite_team_label', v_row.favorite_team_label,
        'has_completed_onboarding', v_row.has_completed_onboarding
    );
END;
$$;

-- Prediction slips. One row per device and match. Insert only.
CREATE TABLE IF NOT EXISTS public.match_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    device_id UUID NOT NULL REFERENCES public.anonymous_devices(device_id) ON DELETE CASCADE,
    prediction TEXT NOT NULL CHECK (prediction IN ('1', 'X', '2')),
    matchday INT NOT NULL DEFAULT 1,
    cycle_id TEXT NOT NULL DEFAULT '2026-epl-season',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_match_predictions_device_created
    ON public.match_predictions (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match_pred
    ON public.match_predictions (match_id, prediction);

CREATE TABLE IF NOT EXISTS public.match_consensus_cache (
    match_id UUID PRIMARY KEY,
    votes_home INT NOT NULL DEFAULT 0,
    votes_draw INT NOT NULL DEFAULT 0,
    votes_away INT NOT NULL DEFAULT 0,
    total_votes INT NOT NULL DEFAULT 0,
    home_pct INT NOT NULL DEFAULT 0,
    draw_pct INT NOT NULL DEFAULT 0,
    away_pct INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.reject_prediction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.prediction IS DISTINCT FROM OLD.prediction
       OR NEW.match_id IS DISTINCT FROM OLD.match_id
       OR NEW.device_id IS DISTINCT FROM OLD.device_id
       OR NEW.matchday IS DISTINCT FROM OLD.matchday THEN
        RAISE EXCEPTION 'A locked slip cannot be changed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_prediction_change ON public.match_predictions;
CREATE TRIGGER trg_reject_prediction_change
    BEFORE UPDATE ON public.match_predictions
    FOR EACH ROW EXECUTE FUNCTION public.reject_prediction_change();

CREATE OR REPLACE FUNCTION public.reject_late_prediction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_kick TIMESTAMPTZ;
    v_close TIMESTAMPTZ;
BEGIN
    SELECT scheduled_time INTO v_kick
    FROM public.fixtures
    WHERE id = NEW.match_id;

    IF v_kick IS NOT NULL THEN
        v_close := (((v_kick AT TIME ZONE 'Africa/Nairobi')::date - 1) + TIME '19:00')
            AT TIME ZONE 'Africa/Nairobi';
        IF NOW() >= v_close THEN
            RAISE EXCEPTION 'Voting is closed for this matchday';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_late_prediction ON public.match_predictions;
CREATE TRIGGER trg_reject_late_prediction
    BEFORE INSERT ON public.match_predictions
    FOR EACH ROW EXECUTE FUNCTION public.reject_late_prediction();

CREATE OR REPLACE FUNCTION public.sync_match_consensus_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_id UUID;
    v_home INT;
    v_draw INT;
    v_away INT;
    v_total INT;
    v_home_pct INT := 0;
    v_draw_pct INT := 0;
    v_away_pct INT := 0;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_match_id := OLD.match_id;
    ELSE
        v_match_id := NEW.match_id;
    END IF;

    SELECT
        COUNT(*) FILTER (WHERE prediction = '1'),
        COUNT(*) FILTER (WHERE prediction = 'X'),
        COUNT(*) FILTER (WHERE prediction = '2'),
        COUNT(*)
    INTO v_home, v_draw, v_away, v_total
    FROM public.match_predictions
    WHERE match_id = v_match_id;

    IF v_total > 0 THEN
        v_home_pct := ROUND((v_home::NUMERIC / v_total::NUMERIC) * 100);
        v_draw_pct := ROUND((v_draw::NUMERIC / v_total::NUMERIC) * 100);
        v_away_pct := 100 - (v_home_pct + v_draw_pct);
    END IF;

    INSERT INTO public.match_consensus_cache (
        match_id, votes_home, votes_draw, votes_away, total_votes,
        home_pct, draw_pct, away_pct, updated_at
    ) VALUES (
        v_match_id, v_home, v_draw, v_away, v_total,
        v_home_pct, v_draw_pct, v_away_pct, NOW()
    )
    ON CONFLICT (match_id) DO UPDATE SET
        votes_home = EXCLUDED.votes_home,
        votes_draw = EXCLUDED.votes_draw,
        votes_away = EXCLUDED.votes_away,
        total_votes = EXCLUDED.total_votes,
        home_pct = EXCLUDED.home_pct,
        draw_pct = EXCLUDED.draw_pct,
        away_pct = EXCLUDED.away_pct,
        updated_at = NOW();

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_match_consensus ON public.match_predictions;
CREATE TRIGGER trg_sync_match_consensus
    AFTER INSERT OR DELETE ON public.match_predictions
    FOR EACH ROW EXECUTE FUNCTION public.sync_match_consensus_cache();

CREATE OR REPLACE FUNCTION public.get_own_match_predictions(
    p_device_id UUID,
    p_secret TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
    v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RETURN '[]'::JSONB;
    END IF;
    RETURN COALESCE((
        SELECT jsonb_agg(row_to_json(page))
        FROM (
            SELECT match_id, prediction, matchday, updated_at
            FROM public.match_predictions
            WHERE device_id = p_device_id
            ORDER BY created_at DESC
            LIMIT v_limit OFFSET v_offset
        ) page
    ), '[]'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.cast_match_prediction(
    p_device_id UUID,
    p_secret TEXT,
    p_match_id UUID,
    p_prediction TEXT,
    p_matchday INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;
    IF p_prediction NOT IN ('1', 'X', '2') THEN
        RAISE EXCEPTION 'Pick must be 1, X, or 2';
    END IF;

    INSERT INTO public.match_predictions (match_id, device_id, prediction, matchday)
    VALUES (p_match_id, p_device_id, p_prediction, GREATEST(COALESCE(p_matchday, 1), 1))
    ON CONFLICT (match_id, device_id) DO NOTHING;

    RETURN (
        SELECT jsonb_build_object(
            'match_id', match_id,
            'prediction', prediction,
            'matchday', matchday
        )
        FROM public.match_predictions
        WHERE match_id = p_match_id AND device_id = p_device_id
    );
END;
$$;

-- Banter. The public feed is readable. Writes require the device secret.
CREATE TABLE IF NOT EXISTS public.banter_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID,
    league_id UUID,
    device_id UUID REFERENCES public.anonymous_devices(device_id) ON DELETE SET NULL,
    author_handle TEXT NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'user' CHECK (author_type IN ('user', 'journalist', 'admin', 'seed')),
    author_badge TEXT,
    content TEXT NOT NULL CHECK (char_length(btrim(content)) > 0 AND char_length(content) <= 280),
    source_type TEXT NOT NULL DEFAULT 'user' CHECK (source_type IN ('user', 'journalist', 'seed', 'admin')),
    reaction_fire_count INT NOT NULL DEFAULT 0,
    reaction_clown_count INT NOT NULL DEFAULT 0,
    reaction_skull_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    impressions_count INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    repost_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'deleted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banter_posts_feed
    ON public.banter_posts (created_at DESC)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_banter_posts_device
    ON public.banter_posts (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banter_posts_hot
    ON public.banter_posts ((reaction_fire_count + comment_count) DESC, created_at DESC)
    WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.banter_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.anonymous_devices(device_id) ON DELETE SET NULL,
    author_handle TEXT NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'user',
    content TEXT NOT NULL CHECK (char_length(btrim(content)) > 0 AND char_length(content) <= 200),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banter_comments_post
    ON public.banter_comments (post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.banter_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.anonymous_devices(device_id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('fire', 'clown', 'skull')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, device_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_banter_reactions_device
    ON public.banter_reactions (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banter_reactions_post_type
    ON public.banter_reactions (post_id, reaction_type);

CREATE OR REPLACE FUNCTION public.sync_banter_reaction_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'fire' THEN
            UPDATE public.banter_posts SET reaction_fire_count = reaction_fire_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.reaction_type = 'clown' THEN
            UPDATE public.banter_posts SET reaction_clown_count = reaction_clown_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.reaction_type = 'skull' THEN
            UPDATE public.banter_posts SET reaction_skull_count = reaction_skull_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'fire' THEN
            UPDATE public.banter_posts SET reaction_fire_count = GREATEST(0, reaction_fire_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.reaction_type = 'clown' THEN
            UPDATE public.banter_posts SET reaction_clown_count = GREATEST(0, reaction_clown_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.reaction_type = 'skull' THEN
            UPDATE public.banter_posts SET reaction_skull_count = GREATEST(0, reaction_skull_count - 1) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_banter_reactions ON public.banter_reactions;
CREATE TRIGGER trg_sync_banter_reactions
    AFTER INSERT OR DELETE ON public.banter_reactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_banter_reaction_count();

CREATE OR REPLACE FUNCTION public.increment_banter_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.banter_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_comment_count ON public.banter_comments;
CREATE TRIGGER trg_increment_comment_count
    AFTER INSERT ON public.banter_comments
    FOR EACH ROW EXECUTE FUNCTION public.increment_banter_comment_count();

CREATE OR REPLACE FUNCTION public.post_device_banter(
    p_device_id UUID,
    p_secret TEXT,
    p_post_id UUID,
    p_match_id UUID,
    p_league_id UUID,
    p_author_handle TEXT,
    p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;
    IF p_content IS NULL OR char_length(btrim(p_content)) = 0 OR char_length(p_content) > 280 THEN
        RAISE EXCEPTION 'Take must be 1 to 280 characters';
    END IF;
    v_id := COALESCE(p_post_id, gen_random_uuid());
    INSERT INTO public.banter_posts (
        id, match_id, league_id, device_id, author_handle, author_type, content, source_type, status
    ) VALUES (
        v_id, p_match_id, p_league_id, p_device_id, left(p_author_handle, 80), 'user', btrim(p_content), 'user', 'active'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.post_device_banter_comment(
    p_device_id UUID,
    p_secret TEXT,
    p_post_id UUID,
    p_author_handle TEXT,
    p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID := gen_random_uuid();
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;
    IF p_content IS NULL OR char_length(btrim(p_content)) = 0 OR char_length(p_content) > 200 THEN
        RAISE EXCEPTION 'Comment must be 1 to 200 characters';
    END IF;
    INSERT INTO public.banter_comments (id, post_id, device_id, author_handle, content, status)
    VALUES (v_id, p_post_id, p_device_id, left(p_author_handle, 80), btrim(p_content), 'active');
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_device_banter_reaction(
    p_device_id UUID,
    p_secret TEXT,
    p_post_id UUID,
    p_reaction_type TEXT,
    p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;
    IF p_reaction_type NOT IN ('fire', 'clown', 'skull') THEN
        RAISE EXCEPTION 'Unknown reaction';
    END IF;
    IF p_active THEN
        INSERT INTO public.banter_reactions (post_id, device_id, reaction_type)
        VALUES (p_post_id, p_device_id, p_reaction_type)
        ON CONFLICT (post_id, device_id, reaction_type) DO NOTHING;
    ELSE
        DELETE FROM public.banter_reactions
        WHERE post_id = p_post_id
          AND device_id = p_device_id
          AND reaction_type = p_reaction_type;
    END IF;
    RETURN p_active;
END;
$$;

CREATE OR REPLACE FUNCTION public.device_activity_counts()
RETURNS TABLE (
    total_devices BIGINT,
    active_today BIGINT,
    active_week BIGINT,
    active_month BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role::text IN ('admin', 'superadmin', 'president')
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE last_seen_at >= date_trunc('day', NOW()))::BIGINT,
        COUNT(*) FILTER (WHERE last_seen_at >= NOW() - INTERVAL '7 days')::BIGINT,
        COUNT(*) FILTER (WHERE last_seen_at >= NOW() - INTERVAL '30 days')::BIGINT
    FROM public.anonymous_devices;
END;
$$;

-- Do not drop a phone that already locked a club or a prediction slip.
CREATE OR REPLACE FUNCTION public.prune_stale_anonymous_devices(p_days INT DEFAULT 30)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM public.anonymous_devices d
    WHERE d.last_seen_at < (NOW() - (p_days || ' days')::INTERVAL)
      AND d.has_completed_onboarding = FALSE
      AND d.favorite_team_id IS NULL
      AND (d.favorite_team_label IS NULL OR btrim(d.favorite_team_label) = '')
      AND NOT EXISTS (
          SELECT 1 FROM public.match_predictions mp WHERE mp.device_id = d.device_id
      );
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_consensus_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banter_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banter_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous device registration" ON public.anonymous_devices;
DROP POLICY IF EXISTS "Allow devices to access their own data" ON public.anonymous_devices;
DROP POLICY IF EXISTS "Allow devices to update their own data" ON public.anonymous_devices;
DROP POLICY IF EXISTS "Allow anon update own prediction" ON public.match_predictions;
DROP POLICY IF EXISTS "Allow anon read predictions" ON public.match_predictions;
DROP POLICY IF EXISTS "Allow anon insert own prediction" ON public.match_predictions;
DROP POLICY IF EXISTS "Allow anon select own device" ON public.anonymous_devices;
DROP POLICY IF EXISTS "Allow anon register device" ON public.anonymous_devices;
DROP POLICY IF EXISTS "Allow anon update own last_seen" ON public.anonymous_devices;

DROP POLICY IF EXISTS "Staff read device directory" ON public.anonymous_devices;
CREATE POLICY "Staff read device directory"
    ON public.anonymous_devices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role::text IN ('admin', 'superadmin', 'president')
        )
    );

DROP POLICY IF EXISTS "Public read consensus" ON public.match_consensus_cache;
CREATE POLICY "Public read consensus"
    ON public.match_consensus_cache
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public read active banter" ON public.banter_posts;
CREATE POLICY "Public read active banter"
    ON public.banter_posts
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

DROP POLICY IF EXISTS "Public read active comments" ON public.banter_comments;
CREATE POLICY "Public read active comments"
    ON public.banter_comments
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

GRANT EXECUTE ON FUNCTION public.register_or_check_in_device(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_device_copy(UUID[], TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_device_favorite_team(UUID, TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_match_predictions(UUID, TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cast_match_prediction(UUID, TEXT, UUID, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_device_banter(UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_device_banter_comment(UUID, TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_device_banter_reaction(UUID, TEXT, UUID, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_activity_counts() TO authenticated;

-- Matchday slip used by announcements and saved fixtures. Secret required.
CREATE OR REPLACE FUNCTION public.set_device_matchday_slip(
    p_device_id UUID,
    p_secret TEXT,
    p_favorite_matches JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.anonymous_devices%ROWTYPE;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;
    IF jsonb_typeof(p_favorite_matches) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Matchday slip must be a list';
    END IF;

    UPDATE public.anonymous_devices
    SET favorite_matches = p_favorite_matches,
        interaction_history = COALESCE(interaction_history, '{}'::JSONB) || jsonb_build_object('favorite_matches', p_favorite_matches),
        last_seen_at = NOW()
    WHERE device_id = p_device_id
    RETURNING * INTO v_row;

    RETURN jsonb_build_object('favorite_matches', v_row.favorite_matches);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_device_announcement_reads(
    p_device_id UUID,
    p_secret TEXT,
    p_announcements JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.anonymous_devices%ROWTYPE;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;

    UPDATE public.anonymous_devices
    SET announcements = p_announcements,
        interaction_history = COALESCE(interaction_history, '{}'::JSONB) || jsonb_build_object('announcements', p_announcements),
        last_seen_at = NOW()
    WHERE device_id = p_device_id
    RETURNING * INTO v_row;

    RETURN jsonb_build_object('announcements', v_row.announcements);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_device_matchday_slip(UUID, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_device_announcement_reads(UUID, TEXT, JSONB) TO anon, authenticated;
