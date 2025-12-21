"use server"

import { createClient } from "@/lib/supabase/server"
import type { Organization, DashboardStats, OrganizationWithCredits } from "@/lib/types/database"

// Plan pricing in SEK
const PLAN_PRICING = {
  care: 5000,
  growth: 15000,
  scale: 35000,
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get all active/pilot organizations
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .in("status", ["active", "pilot"])

  if (error) {
    console.error("Error fetching organizations:", error)
    return {
      total_mrr: 0,
      active_customers: 0,
      pending_pilots: 0,
      total_credits_output: 0,
    }
  }

  // Calculate stats
  const activeOrgs = organizations?.filter((org) => org.status === "active") || []
  const pilotOrgs = organizations?.filter((org) => org.status === "pilot") || []

  const total_mrr = activeOrgs.reduce((sum, org) => {
    return sum + PLAN_PRICING[org.subscription_plan as keyof typeof PLAN_PRICING]
  }, 0)

  // Get total credits output (negative transactions = usage)
  const { data: creditData } = await supabase
    .from("credit_ledger")
    .select("amount")
    .lt("amount", 0)

  const total_credits_output = Math.abs(
    creditData?.reduce((sum, entry) => sum + entry.amount, 0) || 0
  )

  return {
    total_mrr,
    active_customers: activeOrgs.length,
    pending_pilots: pilotOrgs.length,
    total_credits_output,
  }
}

export async function getOrganizationsWithCredits(): Promise<OrganizationWithCredits[]> {
  const supabase = await createClient()

  // Get organizations with their credit balance
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  // For each organization, get their credit balance
  const orgsWithCredits = await Promise.all(
    (organizations || []).map(async (org) => {
      const { data: credits } = await supabase
        .from("credit_ledger")
        .select("amount")
        .eq("org_id", org.id)

      const total_credits = credits?.reduce((sum, entry) => sum + entry.amount, 0) || 0

      return {
        ...org,
        total_credits,
      }
    })
  )

  return orgsWithCredits
}

