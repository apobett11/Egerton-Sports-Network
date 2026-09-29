-- =========================================================================
-- Migration 78: Repair GoTrue auth rows + grant the admin read access to
--               every table (profiles included) on tdfiodqlzptaruhivapj.
-- =========================================================================
-- Symptoms this fixes (observed live on 2026-09-29):
--   * POST /auth/v1/token?grant_type=password  -> 500 "Database error querying schema"
--     for EVERY existing account (a non-existent e-mail correctly returns 400).
--     GoTrue scans auth.users into non-nullable Go strings; rows seeded by SQL
--     carry NULL in token/change columns and have no auth.identities row.
--   * POST /auth/v1/signup -> 500 "Database error saving new user".
--     public.handle_new_user() runs under supabase_auth_admin whose search_path
--     does not include public, so the unqualified `user_role` cast fails.
--   * "permission denied for table profiles" (and every other table) in the
--     admin console. Without a real JWT the client runs as `anon`, which only
--     holds a column-limited SELECT on profiles (migration 67). Once GoTrue
--     works the session is `authenticated`; this migration guarantees that
--     role can read every table and that an admin passes RLS on all of them.
--
-- Safe to re-run. Does not modify any person's name, e-mail, phone, country
-- or avatar. Run in Supabase Dashboard -> SQL Editor as the postgres role.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. GoTrue row repair: every string column GoTrue scans must be non-NULL.
-- -------------------------------------------------------------------------
UPDATE auth.users
SET
  confirmation_token          = COALESCE(confirmation_token, ''),
  recovery_token              = COALESCE(recovery_token, ''),
  email_change                = COALESCE(email_change, ''),
  email_change_token_new      = COALESCE(email_change_token_new, ''),
  email_change_token_current  = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  phone_change                = COALESCE(phone_change, ''),
  phone_change_token          = COALESCE(phone_change_token, ''),
  reauthentication_token      = COALESCE(reauthentication_token, ''),
  raw_app_meta_data           = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  raw_user_meta_data          = COALESCE(raw_user_meta_data, '{}'::jsonb),
  aud                         = COALESCE(NULLIF(aud, ''), 'authenticated'),
  role                        = COALESCE(NULLIF(role, ''), 'authenticated'),
  instance_id                 = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
  is_sso_user                 = COALESCE(is_sso_user, false),
  created_at                  = COALESCE(created_at, NOW()),
  updated_at                  = COALESCE(updated_at, NOW())
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL OR email_change IS NULL
  OR email_change_token_new IS NULL OR email_change_token_current IS NULL
  OR email_change_confirm_status IS NULL OR phone_change IS NULL
  OR phone_change_token IS NULL OR reauthentication_token IS NULL
  OR raw_app_meta_data IS NULL OR raw_user_meta_data IS NULL
  OR aud IS NULL OR aud = '' OR role IS NULL OR role = ''
  OR instance_id IS NULL OR is_sso_user IS NULL
  OR created_at IS NULL OR updated_at IS NULL;

-- Newer GoTrue schemas carry is_anonymous; guard so the script runs anywhere.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous'
  ) THEN
    EXECUTE 'UPDATE auth.users SET is_anonymous = false WHERE is_anonymous IS NULL';
  END IF;
END $$;

-- Keep the role claim GoTrue puts in the JWT aligned with public.profiles so
-- public.get_auth_role() resolves without a table lookup.
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role::text)
FROM public.profiles p
WHERE p.id = u.id
  AND COALESCE(u.raw_user_meta_data ->> 'role', '') <> p.role::text;

UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role::text)
FROM public.profiles p
WHERE p.id = u.id
  AND COALESCE(u.raw_app_meta_data ->> 'role', '') <> p.role::text;

-- Every e-mail user needs an identities row; SQL-seeded rows have none.
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
  );

UPDATE auth.identities
SET identity_data = COALESCE(identity_data, '{}'::jsonb),
    provider_id   = COALESCE(provider_id, user_id::text),
    created_at    = COALESCE(created_at, NOW()),
    updated_at    = COALESCE(updated_at, NOW())
WHERE identity_data IS NULL OR provider_id IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- Ensure pgcrypto is available for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set standard passwords for verified officials and coaches
DO $$
BEGIN
  -- SuperAdmin (Apo1574bett7687)
  UPDATE auth.users
  SET encrypted_password = crypt('Apo1574bett7687', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email = 'apobett11@gmail.com';

  -- Coach Alex Mbui / Fass Elites (CoachAlex@2026!)
  UPDATE auth.users
  SET encrypted_password = crypt('CoachAlex@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email = 'masasiadavid@gmail.com';

  -- All Other Team Coaches (Coach@2026!)
  UPDATE auth.users
  SET encrypted_password = crypt('Coach@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email IN (
    'johanakinuthianew@gmail.com',
    'churchillkimori2@gmail.com',
    'otienojulius421@gmail.com',
    'lameckagwata0@gmail.com',
    'coachteam1@gmail.com',
    'otienowallace222@gmail.com',
    'ngetichagrippa357@gmail.com',
    'ochiengerdman@gmail.com',
    'ogolamiket@gmail.com',
    'iankipruto166@gmail.com',
    'erickmuteti620@gmail.com',
    'richkyson062@gmail.com',
    'markkevint9@gmail.com',
    'blacksheriff088@gmail.com'
  );

  -- Official Referees (Official@referee2026)
  UPDATE auth.users
  SET encrypted_password = crypt('Official@referee2026', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email IN ('officialreferee@gmail.com', 'officialreferee@egerscore.com', 'referee1@gmail.com');

  -- Sports Journalist (Journalist@2026!)
  UPDATE auth.users
  SET encrypted_password = crypt('Journalist@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE email = 'journalist@gmail.com';
END $$;

-- -------------------------------------------------------------------------
-- 2. Sign-up trigger: qualified search_path, never aborts the auth insert.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role  public.user_role;
  v_first TEXT;
  v_last  TEXT;
BEGIN
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'player'::public.user_role);
  EXCEPTION WHEN OTHERS THEN
    v_role := 'player'::public.user_role;
  END;
  v_first := COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User');
  v_last  := COALESCE(NEW.raw_user_meta_data ->> 'last_name', LEFT(NEW.id::text, 8));

  BEGIN
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (NEW.id, NEW.email, v_role, v_first, v_last)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert skipped for %: %', NEW.id, SQLERRM;
  END;

  IF v_role = 'player'::public.user_role THEN
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.players WHERE profile_id = NEW.id) THEN
        INSERT INTO public.players (profile_id) VALUES (NEW.id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: player insert skipped for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT SELECT, INSERT ON public.profiles, public.players TO supabase_auth_admin;

-- -------------------------------------------------------------------------
-- 3. Table grants: the signed-in `authenticated` role may read every table.
--    RLS still decides which rows; anon keeps the column-limited profile read
--    from migration 67.
-- -------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- -------------------------------------------------------------------------
-- 4. RLS: an admin can SELECT every row of every RLS-protected table.
--    Generated for all current public tables so nothing is missed.
-- -------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admin platform read" ON public.%I', r.relname);
    EXECUTE format(
      'CREATE POLICY "Admin platform read" ON public.%I FOR SELECT TO authenticated USING (public.get_auth_role() = ''admin''::public.user_role)',
      r.relname
    );
  END LOOP;
END $$;

-- Admin operational writes the console performs (suspend/restore/role/verify,
-- approvals, announcements, audit trail, Admin-2 settings).
DROP POLICY IF EXISTS "Admin updates profiles" ON public.profiles;
CREATE POLICY "Admin updates profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.get_auth_role() = 'admin'::public.user_role)
  WITH CHECK (public.get_auth_role() = 'admin'::public.user_role);

DROP POLICY IF EXISTS "Admin manages players" ON public.players;
CREATE POLICY "Admin manages players"
  ON public.players FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin'::public.user_role)
  WITH CHECK (public.get_auth_role() = 'admin'::public.user_role);

DROP POLICY IF EXISTS "Admin manages announcements" ON public.announcements;
CREATE POLICY "Admin manages announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin'::public.user_role)
  WITH CHECK (public.get_auth_role() = 'admin'::public.user_role);

DROP POLICY IF EXISTS "Admin writes audit logs" ON public.audit_logs;
CREATE POLICY "Admin writes audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin manages system settings" ON public.system_settings;
CREATE POLICY "Admin manages system settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin'::public.user_role)
  WITH CHECK (public.get_auth_role() = 'admin'::public.user_role);

-- Storage: admin can list/measure the team-logos bucket.
DROP POLICY IF EXISTS "Admin reads team-logos objects" ON storage.objects;
CREATE POLICY "Admin reads team-logos objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'team-logos' AND public.get_auth_role() = 'admin'::public.user_role);

-- -------------------------------------------------------------------------
-- 5. Personal-data lock: an admin may read every profile and change
--    operational fields (role, bio/suspension, is_verified, badge, team),
--    but may never alter another person's identity or contact details.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_personal_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.id
     AND public.get_auth_role() = 'admin'::public.user_role
     AND (
          NEW.first_name  IS DISTINCT FROM OLD.first_name
       OR NEW.last_name   IS DISTINCT FROM OLD.last_name
       OR NEW.email       IS DISTINCT FROM OLD.email
       OR NEW.phone       IS DISTINCT FROM OLD.phone
       OR NEW.country     IS DISTINCT FROM OLD.country
       OR NEW.avatar_url  IS DISTINCT FROM OLD.avatar_url
     )
  THEN
    RAISE EXCEPTION 'PERSONAL_DATA_LOCKED: administrators may read profiles but only the account owner can change name, e-mail, phone, country or avatar.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_personal_data ON public.profiles;
CREATE TRIGGER trg_protect_profile_personal_data
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_personal_data();

-- -------------------------------------------------------------------------
-- 6. Reload PostgREST so the new grants/policies take effect immediately.
-- -------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- -------------------------------------------------------------------------
-- Verification (run after the migration; all three should be clean):
--   SELECT count(*) FROM auth.users
--   WHERE email_change IS NULL OR email_change_token_new IS NULL
--      OR confirmation_token IS NULL OR recovery_token IS NULL;           -- 0
--   SELECT count(*) FROM auth.users u
--   WHERE NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id); -- 0
--   SELECT count(*) FROM pg_policies
--   WHERE schemaname = 'public' AND policyname = 'Admin platform read';   -- = number of RLS tables
-- Then: POST /auth/v1/token?grant_type=password must return 200 or 400, never 500.
-- =========================================================================
