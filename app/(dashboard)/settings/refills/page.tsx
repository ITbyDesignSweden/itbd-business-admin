import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  getOrganizationsDueForRefill, 
  getRecentRefillExecutions 
} from "@/actions/database"
import { RefillTriggerButton } from "@/components/refill-trigger-button"
import { RefreshCw, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

export const metadata = {
  title: "Kreditpåfyllning | Inställningar",
  description: "Hantera automatisk kreditpåfyllning för prenumerationer",
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case "partial_failure":
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case "failure":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "success":
      return "Lyckades"
    case "partial_failure":
      return "Delvis misslyckad"
    case "failure":
      return "Misslyckades"
    default:
      return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "partial_failure":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "failure":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export default async function RefillsPage() {
  const [orgsDue, recentExecutions] = await Promise.all([
    getOrganizationsDueForRefill(),
    getRecentRefillExecutions(10),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kreditpåfyllning</h1>
        <p className="text-muted-foreground">
          Hantera automatisk månatlig kreditpåfyllning för aktiva prenumerationer.
        </p>
      </div>

      {/* Organizations Due for Refill */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Organisationer att fylla på</CardTitle>
            <CardDescription>
              Organisationer med aktiva prenumerationer som har förfallit påfyllningsdatum
            </CardDescription>
          </div>
          <RefillTriggerButton disabled={orgsDue.length === 0} />
        </CardHeader>
        <CardContent>
          {orgsDue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Inga organisationer behöver påfyllning just nu.
              </p>
              <p className="text-sm text-muted-foreground">
                Påfyllning sker automatiskt när <code>next_refill_date</code> är förbi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgsDue.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Plan: {org.plan_name} • {org.monthly_credits} krediter/månad
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(org.next_refill_date).toLocaleDateString("sv-SE")}
                    </div>
                    <div className="text-xs text-muted-foreground">Påfyllningsdatum</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions Log */}
      <Card>
        <CardHeader>
          <CardTitle>Tidigare körningar</CardTitle>
          <CardDescription>Historik över automatiska påfyllningar</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Inga körningar ännu.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(execution.executed_at).toLocaleString("sv-SE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {execution.organizations_processed} organisationer • {execution.credits_added} krediter
                        {execution.execution_duration_ms && ` • ${execution.execution_duration_ms}ms`}
                      </div>
                      {execution.error_message && (
                        <div className="text-xs text-red-500 mt-1">{execution.error_message}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(execution.status)}>
                    {getStatusLabel(execution.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Om automatisk påfyllning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Automatisk körning:</strong> Påfyllningen körs automatiskt varje natt via en cron-jobb (Edge Function).
          </p>
          <p>
            <strong>Villkor:</strong> Endast organisationer med status <code>subscription_status = &apos;active&apos;</code> och förfallet <code>next_refill_date</code> fylls på.
          </p>
          <p>
            <strong>Säkerhet:</strong> Cron-jobbet körs med service_role-behörigheter och kan endast anropas med rätt API-nyckel.
          </p>
          <p>
            <strong>Testning:</strong> Använd knappen &quot;Kör påfyllning nu&quot; ovan för att manuellt trigga processen för testning.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


