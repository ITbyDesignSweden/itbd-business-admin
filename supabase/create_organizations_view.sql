-- Create or replace VIEW: organizations_with_credits
-- This VIEW eliminates N+1 query problems by joining organizations with:
-- 1. Aggregated credit balance from credit_ledger
-- 2. Subscription plan details
--
-- Updated for Sprint 2: Now includes business_profile for AI context

DROP VIEW IF EXISTS organizations_with_credits;

CREATE VIEW organizations_with_credits AS
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
  o.business_profile, -- Added for AI Context Awareness
  COALESCE(SUM(cl.amount), 0) AS total_credits,
  sp.name AS plan_name,
  sp.price AS plan_price,
  sp.monthly_credits AS plan_monthly_credits
FROM organizations o
LEFT JOIN credit_ledger cl ON o.id = cl.org_id
LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
GROUP BY o.id, sp.id, sp.name, sp.price, sp.monthly_credits;

COMMENT ON VIEW organizations_with_credits IS 'Aggregated view of organizations with credit balance and plan details. Optimizes queries by avoiding N+1 problem.';




