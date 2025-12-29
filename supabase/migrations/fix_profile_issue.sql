-- Fix: Ensure migration is applied and create profile if missing
-- Run this after checking diagnostics

-- OPTION 1: If migration has NOT been applied yet
-- Uncomment and run the migration first:
/*
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE public.profiles
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL;

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS full_name;

COMMENT ON COLUMN public.profiles.first_name IS 'User first name (given name)';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name (family name)';
*/

-- OPTION 2: If profile is missing (after migration is applied)
-- This will create a profile for any auth.users that don't have one
INSERT INTO public.profiles (id, email, first_name, last_name, role)
SELECT 
  u.id, 
  u.email,
  NULL, -- first_name will be set by user in Settings
  NULL, -- last_name will be set by user in Settings
  'admin'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify: Check that all auth users have profiles
SELECT 
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    WHEN p.first_name IS NULL THEN '⚠️ Name Not Set'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;
















