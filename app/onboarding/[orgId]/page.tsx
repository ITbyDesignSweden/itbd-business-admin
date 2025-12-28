import { notFound } from "next/navigation"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingHero } from "@/components/onboarding/onboarding-hero"
import { StarterCards } from "@/components/onboarding/starter-cards"
import { ChatInterface } from "@/components/onboarding/chat-interface"
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

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StarterCards />
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}

