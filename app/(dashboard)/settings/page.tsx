import { getCurrentProfile, getSystemStats } from "@/actions/profile"
import { ProfileForm } from "@/components/profile-form"
import { SecuritySettings } from "@/components/security-settings"
import { SystemStatus } from "@/components/system-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

