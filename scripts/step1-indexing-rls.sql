-- 1. Indexing for fast coach, player, and team lookups
CREATE INDEX IF NOT EXISTS idx_teams_name_lower ON public.teams (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_profiles_team_role ON public.profiles (team_id, role);
CREATE INDEX IF NOT EXISTS idx_players_team_pagination ON public.players (team_id, created_at DESC, id);

-- 2. Ensure RLS is active on team and squad tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_configurations ENABLE ROW LEVEL SECURITY;

-- 3. Coach Access Policies (Read all, write only their own squad)
DROP POLICY IF EXISTS "Coaches can manage only their own squad" ON public.players;
CREATE POLICY "Coaches can manage only their own squad"
ON public.players FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'COACH' OR role = 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'COACH' OR role = 'coach')
  )
);

DROP POLICY IF EXISTS "Coaches can update own team details" ON public.teams;
CREATE POLICY "Coaches can update own team details"
ON public.teams FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'COACH' OR role = 'coach')
  )
);
