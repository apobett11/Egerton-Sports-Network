-- Migration 70: Championship MD8 Results + Bulk Cascade of All Remaining Unplayed Fixtures
-- ============================================================================
-- Rules applied:
-- 1. Matchday 5 (Championship): UNTOUCHED - results already in DB
-- 2. Matchday 6 (Championship): Not played — already blank, no changes
-- 3. Matchday 7 (Championship): 
--    PLAYED (don't touch): Ajax fc vs Fass Elites (1e) and Emsa FC vs Tatton fc (1d) 
--    UNPLAYED → push to MD8: fixtures 22, 23, 1f, 20, 21 (5 games)
-- 4. Matchday 8 (Championship): ONLY two games played and scored:
--    a. young stars vs Rangers fc  (c0000000-0000-4000-8000-00000000001b): 1-1 FT
--    b. Talanta fc vs Young legends (c0000000-0000-4000-8000-00000000001c): 3-1 FT
--    UNPLAYED → push to MD9: 1a, 24, 25, 26, 27, 28 (6 games)
--    + the 5 bumped from MD7: 22, 23, 1f, 20, 21 → also go to MD9 as a bulk
-- 5. Cascade (reverse order): MD9→MD10, MD10→MD11 ... MD18→MD19
-- ============================================================================

-- Ensure is_cancelled column exists on match_events
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- ─── STEP 1: Mark the 2 played MD8 Championship games as FT ─────────────────

-- young stars 1-1 Rangers fc
UPDATE public.fixtures
SET
  score_home = 1,
  score_away = 1,
  status = 'FT',
  matchday = 8,
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001b';

UPDATE public.matchday_schedules
SET matchday_number = 8, play_date = '2026-10-03', updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001b';

-- Talanta fc 3-1 Young legends
UPDATE public.fixtures
SET
  score_home = 3,
  score_away = 1,
  status = 'FT',
  matchday = 8,
  scheduled_time = '2026-10-03T13:00:00.000Z',
  updated_at = NOW()
WHERE id = 'c0000000-0000-4000-8000-00000000001c';

UPDATE public.matchday_schedules
SET matchday_number = 8, play_date = '2026-10-03', updated_at = NOW()
WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001c';


-- ─── STEP 2: Cascade shift — reverse order to avoid slot collisions ──────────

-- MD18 → MD19 (2026-11-14 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-11-14', matchday_number = 19, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000005a',
  'c0000000-0000-4000-8000-000000000058',
  'c0000000-0000-4000-8000-000000000059',
  'c0000000-0000-4000-8000-000000000056',
  'c0000000-0000-4000-8000-000000000057'
);
UPDATE public.fixtures SET matchday = 19, scheduled_time = '2026-11-14T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000005a',
  'c0000000-0000-4000-8000-000000000058',
  'c0000000-0000-4000-8000-000000000059',
  'c0000000-0000-4000-8000-000000000056',
  'c0000000-0000-4000-8000-000000000057'
);

-- MD17 → MD18 (2026-11-08 Sunday)
UPDATE public.matchday_schedules
SET play_date = '2026-11-08', matchday_number = 18, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000054',
  'c0000000-0000-4000-8000-000000000055',
  'c0000000-0000-4000-8000-000000000052',
  'c0000000-0000-4000-8000-000000000051',
  'c0000000-0000-4000-8000-000000000053'
);
UPDATE public.fixtures SET matchday = 18, scheduled_time = '2026-11-08T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000054',
  'c0000000-0000-4000-8000-000000000055',
  'c0000000-0000-4000-8000-000000000052',
  'c0000000-0000-4000-8000-000000000051',
  'c0000000-0000-4000-8000-000000000053'
);

-- MD16 → MD17 (2026-11-07 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-11-07', matchday_number = 17, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000004d',
  'c0000000-0000-4000-8000-000000000050',
  'c0000000-0000-4000-8000-00000000004f',
  'c0000000-0000-4000-8000-00000000004c',
  'c0000000-0000-4000-8000-00000000004e'
);
UPDATE public.fixtures SET matchday = 17, scheduled_time = '2026-11-07T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000004d',
  'c0000000-0000-4000-8000-000000000050',
  'c0000000-0000-4000-8000-00000000004f',
  'c0000000-0000-4000-8000-00000000004c',
  'c0000000-0000-4000-8000-00000000004e'
);

-- MD15 → MD16 (2026-11-01 Sunday)
UPDATE public.matchday_schedules
SET play_date = '2026-11-01', matchday_number = 16, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000004b',
  'c0000000-0000-4000-8000-000000000048',
  'c0000000-0000-4000-8000-00000000004a',
  'c0000000-0000-4000-8000-000000000049',
  'c0000000-0000-4000-8000-000000000047'
);
UPDATE public.fixtures SET matchday = 16, scheduled_time = '2026-11-01T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000004b',
  'c0000000-0000-4000-8000-000000000048',
  'c0000000-0000-4000-8000-00000000004a',
  'c0000000-0000-4000-8000-000000000049',
  'c0000000-0000-4000-8000-000000000047'
);

-- MD14 → MD15 (2026-10-31 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-31', matchday_number = 15, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000042',
  'c0000000-0000-4000-8000-000000000046',
  'c0000000-0000-4000-8000-000000000044',
  'c0000000-0000-4000-8000-000000000043',
  'c0000000-0000-4000-8000-000000000045'
);
UPDATE public.fixtures SET matchday = 15, scheduled_time = '2026-10-31T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000042',
  'c0000000-0000-4000-8000-000000000046',
  'c0000000-0000-4000-8000-000000000044',
  'c0000000-0000-4000-8000-000000000043',
  'c0000000-0000-4000-8000-000000000045'
);

-- MD13 → MD14 (2026-10-25 Sunday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-25', matchday_number = 14, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000003d',
  'c0000000-0000-4000-8000-000000000041',
  'c0000000-0000-4000-8000-00000000003f',
  'c0000000-0000-4000-8000-000000000040',
  'c0000000-0000-4000-8000-00000000003e'
);
UPDATE public.fixtures SET matchday = 14, scheduled_time = '2026-10-25T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000003d',
  'c0000000-0000-4000-8000-000000000041',
  'c0000000-0000-4000-8000-00000000003f',
  'c0000000-0000-4000-8000-000000000040',
  'c0000000-0000-4000-8000-00000000003e'
);

-- MD12 → MD13 (2026-10-24 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-24', matchday_number = 13, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000039',
  'c0000000-0000-4000-8000-00000000003a',
  'c0000000-0000-4000-8000-00000000003c',
  'c0000000-0000-4000-8000-000000000038',
  'c0000000-0000-4000-8000-00000000003b'
);
UPDATE public.fixtures SET matchday = 13, scheduled_time = '2026-10-24T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000039',
  'c0000000-0000-4000-8000-00000000003a',
  'c0000000-0000-4000-8000-00000000003c',
  'c0000000-0000-4000-8000-000000000038',
  'c0000000-0000-4000-8000-00000000003b'
);

-- MD11 → MD12 (2026-10-18 Sunday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-18', matchday_number = 12, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-000000000037',
  'c0000000-0000-4000-8000-000000000034',
  'c0000000-0000-4000-8000-000000000035',
  'c0000000-0000-4000-8000-000000000036',
  'c0000000-0000-4000-8000-000000000033'
);
UPDATE public.fixtures SET matchday = 12, scheduled_time = '2026-10-18T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-000000000037',
  'c0000000-0000-4000-8000-000000000034',
  'c0000000-0000-4000-8000-000000000035',
  'c0000000-0000-4000-8000-000000000036',
  'c0000000-0000-4000-8000-000000000033'
);

-- MD10 → MD11 (2026-10-17 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-17', matchday_number = 11, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000002f',
  'c0000000-0000-4000-8000-000000000031',
  'c0000000-0000-4000-8000-000000000032',
  'c0000000-0000-4000-8000-00000000002e',
  'c0000000-0000-4000-8000-000000000030'
);
UPDATE public.fixtures SET matchday = 11, scheduled_time = '2026-10-17T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000002f',
  'c0000000-0000-4000-8000-000000000031',
  'c0000000-0000-4000-8000-000000000032',
  'c0000000-0000-4000-8000-00000000002e',
  'c0000000-0000-4000-8000-000000000030'
);

-- MD9 → MD10 (2026-10-10 Saturday)
UPDATE public.matchday_schedules
SET play_date = '2026-10-10', matchday_number = 10, updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000002a',
  'c0000000-0000-4000-8000-000000000029',
  'c0000000-0000-4000-8000-00000000002c',
  'c0000000-0000-4000-8000-00000000002b',
  'c0000000-0000-4000-8000-00000000002d'
);
UPDATE public.fixtures SET matchday = 10, scheduled_time = '2026-10-10T13:00:00.000Z', updated_at = NOW()
WHERE id IN (
  'c0000000-0000-4000-8000-00000000002a',
  'c0000000-0000-4000-8000-000000000029',
  'c0000000-0000-4000-8000-00000000002c',
  'c0000000-0000-4000-8000-00000000002b',
  'c0000000-0000-4000-8000-00000000002d'
);


-- ─── STEP 3: Bulk move all unplayed MD8 games + unplayed MD7 games → MD9 ────
-- MD9 date: 2026-10-04 (Sunday)
-- Fixtures moving to MD9:
--   From MD7 (unplayed - NOT 1d/1e which were played):
--     c0000000-0000-4000-8000-000000000022 = Ajax fc vs Young legends
--     c0000000-0000-4000-8000-000000000023 = Fass Elites vs Tatton fc  
--     c0000000-0000-4000-8000-00000000001f = Aged FC vs young stars
--     c0000000-0000-4000-8000-000000000020 = Talanta fc vs law fc
--     c0000000-0000-4000-8000-000000000021 = Emsa FC vs Rangers fc
--   From MD8 (unplayed - NOT 1b/1c which were played):
--     c0000000-0000-4000-8000-00000000001a = Aged FC vs law fc
--     c0000000-0000-4000-8000-000000000024 = Aged FC vs Talanta fc
--     c0000000-0000-4000-8000-000000000025 = Emsa FC vs young stars
--     c0000000-0000-4000-8000-000000000026 = Ajax fc vs law fc
--     c0000000-0000-4000-8000-000000000027 = Fass Elites vs Rangers fc
--     c0000000-0000-4000-8000-000000000028 = Tatton fc vs Young legends

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
  -- 5 unplayed MD7 Championship games
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023',
  'c0000000-0000-4000-8000-00000000001f',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  -- 6 unplayed MD8 Championship games
  'c0000000-0000-4000-8000-00000000001a',
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
  -- 5 unplayed MD7 Championship games
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023',
  'c0000000-0000-4000-8000-00000000001f',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  -- 6 unplayed MD8 Championship games
  'c0000000-0000-4000-8000-00000000001a',
  'c0000000-0000-4000-8000-000000000024',
  'c0000000-0000-4000-8000-000000000025',
  'c0000000-0000-4000-8000-000000000026',
  'c0000000-0000-4000-8000-000000000027',
  'c0000000-0000-4000-8000-000000000028'
);
