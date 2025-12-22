"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Organization, DashboardStats, OrganizationWithCredits, CreditLedger } from "@/lib/types/database"

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

export async function getOrganizationById(id: string): Promise<OrganizationWithCredits | null> {
  const supabase = await createClient()

  // Get organization by ID
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching organization:", error)
    return null
  }

  if (!organization) {
    return null
  }

  // Get credit balance for this organization
  const { data: credits } = await supabase
    .from("credit_ledger")
    .select("amount")
    .eq("org_id", organization.id)

  const total_credits = credits?.reduce((sum, entry) => sum + entry.amount, 0) || 0

  return {
    ...organization,
    total_credits,
  }
}

export async function getCreditLedgerByOrgId(orgId: string): Promise<CreditLedger[]> {
  const supabase = await createClient()

  const { data: transactions, error } = await supabase
    .from("credit_ledger")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching credit ledger:", error)
    return []
  }

  return transactions || []
}

// Validation schema for adding transaction
const addTransactionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  amount: z.number().int("Antal krediter måste vara ett heltal"),
  description: z.string().min(1, "Beskrivning krävs").max(255, "Beskrivningen är för lång"),
})

export type AddTransactionInput = z.infer<typeof addTransactionSchema>

export async function addTransaction(
  input: AddTransactionInput
): Promise<{ success: boolean; error?: string; data?: CreditLedger }> {
  try {
    // Validate input
    const validatedData = addTransactionSchema.parse(input)

    const supabase = await createClient()

    // Check current balance to ensure it won't go negative
    const { data: credits } = await supabase
      .from("credit_ledger")
      .select("amount")
      .eq("org_id", validatedData.orgId)

    const currentBalance = credits?.reduce((sum, entry) => sum + entry.amount, 0) || 0
    const newBalance = currentBalance + validatedData.amount

    if (newBalance < 0) {
      return {
        success: false,
        error: `Otillräckligt saldo. Nuvarande saldo: ${currentBalance} krediter. Transaktionen skulle resultera i: ${newBalance} krediter.`,
      }
    }

    // Insert transaction
    const { data, error } = await supabase
      .from("credit_ledger")
      .insert({
        org_id: validatedData.orgId,
        amount: validatedData.amount,
        description: validatedData.description,
        project_id: null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding transaction:", error)
      return {
        success: false,
        error: "Kunde inte lägga till transaktion. Försök igen.",
      }
    }

    // Revalidate organization page to show new transaction
    revalidatePath(`/organizations/${validatedData.orgId}`)

    return {
      success: true,
      data: data as CreditLedger,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

// Validation schema for creating organization
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organisationsnamn krävs").max(255),
  org_nr: z.string().optional(),
  subscription_plan: z.enum(["care", "growth", "scale"]),
  status: z.enum(["pilot", "active", "churned"]),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<{ success: boolean; error?: string; data?: Organization }> {
  try {
    // Validate input
    const validatedData = createOrganizationSchema.parse(input)

    const supabase = await createClient()

    // Insert organization
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: validatedData.name,
        org_nr: validatedData.org_nr || null,
        subscription_plan: validatedData.subscription_plan,
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating organization:", error)
      return {
        success: false,
        error: "Kunde inte skapa organisation. Försök igen.",
      }
    }

    // Revalidate dashboard to show new organization
    revalidatePath("/")

    return {
      success: true,
      data: data as Organization,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

// Validation schema for updating organization
const updateOrganizationSchema = z.object({
  id: z.string().uuid("Ogiltigt organisations-ID"),
  name: z.string().min(1, "Organisationsnamn krävs").max(255),
  org_nr: z.string().optional(),
  subscription_plan: z.enum(["care", "growth", "scale"]),
  status: z.enum(["pilot", "active", "churned"]),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

export async function updateOrganization(
  input: UpdateOrganizationInput
): Promise<{ success: boolean; error?: string; data?: Organization }> {
  try {
    // Validate input
    const validatedData = updateOrganizationSchema.parse(input)

    const supabase = await createClient()

    // Update organization
    const { data, error } = await supabase
      .from("organizations")
      .update({
        name: validatedData.name,
        org_nr: validatedData.org_nr || null,
        subscription_plan: validatedData.subscription_plan,
        status: validatedData.status,
      })
      .eq("id", validatedData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating organization:", error)
      return {
        success: false,
        error: "Kunde inte uppdatera organisation. Försök igen.",
      }
    }

    // Revalidate both organization detail page and dashboard
    revalidatePath(`/organizations/${validatedData.id}`)
    revalidatePath("/")

    return {
      success: true,
      data: data as Organization,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

