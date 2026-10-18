-- ==============================================================================
-- Migration 96: Seed Official Store Administrator (josephkamunyu5@gmail.com)
-- Sets role to 'admin', provides UID, and upserts into store_users and store_profiles
-- ==============================================================================

-- 1. Ensure store_users role check accepts 'admin'
DO $$
BEGIN
  ALTER TABLE public.store_users DROP CONSTRAINT IF EXISTS store_users_role_check;
  ALTER TABLE public.store_users ADD CONSTRAINT store_users_role_check 
    CHECK (role IN ('customer', 'store_admin', 'admin'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 2. Upsert Store Administrator into store_users
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
  'c7b94998-8c10-48e7-9d7a-115f5a898b53',
  'josephkamunyu5',
  'josephkamunyu5@gmail.com',
  '+254700000001',
  'Joseph Kamunyu',
  'Joseph5@_Kamunyu',
  'admin',
  true,
  'dark',
  'Egerton Gate B Sports Pavilion Locker Depot'
) ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  full_name = EXCLUDED.full_name,
  is_confirmed = true;

-- 3. Upsert Store Administrator into store_profiles
INSERT INTO public.store_profiles (
  id,
  username,
  full_name,
  email,
  phone_number,
  role,
  default_pickup_station
) VALUES (
  'c7b94998-8c10-48e7-9d7a-115f5a898b53',
  'josephkamunyu5',
  'Joseph Kamunyu',
  'josephkamunyu5@gmail.com',
  '+254700000001',
  'admin',
  'Egerton Gate B Sports Pavilion Locker Depot'
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = 'admin',
  full_name = EXCLUDED.full_name;
