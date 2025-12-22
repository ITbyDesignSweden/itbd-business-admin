"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Organization, DashboardStats, OrganizationWithCredits, CreditLedger, Project, GlobalLedgerTransaction } from "@/lib/types/database"

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
    // Only count organizations that have a subscription plan
    if (!org.subscription_plan) return sum
    return sum + (PLAN_PRICING[org.subscription_plan as keyof typeof PLAN_PRICING] || 0)
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

  // Calculate actual cost for each project based on credit_ledger transactions
  const projectsWithCost = await Promise.all(
    (projects || []).map(async (project) => {
      const { data: transactions } = await supabase
        .from("credit_ledger")
        .select("amount")
        .eq("project_id", project.id)

      // Sum all credits (positive and negative) linked to this project
      // Negative sum = cost, positive sum = credit (show as 0 cost)
      const sum = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
      const totalCost = sum < 0 ? Math.abs(sum) : 0

      return {
        ...project,
        cost_credits: totalCost,
      }
    })
  )

  return projectsWithCost
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
  subscription_plan: z.enum(["care", "growth", "scale"]).nullable(),
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
  subscription_plan: z.enum(["care", "growth", "scale"]).nullable(),
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
