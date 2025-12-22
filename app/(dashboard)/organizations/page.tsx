import { OrganizationsTable } from "@/components/organizations-table"
import { AddOrganizationDialog } from "@/components/add-organization-dialog"
import { getAllOrganizationsWithCredits } from "@/actions/database"

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizationsWithCredits()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organisationer</h1>
          <p className="text-muted-foreground">
            Hantera alla kunder och deras kreditbalans.
          </p>
        </div>
        <AddOrganizationDialog />
      </div>
      <OrganizationsTable organizations={organizations} title="Organisationer" />
    </div>
  )
}

