-- Match end already updates league_standings, team_form, and player_stats
-- inside fn_process_match_statistics (BEFORE UPDATE on fixtures).
-- The statement trigger below rebuilt every player row in the same transaction
-- and held the referee's finalize call. Incremental stats remain the writer.

CREATE OR REPLACE FUNCTION public.trigger_fn_recalculate_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NULL;
END;
$$;
