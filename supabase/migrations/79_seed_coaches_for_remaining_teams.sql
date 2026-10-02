-- Migration 79: Seed Head Coaches for Legends Fc, Blue Blazers, Giants FC, and Rising stars

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_team_legends UUID := '10000000-0000-4000-8000-000000000007';
  v_team_blue UUID := '10000000-0000-4000-8000-000000000005';
  v_team_giants UUID := '10000000-0000-4000-8000-000000000008';
  v_team_rising UUID := '10000000-0000-4000-8000-00000000000c';

  v_uid_legends UUID := 'c0ac0000-0000-4000-8000-000000000007';
  v_uid_blue UUID := 'c0ac0000-0000-4000-8000-000000000005';
  v_uid_giants UUID := 'c0ac0000-0000-4000-8000-000000000008';
  v_uid_rising UUID := 'c0ac0000-0000-4000-8000-00000000000c';

  v_pw_legends TEXT := extensions.crypt('EgerCoach2026!#7710', extensions.gen_salt('bf'));
  v_pw_blue TEXT := extensions.crypt('EgerCoach2026!#5520', extensions.gen_salt('bf'));
  v_pw_giants TEXT := extensions.crypt('EgerCoach2026!#8830', extensions.gen_salt('bf'));
  v_pw_rising TEXT := extensions.crypt('EgerCoach2026!#9940', extensions.gen_salt('bf'));
BEGIN
  -- 1. Legends Fc (coachlegends@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachlegends@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_legends,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Legends', 'first_name', 'Coach', 'last_name', 'Legends', 'team_id', v_team_legends, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachlegends@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_legends, 'authenticated', 'authenticated', 'coachlegends@gmail.com', v_pw_legends, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Legends', 'first_name', 'Coach', 'last_name', 'Legends', 'team_id', v_team_legends, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_legends, 'coachlegends@gmail.com', 'coach', 'Coach', 'Legends', v_team_legends, 'Head Coach of Legends Fc', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Legends', team_id = v_team_legends, bio = 'Head Coach of Legends Fc', is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_legends, updated_at = NOW() WHERE id = v_team_legends;

  -- 2. Blue Blazers (coachblueblazers@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachblueblazers@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_blue,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Blue Blazers', 'first_name', 'Coach', 'last_name', 'Blue Blazers', 'team_id', v_team_blue, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachblueblazers@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_blue, 'authenticated', 'authenticated', 'coachblueblazers@gmail.com', v_pw_blue, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Blue Blazers', 'first_name', 'Coach', 'last_name', 'Blue Blazers', 'team_id', v_team_blue, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_blue, 'coachblueblazers@gmail.com', 'coach', 'Coach', 'Blue Blazers', v_team_blue, 'Head Coach of Blue Blazers', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Blue Blazers', team_id = v_team_blue, bio = 'Head Coach of Blue Blazers', is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_blue, updated_at = NOW() WHERE id = v_team_blue;

  -- 3. Giants FC (coachgiants@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachgiants@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_giants,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Giants', 'first_name', 'Coach', 'last_name', 'Giants', 'team_id', v_team_giants, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachgiants@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_giants, 'authenticated', 'authenticated', 'coachgiants@gmail.com', v_pw_giants, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Giants', 'first_name', 'Coach', 'last_name', 'Giants', 'team_id', v_team_giants, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_giants, 'coachgiants@gmail.com', 'coach', 'Coach', 'Giants', v_team_giants, 'Head Coach of Giants FC', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Giants', team_id = v_team_giants, bio = 'Head Coach of Giants FC', is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_giants, updated_at = NOW() WHERE id = v_team_giants;

  -- 4. Rising stars (coachrisingstars@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachrisingstars@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_rising,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Rising Stars', 'first_name', 'Coach', 'last_name', 'Rising Stars', 'team_id', v_team_rising, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachrisingstars@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_rising, 'authenticated', 'authenticated', 'coachrisingstars@gmail.com', v_pw_rising, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Rising Stars', 'first_name', 'Coach', 'last_name', 'Rising Stars', 'team_id', v_team_rising, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_rising, 'coachrisingstars@gmail.com', 'coach', 'Coach', 'Rising Stars', v_team_rising, 'Head Coach of Rising stars', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Rising Stars', team_id = v_team_rising, bio = 'Head Coach of Rising stars', is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_rising, updated_at = NOW() WHERE id = v_team_rising;

  -- Ensure identities exist for auth email provider
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT u.id, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', NOW(), NOW(), NOW()
  FROM auth.users u
  WHERE u.id IN (v_uid_legends, v_uid_blue, v_uid_giants, v_uid_rising)
    AND NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
    );

END $$;
