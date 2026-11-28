-- Migration 104: Banter Pinning, Administrative PIN 1574 RPCs, and Zero-Default Metrics
-- 
-- 1. Ensure banter_posts, banter_comments, and banter_polls default all metrics strictly to 0
-- 2. Add is_pinned (BOOLEAN NOT NULL DEFAULT FALSE) and pinned_at (TIMESTAMPTZ) to banter_posts
-- 3. Create pin_banter_post(p_post_id UUID, p_pin TEXT) and unpin_banter_post(p_post_id UUID, p_pin TEXT) RPCs
--    Auth pin strictly '1574', max 2 pinned posts limit enforcement
-- 4. Verify calculate_banter_post_metrics and views: strictly 0 starting metrics when new, then gradual sigmoid ramp
-- 5. Recreate banter_posts_enriched and banter_comments_enriched to include is_pinned and pinned_at, ordered by pinned first

-- ============================================================================
-- 1. ZERO-DEFAULT METRICS HARDENING
-- ============================================================================

-- Ensure all metrics columns on banter_posts exist and default strictly to 0
ALTER TABLE public.banter_posts
    ADD COLUMN IF NOT EXISTS raw_views INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS impressions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reposts_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS replies_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_impressions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_likes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_reposts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_replies INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_bookmarks INT NOT NULL DEFAULT 0;

ALTER TABLE public.banter_posts
    ALTER COLUMN raw_views SET DEFAULT 0,
    ALTER COLUMN impressions SET DEFAULT 0,
    ALTER COLUMN likes_count SET DEFAULT 0,
    ALTER COLUMN reposts_count SET DEFAULT 0,
    ALTER COLUMN replies_count SET DEFAULT 0,
    ALTER COLUMN real_impressions SET DEFAULT 0,
    ALTER COLUMN real_likes SET DEFAULT 0,
    ALTER COLUMN real_reposts SET DEFAULT 0,
    ALTER COLUMN real_replies SET DEFAULT 0,
    ALTER COLUMN real_bookmarks SET DEFAULT 0;

-- Align legacy counters if they exist on banter_posts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'impressions_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN impressions_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'views_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN views_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'repost_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN repost_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'comment_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN comment_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'reaction_fire_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN reaction_fire_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'reaction_clown_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN reaction_clown_count SET DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'banter_posts' AND column_name = 'reaction_skull_count') THEN
        ALTER TABLE public.banter_posts ALTER COLUMN reaction_skull_count SET DEFAULT 0;
    END IF;
END $$;

-- Ensure all metrics columns on banter_comments exist and default strictly to 0
ALTER TABLE public.banter_comments
    ADD COLUMN IF NOT EXISTS real_impressions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_likes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_reposts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_replies INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS real_bookmarks INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS raw_views INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS impressions INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reposts_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS replies_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.banter_comments
    ALTER COLUMN real_impressions SET DEFAULT 0,
    ALTER COLUMN real_likes SET DEFAULT 0,
    ALTER COLUMN real_reposts SET DEFAULT 0,
    ALTER COLUMN real_replies SET DEFAULT 0,
    ALTER COLUMN real_bookmarks SET DEFAULT 0,
    ALTER COLUMN raw_views SET DEFAULT 0,
    ALTER COLUMN impressions SET DEFAULT 0,
    ALTER COLUMN likes_count SET DEFAULT 0,
    ALTER COLUMN reposts_count SET DEFAULT 0,
    ALTER COLUMN replies_count SET DEFAULT 0;

-- Ensure banter_polls default total_votes strictly to 0
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'banter_polls') THEN
        ALTER TABLE public.banter_polls ALTER COLUMN total_votes SET DEFAULT 0;
    END IF;
END $$;

-- Drop legacy client/trigger-based inflation loops if still present
DROP TRIGGER IF EXISTS trg_sync_banter_post_metrics ON public.banter_posts;

-- ============================================================================
-- 2. PINNING COLUMNS & PERFORMANCE INDEXES
-- ============================================================================

ALTER TABLE public.banter_posts
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Combined index for optimal sorting of pinned posts first, then newest
CREATE INDEX IF NOT EXISTS idx_banter_posts_pinned_feed
    ON public.banter_posts (is_pinned DESC, pinned_at DESC NULLS LAST, created_at DESC);

-- Fast partial index for pinned posts verification
CREATE INDEX IF NOT EXISTS idx_banter_posts_is_pinned_active
    ON public.banter_posts (is_pinned)
    WHERE is_pinned = TRUE;

-- ============================================================================
-- 3. ADMINISTRATIVE PIN RPCs (PIN: '1574', MAX 2 PINNED POSTS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pin_banter_post(
    p_post_id UUID,
    p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pinned_count INT;
    v_already_pinned BOOLEAN;
BEGIN
    -- 1. Strictly verify administrative PIN
    IF p_pin IS NULL OR trim(p_pin) != '1574' THEN
        RAISE EXCEPTION 'Invalid administrative PIN. Access denied.';
    END IF;

    -- 2. Verify target post exists
    IF NOT EXISTS (SELECT 1 FROM public.banter_posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Target post % not found.', p_post_id;
    END IF;

    -- 3. Check if target post is already pinned
    SELECT is_pinned INTO v_already_pinned
    FROM public.banter_posts
    WHERE id = p_post_id;

    IF v_already_pinned IS TRUE THEN
        RETURN TRUE;
    END IF;

    -- 4. Enforce limitation of maximum 2 pinned messages
    SELECT count(*) INTO v_pinned_count
    FROM public.banter_posts
    WHERE is_pinned = TRUE AND id != p_post_id;

    IF v_pinned_count >= 2 THEN
        RAISE EXCEPTION 'Maximum of 2 pinned messages allowed. You must unpin an existing pinned message first.';
    END IF;

    -- 5. Pin the post with authoritative timestamp
    UPDATE public.banter_posts
    SET is_pinned = TRUE,
        pinned_at = NOW()
    WHERE id = p_post_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pin_banter_post(UUID, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.unpin_banter_post(
    p_post_id UUID,
    p_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Strictly verify administrative PIN
    IF p_pin IS NULL OR trim(p_pin) != '1574' THEN
        RAISE EXCEPTION 'Invalid administrative PIN. Access denied.';
    END IF;

    -- 2. Verify target post exists
    IF NOT EXISTS (SELECT 1 FROM public.banter_posts WHERE id = p_post_id) THEN
        RAISE EXCEPTION 'Target post % not found.', p_post_id;
    END IF;

    -- 3. Unpin the post
    UPDATE public.banter_posts
    SET is_pinned = FALSE,
        pinned_at = NULL
    WHERE id = p_post_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unpin_banter_post(UUID, TEXT) TO anon, authenticated, service_role;

-- ============================================================================
-- 4. MATHEMATICAL ENGINE: ZERO ORIGIN & DETERMINISTIC SIGMOID RAMP-UP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_banter_post_metrics(
    p_id UUID,
    p_parent_id UUID,
    p_created_at TIMESTAMPTZ,
    p_real_impressions INT,
    p_real_likes INT,
    p_real_reposts INT,
    p_real_replies INT,
    p_real_bookmarks INT,
    p_is_trending BOOLEAN,
    p_parent_displayed_impressions INT
)
RETURNS public.banter_metrics_result
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
    v_res public.banter_metrics_result;
    v_is_reply BOOLEAN;
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
    v_real_impr INT;
    v_real_likes INT;
    v_real_reposts INT;
    v_real_replies INT;
    v_real_bookmarks INT;
    v_real_engagements INT;
    v_real_activity INT;
    v_fallback_ceiling NUMERIC;
    v_amplification NUMERIC;
    v_target_cap NUMERIC;
    v_inflated_target NUMERIC;
    v_dampen NUMERIC;
    v_simulated_impressions INT;
    v_displayed_impressions INT;
    v_max_reply_impressions INT;
    v_like_ratio NUMERIC;
    v_simulated_likes INT;
    v_displayed_likes INT;
    v_repost_ratio NUMERIC;
    v_simulated_reposts INT;
    v_displayed_reposts INT;
    v_bookmark_ratio NUMERIC;
    v_simulated_bookmarks INT;
    v_displayed_bookmarks INT;
    v_displayed_views INT;
    v_trending BOOLEAN;
BEGIN
    -- 1. Input sanitization & Null-Safe arithmetic
    v_is_reply := (p_parent_id IS NOT NULL);
    v_created_at := COALESCE(p_created_at, NOW());
    v_age_seconds := GREATEST(0.0, EXTRACT(EPOCH FROM (NOW() - v_created_at)));
    
    v_real_impr := GREATEST(0, COALESCE(p_real_impressions, 0));
    v_real_likes := GREATEST(0, COALESCE(p_real_likes, 0));
    v_real_reposts := GREATEST(0, COALESCE(p_real_reposts, 0));
    v_real_replies := GREATEST(0, COALESCE(p_real_replies, 0));
    v_real_bookmarks := GREATEST(0, COALESCE(p_real_bookmarks, 0));
    
    -- 2. Deterministic 64-bit seed from UUID
    v_seed := (abs(hashtextextended(COALESCE(p_id, '00000000-0000-0000-0000-000000000000'::uuid)::text, 0)) & x'7FFFFFFFFFFFFFFF'::bigint);

    -- 3. Strict Zero-Origin: If age <= 0 or newly created with zero activity, strictly return exact real metrics (0 default)
    IF v_age_seconds <= 0.0 THEN
        v_res.displayed_impressions := v_real_impr;
        v_res.displayed_likes := v_real_likes;
        v_res.displayed_reposts := v_real_reposts;
        v_res.displayed_replies := v_real_replies;
        v_res.displayed_bookmarks := v_real_bookmarks;
        v_res.displayed_views := GREATEST(v_real_impr, 0);
        v_res.is_trending := FALSE;
        RETURN v_res;
    END IF;

    -- 4. Deterministic Saturation Window: 28,800s (8h) to 54,000s (15h)
    v_window_sec := 28800.0 + ((v_seed % 25201)::numeric);
    v_t0 := v_window_sec * 0.45;
    v_k := 10.0 / NULLIF(v_window_sec, 0.0);

    -- 5. Smooth Normalized Sigmoid (S-Curve)
    -- u(t) = -k * (t - t0)
    v_u0 := LEAST(30.0, GREATEST(-30.0, -v_k * (0.0 - v_t0)));
    v_uT := LEAST(30.0, GREATEST(-30.0, -v_k * (v_window_sec - v_t0)));
    v_ut := LEAST(30.0, GREATEST(-30.0, -v_k * (v_age_seconds - v_t0)));

    v_f0 := 1.0 / (1.0 + exp(v_u0));
    v_fT := 1.0 / (1.0 + exp(v_uT));
    v_ft := 1.0 / (1.0 + exp(v_ut));

    v_s_norm := (v_ft - v_f0) / NULLIF(v_fT - v_f0, 0.0);
    v_s_norm := GREATEST(0.0, LEAST(1.0, COALESCE(v_s_norm, 0.0)));

    -- 6. Continuous Micro-Variance (sine wave added smoothly after 15 min / 900s)
    IF v_age_seconds > 900.0 THEN
        v_fade := LEAST(1.0, (v_age_seconds - 900.0) / 900.0);
        v_micro_jitter := v_fade * (sin(v_age_seconds / 900.0 + ((v_seed % 6283)::numeric / 1000.0)) * 1.5);
    ELSE
        v_micro_jitter := 0.0;
    END IF;

    -- 7. Real Engagement Anchoring & Monotonic Target Ceiling
    v_real_engagements := (v_real_likes * 3) + (v_real_reposts * 5) + (v_real_replies * 4) + (v_real_bookmarks * 3);
    v_real_activity := v_real_impr + v_real_engagements;

    -- Graceful fallback organic discovery ceiling (15 to 65 views for zero activity)
    v_fallback_ceiling := 15.0 + ((v_seed % 51)::numeric);

    -- Real activity strictly drives target ceiling amplification
    v_amplification := (v_real_impr::numeric * (8.0 + (v_seed % 5)))
                     + (v_real_engagements::numeric * (15.0 + (v_seed % 7)));

    v_inflated_target := v_fallback_ceiling + v_amplification;

    -- Cap ceilings appropriately
    v_trending := (COALESCE(p_is_trending, FALSE) OR v_real_activity >= 15);
    IF v_is_reply THEN
        v_trending := FALSE; -- replies are never trending
    END IF;

    IF v_trending THEN
        v_target_cap := 1550.0 + ((v_seed % 1450)::numeric); -- 1,550 to 3,000 views
    ELSE
        v_target_cap := 320.0 + ((v_seed % 681)::numeric);   -- 320 to 1,000 views
    END IF;
    v_inflated_target := LEAST(v_target_cap, v_inflated_target);

    -- 8. Reply Impressions Dampening (0.12 to 0.25)
    IF v_is_reply THEN
        v_dampen := 0.12 + (((v_seed % 14)::numeric) * 0.01);
        v_inflated_target := FLOOR(v_inflated_target * v_dampen);
    END IF;

    -- 9. Displayed Impressions = Real + Floor(Target * S_norm + Jitter)
    v_simulated_impressions := GREATEST(0, FLOOR((v_inflated_target * v_s_norm) + v_micro_jitter)::int);
    v_displayed_impressions := v_real_impr + v_simulated_impressions;

    -- 10. Strict Parent Ceiling Clamp for Replies (<= parent.impressions * 0.65)
    IF v_is_reply AND p_parent_displayed_impressions IS NOT NULL THEN
        v_max_reply_impressions := FLOOR(p_parent_displayed_impressions::numeric * 0.65)::int;
        v_displayed_impressions := LEAST(v_displayed_impressions, v_max_reply_impressions);
        v_displayed_impressions := GREATEST(v_real_impr, v_displayed_impressions);
    END IF;

    -- 11. Proportional Metric Coupling: Likes (3.5% to 7.5% of impressions)
    v_like_ratio := 0.035 + (((v_seed % 41)::numeric) / 1000.0);
    v_simulated_likes := FLOOR(v_displayed_impressions::numeric * v_like_ratio)::int;
    v_displayed_likes := v_real_likes + v_simulated_likes;

    -- 12. Reposts Coupling & Reply Repost Suppression
    IF v_is_reply THEN
        -- Strictly zero inflation on replies
        v_displayed_reposts := v_real_reposts;
    ELSE
        IF v_displayed_impressions > 50 THEN
            v_repost_ratio := 0.004 + (((v_seed % 15)::numeric) / 1000.0); -- 0.4% to 1.8%
            v_simulated_reposts := FLOOR((v_displayed_impressions - 50)::numeric * v_repost_ratio)::int;
            v_displayed_reposts := v_real_reposts + v_simulated_reposts;
        ELSE
            v_displayed_reposts := v_real_reposts;
        END IF;
    END IF;

    -- 13. Organic-Only Replies: Always exact real count
    v_displayed_replies := v_real_replies;

    -- 14. Bookmarks Coupling
    IF v_displayed_impressions > 30 THEN
        v_bookmark_ratio := 0.002 + (((v_seed % 7)::numeric) / 1000.0); -- 0.2% to 0.8%
        v_simulated_bookmarks := FLOOR(v_displayed_impressions::numeric * v_bookmark_ratio)::int;
        v_displayed_bookmarks := v_real_bookmarks + v_simulated_bookmarks;
    ELSE
        v_displayed_bookmarks := v_real_bookmarks;
    END IF;

    -- 15. Views (~42% of impressions)
    IF v_displayed_impressions > 0 THEN
        v_displayed_views := GREATEST(v_real_impr, FLOOR(v_displayed_impressions::numeric * 0.42)::int);
    ELSE
        v_displayed_views := 0;
    END IF;

    -- Output record
    v_res.displayed_impressions := v_displayed_impressions;
    v_res.displayed_likes := v_displayed_likes;
    v_res.displayed_reposts := v_displayed_reposts;
    v_res.displayed_replies := v_displayed_replies;
    v_res.displayed_bookmarks := v_displayed_bookmarks;
    v_res.displayed_views := v_displayed_views;
    v_res.is_trending := v_trending;

    RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_banter_post_metrics(
    UUID, UUID, TIMESTAMPTZ, INT, INT, INT, INT, INT, BOOLEAN, INT
) TO anon, authenticated, service_role;

-- ============================================================================
-- 5. RECREATE ENRICHED VIEWS WITH is_pinned AND pinned_at (SORT PINNED FIRST)
-- ============================================================================

DROP VIEW IF EXISTS public.banter_comments_enriched CASCADE;
DROP VIEW IF EXISTS public.banter_posts_enriched CASCADE;

CREATE OR REPLACE VIEW public.banter_posts_enriched AS
WITH root_posts_calculated AS (
    SELECT
        p.id,
        p.parent_id,
        p.root_id,
        p.match_id,
        p.league_id,
        p.device_id,
        p.uid,
        p.author_device_id,
        p.author_handle,
        p.author_name,
        p.author_avatar,
        p.author_type,
        p.author_badge,
        p.content,
        p.source_type,
        p.status,
        p.created_at,
        p.updated_at,
        p.media_type,
        p.media_urls,
        p.poll_id,
        p.reaction_clown_count,
        p.reaction_skull_count,
        COALESCE(p.is_pinned, FALSE) AS is_pinned,
        p.pinned_at,
        public.calculate_banter_post_metrics(
            p.id,
            p.parent_id,
            p.created_at,
            p.real_impressions,
            p.real_likes,
            p.real_reposts,
            p.real_replies,
            p.real_bookmarks,
            COALESCE(p.is_trending, FALSE),
            NULL::INT
        ) AS m
    FROM public.banter_posts p
    WHERE p.parent_id IS NULL
),
all_roots_projected AS (
    SELECT
        r.id,
        r.parent_id,
        r.root_id,
        r.match_id,
        r.league_id,
        r.device_id,
        r.uid,
        r.author_device_id,
        r.author_handle,
        r.author_name,
        r.author_avatar,
        r.author_type,
        r.author_badge,
        r.content,
        r.source_type,
        r.status,
        r.created_at,
        r.updated_at,
        r.media_type,
        r.media_urls,
        r.poll_id,
        r.reaction_clown_count,
        r.reaction_skull_count,
        r.is_pinned,
        r.pinned_at,
        (r.m).is_trending AS is_trending,
        (r.m).displayed_impressions AS displayed_impressions,
        (r.m).displayed_likes AS displayed_likes,
        (r.m).displayed_reposts AS displayed_reposts,
        (r.m).displayed_replies AS displayed_replies,
        (r.m).displayed_bookmarks AS displayed_bookmarks,
        (r.m).displayed_views AS displayed_views
    FROM root_posts_calculated r
),
replies_calculated AS (
    SELECT
        rep.id,
        rep.parent_id,
        rep.root_id,
        rep.match_id,
        rep.league_id,
        rep.device_id,
        rep.uid,
        rep.author_device_id,
        rep.author_handle,
        rep.author_name,
        rep.author_avatar,
        rep.author_type,
        rep.author_badge,
        rep.content,
        rep.source_type,
        rep.status,
        rep.created_at,
        rep.updated_at,
        rep.media_type,
        rep.media_urls,
        rep.poll_id,
        rep.reaction_clown_count,
        rep.reaction_skull_count,
        COALESCE(rep.is_pinned, FALSE) AS is_pinned,
        rep.pinned_at,
        public.calculate_banter_post_metrics(
            rep.id,
            rep.parent_id,
            rep.created_at,
            rep.real_impressions,
            rep.real_likes,
            rep.real_reposts,
            rep.real_replies,
            rep.real_bookmarks,
            FALSE,
            parent.displayed_impressions
        ) AS m
    FROM public.banter_posts rep
    LEFT JOIN all_roots_projected parent ON rep.parent_id = parent.id
    WHERE rep.parent_id IS NOT NULL
)
SELECT
    id,
    parent_id,
    root_id,
    match_id,
    league_id,
    device_id,
    uid,
    author_device_id,
    author_handle,
    author_name,
    author_avatar,
    author_type,
    author_badge,
    content,
    source_type,
    status,
    created_at,
    updated_at,
    media_type,
    media_urls,
    poll_id,
    is_pinned,
    pinned_at,
    is_trending,
    displayed_impressions AS impressions,
    displayed_impressions AS impressions_count,
    displayed_views AS views,
    displayed_views AS views_count,
    displayed_likes AS likes_count,
    displayed_likes AS reaction_fire_count,
    reaction_clown_count,
    reaction_skull_count,
    displayed_reposts AS repost_count,
    displayed_reposts AS reposts_count,
    displayed_replies AS comment_count,
    displayed_replies AS replies_count,
    displayed_bookmarks AS bookmarks_count
FROM all_roots_projected
UNION ALL
SELECT
    id,
    parent_id,
    root_id,
    match_id,
    league_id,
    device_id,
    uid,
    author_device_id,
    author_handle,
    author_name,
    author_avatar,
    author_type,
    author_badge,
    content,
    source_type,
    status,
    created_at,
    updated_at,
    media_type,
    media_urls,
    poll_id,
    is_pinned,
    pinned_at,
    FALSE AS is_trending,
    (m).displayed_impressions AS impressions,
    (m).displayed_impressions AS impressions_count,
    (m).displayed_views AS views,
    (m).displayed_views AS views_count,
    (m).displayed_likes AS likes_count,
    (m).displayed_likes AS reaction_fire_count,
    reaction_clown_count,
    reaction_skull_count,
    (m).displayed_reposts AS repost_count,
    (m).displayed_reposts AS reposts_count,
    (m).displayed_replies AS comment_count,
    (m).displayed_replies AS replies_count,
    (m).displayed_bookmarks AS bookmarks_count
FROM replies_calculated
ORDER BY is_pinned DESC, pinned_at DESC NULLS LAST, created_at DESC;

-- Recreate banter_comments_enriched
CREATE OR REPLACE VIEW public.banter_comments_enriched AS
SELECT
    c.id,
    c.post_id,
    c.device_id,
    c.author_handle,
    c.author_type,
    c.content,
    c.status,
    c.created_at,
    (m).displayed_impressions AS impressions,
    (m).displayed_impressions AS impressions_count,
    (m).displayed_views AS views,
    (m).displayed_views AS views_count,
    (m).displayed_likes AS likes_count,
    (m).displayed_likes AS reaction_fire_count,
    0 AS reaction_clown_count,
    0 AS reaction_skull_count,
    (m).displayed_reposts AS repost_count,
    (m).displayed_reposts AS reposts_count,
    0 AS comment_count,
    0 AS replies_count,
    (m).displayed_bookmarks AS bookmarks_count
FROM public.banter_comments c
LEFT JOIN public.banter_posts_enriched p ON c.post_id = p.id
CROSS JOIN LATERAL public.calculate_banter_post_metrics(
    c.id,
    c.post_id,
    c.created_at,
    COALESCE(c.real_impressions, 0),
    COALESCE(c.real_likes, 0),
    COALESCE(c.real_reposts, 0),
    COALESCE(c.real_replies, 0),
    COALESCE(c.real_bookmarks, 0),
    FALSE,
    p.impressions
) m;

-- Grant broad read permissions
GRANT SELECT ON public.banter_posts TO anon, authenticated, service_role;
GRANT SELECT ON public.banter_comments TO anon, authenticated, service_role;
GRANT SELECT ON public.banter_posts_enriched TO anon, authenticated, service_role;
GRANT SELECT ON public.banter_comments_enriched TO anon, authenticated, service_role;
