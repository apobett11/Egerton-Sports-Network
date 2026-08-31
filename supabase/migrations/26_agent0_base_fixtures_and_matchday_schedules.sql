-- Migration 26: Agent 0 Base Fixtures (Immutable) and Matchday Schedules Foundation
-- Establishes immutable mathematical base pairings and schedule execution tables with non-collision constraints

-- 1. Create public.base_fixtures (Immutable Base Pairings)
CREATE TABLE IF NOT EXISTS public.base_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  leg INT NOT NULL CHECK (leg IN (1, 2)),
  match_sequence INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by league/competition
CREATE INDEX IF NOT EXISTS idx_base_fixtures_comp ON public.base_fixtures (competition_id);
CREATE INDEX IF NOT EXISTS idx_base_fixtures_seq ON public.base_fixtures (match_sequence);

-- Immutability Trigger for base_fixtures
CREATE OR REPLACE FUNCTION public.enforce_base_fixtures_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'base_fixtures is an immutable table. Updates are strictly forbidden.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_base_fixtures_mutation ON public.base_fixtures;
CREATE TRIGGER trg_prevent_base_fixtures_mutation
  BEFORE UPDATE ON public.base_fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_base_fixtures_immutability();

-- 2. Create public.matchday_schedules
CREATE TABLE IF NOT EXISTS public.matchday_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL UNIQUE REFERENCES public.base_fixtures(id) ON DELETE CASCADE,
  competition_id TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('EPL', 'CHAMPIONSHIP')),
  matchday_number INT NOT NULL,
  play_date DATE NOT NULL,
  is_weekend BOOLEAN NOT NULL DEFAULT TRUE,
  pitch_id TEXT,
  slot_number INT,
  period TEXT CHECK (period IN ('AM', 'PM') OR period IS NULL),
  start_time TEXT,
  end_time TEXT,
  center_referee_id TEXT,
  linesman_team_a_id TEXT,
  linesman_team_b_id TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index and unique constraints for non-collision
CREATE INDEX IF NOT EXISTS idx_matchday_schedules_comp ON public.matchday_schedules (competition_id);
CREATE INDEX IF NOT EXISTS idx_matchday_schedules_date ON public.matchday_schedules (play_date);
CREATE INDEX IF NOT EXISTS idx_matchday_schedules_matchday ON public.matchday_schedules (matchday_number);

DROP INDEX IF EXISTS public.uq_pitch_date_slot;
CREATE UNIQUE INDEX uq_pitch_date_slot ON public.matchday_schedules (play_date, pitch_id, period, slot_number)
  WHERE pitch_id IS NOT NULL AND slot_number IS NOT NULL AND period IS NOT NULL;

DROP INDEX IF EXISTS public.uq_referee_date_slot;
CREATE UNIQUE INDEX uq_referee_date_slot ON public.matchday_schedules (play_date, period, slot_number, center_referee_id)
  WHERE center_referee_id IS NOT NULL AND slot_number IS NOT NULL AND period IS NOT NULL;

-- Enable RLS
ALTER TABLE public.base_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchday_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "base_fixtures readable by everyone" ON public.base_fixtures;
CREATE POLICY "base_fixtures readable by everyone" ON public.base_fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "base_fixtures writable by authenticated and service" ON public.base_fixtures;
CREATE POLICY "base_fixtures writable by authenticated and service" ON public.base_fixtures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "matchday_schedules readable by everyone" ON public.matchday_schedules;
CREATE POLICY "matchday_schedules readable by everyone" ON public.matchday_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "matchday_schedules writable by authenticated and service" ON public.matchday_schedules;
CREATE POLICY "matchday_schedules writable by authenticated and service" ON public.matchday_schedules FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.base_fixtures TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.matchday_schedules TO anon, authenticated, service_role, postgres;
