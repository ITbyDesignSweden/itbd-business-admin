export type SubscriptionPlan = "care" | "growth" | "scale"
export type OrganizationStatus = "pilot" | "active" | "churned"
export type ProjectStatus = "backlog" | "in_progress" | "completed" | "cancelled"

export interface Organization {
  id: string
  created_at: string
  name: string
  org_nr: string | null
  subscription_plan: SubscriptionPlan
  status: OrganizationStatus
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
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
}

export interface DashboardStats {
  total_mrr: number
  active_customers: number
  pending_pilots: number
  total_credits_output: number
}

