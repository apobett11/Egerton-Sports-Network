-- Migration 86: Authoritative slips, submission timestamps, and 60-minute cooldown
-- Provides get_device_slips_and_cooldown and save_device_weekend_slip RPCs,
-- and an updated_at trigger for public.device_weekend_slips.

-- 1. Auto-updating trigger for updated_at on device_weekend_slips
CREATE OR REPLACE FUNCTION public.set_device_weekend_slips_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_device_weekend_slips_updated_at ON public.device_weekend_slips;
CREATE TRIGGER trg_device_weekend_slips_updated_at
    BEFORE UPDATE ON public.device_weekend_slips
    FOR EACH ROW
    EXECUTE FUNCTION public.set_device_weekend_slips_updated_at();

-- 2. Authoritative Cooldown & Slips Retrieval RPC
CREATE OR REPLACE FUNCTION public.get_device_slips_and_cooldown(
    p_device_id UUID,
    p_pair_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.device_weekend_slips%ROWTYPE;
    v_slip_count INT := 0;
    v_last_submitted_at TIMESTAMPTZ := NULL;
    v_cooldown_remaining_secs INT := 0;
    v_cooldown_duration_secs CONSTANT INT := 3600; -- 60 minutes
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_row
    FROM public.device_weekend_slips
    WHERE device_id = p_device_id
      AND pair_key = p_pair_key;

    IF FOUND THEN
        IF v_row.slip_1 IS NOT NULL AND (v_row.slip_1 ? 'completedAt' OR v_row.slip_1 ? 'picks') THEN
            v_slip_count := 1;
            v_last_submitted_at := COALESCE(
                (v_row.slip_1->>'completedAt')::timestamptz,
                v_row.updated_at,
                v_row.created_at
            );
        END IF;

        IF v_row.slip_2 IS NOT NULL AND (v_row.slip_2 ? 'completedAt' OR v_row.slip_2 ? 'picks') THEN
            v_slip_count := 2;
            v_last_submitted_at := COALESCE(
                (v_row.slip_2->>'completedAt')::timestamptz,
                v_row.updated_at
            );
        END IF;

        IF v_row.slip_3 IS NOT NULL AND (v_row.slip_3 ? 'completedAt' OR v_row.slip_3 ? 'picks') THEN
            v_slip_count := 3;
            v_last_submitted_at := COALESCE(
                (v_row.slip_3->>'completedAt')::timestamptz,
                v_row.updated_at
            );
        END IF;

        IF v_last_submitted_at IS NOT NULL THEN
            v_cooldown_remaining_secs := GREATEST(
                0,
                v_cooldown_duration_secs - EXTRACT(EPOCH FROM (v_now - v_last_submitted_at))::INT
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'device_id', p_device_id,
        'pair_key', p_pair_key,
        'slip_count', v_slip_count,
        'slip_1', v_row.slip_1,
        'slip_2', v_row.slip_2,
        'slip_3', v_row.slip_3,
        'last_submitted_at', v_last_submitted_at,
        'cooldown_remaining_seconds', v_cooldown_remaining_secs,
        'in_cooldown', (v_cooldown_remaining_secs > 0),
        'server_now', v_now
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_device_slips_and_cooldown(UUID, TEXT) TO anon, authenticated;

-- 3. Authoritative Slip Submission RPC
CREATE OR REPLACE FUNCTION public.save_device_weekend_slip(
    p_device_id UUID,
    p_pair_key TEXT,
    p_matchday_pair TEXT,
    p_saturday_key DATE,
    p_sunday_key DATE,
    p_slot INT,
    p_slip_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.device_weekend_slips%ROWTYPE;
    v_timestamp_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    v_stamped_slip JSONB;
BEGIN
    IF p_slot NOT IN (1, 2, 3) THEN
        RAISE EXCEPTION 'Invalid slip slot: %', p_slot;
    END IF;

    -- Guarantee completedAt contains authoritative server timestamp
    v_stamped_slip := p_slip_data || jsonb_build_object('completedAt', v_timestamp_iso);

    INSERT INTO public.device_weekend_slips (
        device_id, pair_key, matchday_pair, saturday_key, sunday_key,
        slip_1, created_at, updated_at
    ) VALUES (
        p_device_id, p_pair_key, p_matchday_pair, p_saturday_key, p_sunday_key,
        CASE WHEN p_slot = 1 THEN v_stamped_slip ELSE NULL END,
        NOW(), NOW()
    )
    ON CONFLICT (device_id, pair_key) DO UPDATE SET
        matchday_pair = EXCLUDED.matchday_pair,
        saturday_key = COALESCE(EXCLUDED.saturday_key, public.device_weekend_slips.saturday_key),
        sunday_key = COALESCE(EXCLUDED.sunday_key, public.device_weekend_slips.sunday_key),
        slip_1 = CASE WHEN p_slot = 1 THEN v_stamped_slip ELSE public.device_weekend_slips.slip_1 END,
        slip_2 = CASE WHEN p_slot = 2 THEN v_stamped_slip ELSE public.device_weekend_slips.slip_2 END,
        slip_3 = CASE WHEN p_slot = 3 THEN v_stamped_slip ELSE public.device_weekend_slips.slip_3 END,
        updated_at = NOW()
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'success', true,
        'slot', p_slot,
        'completed_at', v_timestamp_iso,
        'updated_at', v_row.updated_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_device_weekend_slip(UUID, TEXT, TEXT, DATE, DATE, INT, JSONB) TO anon, authenticated;
