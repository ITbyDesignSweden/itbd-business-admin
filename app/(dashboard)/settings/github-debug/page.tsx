import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { debugGitHubConfig } from "@/actions/debug-github"

export default async function GitHubDebugPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GitHub Debug</h1>
        <p className="text-muted-foreground">
          Testa din GitHub-konfiguration och template-access
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kör diagnostik</CardTitle>
          <CardDescription>
            Detta testar om din GitHub Access Token fungerar och om template repository är korrekt konfigurerad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              const result = await debugGitHubConfig()
              console.log("\n=== DIAGNOSTIC RESULT ===")
              if (result.success) {
                console.log("✅ SUCCESS:", result.message)
              } else {
                console.error("❌ FAILED:", result.error)
              }
              console.log("=========================\n")
            }}
          >
            <Button type="submit">Kör diagnostik</Button>
          </form>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono">
              Resultat visas i terminalen där <code>npm run dev</code> körs.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vanliga problem och lösningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">❌ 404 Not Found</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Template repository existerar inte</li>
              <li>Repository namn är felstavat i <code>.env.local</code></li>
              <li>Token har inte access till private repository</li>
              <li>Du är inte medlem i organisationen (för org-repos)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">❌ 401 Unauthorized</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>GitHub token är ogiltigt eller har gått ut</li>
              <li>Token saknar <code>repo</code> scope</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">✅ Lösning</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Verifiera att <code>GITHUB_TEMPLATE_OWNER</code> och <code>GITHUB_TEMPLATE_REPO</code> är korrekta</li>
              <li>Gå till GitHub och kontrollera att repot är markerat som "Template repository"</li>
              <li>Om repot är private, se till att din token har <code>repo</code> scope</li>
              <li>Skapa en ny token om nuvarande har gått ut</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuvarande konfiguration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">GITHUB_TEMPLATE_OWNER:</span>{" "}
              <span className="font-semibold">{process.env.GITHUB_TEMPLATE_OWNER || "⚠️ Ej satt"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">GITHUB_TEMPLATE_REPO:</span>{" "}
              <span className="font-semibold">{process.env.GITHUB_TEMPLATE_REPO || "⚠️ Ej satt"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">GITHUB_ACCESS_TOKEN:</span>{" "}
              <span className="font-semibold">
                {process.env.GITHUB_ACCESS_TOKEN ? "✅ Satt" : "⚠️ Ej satt"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

