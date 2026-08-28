-- ============================================================================
-- Migration 23: Complete Season Reset & Full 25-Team Roster Seeding
-- 1. Complete truncation/deletion of all existing fixtures, live stats & results
-- 2. Seeds exactly 12 EPL teams and 13 Championship teams (25 teams total)
-- 3. Seeds 1 Coach, 1 Doctor, 1 Captain, and 18 Players per team (450 players)
-- 4. Ensures 8 Active Referees and 3 Available Official Pitches
-- ============================================================================

-- 1. DROP FK CONSTRAINTS ON PROFILES IF BLOCKING STANDALONE PROFILE INSERTS
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN 
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey; 
  END IF; 
END $$;

-- 2. CLEAR ALL EXISTING FIXTURES AND DERIVED LIVE/STATISTICAL DATA
DELETE FROM public.match_live_audit_logs;
DELETE FROM public.match_live_events;
DELETE FROM public.match_live_states;
DELETE FROM public.canonical_permanent_results;
DELETE FROM public.finalization_commands;
DELETE FROM public.referee_working_sets;
DELETE FROM public.match_events;
DELETE FROM public.match_lineups;
DELETE FROM public.match_reports;
DELETE FROM public.league_standings;
DELETE FROM public.team_form;
DELETE FROM public.player_stats;
DELETE FROM public.historical_standings;
DELETE FROM public.fixtures;

-- 3. ENSURE CLEAN SLATE FOR SQUADS AND TEAMS
DELETE FROM public.squad_configurations;
DELETE FROM public.squad_requests;
DELETE FROM public.players;
DELETE FROM public.teams;

-- 4. ENSURE OFFICIAL COMPETITIONS EXIST
INSERT INTO public.competitions (id, name, slug, country, season, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Egerton Premier League', 'egerton-premier-league', 'Kenya', '2025/2026', true),
  ('22222222-2222-2222-2222-222222222222', 'Egerton Championship', 'egerton-championship', 'Kenya', '2025/2026', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true;

-- 5. ENSURE OFFICIAL PITCHES EXIST & AVAILABLE
INSERT INTO public.pitches (id, name, short_code, location, capacity, surface_type, has_lighting, status)
VALUES
  ('91111111-1111-1111-1111-111111111111', 'Pitch A — Main Stadium Pitch', 'PITCH-A', 'Main Campus Athletics Complex', 10000, 'Natural Grass', true, 'Available'),
  ('92222222-2222-2222-2222-222222222222', 'Pitch B — Pavilion Grounds', 'PITCH-B', 'Pavilion Sports Complex', 3500, 'Hybrid Turf', true, 'Available'),
  ('93333333-3333-3333-3333-333333333333', 'Pitch C — Tatton Complex Ground', 'PITCH-C', 'Tatton Campus Ground', 2500, 'Natural Grass', false, 'Available')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_code = EXCLUDED.short_code,
  status = 'Available';

-- 6. ENSURE 8 OFFICIAL REFEREES POOL
INSERT INTO public.referees (id, name, phone, status, badge_level)
VALUES 
  ('30000000-0000-4000-9000-000000000001', 'Ref Official Alpha', '0711000001', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000002', 'Ref Official Beta', '0711000002', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000003', 'Ref Official Gamma', '0711000003', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000004', 'Ref Official Delta', '0711000004', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000005', 'Ref Official Epsilon', '0711000005', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000006', 'Ref Official Zeta', '0711000006', 'Active', 'FKF Campus Level 3'),
  ('30000000-0000-4000-9000-000000000007', 'Ref Official Eta', '0711000007', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000008', 'Ref Official Theta', '0711000008', 'Active', 'FKF National Level 2')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = 'Active',
  badge_level = EXCLUDED.badge_level;

-- 7. MASTER SEEDING SCRIPT: 12 EPL TEAMS + 13 CHAMPIONSHIP TEAMS (EACH WITH 1 COACH, 1 DOCTOR, 1 CAPTAIN, 18 PLAYERS)
DO $$
DECLARE
  v_epl_comp_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_champ_comp_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;

  -- 12 EPL Teams metadata
  v_epl_names TEXT[] := ARRAY[
    'Sharklets FC', 'Faculty of Arts', 'Faculty of Science', 'Njoro FC',
    'Egerton Strikers', 'Buruburu FC', 'Tatton Warriors', 'Main Campus FC',
    'Egerton Athletics', 'Kilimo Stars', 'Engineering Royals', 'Pavilion Rangers'
  ];
  v_epl_shorts TEXT[] := ARRAY['SHK', 'FOA', 'FOS', 'NJR', 'EST', 'BRB', 'TAT', 'MCF', 'EAT', 'KLS', 'ENG', 'PVR'];
  v_epl_colors TEXT[] := ARRAY['#D4AF37', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6', '#D97706'];

  -- 13 Championship Teams metadata
  v_champ_names TEXT[] := ARRAY[
    'Championship FC Alpha', 'Championship FC Beta', 'Championship FC Gamma', 'Championship FC Delta',
    'Championship FC Epsilon', 'Championship FC Zeta', 'Championship FC Eta', 'Championship FC Theta',
    'Championship FC Iota', 'Championship FC Kappa', 'Championship FC Lambda', 'Championship FC Mu',
    'Championship FC Nu'
  ];
  v_champ_shorts TEXT[] := ARRAY['CHP-A', 'CHP-B', 'CHP-G', 'CHP-D', 'CHP-E', 'CHP-Z', 'CHP-H', 'CHP-T', 'CHP-I', 'CHP-K', 'CHP-L', 'CHP-M', 'CHP-N'];
  v_champ_colors TEXT[] := ARRAY['#2563EB', '#3B82F6', '#60A5FA', '#1D4ED8', '#1E40AF', '#0284C7', '#0369A1', '#075985', '#0C4A6E', '#4F46E5', '#4338CA', '#3730A3', '#312E81'];

  -- First names pool
  v_first_names TEXT[] := ARRAY[
    'Brian', 'Kevin', 'Dennis', 'Victor', 'Eric', 'Collins', 'Samuel', 'David',
    'Michael', 'Emmanuel', 'James', 'Joseph', 'John', 'Alex', 'Ian', 'George',
    'Geoffrey', 'Felix', 'Daniel', 'Kelvin', 'Moses', 'Stephen', 'Peter', 'Anthony'
  ];

  -- Last names pool
  v_last_names TEXT[] := ARRAY[
    'Omondi', 'Otieno', 'Kariuki', 'Mwangi', 'Kimani', 'Wanjala', 'Ochieng', 'Kipchirchir',
    'Korir', 'Kipchumba', 'Mutua', 'Musyoka', 'Kamau', 'Maina', 'Kiprono', 'Cheruiyot',
    'Odhiambo', 'Onyango', 'Njoroge', 'Githinji', 'Koech', 'Rotich', 'Juma', 'Wanyonyi'
  ];

  -- Positions for 18 players
  v_positions TEXT[] := ARRAY[
    'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'MID',
    'FWD', 'GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'
  ];

  -- Loop variables
  i INT;
  j INT;
  v_team_id UUID;
  v_coach_id UUID;
  v_captain_id UUID;
  v_doctor_id UUID;
  v_player_id UUID;
  v_player_prof_id UUID;
  v_team_name TEXT;
  v_short_name TEXT;
  v_color TEXT;
  v_p_first TEXT;
  v_p_last TEXT;
  v_slug TEXT;

BEGIN
  -- =========================================================================
  -- A. SEED 12 EPL TEAMS
  -- =========================================================================
  FOR i IN 1..12 LOOP
    v_team_id := ('10000000-0000-4000-8000-' || LPAD(i::text, 12, '0'))::UUID;
    v_team_name := v_epl_names[i];
    v_short_name := v_epl_shorts[i];
    v_color := v_epl_colors[i];
    v_slug := LOWER(REGEXP_REPLACE(v_short_name, '[^a-zA-Z0-9]', '', 'g'));

    -- 1. Create Coach Profile
    v_coach_id := ('11000000-0000-4000-8000-' || LPAD(i::text, 12, '0'))::UUID;
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_coach_id,
      'coach.' || v_slug || '@egerton.ac.ke',
      'Coach',
      v_short_name,
      '0722' || LPAD(i::text, 6, '0'),
      'coach',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'coach';

    -- 2. Create Doctor Profile
    v_doctor_id := ('12000000-0000-4000-8000-' || LPAD(i::text, 12, '0'))::UUID;
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_doctor_id,
      'doctor.' || v_slug || '@egerton.ac.ke',
      'Dr.',
      v_short_name,
      '0733' || LPAD(i::text, 6, '0'),
      'guest',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'guest';

    -- 3. Create Captain Profile (Player #10)
    v_captain_id := ('13000000-0000-4000-8000-' || LPAD(i::text, 12, '0'))::UUID;
    v_p_first := v_first_names[((i * 3 + 10) % array_length(v_first_names, 1)) + 1];
    v_p_last := v_last_names[((i * 5 + 10) % array_length(v_last_names, 1)) + 1];

    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_captain_id,
      'captain.' || v_slug || '@egerton.ac.ke',
      v_p_first,
      v_p_last,
      '0744' || LPAD(i::text, 6, '0'),
      'captain',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'captain';

    -- 4. Create Team Record
    INSERT INTO public.teams (id, competition_id, name, short_name, color_code, coach_id, captain_id, status)
    VALUES (
      v_team_id,
      v_epl_comp_id,
      v_team_name,
      v_short_name,
      v_color,
      v_coach_id,
      v_captain_id,
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET
      competition_id = EXCLUDED.competition_id,
      name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      coach_id = EXCLUDED.coach_id,
      captain_id = EXCLUDED.captain_id,
      status = 'approved';

    -- 5. Create 18 Squad Players for this EPL Team
    FOR j IN 1..18 LOOP
      IF j = 10 THEN
        v_player_prof_id := v_captain_id;
        v_p_first := v_first_names[((i * 3 + 10) % array_length(v_first_names, 1)) + 1];
        v_p_last := v_last_names[((i * 5 + 10) % array_length(v_last_names, 1)) + 1];
      ELSE
        v_player_prof_id := ('14000000-' || LPAD(i::text, 4, '0') || '-4000-8000-' || LPAD(j::text, 12, '0'))::UUID;
        v_p_first := v_first_names[((i * 7 + j * 3) % array_length(v_first_names, 1)) + 1];
        v_p_last := v_last_names[((i * 11 + j * 5) % array_length(v_last_names, 1)) + 1];

        INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
        VALUES (
          v_player_prof_id,
          'player.' || v_slug || '.' || j || '@egerton.ac.ke',
          v_p_first,
          v_p_last,
          '0755' || LPAD((i * 100 + j)::text, 6, '0'),
          'player',
          true
        )
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'player';
      END IF;

      v_player_id := ('15000000-' || LPAD(i::text, 4, '0') || '-4000-8000-' || LPAD(j::text, 12, '0'))::UUID;

      INSERT INTO public.players (
        id, profile_id, team_id, jersey_number, position,
        first_name, last_name, student_id, phone, status
      )
      VALUES (
        v_player_id,
        v_player_prof_id,
        v_team_id,
        j,
        v_positions[j],
        v_p_first,
        v_p_last,
        'EG/EPL/' || LPAD(i::text, 2, '0') || '/' || LPAD(j::text, 3, '0') || '/23',
        '0755' || LPAD((i * 100 + j)::text, 6, '0'),
        'active'
      )
      ON CONFLICT (team_id, jersey_number) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        position = EXCLUDED.position,
        student_id = EXCLUDED.student_id,
        status = 'active';
    END LOOP;
  END LOOP;

  -- =========================================================================
  -- B. SEED 13 CHAMPIONSHIP TEAMS
  -- =========================================================================
  FOR i IN 1..13 LOOP
    v_team_id := ('20000000-0000-4000-a000-' || LPAD(i::text, 12, '0'))::UUID;
    v_team_name := v_champ_names[i];
    v_short_name := v_champ_shorts[i];
    v_color := v_champ_colors[i];
    v_slug := LOWER(REGEXP_REPLACE(v_short_name, '[^a-zA-Z0-9]', '', 'g'));

    -- 1. Create Coach Profile
    v_coach_id := ('21000000-0000-4000-a000-' || LPAD(i::text, 12, '0'))::UUID;
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_coach_id,
      'coach.' || v_slug || '@egerton.ac.ke',
      'Coach',
      v_short_name,
      '0766' || LPAD(i::text, 6, '0'),
      'coach',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'coach';

    -- 2. Create Doctor Profile
    v_doctor_id := ('22000000-0000-4000-a000-' || LPAD(i::text, 12, '0'))::UUID;
    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_doctor_id,
      'doctor.' || v_slug || '@egerton.ac.ke',
      'Dr.',
      v_short_name,
      '0777' || LPAD(i::text, 6, '0'),
      'guest',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'guest';

    -- 3. Create Captain Profile (Player #10)
    v_captain_id := ('23000000-0000-4000-a000-' || LPAD(i::text, 12, '0'))::UUID;
    v_p_first := v_first_names[((i * 4 + 10) % array_length(v_first_names, 1)) + 1];
    v_p_last := v_last_names[((i * 6 + 10) % array_length(v_last_names, 1)) + 1];

    INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
    VALUES (
      v_captain_id,
      'captain.' || v_slug || '@egerton.ac.ke',
      v_p_first,
      v_p_last,
      '0788' || LPAD(i::text, 6, '0'),
      'captain',
      true
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'captain';

    -- 4. Create Team Record
    INSERT INTO public.teams (id, competition_id, name, short_name, color_code, coach_id, captain_id, status)
    VALUES (
      v_team_id,
      v_champ_comp_id,
      v_team_name,
      v_short_name,
      v_color,
      v_coach_id,
      v_captain_id,
      'approved'
    )
    ON CONFLICT (id) DO UPDATE SET
      competition_id = EXCLUDED.competition_id,
      name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      coach_id = EXCLUDED.coach_id,
      captain_id = EXCLUDED.captain_id,
      status = 'approved';

    -- 5. Create 18 Squad Players for this Championship Team
    FOR j IN 1..18 LOOP
      IF j = 10 THEN
        v_player_prof_id := v_captain_id;
        v_p_first := v_first_names[((i * 4 + 10) % array_length(v_first_names, 1)) + 1];
        v_p_last := v_last_names[((i * 6 + 10) % array_length(v_last_names, 1)) + 1];
      ELSE
        v_player_prof_id := ('24000000-' || LPAD(i::text, 4, '0') || '-4000-a000-' || LPAD(j::text, 12, '0'))::UUID;
        v_p_first := v_first_names[((i * 9 + j * 4) % array_length(v_first_names, 1)) + 1];
        v_p_last := v_last_names[((i * 13 + j * 7) % array_length(v_last_names, 1)) + 1];

        INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, is_verified)
        VALUES (
          v_player_prof_id,
          'player.' || v_slug || '.' || j || '@egerton.ac.ke',
          v_p_first,
          v_p_last,
          '0799' || LPAD((i * 100 + j)::text, 6, '0'),
          'player',
          true
        )
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'player';
      END IF;

      v_player_id := ('25000000-' || LPAD(i::text, 4, '0') || '-4000-a000-' || LPAD(j::text, 12, '0'))::UUID;

      INSERT INTO public.players (
        id, profile_id, team_id, jersey_number, position,
        first_name, last_name, student_id, phone, status
      )
      VALUES (
        v_player_id,
        v_player_prof_id,
        v_team_id,
        j,
        v_positions[j],
        v_p_first,
        v_p_last,
        'EG/CHP/' || LPAD(i::text, 2, '0') || '/' || LPAD(j::text, 3, '0') || '/23',
        '0799' || LPAD((i * 100 + j)::text, 6, '0'),
        'active'
      )
      ON CONFLICT (team_id, jersey_number) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        position = EXCLUDED.position,
        student_id = EXCLUDED.student_id,
        status = 'active';
    END LOOP;
  END LOOP;
END $$;
