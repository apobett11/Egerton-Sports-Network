-- ============================================================================
-- Migration 56: Enterprise SRE Architecture & Database Hardening
-- 1. Automatic PostgREST Schema Cache Invalidation via DDL Event Trigger
-- 2. Hermetic Extension & Search Path Hardening (pgcrypto / digest)
-- 3. Zero-Recursion Auth Helper & Decoupled RLS Policies (profiles & fixtures)
-- 4. Foreign Key Integrity & Composite Query Embedding Indexes
-- ============================================================================

-- ============================================================================
-- COMPONENT 1: AUTOMATIC DDL EVENT TRIGGER (AUTO SCHEMA RELOAD)
-- ============================================================================

-- 1. Create schema reload notifier function
CREATE OR REPLACE FUNCTION public.pgrst_auto_reload_schema()
RETURNS event_trigger AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind event trigger to DDL execution
DROP EVENT TRIGGER IF EXISTS trg_pgrst_ddl_reload;
CREATE EVENT TRIGGER trg_pgrst_ddl_reload 
ON ddl_command_end 
EXECUTE FUNCTION public.pgrst_auto_reload_schema();

-- ============================================================================
-- COMPONENT 2: HERMETIC EXTENSION & SEARCH PATH HARDENING
-- ============================================================================

-- Ensure extensions schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Canonical wrappers with explicit immutable search path
CREATE OR REPLACE FUNCTION public.digest(data text, type text)
RETURNS bytea AS $$
  SELECT extensions.digest(data::bytea, type);
$$ LANGUAGE sql IMMUTABLE STRICT SECURITY DEFINER 
SET search_path = extensions, public, pg_temp;

CREATE OR REPLACE FUNCTION public.digest(data bytea, type text)
RETURNS bytea AS $$
  SELECT extensions.digest(data, type);
$$ LANGUAGE sql IMMUTABLE STRICT SECURITY DEFINER 
SET search_path = extensions, public, pg_temp;

-- ============================================================================
-- COMPONENT 3: ZERO-RECURSION AUTH & RLS POLICIES
-- ============================================================================

-- 1. High-speed, non-recursive role getter keeping canonical user_role return type
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
  v_jwt_role text;
BEGIN
  -- A. Zero-DB path: read claims directly from authenticated JWT
  v_jwt_role := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role');
  IF v_jwt_role IS NULL OR v_jwt_role = '' THEN
    v_jwt_role := (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role');
  END IF;
  
  IF v_jwt_role IS NOT NULL AND v_jwt_role <> '' THEN
    BEGIN
      RETURN v_jwt_role::user_role;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  -- B. Fallback: Direct lookup executing with explicit search path
  SELECT role INTO v_role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(v_role, 'guest'::user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER 
SET search_path = public, auth, pg_temp;

-- 2. Non-recursive profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full manage profiles" ON public.profiles;

CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins full manage profiles"
  ON public.profiles FOR ALL
  USING (
    (SELECT auth.uid()) = id 
    OR public.get_auth_role() IN ('admin', 'president')
  );

-- 3. Non-recursive fixtures RLS
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Fixtures readable by everyone" ON public.fixtures;
DROP POLICY IF EXISTS "Officials manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Allow manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Unified officials update fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Admins and Presidents manage fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Referees update assigned fixtures" ON public.fixtures;
DROP POLICY IF EXISTS "Journalists referees update assigned fixtures" ON public.fixtures;

CREATE POLICY "Fixtures readable by everyone"
  ON public.fixtures FOR SELECT
  USING (true);

CREATE POLICY "Officials manage fixtures"
  ON public.fixtures FOR ALL
  USING (
    public.get_auth_role() IN ('admin', 'president', 'referee')
    OR auth.role() = 'authenticated'
  )
  WITH CHECK (
    public.get_auth_role() IN ('admin', 'president', 'referee')
    OR auth.role() = 'authenticated'
  );

-- ============================================================================
-- COMPONENT 4: FOREIGN KEY INTEGRITY & EMBEDDING INDEXES
-- ============================================================================

-- Ensure optional faculty column on teams if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'faculty') THEN
    ALTER TABLE public.teams ADD COLUMN faculty TEXT;
  END IF;
END $$;

-- Ensure consistent foreign key relationships for resource embedding
ALTER TABLE public.fixtures 
  DROP CONSTRAINT IF EXISTS fixtures_home_team_id_fkey,
  DROP CONSTRAINT IF EXISTS fixtures_away_team_id_fkey,
  DROP CONSTRAINT IF EXISTS fixtures_competition_id_fkey;

ALTER TABLE public.fixtures
  ADD CONSTRAINT fixtures_home_team_id_fkey 
    FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fixtures_away_team_id_fkey 
    FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fixtures_competition_id_fkey 
    FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE;

-- Performance indexes for nested joins and keyset pagination
CREATE INDEX IF NOT EXISTS idx_fixtures_embed_perf
  ON public.fixtures (competition_id, scheduled_time DESC, status);

CREATE INDEX IF NOT EXISTS idx_teams_lookup_id
  ON public.teams (id);

-- PostgREST explicit grant
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
