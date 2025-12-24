-- Diagnostics: Check profile table structure and data
-- Run this to understand the current state

-- 1. Check if migration has been applied (check column names)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if you have a profile record
SELECT 
  p.id,
  p.email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN 'OLD SCHEMA (full_name exists)'
    ELSE 'NEW SCHEMA (first_name/last_name)'
  END as schema_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@itbydesign.se'  -- Replace with your email
LIMIT 1;

-- 3. Check all profiles
SELECT * FROM public.profiles;



