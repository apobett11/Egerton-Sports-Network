-- ============================================================================
-- MIGRATION 20: MATCH LIVE INPUT ENGINE (ALGORITHM 1) TEMPORARY & AUDIT SCHEMA
-- ============================================================================

-- 1. Match Live States (Realtime live period and transient score tracking)
CREATE TABLE IF NOT EXISTS public.match_live_states (
  match_uid UUID PRIMARY KEY REFERENCES public.fixtures(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'LIVE',
  period TEXT NOT NULL DEFAULT 'FIRST_HALF',
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  event_sequence INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Match Live Events (Transient events stream entered by journalists / referees)
CREATE TABLE IF NOT EXISTS public.match_live_events (
  event_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_uid UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  team_uid UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_uid UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player_number INT,
  type TEXT NOT NULL,
  goal_type TEXT,
  card_type TEXT,
  minute INT NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'FIRST_HALF',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_by_role TEXT NOT NULL DEFAULT 'JOURNALIST',
  created_by_uid UUID,
  idempotency_key TEXT,
  is_derived_red BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_live_events_match ON public.match_live_events(match_uid);
CREATE INDEX IF NOT EXISTS idx_match_live_events_idemp ON public.match_live_events(match_uid, idempotency_key);

-- 3. Match Live Audit Logs (Immutable audit trail for all live state mutations)
CREATE TABLE IF NOT EXISTS public.match_live_audit_logs (
  audit_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_uid UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  event_uid UUID,
  action_type TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_uid UUID,
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_live_audit_match ON public.match_live_audit_logs(match_uid);

-- 4. Referee Working Sets (Isolated draft buffer for referee reconciliation)
CREATE TABLE IF NOT EXISTS public.referee_working_sets (
  match_uid UUID PRIMARY KEY REFERENCES public.fixtures(id) ON DELETE CASCADE,
  referee_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Canonical Permanent Results (Immutable authoritative final match record)
CREATE TABLE IF NOT EXISTS public.canonical_permanent_results (
  result_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_uid UUID NOT NULL UNIQUE REFERENCES public.fixtures(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  referee_uid UUID NOT NULL,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  history_snapshot JSONB
);

-- 6. Finalization Commands (Idempotency ledger for finalization actions)
CREATE TABLE IF NOT EXISTS public.finalization_commands (
  id BIGSERIAL PRIMARY KEY,
  match_uid UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  result_uid UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_finalization_command UNIQUE (match_uid, idempotency_key)
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.match_live_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_live_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_working_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_permanent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finalization_commands ENABLE ROW LEVEL SECURITY;

-- Read policies (Public view for scores and live events)
CREATE POLICY "Public read match_live_states" ON public.match_live_states FOR SELECT USING (true);
CREATE POLICY "Public read match_live_events" ON public.match_live_events FOR SELECT USING (true);
CREATE POLICY "Public read match_live_audit_logs" ON public.match_live_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public read canonical_permanent_results" ON public.canonical_permanent_results FOR SELECT USING (true);
CREATE POLICY "Public read referee_working_sets" ON public.referee_working_sets FOR SELECT USING (true);
CREATE POLICY "Public read finalization_commands" ON public.finalization_commands FOR SELECT USING (true);

-- Authenticated write policies (Journalists / Referees / Admins)
CREATE POLICY "Auth write match_live_states" ON public.match_live_states FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write match_live_events" ON public.match_live_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write match_live_audit_logs" ON public.match_live_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write referee_working_sets" ON public.referee_working_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write canonical_permanent_results" ON public.canonical_permanent_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write finalization_commands" ON public.finalization_commands FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- REALTIME PUBLICATION
-- ----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_live_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_live_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.canonical_permanent_results;
