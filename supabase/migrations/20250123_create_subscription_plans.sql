-- Migration: Create Subscription Plans Table and Update Organizations
-- This migration implements the Subscription Engine (Feature L & M)
-- 
-- Changes:
-- 1. Create subscription_plans table (Feature L: Plan Management)
-- 2. Remove old subscription_plan enum column from organizations
-- 3. Add new subscription columns to organizations (Feature M: Customer Subscriptions)

-- ========================================
-- 1. Create Subscription Plans Table
-- ========================================
create table public.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique,
  monthly_credits integer not null check (monthly_credits >= 0),
  price integer, -- Price in SEK (optional for now)
  is_active boolean default true not null
);

-- Enable RLS
alter table public.subscription_plans enable row level security;

-- Policy: Authenticated users can read all plans
create policy "Authenticated users can read subscription plans"
  on subscription_plans for select 
  to authenticated
  using (true);

-- Policy: Authenticated users can insert plans
create policy "Authenticated users can insert subscription plans"
  on subscription_plans for insert 
  to authenticated
  with check (true);

-- Policy: Authenticated users can update plans
create policy "Authenticated users can update subscription plans"
  on subscription_plans for update 
  to authenticated
  using (true)
  with check (true);

-- Policy: Authenticated users can delete plans
create policy "Authenticated users can delete subscription plans"
  on subscription_plans for delete 
  to authenticated
  using (true);

-- ========================================
-- 2. Update Organizations Table
-- ========================================

-- Drop the organizations_with_credits VIEW first (it depends on subscription_plan column)
DROP VIEW IF EXISTS public.organizations_with_credits;

-- Drop the old subscription_plan column
alter table public.organizations 
  drop column if exists subscription_plan;

-- Add new subscription-related columns
alter table public.organizations
  add column plan_id uuid references public.subscription_plans(id) on delete set null,
  add column subscription_start_date timestamp with time zone,
  add column next_refill_date timestamp with time zone,
  add column subscription_status text default 'inactive' check (
    subscription_status in ('active', 'paused', 'cancelled', 'inactive')
  );

-- Recreate the organizations_with_credits VIEW with new schema
-- Now includes plan name and price via JOIN for better performance (no N+1 queries)
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
  o.next_refill_date, o.subscription_status, o.status, sp.name, sp.price, sp.monthly_credits;

-- Grant access to authenticated users
GRANT SELECT ON public.organizations_with_credits TO authenticated;

-- Add index for faster queries on subscription status
create index organizations_subscription_status_idx on public.organizations(subscription_status);
create index organizations_next_refill_date_idx on public.organizations(next_refill_date);

-- ========================================
-- 3. Seed Default Plans
-- ========================================
insert into public.subscription_plans (name, monthly_credits, price, is_active)
values 
  ('Care', 25, 5000, true),
  ('Growth', 50, 15000, true),
  ('Scale', 100, 35000, true)
on conflict (name) do nothing;

-- ========================================
-- 4. Create RPC Function for Credits Output
-- ========================================
-- This function calculates total credits output (usage) in the database
-- instead of fetching all rows to JavaScript for aggregation
CREATE OR REPLACE FUNCTION public.get_total_credits_output()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)::integer
  FROM public.credit_ledger
  WHERE amount < 0;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_total_credits_output() TO authenticated;

COMMENT ON FUNCTION public.get_total_credits_output() IS 
  'Returns the sum of all negative credit transactions (total credits used/output). 
   Aggregation is done in the database for optimal performance.';

-- ========================================
-- 5. Comment Documentation
-- ========================================
comment on table public.subscription_plans is 'Product catalog for subscription plans';
comment on column public.subscription_plans.monthly_credits is 'Number of credits added monthly to organizations with this plan';
comment on column public.subscription_plans.price is 'Monthly price in SEK';

comment on column public.organizations.plan_id is 'Foreign key to subscription_plans';
comment on column public.organizations.subscription_start_date is 'When the subscription was activated';
comment on column public.organizations.next_refill_date is 'When the next credit refill should occur';
comment on column public.organizations.subscription_status is 'Current subscription state: active, paused, cancelled, inactive';

comment on view public.organizations_with_credits is 'View combining organizations with their aggregated credit balance and subscription details. Eliminates N+1 query problem.';

