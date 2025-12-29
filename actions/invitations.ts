'use server'

/**
 * Sprint 8.3: Invitation Actions
 * 
 * Purpose: Admin tools to create and manage secure invitation links
 * for the onboarding room.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface InvitationToken {
  token: string
  org_id: string
  created_at: string
  expires_at: string
  used_at: string | null
}

/**
 * Creates a new invitation token for an organization
 * Returns the complete onboarding URL with the token
 * 
 * @param orgId - The organization ID to create invitation for
 * @returns Object with token and full URL
 */
export async function createInvitation(orgId: string): Promise<{ token: string; url: string }> {
  // Verify caller is authenticated (optional: check admin role)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Obehörig: Inloggning krävs')
  }

  // Use Admin Client to create token
  const adminClient = createAdminClient()
  
  const { data: token, error } = await adminClient
    .from('invitation_tokens')
    .insert({
      org_id: orgId,
      // created_at and expires_at will use defaults (now + 30 days)
    })
    .select('token')
    .single()

  if (error || !token) {
    console.error('Error creating invitation token:', error)
    throw new Error('Kunde inte skapa inbjudningslänk: ' + error?.message)
  }

  // Construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${baseUrl}/onboarding?token=${token.token}`

  return {
    token: token.token,
    url
  }
}

/**
 * Gets all invitation tokens for an organization
 * Useful for admin UI to show active invitations
 * 
 * @param orgId - The organization ID
 * @returns Array of invitation tokens
 */
export async function getInvitations(orgId: string): Promise<InvitationToken[]> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Obehörig: Inloggning krävs')
  }

  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient
    .from('invitation_tokens')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    throw new Error('Kunde inte hämta inbjudningar: ' + error.message)
  }

  return data || []
}

/**
 * Deletes (revokes) an invitation token
 * 
 * @param token - The token UUID to revoke
 */
export async function revokeInvitation(token: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Obehörig: Inloggning krävs')
  }

  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('invitation_tokens')
    .delete()
    .eq('token', token)

  if (error) {
    console.error('Error revoking invitation:', error)
    throw new Error('Kunde inte återkalla inbjudning: ' + error.message)
  }
}

