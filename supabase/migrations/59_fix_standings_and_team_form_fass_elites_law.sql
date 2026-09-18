-- ============================================================================
-- Migration 56: Fix League Standings & Team Form for Fass Elites & Law FC
-- Ensures:
-- 1. All teams (specifically Fass Elites and Law FC) have played = 4
-- 2. Recalculates / sets exact standing metrics (played, won, drawn, lost, GF, GA, GD, points)
-- 3. Sets accurate team_form latest_results arrays to exactly 4 matches
-- 4. Preserves Reuben Shivina's 3 goals and player stats
-- ============================================================================

DO $$
DECLARE
  v_team_fass UUID := '20000000-0000-4000-8000-000000000003';
  v_team_law UUID := '20000000-0000-4000-8000-00000000000a';
  v_comp_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- 1. Update Fass Elites Standings (4 matches: 1-2 vs Team4, 2-1 vs Team1, 1-1 vs Team7, 3-2 vs Law)
  -- 2 Wins, 1 Draw, 1 Loss => 7 Points, 7 GF, 6 GA, +1 GD
  INSERT INTO public.league_standings (
    team_id,
    competition_id,
    played,
    won,
    drawn,
    lost,
    goals_for,
    goals_against,
    goal_difference,
    points,
    last_updated
  )
  VALUES (
    v_team_fass,
    v_comp_id,
    4,
    2,
    1,
    1,
    7,
    6,
    1,
    7,
    NOW()
  )
  ON CONFLICT (team_id, competition_id) DO UPDATE SET
    played = 4,
    won = 2,
    drawn = 1,
    lost = 1,
    goals_for = 7,
    goals_against = 6,
    goal_difference = 1,
    points = 7,
    last_updated = NOW();

  -- 2. Update Law FC Standings (4 matches: 0-1 vs Team9, 1-3 vs Team8, 1-3 vs Team4, 2-3 vs Fass Elites)
  -- 0 Wins, 0 Draws, 4 Losses => 0 Points, 4 GF, 10 GA, -6 GD
  INSERT INTO public.league_standings (
    team_id,
    competition_id,
    played,
    won,
    drawn,
    lost,
    goals_for,
    goals_against,
    goal_difference,
    points,
    last_updated
  )
  VALUES (
    v_team_law,
    v_comp_id,
    4,
    0,
    0,
    4,
    4,
    10,
    -6,
    0,
    NOW()
  )
  ON CONFLICT (team_id, competition_id) DO UPDATE SET
    played = 4,
    won = 0,
    drawn = 0,
    lost = 4,
    goals_for = 4,
    goals_against = 10,
    goal_difference = -6,
    points = 0,
    last_updated = NOW();

  -- 3. Update Team Form for Fass Elites: ['L', 'W', 'D', 'W'] (exactly 4 matches)
  INSERT INTO public.team_form (
    team_id,
    competition_id,
    latest_results,
    last_updated
  )
  VALUES (
    v_team_fass,
    v_comp_id,
    ARRAY['L', 'W', 'D', 'W'],
    NOW()
  )
  ON CONFLICT (team_id) DO UPDATE SET
    competition_id = v_comp_id,
    latest_results = ARRAY['L', 'W', 'D', 'W'],
    last_updated = NOW();

  -- 4. Update Team Form for Law FC: ['L', 'L', 'L', 'L'] (exactly 4 matches)
  INSERT INTO public.team_form (
    team_id,
    competition_id,
    latest_results,
    last_updated
  )
  VALUES (
    v_team_law,
    v_comp_id,
    ARRAY['L', 'L', 'L', 'L'],
    NOW()
  )
  ON CONFLICT (team_id) DO UPDATE SET
    competition_id = v_comp_id,
    latest_results = ARRAY['L', 'L', 'L', 'L'],
    last_updated = NOW();

  RAISE NOTICE 'Successfully reconciled league standings and team form for Fass Elites and Law FC to 4 matches played.';
END $$;
