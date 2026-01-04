# active_sprint.md

## 🧠 Sprint 11: The Technical Handover & Mission Control

**Mål:** Säkra att den rika informationen från säljsamtalet inte går förlorad utan sparas som en teknisk kravspecifikation ("Blueprint"). Vi skapar även en "Mission Control"-vy för Admin för att övervaka och granska dessa specifikationer innan utveckling startar.

**Status:** 📅 Planned
**Prio:** High

---

### 📋 Tickets & Specs

#### 11.1 🗄️ Database: Blueprint Storage
**Syfte:** Utöka `projects`-tabellen för att lagra tekniska specifikationer och koppla dem till idébanken.
* **Fil:** `supabase/migrations/[timestamp]_project_blueprints.sql`
* **SQL:**
    ```sql
    alter table projects
    add column source_feature_idea_id uuid references feature_ideas(id),
    add column ai_blueprint text; -- Här lagras Markdown-specen
    ```

#### 11.2 🛠️ Tool: Upgrade `generate_pilot_proposal`
**Syfte:** Verktyget måste generera två lager av information: En för kunden (UI) och en för utvecklaren (DB).
* **Fil:** `app/api/chat/route.ts` (Tool Definition)
* **Zod Schema Update:**
    ```typescript
    z.object({
      // UI-fält (Sälj):
      title: z.string(),
      summary: z.string(),
      complexity: z.enum(['small', 'medium']), // Mappar mot kostnad internt
      estimated_credits: z.number().describe("Föreslagen kostnad i krediter (t.ex. 2, 5, 10)"),

      // Backend-fält (Arkitekt):
      related_feature_id: z.string().optional().describe("ID på den feature_idea som diskuterats, om någon."),
      technical_spec: z.string().describe(`
        DETALJERAD KRAVSPECIFIKATION FÖR UTVECKLARE (Markdown).
        Måste innehålla:
        1. Datamodell (Tabeller, kolumner, relationer).
        2. Vyer/Sidor som behövs (t.ex. '/inventory', '/admin').
        3. Affärsregler och RLS-policyer.
        4. Tech Stack: Supabase + Next.js.
      `)
    })
    ```

#### 11.3 🧠 System Prompt: "The Hidden Architect"
**Syfte:** Instruera Sälj-agenten att agera arkitekt i bakgrunden.
* **Fil:** `app/api/chat/route.ts`
* **Tillägg i Prompt:**
    > "När du använder verktyget `generate_pilot_proposal`, är din uppgift dubbel:
    > 1. **Till kunden:** Ge en kort, säljande sammanfattning och ett prisestimat.
    > 2. **Till parametern `technical_spec`:** Skriv en extremt detaljerad instruktion till den AI/Utvecklare som ska bygga koden. Översätt kundens vaga önskemål till konkreta databastabeller, fältnamn och funktioner. Var tekniskt explicit."

#### 11.4 ⚡ Action: Save Project with Blueprint
**Syfte:** Spara ner den genererade datan och skapa projektet när kunden accepterar.
* **Fil:** `actions/create-project.ts` (Ersätter/Integrerar logik från tidigare `handshake.ts`)
* **Funktion:** `acceptProposal(token: string, proposalData: any)`
* **Logik:**
    1.  Validera token (Sprint 8).
    2.  **Insert till `projects`:**
        * `title`: `proposalData.title`
        * `cost_credits`: `proposalData.estimated_credits` (Notera namnbyte mot DB)
        * `ai_blueprint`: `proposalData.technical_spec`
        * `source_feature_idea_id`: `proposalData.related_feature_id`
        * `status`: 'active_pilot' (eller 'backlog' beroende på credits)
    3.  **Update `feature_ideas`:** Om ID finns, sätt `status` = 'planned'.
    4.  **Auth Invite:** (Som i Sprint 10) Bjud in användaren via e-post.

#### 11.5 ⚛️ Frontend: Proposal Card Data Flow
**Syfte:** Se till att React-komponenten bär med sig den dolda datan.
* **Komponent:** `components/onboarding/proposal-card.tsx`
* **Logik:**
    * Spara hela `proposalData` (inklusive den dolda `technical_spec`) i komponentens state eller direkt i onClick-handlern.
    * Vid klick på "Starta": Anropa `acceptProposal` med hela objektet.

#### 11.6 🖥️ Admin UI: Global Project Pipeline
**Syfte:** En ny huvudvy i Admin Portalen för att se alla projekt och granska blueprints.
* **Route:** `/admin/projects` (Ny sida)
* **Data Fetching:**
    * Join `projects` + `organizations`.
* **UI Komponenter:**
    * **Data Table:** Status (Badge), Projektnamn, Organisation (Länk), Credits, Datum.
    * **Tabs:** "All", "Active Pilots", "Backlog".
    * **Blueprint Viewer (Sheet/Drawer):**
        * Vid klick på rad/knapp -> Öppna sidopanel.
        * Visa `ai_blueprint` renderad med `react-markdown`.
        * Här kan Admin snabbt avgöra om AI:n lovat för mycket eller för lite.

---

### 📝 Definition of Done
1.  **Persistence:** Jag kan genomföra en sälj-chat, och i databasen sparas nu en lång Markdown-text i kolumnen `ai_blueprint`.
2.  **Linkage:** Om vi diskuterade en sparad idé, är projektet korrekt länkat till den idén via `source_feature_idea_id`.
3.  **Admin View:** Jag kan logga in som admin, gå till `/admin/projects`, klicka på det nya projektet och läsa den tekniska specifikationen i en snygg sidopanel.