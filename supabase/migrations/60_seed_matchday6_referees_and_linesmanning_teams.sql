-- Migration 60: Seed Matchday 6 Referees and Linesmanning Teams Officiating Allocation
-- Exact Match Pairings with strict UIDs:
-- 1. Blue Blazers vs Giants: CR - Jark, Lines - Legends, Wazito
-- 2. Five Star vs BCOM: CR - Lamoh, Lines - Super Eagles, Celtics
-- 3. Med fc vs Rising stars: CR - Chalo, Lines - Santos, Mighty Blacks
-- 4. Legends vs Wazito: CR - Daudi, Lines - Blue Blazers, Giants
-- 5. Super eagles vs Celtics: CR - Ericko, Lines - Five Star, BCOM
-- 6. Santos vs Mighty Blacks: CR - Jatugo, Lines - Med fc, Rising stars

-- 1. Ensure columns exist on public.fixtures
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixtures' AND column_name = 'linesman_team_a_id'
  ) THEN
    ALTER TABLE public.fixtures ADD COLUMN linesman_team_a_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixtures' AND column_name = 'linesman_team_b_id'
  ) THEN
    ALTER TABLE public.fixtures ADD COLUMN linesman_team_b_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Seed Official Referees in public.referees and public.profiles with Exact UUIDs
INSERT INTO public.referees (id, name, phone, status, badge_level)
VALUES 
  ('30000000-0000-4000-9000-000000000001', 'Jark', '0711000001', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000002', 'Lamoh', '0711000002', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000003', 'Chalo', '0711000003', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000004', 'Daudi', '0711000004', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000005', 'Ericko', '0711000005', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000006', 'Jatugo', '0711000006', 'Active', 'FKF Campus Level 3')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = 'Active',
  badge_level = EXCLUDED.badge_level;

INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
VALUES
  ('30000000-0000-4000-9000-000000000001', 'ref.jark@egerton.ac.ke', 'Jark', 'Referee', '0711000001', 'referee', true),
  ('30000000-0000-4000-9000-000000000002', 'ref.lamoh@egerton.ac.ke', 'Lamoh', 'Referee', '0711000002', 'referee', true),
  ('30000000-0000-4000-9000-000000000003', 'ref.chalo@egerton.ac.ke', 'Chalo', 'Referee', '0711000003', 'referee', true),
  ('30000000-0000-4000-9000-000000000004', 'ref.daudi@egerton.ac.ke', 'Daudi', 'Referee', '0711000004', 'referee', true),
  ('30000000-0000-4000-9000-000000000005', 'ref.ericko@egerton.ac.ke', 'Ericko', 'Referee', '0711000005', 'referee', true),
  ('30000000-0000-4000-9000-000000000006', 'ref.jatugo@egerton.ac.ke', 'Jatugo', 'Referee', '0711000006', 'referee', true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = 'referee',
  is_verified = true;

-- 3. Ensure the 6 canonical fixtures exist in public.fixtures and update their officiating data
-- Fixture 1: Blue Blazers vs Giants (f0000000-0000-4000-8000-000000000022)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-000000000022',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000008',
  '2026-09-20 08:30:00+00',
  'UPCOMING',
  'Pitch A — Main Stadium Pitch',
  6,
  '30000000-0000-4000-9000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-00000000000a'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000001',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000007',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000a',
  venue = 'Pitch A — Main Stadium Pitch',
  matchday = 6;

-- Fixture 2: Five Star vs BCOM (f0000000-0000-4000-8000-000000000024)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-000000000024',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '2026-09-20 08:30:00+00',
  'UPCOMING',
  'Pitch B — Pavilion Grounds',
  6,
  '30000000-0000-4000-9000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-00000000000b'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000002',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000001',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000b',
  venue = 'Pitch B — Pavilion Grounds',
  matchday = 6;

-- Fixture 3: Med fc vs Rising stars (f0000000-0000-4000-8000-000000000020)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-000000000020',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000009',
  '10000000-0000-4000-8000-00000000000c',
  '2026-09-20 08:30:00+00',
  'UPCOMING',
  'Pitch C — Tatton Complex Ground',
  6,
  '30000000-0000-4000-9000-000000000003',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000006'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000003',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000003',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000006',
  venue = 'Pitch C — Tatton Complex Ground',
  matchday = 6;

-- Fixture 4: Legends vs Wazito (f0000000-0000-4000-8000-000000000021)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-000000000021',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-00000000000a',
  '2026-09-20 10:30:00+00',
  'UPCOMING',
  'Pitch A — Main Stadium Pitch',
  6,
  '30000000-0000-4000-9000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000008'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000004',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000005',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000008',
  venue = 'Pitch A — Main Stadium Pitch',
  matchday = 6;

-- Fixture 5: Super eagles vs Celtics (f0000000-0000-4000-8000-00000000001f)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-00000000001f',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-00000000000b',
  '2026-09-20 10:30:00+00',
  'UPCOMING',
  'Pitch B — Pavilion Grounds',
  6,
  '30000000-0000-4000-9000-000000000005',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000005',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000002',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000004',
  venue = 'Pitch B — Pavilion Grounds',
  matchday = 6;

-- Fixture 6: Santos vs Mighty Blacks (f0000000-0000-4000-8000-000000000023)
INSERT INTO public.fixtures (
  id, competition_id, home_team_id, away_team_id, scheduled_time, status, venue, matchday, referee_id, linesman_team_a_id, linesman_team_b_id
) VALUES (
  'f0000000-0000-4000-8000-000000000023',
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000006',
  '2026-09-20 10:30:00+00',
  'UPCOMING',
  'Pitch C — Tatton Complex Ground',
  6,
  '30000000-0000-4000-9000-000000000006',
  '10000000-0000-4000-8000-000000000009',
  '10000000-0000-4000-8000-00000000000c'
)
ON CONFLICT (id) DO UPDATE SET
  referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000009',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000c',
  venue = 'Pitch C — Tatton Complex Ground',
  matchday = 6;

-- 4. Update matchday_schedules entries to match
UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000001',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000007',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000a',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000022';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000002',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000001',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000b',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000024';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000003',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000003',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000006',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000020';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000004',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000005',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000008',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000021';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000005',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000002',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000004',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-00000000001f';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000009',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000c',
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000023';
