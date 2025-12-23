import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllPlans } from "@/actions/subscription-plans"
import { PlansTable } from "@/components/plans-table"
import { CreatePlanDialog } from "@/components/create-plan-dialog"

export const metadata = {
  title: "Prenumerationsplaner | Inställningar",
  description: "Hantera prenumerationsplaner för organisationer",
}

export default async function PlansPage() {
  const plans = await getAllPlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prenumerationsplaner</h1>
        <p className="text-muted-foreground">
          Skapa och hantera planer som kunder kan prenumerera på.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Planer</CardTitle>
            <CardDescription>
              Definiera vilka prenumerationsplaner som finns tillgängliga.
            </CardDescription>
          </div>
          <CreatePlanDialog />
        </CardHeader>
        <CardContent>
          <PlansTable plans={plans} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Om prenumerationsplaner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Krediter per månad:</strong> Anger hur många krediter som automatiskt läggs till varje månad för organisationer med denna plan.
          </p>
          <p>
            <strong>Pris:</strong> Månadspris i SEK. Används för MRR-beräkningar i dashboarden.
          </p>
          <p>
            <strong>Status:</strong> Endast aktiva planer kan väljas när man startar nya prenumerationer.
          </p>
          <p>
            <strong>Ta bort plan:</strong> En plan kan endast raderas om inga organisationer använder den. Annars måste den inaktiveras.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


