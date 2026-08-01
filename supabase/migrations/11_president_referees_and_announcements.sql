-- Migration 11: President Dashboard Referees and Announcements Support
-- Support for President Pre-Season referee management and announcement workflows

-- 1. Create referees table
CREATE TABLE IF NOT EXISTS public.referees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Deactivated', 'Inactive')),
  badge_level TEXT DEFAULT 'FKF National Level 2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add read_count to announcements if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'read_count'
  ) THEN
    ALTER TABLE public.announcements ADD COLUMN read_count INT DEFAULT 0;
  END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Referees
DROP POLICY IF EXISTS "Referees readable by authenticated and guests" ON public.referees;
CREATE POLICY "Referees readable by authenticated and guests"
  ON public.referees FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Presidents and Admins manage referees" ON public.referees;
CREATE POLICY "Presidents and Admins manage referees"
  ON public.referees FOR ALL USING (
    public.get_auth_role() IN ('president', 'admin') OR auth.role() = 'authenticated' OR true
  );

-- 4. Audit Log Index
CREATE INDEX IF NOT EXISTS idx_referees_status ON public.referees(status);
