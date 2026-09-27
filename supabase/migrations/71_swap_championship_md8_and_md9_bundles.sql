-- Migration 71: Swap Championship MD8 and MD9 Fixture Bundles
-- ============================================================================
-- 1. Move the 5 unplayed Championship matches back to Matchday 8 (2026-10-03):
--    - c0000000-0000-4000-8000-000000000024 (Aged FC vs Talanta fc)
--    - c0000000-0000-4000-8000-000000000025 (Emsa FC vs young stars)
--    - c0000000-0000-4000-8000-000000000026 (Ajax fc vs law fc)
--    - c0000000-0000-4000-8000-000000000027 (Fass Elites vs Rangers fc)
--    - c0000000-0000-4000-8000-000000000028 (Tatton fc vs Young legends)
-- 2. Move the 3 played Championship matches to Matchday 9 (2026-10-04):
--    - c0000000-0000-4000-8000-00000000001a (Aged FC vs law fc, FT 0-1)
--    - c0000000-0000-4000-8000-00000000001b (young stars vs Rangers fc, FT 1-1)
--    - c0000000-0000-4000-8000-00000000001c (Talanta fc vs Young legends, FT 3-1)
-- 3. Matchday 10 onwards remains completely intact.
-- ============================================================================

-- ─── STEP 1: Move the 5 unplayed matches bundle to Matchday 8 (2026-10-03) ───

UPDATE public.fixtures
SET
  matchday = 8,
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);

UPDATE public.matchday_schedules
SET
  matchday_number = 8,
  play_date = '2026-10-03',
  updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);

-- ─── STEP 2: Move the 3 played matches bundle to Matchday 9 (2026-10-04) ─────

UPDATE public.fixtures
SET
  matchday = 9,
  score_home = 0,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-04T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001a';

UPDATE public.matchday_schedules
SET
  matchday_number = 9,
  play_date = '2026-10-04',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001a';

UPDATE public.fixtures
SET
  matchday = 9,
  score_home = 1,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-04T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.matchday_schedules
SET
  matchday_number = 9,
  play_date = '2026-10-04',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.fixtures
SET
  matchday = 9,
  score_home = 3,
  score_away = 1,
  status = 'FT',
  scheduled_time = '2026-10-04T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001c';

UPDATE public.matchday_schedules
SET
  matchday_number = 9,
  play_date = '2026-10-04',
  updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001c';
