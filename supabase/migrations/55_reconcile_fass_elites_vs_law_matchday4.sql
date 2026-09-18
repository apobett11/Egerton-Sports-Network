-- ============================================================================
-- Migration 54: Reconcile Fass Elites vs Law Matchday 4 Fixture
-- 1. Deletes any extra/concurrent matchday 4 game between Fass Elites and Law
-- 2. Preserves the canonical Matchday 4 fixture (c0000000-0000-4000-8000-000000000012) with score 3-2
-- 3. Ensures player Reuben Shivina (UID: 75f0ed48-f243-4396-9450-ca6eba489e13) is assigned the 3 goals without duplicates
-- 4. Syncs player_stats for Reuben Shivina
-- ============================================================================

DO $$
DECLARE
  v_team_fass UUID := '20000000-0000-4000-8000-000000000003';
  v_team_law UUID := '20000000-0000-4000-8000-00000000000a';
  v_canonical_fixture UUID := 'c0000000-0000-4000-8000-000000000012';
  v_player_reuben UUID := '75f0ed48-f243-4396-9450-ca6eba489e13';
  v_comp_id UUID := '22222222-2222-2222-2222-222222222222';
  v_extra_fix RECORD;
BEGIN
  -- 1. Identify and purge any extra/concurrent Matchday 4 fixture between Fass Elites and Law
  FOR v_extra_fix IN (
    SELECT id FROM public.fixtures
    WHERE matchday = 4
      AND id != v_canonical_fixture
      AND (
        (home_team_id = v_team_fass AND away_team_id = v_team_law) OR
        (home_team_id = v_team_law AND away_team_id = v_team_fass)
      )
  ) LOOP
    -- Clean dependent records
    DELETE FROM public.match_events WHERE fixture_id = v_extra_fix.id;
    DELETE FROM public.match_live_events WHERE match_uid = v_extra_fix.id;
    DELETE FROM public.match_live_states WHERE match_uid = v_extra_fix.id;
    DELETE FROM public.match_lineups WHERE fixture_id = v_extra_fix.id;
    DELETE FROM public.match_reports WHERE fixture_id = v_extra_fix.id;
    DELETE FROM public.canonical_permanent_results WHERE match_uid = v_extra_fix.id;
    DELETE FROM public.fixtures WHERE id = v_extra_fix.id;
    RAISE NOTICE 'Deleted extra concurrent fixture: %', v_extra_fix.id;
  END LOOP;

  -- 2. Ensure the canonical Matchday 4 fixture maintains the original 3 - 2 score and FT status
  UPDATE public.fixtures
  SET
    score_home = 3,
    score_away = 2,
    status = 'FT',
    matchday = 4,
    home_team_id = v_team_fass,
    away_team_id = v_team_law,
    scheduled_time = '2026-09-13 13:00:00+00'
  WHERE id = v_canonical_fixture;

  -- 3. Clean and assign the 3 goals strictly to Reuben Shivina for this fixture
  -- Remove any existing events for this fixture to prevent duplicate counts
  DELETE FROM public.match_events
  WHERE fixture_id = v_canonical_fixture;

  -- Insert exactly 3 goals for Reuben Shivina (Fass Elites)
  INSERT INTO public.match_events (id, fixture_id, minute, type, team_id, player_id, detail_text, created_at)
  VALUES
    (
      'cb0b940e-1023-4375-a354-5f524877e8bb',
      v_canonical_fixture,
      15,
      'goal',
      v_team_fass,
      v_player_reuben,
      'Solo Goal',
      '2026-09-13 13:15:00+00'
    ),
    (
      '7e0140f5-106b-4ebb-af84-530b2d822989',
      v_canonical_fixture,
      40,
      'goal',
      v_team_fass,
      v_player_reuben,
      'Solo Goal',
      '2026-09-13 13:40:00+00'
    ),
    (
      '4620b6cd-e7f2-476f-9728-7b906ef20ed3',
      v_canonical_fixture,
      65,
      'goal',
      v_team_fass,
      v_player_reuben,
      'Goal',
      '2026-09-13 14:05:00+00'
    );

  -- 4. Sync player_stats for Reuben Shivina to reflect the 3 goals
  INSERT INTO public.player_stats (player_id, competition_id, goals, assists, clean_sheets, last_updated)
  VALUES (
    v_player_reuben,
    v_comp_id,
    3,
    0,
    0,
    NOW()
  )
  ON CONFLICT (player_id, competition_id) DO UPDATE
  SET
    goals = 3,
    last_updated = NOW();

  RAISE NOTICE 'Successfully reconciled Fass Elites vs Law Matchday 4: 1 single match, score 3-2, 3 goals assigned to Reuben Shivina.';
END $$;
