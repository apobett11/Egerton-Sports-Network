-- Migration 41: Coach Player Management, Deletion, and Player Registration RPC
-- Enables Coach to add and delete players for their team, and provides public registration functions.

-- 1. Ensure public.players has all necessary tracking columns
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Fit';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 2. RLS Policies for Coaches to INSERT and DELETE their own players
DROP POLICY IF EXISTS "Coach inserts own team players" ON public.players;
CREATE POLICY "Coach inserts own team players"
  ON public.players FOR INSERT
  WITH CHECK (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coach deletes own team players" ON public.players;
CREATE POLICY "Coach deletes own team players"
  ON public.players FOR DELETE
  USING (
    public.get_auth_role() = 'admin' OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.coach_id = auth.uid()
    )
  );

-- 3. Atomic Player Registration RPC (Can be invoked publicly or via Coach Dashboard)
CREATE OR REPLACE FUNCTION register_player_to_team(
    p_team_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_student_id TEXT DEFAULT NULL,
    p_jersey_number INTEGER DEFAULT NULL,
    p_position TEXT DEFAULT 'MID',
    p_preferred_foot TEXT DEFAULT 'right',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
    v_player_id UUID;
    v_jersey INT;
BEGIN
    -- Resolve or create profile UUID
    v_profile_id := COALESCE(p_user_id, gen_random_uuid());

    -- Resolve jersey number if not provided
    IF p_jersey_number IS NULL OR p_jersey_number <= 0 THEN
        SELECT COALESCE(MAX(jersey_number), 0) + 1 INTO v_jersey
        FROM public.players
        WHERE team_id = p_team_id;
    ELSE
        v_jersey := p_jersey_number;
    END IF;

    -- 1. Upsert Profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        is_verified,
        updated_at
    )
    VALUES (
        v_profile_id,
        LOWER(TRIM(p_email)),
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_phone,
        'player',
        FALSE,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW()
    RETURNING id INTO v_profile_id;

    -- 2. Insert into Players table
    INSERT INTO public.players (
        id,
        profile_id,
        team_id,
        jersey_number,
        position,
        preferred_foot,
        first_name,
        last_name,
        student_id,
        phone,
        status,
        is_approved,
        nationality,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        v_profile_id,
        p_team_id,
        v_jersey,
        UPPER(p_position),
        LOWER(p_preferred_foot),
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_student_id,
        p_phone,
        'Fit',
        FALSE,
        'Kenya',
        NOW()
    )
    RETURNING id INTO v_player_id;

    RETURN jsonb_build_object(
        'success', true,
        'player_id', v_player_id,
        'profile_id', v_profile_id,
        'jersey_number', v_jersey
    );
END;
$$;

-- 4. Atomic Player Removal RPC
CREATE OR REPLACE FUNCTION delete_player_from_team(
    p_player_id UUID,
    p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.players
    WHERE id = p_player_id AND team_id = p_team_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
