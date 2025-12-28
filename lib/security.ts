/**
 * Security utilities for Cloudflare Turnstile verification
 * Sprint 6: The Gatekeeper
 */

/**
 * Verifies a Cloudflare Turnstile token
 * @param token - The token from the Turnstile widget
 * @returns true if verification succeeded, false otherwise
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET
  
  // In development mode without secret, skip validation
  if (!secret) {
    console.warn("⚠️ Turnstile secret missing, skipping validation (Dev mode)")
    return true
  }

  const formData = new FormData()
  formData.append('secret', secret)
  formData.append('response', token)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })
    
    const outcome = await res.json()
    
    if (outcome.success) {
      console.log("✅ Turnstile verification successful")
      return true
    } else {
      console.warn("❌ Turnstile verification failed:", outcome['error-codes'])
      return false
    }
  } catch (e) {
    console.error("❌ Turnstile error:", e)
    return false
  }
}

/**
 * Gets the current system settings from database
 * Used to check if lead submission should be allowed
 */
export async function getSystemSettings() {
  const { createClient } = await import("@/lib/supabase/server")
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
  
  return data
}

