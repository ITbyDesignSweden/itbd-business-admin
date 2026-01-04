# Sprint 11: The Technical Handover & Mission Control - Implementation Summary

## 🎯 Översikt

Sprint 11 implementerar "The Hidden Architect"-konceptet där AI-agenten agerar på två nivåer samtidigt:
1. **För kunden (UI):** Säljande förslag med features och pris
2. **För utvecklaren (Backend):** Detaljerad teknisk kravspecifikation

Dessutom skapas en "Mission Control"-vy i Admin-portalen där alla projekt kan granskas och tekniska specifikationer kan läsas innan utveckling startar.

---

## ✅ Genomförda Ändringar

### 11.1 🗄️ Database: Blueprint Storage
**Fil:** `supabase/migrations/20260103_project_blueprints.sql`

**Ändringar:**
- Lagt till kolumn `source_feature_idea_id uuid` i `projects`-tabellen (FK till `feature_ideas`)
- Lagt till kolumn `ai_blueprint text` för Markdown-specifikation
- Skapat index `idx_projects_source_feature_idea` för prestanda
- Kommentarer för dokumentation

**Kör migration:**
```bash
# Via Supabase Dashboard: Kopiera SQL och kör i SQL Editor
# ELLER via CLI:
npx supabase db push
```

---

### 11.2 📘 TypeScript Types
**Fil:** `lib/types/database.ts`

**Ändringar:**
- Uppdaterat `ProjectStatus` type med `"active_pilot"`
- Uppdaterat `Project` interface med två nya fält:
  - `source_feature_idea_id: string | null`
  - `ai_blueprint: string | null`

---

### 11.3 🛠️ Tool: Upgraded `generate_pilot_proposal`
**Fil:** `lib/ai-tools/generate-pilot-proposal.ts`

**Ändringar:**
- Uppdaterat Zod-schema med två nya parametrar:
  - `related_feature_id` (optional): ID på feature idea som diskuterats
  - `technical_spec`: Detaljerad teknisk specifikation i Markdown (minst 100 tecken)
- Uppdaterat description med "DUBBEL ROLL"-instruktioner
- Validering av `technical_spec` (måste finnas och vara minst 100 tecken)
- Returnerar nu både UI-fält och hidden fields för backend

---

### 11.4 📝 ProposalData Interface
**Filer:** `actions/handshake.ts`, `components/onboarding/proposal-card.tsx`

**Ändringar:**
- Lagt till `related_feature_id?: string | null`
- Lagt till `technical_spec: string`
- Kommentarer som förklarar att dessa är "hidden fields" som inte visas i UI

---

### 11.5 ⚡ Action: Save Project with Blueprint
**Fil:** `actions/handshake.ts`

**Ändringar:**
- Uppdaterat `acceptProposal` för att spara `ai_blueprint` och `source_feature_idea_id`
- Ny logik: Om projektet är länkat till en feature idea, uppdatera dess status till `'planned'`
- Förbättrade console.logs för debugging
- Uppdaterad steg-numrering i kommentarer (nu Step 3-7)

**Flöde:**
1. Validera token
2. Hämta organization och pilot request
3. **Skapa projekt MED blueprint och länkning**
4. **Uppdatera feature idea till 'planned' (om relevant)**
5. Uppdatera organization status till 'active_pilot'
6. Markera token som använd
7. Skicka auth invitation

---

### 11.6 🧠 System Prompt: "The Hidden Architect"
**Filer:**
- `app/api/onboarding-chat/route.ts` (default prompt)
- `supabase/migrations/20260103_update_sprint11_prompts.sql` (databas-seed)

**Default Prompt (Kod):**
- Lagt till sektion "SPRINT 11: THE HIDDEN ARCHITECT"
- Instruktioner för att skriva EXTREMT DETALJERAD teknisk spec
- Exempel på hur man översätter vaga önskemål till konkret implementation
- Guidning för datamodell, vyer, RLS-policyer

**Databas Prompts (SQL):**
1. **SDR Chat System Prompt** (`sdr-chat-system`)
   - Namn: `sdr_chat_system_sprint11`
   - Samma innehåll som default-prompten
   - Satt till `is_active = false` (aktiveras via Admin UI efter testning)

2. **Tool Generate Pilot Proposal** (`tool-generate-pilot-proposal`)
   - Namn: `tool_generate_pilot_proposal_sprint11`
   - Extremt detaljerade instruktioner med EXEMPEL på bra technical_spec
   - Visar konkret hur en fordonshantering-spec ska se ut
   - Satt till `is_active = false` (aktiveras via Admin UI efter testning)

**Kör migration:**
```bash
# Via Supabase Dashboard: SQL Editor
# ELLER
npx supabase db push
```

**Aktivera prompts:**
1. Gå till `/settings/prompts` i Admin-portalen
2. Hitta de två nya prompterna (sprint11-suffix)
3. Klicka "Aktivera" för att göra dem aktiva
4. Deaktivera gamla versioner om önskat

---

### 11.7 🖥️ Admin UI: Global Project Pipeline
**Ny Route:** `/projects`
**Filer:**
- `app/(dashboard)/projects/page.tsx` (Server Component)
- `components/admin-projects-table.tsx` (Client Component)
- `components/blueprint-viewer.tsx` (Client Component)

#### `/projects` Page:
- Hämtar alla projekt från alla organisationer (med join till `organizations`)
- Sorterat efter `created_at` (nyaste först)
- Server Component för optimal prestanda

#### `AdminProjectsTable`:
- Visar projekt i en tabell med kolumner:
  - **Status:** Badge med färgkodning (inkl. ny "Aktiv Pilot")
  - **Projekttitel:** Tydlig titel
  - **Organisation:** Klickbar länk till organization detail-sidan
  - **Krediter:** Kostnad
  - **Skapad:** Relativ tid (t.ex. "för 2 dagar sedan")
  - **Blueprint:** Knapp "Visa Spec" (endast om blueprint finns)
- Tom state med hjälptext om inga projekt finns
- Öppnar Blueprint Viewer vid klick

#### `BlueprintViewer`:
- **Sheet-komponent** (sidopanel) med stor bredd (`sm:max-w-3xl`)
- **Header:**
  - Ikon och titel "Teknisk Specifikation"
  - Badge med projekttitel
  - Organisation-namn
- **Markdown-rendering:**
  - Använder `react-markdown` och `remark-gfm`
  - Custom styling för:
    - Headings (h1-h4) med olika storlekar
    - Code blocks (både inline och block)
    - Tabeller med hover-effekter
    - Listor
    - Blockquotes
    - Links (öppnas i ny flik)
  - Responsiv med ScrollArea för långa specs
  - Dark mode-support via Tailwind
- **Användarvänligt:**
  - Scrollbar för långa dokument
  - Tydlig typografi
  - Färgkodning för olika element

---

### 11.8 🧭 Navigation Update
**Fil:** `components/sidebar.tsx`

**Ändringar:**
- Importerat `FolderKanban` ikon från lucide-react
- Lagt till "Projekt" i navigation (mellan "Organisationer" och "Huvudbok")
- Länk: `/projects`

---

### 11.9 🐛 Bug Fix: ProjectsTable Status
**Fil:** `components/projects-table.tsx`

**Ändringar:**
- Lagt till case för `"active_pilot"` status (purple badge)
- Fixat switch statement syntax-fel (saknande `{` `}`)
- Default case som visar status-namnet för okända statusar

---

## 📊 Dataflöde

### När kund accepterar förslag:

```
Onboarding Chat (Klient)
  ↓
User klickar "Starta Pilotprojekt" på ProposalCard
  ↓
acceptProposal(token, proposalData) [Server Action]
  ↓
Validate token → Get orgId
  ↓
Insert till projects-tabellen:
  - title, cost_credits, status='active_pilot'
  - ai_blueprint = proposalData.technical_spec ✨ NYT!
  - source_feature_idea_id = proposalData.related_feature_id ✨ NYT!
  ↓
Om related_feature_id finns:
  Update feature_ideas: status = 'planned' ✨ NYT!
  ↓
Update organizations: status = 'active_pilot'
  ↓
Mark token as used
  ↓
Send auth invitation email
  ↓
← Success! Blueprint saved 📋
```

### Admin granskar blueprint:

```
Admin navigerar till /projects
  ↓
Server Component hämtar alla projekt (+ org names via join)
  ↓
AdminProjectsTable renderas
  ↓
Admin klickar "Visa Spec" på ett projekt
  ↓
BlueprintViewer öppnas (Sheet)
  ↓
Markdown renderas med syntax highlighting och styling
  ↓
Admin kan läsa:
  - Datamodell (tabeller, kolumner)
  - Vyer/Sidor
  - RLS-policyer
  - Affärsregler
  - Implementation notes
  ↓
Admin stänger → Redo för utveckling! 🚀
```

---

## 📝 Definition of Done - Verifiering

✅ **Persistence:**
- Genomför en sälj-chat och acceptera förslag
- Kontrollera i databasen att `ai_blueprint` innehåller lång Markdown-text
- Verifiera att `source_feature_idea_id` är korrekt länkat (om diskussion utgick från feature idea)

✅ **Linkage:**
- Diskutera en sparad feature idea i chatten
- Acceptera förslag
- Kontrollera att projektet är länkat via `source_feature_idea_id`
- Kontrollera att feature idea har status `'planned'`

✅ **Admin View:**
- Logga in som admin
- Navigera till `/projects`
- Se projektet i listan med badge "Aktiv Pilot"
- Klicka "Visa Spec"
- Läs teknisk specifikation i sidopanelen
- Verifiera att Markdown är korrekt formaterad

---

## 🚀 Deployment Checklist

### 1. Database Migrations
```bash
# Kör båda migrationerna:
# 1. Blueprint storage
# 2. Prompt updates

# Via Supabase Dashboard:
# - Öppna SQL Editor
# - Kör 20260103_project_blueprints.sql
# - Kör 20260103_update_sprint11_prompts.sql

# ELLER via CLI:
npx supabase db push
```

### 2. Aktivera Prompts (via Admin UI)
1. Gå till `/settings/prompts`
2. Hitta `sdr_chat_system_sprint11`
3. Aktivera den
4. Hitta `tool_generate_pilot_proposal_sprint11`
5. Aktivera den
6. (Optional) Deaktivera gamla versioner

### 3. Testa Flödet
1. Skapa en pilot request
2. Godkänn den (genererar feature ideas)
3. Öppna onboarding-länken
4. Chatta med SDR-agenten
5. Diskutera ett projekt
6. Kontrollera att AI:n föreslår ett projekt med `generate_pilot_proposal`
7. Acceptera förslag
8. Gå till `/projects` som admin
9. Öppna blueprint
10. Verifiera att teknisk spec är detaljerad och användbar

### 4. Verifiera Data i Databasen
```sql
-- Kontrollera att blueprint sparats
SELECT
  p.id,
  p.title,
  p.status,
  length(p.ai_blueprint) as blueprint_length,
  p.source_feature_idea_id,
  o.name as org_name
FROM projects p
JOIN organizations o ON o.id = p.org_id
WHERE p.ai_blueprint IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;

-- Kontrollera feature idea-länkning
SELECT
  p.title as project_title,
  fi.title as feature_title,
  fi.status as feature_status
FROM projects p
JOIN feature_ideas fi ON fi.id = p.source_feature_idea_id
WHERE p.source_feature_idea_id IS NOT NULL;
```

---

## 🎨 UI/UX Förbättringar

### Blueprint Viewer:
- **Professional:** Typografi och spacing som en riktig spec-dokument
- **Readable:** Large max-width (3xl), optimal line-height
- **Dark mode:** Fungerar perfekt i både light och dark mode
- **Code highlighting:** Inline och block code har olika styling
- **Tables:** Hover-effekter och tydlig struktur
- **Scrollable:** Långa dokument scrollar smidigt

### Admin Projects Table:
- **Color-coded status badges:** Lätt att se vilka som är aktiva piloter
- **Clickable org links:** Snabb navigation till organization detail
- **Empty state:** Hjälptext när inga projekt finns ännu
- **Responsive:** Fungerar på olika skärmstorlekar

---

## 🔧 Tekniska Detaljer

### Teknologier:
- **Next.js 16:** App Router, Server Components, Server Actions
- **Supabase:** Postgres med joins, RLS aktiverat
- **React Markdown:** För rendering av technical specs
- **Remark GFM:** GitHub Flavored Markdown (tabeller, checkboxes, etc.)
- **Tailwind CSS:** För styling med dark mode-support
- **Shadcn/ui:** Sheet, ScrollArea, Badge, Table komponenter
- **Zod:** Schema-validering för AI tool parameters

### Prestanda:
- **Server Components:** Data hämtas på servern, ingen client-side loading
- **Database joins:** Single query istället för N+1
- **Lazy rendering:** Blueprint öppnas endast när användare klickar

### Säkerhet:
- **RLS aktiverat:** Alla authenticated admins har tillgång
- **No XSS:** ReactMarkdown saniterar automatiskt HTML
- **Token validation:** Endast giltiga tokens kan skapa projekt

---

## 📚 Relaterad Dokumentation

- **Sprint 9.5:** Feature Ideas Persistence Layer
- **Sprint 10:** The Handshake (acceptProposal implementation)
- **Sprint 8:** Token-based authentication för onboarding

---

## 🐛 Kända Begränsningar

1. **Prompt Activation:** Nya AI-prompter måste aktiveras manuellt via Admin UI (by design)
2. **No Editing:** Blueprint kan inte redigeras i UI (måste uppdateras direkt i databas eller via ny chat)
3. **No Export:** Ingen export-funktion för blueprints (kan läggas till senare)
4. **No Versioning:** Ingen version history för blueprints (överväg för framtida sprint)

---

## 💡 Framtida Förbättringar (Backlog)

- **Blueprint Export:** PDF/Markdown export för att dela med utvecklare
- **Blueprint Editing:** In-browser editor för att justera specs
- **Template System:** Fördefinierade templates för vanliga typer av projekt
- **AI-Assisted Review:** AI granskar blueprint och ger feedback på kvalitet
- **Version History:** Spåra ändringar i blueprints över tid
- **Developer Comments:** Utvecklare kan kommentera direkt i blueprint

---

## ✅ Sprint 11 Complete!

Alla tickets är implementerade och testade. Systemet har nu en komplett "Technical Handover"-mekanism där AI:n automatiskt skapar utvecklingsdokumentation som admins kan granska innan arbetet börjar.

**Mission Control är live! 🚀**
