import { getCurrentProfile, getSystemStats } from "@/actions/profile"
import { ProfileForm } from "@/components/profile-form"
import { SecuritySettings } from "@/components/security-settings"
import { SystemStatus } from "@/components/system-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, CreditCard, RefreshCw, Brain } from "lucide-react"

export default async function SettingsPage() {
  const profile = await getCurrentProfile()
  const systemStats = await getSystemStats()

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inställningar</h1>
          <p className="text-muted-foreground">
            Kunde inte ladda profilinformation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inställningar</h1>
        <p className="text-muted-foreground">
          Hantera ditt konto och systeminställningar.
        </p>
      </div>

      {/* Quick Links Section */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Snabblänkar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link href="/settings/plans">
            <Button variant="ghost" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Prenumerationsplaner</div>
                  <div className="text-sm text-muted-foreground">Hantera planer och priser</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/settings/refills">
            <Button variant="ghost" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <RefreshCw className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Kreditpåfyllning</div>
                  <div className="text-sm text-muted-foreground">Automatisk månatlig påfyllning</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/settings/prompts">
            <Button variant="ghost" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">AI Prompts</div>
                  <div className="text-sm text-muted-foreground">Hantera AI-beteende och instruktioner</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Säkerhet</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profilinformation</CardTitle>
              <CardDescription>
                Uppdatera ditt för- och efternamn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Säkerhetsinställningar</CardTitle>
              <CardDescription>
                Hantera dina säkerhetsinställningar och behörigheter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemStatus stats={systemStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

