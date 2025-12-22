-- Security Hardening Migration for ITBD Admin Portal
-- Feature E: RLS Audit & Data Integrity
-- Kör denna SQL i Supabase SQL Editor

-- ====================================
-- PART 1: RLS AUDIT - Admin-Only Access
-- ====================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated users can do everything on organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can do everything on credit_ledger" ON public.credit_ledger;
DROP POLICY IF EXISTS "Authenticated users can do everything on projects" ON public.projects;

-- Helper function to check if user is admin
-- This checks if the authenticated user has role='admin' in profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New Admin-Only Policies

CREATE POLICY "Admins can do everything on organizations"
  ON public.organizations
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can do everything on profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can do everything on credit_ledger"
  ON public.credit_ledger
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can do everything on projects"
  ON public.projects
  FOR ALL
  USING (public.is_admin());

-- ====================================
-- PART 2: DATA INTEGRITY
-- ====================================

-- Add unique constraint on organizations.org_nr
-- This prevents duplicate organization numbers
-- Allow NULL values (some orgs might not have org_nr yet)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_org_nr_unique 
  ON public.organizations (org_nr) 
  WHERE org_nr IS NOT NULL;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify unique index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'organizations'
  AND indexname = 'organizations_org_nr_unique';

-- Test admin function (should return TRUE for current user if they are admin)
SELECT public.is_admin() as am_i_admin;

