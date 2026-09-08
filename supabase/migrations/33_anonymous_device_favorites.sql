-- Migration 33: Anonymous Devices Favorite Matches tracking
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anonymous_devices' AND column_name = 'favorite_matches'
  ) THEN
    ALTER TABLE public.anonymous_devices ADD COLUMN favorite_matches JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
