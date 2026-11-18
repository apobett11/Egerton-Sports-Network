-- Migration 102: Banter Poll Sigmoid Adoption Function & Enriched View
-- Single Source of Truth in PostgreSQL for Poll Sigmoid Adoption Curve.
-- Polls begin strictly with 1 vote at age = 0, and climb smoothly along the normalized S-curve over 8-15 hours.
-- Does not mutate or affect the existing atomic voting function (cast_banter_poll_vote / vote_banter_poll).

-- ============================================================================
-- 1. POLL METRICS ADOPTION FUNCTION
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banter_poll_metrics_result') THEN
        CREATE TYPE public.banter_poll_metrics_result AS (
            displayed_total_votes INT,
            simulated_votes INT,
            option_shares INT[]
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_banter_poll_metrics(
    p_poll_id TEXT,
    p_created_at TIMESTAMPTZ,
    p_real_votes INT,
    p_options_count INT
)
RETURNS public.banter_poll_metrics_result
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
    v_res public.banter_poll_metrics_result;
    v_seed BIGINT;
    v_created_at TIMESTAMPTZ;
    v_age_seconds NUMERIC;
    v_window_sec NUMERIC;
    v_t0 NUMERIC;
    v_k NUMERIC;
    v_u0 NUMERIC;
    v_uT NUMERIC;
    v_ut NUMERIC;
    v_f0 NUMERIC;
    v_fT NUMERIC;
    v_ft NUMERIC;
    v_s_norm NUMERIC;
    v_fade NUMERIC;
    v_micro_jitter NUMERIC;
    v_target_total NUMERIC;
    v_simulated INT;
    v_base_total INT;
    v_shares INT[] := ARRAY[]::INT[];
    v_opt_count INT;
    v_raw_weights INT[] := ARRAY[]::INT[];
    v_weight_sum INT := 0;
    v_allocated INT := 0;
    v_w INT;
    v_val INT;
    v_idx INT;
    v_split INT;
    v_v1 INT;
    v_v2 INT;
BEGIN
    v_opt_count := GREATEST(1, COALESCE(p_options_count, 2));
    v_created_at := COALESCE(p_created_at, NOW());
    v_age_seconds := GREATEST(0.0, EXTRACT(EPOCH FROM (NOW() - v_created_at)));
    v_seed := (abs(hashtextextended(COALESCE(p_poll_id, 'poll-seed'), 0)) & x'7FFFFFFFFFFFFFFF'::bigint);

    -- Strict zero-age guarantee: Poll begins with exact 1 vote
    IF v_age_seconds <= 0.0 THEN
        FOR v_idx IN 1..v_opt_count LOOP
            IF v_idx = 1 THEN
                v_shares := array_append(v_shares, 1);
            ELSE
                v_shares := array_append(v_shares, 0);
            END IF;
        END LOOP;
        v_res.displayed_total_votes := GREATEST(1, COALESCE(p_real_votes, 0) + 1);
        v_res.simulated_votes := 0;
        v_res.option_shares := v_shares;
        RETURN v_res;
    END IF;

    -- 8 to 15 hour saturation window (28,800s to 54,000s)
    v_window_sec := 28800.0 + ((v_seed % 25201)::numeric);
    v_t0 := v_window_sec * 0.45;
    v_k := 10.0 / NULLIF(v_window_sec, 0.0);

    -- Normalized sigmoid adoption curve
    v_u0 := LEAST(30.0, GREATEST(-30.0, -v_k * (0.0 - v_t0)));
    v_uT := LEAST(30.0, GREATEST(-30.0, -v_k * (v_window_sec - v_t0)));
    v_ut := LEAST(30.0, GREATEST(-30.0, -v_k * (v_age_seconds - v_t0)));

    v_f0 := 1.0 / (1.0 + exp(v_u0));
    v_fT := 1.0 / (1.0 + exp(v_uT));
    v_ft := 1.0 / (1.0 + exp(v_ut));

    v_s_norm := (v_ft - v_f0) / NULLIF(v_fT - v_f0, 0.0);
    v_s_norm := GREATEST(0.0, LEAST(1.0, COALESCE(v_s_norm, 0.0)));

    -- Micro-jitter smoothly faded in after 15 minutes (900s)
    IF v_age_seconds > 900.0 THEN
        v_fade := LEAST(1.0, (v_age_seconds - 900.0) / 900.0);
        v_micro_jitter := v_fade * (sin(v_age_seconds / 900.0 + ((v_seed % 6283)::numeric / 1000.0)) * 1.5);
    ELSE
        v_micro_jitter := 0.0;
    END IF;

    -- Target ceiling between 54 and 180 votes
    v_target_total := 54.0 + ((v_seed % 127)::numeric);

    -- Simulated votes climb smoothly from 0 upwards as S-curve progresses
    v_simulated := GREATEST(0, FLOOR(((v_target_total - 1.0) * v_s_norm) + v_micro_jitter)::int);
    v_base_total := 1 + v_simulated; -- strictly starts at 1, climbs to target ceiling

    -- Distribute baseline shares across options
    IF v_opt_count = 1 THEN
        v_shares := ARRAY[v_base_total];
    ELSIF v_opt_count = 2 THEN
        v_split := 42 + ((v_seed % 22)::int); -- 42% - 63%
        v_v1 := GREATEST(1, ROUND((v_base_total::numeric * v_split::numeric) / 100.0)::int);
        v_v2 := GREATEST(0, v_base_total - v_v1);
        v_shares := ARRAY[v_v1, v_v2];
    ELSE
        FOR v_idx IN 1..v_opt_count LOOP
            v_w := 15 + (((v_seed + (v_idx - 1) * 37) % 50)::int);
            v_raw_weights := array_append(v_raw_weights, v_w);
            v_weight_sum := v_weight_sum + v_w;
        END LOOP;

        FOR v_idx IN 1..v_opt_count LOOP
            IF v_idx = v_opt_count THEN
                v_shares := array_append(v_shares, GREATEST(0, v_base_total - v_allocated));
            ELSE
                v_val := GREATEST(CASE WHEN v_idx = 1 THEN 1 ELSE 0 END, ROUND((v_base_total::numeric * v_raw_weights[v_idx]::numeric) / NULLIF(v_weight_sum, 0))::int);
                v_allocated := v_allocated + v_val;
                v_shares := array_append(v_shares, v_val);
            END IF;
        END LOOP;
    END IF;

    v_res.displayed_total_votes := v_base_total + COALESCE(p_real_votes, 0);
    v_res.simulated_votes := v_simulated;
    v_res.option_shares := v_shares;

    RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_banter_poll_metrics(TEXT, TIMESTAMPTZ, INT, INT) TO anon, authenticated, service_role;

-- ============================================================================
-- 2. ENRICHED POLLS VIEW (READ-ONLY PRESENTATION)
-- ============================================================================

CREATE OR REPLACE VIEW public.banter_polls_enriched AS
SELECT
    p.id,
    p.post_id,
    p.question,
    p.options,
    p.total_votes AS real_votes,
    (m).displayed_total_votes AS displayed_total_votes,
    (m).displayed_total_votes AS total_votes,
    (m).simulated_votes AS simulated_votes,
    (m).option_shares AS baseline_option_shares,
    p.voters,
    p.expires_at,
    p.created_at,
    p.updated_at
FROM public.banter_polls p
CROSS JOIN LATERAL public.calculate_banter_poll_metrics(
    p.id,
    p.created_at,
    COALESCE(p.total_votes, 0),
    jsonb_array_length(COALESCE(p.options, '[]'::jsonb))
) m;

GRANT SELECT ON public.banter_polls_enriched TO anon, authenticated, service_role;
