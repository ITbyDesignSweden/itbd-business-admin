import { notFound } from "next/navigation"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingHero } from "@/components/onboarding/onboarding-hero"
import { OnboardingClient } from "@/components/onboarding/onboarding-client"
import { getOrganizationForOnboarding } from "@/actions/onboarding"

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

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader companyName={organization.name} />

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <OnboardingHero companyName={organization.name} />

        <OnboardingClient orgId={orgId} />
      </main>
    </div>
  )
}

