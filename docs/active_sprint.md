# active_sprint.md

## 🧠 Sprint 10: The SDR Brain & Closing Logic

**Mål:** Göra Onboarding-chatten ("Säljrummet") intelligent och kapabel att agera. Agenten ska kunna läsa/skriva idéer till databasen och slutligen konvertera leadet till ett skarpt projekt och en inloggad användare.

**Strategi:** Använd **Vercel AI SDK (Server-side Tools)**. All kommunikation signeras med token från Sprint 8. Ingen `orgId` får någonsin skickas från klienten eller finnas i URL:en.

**Status:** 📅 Planned
**Prio:** High

---

### 📋 Tickets & Specs

#### 10.1 🧠 The SDR System Prompt (Context Injection)
**Syfte:** Ge agenten "Minne" och säkra att den vet vem den pratar med.
* **Fil:** `app/api/onboarding-chat/route.ts` (finns redan, behöver bara utökas)
* **Security Protocol:**
    1.  Frontend (`useChat`) skickar `{ body: { token } }`.
    2.  Backend extraherar `token` från request body.
    3.  **Gatekeeper:** `const orgId = await validateInvitationToken(token)`.
    4.  Om ogiltig -> Returnera 401 Unauthorized direkt.
* **Data Fetching:**
    * Använd `createAdminClient()` (Service Role) för att hämta:
        * `Organization` (för att veta bransch/namn).
        * `feature_ideas` (för att veta vad som redan föreslagits).
* **System Prompt:**
    * **Roll:** "Consultative Seller" för IT by Design.
    * **Context:** Injicera företagsnamn, bransch och nuvarande lista på idéer.
    * **Goal:** "Din uppgift är att förhandla fram ETT pilotprojekt (Small/Medium). Om kunden vill ha något stort/komplext, föreslå att vi 'parkerar' det i idébanken och börjar mindre."

#### 10.2 🛠️ Tool: Manage Feature Ideas (The Memory)
**Syfte:** Låta agenten manipulera idélisatan dynamiskt.
* **Fil:** `lib/ai-tools/manage-feature-idea.ts`
* **Tool Name:** `manage_feature_idea`
* **Input Schema (Zod):**
    ```typescript
    z.object({
      action: z.enum(['create', 'update', 'save', 'reject']),
      title: z.string(),
      description: z.string().optional(),
      idea_id: z.string().uuid().optional() // Används vid update/save/reject
    })
    ```
    **OBS:** Använder `saved` status istället för "park" (finns redan i DB enum)
* **Execution Logic (Backend):**
    * **VIKTIGT:** Tool-funktionen får `orgId` via closure i `route.ts`. Lita ALDRIG på ett org-id från LLM:en.
    * Utför CRUD-operation mot `feature_ideas`-tabellen (med Admin Client).
    * Actions:
        - `create`: Skapa ny idé med status 'suggested' och source 'chat_agent'
        - `update`: Uppdatera befintlig idé
        - `save`: Ändra status till 'saved' (kunden vill komma ihåg detta)
        - `reject`: Ändra status till 'rejected' (kunden inte intresserad)
    * Returnera kort bekräftelse: "Saved 'Lagerkoll' to your ideas".
* **Frontend:** Agenten bekräftar muntligt ("Jag har lagt till det i listan").

#### 10.3 🤝 Tool: Generate Proposal (The Artifact)
**Syfte:** Det visuella "Avslutet".
* **Fil:** `lib/ai-tools/generate-pilot-proposal.ts`
* **Tool Name:** `generate_pilot_proposal`
* **Input Schema (Zod):**
    ```typescript
    z.object({
      title: z.string(),
      summary: z.string(),
      complexity: z.enum(['small', 'medium']), // Styr scope
      key_features: z.array(z.string()),
      estimated_credits: z.number().int().min(1).max(30)
    })
    ```
* **Execution:** Returnerar proposal data till frontend (ingen DB-operation här)
* **Frontend UX (`components/ai/ai-chat-message.tsx`):**
    * Lyssna på `tool-invocation` med `state === 'result'`.
    * När `toolName === 'generate_pilot_proposal'` -> Rendera `<ProposalCard />`.
    * **ProposalCard** (`components/onboarding/proposal-card.tsx`): 
        - Visar titel, sammanfattning, features och kostnad
        - Primary Button: **[Starta Pilotprojekt]** som anropar `acceptProposal()`

#### 10.4 🚀 Action: The Handshake (Convert to User)
**Syfte:** Konvertera besökare till användare och skapa projektet.
* **Fil:** `actions/handshake.ts`
* **Funktion:** `acceptProposal(token: string, proposalData: ProposalData)`
* **Flow:**
    1.  **Validate:** `validateInvitationToken(token)` -> få `orgId`.
    2.  **DB - Project:** Skapa rad i `projects`-tabellen (kopplat till `orgId`).
        * Titel: `proposalData.title`
        * Status: `active_pilot`
        * Cost: `proposalData.estimated_credits`
        * Metadata: Spara hela proposal som JSON i `project_metadata` (behöver läggas till via migration om saknas)
    3.  **DB - Org:** Uppdatera `organizations.status` -> `active_pilot`.
    4.  **DB - Token:** Sätt `invitation_tokens.used_at = now()` (markera som använd).
    5.  **Auth (Supabase Admin):**
        * Hämta original `pilot_request` via `org_id` för att få kontakt-email
        * Kör `supabase.auth.admin.inviteUserByEmail(email, { data: { org_id: orgId } })`
        * Detta skickar automatiskt ett "Välkommen, sätt ditt lösenord"-mail.
* **Return:** `{ success: true, projectId: string }`.
* **Frontend:** Vid success, visa success-meddelande i chatten.

---

### 📝 Definition of Done
1.  **Memory:** Jag kan säga "Vi behöver också BankID", och en ny rad skapas i `feature_ideas` i databasen.
2.  **Proposal:** När jag säger "Det låter bra, vi kör på det", renderar agenten ett snyggt kort (inte text/JSON).
3.  **Conversion:** Klick på "Starta" skapar projektet i databasen och skickar en invite till min mail.
4.  **Security:** Försök att anropa `/api/chat` utan giltig token returnerar 401.