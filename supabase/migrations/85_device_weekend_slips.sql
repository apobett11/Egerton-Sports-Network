-- Couple slips per device and weekend pair into {slip 1, slip 2, slip 3}.
-- Each device has a weekend slips record with nullable slip slots (slip_1, slip_2, slip_3).

CREATE TABLE IF NOT EXISTS public.device_weekend_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.anonymous_devices(device_id) ON DELETE CASCADE,
    pair_key TEXT NOT NULL,
    matchday_pair TEXT NOT NULL,
    saturday_key DATE,
    sunday_key DATE,
    slip_1 JSONB,
    slip_2 JSONB,
    slip_3 JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, pair_key)
);

CREATE INDEX IF NOT EXISTS idx_device_weekend_slips_lookup
    ON public.device_weekend_slips (device_id, pair_key);

CREATE INDEX IF NOT EXISTS idx_device_weekend_slips_updated
    ON public.device_weekend_slips (device_id, updated_at DESC);

ALTER TABLE public.device_weekend_slips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_weekend_slips_read ON public.device_weekend_slips;
CREATE POLICY device_weekend_slips_read ON public.device_weekend_slips
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS device_weekend_slips_write ON public.device_weekend_slips;
CREATE POLICY device_weekend_slips_write ON public.device_weekend_slips
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
