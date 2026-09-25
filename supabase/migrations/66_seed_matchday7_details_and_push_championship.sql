-- Migration 66: Seed Matchday 7 Details (Referees, Linesmen, Pitches, Times) and Push Unlisted Championship Fixtures to Matchday 8
-- Strictly uses canonical entity UUIDs.
--
-- Matchday 7 Fixtures:
-- 1. Mighty Blacks vs Legends Fc (f0000000-0000-4000-8000-000000000028): CR - Edu, Lines - Wazito, Celtics | Pitch A, 8:30 AM
-- 2. Giants FC vs Med fc (f0000000-0000-4000-8000-000000000027): CR - Lamoh, Lines - Super eagles, Rising stars | Pitch B, 8:30 AM
-- 3. BCOM FC vs Blue Blazers (f0000000-0000-4000-8000-000000000029): CR - Chalo, Lines - Five Stars, Santos | Pitch C, 8:30 AM
-- 4. Wazito Fc vs Celtics FC (f0000000-0000-4000-8000-000000000026): CR - Ericko, Lines - Mighty Blacks, Legends | Pitch A, 10:30 AM
-- 5. Super eagles vs Rising stars (f0000000-0000-4000-8000-000000000025): CR - Daudi, Lines - Giants, Med fc | Pitch B, 10:30 AM
-- 6. Five Stars fc vs Santos fc (f0000000-0000-4000-8000-00000000002a): CR - Jatugo, Lines - BCOM, Blue Blazers | Pitch C, 10:30 AM
-- 7. Ajax fc vs Fass Elites (c0000000-0000-4000-8000-00000000001e): CR - Jatugo, Lines - Young legends, Aged FC | Pitch B, 12:30 PM
-- 8. Emsa FC vs Tatton fc (c0000000-0000-4000-8000-00000000001d): CR - Brilliant, Lines - Talanta, law fc | Pitch C, 12:30 PM
--
-- Championship Fixtures pushed to Matchday 8:
-- - Aged FC vs law fc (c0000000-0000-4000-8000-00000000001a)
-- - Talanta fc vs Young legends (c0000000-0000-4000-8000-00000000001c)
-- - young stars vs Rangers fc (c0000000-0000-4000-8000-00000000001b)

-- 1. Ensure Edu and Brilliant exist in public.referees and public.profiles with canonical UUIDs
INSERT INTO public.referees (id, name, phone, status, badge_level)
VALUES 
  ('30000000-0000-4000-9000-000000000007', 'Edu', '0711000007', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000008', 'Brilliant', '0711000008', 'Active', 'FKF National Level 2')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = 'Active',
  badge_level = EXCLUDED.badge_level;

INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
VALUES
  ('30000000-0000-4000-9000-000000000007', 'ref.edu@egerton.ac.ke', 'Edu', 'Referee', '0711000007', 'referee', true),
  ('30000000-0000-4000-9000-000000000008', 'ref.brilliant@egerton.ac.ke', 'Brilliant', 'Referee', '0711000008', 'referee', true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = 'referee',
  is_verified = true;

-- 2. Push the 3 unlisted Championship games to Matchday 8 first to clear pitch/slot collision constraints
UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-10-03',
  pitch_id = NULL,
  slot_number = NULL,
  period = NULL,
  start_time = NULL,
  end_time = NULL,
  updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000001a',
  'c0000000-0000-4000-8000-00000000001c',
  'c0000000-0000-4000-8000-00000000001b'
);

UPDATE public.fixtures
SET
  matchday = 8,
  scheduled_time = '2026-10-03 13:00:00+00',
  venue = NULL,
  updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000001a',
  'c0000000-0000-4000-8000-00000000001c',
  'c0000000-0000-4000-8000-00000000001b'
);

-- 3. Update Matchday 7 EPL Games (Fixtures & Schedules)
-- Fixture 1: Mighty Blacks vs Legends Fc (f0000000-0000-4000-8000-000000000028)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000007',
  linesman_team_a_id = '10000000-0000-4000-8000-00000000000a',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000b',
  venue = 'Pitch A — Main Stadium Pitch',
  scheduled_time = '2026-09-26 08:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-000000000028';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000007',
  linesman_team_a_id = '10000000-0000-4000-8000-00000000000a',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000b',
  pitch_id = '91111111-1111-1111-1111-111111111111',
  slot_number = 1,
  period = 'AM',
  start_time = '08:30',
  end_time = '10:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000028';

-- Fixture 2: Giants FC vs Med fc (f0000000-0000-4000-8000-000000000027)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000002',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000001',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000c',
  venue = 'Pitch B — Pavilion Grounds',
  scheduled_time = '2026-09-26 08:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-000000000027';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000002',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000001',
  linesman_team_b_id = '10000000-0000-4000-8000-00000000000c',
  pitch_id = '92222222-2222-2222-2222-222222222222',
  slot_number = 1,
  period = 'AM',
  start_time = '08:30',
  end_time = '10:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000027';

-- Fixture 3: BCOM FC vs Blue Blazers (f0000000-0000-4000-8000-000000000029)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000003',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000002',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000003',
  venue = 'Pitch C — Tatton Complex Ground',
  scheduled_time = '2026-09-26 08:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-000000000029';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000003',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000002',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000003',
  pitch_id = '93333333-3333-3333-3333-333333333333',
  slot_number = 1,
  period = 'AM',
  start_time = '08:30',
  end_time = '10:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000029';

-- Fixture 4: Wazito Fc vs Celtics FC (f0000000-0000-4000-8000-000000000026)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000005',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000006',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000007',
  venue = 'Pitch A — Main Stadium Pitch',
  scheduled_time = '2026-09-26 10:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-000000000026';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000005',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000006',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000007',
  pitch_id = '91111111-1111-1111-1111-111111111111',
  slot_number = 2,
  period = 'AM',
  start_time = '10:30',
  end_time = '12:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000026';

-- Fixture 5: Super eagles vs Rising stars (f0000000-0000-4000-8000-000000000025)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000004',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000008',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000009',
  venue = 'Pitch B — Pavilion Grounds',
  scheduled_time = '2026-09-26 10:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-000000000025';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000004',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000008',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000009',
  pitch_id = '92222222-2222-2222-2222-222222222222',
  slot_number = 2,
  period = 'AM',
  start_time = '10:30',
  end_time = '12:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-000000000025';

-- Fixture 6: Five Stars fc vs Santos fc (f0000000-0000-4000-8000-00000000002a)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000004',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000005',
  venue = 'Pitch C — Tatton Complex Ground',
  scheduled_time = '2026-09-26 10:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'f0000000-0000-4000-8000-00000000002a';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '10000000-0000-4000-8000-000000000004',
  linesman_team_b_id = '10000000-0000-4000-8000-000000000005',
  pitch_id = '93333333-3333-3333-3333-333333333333',
  slot_number = 2,
  period = 'AM',
  start_time = '10:30',
  end_time = '12:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'f0000000-0000-4000-8000-00000000002a';

-- 4. Update Matchday 7 Championship Games (Fixtures & Schedules)
-- Fixture 7: Ajax fc vs Fass Elites (c0000000-0000-4000-8000-00000000001e)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '20000000-0000-4000-8000-000000000007',
  linesman_team_b_id = '20000000-0000-4000-8000-000000000001',
  venue = 'Pitch B — Pavilion Grounds',
  scheduled_time = '2026-09-26 12:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001e';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000006',
  linesman_team_a_id = '20000000-0000-4000-8000-000000000007',
  linesman_team_b_id = '20000000-0000-4000-8000-000000000001',
  pitch_id = '92222222-2222-2222-2222-222222222222',
  slot_number = 1,
  period = 'PM',
  start_time = '12:30',
  end_time = '14:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001e';

-- Fixture 8: Emsa FC vs Tatton fc (c0000000-0000-4000-8000-00000000001d)
UPDATE public.fixtures
SET
  referee_id = '30000000-0000-4000-9000-000000000008',
  linesman_team_a_id = '20000000-0000-4000-8000-000000000006',
  linesman_team_b_id = '20000000-0000-4000-8000-00000000000a',
  venue = 'Pitch C — Tatton Complex Ground',
  scheduled_time = '2026-09-26 12:30:00+00',
  matchday = 7,
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001d';

UPDATE public.matchday_schedules
SET
  center_referee_id = '30000000-0000-4000-9000-000000000008',
  linesman_team_a_id = '20000000-0000-4000-8000-000000000006',
  linesman_team_b_id = '20000000-0000-4000-8000-00000000000a',
  pitch_id = '93333333-3333-3333-3333-333333333333',
  slot_number = 1,
  period = 'PM',
  start_time = '12:30',
  end_time = '14:30',
  play_date = '2026-09-26',
  matchday_number = 7,
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001d';
