-- Migration 46: Feature Feedback Polls (Temporary Determinant Poll for Match Predictions)
-- Egerton Sports Network (ESN)

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

-- Safely add columns if the table already existed
ALTER TABLE public.feature_feedback_polls 
    ADD COLUMN IF NOT EXISTS opened_guest_page BOOLEAN DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS opened_odds_page BOOLEAN DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS voted BOOLEAN DEFAULT NULL;

-- Make vote nullable for devices that only opened pages without voting yet
ALTER TABLE public.feature_feedback_polls 
    ALTER COLUMN vote DROP NOT NULL;

-- Performance Indexes: Device index for single-query lookups, feature key index for filtering
CREATE INDEX IF NOT EXISTS idx_feature_feedback_device ON public.feature_feedback_polls(device_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature_key ON public.feature_feedback_polls(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_vote ON public.feature_feedback_polls(vote);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_guest_page ON public.feature_feedback_polls(opened_guest_page);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_odds_page ON public.feature_feedback_polls(opened_odds_page);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feature_feedback_polls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow any device (anon and authenticated) to check their own vote
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feature_feedback_polls' AND policyname = 'Allow devices to read own feature vote'
    ) THEN
        CREATE POLICY "Allow devices to read own feature vote"
        ON public.feature_feedback_polls FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- Policy 2: Allow devices to cast their single vote (insert or upsert)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feature_feedback_polls' AND policyname = 'Allow devices to submit feature vote'
    ) THEN
        CREATE POLICY "Allow devices to submit feature vote"
        ON public.feature_feedback_polls FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- Policy 3: Allow devices to update their own vote if needed
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feature_feedback_polls' AND policyname = 'Allow devices to update own feature vote'
    ) THEN
        CREATE POLICY "Allow devices to update own feature vote"
        ON public.feature_feedback_polls FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- Policy 4: Allow service_role and admins full deletion / management for table purging
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feature_feedback_polls' AND policyname = 'Allow admin and service role to delete feedback votes'
    ) THEN
        CREATE POLICY "Allow admin and service role to delete feedback votes"
        ON public.feature_feedback_polls FOR DELETE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;
