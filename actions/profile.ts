"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Profile } from "@/lib/types/database"

// Validation schema for updating profile
const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "Förnamn krävs")
    .max(100, "Förnamnet är för långt")
    .trim(),
  last_name: z
    .string()
    .min(1, "Efternamn krävs")
    .max(100, "Efternamnet är för långt")
    .trim(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error fetching user:", userError)
    return null
  }

  // Get profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return null
  }

  return profile as Profile
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string; data?: Profile }> {
  try {
    // Validate input
    const validatedData = updateProfileSchema.parse(input)

    const supabase = await createClient()

    // Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: "Du måste vara inloggad för att uppdatera din profil.",
      }
    }

    // Check if profile exists first
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (!existingProfile) {
      // Profile doesn't exist - create it
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          role: "admin",
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating profile:", createError)
        return {
          success: false,
          error: "Kunde inte skapa profil. Kontakta systemadministratör.",
        }
      }

      // Revalidate settings page and dashboard layout
      revalidatePath("/settings")
      revalidatePath("/", "layout")

      return {
        success: true,
        data: newProfile as Profile,
      }
    }

    // Update existing profile
    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      
      // Check if it's a column error (migration not applied)
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        return {
          success: false,
          error: "Databasen är inte uppdaterad. Kör migrationen först.",
        }
      }
      
      return {
        success: false,
        error: "Kunde inte uppdatera profil. Försök igen.",
      }
    }

    // Revalidate settings page and dashboard layout
    revalidatePath("/settings")
    revalidatePath("/", "layout")

    return {
      success: true,
      data: data as Profile,
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

export async function getSystemStats(): Promise<{
  total_customers: number
  active_customers: number
  pilot_customers: number
  total_projects: number
  system_version: string
}> {
  const supabase = await createClient()

  // Get customer counts
  const { data: organizations } = await supabase
    .from("organizations")
    .select("status")

  const total_customers = organizations?.length || 0
  const active_customers =
    organizations?.filter((org) => org.status === "active").length || 0
  const pilot_customers =
    organizations?.filter((org) => org.status === "pilot").length || 0

  // Get total projects
  const { count: total_projects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })

  return {
    total_customers,
    active_customers,
    pilot_customers,
    total_projects: total_projects || 0,
    system_version: "1.0.0-beta",
  }
}

