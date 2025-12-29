# active_sprint.md

## 🧱 Sprint 9.5: The Persistence Layer

**Mål:** Flytta genereringen av "Prompt Starters" från frontend (on-demand vid sidladdning) till backend (asynkron enrichment). Detta eliminerar laddtiderna på onbaording-sidan och skapar grunden för en "Idébank" (Backlog).

**Status:** ✅ Completed (2025-01-29)
**Prio:** High (Performance & Architecture)

---

### 📋 Tickets & Specs

#### 9.5.1 🗄️ Database Schema (Feature Ideas)
**Syfte:** Skapa tabellen för att lagra produktidéer och features.
* **Fil:** `supabase/migrations/[timestamp]_feature_ideas.sql`
* **SQL Definition:**
    ```sql
    -- Enums för status och källa
    create type feature_status as enum ('suggested', 'saved', 'planned', 'implemented', 'rejected');
    create type feature_source as enum ('ai_initial', 'chat_agent', 'manual');

    -- Huvudtabell
    create table feature_ideas (
      id uuid default gen_random_uuid() primary key,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      org_id uuid references organizations(id) on delete cascade not null,
      title text not null,
      description text not null,
      prompt text not null, -- Det som skickas till agenten
      status feature_status default 'suggested' not null,
      source feature_source default 'ai_initial' not null,
      complexity text check (complexity in ('small', 'medium', 'large'))
    );

    -- Prestanda-index
    create index idx_feature_ideas_org_status on feature_ideas(org_id, status);

    -- RLS (Säkerhet)
    alter table feature_ideas enable row level security;

    -- Policy: Tillåt authenticated users (admins) att göra allt
    -- Detta är ett internt admin-system, så alla inloggade användare har full access
    create policy "Authenticated users can manage feature ideas"
      on feature_ideas for all
      using (auth.uid() is not null);
    ```

#### 9.5.2 🧠 Backend Logic (The Pre-Generator)
**Syfte:** Integrera genereringen i godkännande-flödet så att datan finns *innan* kunden besöker sidan.
* **Fil:** `actions/generate-feature-ideas.ts` (NY FIL)
* **Integration:** `actions/pilot-requests.ts` (i `updatePilotRequestStatus`, efter rad 296)
* **Logik:**
    1.  När en pilot request godkänns och organization skapas
    2.  Trigga `generateFeatureIdeas(orgId, enrichmentData)` asynkront
    3.  Funktionen hämtar organization och parsar `business_profile` (JSON string)
    4.  Anropar Gemini 2.0 Flash för att generera 3 feature ideas
    5.  Sparar resultaten i `feature_ideas` med `org_id`, status `suggested`, source `ai_initial`, complexity `null`
* **Action:** Körs asynkront ("fire and forget") så vi inte blockerar approval-flödet.

#### 9.5.3 ⚡ Frontend Logic (The Instant Load)
**Syfte:** Uppdatera onboarding-sidan att hämta statisk data istället för att generera.
* **Filer:** 
  - `app/onboarding/[orgId]/page.tsx` (Server Component)
  - `components/onboarding/onboarding-client.tsx` (Client Component)
  - `components/onboarding/prompt-starters.tsx` (Client Component)
* **Ändringar:**
    1.  **page.tsx:** Hämta feature ideas från DB med Server Component:
        ```typescript
        const { data: featureIdeas } = await supabase
          .from('feature_ideas')
          .select('*')
          .eq('org_id', orgId)
          .eq('status', 'suggested')
          .order('created_at', { ascending: true })
          .limit(3);
        ```
    2.  Skicka `featureIdeas` som props till `OnboardingClient` och vidare till `PromptStarters`
    3.  **prompt-starters.tsx:** Ta bort `useEffect` och loading states
    4.  *Fallback:* Om inga ideas finns, visa meddelande som hänvisar till chatten (ingen blocking error)

---

### 📝 Definition of Done
1.  Tabellen `feature_ideas` finns i databasen.
2.  När en ny Pilot Request godkänns (eller analyseras), dyker 3 rader upp i tabellen automatiskt.
3.  Onboarding-sidan laddar blixtsnabbt (<500ms TTFB) och visar dessa 3 rader.
4.  Inga ladd-snurror ("Skeleton loaders") för just korten behövs längre vid sidvisning.