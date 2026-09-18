-- ============================================================================
-- STANDALONE LIVE UPDATE SCRIPT FOR SUPABASE SQL EDITOR
-- Non-destructive update for system_settings platform_info
-- Preserves all tables, constraints, users, and matches
-- ============================================================================

DO $$
BEGIN
  -- 1. If 'platform_info' key exists, update its name property inside the JSONB payload
  UPDATE public.system_settings
  SET value = jsonb_set(
    COALESCE(value, '{}'::jsonb),
    '{name}',
    '"Egerscore Sports Ecosystem"'::jsonb
  ),
  updated_at = NOW()
  WHERE key = 'platform_info';

  -- 2. If 'platform_info' does not exist yet, insert the clean record
  INSERT INTO public.system_settings (key, value, updated_at)
  VALUES (
    'platform_info',
    '{"name": "Egerscore Sports Ecosystem", "version": "1.0.0", "maintenance_mode": false}'::jsonb,
    NOW()
  )
  ON CONFLICT (key) DO UPDATE
  SET value = jsonb_set(
    COALESCE(public.system_settings.value, '{}'::jsonb),
    '{name}',
    '"Egerscore Sports Ecosystem"'::jsonb
  ),
  updated_at = NOW();

  RAISE NOTICE 'Platform info successfully sanitized to Egerscore Sports Ecosystem.';
END $$;
