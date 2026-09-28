-- Migration 75: Shift Championship Matches to Matchday 9 & Clean Duplicates
-- ============================================================================
-- 1. Shift the 5 target matches to Matchday 9 (2026-10-04) using exact Match UIDs:
--    - Aged FC vs young stars (c0000000-0000-4000-8000-00000000001f)
--    - Talanta fc vs law fc (c0000000-0000-4000-8000-000000000020)
--    - Emsa FC vs Rangers fc (c0000000-0000-4000-8000-000000000021)
--    - Ajax fc vs Young legends (c0000000-0000-4000-8000-000000000022)
--    - Fass Elites vs Tatton fc (c0000000-0000-4000-8000-000000000023)
-- 2. Remove the venue from these 5 matches (venue = NULL, pitch_id = NULL, etc.).
-- 3. Delete the duplicate unplayed fixtures in Matchday 9
--    (which are already scheduled in Matchday 10):
--    - Aged FC vs Emsa FC (c0000000-0000-4000-8000-000000000029)
--    - Ajax fc vs Talanta fc (c0000000-0000-4000-8000-00000000002a)
--    - Fass Elites vs young stars (c0000000-0000-4000-8000-00000000002b)
--    - Tatton fc vs law fc (c0000000-0000-4000-8000-00000000002c)
--    - Young legends vs Rangers fc (c0000000-0000-4000-8000-00000000002d)
-- 4. Matchday 8 and 10 remain completely untouched.
-- ============================================================================

-- Step 1: Remove duplicate fixtures from Matchday 9 (these are scheduled in Matchday 10)
DELETE FROM public.matchday_schedules
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000029',
  'c0000000-0000-4000-8000-00000000002a',
  'c0000000-0000-4000-8000-00000000002b',
  'c0000000-0000-4000-8000-00000000002c',
  'c0000000-0000-4000-8000-00000000002d'
);

DELETE FROM public.fixtures
WHERE id IN (
  'c0000000-0000-4000-8000-000000000029',
  'c0000000-0000-4000-8000-00000000002a',
  'c0000000-0000-4000-8000-00000000002b',
  'c0000000-0000-4000-8000-00000000002c',
  'c0000000-0000-4000-8000-00000000002d'
);

-- Step 2: Shift the 5 target matches to Matchday 9 and clear venues
UPDATE public.fixtures
SET
  matchday = 9,
  scheduled_time = '2026-10-04T13:00:00.000Z',
  venue = NULL,
  updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000001f',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023'
);

UPDATE public.matchday_schedules
SET
  matchday_number = 9,
  play_date = '2026-10-04',
  pitch_id = NULL,
  slot_number = NULL,
  period = NULL,
  start_time = NULL,
  end_time = NULL,
  updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000001f',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023'
);
