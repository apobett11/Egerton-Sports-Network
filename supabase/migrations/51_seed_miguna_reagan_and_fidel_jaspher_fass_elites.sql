-- Migration 51: Seed Miguna Reagan and Fidel Jaspher to Fass Elites
-- Team: Fass Elites ('20000000-0000-4000-8000-000000000003')
-- Role: player

DO $$
DECLARE
  v_team_fass UUID := '20000000-0000-4000-8000-000000000003';
  v_pw TEXT := extensions.crypt('Player@2026!', extensions.gen_salt('bf'));

  -- Miguna Reagan variables
  v_uid_miguna UUID;
  v_miguna_email TEXT := 'miguna.reagan.fass.27@student.egerton.ac.ke';

  -- Fidel Jaspher variables
  v_uid_fidel UUID;
  v_fidel_email TEXT := 'fidel.jaspher.fass.28@student.egerton.ac.ke';
BEGIN

  -- =========================================================================
  -- 1. MIGUNA REAGAN (Fass Elites, Jersey #27, MID)
  -- =========================================================================

  -- Check if already exists in auth.users by email or metadata
  SELECT id INTO v_uid_miguna
  FROM auth.users
  WHERE LOWER(email) = LOWER(v_miguna_email)
     OR (raw_user_meta_data->>'first_name' ILIKE 'Miguna' AND raw_user_meta_data->>'last_name' ILIKE 'Reagan')
  LIMIT 1;

  -- Also check in public.profiles if not found in auth.users
  IF v_uid_miguna IS NULL THEN
    SELECT id INTO v_uid_miguna
    FROM public.profiles
    WHERE LOWER(email) = LOWER(v_miguna_email)
       OR (first_name ILIKE 'Miguna' AND last_name ILIKE 'Reagan')
    LIMIT 1;
  END IF;

  -- Also check in public.players if not found
  IF v_uid_miguna IS NULL THEN
    SELECT profile_id INTO v_uid_miguna
    FROM public.players
    WHERE team_id = v_team_fass
      AND first_name ILIKE 'Miguna'
      AND last_name ILIKE 'Reagan'
    LIMIT 1;
  END IF;

  -- If exists in auth.users, update; otherwise insert
  IF v_uid_miguna IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid_miguna) THEN
    UPDATE auth.users
    SET encrypted_password = COALESCE(encrypted_password, v_pw),
        raw_user_meta_data = jsonb_build_object(
          'role', 'player',
          'first_name', 'Miguna',
          'last_name', 'Reagan',
          'full_name', 'Miguna Reagan',
          'jersey_number', 27,
          'team_id', v_team_fass,
          'email_verified', true,
          'student_id', '',
          'phone', ''
        ),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_uid_miguna;
  ELSE
    IF v_uid_miguna IS NULL THEN
      v_uid_miguna := gen_random_uuid();
    END IF;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid_miguna,
      'authenticated',
      'authenticated',
      v_miguna_email,
      v_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
      jsonb_build_object(
        'role', 'player',
        'first_name', 'Miguna',
        'last_name', 'Reagan',
        'full_name', 'Miguna Reagan',
        'jersey_number', 27,
        'team_id', v_team_fass,
        'email_verified', true,
        'student_id', '',
        'phone', ''
      ),
      NOW(),
      NOW(),
      '',
      ''
    );
  END IF;

  -- Ensure public.profiles record
  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    team_id,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    v_uid_miguna,
    v_miguna_email,
    'player',
    'Miguna',
    'Reagan',
    v_team_fass,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'player',
    first_name = 'Miguna',
    last_name = 'Reagan',
    team_id = v_team_fass,
    is_verified = true,
    updated_at = NOW();

  -- Ensure public.players record
  IF EXISTS (SELECT 1 FROM public.players WHERE profile_id = v_uid_miguna) THEN
    UPDATE public.players
    SET team_id = v_team_fass,
        jersey_number = 27,
        position = 'MID',
        first_name = 'Miguna',
        last_name = 'Reagan',
        nationality = 'Kenya',
        preferred_foot = 'right',
        status = 'Fit',
        is_approved = true,
        updated_at = NOW()
    WHERE profile_id = v_uid_miguna;
  ELSE
    INSERT INTO public.players (
      id,
      profile_id,
      team_id,
      jersey_number,
      position,
      first_name,
      last_name,
      nationality,
      preferred_foot,
      status,
      is_approved,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_uid_miguna,
      v_team_fass,
      27,
      'MID',
      'Miguna',
      'Reagan',
      'Kenya',
      'right',
      'Fit',
      true,
      NOW(),
      NOW()
    );
  END IF;


  -- =========================================================================
  -- 2. FIDEL JASPHER (Fass Elites, Jersey #28, FWD)
  -- =========================================================================

  -- Check if already exists in auth.users by email or metadata
  SELECT id INTO v_uid_fidel
  FROM auth.users
  WHERE LOWER(email) = LOWER(v_fidel_email)
     OR (raw_user_meta_data->>'first_name' ILIKE 'Fidel' AND raw_user_meta_data->>'last_name' ILIKE 'Jaspher')
  LIMIT 1;

  -- Also check in public.profiles if not found in auth.users
  IF v_uid_fidel IS NULL THEN
    SELECT id INTO v_uid_fidel
    FROM public.profiles
    WHERE LOWER(email) = LOWER(v_fidel_email)
       OR (first_name ILIKE 'Fidel' AND last_name ILIKE 'Jaspher')
    LIMIT 1;
  END IF;

  -- Also check in public.players if not found
  IF v_uid_fidel IS NULL THEN
    SELECT profile_id INTO v_uid_fidel
    FROM public.players
    WHERE team_id = v_team_fass
      AND first_name ILIKE 'Fidel'
      AND last_name ILIKE 'Jaspher'
    LIMIT 1;
  END IF;

  -- If exists in auth.users, update; otherwise insert
  IF v_uid_fidel IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid_fidel) THEN
    UPDATE auth.users
    SET encrypted_password = COALESCE(encrypted_password, v_pw),
        raw_user_meta_data = jsonb_build_object(
          'role', 'player',
          'first_name', 'Fidel',
          'last_name', 'Jaspher',
          'full_name', 'Fidel Jaspher',
          'jersey_number', 28,
          'team_id', v_team_fass,
          'email_verified', true,
          'student_id', '',
          'phone', ''
        ),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_uid_fidel;
  ELSE
    IF v_uid_fidel IS NULL THEN
      v_uid_fidel := gen_random_uuid();
    END IF;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_uid_fidel,
      'authenticated',
      'authenticated',
      v_fidel_email,
      v_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
      jsonb_build_object(
        'role', 'player',
        'first_name', 'Fidel',
        'last_name', 'Jaspher',
        'full_name', 'Fidel Jaspher',
        'jersey_number', 28,
        'team_id', v_team_fass,
        'email_verified', true,
        'student_id', '',
        'phone', ''
      ),
      NOW(),
      NOW(),
      '',
      ''
    );
  END IF;

  -- Ensure public.profiles record
  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    team_id,
    is_verified,
    created_at,
    updated_at
  ) VALUES (
    v_uid_fidel,
    v_fidel_email,
    'player',
    'Fidel',
    'Jaspher',
    v_team_fass,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'player',
    first_name = 'Fidel',
    last_name = 'Jaspher',
    team_id = v_team_fass,
    is_verified = true,
    updated_at = NOW();

  -- Ensure public.players record
  IF EXISTS (SELECT 1 FROM public.players WHERE profile_id = v_uid_fidel) THEN
    UPDATE public.players
    SET team_id = v_team_fass,
        jersey_number = 28,
        position = 'FWD',
        first_name = 'Fidel',
        last_name = 'Jaspher',
        nationality = 'Kenya',
        preferred_foot = 'right',
        status = 'Fit',
        is_approved = true,
        updated_at = NOW()
    WHERE profile_id = v_uid_fidel;
  ELSE
    INSERT INTO public.players (
      id,
      profile_id,
      team_id,
      jersey_number,
      position,
      first_name,
      last_name,
      nationality,
      preferred_foot,
      status,
      is_approved,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_uid_fidel,
      v_team_fass,
      28,
      'FWD',
      'Fidel',
      'Jaspher',
      'Kenya',
      'right',
      'Fit',
      true,
      NOW(),
      NOW()
    );
  END IF;

END $$;
