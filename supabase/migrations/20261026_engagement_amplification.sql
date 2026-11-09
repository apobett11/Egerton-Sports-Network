-- Migration 20261026_engagement_amplification.sql
-- Naturalistic Social Velocity & Metrics Amplification Engine

-- 1. Ensure public metrics and private counters exist on public.banter_posts
ALTER TABLE public.banter_posts
ADD COLUMN IF NOT EXISTS raw_views INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS impressions INT DEFAULT 24,
ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reposts_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS replies_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;

-- Performance index for feed ranking
CREATE INDEX IF NOT EXISTS idx_banter_posts_impressions 
  ON public.banter_posts (impressions DESC);

-- 2. Internal Function: Calculate Deterministic Initial Seed
CREATE OR REPLACE FUNCTION public.calculate_initial_seed(p_id UUID)
RETURNS INT AS $$
BEGIN
  -- Extracts 2 hex characters from UUID to generate a stable seed between 18 and 45
  RETURN 18 + (('x' || substring(p_id::text, 1, 2))::bit(8)::int % 28);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Core Engine: Recalculate Public Impressions
-- Normal posts and messages operate within normal range (500 to 1,500).
-- Only trending posts enter the top space (> 1,500 and <= 1,940).
CREATE OR REPLACE FUNCTION public.calculate_amplified_impressions(
  p_id UUID,
  p_raw_views INT,
  p_likes INT,
  p_reposts INT,
  p_replies INT,
  p_created_at TIMESTAMPTZ,
  p_is_trending BOOLEAN DEFAULT FALSE
)
RETURNS INT AS $$
DECLARE
  v_seed INT;
  v_hours_old NUMERIC;
  v_age_bonus INT;
  v_velocity NUMERIC;
  v_result INT;
  v_min_tier INT;
  v_max_cap INT;
BEGIN
  v_seed := public.calculate_initial_seed(p_id);
  v_hours_old := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600);
  
  -- Time maturation factor (caps at +60)
  v_age_bonus := LEAST(60, FLOOR(15 * LN(v_hours_old + 1))::int);
  
  -- Weighted engagement score
  v_velocity := (COALESCE(p_raw_views, 1) * 2.5) + (COALESCE(p_likes, 0) * 18.0) + (COALESCE(p_reposts, 0) * 42.0) + (COALESCE(p_replies, 0) * 28.0) + v_age_bonus;

  IF p_is_trending THEN
    -- Only trendings have the top space: strictly above 1,500 and <= 1,940
    v_min_tier := 1500 + (v_seed % 25);
    v_max_cap := 1940;
    v_result := v_min_tier + FLOOR((v_max_cap - v_min_tier) * (v_velocity / (v_velocity + 180)))::int;
    RETURN LEAST(v_max_cap, GREATEST(1501, v_result));
  ELSE
    -- Normal posts and messages: normal range between 500 and 1500 (never exceeding 1500)
    -- Freshly inserted posts with initial velocity stay at initial seed (18..45)
    IF v_velocity <= 2.5 THEN
      RETURN v_seed;
    ELSE
      v_min_tier := 500 + (v_seed % 50);
      v_max_cap := 1500;
      v_result := v_min_tier + FLOOR((v_max_cap - v_min_tier) * (v_velocity / (v_velocity + 180)))::int;
      RETURN LEAST(v_max_cap, GREATEST(500, v_result));
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Overload for backwards compatibility with 6-argument callers
CREATE OR REPLACE FUNCTION public.calculate_amplified_impressions(
  p_id UUID,
  p_raw_views INT,
  p_likes INT,
  p_reposts INT,
  p_replies INT,
  p_created_at TIMESTAMPTZ
)
RETURNS INT AS $$
BEGIN
  RETURN public.calculate_amplified_impressions(p_id, p_raw_views, p_likes, p_reposts, p_replies, p_created_at, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Trigger Function: Automatically manage metrics on Insert and Update
CREATE OR REPLACE FUNCTION public.sync_banter_post_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_trending BOOLEAN;
BEGIN
  -- Messages / replies (parent_id IS NOT NULL) are always normal (never in top trending space)
  IF NEW.parent_id IS NOT NULL THEN
    v_trending := FALSE;
  ELSE
    v_trending := COALESCE(NEW.is_trending, FALSE);
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.raw_views := COALESCE(NEW.raw_views, 1);
    NEW.is_trending := v_trending;
    -- Seed impressions immediately so the post is never at 0
    IF v_trending THEN
      NEW.impressions := public.calculate_amplified_impressions(
        NEW.id,
        NEW.raw_views,
        NEW.likes_count,
        NEW.reposts_count,
        NEW.replies_count,
        COALESCE(NEW.created_at, NOW()),
        TRUE
      );
    ELSE
      NEW.impressions := public.calculate_initial_seed(NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate impressions whenever interactions or views shift
    IF (NEW.raw_views IS DISTINCT FROM OLD.raw_views)
       OR (NEW.likes_count IS DISTINCT FROM OLD.likes_count)
       OR (NEW.reposts_count IS DISTINCT FROM OLD.reposts_count)
       OR (NEW.replies_count IS DISTINCT FROM OLD.replies_count)
       OR (NEW.is_trending IS DISTINCT FROM OLD.is_trending) THEN
      NEW.impressions := public.calculate_amplified_impressions(
        NEW.id,
        NEW.raw_views,
        NEW.likes_count,
        NEW.reposts_count,
        NEW.replies_count,
        NEW.created_at,
        v_trending
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_banter_post_metrics ON public.banter_posts;
CREATE TRIGGER trg_sync_banter_post_metrics
BEFORE INSERT OR UPDATE ON public.banter_posts
FOR EACH ROW EXECUTE FUNCTION public.sync_banter_post_metrics();

-- 5. Atomic RPC: Increment Viewport Impression (Single call from client IntersectionObserver)
CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.banter_posts
  SET raw_views = raw_views + 1
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_post_view(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_initial_seed(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_amplified_impressions(UUID, INT, INT, INT, INT, TIMESTAMPTZ, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_amplified_impressions(UUID, INT, INT, INT, INT, TIMESTAMPTZ) TO anon, authenticated, service_role;
