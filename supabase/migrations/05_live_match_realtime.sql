-- Migration 05: Live Match Engine Realtime & Journalist Authorization
-- Enables realtime publication and grants Journalists permissions to publish match events and update live fixture scores/statuses.

-- 1. Update match_events table columns & constraints for full match event composer support
ALTER TABLE public.match_events ALTER COLUMN player_id DROP NOT NULL;
ALTER TABLE public.match_events ALTER COLUMN team_id DROP NOT NULL;

-- Add event_target column if it does not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_events' AND column_name = 'event_target'
  ) THEN
    ALTER TABLE public.match_events ADD COLUMN event_target TEXT CHECK (event_target IN ('home', 'away', 'match')) DEFAULT 'home';
  END IF;
END $$;

-- Add created_by column if it does not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_events' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.match_events ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop old check constraint on type and add extended check constraint
ALTER TABLE public.match_events DROP CONSTRAINT IF EXISTS match_events_type_check;
ALTER TABLE public.match_events ADD CONSTRAINT match_events_type_check 
  CHECK (type IN (
    'goal', 'yellow', 'red', 'sub_in', 'sub_out', 'injury', 'penalty', 'own_goal',
    'kickoff', 'ht', 'second_half', 'ft', 'suspended', 'resumed', 'extra_time', 'shootout', 'abandoned'
  ));

-- 2. Update RLS Policies to authorize Journalists

-- Journalist Insert Policy on match_events
DROP POLICY IF EXISTS "Journalists, officials or admins insert match events" ON public.match_events;
DROP POLICY IF EXISTS "Officials or admins insert match events" ON public.match_events;

CREATE POLICY "Journalists, officials or admins insert match events"
  ON public.match_events FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('journalist', 'referee', 'linesman', 'admin')
  );

-- Journalist Update Policy on fixtures
DROP POLICY IF EXISTS "Journalists, referees update assigned fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Referees update assigned fixtures" ON public.fixtures;

CREATE POLICY "Journalists, referees update assigned fixtures"
  ON public.fixtures FOR UPDATE USING (
    public.get_auth_role() IN ('journalist', 'referee', 'linesman', 'admin')
  );

-- 3. Enable Supabase Realtime Publication for fixtures and match_events
ALTER TABLE public.fixtures REPLICA IDENTITY FULL;
ALTER TABLE public.match_events REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fixtures;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
