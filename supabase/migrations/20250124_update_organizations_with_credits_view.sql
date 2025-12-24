-- Migration: Update organizations_with_credits VIEW
-- Purpose: Add new SaaS instance fields to the view
-- Date: 2025-01-24

-- Drop existing view
DROP VIEW IF EXISTS public.organizations_with_credits;

-- Recreate view with new fields
CREATE VIEW public.organizations_with_credits AS
SELECT 
  o.id,
  o.created_at,
  o.name,
  o.org_nr,
  o.plan_id,
  o.subscription_start_date,
  o.next_refill_date,
  o.subscription_status,
  o.status,
  o.production_url,
  o.github_repo_url,
  o.supabase_project_ref,
  COALESCE(SUM(cl.amount), 0) AS total_credits,
  sp.name AS plan_name,
  sp.price AS plan_price,
  sp.monthly_credits AS plan_monthly_credits
FROM 
  public.organizations o
LEFT JOIN 
  public.credit_ledger cl ON o.id = cl.org_id
LEFT JOIN
  public.subscription_plans sp ON o.plan_id = sp.id
GROUP BY 
  o.id, 
  o.created_at, 
  o.name, 
  o.org_nr, 
  o.plan_id,
  o.subscription_start_date,
  o.next_refill_date,
  o.subscription_status,
  o.status,
  o.production_url,
  o.github_repo_url,
  o.supabase_project_ref,
  sp.name,
  sp.price,
  sp.monthly_credits;

-- Grant access to authenticated users
GRANT SELECT ON public.organizations_with_credits TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.organizations_with_credits IS 
  'View combining organizations with their aggregated credit balance and plan details. 
   Includes SaaS instance management fields (production_url, github_repo_url, supabase_project_ref).
   Eliminates N+1 query problem when listing organizations.';

