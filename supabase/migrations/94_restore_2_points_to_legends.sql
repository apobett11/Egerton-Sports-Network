-- Migration 94: Official League Sanction Adjustment - Restore 2 Points to Legends FC
-- Target Team UID: 10000000-0000-4000-8000-000000000007 (Legends FC)
-- Reduces deduction from 4 to 2 (restoring 2 points).

UPDATE public.league_standings
SET points = points + 2,
    last_updated = NOW()
WHERE team_id = '10000000-0000-4000-8000-000000000007';

-- Insert audit record in admin error / sanctions log if available
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_error_logs') THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message, created_at)
        VALUES (NULL, 'SanctionsEngine', '2 points restored to Legends FC (UID: 10000000-0000-4000-8000-000000000007) - deduction adjusted from 4 to 2 points', NOW());
    END IF;
END $$;
