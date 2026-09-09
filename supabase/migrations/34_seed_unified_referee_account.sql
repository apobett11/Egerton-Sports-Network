-- Migration 34: Seed referee1@gmail.com Unified Referee Account
-- Password: referee1

DO $$
DECLARE
  v_ref_uid UUID := '99999999-9999-4999-9999-999999999999';
  v_encrypted_pw TEXT;
BEGIN
  -- Generate bcrypt hash for password 'referee1'
  v_encrypted_pw := extensions.crypt('referee1', extensions.gen_salt('bf'));

  -- Check if user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'referee1@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        raw_user_meta_data = jsonb_build_object('role', 'referee', 'first_name', 'Official', 'last_name', 'Referee', 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW(),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, '')
    WHERE LOWER(email) = 'referee1@gmail.com';
    
    SELECT id INTO v_ref_uid FROM auth.users WHERE LOWER(email) = 'referee1@gmail.com';
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
      recovery_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      phone_change,
      phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_ref_uid,
      'authenticated',
      'authenticated',
      'referee1@gmail.com',
      v_encrypted_pw,
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
      jsonb_build_object('role', 'referee', 'first_name', 'Official', 'last_name', 'Referee', 'email_verified', true),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Ensure profile exists
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
    v_ref_uid,
    'referee1@gmail.com',
    'referee',
    'Official',
    'Referee',
    'Unified Official Referee Account',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'referee',
      email = 'referee1@gmail.com',
      first_name = 'Official',
      last_name = 'Referee',
      updated_at = NOW();

  -- Ensure referees table record exists
  INSERT INTO public.referees (
    id,
    name,
    email,
    phone,
    status,
    badge_level,
    created_at,
    updated_at
  ) VALUES (
    v_ref_uid,
    'Official Referee',
    'referee1@gmail.com',
    '+254700000000',
    'Active',
    'FIFA/FKF Premier Official',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET name = 'Official Referee',
      email = 'referee1@gmail.com',
      status = 'Active',
      badge_level = 'FIFA/FKF Premier Official',
      updated_at = NOW();

END $$;
