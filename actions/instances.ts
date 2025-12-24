"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schema for instance data
const instanceSchema = z.object({
  production_url: z.string().url().nullable().optional(),
  github_repo_url: z.string().url().nullable().optional(),
  supabase_project_ref: z.string().nullable().optional(),
})

/**
 * Update SaaS instance details for an organization
 */
export async function updateInstanceDetails(
  orgId: string,
  data: {
    production_url?: string | null
    github_repo_url?: string | null
    supabase_project_ref?: string | null
  }
) {
  const supabase = await createClient()

  // Validate input
  const validation = instanceSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      error: "Ogiltiga data: " + validation.error.message,
    }
  }

  // Update organization
  const { error } = await supabase
    .from("organizations")
    .update(validation.data)
    .eq("id", orgId)

  if (error) {
    console.error("Error updating instance details:", error)
    return {
      success: false,
      error: "Kunde inte uppdatera instansdetaljer",
    }
  }

  revalidatePath(`/organizations/${orgId}`)
  return { success: true }
}

/**
 * Set GitHub repo URL after provisioning
 */
export async function setGitHubRepoUrl(orgId: string, repoUrl: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("organizations")
    .update({ github_repo_url: repoUrl })
    .eq("id", orgId)

  if (error) {
    console.error("Error setting GitHub repo URL:", error)
    return {
      success: false,
      error: "Kunde inte uppdatera GitHub-länk",
    }
  }

  revalidatePath(`/organizations/${orgId}`)
  return { success: true }
}

