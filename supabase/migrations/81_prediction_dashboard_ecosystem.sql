-- Prediction dashboard ecosystem.
-- One device, one favourite club, one step. Slips are per device and per
-- matchday date. Team vote tallies are maintained incrementally so listing
-- a match never walks every prediction row (no N+1, no COUNT on the hot path).
-- Existing anonymous_devices + match_predictions stay. These tables sit beside
-- them so a season of slips can grow without widening the device row.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Device session: onboarding and weekend lock. One row per phone.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_device_sessions (
    device_id UUID PRIMARY KEY REFERENCES public.anonymous_devices(device_id) ON DELETE CASCADE,
    favorite_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    favorite_team_label TEXT,
    fanatic_answered BOOLEAN NOT NULL DEFAULT FALSE,
    football_fanatic TEXT CHECK (football_fanatic IS NULL OR football_fanatic IN ('yes', 'no')),
    step TEXT NOT NULL DEFAULT 'fanatic'
        CHECK (step IN ('fanatic', 'club', 'derby', 'picks', 'dashboard')),
    slip_list_open BOOLEAN NOT NULL DEFAULT FALSE,
    active_day_key DATE,
    locked_saturday DATE,
    locked_sunday DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_sessions_team
    ON public.prediction_device_sessions (favorite_team_id)
    WHERE favorite_team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prediction_sessions_weekend
    ON public.prediction_device_sessions (locked_saturday, locked_sunday);

CREATE INDEX IF NOT EXISTS idx_prediction_sessions_updated
    ON public.prediction_device_sessions (updated_at DESC);

-- ---------------------------------------------------------------------------
-- Slip headers: one row per device and matchday date. Future slips stay here
-- instead of stuffing JSON onto anonymous_devices.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.anonymous_devices(device_id) ON DELETE CASCADE,
    matchday INT NOT NULL DEFAULT 1,
    day_key DATE NOT NULL,
    day_label TEXT NOT NULL CHECK (day_label IN ('Saturday', 'Sunday')),
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'locked', 'settled')),
    picks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, day_key)
);

CREATE INDEX IF NOT EXISTS idx_prediction_slips_device_day
    ON public.prediction_slips (device_id, day_key DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_slips_matchday
    ON public.prediction_slips (matchday, day_key DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_slips_status
    ON public.prediction_slips (device_id, status, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Per-team, per-match vote cache. Written by trigger. Read in one IN query.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_team_match_votes (
    match_id UUID NOT NULL,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    votes_home INT NOT NULL DEFAULT 0,
    votes_draw INT NOT NULL DEFAULT 0,
    votes_away INT NOT NULL DEFAULT 0,
    total_votes INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (match_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_prediction_team_votes_team
    ON public.prediction_team_match_votes (team_id, match_id);

CREATE INDEX IF NOT EXISTS idx_prediction_team_votes_match
    ON public.prediction_team_match_votes (match_id);

-- Extra indexes on the existing pick table for device dashboards at scale.
CREATE INDEX IF NOT EXISTS idx_match_predictions_device_matchday
    ON public.match_predictions (device_id, matchday, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_predictions_day_lookup
    ON public.match_predictions (device_id, match_id);

ALTER TABLE public.match_predictions
    ADD COLUMN IF NOT EXISTS day_key DATE;

CREATE INDEX IF NOT EXISTS idx_match_predictions_device_day_key
    ON public.match_predictions (device_id, day_key DESC)
    WHERE day_key IS NOT NULL;

ALTER TABLE public.prediction_device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_team_match_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prediction_sessions_read ON public.prediction_device_sessions;
CREATE POLICY prediction_sessions_read ON public.prediction_device_sessions
    FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS prediction_slips_read ON public.prediction_slips;
CREATE POLICY prediction_slips_read ON public.prediction_slips
    FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS prediction_team_votes_read ON public.prediction_team_match_votes;
CREATE POLICY prediction_team_votes_read ON public.prediction_team_match_votes
    FOR SELECT TO anon, authenticated USING (true);

REVOKE ALL ON public.prediction_device_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.prediction_slips FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.prediction_team_match_votes TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Session: write-once club, cached step, locked weekend.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_prediction_device_session()
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
    IF NEW.locked_saturday IS NOT NULL AND OLD.locked_saturday IS NOT NULL
       AND NEW.locked_saturday IS DISTINCT FROM OLD.locked_saturday
       AND OLD.locked_sunday IS NOT NULL
       AND OLD.locked_sunday >= (NOW() AT TIME ZONE 'Africa/Nairobi')::date THEN
        NEW.locked_saturday := OLD.locked_saturday;
        NEW.locked_sunday := OLD.locked_sunday;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_prediction_device_session ON public.prediction_device_sessions;
CREATE TRIGGER trg_protect_prediction_device_session
    BEFORE UPDATE ON public.prediction_device_sessions
    FOR EACH ROW EXECUTE FUNCTION public.protect_prediction_device_session();

CREATE OR REPLACE FUNCTION public.get_prediction_device_session(
    p_device_id UUID,
    p_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.prediction_device_sessions%ROWTYPE;
    v_label TEXT;
    v_team UUID;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RETURN '{}'::JSONB;
    END IF;

    SELECT * INTO v_row
    FROM public.prediction_device_sessions
    WHERE device_id = p_device_id;

    SELECT favorite_team_id, favorite_team_label
    INTO v_team, v_label
    FROM public.anonymous_devices
    WHERE device_id = p_device_id;

    IF NOT FOUND AND v_row.device_id IS NULL THEN
        RETURN jsonb_build_object('device_id', p_device_id, 'step', 'fanatic');
    END IF;

    RETURN jsonb_build_object(
        'device_id', p_device_id,
        'favorite_team_id', COALESCE(v_row.favorite_team_id, v_team),
        'favorite_team_label', COALESCE(NULLIF(btrim(v_row.favorite_team_label), ''), v_label),
        'fanatic_answered', COALESCE(v_row.fanatic_answered, FALSE),
        'football_fanatic', v_row.football_fanatic,
        'step', COALESCE(v_row.step, 'fanatic'),
        'slip_list_open', COALESCE(v_row.slip_list_open, FALSE),
        'active_day_key', v_row.active_day_key,
        'locked_saturday', v_row.locked_saturday,
        'locked_sunday', v_row.locked_sunday,
        'updated_at', v_row.updated_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_prediction_device_session(
    p_device_id UUID,
    p_secret TEXT,
    p_favorite_team_id UUID DEFAULT NULL,
    p_favorite_team_label TEXT DEFAULT NULL,
    p_fanatic_answered BOOLEAN DEFAULT NULL,
    p_football_fanatic TEXT DEFAULT NULL,
    p_step TEXT DEFAULT NULL,
    p_slip_list_open BOOLEAN DEFAULT NULL,
    p_active_day_key DATE DEFAULT NULL,
    p_locked_saturday DATE DEFAULT NULL,
    p_locked_sunday DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.prediction_device_sessions%ROWTYPE;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;

    INSERT INTO public.prediction_device_sessions (
        device_id, favorite_team_id, favorite_team_label, fanatic_answered,
        football_fanatic, step, slip_list_open, active_day_key,
        locked_saturday, locked_sunday
    ) VALUES (
        p_device_id, p_favorite_team_id, NULLIF(btrim(p_favorite_team_label), ''),
        COALESCE(p_fanatic_answered, FALSE),
        CASE WHEN p_football_fanatic IN ('yes', 'no') THEN p_football_fanatic ELSE NULL END,
        COALESCE(p_step, 'fanatic'),
        COALESCE(p_slip_list_open, FALSE),
        p_active_day_key, p_locked_saturday, p_locked_sunday
    )
    ON CONFLICT (device_id) DO UPDATE SET
        favorite_team_id = COALESCE(public.prediction_device_sessions.favorite_team_id, EXCLUDED.favorite_team_id),
        favorite_team_label = COALESCE(NULLIF(btrim(public.prediction_device_sessions.favorite_team_label), ''), EXCLUDED.favorite_team_label),
        fanatic_answered = public.prediction_device_sessions.fanatic_answered OR EXCLUDED.fanatic_answered,
        football_fanatic = COALESCE(public.prediction_device_sessions.football_fanatic, EXCLUDED.football_fanatic),
        step = COALESCE(EXCLUDED.step, public.prediction_device_sessions.step),
        slip_list_open = COALESCE(EXCLUDED.slip_list_open, public.prediction_device_sessions.slip_list_open),
        active_day_key = COALESCE(EXCLUDED.active_day_key, public.prediction_device_sessions.active_day_key),
        locked_saturday = COALESCE(public.prediction_device_sessions.locked_saturday, EXCLUDED.locked_saturday),
        locked_sunday = COALESCE(public.prediction_device_sessions.locked_sunday, EXCLUDED.locked_sunday),
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'device_id', v_row.device_id,
        'favorite_team_id', v_row.favorite_team_id,
        'favorite_team_label', v_row.favorite_team_label,
        'fanatic_answered', v_row.fanatic_answered,
        'step', v_row.step,
        'slip_list_open', v_row.slip_list_open,
        'active_day_key', v_row.active_day_key,
        'locked_saturday', v_row.locked_saturday,
        'locked_sunday', v_row.locked_sunday
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- Slip header upsert. Called after a pick. One indexed row per device/day.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_prediction_slip(
    p_device_id UUID,
    p_secret TEXT,
    p_matchday INT,
    p_day_key DATE,
    p_day_label TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
    v_row public.prediction_slips%ROWTYPE;
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RAISE EXCEPTION 'This device is already locked to another phone';
    END IF;

    SELECT COUNT(*)::INT INTO v_count
    FROM public.match_predictions
    WHERE device_id = p_device_id
      AND day_key = p_day_key;

    INSERT INTO public.prediction_slips (
        device_id, matchday, day_key, day_label, picks_count, status
    ) VALUES (
        p_device_id,
        GREATEST(COALESCE(p_matchday, 1), 1),
        p_day_key,
        CASE WHEN p_day_label = 'Sunday' THEN 'Sunday' ELSE 'Saturday' END,
        COALESCE(v_count, 0),
        'in_progress'
    )
    ON CONFLICT (device_id, day_key) DO UPDATE SET
        picks_count = EXCLUDED.picks_count,
        matchday = EXCLUDED.matchday,
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'id', v_row.id,
        'day_key', v_row.day_key,
        'matchday', v_row.matchday,
        'picks_count', v_row.picks_count,
        'status', v_row.status
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_own_prediction_slips(
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
            SELECT id, matchday, day_key, day_label, status, picks_count, updated_at
            FROM public.prediction_slips
            WHERE device_id = p_device_id
            ORDER BY day_key DESC
            LIMIT v_limit OFFSET v_offset
        ) page
    ), '[]'::JSONB);
END;
$$;

-- Own picks for a known match list. One query, indexed (device_id, match_id).
CREATE OR REPLACE FUNCTION public.get_own_match_predictions_for_matches(
    p_device_id UUID,
    p_secret TEXT,
    p_match_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.device_secret_matches(p_device_id, p_secret) THEN
        RETURN '[]'::JSONB;
    END IF;
    IF p_match_ids IS NULL OR array_length(p_match_ids, 1) IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;
    RETURN COALESCE((
        SELECT jsonb_agg(row_to_json(page))
        FROM (
            SELECT match_id, prediction, matchday, updated_at, day_key
            FROM public.match_predictions
            WHERE device_id = p_device_id
              AND match_id = ANY (p_match_ids[1:40])
        ) page
    ), '[]'::JSONB);
END;
$$;

-- Batch team-fan votes for a weekend. One IN query.
CREATE OR REPLACE FUNCTION public.get_team_match_votes(
    p_match_ids UUID[]
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(jsonb_agg(row_to_json(v)), '[]'::JSONB)
    FROM (
        SELECT match_id, team_id, votes_home, votes_draw, votes_away, total_votes
        FROM public.prediction_team_match_votes
        WHERE match_id = ANY (COALESCE(p_match_ids[1:40], ARRAY[]::UUID[]))
    ) v;
$$;

-- ---------------------------------------------------------------------------
-- Incremental team tallies + slip header. Never re-count the whole table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_prediction_team_and_slip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team UUID;
    v_day DATE;
    v_label TEXT;
    v_matchday INT;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RETURN NULL;
    END IF;

    SELECT favorite_team_id INTO v_team
    FROM public.anonymous_devices
    WHERE device_id = NEW.device_id;

    SELECT (scheduled_time AT TIME ZONE 'Africa/Nairobi')::date, matchday
    INTO v_day, v_matchday
    FROM public.fixtures
    WHERE id = NEW.match_id;

    IF v_day IS NOT NULL THEN
        NEW.day_key := COALESCE(NEW.day_key, v_day);
        v_label := CASE WHEN EXTRACT(DOW FROM v_day) = 0 THEN 'Sunday' ELSE 'Saturday' END;

        INSERT INTO public.prediction_slips (
            device_id, matchday, day_key, day_label, picks_count, status
        ) VALUES (
            NEW.device_id, COALESCE(NEW.matchday, v_matchday, 1), v_day, v_label, 1, 'in_progress'
        )
        ON CONFLICT (device_id, day_key) DO UPDATE SET
            picks_count = public.prediction_slips.picks_count + 1,
            updated_at = NOW();
    END IF;

    IF v_team IS NOT NULL THEN
        INSERT INTO public.prediction_team_match_votes (
            match_id, team_id, votes_home, votes_draw, votes_away, total_votes, updated_at
        ) VALUES (
            NEW.match_id,
            v_team,
            CASE WHEN NEW.prediction = '1' THEN 1 ELSE 0 END,
            CASE WHEN NEW.prediction = 'X' THEN 1 ELSE 0 END,
            CASE WHEN NEW.prediction = '2' THEN 1 ELSE 0 END,
            1,
            NOW()
        )
        ON CONFLICT (match_id, team_id) DO UPDATE SET
            votes_home = public.prediction_team_match_votes.votes_home
                + CASE WHEN NEW.prediction = '1' THEN 1 ELSE 0 END,
            votes_draw = public.prediction_team_match_votes.votes_draw
                + CASE WHEN NEW.prediction = 'X' THEN 1 ELSE 0 END,
            votes_away = public.prediction_team_match_votes.votes_away
                + CASE WHEN NEW.prediction = '2' THEN 1 ELSE 0 END,
            total_votes = public.prediction_team_match_votes.total_votes + 1,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_prediction_team_and_slip ON public.match_predictions;
CREATE TRIGGER trg_sync_prediction_team_and_slip
    BEFORE INSERT ON public.match_predictions
    FOR EACH ROW EXECUTE FUNCTION public.sync_prediction_team_and_slip();

-- Next Saturday and Sunday playdays from the fixtures table. Same source as
-- the fixtures page. Limit 2 dates so the client never pages the season.
CREATE OR REPLACE FUNCTION public.get_next_epl_weekend()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_today DATE := (NOW() AT TIME ZONE 'Africa/Nairobi')::date;
    v_sat DATE;
    v_sun DATE;
    v_this_sat DATE;
BEGIN
    -- Sunday (DOW 0) keeps this weekend's Saturday. Monday-Friday take the coming Saturday.
    IF EXTRACT(DOW FROM v_today) = 0 THEN
        v_this_sat := v_today - 1;
    ELSIF EXTRACT(DOW FROM v_today) = 6 THEN
        v_this_sat := v_today;
    ELSE
        v_this_sat := v_today + (6 - EXTRACT(DOW FROM v_today)::INT);
    END IF;

    SELECT MIN((f.scheduled_time AT TIME ZONE 'Africa/Nairobi')::date) INTO v_sat
    FROM public.fixtures f
    WHERE f.competition_id = '11111111-1111-1111-1111-111111111111'
      AND EXTRACT(DOW FROM (f.scheduled_time AT TIME ZONE 'Africa/Nairobi')) = 6
      AND (f.scheduled_time AT TIME ZONE 'Africa/Nairobi')::date >= v_this_sat
      AND f.status IS DISTINCT FROM 'CANCELLED';

    IF v_sat IS NULL THEN
        SELECT MIN((f.scheduled_time AT TIME ZONE 'Africa/Nairobi')::date) INTO v_sat
        FROM public.fixtures f
        WHERE f.competition_id = '11111111-1111-1111-1111-111111111111'
          AND EXTRACT(DOW FROM (f.scheduled_time AT TIME ZONE 'Africa/Nairobi')) = 6
          AND f.status IS DISTINCT FROM 'CANCELLED';
    END IF;

    v_sun := v_sat + 1;

    RETURN jsonb_build_object(
        'saturday', v_sat,
        'sunday', v_sun
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_prediction_device_session(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_prediction_device_session(UUID, TEXT, UUID, TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN, DATE, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_prediction_slip(UUID, TEXT, INT, DATE, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_prediction_slips(UUID, TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_match_predictions_for_matches(UUID, TEXT, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_match_votes(UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_epl_weekend() TO anon, authenticated;
