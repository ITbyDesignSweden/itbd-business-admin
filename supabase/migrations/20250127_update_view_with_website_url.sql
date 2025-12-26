-- Migration: Update organizations_with_credits view to include website_url
-- Description: Adds website_url to the view for complete organization data
-- Date: 2025-01-27

-- Drop existing view
DROP VIEW IF EXISTS public.organizations_with_credits;

-- Recreate the organizations_with_credits VIEW with website_url
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
  o.website_url,
  o.github_repo_url,
  o.supabase_project_ref,
  o.business_profile,
  o.custom_ai_instructions,
  sp.name AS plan_name,
  sp.price AS plan_price,
  sp.monthly_credits AS plan_monthly_credits,
  COALESCE(SUM(cl.amount), 0) AS total_credits
FROM 
  public.organizations o
LEFT JOIN 
  public.credit_ledger cl ON o.id = cl.org_id
LEFT JOIN
  public.subscription_plans sp ON o.plan_id = sp.id
GROUP BY 
  o.id, o.created_at, o.name, o.org_nr, o.plan_id, o.subscription_start_date, 
  o.next_refill_date, o.subscription_status, o.status, o.production_url, o.website_url,
  o.github_repo_url, o.supabase_project_ref, o.business_profile, o.custom_ai_instructions,
  sp.name, sp.price, sp.monthly_credits;

-- Grant access to authenticated users
GRANT SELECT ON public.organizations_with_credits TO authenticated;

