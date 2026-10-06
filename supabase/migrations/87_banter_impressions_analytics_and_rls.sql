-- Migration 87: Banter Impressions, Analytics and RLS Policies
-- Enables tracking unique impressions per device, calculating live engagement analytics,
-- and securing banter tables with non-blocking RLS.

-- 1. Impressions tracking table (unique per post and device)
CREATE TABLE IF NOT EXISTS public.banter_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.banter_posts(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.anonymous_devices(device_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_banter_impressions_post
    ON public.banter_impressions (post_id);
CREATE INDEX IF NOT EXISTS idx_banter_impressions_device
    ON public.banter_impressions (device_id);

-- Enable RLS on banter_impressions
ALTER TABLE public.banter_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read banter impressions" ON public.banter_impressions;
CREATE POLICY "Public read banter impressions"
    ON public.banter_impressions
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public insert banter impressions" ON public.banter_impressions;
CREATE POLICY "Public insert banter impressions"
    ON public.banter_impressions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 2. Safe RPC to record impression (increments impressions_count on post)
CREATE OR REPLACE FUNCTION public.record_banter_impression(
    p_post_id UUID,
    p_device_id UUID DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_impressions INT := 0;
BEGIN
    IF p_device_id IS NOT NULL THEN
        INSERT INTO public.banter_impressions (post_id, device_id)
        VALUES (p_post_id, p_device_id)
        ON CONFLICT (post_id, device_id) DO NOTHING;
    END IF;

    UPDATE public.banter_posts
    SET impressions_count = impressions_count + 1,
        views_count = views_count + 1
    WHERE id = p_post_id
    RETURNING impressions_count INTO v_impressions;

    RETURN COALESCE(v_impressions, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_banter_impression(UUID, UUID) TO anon, authenticated;

-- 3. Live banter analytics RPC (total posts, total reactions, total comments, total impressions)
CREATE OR REPLACE FUNCTION public.get_banter_analytics()
RETURNS TABLE (
    total_posts BIGINT,
    total_reactions BIGINT,
    total_comments BIGINT,
    total_impressions BIGINT,
    hot_posts_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_posts,
        COALESCE(SUM(reaction_fire_count + reaction_clown_count + reaction_skull_count), 0)::BIGINT AS total_reactions,
        COALESCE(SUM(comment_count), 0)::BIGINT AS total_comments,
        COALESCE(SUM(impressions_count), 0)::BIGINT AS total_impressions,
        COUNT(*) FILTER (WHERE impressions_count >= 80 OR (reaction_fire_count + comment_count) >= 20)::BIGINT AS hot_posts_count
    FROM public.banter_posts
    WHERE status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_banter_analytics() TO anon, authenticated;

-- 4. Ensure RLS policies on existing banter tables
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

DROP POLICY IF EXISTS "Public read active reactions" ON public.banter_reactions;
CREATE POLICY "Public read active reactions"
    ON public.banter_reactions
    FOR SELECT
    TO anon, authenticated
    USING (true);
