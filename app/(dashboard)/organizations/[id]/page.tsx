import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrganizationById, getCreditLedgerByOrgId } from "@/actions/database"
import { CreditLedgerTable } from "@/components/credit-ledger-table"
import { TopUpCreditsDialog } from "@/components/top-up-credits-dialog"
import { EditOrganizationDialog } from "@/components/edit-organization-dialog"

interface OrganizationPageProps {
  params: Promise<{
    id: string
  }>
}

function getPlanColor(plan: string) {
  switch (plan.toLowerCase()) {
    case "growth":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    case "scale":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
    case "care":
    default:
      return "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
  }
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

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = await params
  const organization = await getOrganizationById(id)

  if (!organization) {
    notFound()
  }

  // Fetch credit transactions for this organization
  const transactions = await getCreditLedgerByOrgId(id)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till Dashboard
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
            <Badge variant="outline" className={getPlanColor(organization.subscription_plan)}>
              {organization.subscription_plan.charAt(0).toUpperCase() + organization.subscription_plan.slice(1)}
            </Badge>
            <Badge variant="outline" className={getStatusColor(organization.status)}>
              {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
            </Badge>
          </div>
        </div>
        {organization.org_nr && (
          <p className="text-muted-foreground">Org.nr: {organization.org_nr}</p>
        )}

        {/* Credit Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Kreditsaldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {organization.total_credits} <span className="text-lg font-normal text-muted-foreground">pts</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Transaktionshistorik</CardTitle>
          <TopUpCreditsDialog orgId={organization.id} orgName={organization.name} />
        </CardHeader>
        <CardContent>
          <CreditLedgerTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  )
}

