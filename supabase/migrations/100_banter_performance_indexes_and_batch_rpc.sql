-- Migration 100: Banter Industrial Performance Indexes, Atomicity & Shared DB Protection
-- Egerton Sports Network (ESN)
-- Protects shared livescore database CPU, RAM, connection pool and bandwidth.
-- 1. Compound indexes to ensure zero sequential table scans under 1,000+ users.
-- 2. Trigger-based comment counting to eliminate secondary client update calls.
-- 3. Batched metrics RPC to replace N individual update queries with 1 transaction.
-- 4. Native RLS policies for anonymous and authenticated devices.

-- 1. Performance Indexes for Zero-Scan Query Plans
CREATE INDEX IF NOT EXISTS idx_banter_comments_post_created
    ON public.banter_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_banter_posts_status_created
    ON public.banter_posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banter_posts_match_created
    ON public.banter_posts (match_id, created_at DESC)
    WHERE match_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_banter_posts_trending_perf
    ON public.banter_posts (created_at DESC, comment_count DESC, repost_count DESC)
    WHERE status = 'active';

-- 2. Check Constraints for Database Payload Protection
ALTER TABLE public.banter_posts 
DROP CONSTRAINT IF EXISTS chk_banter_content_length;

ALTER TABLE public.banter_posts 
ADD CONSTRAINT chk_banter_content_length 
CHECK (char_length(content) <= 300);

ALTER TABLE public.banter_comments 
DROP CONSTRAINT IF EXISTS chk_comment_content_length;

ALTER TABLE public.banter_comments 
ADD CONSTRAINT chk_comment_content_length 
CHECK (char_length(content) <= 300);

-- 3. Trigger: Atomic Increment of Parent Post comment_count on Comment Insert
CREATE OR REPLACE FUNCTION public.fn_sync_banter_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE public.banter_posts
        SET comment_count = COALESCE(comment_count, 0) + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE public.banter_posts
        SET comment_count = GREATEST(0, COALESCE(comment_count, 1) - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_banter_comment_count_sync ON public.banter_comments;
CREATE TRIGGER trg_banter_comment_count_sync
AFTER INSERT OR DELETE ON public.banter_comments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_banter_comment_count();

-- 4. Batch Metrics Stored Procedure (Reduces N parallel HTTP requests to 1 atomic call)
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
        SET impressions_count = COALESCE(impressions_count, 0) + COALESCE(p_impressions[i], 0),
            repost_count = COALESCE(repost_count, 0) + COALESCE(p_reposts[i], 0),
            views_count = COALESCE(views_count, 0) + COALESCE(p_views[i], 0)
        WHERE id = p_post_ids[i];
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batch_increment_banter_metrics(UUID[], INT[], INT[], INT[]) 
TO anon, authenticated, service_role;

-- 5. Standard Non-Blocking RLS Policies on banter_comments
ALTER TABLE public.banter_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active comments" ON public.banter_comments;
CREATE POLICY "Public read active comments"
    ON public.banter_comments
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

DROP POLICY IF EXISTS "Public insert active comments" ON public.banter_comments;
CREATE POLICY "Public insert active comments"
    ON public.banter_comments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        content IS NOT NULL AND length(trim(content)) > 0
    );
