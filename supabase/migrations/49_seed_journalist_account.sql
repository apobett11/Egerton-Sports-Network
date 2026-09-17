-- Migration 48: Seed journalist@gmail.com Official Journalist Account
-- Email: journalist@gmail.com
-- Password: Journalist@2026!
-- Role: journalist

DO $$
DECLARE
  v_journalist_uid UUID := 'd65b388b-9249-4506-862b-f61559ccf7a6';
  v_encrypted_pw TEXT;
BEGIN
  -- Generate bcrypt hash for password 'Journalist@2026!'
  v_encrypted_pw := extensions.crypt('Journalist@2026!', extensions.gen_salt('bf'));

  -- 1. Insert or update in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'journalist@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        raw_user_meta_data = jsonb_build_object(
          'role', 'journalist',
          'full_name', 'Official Journalist',
          'first_name', 'Official',
          'last_name', 'Journalist',
          'email_verified', true
        ),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'journalist@gmail.com';
    
    SELECT id INTO v_journalist_uid FROM auth.users WHERE LOWER(email) = 'journalist@gmail.com';
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
      v_journalist_uid,
      'authenticated',
      'authenticated',
      'journalist@gmail.com',
      v_encrypted_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
      jsonb_build_object(
        'role', 'journalist',
        'full_name', 'Official Journalist',
        'first_name', 'Official',
        'last_name', 'Journalist',
        'email_verified', true
      ),
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
    v_journalist_uid,
    'journalist@gmail.com',
    'journalist',
    'Official',
    'Journalist',
    'Press Newsroom Official Journalist',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'journalist',
      email = 'journalist@gmail.com',
      first_name = 'Official',
      last_name = 'Journalist',
      bio = 'Press Newsroom Official Journalist',
      updated_at = NOW();

END $$;
