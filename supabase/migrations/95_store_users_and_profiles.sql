-- ==============================================================================
-- Migration 95: Dedicated Store Users & Store Profiles System (JoseCommerce)
-- Completely isolated from Livescore 'profiles' table and sports roles.
-- Ensures zero crossover between Livescore and Store user ecosystems.
-- ==============================================================================

-- 1. Create store_users table
CREATE TABLE IF NOT EXISTS public.store_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  full_name TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'store_admin')),
  is_confirmed BOOLEAN NOT NULL DEFAULT true,
  theme_preference TEXT NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
  pickup_station TEXT,
  delivery_address TEXT,
  daily_usage_count INTEGER NOT NULL DEFAULT 1,
  daily_usage_date TEXT,
  remember_login BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_store_users_email ON public.store_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_store_users_username ON public.store_users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_store_users_role ON public.store_users (role);

-- 2. Create store_profiles table
CREATE TABLE IF NOT EXISTS public.store_profiles (
  id TEXT PRIMARY KEY REFERENCES public.store_users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  default_pickup_station TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_profiles_username ON public.store_profiles (username);

-- 3. Enable RLS
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_profiles ENABLE ROW LEVEL SECURITY;

-- Read policies: Store users can read store profiles
CREATE POLICY "Allow public read access to store_users" 
  ON public.store_users FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to store_users" 
  ON public.store_users FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update to store_users" 
  ON public.store_users FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read access to store_profiles" 
  ON public.store_profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert to store_profiles" 
  ON public.store_profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update to store_profiles" 
  ON public.store_profiles FOR UPDATE 
  USING (true);

-- 4. Seed Official Store Administrator
INSERT INTO public.store_users (
  id,
  username,
  email,
  phone_number,
  full_name,
  password_hash,
  role,
  is_confirmed,
  theme_preference,
  pickup_station
) VALUES (
  'store_admin_root',
  'store_admin',
  'admin@store.egerscore.co.ke',
  '+254700000001',
  'Store Operations Administrator',
  'StoreAdmin2026!',
  'store_admin',
  true,
  'dark',
  'Egerton Gate B Sports Pavilion Locker Depot'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO public.store_profiles (
  id,
  username,
  full_name,
  email,
  phone_number,
  role,
  default_pickup_station
) VALUES (
  'store_admin_root',
  'store_admin',
  'Store Operations Administrator',
  'admin@store.egerscore.co.ke',
  '+254700000001',
  'store_admin',
  'Egerton Gate B Sports Pavilion Locker Depot'
) ON CONFLICT (id) DO NOTHING;
