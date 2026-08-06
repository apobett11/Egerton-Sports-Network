-- Migration 14: President Fixtures RLS Alignment, Foreign Key Hardening & Championship Seeding
-- Grants President role write permissions for fixtures and seeds demo Championship teams if missing

-- 1. RLS Policy for Fixtures (Allow President & Admin full access)
DROP POLICY IF EXISTS "Admins manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Admins and Presidents manage fixtures" ON public.fixtures;

CREATE POLICY "Admins and Presidents manage fixtures"
  ON public.fixtures FOR ALL USING (
    public.get_auth_role() IN ('admin', 'president')
  );

-- 2. Foreign Key Hardening: Ensure referee_id can store referee profile or referee pool IDs
DO $$ BEGIN
  ALTER TABLE public.fixtures DROP CONSTRAINT IF EXISTS fixtures_referee_id_fkey;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Ensure Default Competitions Exist
INSERT INTO public.competitions (id, name, slug, country, season, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Egerton Premier League', 'egerton-premier-league', 'Kenya', '2025/2026', true),
  ('22222222-2222-2222-2222-222222222222', 'Egerton Championship', 'egerton-championship', 'Kenya', '2025/2026', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Demo Championship Teams ONLY IF THEY DO NOT EXIST
INSERT INTO public.teams (id, competition_id, name, short_name, color_code, status)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Championship FC Alpha', 'CHP-A', '#10B981', 'approved'),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Championship FC Beta', 'CHP-B', '#6366F1', 'approved'),
  ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Championship FC Gamma', 'CHP-C', '#F59E0B', 'approved'),
  ('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Championship FC Delta', 'CHP-D', '#EC4899', 'approved')
ON CONFLICT (id) DO NOTHING;
