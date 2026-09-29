-- =========================================================================
-- Migration 70: Repair Supabase GoTrue Auth Schema on New Database (tdfiodqlzptaruhivapj)
-- =========================================================================
-- Problem: Direct SQL seeding into auth.users created NULL values in columns where
-- GoTrue expects strings, causing "500: Database error querying schema" and
-- "Database error finding users" during any signInWithPassword or signUp call.
--
-- Solution:
-- 1. Ensure all string-typed token and change columns in auth.users are non-null.
-- 2. Confirm accounts and restore authenticated passwords for all dashboard roles.
-- =========================================================================

-- 1. Coalesce all nullable token and verification columns to empty string
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- 2. Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 3. Restore production dashboard credentials and confirm emails

-- Role 1: SuperAdmin (apobett11@gmail.com) -> Apo1574bett7687
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Apo1574bett7687', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'apobett11@gmail.com';

-- Role 2: Coach - Alex Mbui / Fass Elites (masasiadavid@gmail.com) -> CoachAlex@2026!
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('CoachAlex@2026!', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'masasiadavid@gmail.com';

-- Role 3: Official Referee (officialreferee@gmail.com) -> Official@referee2026
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Official@referee2026', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'officialreferee@gmail.com';

-- Role 4: Sports Journalist (journalist@gmail.com) -> Journalist@2026!
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Journalist@2026!', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'journalist@gmail.com';

-- 4. Enable public profile lookup for own profile and ensure RLS consistency
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
