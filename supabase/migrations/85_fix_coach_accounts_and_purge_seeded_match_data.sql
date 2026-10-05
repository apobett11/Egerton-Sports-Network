-- Migration 85: Fix Missing Coach Accounts and Purge Mock Seeded Play Data
-- Description:
-- 1. Create auth accounts and profiles for the 5 Championship teams missing coaches:
--    Emsa FC, Tatton fc, Talanta fc, young stars, law fc.
-- 2. Link their coach_id in teams table so RLS and coach authorization succeed.
-- 3. Purge the 93 unauthenticated mock/seeded match events from September that inflated player goals/assists.
-- 4. Backfill created_by for the 30 authentic coach events submitted in October.
-- 5. Recompute player_stats strictly from authentic records via recalculate_all_player_stats().

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_pw_emsa TEXT := extensions.crypt('CoachEmsa2026!#10', extensions.gen_salt('bf'));
  v_pw_tatton TEXT := extensions.crypt('CoachTatton2026!#20', extensions.gen_salt('bf'));
  v_pw_talanta TEXT := extensions.crypt('CoachTalanta2026!#30', extensions.gen_salt('bf'));
  v_pw_youngstars TEXT := extensions.crypt('CoachYoungStars2026!#40', extensions.gen_salt('bf'));
  v_pw_law TEXT := extensions.crypt('CoachLaw2026!#50', extensions.gen_salt('bf'));

  v_uid_emsa UUID := 'c0ac0000-0000-4000-8000-000000000004';
  v_uid_tatton UUID := 'c0ac0000-0000-4000-8000-000000000010';
  v_uid_talanta UUID := 'c0ac0000-0000-4000-8000-000000000006';
  v_uid_youngstars UUID := 'c0ac0000-0000-4000-8000-000000000011';
  v_uid_law UUID := 'c0ac0000-0000-4000-8000-000000000012';

  v_team_emsa UUID := '20000000-0000-4000-8000-000000000004';
  v_team_tatton UUID := '20000000-0000-4000-8000-000000000005';
  v_team_talanta UUID := '20000000-0000-4000-8000-000000000006';
  v_team_youngstars UUID := '20000000-0000-4000-8000-000000000008';
  v_team_law UUID := '20000000-0000-4000-8000-00000000000a';
BEGIN
  -- 1. Emsa FC Coach (coachemsa@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachemsa@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_emsa,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Emsa', 'first_name', 'Coach', 'last_name', 'Emsa', 'team_id', v_team_emsa, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachemsa@gmail.com';
    SELECT id INTO v_uid_emsa FROM auth.users WHERE LOWER(email) = 'coachemsa@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_emsa, 'authenticated', 'authenticated', 'coachemsa@gmail.com', v_pw_emsa, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Emsa', 'first_name', 'Coach', 'last_name', 'Emsa', 'team_id', v_team_emsa, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_emsa, 'coachemsa@gmail.com', 'coach', 'Coach', 'Emsa', v_team_emsa, 'Head Coach of Emsa FC', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Emsa', team_id = v_team_emsa, is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_emsa, updated_at = NOW() WHERE id = v_team_emsa;

  -- 2. Tatton fc Coach (coachtatton@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachtatton@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_tatton,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Tatton', 'first_name', 'Coach', 'last_name', 'Tatton', 'team_id', v_team_tatton, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachtatton@gmail.com';
    SELECT id INTO v_uid_tatton FROM auth.users WHERE LOWER(email) = 'coachtatton@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_tatton, 'authenticated', 'authenticated', 'coachtatton@gmail.com', v_pw_tatton, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Tatton', 'first_name', 'Coach', 'last_name', 'Tatton', 'team_id', v_team_tatton, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_tatton, 'coachtatton@gmail.com', 'coach', 'Coach', 'Tatton', v_team_tatton, 'Head Coach of Tatton fc', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Tatton', team_id = v_team_tatton, is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_tatton, updated_at = NOW() WHERE id = v_team_tatton;

  -- 3. Talanta fc Coach (coachtalanta@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachtalanta@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_talanta,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Talanta', 'first_name', 'Coach', 'last_name', 'Talanta', 'team_id', v_team_talanta, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachtalanta@gmail.com';
    SELECT id INTO v_uid_talanta FROM auth.users WHERE LOWER(email) = 'coachtalanta@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_talanta, 'authenticated', 'authenticated', 'coachtalanta@gmail.com', v_pw_talanta, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Talanta', 'first_name', 'Coach', 'last_name', 'Talanta', 'team_id', v_team_talanta, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_talanta, 'coachtalanta@gmail.com', 'coach', 'Coach', 'Talanta', v_team_talanta, 'Head Coach of Talanta fc', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Talanta', team_id = v_team_talanta, is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_talanta, updated_at = NOW() WHERE id = v_team_talanta;

  -- 4. young stars Coach (coachyoungstars@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachyoungstars@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_youngstars,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Young Stars', 'first_name', 'Coach', 'last_name', 'Young Stars', 'team_id', v_team_youngstars, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachyoungstars@gmail.com';
    SELECT id INTO v_uid_youngstars FROM auth.users WHERE LOWER(email) = 'coachyoungstars@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_youngstars, 'authenticated', 'authenticated', 'coachyoungstars@gmail.com', v_pw_youngstars, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Young Stars', 'first_name', 'Coach', 'last_name', 'Young Stars', 'team_id', v_team_youngstars, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_youngstars, 'coachyoungstars@gmail.com', 'coach', 'Coach', 'Young Stars', v_team_youngstars, 'Head Coach of young stars', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Young Stars', team_id = v_team_youngstars, is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_youngstars, updated_at = NOW() WHERE id = v_team_youngstars;

  -- 5. law fc Coach (coachlaw@gmail.com)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'coachlaw@gmail.com') THEN
    UPDATE auth.users
    SET encrypted_password = v_pw_law,
        raw_user_meta_data = jsonb_build_object('role', 'coach', 'full_name', 'Coach Law', 'first_name', 'Coach', 'last_name', 'Law', 'team_id', v_team_law, 'email_verified', true),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE LOWER(email) = 'coachlaw@gmail.com';
    SELECT id INTO v_uid_law FROM auth.users WHERE LOWER(email) = 'coachlaw@gmail.com';
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid_law, 'authenticated', 'authenticated', 'coachlaw@gmail.com', v_pw_law, NOW(), jsonb_build_object('provider', 'email', 'providers', json_build_array('email')), jsonb_build_object('role', 'coach', 'full_name', 'Coach Law', 'first_name', 'Coach', 'last_name', 'Law', 'team_id', v_team_law, 'email_verified', true), NOW(), NOW(), '', '');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, team_id, bio, is_verified, created_at, updated_at)
  VALUES (v_uid_law, 'coachlaw@gmail.com', 'coach', 'Coach', 'Law', v_team_law, 'Head Coach of law fc', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach', last_name = 'Law', team_id = v_team_law, is_verified = true, updated_at = NOW();

  UPDATE public.teams SET coach_id = v_uid_law, updated_at = NOW() WHERE id = v_team_law;

  -- Ensure identities exist for auth email provider for all 5 new coaches
  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT u.id, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', NOW(), NOW(), NOW()
  FROM auth.users u
  WHERE u.id IN (v_uid_emsa, v_uid_tatton, v_uid_talanta, v_uid_youngstars, v_uid_law)
    AND NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
    );

  -- 6. Purge the unauthenticated mock/seeded match events from September
  -- Strictly preserve any real coach events (submitted in October 2026) and referee finalizations
  DELETE FROM public.match_events
  WHERE created_at < '2026-10-01T00:00:00Z'
    AND created_by IS NULL;

  -- 7. Backfill created_by for the authentic coach events created in October
  UPDATE public.match_events me
  SET created_by = t.coach_id
  FROM public.teams t
  WHERE me.team_id = t.id
    AND me.created_by IS NULL
    AND t.coach_id IS NOT NULL;

END $$;

-- 8. Recalculate player stats strictly from authentic records
SELECT public.recalculate_all_player_stats();
