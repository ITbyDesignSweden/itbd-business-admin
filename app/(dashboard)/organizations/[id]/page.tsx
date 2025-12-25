import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrganizationWithPlan, getCreditLedgerByOrgId, getProjectsByOrgId } from "@/actions/database"
import { getActivePlans } from "@/actions/subscription-plans"
import { getApiKeysByOrgId } from "@/actions/api-keys"
import { CreditLedgerTable } from "@/components/credit-ledger-table"
import { TopUpCreditsDialog } from "@/components/top-up-credits-dialog"
import { EditOrganizationDialog } from "@/components/edit-organization-dialog"
import { ProjectsTable } from "@/components/projects-table"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { SubscriptionCard } from "@/components/subscription-card"
import { ApiKeysSection } from "@/components/api-keys-section"

interface OrganizationPageProps {
  params: Promise<{
    id: string
  }>
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "pilot":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "churned":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "Aktiv"
    case "pilot":
      return "Pilot"
    case "churned":
      return "Avslutad"
    default:
      return status
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = await params
  
  // Fetch all data in parallel for optimal performance (single roundtrip)
  const [orgData, transactions, projects, availablePlans, apiKeys] = await Promise.all([
    getOrganizationWithPlan(id),
    getCreditLedgerByOrgId(id),
    getProjectsByOrgId(id),
    getActivePlans(),
    getApiKeysByOrgId(id),
  ])

  if (!orgData) {
    notFound()
  }

  const { organization, plan } = orgData

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/organizations" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till organisationer
          </Link>
        </Button>
      </div>

      {/* Organization Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <EditOrganizationDialog organization={organization} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getStatusColor(organization.status)}>
              {getStatusLabel(organization.status)}
            </Badge>
          </div>
        </div>
        {organization.org_nr && (
          <p className="text-muted-foreground">Org.nr: {organization.org_nr}</p>
        )}

        {/* Two-column layout for Credit Balance and Subscription */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Credit Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Kreditsaldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {organization.total_credits} <span className="text-lg font-normal text-muted-foreground">krediter</span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <SubscriptionCard
            organization={organization}
            plan={plan}
            availablePlans={availablePlans}
          />
        </div>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Projekt</CardTitle>
          <CreateProjectDialog orgId={organization.id} orgName={organization.name} />
        </CardHeader>
        <CardContent>
          <ProjectsTable projects={projects} />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Transaktionshistorik</CardTitle>
          <TopUpCreditsDialog orgId={organization.id} orgName={organization.name} projects={projects} />
        </CardHeader>
        <CardContent>
          <CreditLedgerTable transactions={transactions} projects={projects} />
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <ApiKeysSection orgId={organization.id} apiKeys={apiKeys} />
    </div>
  )
}

