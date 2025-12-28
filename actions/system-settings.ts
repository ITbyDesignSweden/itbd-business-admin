"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { SystemSettings, EnrichmentMode } from "@/lib/types/database"

// Validation schema for updating system settings
const updateSystemSettingsSchema = z.object({
  enrichment_mode: z.enum(["manual", "assist", "autopilot"]),
  max_daily_leads: z.number().min(1).max(1000),
})

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>

/**
 * Update system settings (singleton table)
 * Sprint 7: The SDR Brain
 */
export async function updateSystemSettings(
  input: UpdateSystemSettingsInput
): Promise<{ success: boolean; error?: string; data?: SystemSettings }> {
  try {
    // Validate input
    const validatedData = updateSystemSettingsSchema.parse(input)

    const supabase = await createClient()

    // Update the singleton row (id = 1)
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        enrichment_mode: validatedData.enrichment_mode,
        max_daily_leads: validatedData.max_daily_leads,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single()

    if (error) {
      console.error("Error updating system settings:", error)
      return {
        success: false,
        error: "Kunde inte uppdatera inställningar. Försök igen.",
      }
    }

    // Revalidate settings page
    revalidatePath("/settings")

    return {
      success: true,
      data: data as SystemSettings,
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

/**
 * Get current system settings
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error) {
    console.error("Error fetching system settings:", error)
    return null
  }

  return data as SystemSettings
}

