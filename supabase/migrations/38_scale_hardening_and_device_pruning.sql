-- Migration 38: Scale Hardening, Device Pruning & Index Optimization
-- Non-destructive optimization to ensure minimal database load and bounded storage growth.

-- 1. Index on last_seen_at for rapid queries and cleanups
CREATE INDEX IF NOT EXISTS idx_anon_devices_last_seen 
  ON public.anonymous_devices (last_seen_at DESC);

-- 2. Index on favorite_team_id
CREATE INDEX IF NOT EXISTS idx_anon_devices_favorite_team 
  ON public.anonymous_devices (favorite_team_id);

-- 3. Automatic Cleanup Function for Inactive Anonymous Devices
-- Frees memory and tabular space by pruning ephemeral devices older than 30 days
-- with no onboarding completed and no team bookmarked.
CREATE OR REPLACE FUNCTION public.prune_stale_anonymous_devices(p_days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.anonymous_devices
  WHERE last_seen_at < (NOW() - (p_days || ' days')::INTERVAL)
    AND has_completed_onboarding = FALSE
    AND favorite_team_id IS NULL;
    
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
