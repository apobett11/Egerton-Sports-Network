-- MANUAL ONLY. This file is not a migration and is not applied by the app.
-- It does not delete teams. It clears crest blobs that were stored in the row
-- so list queries stop shipping image bytes. Re-upload those crests to the
-- team-logos bucket before running this.

UPDATE public.teams
SET logo_url = NULL
WHERE logo_url LIKE 'data:image%';
