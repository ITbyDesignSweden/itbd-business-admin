import { getAllPilotRequestsWithAttachments } from "@/actions/pilot-requests"
import { PilotRequestsTable } from "@/components/pilot-requests-table"

export default async function PilotRequestsPage() {
  const requests = await getAllPilotRequestsWithAttachments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pilotförfrågningar</h1>
          <p className="text-muted-foreground">
            Hantera inkommande ansökningar från potentiella kunder.
          </p>
        </div>
      </div>
      <PilotRequestsTable requests={requests} />
    </div>
  )
}

