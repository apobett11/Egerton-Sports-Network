-- Migration 92: Official Disciplinary Sanctions - Deduct 2 Points each from Championship Teams
-- Target Team UIDs:
--   Young stars:   20000000-0000-4000-8000-000000000008
--   Young legends: 20000000-0000-4000-8000-000000000007
--   Tatton:        20000000-0000-4000-8000-000000000005
--   Law:           20000000-0000-4000-8000-00000000000a

UPDATE public.league_standings
SET points = GREATEST(0, points - 2),
    last_updated = NOW()
WHERE team_id IN (
    '20000000-0000-4000-8000-000000000008',
    '20000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-00000000000a'
);

-- Insert audit records in admin error / sanctions log if available
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_error_logs') THEN
        INSERT INTO public.admin_error_logs (fixture_id, module_name, error_message, created_at)
        VALUES 
            (NULL, 'SanctionsEngine', 'Disciplinary deduction: 2 points deducted from Young stars (UID: 20000000-0000-4000-8000-000000000008)', NOW()),
            (NULL, 'SanctionsEngine', 'Disciplinary deduction: 2 points deducted from Young legends (UID: 20000000-0000-4000-8000-000000000007)', NOW()),
            (NULL, 'SanctionsEngine', 'Disciplinary deduction: 2 points deducted from Tatton (UID: 20000000-0000-4000-8000-000000000005)', NOW()),
            (NULL, 'SanctionsEngine', 'Disciplinary deduction: 2 points deducted from Law (UID: 20000000-0000-4000-8000-00000000000a)', NOW());
    END IF;
END $$;
