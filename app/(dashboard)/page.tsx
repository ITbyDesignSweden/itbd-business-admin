import { KpiCards } from "@/components/kpi-cards"
import { OrganizationsTable } from "@/components/organizations-table"
import { QuickActions } from "@/components/quick-actions"
import { getOrganizationsWithCredits } from "@/actions/database"

export default async function DashboardPage() {
  const organizations = await getOrganizationsWithCredits()

  return (
    <>
      <KpiCards />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrganizationsTable organizations={organizations} title="Recent Organizations" />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </>
  )
}

