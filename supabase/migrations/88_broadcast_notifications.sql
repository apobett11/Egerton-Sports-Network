-- Migration 88: In-App Rich Broadcast Dropdown Notifications (Ultra-Low Memory, No Realtime, String Storage)
-- Messages and reactions are stored strictly as strings (TEXT) without Realtime publication overhead.

CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL, -- Stored strictly as string
  image_url TEXT, -- Rich notification image URL
  category TEXT DEFAULT 'ANNOUNCEMENT',
  action_url TEXT, -- Destination URL hash e.g. '#/banter'
  reactions TEXT DEFAULT '{"fire":0,"soccer":0,"trophy":0,"like":0,"clicks":0,"impressions":0}', -- Stored strictly as string
  scheduled_for TEXT, -- Stored strictly as string: ISO timestamp e.g. '2026-10-06T20:20:00+03:00'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure scheduled_for column exists if table was previously created
ALTER TABLE public.broadcast_notifications ADD COLUMN IF NOT EXISTS scheduled_for TEXT;

-- Index for fast ordered lookups by created_at (minimal CPU overhead)
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_created_at
  ON public.broadcast_notifications (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for public view and admin insertion
DROP POLICY IF EXISTS "Public can view broadcast notifications" ON public.broadcast_notifications;
CREATE POLICY "Public can view broadcast notifications" 
  ON public.broadcast_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert broadcasts" ON public.broadcast_notifications;
CREATE POLICY "Admins can insert broadcasts" 
  ON public.broadcast_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update broadcast reactions" ON public.broadcast_notifications;
CREATE POLICY "Public can update broadcast reactions" 
  ON public.broadcast_notifications FOR UPDATE USING (true) WITH CHECK (true);
