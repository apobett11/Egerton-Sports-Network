-- Migration 90: Fresh Official League Sanction - Deduct 2 Points from Legends FC
-- Target Team UID: 10000000-0000-4000-8000-000000000007 (Legends FC)
-- This is a fresh disciplinary deduction of 2 points, separate from past sanctions.

UPDATE public.league_standings
SET points = GREATEST(0, points - 2),
    last_updated = NOW()
WHERE team_id = '10000000-0000-4000-8000-000000000007';

-- Insert audit record in admin error / sanctions log if available
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_error_logs') THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message, created_at)
        VALUES (NULL, 'SanctionsEngine', 'Fresh 2-point deduction applied to Legends FC (UID: 10000000-0000-4000-8000-000000000007) - separate from past sanction (cumulative 4 points total deduction)', NOW());
    END IF;
END $$;
