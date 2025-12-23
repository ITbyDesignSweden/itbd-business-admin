-- Migration: Replace full_name with first_name and last_name
-- Author: AI Agent
-- Date: 2025-01-23
-- Purpose: Split full_name into first_name and last_name for better granularity

-- Step 1: Add new columns
ALTER TABLE public.profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Step 2: Migrate existing data (if any full_name exists)
-- This tries to split "John Doe" into first_name="John", last_name="Doe"
-- If no space exists, put everything in first_name
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

-- Step 3: Drop old column
ALTER TABLE public.profiles
DROP COLUMN full_name;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.profiles.first_name IS 'User first name (given name)';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name (family name)';

