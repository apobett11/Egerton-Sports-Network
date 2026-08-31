-- Migration 29: Agent 0 Action Logs Table & Telemetry
-- Dedicated audit table for all Agent 0 orchestrator actions, algorithm envelopes, and database writes

CREATE TABLE IF NOT EXISTS public.agent0_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  event_type TEXT,
  stage TEXT NOT NULL,
  algorithm TEXT,
  status TEXT NOT NULL,
  message TEXT,
  envelope JSONB,
  database_payload JSONB,
  verification_logs JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid filtering in SuperAdmin Dashboard
CREATE INDEX IF NOT EXISTS idx_agent0_logs_exec ON public.agent0_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent0_logs_season ON public.agent0_logs(season_id);
CREATE INDEX IF NOT EXISTS idx_agent0_logs_stage ON public.agent0_logs(stage);
CREATE INDEX IF NOT EXISTS idx_agent0_logs_created ON public.agent0_logs(created_at DESC);

-- Enable RLS and grant permissions
ALTER TABLE public.agent0_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent0_logs readable by everyone" ON public.agent0_logs;
CREATE POLICY "agent0_logs readable by everyone" ON public.agent0_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "agent0_logs writable by everyone" ON public.agent0_logs;
CREATE POLICY "agent0_logs writable by everyone" ON public.agent0_logs FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.agent0_logs TO anon, authenticated, service_role, postgres;
