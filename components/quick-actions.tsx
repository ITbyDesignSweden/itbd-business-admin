import { Plus, Clock, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const actions = [
  { label: "New Customer", icon: Plus },
  { label: "Register Manual Hours", icon: Clock },
  { label: "Top-up Credits", icon: CreditCard },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
