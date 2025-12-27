import { getAllOrganizationsWithCredits, getProjectsByOrgId } from "@/actions/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AiArchitectWidget } from "@/components/ai-architect-widget"
import { getSchemaContext } from "@/actions/schema-context"

export default async function AiTestPage() {
  const organizations = await getAllOrganizationsWithCredits()
  const schemaPreview = await getSchemaContext()
  
  // Använd första organisationen som test-projekt (eller välj en specifik)
  const testOrg = organizations[0]
  
  // Hämta projekt för organisationen
  const projects = testOrg ? await getProjectsByOrgId(testOrg.id) : []
  const testProject = projects[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Architect - Test</h1>
        <p className="text-muted-foreground">
          Testa AI-assistenten för plattformsutveckling (Sprint 2: Context Awareness)
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Test-organisation:</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{testOrg?.name || 'Ingen organisation hittades'}</Badge>
                {testOrg && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    Org ID: {testOrg.id.slice(0, 8)}...
                  </code>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Test-projekt:</p>
              <div className="flex items-center gap-2">
                <Badge variant={testProject ? "secondary" : "destructive"}>
                  {testProject?.title || 'Inget projekt hittades'}
                </Badge>
                {testProject && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    Proj ID: {testProject.id.slice(0, 8)}...
                  </code>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">API Endpoint:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              POST /api/chat
            </code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Sprint 2 Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>AI känner till organisationsnamn: <strong>{testOrg?.name}</strong></li>
              <li>AI känner till kreditsaldo: <strong>{testOrg?.total_credits} krediter</strong></li>
              <li>AI känner till affärsprofil: <strong>{testOrg?.business_profile || 'Ej angiven'}</strong></li>
              <li>AI får databas-schema automatiskt (se nedan)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Schema Context (cachad):</p>
            <pre className="text-xs bg-muted px-3 py-2 rounded overflow-x-auto max-h-32">
              {schemaPreview || 'Laddar schema...'}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Testinstruktioner:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Klicka på den flytande knappen nere till höger</li>
              <li>Fråga: "Vilka tabeller har jag?" (AI bör lista dem från schema)</li>
              <li>Fråga: "Hur många krediter har jag kvar?" (AI bör veta saldot)</li>
              <li>Fråga: "Vad är min verksamhet?" (AI bör referera till business_profile)</li>
            </ol>
          </div>

          {!testOrg && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Ingen organisation hittades i databasen. Skapa minst en organisation för att testa widgeten.
              </p>
            </div>
          )}
          
          {testOrg && !testProject && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ Organisationen "{testOrg.name}" har inga projekt. Skapa ett projekt för att kunna testa chatten.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Widget (visas bara om vi har ett test-projekt) */}
      {testProject && <AiArchitectWidget projectId={testProject.id} />}
    </div>
  )
}






