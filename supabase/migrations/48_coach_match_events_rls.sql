-- Migration 48: Allow Coaches and Captains to manage match events for their own team
-- Ensures coach can record goal scorers, assists, and disciplinary cards for their own team strictly

DROP POLICY IF EXISTS "Coach manages own team match events" ON public.match_events;

CREATE POLICY "Coach manages own team match events"
  ON public.match_events FOR ALL
  USING (
    public.get_auth_role() IN ('admin', 'president', 'referee', 'journalist') OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = match_events.team_id AND (t.coach_id = auth.uid() OR t.captain_id = auth.uid())
    )
  )
  WITH CHECK (
    public.get_auth_role() IN ('admin', 'president', 'referee', 'journalist') OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = match_events.team_id AND (t.coach_id = auth.uid() OR t.captain_id = auth.uid())
    )
  );
