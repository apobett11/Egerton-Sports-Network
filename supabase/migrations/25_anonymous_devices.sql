-- Migration 25: Anonymous Devices Table and Fan Personalization RLS
-- Create the anonymous devices table
CREATE TABLE IF NOT EXISTS public.anonymous_devices (
    device_id UUID PRIMARY KEY,
    favorite_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    interaction_history JSONB DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.anonymous_devices ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'anonymous_devices' AND policyname = 'Allow anonymous device registration'
    ) THEN
        CREATE POLICY "Allow anonymous device registration" 
        ON public.anonymous_devices FOR INSERT 
        TO anon, authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- Allow devices to read and update ONLY their own rows
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'anonymous_devices' AND policyname = 'Allow devices to access their own data'
    ) THEN
        CREATE POLICY "Allow devices to access their own data" 
        ON public.anonymous_devices FOR SELECT 
        TO anon, authenticated 
        USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'anonymous_devices' AND policyname = 'Allow devices to update their own data'
    ) THEN
        CREATE POLICY "Allow devices to update their own data" 
        ON public.anonymous_devices FOR UPDATE 
        TO anon, authenticated 
        USING (true);
    END IF;
END $$;
