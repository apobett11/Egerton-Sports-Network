-- Migration 40: Allow captain_id and vice_captain_id in match_lineups and teams to store player IDs without forcing them into auth.profiles
ALTER TABLE public.match_lineups DROP CONSTRAINT IF EXISTS match_lineups_captain_id_fkey;
ALTER TABLE public.match_lineups DROP CONSTRAINT IF EXISTS match_lineups_vice_captain_id_fkey;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_captain_id_fkey;
