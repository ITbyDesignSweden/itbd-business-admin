"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  FolderKanban,
  Activity,
  Info
} from "lucide-react"

interface SystemStatusProps {
  stats: {
    total_customers: number
    active_customers: number
    pilot_customers: number
    total_projects: number
    system_version: string
  }
}

export function SystemStatus({ stats }: SystemStatusProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Systemstatus</CardTitle>
          <CardDescription>
            Översikt över systemets aktuella tillstånd och statistik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="font-medium">Status</span>
            </div>
            <Badge variant="default" className="bg-green-600">
              Operationell
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Version</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.system_version}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totalt antal kunder
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Alla organisationer i systemet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktiva kunder
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_customers}</div>
            <p className="text-xs text-muted-foreground">
              Kunder med aktiv prenumeration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pilot-kunder
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pilot_customers}</div>
            <p className="text-xs text-muted-foreground">
              Kunder i pilot-fas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totala projekt
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              Alla projekt över alla kunder
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

