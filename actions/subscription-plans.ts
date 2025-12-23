"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { SubscriptionPlan } from "@/lib/types/database"

// ========================================
// READ Operations
// ========================================

export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("monthly_credits", { ascending: true })

  if (error) {
    console.error("Error fetching plans:", error)
    return []
  }

  return plans || []
}

export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("monthly_credits", { ascending: true })

  if (error) {
    console.error("Error fetching active plans:", error)
    return []
  }

  return plans || []
}

export async function getPlanById(id: string): Promise<SubscriptionPlan | null> {
  const supabase = await createClient()

  const { data: plan, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching plan:", error)
    return null
  }

  return plan || null
}

// ========================================
// CREATE Operation
// ========================================

const createPlanSchema = z.object({
  name: z.string().min(1, "Plannamn krävs").max(100, "Namn för långt"),
  monthly_credits: z.number().int("Krediter måste vara ett heltal").min(0, "Krediter kan inte vara negativa"),
  price: z.number().int("Pris måste vara ett heltal").min(0, "Pris kan inte vara negativt").nullable(),
  is_active: z.boolean(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>

export async function createPlan(
  input: CreatePlanInput
): Promise<{ success: boolean; error?: string; data?: SubscriptionPlan }> {
  try {
    // Validate input
    const validatedData = createPlanSchema.parse(input)

    const supabase = await createClient()

    // Insert plan
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert({
        name: validatedData.name,
        monthly_credits: validatedData.monthly_credits,
        price: validatedData.price,
        is_active: validatedData.is_active,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating plan:", error)
      
      // Check for unique constraint violation
      if (error.code === '23505' && error.message.includes('subscription_plans_name_key')) {
        return {
          success: false,
          error: `En plan med namnet "${validatedData.name}" finns redan.`,
        }
      }
      
      return {
        success: false,
        error: "Kunde inte skapa plan. Försök igen.",
      }
    }

    // Revalidate plans page
    revalidatePath("/settings/plans")

    return {
      success: true,
      data: data as SubscriptionPlan,
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
// UPDATE Operation
// ========================================

const updatePlanSchema = z.object({
  id: z.string().uuid("Ogiltigt plan-ID"),
  name: z.string().min(1, "Plannamn krävs").max(100, "Namn för långt"),
  monthly_credits: z.number().int("Krediter måste vara ett heltal").min(0, "Krediter kan inte vara negativa"),
  price: z.number().int("Pris måste vara ett heltal").min(0, "Pris kan inte vara negativt").nullable(),
  is_active: z.boolean(),
})

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>

export async function updatePlan(
  input: UpdatePlanInput
): Promise<{ success: boolean; error?: string; data?: SubscriptionPlan }> {
  try {
    // Validate input
    const validatedData = updatePlanSchema.parse(input)

    const supabase = await createClient()

    // Update plan
    const { data, error } = await supabase
      .from("subscription_plans")
      .update({
        name: validatedData.name,
        monthly_credits: validatedData.monthly_credits,
        price: validatedData.price,
        is_active: validatedData.is_active,
      })
      .eq("id", validatedData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating plan:", error)
      
      // Check for unique constraint violation
      if (error.code === '23505' && error.message.includes('subscription_plans_name_key')) {
        return {
          success: false,
          error: `En plan med namnet "${validatedData.name}" finns redan.`,
        }
      }
      
      return {
        success: false,
        error: "Kunde inte uppdatera plan. Försök igen.",
      }
    }

    // Revalidate plans page
    revalidatePath("/settings/plans")

    return {
      success: true,
      data: data as SubscriptionPlan,
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
// DELETE Operation
// ========================================

const deletePlanSchema = z.object({
  id: z.string().uuid("Ogiltigt plan-ID"),
})

export type DeletePlanInput = z.infer<typeof deletePlanSchema>

export async function deletePlan(
  input: DeletePlanInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = deletePlanSchema.parse(input)

    const supabase = await createClient()

    // Check if any organizations are using this plan
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("plan_id", validatedData.id)
      .limit(1)

    if (orgError) {
      console.error("Error checking organizations:", orgError)
      return {
        success: false,
        error: "Kunde inte kontrollera om planen används. Försök igen.",
      }
    }

    // If organizations exist with this plan, prevent deletion
    if (organizations && organizations.length > 0) {
      return {
        success: false,
        error: "Kan ej radera plan som används av organisationer. Inaktivera planen istället.",
      }
    }

    // No organizations found, safe to delete
    const { error: deleteError } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", validatedData.id)

    if (deleteError) {
      console.error("Error deleting plan:", deleteError)
      return {
        success: false,
        error: "Kunde inte radera plan. Försök igen.",
      }
    }

    // Revalidate plans page
    revalidatePath("/settings/plans")

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
// TOGGLE ACTIVE STATUS
// ========================================

const togglePlanStatusSchema = z.object({
  id: z.string().uuid("Ogiltigt plan-ID"),
  is_active: z.boolean(),
})

export type TogglePlanStatusInput = z.infer<typeof togglePlanStatusSchema>

export async function togglePlanStatus(
  input: TogglePlanStatusInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = togglePlanStatusSchema.parse(input)

    const supabase = await createClient()

    // Update plan status
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: validatedData.is_active })
      .eq("id", validatedData.id)

    if (error) {
      console.error("Error toggling plan status:", error)
      return {
        success: false,
        error: "Kunde inte ändra planstatus. Försök igen.",
      }
    }

    // Revalidate plans page
    revalidatePath("/settings/plans")

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


