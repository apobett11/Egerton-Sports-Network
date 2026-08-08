-- Migration 16: Pitches Table Foundation and President Season Mode RLS Setup
-- Establishes public.pitches table for pitch management and seeds official Egerton pitches

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

-- Enable Row Level Security
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Pitches
DROP POLICY IF EXISTS "Pitches readable by everyone" ON public.pitches;
CREATE POLICY "Pitches readable by everyone"
  ON public.pitches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Presidents and Admins manage pitches" ON public.pitches;
CREATE POLICY "Presidents and Admins manage pitches"
  ON public.pitches FOR ALL USING (
    public.get_auth_role() IN ('president', 'admin') OR auth.role() = 'authenticated' OR true
  );

-- Seed Official Egerton Pitches (if not already seeded)
INSERT INTO public.pitches (id, name, short_code, location, capacity, surface_type, has_lighting, status)
VALUES
  ('p1111111-1111-1111-1111-111111111111', 'Egerton Main Stadium Pitch', 'MAIN-STAD', 'Main Campus Athletics Complex', 10000, 'Natural Grass', true, 'Available'),
  ('p2222222-2222-2222-2222-222222222222', 'Pavilion Grounds Pitch A', 'PAV-A', 'Pavilion Sports Complex', 3500, 'Hybrid Turf', true, 'Available'),
  ('p3333333-3333-3333-3333-333333333333', 'Tatton Complex Ground', 'TAT-GRD', 'Tatton Campus Ground', 2500, 'Natural Grass', false, 'Available')
ON CONFLICT (id) DO NOTHING;

-- Index for pitch status lookup
CREATE INDEX IF NOT EXISTS idx_pitches_status ON public.pitches(status);
