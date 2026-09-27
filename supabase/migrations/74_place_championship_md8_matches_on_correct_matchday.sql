-- Migration 74: Place Championship Matchday 8 Matches on Correct Matchday (2026-09-27)
-- ============================================================================
-- 1. Ensure the 3 played Matchday 8 matches are correctly scheduled on Matchday 8 date (2026-09-27):
--    - Aged FC vs law fc (c0000000-0000-4000-8000-00000000001a): 0-1 FT
--    - young stars vs Rangers fc (c0000000-0000-4000-8000-00000000001b): 1-1 FT
--    - Talanta fc vs Young legends (c0000000-0000-4000-8000-00000000001c): 3-1 FT
-- 2. Update their matchday_schedules entries to matchday_number 8 and play_date '2026-09-27'
-- 3. Matchday 9 (Oct 04) and all other matchdays remain completely intact.
-- ============================================================================

-- Update Fixture 1: Aged FC vs law fc (0 - 1)
UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 0,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-09-27T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001a';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-09-27',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001a';

-- Update Fixture 2: young stars vs Rangers fc (1 - 1)
UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 1,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-09-27T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-09-27',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001b';

-- Update Fixture 3: Talanta fc vs Young legends (3 - 1)
UPDATE public.fixtures
SET
  matchday = 8,
  score_home = 3,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-09-27T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001c';

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-09-27',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001c';
