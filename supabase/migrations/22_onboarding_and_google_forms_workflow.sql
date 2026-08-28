-- Migration 22: Google Forms Ingestion & 1-Time Onboarding Workflow
-- Provides RPCs and schema alignment for Coach, Referee, and Player registration flows.
-- Ensures Teams are bound to Competitions, Referees are in the official referee pool, and all have valid UUIDs.

-- 1. Add specific google sheet tracking and status to teams if missing
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS player_sheet_url TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Ensure required columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Ensure required columns and constraints exist on players
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'players_team_id_jersey_number_key'
    ) THEN 
        ALTER TABLE public.players ADD CONSTRAINT players_team_id_jersey_number_key UNIQUE (team_id, jersey_number); 
    END IF; 
END $$;

-- 2. Master Onboarding Function (Executed via Apps Script, Edge Function, or Admin API)
CREATE OR REPLACE FUNCTION register_official_and_invite(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'coach',           -- 'referee' | 'coach'
    p_league_name TEXT DEFAULT NULL,       -- 'Egerton Premier League' | 'Egerton Championship' | UUID
    p_team_name TEXT DEFAULT NULL,
    p_badge_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_comp_id UUID;
    v_team_id UUID;
    v_sheet_url TEXT;
    v_ref_name TEXT;
BEGIN
    -- Strict Role Assertion
    IF p_role NOT IN ('referee', 'coach') THEN
        RAISE EXCEPTION 'Unauthorized official role: %', p_role;
    END IF;

    -- Resolve Competition ID if provided (UUID string or Name/Slug matching)
    IF p_league_name IS NOT NULL AND TRIM(p_league_name) <> '' THEN
        -- 1. Check if p_league_name is a valid UUID format
        IF p_league_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            SELECT id INTO v_comp_id 
            FROM public.competitions 
            WHERE id = p_league_name::UUID
            LIMIT 1;
        END IF;

        -- 2. Fallback: match by competition name, slug, or keywords
        IF v_comp_id IS NULL THEN
            SELECT id INTO v_comp_id 
            FROM public.competitions 
            WHERE LOWER(name) = LOWER(TRIM(p_league_name))
               OR LOWER(slug) = LOWER(TRIM(p_league_name))
               OR (LOWER(TRIM(p_league_name)) LIKE '%premier%' AND LOWER(name) LIKE '%premier%')
               OR (LOWER(TRIM(p_league_name)) LIKE '%champ%' AND LOWER(name) LIKE '%champ%')
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;
    END IF;

    -- Default to EPL if coach role and competition couldn't be resolved
    IF p_role = 'coach' AND v_comp_id IS NULL THEN
        v_comp_id := '11111111-1111-1111-1111-111111111111'::UUID;
    END IF;

    -- Check if user already exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_email));

    -- Upsert Profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        badge_number,
        is_verified,
        updated_at
    )
    VALUES (
        COALESCE(v_user_id, gen_random_uuid()),
        LOWER(TRIM(p_email)),
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_phone,
        p_role,
        p_badge_number,
        TRUE,
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = EXCLUDED.role,
        badge_number = COALESCE(EXCLUDED.badge_number, profiles.badge_number),
        is_verified = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- If role is 'referee', also upsert into public.referees table
    IF p_role = 'referee' THEN
        v_ref_name := TRIM(p_first_name || ' ' || COALESCE(p_last_name, ''));
        INSERT INTO public.referees (
            id,
            name,
            email,
            phone,
            status,
            badge_level,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            v_ref_name,
            LOWER(TRIM(p_email)),
            COALESCE(p_phone, '0700000000'),
            'Active',
            COALESCE(p_badge_number, 'FKF National Level 2'),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = COALESCE(EXCLUDED.phone, referees.phone),
            status = 'Active',
            badge_level = COALESCE(EXCLUDED.badge_level, referees.badge_level),
            updated_at = NOW();
    END IF;

    -- Handle Team Assignment for Coaches
    IF p_role = 'coach' AND p_team_name IS NOT NULL AND TRIM(p_team_name) <> '' THEN
        -- Find matching team
        SELECT id, player_sheet_url INTO v_team_id, v_sheet_url
        FROM public.teams 
        WHERE LOWER(name) = LOWER(TRIM(p_team_name)) 
           OR LOWER(short_name) = LOWER(TRIM(p_team_name))
           OR LOWER(REPLACE(name, ' FC', '')) = LOWER(REPLACE(TRIM(p_team_name), ' FC', ''))
        LIMIT 1;

        IF v_team_id IS NOT NULL THEN
            UPDATE public.teams 
            SET 
                coach_id = v_user_id,
                competition_id = COALESCE(v_comp_id, competition_id),
                status = 'approved',
                updated_at = NOW()
            WHERE id = v_team_id;
        ELSE
            -- Auto-create team with unique UUID bound to the competition
            v_team_id := gen_random_uuid();
            INSERT INTO public.teams (
                id,
                name,
                short_name,
                competition_id,
                coach_id,
                color_code,
                status,
                created_at,
                updated_at
            )
            VALUES (
                v_team_id,
                TRIM(p_team_name),
                UPPER(SUBSTRING(REGEXP_REPLACE(TRIM(p_team_name), '[^a-zA-Z0-9]', '', 'g'), 1, 3)),
                v_comp_id,
                v_user_id,
                CASE WHEN v_comp_id = '22222222-2222-2222-2222-222222222222'::UUID THEN '#2563EB' ELSE '#D4AF37' END,
                'approved',
                NOW(),
                NOW()
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'role', p_role,
        'team_id', v_team_id,
        'competition_id', v_comp_id,
        'team_sheet_url', v_sheet_url
    );
END;
$$;

-- 3. Dedicated Player Ingestion Function (Triggered by Team-Specific Sheets)
CREATE OR REPLACE FUNCTION import_player_from_team_sheet(
    p_team_id UUID,
    p_full_name TEXT,
    p_jersey_number INTEGER,
    p_position TEXT,
    p_student_id TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id UUID;
    v_name_parts TEXT[];
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    v_name_parts := string_to_array(TRIM(p_full_name), ' ');
    v_first_name := v_name_parts[1];
    v_last_name := array_to_string(v_name_parts[2:], ' ');

    -- Insert or Update Squad Member
    INSERT INTO public.players (
        team_id,
        first_name,
        last_name,
        jersey_number,
        position,
        student_id,
        phone,
        status,
        created_at
    )
    VALUES (
        p_team_id,
        v_first_name,
        COALESCE(v_last_name, ''),
        p_jersey_number,
        UPPER(p_position),
        p_student_id,
        p_phone,
        'active',
        NOW()
    )
    ON CONFLICT (team_id, jersey_number) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        position = EXCLUDED.position,
        student_id = EXCLUDED.student_id,
        phone = COALESCE(EXCLUDED.phone, players.phone),
        status = 'active'
    RETURNING id INTO v_player_id;

    RETURN jsonb_build_object('success', true, 'player_id', v_player_id);
END;
$$;

-- 4. Seed Official League Teams (10 EPL Teams & 13 Championship Teams with Exact UUIDs)
INSERT INTO public.teams (id, competition_id, name, short_name, color_code, status)
VALUES 
  -- Egerton Premier League (10 Teams)
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Sharklets FC', 'SHK', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Faculty of Arts', 'FOA', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Faculty of Science', 'FOS', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'Njoro FC', 'NJR', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'Egerton Strikers', 'EST', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'Buruburu FC', 'BRB', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111', 'Tatton Warriors', 'TAT', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111', 'Main Campus FC', 'MCF', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111', 'Egerton Athletics', 'EAT', '#D4AF37', 'approved'),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111', 'Kilimo Stars', 'KLS', '#D4AF37', 'approved'),

  -- Egerton Championship (13 Teams)
  ('20000000-0000-4000-a000-000000000001', '22222222-2222-2222-2222-222222222222', 'Championship FC Alpha', 'CHP-A', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000002', '22222222-2222-2222-2222-222222222222', 'Championship FC Beta', 'CHP-B', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000003', '22222222-2222-2222-2222-222222222222', 'Championship FC Gamma', 'CHP-G', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000004', '22222222-2222-2222-2222-222222222222', 'Championship FC Delta', 'CHP-D', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000005', '22222222-2222-2222-2222-222222222222', 'Championship FC Epsilon', 'CHP-E', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000006', '22222222-2222-2222-2222-222222222222', 'Championship FC Zeta', 'CHP-Z', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000007', '22222222-2222-2222-2222-222222222222', 'Championship FC Eta', 'CHP-H', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000008', '22222222-2222-2222-2222-222222222222', 'Championship FC Theta', 'CHP-T', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000009', '22222222-2222-2222-2222-222222222222', 'Championship FC Iota', 'CHP-I', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000010', '22222222-2222-2222-2222-222222222222', 'Championship FC Kappa', 'CHP-K', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000011', '22222222-2222-2222-2222-222222222222', 'Championship FC Lambda', 'CHP-L', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000012', '22222222-2222-2222-2222-222222222222', 'Championship FC Mu', 'CHP-M', '#2563EB', 'approved'),
  ('20000000-0000-4000-a000-000000000013', '22222222-2222-2222-2222-222222222222', 'Championship FC Nu', 'CHP-N', '#2563EB', 'approved')
ON CONFLICT (id) DO UPDATE SET
  competition_id = EXCLUDED.competition_id,
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  status = 'approved';

-- 5. Seed Official Referees Pool (8 Active Referees with Exact UUIDs)
INSERT INTO public.referees (id, name, phone, status, badge_level)
VALUES 
  ('30000000-0000-4000-9000-000000000001', 'Ref Official Alpha', '0711000001', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000002', 'Ref Official Beta', '0711000002', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000003', 'Ref Official Gamma', '0711000003', 'Active', 'FKF National Level 2'),
  ('30000000-0000-4000-9000-000000000004', 'Ref Official Delta', '0711000004', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000005', 'Ref Official Epsilon', '0711000005', 'Active', 'FKF Regional Level 1'),
  ('30000000-0000-4000-9000-000000000006', 'Ref Official Zeta', '0711000006', 'Active', 'FKF Campus Level 3'),
  ('30000000-0000-4000-9000-000000000007', 'Ref Official Eta', '0711000007', 'Active', 'FIFA Accredited'),
  ('30000000-0000-4000-9000-000000000008', 'Ref Official Theta', '0711000008', 'Active', 'FKF National Level 2')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = 'Active',
  badge_level = EXCLUDED.badge_level;
