-- ============================================================================
-- MIGRATION 61: COMPREHENSIVE PERFORMANCE OPTIMIZATION
-- Objectives:
--   1. Eliminate all N+1 query patterns with server-side batch RPC functions
--   2. Add missing compound & covering indexes for every high-frequency query
--   3. Connection pooling advisory settings (PgBouncer-compatible)
--   4. Materialized batch-query RPCs used by dashboards (section-level async)
--   5. Query projection enforcement (SECURITY DEFINER, STABLE, SELECT-only)
-- ============================================================================

-- ============================================================================
-- SECTION 1: MISSING INDEXES
-- ============================================================================
-- All existing indexes preserved. Only net-new indexes added below.

-- 1a. fixtures — covering index for the single-row match detail fetch
--     Used by getMatchDetails() → avoids heap fetch for all projected cols
CREATE INDEX IF NOT EXISTS idx_fixtures_detail_cover
  ON public.fixtures (id)
  INCLUDE (
    status, scheduled_time, score_home, score_away, venue, matchday,
    attendance, weather, added_time, home_penalty_score, away_penalty_score,
    referee_id, assistant_referee_1_id, assistant_referee_2_id,
    fourth_official_id, verified_by_referee_id, stats_processed,
    competition_id, home_team_id, away_team_id
  );

-- 1b. fixtures — composite for getTeamRecentMatches / getHeadToHead
--     Query pattern: WHERE status IN ('FT') AND (home_team_id=X OR away_team_id=X)
CREATE INDEX IF NOT EXISTS idx_fixtures_ft_home
  ON public.fixtures (home_team_id, status, scheduled_time DESC)
  WHERE status IN ('FT', 'FINAL', 'ARCHIVED');

CREATE INDEX IF NOT EXISTS idx_fixtures_ft_away
  ON public.fixtures (away_team_id, status, scheduled_time DESC)
  WHERE status IN ('FT', 'FINAL', 'ARCHIVED');

-- 1c. fixtures — soft-delete filter (deleted_at IS NULL) used in standings RPC
CREATE INDEX IF NOT EXISTS idx_fixtures_not_deleted_status
  ON public.fixtures (competition_id, status)
  WHERE deleted_at IS NULL;

-- 1d. fixtures — assignment_status lookups (referee dashboard)
CREATE INDEX IF NOT EXISTS idx_fixtures_ref_assignment
  ON public.fixtures (referee_id, assignment_status, scheduled_time)
  WHERE deleted_at IS NULL;

-- 1e. match_events — player-level stat aggregations (top scorers, assists)
--     Query: WHERE type IN ('goal','penalty') AND fixture_id in (FT fixtures)
CREATE INDEX IF NOT EXISTS idx_match_events_type_player
  ON public.match_events (type, player_id)
  WHERE type IN ('goal', 'penalty', 'assist');

-- 1f. match_events — team + type filter for match stats per team
CREATE INDEX IF NOT EXISTS idx_match_events_team_type
  ON public.match_events (team_id, type, fixture_id);

-- 1g. match_live_events — ordered streaming query (match_uid + minute)
CREATE INDEX IF NOT EXISTS idx_match_live_events_match_minute
  ON public.match_live_events (match_uid, minute ASC, occurred_at ASC);

-- 1h. league_standings — covering index to avoid heap fetch for standings widget
CREATE INDEX IF NOT EXISTS idx_league_standings_cover
  ON public.league_standings (competition_id, points DESC, goal_difference DESC, goals_for DESC)
  INCLUDE (team_id, played, won, drawn, lost, goals_for, goals_against, last_updated);

-- 1i. team_form — covering index for batch form lookups
CREATE INDEX IF NOT EXISTS idx_team_form_cover
  ON public.team_form (team_id)
  INCLUDE (competition_id, latest_results, last_updated);

-- 1j. player_stats — full covering index for top-scorers & leaderboard
CREATE INDEX IF NOT EXISTS idx_player_stats_cover
  ON public.player_stats (competition_id, goals DESC, assists DESC)
  INCLUDE (player_id, clean_sheets, last_updated);

-- 1k. players — status filter for active roster queries
CREATE INDEX IF NOT EXISTS idx_players_team_status
  ON public.players (team_id, status)
  WHERE status = 'active';

-- 1l. news_articles — category + author filter (journalist dashboard)
CREATE INDEX IF NOT EXISTS idx_news_author_status
  ON public.news_articles (author_id, status, published_at DESC);

-- 1m. announcements — combined role+team filter (dashboard announcements widget)
CREATE INDEX IF NOT EXISTS idx_announcements_role_team
  ON public.announcements (target_role, target_team_id, created_at DESC);

-- 1n. squad_requests — team + status for coach/captain inbox
CREATE INDEX IF NOT EXISTS idx_squad_requests_team_status
  ON public.squad_requests (team_id, status, created_at DESC);

-- 1o. audit_logs — resource filter for admin view
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_id
  ON public.audit_logs (resource_type, resource_id, created_at DESC);

-- 1p. man_of_the_match_nominations — fast comp+week lookup
CREATE INDEX IF NOT EXISTS idx_motm_comp_week
  ON public.man_of_the_match_nominations (competition_id, created_at DESC)
  INCLUDE (player_id, team_id, fixture_id);

-- 1q. player_of_the_week_votes — fast tally with covering index
CREATE INDEX IF NOT EXISTS idx_potw_votes_cover
  ON public.player_of_the_week_votes (competition_id, matchweek, player_id)
  INCLUDE (device_id, created_at);

-- 1r. match_lineups — covering to avoid extra heap fetch
CREATE INDEX IF NOT EXISTS idx_match_lineups_fixture_cover
  ON public.match_lineups (fixture_id)
  INCLUDE (team_id, formation, starting_xi, substitutes, captain_id, vice_captain_id, captain_notes);

-- 1s. matchday_schedules — fixture FK lookup (used in getMatchDetails)
CREATE INDEX IF NOT EXISTS idx_matchday_schedules_fixture
  ON public.matchday_schedules (fixture_id)
  INCLUDE (center_referee_id, linesman_team_a_id, linesman_team_b_id);

-- 1t. profiles — role + name lookup for officials batch fetch
CREATE INDEX IF NOT EXISTS idx_profiles_id_cover
  ON public.profiles (id)
  INCLUDE (first_name, last_name, role, email);

-- 1u. teams — coach+captain FK indexes (for embed joins)
CREATE INDEX IF NOT EXISTS idx_teams_coach
  ON public.teams (coach_id)
  WHERE coach_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teams_captain
  ON public.teams (captain_id)
  WHERE captain_id IS NOT NULL;

-- ============================================================================
-- SECTION 2: N+1 ELIMINATION — SERVER-SIDE BATCH RPC FUNCTIONS
-- ============================================================================
-- Each function replaces a serial loop of queries that the frontend was making.
-- All functions: STABLE | SECURITY DEFINER | SET search_path = public, pg_temp

-- 2a. Batch Match Detail Loader
--     Eliminates N+1 in getMatchDetails():
--       - fixture row                         (1 query)
--       - matchday_schedules row              (1 query) — merged in here
--       - match_events rows                   (1 query) — merged in here
--       - match_lineups rows                  (1 query) — merged in here
--     Total: was 4 sequential queries → now 1 RPC call
CREATE OR REPLACE FUNCTION public.get_match_detail_bundle(p_fixture_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fixture     JSONB;
  v_schedule    JSONB;
  v_events      JSONB;
  v_lineups     JSONB;
BEGIN
  -- Fixture core (projected columns only — no wildcard)
  SELECT to_jsonb(f) INTO v_fixture
  FROM (
    SELECT
      f.id, f.status, f.scheduled_time, f.score_home, f.score_away,
      f.venue, f.matchday, f.attendance, f.weather, f.added_time,
      f.home_penalty_score, f.away_penalty_score, f.referee_id,
      f.assistant_referee_1_id, f.assistant_referee_2_id,
      f.fourth_official_id, f.verified_by_referee_id,
      f.competition_id, f.home_team_id, f.away_team_id,
      f.linesman_team_a_id, f.linesman_team_b_id
    FROM public.fixtures f
    WHERE f.id = p_fixture_id
    LIMIT 1
  ) f;

  -- Matchday schedule officiating (single projected row)
  SELECT to_jsonb(ms) INTO v_schedule
  FROM (
    SELECT ms.center_referee_id, ms.linesman_team_a_id, ms.linesman_team_b_id
    FROM public.matchday_schedules ms
    WHERE ms.fixture_id = p_fixture_id
    LIMIT 1
  ) ms;

  -- Match events (ordered, projected)
  SELECT COALESCE(jsonb_agg(e ORDER BY e.minute ASC), '[]'::jsonb) INTO v_events
  FROM (
    SELECT
      me.id, me.fixture_id, me.minute, me.type, me.event_target,
      me.team_id, me.player_id, me.assist_player_id,
      me.detail_text, me.is_official, me.created_at
    FROM public.match_events me
    WHERE me.fixture_id = p_fixture_id
  ) e;

  -- Match lineups (projected — excludes large JSONB only when null)
  SELECT COALESCE(jsonb_agg(l), '[]'::jsonb) INTO v_lineups
  FROM (
    SELECT
      ml.id, ml.fixture_id, ml.team_id, ml.formation,
      ml.starting_xi, ml.substitutes, ml.captain_id,
      ml.vice_captain_id, ml.captain_notes
    FROM public.match_lineups ml
    WHERE ml.fixture_id = p_fixture_id
  ) l;

  RETURN jsonb_build_object(
    'fixture',   COALESCE(v_fixture, '{}'::jsonb),
    'schedule',  COALESCE(v_schedule, '{}'::jsonb),
    'events',    COALESCE(v_events, '[]'::jsonb),
    'lineups',   COALESCE(v_lineups, '[]'::jsonb)
  );
END;
$$;

-- 2b. Batch Officials Resolver
--     Replaces the parallel profiles + referees queries in getMatchDetails().
--     Was: 2 queries (profiles.in(), referees.in()) → now 1 RPC call
CREATE OR REPLACE FUNCTION public.get_officials_bundle(p_official_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profiles  JSONB;
  v_referees  JSONB;
BEGIN
  IF p_official_ids IS NULL OR array_length(p_official_ids, 1) = 0 THEN
    RETURN jsonb_build_object('profiles', '[]'::jsonb, 'referees', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) INTO v_profiles
  FROM (
    SELECT id, first_name, last_name, role
    FROM public.profiles
    WHERE id = ANY(p_official_ids)
  ) p;

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_referees
  FROM (
    SELECT id, name
    FROM public.referees
    WHERE id = ANY(p_official_ids)
  ) r;

  RETURN jsonb_build_object('profiles', v_profiles, 'referees', v_referees);
END;
$$;

-- 2c. Batch Squad Loader (both teams in one call)
--     Replaces the two parallel supabase.from('players').eq('team_id', X) calls.
--     Was: 2 queries → 1 query returning both teams' squads keyed by team_id
CREATE OR REPLACE FUNCTION public.get_match_squads(p_home_team_id UUID, p_away_team_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_home JSONB;
  v_away JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(p ORDER BY p.jersey_number ASC), '[]'::jsonb) INTO v_home
  FROM (
    SELECT
      pl.id, pl.jersey_number, pl.position, pl.first_name, pl.last_name,
      pl.profile_id, pr.first_name AS prof_first_name, pr.last_name AS prof_last_name, pr.role AS prof_role
    FROM public.players pl
    LEFT JOIN public.profiles pr ON pr.id = pl.profile_id
    WHERE pl.team_id = p_home_team_id
      AND (pl.status IS NULL OR pl.status = 'active')
  ) p;

  SELECT COALESCE(jsonb_agg(p ORDER BY p.jersey_number ASC), '[]'::jsonb) INTO v_away
  FROM (
    SELECT
      pl.id, pl.jersey_number, pl.position, pl.first_name, pl.last_name,
      pl.profile_id, pr.first_name AS prof_first_name, pr.last_name AS prof_last_name, pr.role AS prof_role
    FROM public.players pl
    LEFT JOIN public.profiles pr ON pr.id = pl.profile_id
    WHERE pl.team_id = p_away_team_id
      AND (pl.status IS NULL OR pl.status = 'active')
  ) p;

  RETURN jsonb_build_object(
    'home', v_home,
    'away', v_away
  );
END;
$$;

-- 2d. Batch Guest Fixtures with pre-joined teams & competitions
--     Eliminates the 3-query pattern (fixtures + teams + competitions) in getGuestFixtures.
--     Was: 3 queries (fixtures, teams map, competitions map) → 1 RPC
CREATE OR REPLACE FUNCTION public.get_guest_fixtures(
  p_competition_id UUID DEFAULT NULL,
  p_date          DATE   DEFAULT NULL,
  p_matchday      INT    DEFAULT NULL
)
RETURNS TABLE (
  id                  UUID,
  competition_id      UUID,
  competition_name    TEXT,
  matchday            INT,
  scheduled_time      TIMESTAMPTZ,
  venue               TEXT,
  status              TEXT,
  score_home          INT,
  score_away          INT,
  home_penalty_score  INT,
  away_penalty_score  INT,
  home_team_id        UUID,
  home_team_name      TEXT,
  home_short_name     TEXT,
  home_logo_url       TEXT,
  home_color_code     TEXT,
  away_team_id        UUID,
  away_team_name      TEXT,
  away_short_name     TEXT,
  away_logo_url       TEXT,
  away_color_code     TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.competition_id,
    COALESCE(c.name, 'Campus Football') AS competition_name,
    COALESCE(f.matchday, 1) AS matchday,
    f.scheduled_time,
    COALESCE(f.venue, 'Egerton Main Grounds') AS venue,
    COALESCE(f.status, 'UPCOMING') AS status,
    COALESCE(f.score_home, 0) AS score_home,
    COALESCE(f.score_away, 0) AS score_away,
    f.home_penalty_score,
    f.away_penalty_score,
    ht.id   AS home_team_id,
    ht.name AS home_team_name,
    ht.short_name AS home_short_name,
    ht.logo_url   AS home_logo_url,
    ht.color_code AS home_color_code,
    at.id   AS away_team_id,
    at.name AS away_team_name,
    at.short_name AS away_short_name,
    at.logo_url   AS away_logo_url,
    at.color_code AS away_color_code
  FROM public.fixtures f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id
  LEFT JOIN public.competitions c ON c.id = f.competition_id
  WHERE (f.deleted_at IS NULL OR f.deleted_at > NOW())
    AND (p_competition_id IS NULL OR f.competition_id = p_competition_id)
    AND (p_date IS NULL OR DATE(f.scheduled_time AT TIME ZONE 'UTC') = p_date)
    AND (p_matchday IS NULL OR f.matchday = p_matchday)
  ORDER BY f.scheduled_time ASC;
END;
$$;

-- 2e. Batch Dashboard Context Loader (President / Admin)
--     One call returns: standings + upcoming fixtures + team forms + top scorers
--     Used by president dashboard — eliminates 4+ sequential queries
CREATE OR REPLACE FUNCTION public.get_dashboard_context(p_competition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_standings     JSONB;
  v_upcoming      JSONB;
  v_top_scorers   JSONB;
  v_team_forms    JSONB;
BEGIN
  -- Standings (from materialized table — no re-computation)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'team_id', ls.team_id,
      'team_name', t.name,
      'team_logo', t.logo_url,
      'played', ls.played, 'won', ls.won, 'drawn', ls.drawn, 'lost', ls.lost,
      'goals_for', ls.goals_for, 'goals_against', ls.goals_against,
      'goal_difference', ls.goal_difference, 'points', ls.points
    )
    ORDER BY ls.points DESC, ls.goal_difference DESC, ls.goals_for DESC
  ), '[]'::jsonb) INTO v_standings
  FROM public.league_standings ls
  JOIN public.teams t ON t.id = ls.team_id
  WHERE ls.competition_id = p_competition_id;

  -- Next 5 upcoming fixtures
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', f.id, 'scheduled_time', f.scheduled_time,
      'venue', f.venue, 'matchday', f.matchday, 'status', f.status,
      'home_team_id', f.home_team_id, 'home_team_name', ht.name,
      'home_team_logo', ht.logo_url,
      'away_team_id', f.away_team_id, 'away_team_name', at.name,
      'away_team_logo', at.logo_url
    )
    ORDER BY f.scheduled_time ASC
  ), '[]'::jsonb) INTO v_upcoming
  FROM (
    SELECT f.id, f.scheduled_time, f.venue, f.matchday, f.status,
           f.home_team_id, f.away_team_id
    FROM public.fixtures f
    WHERE f.competition_id = p_competition_id
      AND f.status IN ('UPCOMING', 'SCHEDULED')
      AND (f.deleted_at IS NULL OR f.deleted_at > NOW())
    ORDER BY f.scheduled_time ASC
    LIMIT 5
  ) f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id;

  -- Top 10 scorers (from materialized player_stats)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'player_id', ps.player_id,
      'player_name', (pr.first_name || ' ' || pr.last_name),
      'jersey_number', pl.jersey_number,
      'position', pl.position,
      'team_id', pl.team_id,
      'team_name', t.name,
      'team_logo', t.logo_url,
      'goals', ps.goals,
      'assists', ps.assists
    )
    ORDER BY ps.goals DESC, ps.assists DESC
  ), '[]'::jsonb) INTO v_top_scorers
  FROM (
    SELECT ps.player_id, ps.goals, ps.assists
    FROM public.player_stats ps
    WHERE ps.competition_id = p_competition_id AND ps.goals > 0
    ORDER BY ps.goals DESC, ps.assists DESC
    LIMIT 10
  ) ps
  JOIN public.players pl ON pl.id = ps.player_id
  JOIN public.profiles pr ON pr.id = pl.profile_id
  JOIN public.teams t ON t.id = pl.team_id;

  -- All team forms (batch)
  SELECT COALESCE(jsonb_object_agg(
    tf.team_id::text,
    tf.latest_results
  ), '{}'::jsonb) INTO v_team_forms
  FROM public.team_form tf
  WHERE tf.competition_id = p_competition_id;

  RETURN jsonb_build_object(
    'standings',    COALESCE(v_standings,   '[]'::jsonb),
    'upcoming',     COALESCE(v_upcoming,    '[]'::jsonb),
    'top_scorers',  COALESCE(v_top_scorers, '[]'::jsonb),
    'team_forms',   COALESCE(v_team_forms,  '{}'::jsonb)
  );
END;
$$;

-- 2f. Batch Referee Dashboard Context
--     One call returns: assigned upcoming + recent completed fixtures for a referee
--     Eliminates N+1 sequential fixture-by-fixture fetches in referee dashboard
CREATE OR REPLACE FUNCTION public.get_referee_dashboard_context(p_referee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assigned    JSONB;
  v_completed   JSONB;
BEGIN
  -- Upcoming assigned fixtures
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', f.id, 'status', f.status, 'scheduled_time', f.scheduled_time,
      'venue', f.venue, 'matchday', f.matchday, 'assignment_status', f.assignment_status,
      'home_team_id', f.home_team_id, 'home_team_name', ht.name, 'home_team_logo', ht.logo_url,
      'away_team_id', f.away_team_id, 'away_team_name', at.name, 'away_team_logo', at.logo_url,
      'competition_name', c.name
    )
    ORDER BY f.scheduled_time ASC
  ), '[]'::jsonb) INTO v_assigned
  FROM public.fixtures f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id
  LEFT JOIN public.competitions c ON c.id = f.competition_id
  WHERE f.referee_id = p_referee_id
    AND f.status IN ('UPCOMING', 'SCHEDULED', 'LIVE', 'HT')
    AND (f.deleted_at IS NULL OR f.deleted_at > NOW())
  ORDER BY f.scheduled_time ASC
  LIMIT 20;

  -- Last 10 completed matches
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', f.id, 'status', f.status, 'scheduled_time', f.scheduled_time,
      'score_home', f.score_home, 'score_away', f.score_away,
      'venue', f.venue, 'matchday', f.matchday,
      'home_team_name', ht.name, 'away_team_name', at.name,
      'competition_name', c.name
    )
    ORDER BY f.scheduled_time DESC
  ), '[]'::jsonb) INTO v_completed
  FROM (
    SELECT f.id, f.status, f.scheduled_time, f.score_home, f.score_away,
           f.venue, f.matchday, f.home_team_id, f.away_team_id, f.competition_id
    FROM public.fixtures f
    WHERE f.referee_id = p_referee_id
      AND f.status = 'FT'
      AND (f.deleted_at IS NULL OR f.deleted_at > NOW())
    ORDER BY f.scheduled_time DESC
    LIMIT 10
  ) f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id
  LEFT JOIN public.competitions c ON c.id = f.competition_id;

  RETURN jsonb_build_object(
    'assigned',  COALESCE(v_assigned,  '[]'::jsonb),
    'completed', COALESCE(v_completed, '[]'::jsonb)
  );
END;
$$;

-- 2g. Batch Team Dashboard Context
--     One call returns: squad + standings row + upcoming fixtures + team form
--     Eliminates N+1 in coach/captain team dashboard
CREATE OR REPLACE FUNCTION public.get_team_dashboard_context(p_team_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_team        JSONB;
  v_squad       JSONB;
  v_standing    JSONB;
  v_upcoming    JSONB;
  v_form        JSONB;
BEGIN
  -- Team info
  SELECT to_jsonb(t) INTO v_team
  FROM (
    SELECT id, name, short_name, logo_url, color_code, coach_id, captain_id,
           competition_id, formation, status, tactics_config, kits_config
    FROM public.teams
    WHERE id = p_team_id
    LIMIT 1
  ) t;

  -- Squad (active players with profile join)
  SELECT COALESCE(jsonb_agg(p ORDER BY p.jersey_number ASC), '[]'::jsonb) INTO v_squad
  FROM (
    SELECT
      pl.id, pl.jersey_number, pl.position, pl.first_name, pl.last_name,
      pl.profile_id, pl.status,
      pr.first_name AS prof_first_name, pr.last_name AS prof_last_name,
      pr.role AS prof_role, pr.avatar_url, pr.phone
    FROM public.players pl
    LEFT JOIN public.profiles pr ON pr.id = pl.profile_id
    WHERE pl.team_id = p_team_id
      AND (pl.status IS NULL OR pl.status = 'active')
  ) p;

  -- Standings row for this team
  SELECT to_jsonb(ls) INTO v_standing
  FROM (
    SELECT ls.played, ls.won, ls.drawn, ls.lost,
           ls.goals_for, ls.goals_against, ls.goal_difference, ls.points,
           ls.competition_id, ls.last_updated
    FROM public.league_standings ls
    WHERE ls.team_id = p_team_id
    ORDER BY ls.last_updated DESC
    LIMIT 1
  ) ls;

  -- Next 3 upcoming fixtures
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', f.id, 'scheduled_time', f.scheduled_time, 'venue', f.venue,
      'matchday', f.matchday, 'status', f.status,
      'home_team_id', f.home_team_id, 'home_team_name', ht.name, 'home_team_logo', ht.logo_url,
      'away_team_id', f.away_team_id, 'away_team_name', at.name, 'away_team_logo', at.logo_url
    )
    ORDER BY f.scheduled_time ASC
  ), '[]'::jsonb) INTO v_upcoming
  FROM (
    SELECT f.id, f.scheduled_time, f.venue, f.matchday, f.status,
           f.home_team_id, f.away_team_id
    FROM public.fixtures f
    WHERE (f.home_team_id = p_team_id OR f.away_team_id = p_team_id)
      AND f.status IN ('UPCOMING', 'SCHEDULED')
      AND (f.deleted_at IS NULL OR f.deleted_at > NOW())
    ORDER BY f.scheduled_time ASC
    LIMIT 3
  ) f
  JOIN public.teams ht ON ht.id = f.home_team_id
  JOIN public.teams at ON at.id = f.away_team_id;

  -- Team form
  SELECT to_jsonb(tf) INTO v_form
  FROM (
    SELECT latest_results, last_updated
    FROM public.team_form
    WHERE team_id = p_team_id
    LIMIT 1
  ) tf;

  RETURN jsonb_build_object(
    'team',     COALESCE(v_team,     '{}'::jsonb),
    'squad',    COALESCE(v_squad,    '[]'::jsonb),
    'standing', COALESCE(v_standing, '{}'::jsonb),
    'upcoming', COALESCE(v_upcoming, '[]'::jsonb),
    'form',     COALESCE(v_form,     '{}'::jsonb)
  );
END;
$$;

-- 2h. Batch News Feed Loader (journalist / guest)
--     One call returns published articles + total count — no separate COUNT query
CREATE OR REPLACE FUNCTION public.get_news_feed(
  p_status    TEXT    DEFAULT 'published',
  p_category  TEXT    DEFAULT NULL,
  p_author_id UUID    DEFAULT NULL,
  p_limit     INT     DEFAULT 20,
  p_offset    INT     DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_articles  JSONB;
  v_total     INT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.news_articles na
  WHERE (p_status IS NULL OR na.status = p_status)
    AND (p_category IS NULL OR na.category = p_category)
    AND (p_author_id IS NULL OR na.author_id = p_author_id);

  SELECT COALESCE(jsonb_agg(a ORDER BY a.published_at DESC), '[]'::jsonb) INTO v_articles
  FROM (
    SELECT
      na.id, na.title, na.slug, na.excerpt, na.image_url, na.category,
      na.status, na.published_at, na.created_at,
      na.author_id,
      pr.first_name AS author_first_name,
      pr.last_name  AS author_last_name
    FROM public.news_articles na
    LEFT JOIN public.profiles pr ON pr.id = na.author_id
    WHERE (p_status IS NULL OR na.status = p_status)
      AND (p_category IS NULL OR na.category = p_category)
      AND (p_author_id IS NULL OR na.author_id = p_author_id)
    ORDER BY na.published_at DESC NULLS LAST, na.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) a;

  RETURN jsonb_build_object(
    'articles', COALESCE(v_articles, '[]'::jsonb),
    'total',    COALESCE(v_total, 0)
  );
END;
$$;

-- 2i. Batch POTW Widget Loader
--     One call returns: current week nominees + winner + vote tally
--     Eliminates N+1 that fan dashboard was running (nominations + votes + winner)
CREATE OR REPLACE FUNCTION public.get_potw_bundle(
  p_competition_id UUID,
  p_matchweek      INT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nominees  JSONB;
  v_winner    JSONB;
  v_tallies   JSONB;
BEGIN
  -- Nominees (man_of_the_match nominations with player+team join)
  SELECT COALESCE(jsonb_agg(n), '[]'::jsonb) INTO v_nominees
  FROM (
    SELECT
      nom.id, nom.fixture_id, nom.player_id, nom.team_id,
      (pr.first_name || ' ' || pr.last_name) AS player_name,
      pl.jersey_number, pl.position,
      t.name AS team_name, t.logo_url AS team_logo
    FROM public.man_of_the_match_nominations nom
    JOIN public.players pl ON pl.id = nom.player_id
    JOIN public.profiles pr ON pr.id = pl.profile_id
    JOIN public.teams t ON t.id = nom.team_id
    WHERE nom.competition_id = p_competition_id
    ORDER BY nom.created_at DESC
    LIMIT 20
  ) n;

  -- Current week winner (if declared)
  SELECT to_jsonb(w) INTO v_winner
  FROM (
    SELECT id, player_id, player_name, team_name, team_logo,
           matchweek, vote_count, vote_share_percentage, status, awarded_at
    FROM public.player_of_the_week_winners
    WHERE competition_id = p_competition_id AND matchweek = p_matchweek
    LIMIT 1
  ) w;

  -- Vote tallies for current week
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('player_id', player_id, 'vote_count', vote_count)
    ORDER BY vote_count DESC
  ), '[]'::jsonb) INTO v_tallies
  FROM (
    SELECT player_id, COUNT(*) AS vote_count
    FROM public.player_of_the_week_votes
    WHERE competition_id = p_competition_id AND matchweek = p_matchweek
    GROUP BY player_id
  ) tally;

  RETURN jsonb_build_object(
    'nominees', COALESCE(v_nominees, '[]'::jsonb),
    'winner',   COALESCE(v_winner,   '{}'::jsonb),
    'tallies',  COALESCE(v_tallies,  '[]'::jsonb)
  );
END;
$$;

-- ============================================================================
-- SECTION 3: RLS GRANTS FOR NEW RPC FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_match_detail_bundle(UUID)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_officials_bundle(UUID[])          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_squads(UUID, UUID)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_fixtures(UUID, DATE, INT)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_context(UUID)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referee_dashboard_context(UUID)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_dashboard_context(UUID)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_news_feed(TEXT, TEXT, UUID, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_potw_bundle(UUID, INT)            TO anon, authenticated;

-- ============================================================================
-- SECTION 4: EXISTING get_league_standings — ADD CACHING HINT COMMENT
-- ============================================================================
-- The existing get_league_standings RPC (Migration 13) already uses STABLE
-- SECURITY DEFINER and operates on materialized tables. No change needed.
-- The new idx_league_standings_cover in Section 1 ensures it is index-only.

-- ============================================================================
-- SECTION 5: CONNECTION POOLING ADVISORY SETTINGS
-- ============================================================================
-- These are PostgreSQL advisory parameters for PgBouncer / Supavisor.
-- Supabase's hosted pooler respects these at session level.
-- statement_timeout:  abort runaway queries after 10 seconds
-- idle_in_transaction_session_timeout: reclaim pooled connections fast
-- lock_timeout: prevent lock convoy on busy tables

ALTER DATABASE postgres SET statement_timeout = '10s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '5s';
ALTER DATABASE postgres SET lock_timeout = '3s';

-- Work-mem bump for complex CTE sorts (standings, top-scorers aggregations)
ALTER DATABASE postgres SET work_mem = '16MB';

-- ============================================================================
-- SECTION 6: ASYNC-COMPATIBLE PARTIAL INDEXES FOR SECTION LOADING
-- ============================================================================
-- When dashboards load sections independently (async), each section fires
-- its own query. These partial indexes make each section's query index-only.

-- Live scores section: only LIVE/HT fixtures
CREATE INDEX IF NOT EXISTS idx_fixtures_live
  ON public.fixtures (scheduled_time DESC)
  WHERE status IN ('LIVE', 'HT')
    AND deleted_at IS NULL;

-- Upcoming section: only future UPCOMING fixtures
CREATE INDEX IF NOT EXISTS idx_fixtures_upcoming
  ON public.fixtures (competition_id, scheduled_time ASC)
  WHERE status IN ('UPCOMING', 'SCHEDULED')
    AND deleted_at IS NULL;

-- News widget: only published (avoids scanning draft/archived)
CREATE INDEX IF NOT EXISTS idx_news_published_only
  ON public.news_articles (published_at DESC, category)
  WHERE status = 'published';

-- Audit log admin section (most recent 100 rows)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent
  ON public.audit_logs (created_at DESC)
  INCLUDE (user_id, user_role, action, resource_type, resource_id);

-- Squad requests inbox — pending only
CREATE INDEX IF NOT EXISTS idx_squad_requests_pending
  ON public.squad_requests (team_id, created_at DESC)
  WHERE status = 'pending';

-- ============================================================================
-- SECTION 7: ANALYZE ALL AFFECTED TABLES (UPDATE PLANNER STATISTICS)
-- ============================================================================

ANALYZE public.fixtures;
ANALYZE public.match_events;
ANALYZE public.match_lineups;
ANALYZE public.match_live_events;
ANALYZE public.league_standings;
ANALYZE public.team_form;
ANALYZE public.player_stats;
ANALYZE public.players;
ANALYZE public.profiles;
ANALYZE public.teams;
ANALYZE public.competitions;
ANALYZE public.news_articles;
ANALYZE public.announcements;
ANALYZE public.squad_requests;
ANALYZE public.audit_logs;
ANALYZE public.man_of_the_match_nominations;
ANALYZE public.player_of_the_week_votes;
ANALYZE public.player_of_the_week_winners;
ANALYZE public.matchday_schedules;
