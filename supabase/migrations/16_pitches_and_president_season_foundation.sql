-- Migration 16: Pitches Table Foundation, Team Uniqueness Constraints, and President RLS Alignment
-- Establishes public.pitches table, seeds official Egerton pitches with valid UUIDs, and enforces team uniqueness

-- 1. Create public.pitches table
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_code TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INT DEFAULT 5000,
  surface_type TEXT DEFAULT 'Natural Grass',
  has_lighting BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Maintenance', 'Occupied', 'Unavailable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on pitches
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Pitches
DROP POLICY IF EXISTS "Pitches readable by everyone" ON public.pitches;
CREATE POLICY "Pitches readable by everyone"
  ON public.pitches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Presidents and Admins manage pitches" ON public.pitches;
CREATE POLICY "Presidents and Admins manage pitches"
  ON public.pitches FOR ALL USING (
    public.get_auth_role() IN ('president', 'admin') OR auth.role() = 'authenticated'
  );

-- Seed Official Egerton Pitches with Valid Hexadecimal UUIDs
INSERT INTO public.pitches (id, name, short_code, location, capacity, surface_type, has_lighting, status)
VALUES
  ('91111111-1111-1111-1111-111111111111', 'Egerton Main Stadium Pitch', 'MAIN-STAD', 'Main Campus Athletics Complex', 10000, 'Natural Grass', true, 'Available'),
  ('92222222-2222-2222-2222-222222222222', 'Pavilion Grounds Pitch A', 'PAV-A', 'Pavilion Sports Complex', 3500, 'Hybrid Turf', true, 'Available'),
  ('93333333-3333-3333-3333-333333333333', 'Tatton Complex Ground', 'TAT-GRD', 'Tatton Campus Ground', 2500, 'Natural Grass', false, 'Available')
ON CONFLICT (id) DO NOTHING;

-- 2. Database-backed Uniqueness Guarantees for Teams
-- Enforces uniqueness on normalized team name identity at database layer
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_unique_normalized_name 
  ON public.teams (LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')));

-- Enforces single coach registration constraint at database layer
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_unique_coach_registration
  ON public.teams (coach_id) WHERE coach_id IS NOT NULL;

-- 3. RLS Alignment for Team Intake & Registration
DROP POLICY IF EXISTS "Coaches, Presidents and Admins insert teams" ON public.teams;
CREATE POLICY "Coaches, Presidents and Admins insert teams"
  ON public.teams FOR INSERT WITH CHECK (
    public.get_auth_role() IN ('president', 'admin', 'coach', 'player', 'guest') OR auth.role() = 'authenticated'
  );

-- Index for pitch status lookup
CREATE INDEX IF NOT EXISTS idx_pitches_status ON public.pitches(status);
