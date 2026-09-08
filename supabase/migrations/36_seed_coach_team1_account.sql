-- Migration 36: Seed coachteam1@gmail.com Head Coach Account
-- Email: coachteam1@gmail.com
-- Password: coachteam1
-- Role: coach (Exclusive Head Coach Manager)

DO $$
DECLARE
  v_coach_uid UUID := '88888888-8888-4888-8888-888888888888';
  v_encrypted_pw TEXT;
  v_target_team_id UUID;
BEGIN
  -- Generate bcrypt hash for password 'coachteam1'
  v_encrypted_pw := extensions.crypt('coachteam1', extensions.gen_salt('bf'));

  -- 1. Insert or update in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachteam1@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'first_name', 'Head Coach', 'last_name', 'Team 1', 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachteam1@gmail.com';
    
    SELECT id INTO v_coach_uid FROM auth.users WHERE LOWER(email) = 'coachteam1@gmail.com';
  ELSE
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
      v_coach_uid,
      'authenticated',
      'authenticated',
      'coachteam1@gmail.com',
      v_encrypted_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
      jsonb_build_object('role', 'coach', 'first_name', 'Head Coach', 'last_name', 'Team 1', 'email_verified', true),
      NOW(),
      NOW(),
      '',
      ''
    );
  END IF;

  -- 2. Insert or update public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    bio,
    created_at,
    updated_at
  ) VALUES (
    v_coach_uid,
    'coachteam1@gmail.com',
    'coach',
    'Head Coach',
    'Team 1',
    'Head Coach of Team 1 - Full Dashboard Authority',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'coach',
      email = 'coachteam1@gmail.com',
      first_name = 'Head Coach',
      last_name = 'Team 1',
      bio = 'Head Coach of Team 1 - Full Dashboard Authority',
      updated_at = NOW();

  -- 3. Link Coach to Team 1
  -- Check if default Team 1 exists
  SELECT id INTO v_target_team_id FROM public.teams WHERE id = '10000000-0000-4000-8000-000000000001';
  
  IF v_target_team_id IS NOT NULL THEN
    UPDATE public.teams
    SET coach_id = v_coach_uid
    WHERE id = v_target_team_id;
  ELSE
    -- If custom id does not exist, assign to first available team
    UPDATE public.teams
    SET coach_id = v_coach_uid
    WHERE id = (SELECT id FROM public.teams ORDER BY created_at ASC LIMIT 1);
  END IF;

END $$;
