import { notFound } from "next/navigation"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingHero } from "@/components/onboarding/onboarding-hero"
import { OnboardingClient } from "@/components/onboarding/onboarding-client"
import { getOrganizationForOnboarding } from "@/actions/onboarding"
import { createClient } from "@/lib/supabase/server"
import type { FeatureIdea } from "@/lib/types/database"

interface OnboardingRoomProps {
  params: Promise<{
    orgId: string
  }>
}

export default async function OnboardingRoom({ params }: OnboardingRoomProps) {
  const { orgId } = await params
  
  // Fetch organization data
  const organization = await getOrganizationForOnboarding(orgId)

  // Handle 404 if organization doesn't exist
  if (!organization) {
    notFound()
  }

  // Sprint 9.5: Fetch feature ideas from database
  const supabase = await createClient()
  const { data: featureIdeas } = await supabase
    .from('feature_ideas')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'suggested')
    .order('created_at', { ascending: true })
    .limit(3)

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader companyName={organization.name} />

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <OnboardingHero companyName={organization.name} />

        <OnboardingClient 
          orgId={orgId} 
          featureIdeas={(featureIdeas || []) as FeatureIdea[]} 
        />
      </main>
    </div>
  )
}

