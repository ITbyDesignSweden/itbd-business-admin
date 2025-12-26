export type OrganizationStatus = "pilot" | "active" | "churned"
export type ProjectStatus = "backlog" | "in_progress" | "completed" | "cancelled"
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "inactive"

export interface SubscriptionPlan {
  id: string
  created_at: string
  name: string
  monthly_credits: number
  price: number | null
  is_active: boolean
}

export interface Organization {
  id: string
  created_at: string
  name: string
  org_nr: string | null
  plan_id: string | null
  subscription_start_date: string | null
  next_refill_date: string | null
  subscription_status: SubscriptionStatus
  status: OrganizationStatus
  production_url: string | null
  github_repo_url: string | null
  supabase_project_ref: string | null
  business_profile: string | null
  custom_ai_instructions: string | null
}

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
}

export interface CreditLedger {
  id: string
  created_at: string
  org_id: string
  amount: number
  description: string
  project_id: string | null
}

export interface Project {
  id: string
  created_at: string
  org_id: string
  title: string
  status: ProjectStatus
  cost_credits: number
}

// View/Aggregate types for dashboard
export interface OrganizationWithCredits extends Organization {
  total_credits: number
  plan_name: string | null // Plan name from subscription_plans table via JOIN
  plan_price: number | null // Plan price from subscription_plans table via JOIN
  plan_monthly_credits: number | null // Monthly credits from subscription_plans table via JOIN
}

// Organization with plan details (joined data)
export interface OrganizationWithPlan extends OrganizationWithCredits {
  plan?: SubscriptionPlan | null
}

export interface DashboardStats {
  total_mrr: number
  active_customers: number
  pending_pilots: number
  total_credits_output: number
}

// Global Ledger types for admin view
export interface GlobalLedgerTransaction extends CreditLedger {
  organization_name: string
  project_title: string | null
}

