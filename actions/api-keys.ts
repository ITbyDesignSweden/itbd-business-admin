"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { randomBytes, createHash } from "crypto"
import { ApiKey } from "@/lib/types/database"

/**
 * Generate a new API key for an organization
 * Returns the plaintext key (only time it will be shown!) and key metadata
 */
export async function generateApiKey(orgId: string, name?: string) {
  const supabase = await createClient()

  try {
    // Generate a cryptographically secure random key (32 bytes = 256 bits)
    // Base64url encoding gives us a URL-safe string
    const rawKey = randomBytes(32).toString("base64url") // e.g., "aBcD1234..."
    
    // Create a prefixed key for better UX (similar to GitHub tokens)
    const apiKey = `itbd_${rawKey}`
    
    // Hash the key using SHA-256 (fast and sufficient for this use case)
    const keyHash = createHash("sha256").update(apiKey).digest("hex")
    
    // Store last 8 characters for preview (e.g., "...a1b2c3d4")
    const keyPreview = `...${apiKey.slice(-8)}`

    // Insert into database
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        org_id: orgId,
        key_hash: keyHash,
        key_preview: keyPreview,
        name: name || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating API key:", error)
      return { success: false, error: "Kunde inte skapa API-nyckel" }
    }

    // Revalidate the organization page to show the new key
    revalidatePath(`/organizations/${orgId}`)
    revalidatePath("/organizations")

    // Return the plaintext key (ONLY TIME IT WILL BE SHOWN!)
    return {
      success: true,
      apiKey: apiKey, // Full plaintext key to show user
      keyData: data as ApiKey,
    }
  } catch (error) {
    console.error("Error generating API key:", error)
    return { success: false, error: "Ett oväntat fel uppstod" }
  }
}

/**
 * Get all API keys for an organization
 */
export async function getApiKeysByOrgId(orgId: string): Promise<ApiKey[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching API keys:", error)
      return []
    }

    return data as ApiKey[]
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return []
  }
}

/**
 * Revoke an API key (set is_active = false)
 */
export async function revokeApiKey(keyId: string, orgId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)

    if (error) {
      console.error("Error revoking API key:", error)
      return { success: false, error: "Kunde inte återkalla API-nyckeln" }
    }

    // Revalidate the organization page
    revalidatePath(`/organizations/${orgId}`)
    revalidatePath("/organizations")

    return { success: true }
  } catch (error) {
    console.error("Error revoking API key:", error)
    return { success: false, error: "Ett oväntat fel uppstod" }
  }
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string, orgId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId)

    if (error) {
      console.error("Error deleting API key:", error)
      return { success: false, error: "Kunde inte radera API-nyckeln" }
    }

    // Revalidate the organization page
    revalidatePath(`/organizations/${orgId}`)
    revalidatePath("/organizations")

    return { success: true }
  } catch (error) {
    console.error("Error deleting API key:", error)
    return { success: false, error: "Ett oväntat fel uppstod" }
  }
}

/**
 * Verify an API key (used by public API endpoints)
 * Returns the organization ID if the key is valid and active
 */
export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; orgId?: string }> {
  const supabase = await createClient()

  try {
    // Hash the incoming key
    const keyHash = createHash("sha256").update(apiKey).digest("hex")

    // Look up the key
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, org_id, is_active")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return { valid: false }
    }

    // Update last_used_at timestamp (fire and forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then(() => {}) // Ignore result

    return { valid: true, orgId: data.org_id }
  } catch (error) {
    console.error("Error verifying API key:", error)
    return { valid: false }
  }
}

