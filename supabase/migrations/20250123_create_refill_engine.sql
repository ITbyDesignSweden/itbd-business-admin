-- Migration: Create Subscription Refill Engine
-- This migration implements Feature N: The Refill Engine (Automation)
--
-- Purpose: Automatically refill credits for organizations with active subscriptions
-- Execution: Should be called daily via cron job (Edge Function)

-- ========================================
-- 1. Create Refill Execution Log Table
-- ========================================
-- Track each refill execution for audit and debugging
CREATE TABLE public.refill_executions (
  id uuid default gen_random_uuid() primary key,
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  organizations_processed integer not null default 0,
  credits_added integer not null default 0,
  execution_duration_ms integer,
  status text not null check (status in ('success', 'partial_failure', 'failure')),
  error_message text
);

-- Enable RLS (only service role should access this)
ALTER TABLE public.refill_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can read execution logs
CREATE POLICY "Authenticated users can read refill executions"
  ON refill_executions FOR SELECT
  TO authenticated
  USING (true);

-- Index for querying recent executions
CREATE INDEX refill_executions_executed_at_idx ON public.refill_executions(executed_at DESC);

COMMENT ON TABLE public.refill_executions IS 
  'Audit log for subscription refill cron job executions';

-- ========================================
-- 2. Create Refill Processing Function
-- ========================================
-- This function contains the core refill logic
-- Returns: JSON with execution summary
CREATE OR REPLACE FUNCTION public.process_subscription_refills()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org RECORD;
  v_plan RECORD;
  v_orgs_processed INTEGER := 0;
  v_credits_added INTEGER := 0;
  v_execution_id UUID;
  v_start_time TIMESTAMP;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  v_start_time := clock_timestamp();
  
  -- Create execution log entry
  INSERT INTO public.refill_executions (status, organizations_processed, credits_added)
  VALUES ('success', 0, 0)
  RETURNING id INTO v_execution_id;

  -- Find all organizations that need refill
  -- Criteria:
  -- 1. subscription_status = 'active'
  -- 2. next_refill_date <= TODAY
  -- 3. Has a valid plan_id
  FOR v_org IN
    SELECT 
      o.id,
      o.name,
      o.plan_id,
      o.subscription_start_date,
      o.next_refill_date
    FROM public.organizations o
    WHERE o.subscription_status = 'active'
      AND o.next_refill_date <= CURRENT_DATE
      AND o.plan_id IS NOT NULL
  LOOP
    BEGIN
      -- Get plan details
      SELECT monthly_credits, name
      INTO v_plan
      FROM public.subscription_plans
      WHERE id = v_org.plan_id;

      IF NOT FOUND THEN
        v_errors := array_append(v_errors, 
          format('Organization %s (%s): Plan not found', v_org.name, v_org.id));
        CONTINUE;
      END IF;

      -- Create credit transaction
      INSERT INTO public.credit_ledger (org_id, amount, description)
      VALUES (
        v_org.id,
        v_plan.monthly_credits,
        format('Månadspåfyllning: %s (%s krediter)', v_plan.name, v_plan.monthly_credits)
      );

      -- Update next_refill_date (add 1 month)
      UPDATE public.organizations
      SET next_refill_date = v_org.next_refill_date + INTERVAL '1 month'
      WHERE id = v_org.id;

      -- Update counters
      v_orgs_processed := v_orgs_processed + 1;
      v_credits_added := v_credits_added + v_plan.monthly_credits;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other organizations
      v_errors := array_append(v_errors, 
        format('Organization %s (%s): %s', v_org.name, v_org.id, SQLERRM));
    END;
  END LOOP;

  -- Update execution log
  UPDATE public.refill_executions
  SET 
    organizations_processed = v_orgs_processed,
    credits_added = v_credits_added,
    execution_duration_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    status = CASE 
      WHEN array_length(v_errors, 1) IS NULL THEN 'success'
      WHEN v_orgs_processed > 0 THEN 'partial_failure'
      ELSE 'failure'
    END,
    error_message = CASE 
      WHEN array_length(v_errors, 1) > 0 THEN array_to_string(v_errors, '; ')
      ELSE NULL
    END
  WHERE id = v_execution_id;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'execution_id', v_execution_id,
    'organizations_processed', v_orgs_processed,
    'credits_added', v_credits_added,
    'duration_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
    'errors', v_errors
  );

EXCEPTION WHEN OTHERS THEN
  -- Catastrophic failure
  UPDATE public.refill_executions
  SET 
    status = 'failure',
    error_message = SQLERRM,
    execution_duration_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER
  WHERE id = v_execution_id;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute to service_role (for Edge Function)
-- Note: This is more secure than granting to authenticated
GRANT EXECUTE ON FUNCTION public.process_subscription_refills() TO service_role;

COMMENT ON FUNCTION public.process_subscription_refills() IS 
  'Processes subscription refills for all organizations with active subscriptions and due refill dates. 
   Creates credit ledger entries and updates next_refill_date. 
   Returns execution summary with stats and any errors.
   Should be called daily via cron job (Edge Function).';

-- ========================================
-- 3. Helper Function: Get Next Refill Date
-- ========================================
-- Useful for UI to show when next refill will occur
CREATE OR REPLACE FUNCTION public.get_next_refill_execution()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
AS $$
  -- Returns midnight UTC of the next day (when cron should run)
  SELECT (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_refill_execution() TO authenticated;

COMMENT ON FUNCTION public.get_next_refill_execution() IS 
  'Returns the timestamp of the next scheduled refill execution (midnight UTC next day)';

-- ========================================
-- 4. View: Organizations Due for Refill
-- ========================================
-- Useful for admin to see which orgs will be refilled next
CREATE VIEW public.organizations_due_for_refill AS
SELECT 
  o.id,
  o.name,
  o.next_refill_date,
  sp.name AS plan_name,
  sp.monthly_credits
FROM public.organizations o
INNER JOIN public.subscription_plans sp ON o.plan_id = sp.id
WHERE o.subscription_status = 'active'
  AND o.next_refill_date <= CURRENT_DATE
ORDER BY o.next_refill_date ASC;

GRANT SELECT ON public.organizations_due_for_refill TO authenticated;

COMMENT ON VIEW public.organizations_due_for_refill IS 
  'Shows all organizations with active subscriptions that are due for credit refill today or earlier';

