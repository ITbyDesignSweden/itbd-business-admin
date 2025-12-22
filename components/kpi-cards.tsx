import { TrendingUp, Users, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats } from "@/actions/database"

export async function KpiCards() {
  const stats = await getDashboardStats()

  const kpiData = [
    {
      title: "Total MRR",
      value: `${stats.total_mrr.toLocaleString("sv-SE")} kr`,
      icon: TrendingUp,
      trendPositive: true,
    },
    {
      title: "Aktiva kunder",
      value: stats.active_customers.toString(),
      icon: Users,
    },
    {
      title: "Väntande piloter",
      value: stats.pending_pilots.toString(),
      icon: Clock,
      warning: stats.pending_pilots > 0,
    },
    {
      title: "Totalt använda krediter",
      value: `${stats.total_credits_output} krediter`,
      icon: Zap,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.warning ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.warning ? "text-amber-500" : "text-foreground"}`}>
              {kpi.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
