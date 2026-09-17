-- Migration 50: Seed Additional Head Coaches for Fass Elites, Rangers fc, and Five Stars fc
-- Alex mbui (Fass Elites - Championships)
-- Eric Nzioka Muteti (Fass Elites - Championships)
-- Jeremy Peter (Rangers fc - Championships)
-- Marko De (Five Stars fc - EPL)

DO $$
DECLARE
  v_pw_alex TEXT := extensions.crypt('CoachAlex@2026!', extensions.gen_salt('bf'));
  v_pw_eric TEXT := extensions.crypt('CoachCityboy@2026!', extensions.gen_salt('bf'));
  v_pw_jeremy TEXT := extensions.crypt('CoachJerry@2026!', extensions.gen_salt('bf'));
  v_pw_marko TEXT := extensions.crypt('CoachDeMarko@2026!', extensions.gen_salt('bf'));

  v_uid_alex UUID := 'ce15bb37-06bf-4a85-b049-9d10307d05aa';
  v_uid_eric UUID := '28c227d4-f7e7-453a-a753-6a5ba0019003';
  v_uid_jeremy UUID := '10ac1229-a21c-4cd8-bb09-85d10deb664f';
  v_uid_marko UUID := 'fefd4e25-0893-4684-a0b6-1f42a7f92e1c';

  v_team_fass UUID := '20000000-0000-4000-8000-000000000003';
  v_team_rangers UUID := '20000000-0000-4000-8000-000000000009';
  v_team_fivestars UUID := '10000000-0000-4000-8000-000000000002';
BEGIN

  -- 1. Alex mbui (masasiadavid@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'masasiadavid@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_alex,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Alex mbui', 'first_name', 'Alex', 'last_name', 'mbui', 'nickname', 'Alex', 'phone_number', '0104911402', 'team_id', v_team_fass, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'masasiadavid@gmail.com';
    SELECT id INTO v_uid_alex FROM auth.users WHERE LOWER(email) = 'masasiadavid@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_alex, 'authenticated', 'authenticated', 'masasiadavid@gmail.com', v_pw_alex, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Alex mbui', 'first_name', 'Alex', 'last_name', 'mbui', 'nickname', 'Alex', 'phone_number', '0104911402', 'team_id', v_team_fass, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, phone, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_alex, 'masasiadavid@gmail.com', 'coach', 'Alex', 'mbui', '0104911402', v_team_fass, 'Head Coach of Fass Elites (Championships)', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Alex', last_name = 'mbui', phone = '0104911402', team_id = v_team_fass, is_verified = true, updated_at = NOW();

  -- 2. Eric Nzioka Muteti (erickmuteti620@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'erickmuteti620@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_eric,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Eric Nzioka Muteti', 'first_name', 'Eric', 'last_name', 'Nzioka Muteti', 'nickname', 'Cityboy', 'phone_number', '0791577876', 'team_id', v_team_fass, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'erickmuteti620@gmail.com';
    SELECT id INTO v_uid_eric FROM auth.users WHERE LOWER(email) = 'erickmuteti620@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_eric, 'authenticated', 'authenticated', 'erickmuteti620@gmail.com', v_pw_eric, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Eric Nzioka Muteti', 'first_name', 'Eric', 'last_name', 'Nzioka Muteti', 'nickname', 'Cityboy', 'phone_number', '0791577876', 'team_id', v_team_fass, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, phone, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_eric, 'erickmuteti620@gmail.com', 'coach', 'Eric', 'Nzioka Muteti', '0791577876', v_team_fass, 'Coach of Fass Elites (Championships)', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Eric', last_name = 'Nzioka Muteti', phone = '0791577876', team_id = v_team_fass, is_verified = true, updated_at = NOW();

  -- 3. Jeremy Peter (blacksheriff088@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'blacksheriff088@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_jeremy,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Jeremy Peter', 'first_name', 'Jeremy', 'last_name', 'Peter', 'nickname', 'Jerry', 'phone_number', '0106914928', 'team_id', v_team_rangers, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'blacksheriff088@gmail.com';
    SELECT id INTO v_uid_jeremy FROM auth.users WHERE LOWER(email) = 'blacksheriff088@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_jeremy, 'authenticated', 'authenticated', 'blacksheriff088@gmail.com', v_pw_jeremy, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Jeremy Peter', 'first_name', 'Jeremy', 'last_name', 'Peter', 'nickname', 'Jerry', 'phone_number', '0106914928', 'team_id', v_team_rangers, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, phone, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_jeremy, 'blacksheriff088@gmail.com', 'coach', 'Jeremy', 'Peter', '0106914928', v_team_rangers, 'Head Coach of Rangers fc (Championships)', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Jeremy', last_name = 'Peter', phone = '0106914928', team_id = v_team_rangers, is_verified = true, updated_at = NOW();

  -- 4. Marko De (markkevint9@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'markkevint9@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_marko,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Marko De', 'first_name', 'Marko', 'last_name', 'De', 'nickname', 'DeMarko', 'phone_number', '0114735729', 'team_id', v_team_fivestars, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'markkevint9@gmail.com';
    SELECT id INTO v_uid_marko FROM auth.users WHERE LOWER(email) = 'markkevint9@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_marko, 'authenticated', 'authenticated', 'markkevint9@gmail.com', v_pw_marko, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Marko De', 'first_name', 'Marko', 'last_name', 'De', 'nickname', 'DeMarko', 'phone_number', '0114735729', 'team_id', v_team_fivestars, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, phone, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_marko, 'markkevint9@gmail.com', 'coach', 'Marko', 'De', '0114735729', v_team_fivestars, 'Head Coach of Five Stars fc (EPL)', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Marko', last_name = 'De', phone = '0114735729', team_id = v_team_fivestars, is_verified = true, updated_at = NOW();

  -- 5. Link Primary Coach IDs to Teams
  UPDATE public.teams SET coach_id = v_uid_alex, updated_at = NOW() WHERE id = v_team_fass;
  UPDATE public.teams SET coach_id = v_uid_jeremy, updated_at = NOW() WHERE id = v_team_rangers;
  UPDATE public.teams SET coach_id = v_uid_marko, updated_at = NOW() WHERE id = v_team_fivestars;

END $$;
