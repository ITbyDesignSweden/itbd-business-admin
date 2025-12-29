"use server"

import { createClient } from "@/lib/supabase/server"
import type { OrganizationWithCredits } from "@/lib/types/database"

/**
 * Get organization data for the public onboarding room
 * No authentication required - uses orgId as public identifier
 */
export async function getOrganizationForOnboarding(
  orgId: string
): Promise<OrganizationWithCredits | null> {
  try {
    const supabase = await createClient()

    // Fetch organization from the view (includes credits calculation)
    const { data: organization, error } = await supabase
      .from("organizations_with_credits")
      .select("*")
      .eq("id", orgId)
      .single()

    if (error) {
      console.error("Error fetching organization for onboarding:", error)
      return null
    }

    return organization
  } catch (error) {
    console.error("Error in getOrganizationForOnboarding:", error)
    return null
  }
}



