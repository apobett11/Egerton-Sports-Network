-- ============================================================================
-- Step 1: Verify Referee Permissions & RLS
-- Ensures the referee role has explicit mutation rights to live match
-- operations and referee working set tables without schema corruption.
-- ============================================================================

-- 1. Ensure RLS is enabled on live match and referee tables
ALTER TABLE IF EXISTS public.referee_working_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_live_states ENABLE ROW LEVEL SECURITY;

-- 2. Grant referee access to working sets and live match scoring
DROP POLICY IF EXISTS "Referees can operate live match sets" ON public.referee_working_sets;
CREATE POLICY "Referees can operate live match sets"
ON public.referee_working_sets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role::text = 'REFEREE' OR role::text = 'referee')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role::text = 'REFEREE' OR role::text = 'referee')
  )
);
