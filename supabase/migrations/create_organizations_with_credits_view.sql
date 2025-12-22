-- Migration: Create organizations_with_credits VIEW
-- Purpose: Eliminate N+1 queries when fetching organizations with their credit balance
-- Performance: Single query instead of 1 + N queries

-- Drop view if it exists (for re-running migration)
DROP VIEW IF EXISTS public.organizations_with_credits;

-- Create view that joins organizations with aggregated credits
CREATE VIEW public.organizations_with_credits AS
SELECT 
  o.id,
  o.created_at,
  o.name,
  o.org_nr,
  o.subscription_plan,
  o.status,
  COALESCE(SUM(cl.amount), 0) AS total_credits
FROM 
  public.organizations o
LEFT JOIN 
  public.credit_ledger cl ON o.id = cl.org_id
GROUP BY 
  o.id, o.created_at, o.name, o.org_nr, o.subscription_plan, o.status;

-- Grant access to authenticated users (same as base tables)
-- Note: RLS on base tables will still apply when querying through the view
GRANT SELECT ON public.organizations_with_credits TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.organizations_with_credits IS 
  'Materialized view combining organizations with their aggregated credit balance. 
   Eliminates N+1 query problem when listing organizations.';

