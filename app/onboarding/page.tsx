/**
 * Sprint 8.4: Secure Onboarding Room
 * 
 * This page replaces the old /onboarding/[orgId] route with a token-based
 * authentication system. Users must have a valid invitation token to access
 * the onboarding room.
 * 
 * URL Format: /onboarding?token=<uuid>
 */

import { notFound } from "next/navigation"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingHero } from "@/components/onboarding/onboarding-hero"
import { OnboardingClient } from "@/components/onboarding/onboarding-client"
import { validateInvitationToken, TokenValidationError } from "@/lib/auth/token-gate"
import { createAdminClient } from "@/lib/supabase/admin"
import type { FeatureIdea, OrganizationWithCredits } from "@/lib/types/database"

interface OnboardingPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { token } = await searchParams
  
  // Step 1: Validate token and get org_id
  let orgId: string
  try {
    if (!token) {
      notFound()
    }
    orgId = await validateInvitationToken(token)
  } catch (error) {
    if (error instanceof TokenValidationError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto px-6 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Ogiltig inbjudningslänk</h1>
            <p className="text-muted-foreground mb-4">
              {error.message}
            </p>
            <p className="text-sm text-muted-foreground">
              Kontakta oss om du behöver en ny inbjudningslänk.
            </p>
          </div>
        </div>
      )
    }
    // Unknown error
    console.error('Unexpected error during token validation:', error)
    notFound()
  }

  // Step 2: Fetch organization data as Admin (since user is anonymous)
  const adminClient = createAdminClient()
  
  const { data: organization, error: orgError } = await adminClient
    .from('organizations_with_credits')
    .select('*')
    .eq('id', orgId)
    .single()

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError)
    notFound()
  }

  // Step 3: Fetch feature ideas from database
  const { data: featureIdeas } = await adminClient
    .from('feature_ideas')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'suggested')
    .order('created_at', { ascending: true })
    .limit(3)

  // Step 4: Render the view, passing ONLY the token (never orgId directly to client)
  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader companyName={organization.name} />

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <OnboardingHero companyName={organization.name} />

        <OnboardingClient 
          token={token}
          featureIdeas={(featureIdeas || []) as FeatureIdea[]} 
        />
      </main>
    </div>
  )
}

