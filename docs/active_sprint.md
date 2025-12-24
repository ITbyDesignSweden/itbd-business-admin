# Active Sprint: SaaS Factory Foundation

**Status:** 🟢 Pågående
**Startdatum:** 2025-12-24
**Fokus:** Datamodellering för instanser & GitHub-automation.

---

## 🎯 Sprint Mål
Att transformera Admin Portalen från ett passivt CRM till ett "Command Center" för SaaS-fabriken. Vi ska göra det möjligt att spåra var kundens kod och produktion finns, samt bygga en "Proof of Concept" för att automatiskt skapa kund-repos via GitHub API.

---

## 📋 Backlog & Tasks

### 1. Database & Types (The Foundation)
- [x] **Skapa Migration:** Lägg till nya kolumner i `organizations`-tabellen:
  - `production_url` (TEXT, nullable)
  - `github_repo_url` (TEXT, nullable)
  - `supabase_project_ref` (TEXT, nullable)
- [x] **Uppdatera Types:** Uppdatera `database.ts` (Organization interface) för att inkludera de nya fälten.
- [x] **Uppdatera SQL Views:** Se till att `organizations_with_credits` inte går sönder (eller inkludera fälten om vi vill visa dem i listor).

### 2. UI: Instance Management (The Inventory)
- [x] **Uppdatera Detaljvy:** I `/organizations/[id]`, lägg till en ny sektion/Card: "SaaS Instance Details".
- [x] **Manuell Redigering:** Implementera formulärfält för att manuellt kunna redigera URL:er och Project Ref.
  - *Krav:* Använd Server Actions för uppdatering.
- [x] **Quick Links:** Om URL:er finns, visa tydliga knappar:
  - "Gå till Produktion" (External Link)
  - "Öppna GitHub Repo" (External Link)

### 3. Automation: GitHub Integration (The Engine)
- [x] **GitHub Helper:** Skapa `lib/github.ts` för att kommunicera med GitHub API.
  - *Metod:* `createRepoFromTemplate(owner, repo, newName, description)`
  - *Auth:* Implementera stöd för Personal Access Token (PAT) via env vars.
- [x] **Server Action:** Skapa `actions/provisioning.ts` som anropar GitHub-helpern och sedan uppdaterar `github_repo_url` i databasen.
- [x] **UI Trigger:** Lägg till en knapp "Provision Repository" i Instance-sektionen (endast synlig om repo-url saknas).
  - *Feedback:* Visa laddningsstatus ("Provisioning...") och Toast vid success/error.

---

## 🛠 Technical Notes (For the Agent)

### Environment Variables
Vi kommer behöva följande nya variabler i `.env.local`:
```bash
GITHUB_ACCESS_TOKEN=ghp_...
GITHUB_TEMPLATE_OWNER=itbd-org
GITHUB_TEMPLATE_REPO=itbd-boilerplate-v1
```

### GitHub API Strategy
Använd Octokit eller enkel fetch mot https://api.github.com/repos/{template_owner}/{template_repo}/generate.

Se till att det nya repot skapas som Private.

### UI/UX Rules
Svenska: Alla labels och knappar ska vara på svenska (t.ex. "Skapa Repository", "Produktionsmiljö").

Feedback: Eftersom GitHub-anropet kan ta 2-3 sekunder måste UI:t visa en spinner/disabled state så användaren inte klickar två gånger.