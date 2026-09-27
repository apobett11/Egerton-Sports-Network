-- Migration 70: Update Championship Matchday 8 Results & Push Unplayed MD8 Matches to MD9
-- ============================================================================
-- 1. Update the 3 Matchday 8 played matches using exact Match UIDs:
--    - Aged FC (0) vs law fc (1) [c0000000-0000-4000-8000-00000000001a] -> FT
--    - young stars (1) vs Rangers fc (1) [c0000000-0000-4000-8000-00000000001b] -> FT
--    - Talanta fc (3) vs Young legends (1) [c0000000-0000-4000-8000-00000000001c] -> FT
-- 2. Push the remaining 5 unplayed matches in current Matchday 8 to Matchday 9:
--    - c0000000-0000-4000-8000-000000000024 (Aged FC vs Talanta fc)
--    - c0000000-0000-4000-8000-000000000025 (Emsa FC vs young stars)
--    - c0000000-0000-4000-8000-000000000026 (Ajax fc vs law fc)
--    - c0000000-0000-4000-8000-000000000027 (Fass Elites vs Rangers fc)
--    - c0000000-0000-4000-8000-000000000028 (Tatton fc vs Young legends)
-- 3. All other matchdays (MD5, MD7, MD10+) remain completely untouched.
-- ============================================================================

-- Ensure is_cancelled column exists on match_events
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- ─── STEP 1: Update the 3 played Matchday 8 fixtures to FT with scores ───────

-- Match 1: Aged FC vs law fc (0 - 1)
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

-- Match 2: young stars vs Rangers fc (1 - 1)
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

-- Match 3: Talanta fc vs Young legends (3 - 1)
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

-- ─── STEP 2: Push the remaining 5 unplayed Matchday 8 fixtures to Matchday 9 ─

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
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);

UPDATE public.fixtures
SET
  matchday = 9,
  scheduled_time = '2026-10-04T13:00:00.000Z',
  venue = NULL,
  updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);
