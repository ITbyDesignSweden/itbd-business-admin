"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Organization, DashboardStats, OrganizationWithCredits, CreditLedger, Project, GlobalLedgerTransaction, SubscriptionPlan } from "@/lib/types/database"

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get all active/pilot organizations with their plan information (via VIEW)
  // VIEW already includes plan_price via JOIN - no N+1 queries!
  const { data: organizations, error } = await supabase
    .from("organizations_with_credits")
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

  // Calculate MRR from paying customers only (status = "active", NOT pilots)
  // MRR (Monthly Recurring Revenue) counts organizations that have:
  // 1. status = "active" (paying customers, NOT pilots)
  // 2. subscription_status = "active" (not paused/cancelled/inactive)
  // 3. A plan with a price
  const total_mrr = activeOrgs.reduce((sum, org) => {
    if (org.subscription_status !== "active" || !org.plan_price) return sum
    return sum + org.plan_price
  }, 0)

  // Get total credits output (negative transactions = usage)
  // Push aggregation to database instead of JavaScript for performance
  const { data: creditSum } = await supabase
    .rpc("get_total_credits_output")

  const total_credits_output = Math.abs(creditSum || 0)

  return {
    total_mrr,
    active_customers: activeOrgs.length,
    pending_pilots: pilotOrgs.length,
    total_credits_output,
  }
}

export async function getOrganizationsWithCredits(): Promise<OrganizationWithCredits[]> {
  const supabase = await createClient()

  // Get recent organizations with their credit balance (for Dashboard)
  // Uses PostgreSQL VIEW for optimal performance (single query instead of N+1)
  const { data: organizations, error } = await supabase
    .from("organizations_with_credits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  return organizations || []
}

export async function getAllOrganizationsWithCredits(): Promise<OrganizationWithCredits[]> {
  const supabase = await createClient()

  // Get all organizations with their credit balance (for Organizations index page)
  // Uses PostgreSQL VIEW for optimal performance (single query instead of N+1)
  const { data: organizations, error } = await supabase
    .from("organizations_with_credits")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching organizations:", error)
    return []
  }

  return organizations || []
}

export async function getOrganizationById(id: string): Promise<OrganizationWithCredits | null> {
  const supabase = await createClient()

  // Get organization by ID with credit balance
  // Uses PostgreSQL VIEW for optimal performance (single query)
  const { data: organization, error } = await supabase
    .from("organizations_with_credits")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching organization:", error)
    return null
  }

  return organization || null
}

export async function getOrganizationWithPlan(id: string): Promise<{ organization: OrganizationWithCredits; plan: SubscriptionPlan | null } | null> {
  const supabase = await createClient()

  // Get organization by ID with credit balance
  // VIEW already includes plan data via JOIN - no second query needed!
  const { data: organization, error: orgError } = await supabase
    .from("organizations_with_credits")
    .select("*")
    .eq("id", id)
    .single()

  if (orgError || !organization) {
    console.error("Error fetching organization:", orgError)
    return null
  }

  // Construct plan object from VIEW data (already included via JOIN)
  let plan: SubscriptionPlan | null = null
  if (organization.plan_id && organization.plan_name) {
    plan = {
      id: organization.plan_id,
      name: organization.plan_name,
      monthly_credits: organization.plan_monthly_credits || 0,
      price: organization.plan_price,
      is_active: true, // We assume it's active since it's being used
      created_at: "", // Not needed for display purposes
    }
  }

  return { organization, plan }
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

export async function getProjectsByOrgId(orgId: string): Promise<Project[]> {
  const supabase = await createClient()

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  if (!projects || projects.length === 0) return []

  // Fetch all transactions for all projects in a single query (avoid N+1)
  const projectIds = projects.map(p => p.id)
  const { data: transactions } = await supabase
    .from("credit_ledger")
    .select("project_id, amount")
    .in("project_id", projectIds)

  // Group transactions by project_id
  const costByProject: Record<string, number> = {}
  if (transactions) {
    transactions.forEach(tx => {
      if (!costByProject[tx.project_id]) {
        costByProject[tx.project_id] = 0
      }
      costByProject[tx.project_id] += tx.amount
    })
  }

  // Apply costs to projects
  return projects.map(project => {
    const sum = costByProject[project.id] || 0
    const totalCost = sum < 0 ? Math.abs(sum) : 0

    return {
      ...project,
      cost_credits: totalCost,
    }
  })
}

// Validation schema for adding transaction
const addTransactionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  amount: z.number().int("Antal krediter måste vara ett heltal"),
  description: z.string().min(1, "Beskrivning krävs").max(255, "Beskrivningen är för lång"),
  projectId: z.string().uuid("Ogiltigt projekt-ID").optional().nullable(),
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
        project_id: validatedData.projectId || null,
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
        status: validatedData.status,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating organization:", error)
      
      // Check if it's a unique constraint violation on org_nr
      if (error.code === '23505' && error.message.includes('organizations_org_nr_unique')) {
        return {
          success: false,
          error: `Organisationsnummer "${validatedData.org_nr}" finns redan registrerat. Vänligen använd ett annat organisationsnummer.`,
        }
      }
      
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
  status: z.enum(["pilot", "active", "churned"]),
  business_profile: z.string().optional(),
  custom_ai_instructions: z.string().optional(),
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
        status: validatedData.status,
        business_profile: validatedData.business_profile || null,
        custom_ai_instructions: validatedData.custom_ai_instructions || null,
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

// Validation schema for creating project
const createProjectSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  title: z.string().min(1, "Projekttitel krävs").max(255, "Titeln är för lång"),
  status: z.enum(["backlog", "in_progress", "completed", "cancelled"]),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export async function createProject(
  input: CreateProjectInput
): Promise<{ success: boolean; error?: string; data?: Project }> {
  try {
    // Validate input
    const validatedData = createProjectSchema.parse(input)

    const supabase = await createClient()

    // Insert project
    const { data, error } = await supabase
      .from("projects")
      .insert({
        org_id: validatedData.orgId,
        title: validatedData.title,
        status: validatedData.status,
        cost_credits: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating project:", error)
      return {
        success: false,
        error: "Kunde inte skapa projekt. Försök igen.",
      }
    }

    // Revalidate organization page to show new project
    revalidatePath(`/organizations/${validatedData.orgId}`)

    return {
      success: true,
      data: data as Project,
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

// Validation schema for updating project
const updateProjectSchema = z.object({
  id: z.string().uuid("Ogiltigt projekt-ID"),
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  title: z.string().min(1, "Projekttitel krävs").max(255, "Titeln är för lång"),
  status: z.enum(["backlog", "in_progress", "completed", "cancelled"]),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export async function updateProject(
  input: UpdateProjectInput
): Promise<{ success: boolean; error?: string; data?: Project }> {
  try {
    // Validate input
    const validatedData = updateProjectSchema.parse(input)

    const supabase = await createClient()

    // Update project
    const { data, error } = await supabase
      .from("projects")
      .update({
        title: validatedData.title,
        status: validatedData.status,
      })
      .eq("id", validatedData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating project:", error)
      return {
        success: false,
        error: "Kunde inte uppdatera projekt. Försök igen.",
      }
    }

    // Revalidate organization page to show updated project
    revalidatePath(`/organizations/${validatedData.orgId}`)

    return {
      success: true,
      data: data as Project,
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

// Validation schema for deleting project
const deleteProjectSchema = z.object({
  id: z.string().uuid("Ogiltigt projekt-ID"),
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
})

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>

export async function deleteProject(
  input: DeleteProjectInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = deleteProjectSchema.parse(input)

    const supabase = await createClient()

    // Check if project has any transactions in credit_ledger
    const { data: transactions, error: transactionError } = await supabase
      .from("credit_ledger")
      .select("id")
      .eq("project_id", validatedData.id)
      .limit(1)

    if (transactionError) {
      console.error("Error checking transactions:", transactionError)
      return {
        success: false,
        error: "Kunde inte kontrollera projektets transaktioner. Försök igen.",
      }
    }

    // If transactions exist, prevent deletion
    if (transactions && transactions.length > 0) {
      return {
        success: false,
        error: "Kan ej radera projekt med ekonomisk historik. Sätt status till Cancelled istället.",
      }
    }

    // No transactions found, safe to delete
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", validatedData.id)

    if (deleteError) {
      console.error("Error deleting project:", deleteError)
      return {
        success: false,
        error: "Kunde inte radera projekt. Försök igen.",
      }
    }

    // Revalidate organization page to show project removed
    revalidatePath(`/organizations/${validatedData.orgId}`)

    return {
      success: true,
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

export async function getAllTransactions(): Promise<GlobalLedgerTransaction[]> {
  const supabase = await createClient()

  // Fetch all transactions with organization and project information
  // Using Supabase join for optimal performance (single query)
  // Now works thanks to foreign key constraint between credit_ledger.project_id and projects.id
  const { data: transactions, error } = await supabase
    .from("credit_ledger")
    .select(`
      *,
      organizations!inner(name),
      projects(title)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all transactions:", error)
    return []
  }

  // Transform the joined data to match GlobalLedgerTransaction type
  const globalTransactions: GlobalLedgerTransaction[] = (transactions || []).map((tx: any) => ({
    id: tx.id,
    created_at: tx.created_at,
    org_id: tx.org_id,
    amount: tx.amount,
    description: tx.description,
    project_id: tx.project_id,
    organization_name: tx.organizations?.name || "Okänd organisation",
    project_title: tx.projects?.title || null,
  }))

  return globalTransactions
}

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

// Start a subscription for an organization
const startSubscriptionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  planId: z.string().uuid("Ogiltigt plan-ID"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Ogiltigt datum"),
})

export type StartSubscriptionInput = z.infer<typeof startSubscriptionSchema>

export async function startSubscription(
  input: StartSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = startSubscriptionSchema.parse(input)

    const supabase = await createClient()

    // Verify that plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", validatedData.planId)
      .single()

    if (planError || !plan) {
      return {
        success: false,
        error: "Kunde inte hitta vald plan.",
      }
    }

    if (!plan.is_active) {
      return {
        success: false,
        error: "Vald plan är inte aktiv.",
      }
    }

    // Calculate next refill date (1 month from start date)
    const startDate = new Date(validatedData.startDate)
    const nextRefillDate = new Date(startDate)
    nextRefillDate.setMonth(nextRefillDate.getMonth() + 1)

    // Update organization with subscription details
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        plan_id: validatedData.planId,
        subscription_start_date: startDate.toISOString(),
        next_refill_date: nextRefillDate.toISOString(),
        subscription_status: "active",
      })
      .eq("id", validatedData.orgId)

    if (updateError) {
      console.error("Error starting subscription:", updateError)
      return {
        success: false,
        error: "Kunde inte starta prenumeration. Försök igen.",
      }
    }

    // Revalidate organization page
    revalidatePath(`/organizations/${validatedData.orgId}`)
    revalidatePath("/")

    return {
      success: true,
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

// Cancel a subscription for an organization
const cancelSubscriptionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
})

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>

export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = cancelSubscriptionSchema.parse(input)

    const supabase = await createClient()

    // Update organization to cancel subscription
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        subscription_status: "cancelled",
        next_refill_date: null, // Stop future refills
      })
      .eq("id", validatedData.orgId)

    if (updateError) {
      console.error("Error cancelling subscription:", updateError)
      return {
        success: false,
        error: "Kunde inte avsluta prenumeration. Försök igen.",
      }
    }

    // Revalidate organization page
    revalidatePath(`/organizations/${validatedData.orgId}`)
    revalidatePath("/")

    return {
      success: true,
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

// Pause a subscription
const pauseSubscriptionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
})

export type PauseSubscriptionInput = z.infer<typeof pauseSubscriptionSchema>

export async function pauseSubscription(
  input: PauseSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = pauseSubscriptionSchema.parse(input)

    const supabase = await createClient()

    // Update organization to pause subscription
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        subscription_status: "paused",
      })
      .eq("id", validatedData.orgId)

    if (updateError) {
      console.error("Error pausing subscription:", updateError)
      return {
        success: false,
        error: "Kunde inte pausa prenumeration. Försök igen.",
      }
    }

    // Revalidate organization page
    revalidatePath(`/organizations/${validatedData.orgId}`)
    revalidatePath("/")

    return {
      success: true,
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

// Resume a paused subscription
const resumeSubscriptionSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
})

export type ResumeSubscriptionInput = z.infer<typeof resumeSubscriptionSchema>

export async function resumeSubscription(
  input: ResumeSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = resumeSubscriptionSchema.parse(input)

    const supabase = await createClient()

    // Update organization to resume subscription
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        subscription_status: "active",
      })
      .eq("id", validatedData.orgId)

    if (updateError) {
      console.error("Error resuming subscription:", updateError)
      return {
        success: false,
        error: "Kunde inte återuppta prenumeration. Försök igen.",
      }
    }

    // Revalidate organization page
    revalidatePath(`/organizations/${validatedData.orgId}`)
    revalidatePath("/")

    return {
      success: true,
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

// Change subscription plan
const changeSubscriptionPlanSchema = z.object({
  orgId: z.string().uuid("Ogiltigt organisations-ID"),
  planId: z.string().uuid("Ogiltigt plan-ID"),
})

export type ChangeSubscriptionPlanInput = z.infer<typeof changeSubscriptionPlanSchema>

export async function changeSubscriptionPlan(
  input: ChangeSubscriptionPlanInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = changeSubscriptionPlanSchema.parse(input)

    const supabase = await createClient()

    // Verify that plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", validatedData.planId)
      .single()

    if (planError || !plan) {
      return {
        success: false,
        error: "Kunde inte hitta vald plan.",
      }
    }

    if (!plan.is_active) {
      return {
        success: false,
        error: "Vald plan är inte aktiv.",
      }
    }

    // Update organization with new plan
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        plan_id: validatedData.planId,
      })
      .eq("id", validatedData.orgId)

    if (updateError) {
      console.error("Error changing plan:", updateError)
      return {
        success: false,
        error: "Kunde inte byta plan. Försök igen.",
      }
    }

    // Revalidate organization page
    revalidatePath(`/organizations/${validatedData.orgId}`)
    revalidatePath("/")

    return {
      success: true,
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

// ========================================
// REFILL ENGINE (MANUAL TRIGGER)
// ========================================

// Manual trigger for subscription refills (for testing/admin purposes)
export async function triggerSubscriptionRefills(): Promise<{
  success: boolean
  error?: string
  data?: {
    organizations_processed: number
    credits_added: number
    duration_ms: number
    errors?: string[]
  }
}> {
  try {
    const supabase = await createClient()

    // Call the database function that handles refill logic
    const { data, error } = await supabase.rpc("process_subscription_refills")

    if (error) {
      console.error("Error processing refills:", error)
      return {
        success: false,
        error: "Kunde inte köra påfyllning. Försök igen.",
      }
    }

    // Revalidate dashboard and organizations
    revalidatePath("/")
    revalidatePath("/organizations")

    return {
      success: data.success,
      data: {
        organizations_processed: data.organizations_processed,
        credits_added: data.credits_added,
        duration_ms: data.duration_ms,
        errors: data.errors,
      },
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return {
      success: false,
      error: "Ett oväntat fel uppstod. Försök igen.",
    }
  }
}

// Get organizations that are due for refill (for admin visibility)
export async function getOrganizationsDueForRefill(): Promise<
  Array<{
    id: string
    name: string
    next_refill_date: string
    plan_name: string
    monthly_credits: number
  }>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations_due_for_refill")
    .select("*")

  if (error) {
    console.error("Error fetching organizations due for refill:", error)
    return []
  }

  return data || []
}

// Get recent refill execution logs
export async function getRecentRefillExecutions(limit: number = 10): Promise<
  Array<{
    id: string
    executed_at: string
    organizations_processed: number
    credits_added: number
    execution_duration_ms: number | null
    status: string
    error_message: string | null
  }>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("refill_executions")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching refill executions:", error)
    return []
  }

  return data || []
}
