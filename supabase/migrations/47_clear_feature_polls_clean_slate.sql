-- Migration 47: Clean Slate for Feature Feedback Polls & Device Tracking
-- Egerton Sports Network (ESN)

-- 1. Ensure table structure exists with all required columns linked to device_id
CREATE TABLE IF NOT EXISTS public.feature_feedback_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    feature_key TEXT NOT NULL DEFAULT 'match_predictions_poll',
    opened_guest_page BOOLEAN DEFAULT NULL,
    opened_odds_page BOOLEAN DEFAULT NULL,
    voted BOOLEAN DEFAULT NULL,
    vote TEXT DEFAULT NULL CHECK (vote IS NULL OR vote IN ('yes', 'no')),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_device_feature_poll UNIQUE (device_id, feature_key)
);

-- 2. Clear table so all devices start with a clean slate
DELETE FROM public.feature_feedback_polls WHERE feature_key = 'match_predictions_poll';

-- 3. Clear fallback store in system_settings
UPDATE public.system_settings 
SET value = jsonb_build_object('votes', '{}'::jsonb, 'updatedAt', timezone('utc'::text, now())::text),
    updated_at = timezone('utc'::text, now())
WHERE key = 'feature_feedback_fallback';

-- 4. Re-verify Performance Indexes: Device index for single-query lookups, feature key index for filtering
CREATE INDEX IF NOT EXISTS idx_feature_feedback_device ON public.feature_feedback_polls(device_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature_key ON public.feature_feedback_polls(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_vote ON public.feature_feedback_polls(vote);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_guest_page ON public.feature_feedback_polls(opened_guest_page);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_odds_page ON public.feature_feedback_polls(opened_odds_page);
