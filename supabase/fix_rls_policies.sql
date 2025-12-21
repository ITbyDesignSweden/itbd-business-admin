-- Fix RLS Policies for ITBD Admin Portal
-- Kör denna SQL om du får "Database error querying schema"

-- Drop old policies
DROP POLICY IF EXISTS "Admins can do everything" ON organizations;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON credit_ledger;
DROP POLICY IF EXISTS "Admins can do everything" ON projects;

-- Create new policies with correct function
CREATE POLICY "Authenticated users can do everything on organizations"
  ON organizations
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on profiles"
  ON profiles
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on credit_ledger"
  ON credit_ledger
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on projects"
  ON projects
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

