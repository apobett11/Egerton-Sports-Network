-- Migration 101: Deterministic Banter Sigmoid Engine & Enriched Views
-- Single Source of Truth in PostgreSQL: Replaces all client-side simulation math
-- with an immutable, fault-tolerant mathematical model evaluated at query time.

-- ============================================================================
-- 1. SCHEMA HARDENING: REAL ACTIVITY COUNTERS
-- ============================================================================

ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS real_impressions INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_likes INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_reposts INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_replies INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_bookmarks INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS poll_id UUID;

ALTER TABLE public.banter_comments
ADD COLUMN IF NOT EXISTS real_impressions INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_likes INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_reposts INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_replies INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_bookmarks INT NOT NULL DEFAULT 0;

-- Backfill existing legacy counts into real base counters safely
UPDATE public.banter_posts
SET real_impressions = GREATEST(COALESCE(real_impressions, 0), COALESCE(raw_views, views_count, 0)),
    real_likes = GREATEST(COALESCE(real_likes, 0), COALESCE(reaction_fire_count, likes_count, 0)),
    real_reposts = GREATEST(COALESCE(real_reposts, 0), COALESCE(repost_count, reposts_count, 0)),
    real_replies = GREATEST(COALESCE(real_replies, 0), COALESCE(comment_count, replies_count, 0))
WHERE real_impressions = 0 AND real_likes = 0 AND real_reposts = 0 AND real_replies = 0;

-- Drop legacy client/trigger-based update loops that caused write amplification
DROP TRIGGER IF EXISTS trg_sync_banter_post_metrics ON public.banter_posts;

-- ============================================================================
-- 2. DETERMINISTIC SEEDING VIA hashtextextended
-- ============================================================================

CREATE OR REPLACE FUNCTION public.banter_deterministic_seed(p_id UUID)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT (abs(hashtextextended(COALESCE(p_id, '00000000-0000-0000-0000-000000000000'::uuid)::text, 0)) & x'7FFFFFFFFFFFFFFF'::bigint);
$$;

GRANT EXECUTE ON FUNCTION public.banter_deterministic_seed(UUID) TO anon, authenticated, service_role;

-- ============================================================================
-- 3. RETURN TYPE FOR METRICS CALCULATION
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banter_metrics_result') THEN
        CREATE TYPE public.banter_metrics_result AS (
            displayed_impressions INT,
            displayed_likes INT,
            displayed_reposts INT,
            displayed_replies INT,
            displayed_bookmarks INT,
            displayed_views INT,
            is_trending BOOLEAN
        );
    END IF;
END $$;

-- ============================================================================
-- 4. THE SIGMOID ADOPTION ENGINE (STABLE & IMMUTABLE CORE)
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

    -- 3. Strict Zero-Origin: If age <= 0, strictly return real metrics with zero inflation
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
-- 5. SECURE ENRICHED VIEW: banter_posts_enriched
-- ============================================================================

DROP VIEW IF EXISTS public.banter_comments_enriched;
DROP VIEW IF EXISTS public.banter_posts_enriched;

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
FROM replies_calculated;

-- ============================================================================
-- 6. SECURE ENRICHED VIEW: banter_comments_enriched (Thread Replies)
-- ============================================================================

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

-- ============================================================================
-- 7. RLS & ACCESS CONTROL: BLOCK RAW METRIC LEAKAGE
-- ============================================================================

GRANT SELECT ON public.banter_posts_enriched TO anon, authenticated, service_role;
GRANT SELECT ON public.banter_comments_enriched TO anon, authenticated, service_role;

-- Revoke direct table SELECT to prevent reading raw base metrics
REVOKE SELECT ON public.banter_posts FROM anon, authenticated;
REVOKE SELECT ON public.banter_comments FROM anon, authenticated;

-- Allow insert/update operations for user participation
GRANT INSERT, UPDATE ON public.banter_posts TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON public.banter_comments TO anon, authenticated, service_role;

-- ============================================================================
-- 8. ATOMIC RPCS FOR REAL ACTIONS & METRIC INCREMENTS
-- ============================================================================

-- Atomic Batch Impressions Tracker
CREATE OR REPLACE FUNCTION public.increment_banter_impressions(post_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF post_ids IS NULL OR array_length(post_ids, 1) = 0 THEN
        RETURN;
    END IF;

    UPDATE public.banter_posts
    SET real_impressions = COALESCE(real_impressions, 0) + 1,
        impressions_count = COALESCE(impressions_count, 0) + 1,
        views_count = COALESCE(views_count, 0) + 1
    WHERE id = ANY(post_ids);

    UPDATE public.banter_comments
    SET real_impressions = COALESCE(real_impressions, 0) + 1
    WHERE id = ANY(post_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_banter_impressions(UUID[]) TO anon, authenticated, service_role;

-- Batch increment backwards compatibility
CREATE OR REPLACE FUNCTION public.batch_increment_banter_metrics(
    p_post_ids UUID[],
    p_impressions INT[],
    p_reposts INT[],
    p_views INT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    i INT;
    v_len INT;
BEGIN
    v_len := coalesce(array_length(p_post_ids, 1), 0);
    IF v_len = 0 THEN
        RETURN;
    END IF;

    FOR i IN 1 .. v_len LOOP
        UPDATE public.banter_posts
        SET real_impressions = COALESCE(real_impressions, 0) + COALESCE(p_impressions[i], 0),
            real_reposts = COALESCE(real_reposts, 0) + COALESCE(p_reposts[i], 0),
            impressions_count = COALESCE(impressions_count, 0) + COALESCE(p_impressions[i], 0),
            repost_count = COALESCE(repost_count, 0) + COALESCE(p_reposts[i], 0),
            views_count = COALESCE(views_count, 0) + COALESCE(p_views[i], 0)
        WHERE id = p_post_ids[i];

        UPDATE public.banter_comments
        SET real_impressions = COALESCE(real_impressions, 0) + COALESCE(p_impressions[i], 0),
            real_reposts = COALESCE(real_reposts, 0) + COALESCE(p_reposts[i], 0)
        WHERE id = p_post_ids[i];
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batch_increment_banter_metrics(UUID[], INT[], INT[], INT[]) TO anon, authenticated, service_role;

-- Like increment RPC (+1 / -1)
CREATE OR REPLACE FUNCTION public.toggle_banter_like(
    p_post_id UUID,
    p_device_id UUID DEFAULT NULL,
    p_active BOOLEAN DEFAULT TRUE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_likes INT;
BEGIN
    IF p_active THEN
        UPDATE public.banter_posts
        SET real_likes = COALESCE(real_likes, 0) + 1,
            reaction_fire_count = COALESCE(reaction_fire_count, 0) + 1
        WHERE id = p_post_id
        RETURNING real_likes INTO v_likes;
    ELSE
        UPDATE public.banter_posts
        SET real_likes = GREATEST(0, COALESCE(real_likes, 1) - 1),
            reaction_fire_count = GREATEST(0, COALESCE(reaction_fire_count, 1) - 1)
        WHERE id = p_post_id
        RETURNING real_likes INTO v_likes;
    END IF;

    RETURN COALESCE(v_likes, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_banter_like(UUID, UUID, BOOLEAN) TO anon, authenticated, service_role;

-- Repost increment RPC (+1 / -1)
CREATE OR REPLACE FUNCTION public.toggle_banter_repost(
    p_post_id UUID,
    p_device_id UUID DEFAULT NULL,
    p_active BOOLEAN DEFAULT TRUE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reposts INT;
BEGIN
    IF p_active THEN
        UPDATE public.banter_posts
        SET real_reposts = COALESCE(real_reposts, 0) + 1,
            repost_count = COALESCE(repost_count, 0) + 1
        WHERE id = p_post_id
        RETURNING real_reposts INTO v_reposts;
    ELSE
        UPDATE public.banter_posts
        SET real_reposts = GREATEST(0, COALESCE(real_reposts, 1) - 1),
            repost_count = GREATEST(0, COALESCE(repost_count, 1) - 1)
        WHERE id = p_post_id
        RETURNING real_reposts INTO v_reposts;
    END IF;

    RETURN COALESCE(v_reposts, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_banter_repost(UUID, UUID, BOOLEAN) TO anon, authenticated, service_role;

-- Bookmark increment RPC (+1 / -1)
CREATE OR REPLACE FUNCTION public.toggle_banter_bookmark(
    p_post_id UUID,
    p_device_id UUID DEFAULT NULL,
    p_active BOOLEAN DEFAULT TRUE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bookmarks INT;
BEGIN
    IF p_active THEN
        UPDATE public.banter_posts
        SET real_bookmarks = COALESCE(real_bookmarks, 0) + 1
        WHERE id = p_post_id
        RETURNING real_bookmarks INTO v_bookmarks;
    ELSE
        UPDATE public.banter_posts
        SET real_bookmarks = GREATEST(0, COALESCE(real_bookmarks, 1) - 1)
        WHERE id = p_post_id
        RETURNING real_bookmarks INTO v_bookmarks;
    END IF;

    RETURN COALESCE(v_bookmarks, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_banter_bookmark(UUID, UUID, BOOLEAN) TO anon, authenticated, service_role;

-- ============================================================================
-- 9. PAGINATED HIGH-PERFORMANCE RPC FEED
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_banter_feed(
    p_filter TEXT DEFAULT 'all',
    p_match_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS SETOF public.banter_posts_enriched
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.banter_posts_enriched
    WHERE status = 'active'
      AND parent_id IS NULL
      AND (p_match_id IS NULL OR match_id = p_match_id)
      AND (
        CASE
          WHEN p_filter = 'trending' OR p_filter = 'hot' THEN created_at >= (NOW() - INTERVAL '48 hours')
          WHEN p_filter = 'coach' THEN (author_type = 'coach' OR author_badge ILIKE '%coach%')
          WHEN p_filter = 'analytics' THEN (author_type = 'journalist' OR author_badge ILIKE '%journalist%')
          ELSE TRUE
        END
      )
    ORDER BY
      CASE
        WHEN p_filter = 'trending' OR p_filter = 'hot' THEN impressions
        ELSE 0
      END DESC,
      created_at DESC
    LIMIT LEAST(100, GREATEST(1, p_limit))
    OFFSET GREATEST(0, p_offset);
$$;

GRANT EXECUTE ON FUNCTION public.get_banter_feed(TEXT, UUID, INT, INT) TO anon, authenticated, service_role;

-- Thread Fetch RPC
CREATE OR REPLACE FUNCTION public.get_banter_thread(p_post_id UUID)
RETURNS SETOF public.banter_posts_enriched
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.banter_posts_enriched
    WHERE status = 'active'
      AND (id = p_post_id OR parent_id = p_post_id OR root_id = p_post_id)
    ORDER BY created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_banter_thread(UUID) TO anon, authenticated, service_role;

-- ============================================================================
-- 10. REAL COUNTER TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_banter_reaction_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'fire' THEN
            UPDATE public.banter_posts
            SET reaction_fire_count = reaction_fire_count + 1,
                real_likes = real_likes + 1
            WHERE id = NEW.post_id;
        ELSIF NEW.reaction_type = 'clown' THEN
            UPDATE public.banter_posts SET reaction_clown_count = reaction_clown_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.reaction_type = 'skull' THEN
            UPDATE public.banter_posts SET reaction_skull_count = reaction_skull_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'fire' THEN
            UPDATE public.banter_posts
            SET reaction_fire_count = GREATEST(0, reaction_fire_count - 1),
                real_likes = GREATEST(0, real_likes - 1)
            WHERE id = OLD.post_id;
        ELSIF OLD.reaction_type = 'clown' THEN
            UPDATE public.banter_posts SET reaction_clown_count = GREATEST(0, reaction_clown_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.reaction_type = 'skull' THEN
            UPDATE public.banter_posts SET reaction_skull_count = GREATEST(0, reaction_skull_count - 1) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sync_banter_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE public.banter_posts
        SET comment_count = COALESCE(comment_count, 0) + 1,
            real_replies = COALESCE(real_replies, 0) + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE public.banter_posts
        SET comment_count = GREATEST(0, COALESCE(comment_count, 1) - 1),
            real_replies = GREATEST(0, COALESCE(real_replies, 1) - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;
