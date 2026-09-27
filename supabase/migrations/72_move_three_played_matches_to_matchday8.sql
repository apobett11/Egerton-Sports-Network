-- Migration 72: Move the 3 played Championship matches into Matchday 8
-- ============================================================================
-- Brings the 3 completed Championship fixtures into Matchday 8 (2026-10-03):
--   1. c0000000-0000-4000-8000-00000000001a: Aged FC (0) vs law fc (1) [FT]
--   2. c0000000-0000-4000-8000-00000000001b: young stars (1) vs Rangers fc (1) [FT]
--   3. c0000000-0000-4000-8000-00000000001c: Talanta fc (3) vs Young legends (1) [FT]
-- ============================================================================

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
