-- Migration 73: Clean Championship Matchday 8 & Remove Duplicates
-- ============================================================================
-- 1. Ensure Matchday 8 has ONLY the 3 played matches:
--    - Aged FC vs law fc (c0000000-0000-4000-8000-00000000001a): 0-1 FT
--    - young stars vs Rangers fc (c0000000-0000-4000-8000-00000000001b): 1-1 FT
--    - Talanta fc vs Young legends (c0000000-0000-4000-8000-00000000001c): 3-1 FT
-- 2. Remove all other fixtures from Matchday 8 (fixtures 24, 25, 26, 27, 28)
--    which were unplayed duplicates of Matchday 11 fixtures (37, 36, 35, 34, 33).
-- 3. Remove duplicate upcoming fixtures of the 3 played matches in Matchday 13:
--    - Talanta fc vs Young legends (c0000000-0000-4000-8000-00000000003f)
--    - young stars vs Rangers fc (c0000000-0000-4000-8000-000000000040)
--    - Aged FC vs law fc (c0000000-0000-4000-8000-000000000041)
-- 4. Matchday 9 remains completely as such, and all other matchdays remain intact.
-- ============================================================================

-- Ensure the 3 played matches are confirmed in Matchday 8
UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 0,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001a';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-10-03',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001a';

UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 1,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-10-03',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 3,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001c';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-10-03',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001c';

-- Remove other matches from Matchday 8 (no other match will be in Matchday 8)
DELETE FROM public.matchday_schedules
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);

DELETE FROM public.fixtures
WHERE id IN (
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);

-- Remove duplicate fixtures of the 3 games from Matchday 13
DELETE FROM public.matchday_schedules
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000003f',
  'c0000000-0000-4000-8000-000000000040',
  'c0000000-0000-4000-8000-000000000041'
);

DELETE FROM public.fixtures
WHERE id IN (
  'c0000000-0000-4000-8000-00000000003f',
  'c0000000-0000-4000-8000-000000000040',
  'c0000000-0000-4000-8000-000000000041'
);
