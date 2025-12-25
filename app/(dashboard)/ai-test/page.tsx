import { getAllOrganizationsWithCredits } from "@/actions/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AiArchitectWidget } from "@/components/ai-architect-widget"

export default async function AiTestPage() {
  const organizations = await getAllOrganizationsWithCredits()
  
  // Använd första organisationen som test-projekt (eller välj en specifik)
  const testOrg = organizations[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Architect - Test</h1>
        <p className="text-muted-foreground">
          Testa AI-assistenten för plattformsutveckling.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Testinformation</CardTitle>
          <CardDescription>
            Widget-konfiguration för denna testsession
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Test-organisation:</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{testOrg?.name || 'Ingen organisation hittades'}</Badge>
              {testOrg && (
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  ID: {testOrg.id}
                </code>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">API Endpoint:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              POST /api/chat
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Instruktioner:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Klicka på den flytande knappen nere till höger</li>
              <li>Skriv ett meddelande (t.ex. "Jag vill bygga ett bokningssystem")</li>
              <li>AI:n bör svara på Svenska och diskutera krediter</li>
              <li>Testa olika scenarios och error cases</li>
            </ol>
          </div>

          {!testOrg && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Ingen organisation hittades i databasen. Skapa minst en organisation för att testa widgeten.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget (visas bara om vi har en test-org) */}
      {testOrg && <AiArchitectWidget projectId={testOrg.id} />}
    </div>
  )
}






