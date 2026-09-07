-- Migration 32: Announcements recipients column and Anonymous Devices announcements tracking
-- 1. Ensure recipients column exists on announcements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'recipients'
  ) THEN
    ALTER TABLE public.announcements ADD COLUMN recipients TEXT DEFAULT 'all';
  END IF;
END $$;

-- Synchronize target_role and recipients if both exist
UPDATE public.announcements 
SET recipients = target_role 
WHERE recipients IS NULL OR recipients = 'all';

-- 2. Ensure announcements column exists on anonymous_devices for device-specific read status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_devices' AND column_name = 'announcements'
  ) THEN
    ALTER TABLE public.anonymous_devices ADD COLUMN announcements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
