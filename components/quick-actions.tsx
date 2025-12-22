import { Clock, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddOrganizationDialog } from "@/components/add-organization-dialog"

const actions = [
  { label: "Registrera manuella timmar", icon: Clock },
  { label: "Fyll på krediter", icon: CreditCard },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Snabbkommandon</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <AddOrganizationDialog />
        {actions.map((action) => (
          <Button key={action.label} variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
