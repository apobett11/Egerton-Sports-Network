-- Migration 63: Official League Sanction - Deduct 2 Points from Legends FC
-- Target Team UID: 10000000-0000-4000-8000-000000000007 (Legends FC)

UPDATE public.league_standings
SET points = GREATEST(0, points - 2),
    last_updated = NOW()
WHERE team_id = '10000000-0000-4000-8000-000000000007';

-- Insert audit log if audit table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_error_logs') THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message, created_at)
        VALUES (NULL, 'SanctionsEngine', 'Deducted 2 points from Legends FC (UID: 10000000-0000-4000-8000-000000000007)', NOW());
    END IF;
END $$;
