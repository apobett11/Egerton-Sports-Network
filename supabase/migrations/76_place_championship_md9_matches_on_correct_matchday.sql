-- Migration 76: Place Championship Matchday 9 Matches on Correct Matchday Date (2026-10-03)
-- ============================================================================
-- Ensure all 5 Matchday 9 Championship matches are aligned with the Matchday 9
-- calendar date (2026-10-03) so they appear alongside EPL Matchday 9:
--   - Aged FC vs young stars (c0000000-0000-4000-8000-00000000001f)
--   - Talanta fc vs law fc (c0000000-0000-4000-8000-000000000020)
--   - Emsa FC vs Rangers fc (c0000000-0000-4000-8000-000000000021)
--   - Ajax fc vs Young legends (c0000000-0000-4000-8000-000000000022)
--   - Fass Elites vs Tatton fc (c0000000-0000-4000-8000-000000000023)
-- ============================================================================

UPDATE public.fixtures
SET
  scheduled_time = '2026-10-03T13:00:00.000Z',
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
  play_date = '2026-10-03',
  updated_at = NOW()
WHERE fixture_id IN (
  'c0000000-0000-4000-8000-00000000001f',
  'c0000000-0000-4000-8000-000000000020',
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-4000-8000-000000000022',
  'c0000000-0000-4000-8000-000000000023'
);
