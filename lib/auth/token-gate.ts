/**
 * Sprint 8.2: Token Gatekeeper
 * 
 * Purpose: Central validation function that verifies invitation tokens
 * without consuming them directly (allows page reloads).
 * 
 * Security: Uses Admin Client to bypass RLS since tokens are not accessible
 * to anonymous users.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export class TokenValidationError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MISSING_TOKEN'
  ) {
    super(message)
    this.name = 'TokenValidationError'
  }
}

/**
 * Validates an invitation token and returns the associated org_id
 * 
 * @param token - The UUID token from the URL
 * @returns The verified org_id
 * @throws TokenValidationError if token is invalid, expired, or missing
 */
export async function validateInvitationToken(token: string | undefined | null): Promise<string> {
  // Check 0: Token provided?
  if (!token) {
    throw new TokenValidationError('Token saknas', 'MISSING_TOKEN')
  }

  // Initialize Admin Client (Service Role) to bypass RLS
  const supabase = createAdminClient()

  // Fetch token row
  const { data: tokenData, error } = await supabase
    .from('invitation_tokens')
    .select('org_id, expires_at, used_at')
    .eq('token', token)
    .single()

  // Check 1: Does token exist?
  if (error || !tokenData) {
    console.error('Token validation failed:', error)
    throw new TokenValidationError('Ogiltig inbjudningslänk', 'INVALID_TOKEN')
  }

  // Check 2: Has it expired?
  const now = new Date()
  const expiresAt = new Date(tokenData.expires_at)
  
  if (expiresAt < now) {
    throw new TokenValidationError('Inbjudningslänken har gått ut', 'EXPIRED_TOKEN')
  }

  // Note: We do NOT check 'used_at' here to allow users to refresh
  // the page and re-enter the onboarding room during the process.
  // The token can be marked as "used" later if needed for analytics.

  // Success! Return the verified org_id
  return tokenData.org_id
}

/**
 * Marks a token as used (optional, for analytics/tracking)
 * This can be called when the user first enters, but won't block
 * subsequent visits within the expiry period.
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  const supabase = createAdminClient()
  
  await supabase
    .from('invitation_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null) // Only update if not already marked
}


