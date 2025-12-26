# Sprint 4: The Cold Start - Implementation Summary ✅

**Status:** ✅ Implementerad  
**Datum:** 2025-12-27  
**Funktionalitet:** Google Search Grounding för automatisk företagsprofilering

---

## 📦 Vad som implementerats

### 1. Database Schema (Migrationer)

#### Migration 1: Lägg till `website_url`
**Fil:** `supabase/migrations/20250127_add_website_url.sql`

```sql
ALTER TABLE organizations
ADD COLUMN website_url TEXT;

COMMENT ON COLUMN organizations.website_url IS 'Company website URL for business profile research (e.g., itbydesign.se)';
```

#### Migration 2: Uppdatera VIEW
**Fil:** `supabase/migrations/20250127_update_view_with_website_url.sql`

Uppdaterar `organizations_with_credits` VIEW för att inkludera `website_url`.

**Instruktion:**  
1. Gå till Supabase Dashboard → SQL Editor
2. Kopiera innehållet från varje SQL-fil
3. Kör i ordning (migration 1 först, sedan migration 2)

---

### 2. TypeScript Types

**Fil:** `lib/types/database.ts`

Uppdaterad `Organization` interface:
```typescript
export interface Organization {
  // ... existing fields ...
  website_url: string | null  // ← NY KOLUMN
  business_profile: string | null
}
```

---

### 3. Server Action: AI-powered Profile Enrichment

**Fil:** `actions/enrich-organization.ts`

**Funktionalitet:**
- ✅ Hämtar organisation från databasen
- ✅ Använder **Gemini 3.0 Flash** med `useSearchGrounding: true`
- ✅ AI:n använder Google Search för att hitta företagsinformation
- ✅ Genererar svensk företagsprofil (verksamhet, bransch, målgrupp, storlek)
- ✅ Sparar automatiskt till `organizations.business_profile`
- ✅ Revaliderar cache med `revalidatePath()`

**Användning:**
```typescript
const result = await enrichOrganizationProfile(orgId);
if (result.success) {
  console.log(result.businessProfile);
}
```

---

### 4. UI Component: Business Profile Card

**Fil:** `components/business-profile-card.tsx`

**Funktionalitet:**
- ✅ Visar företagshemsida (website_url) med länk
- ✅ Visar AI-genererad business_profile
- ✅ Knapp: **"✨ Auto-Enrich Profile"** som kallar Server Action
- ✅ Laddningsindikator ("🔍 Söker på nätet...")
- ✅ Toast-meddelanden för feedback
- ✅ Redigera-dialog för att manuellt uppdatera website_url

**UI-texter (Svenska):**
- "Företagsprofil" (titel)
- "AI-genererad beskrivning för säljstöd" (beskrivning)
- "Auto-Enrich Profile" (knapp)
- "Söker på nätet..." (laddning)
- "Profil skapad!" (success)

---

### 5. Integration: Organizations Detail Page

**Fil:** `app/(dashboard)/organizations/[id]/page.tsx`

**Ändring:**
```tsx
import { BusinessProfileCard } from "@/components/business-profile-card"

// ...i return statement:
<BusinessProfileCard organization={organization} />
```

Placerad mellan **SaaS Instance Management** och **Projects Section**.

---

### 6. Backend Support: Instance Actions

**Fil:** `actions/instances.ts`

Uppdaterad för att stödja `website_url`:
```typescript
const instanceSchema = z.object({
  production_url: z.string().url().nullable().optional(),
  website_url: z.string().url().nullable().optional(),  // ← NY
  github_repo_url: z.string().url().nullable().optional(),
  supabase_project_ref: z.string().nullable().optional(),
})
```

---

## 🎯 Hur man använder funktionen

### Steg-för-steg:

1. **Gå till en organisation:**
   - Navigate till `/organizations/[id]`

2. **Lägg till företagshemsida (valfritt men rekommenderat):**
   - Klicka "Redigera hemsida" i Business Profile Card
   - Ange företagets officiella hemsida (t.ex. `https://itbydesign.se`)
   - Klicka "Spara ändringar"

3. **Generera profil automatiskt:**
   - Klicka på knappen **"✨ Auto-Enrich Profile"**
   - AI:n söker på Google efter företagsinformation
   - Efter ~5-10 sekunder visas den genererade profilen

4. **Uppdatera profil:**
   - Klicka på "Uppdatera profil" för att generera en ny beskrivning

---

## 🔧 Teknisk Implementation

### Google Search Grounding

**Så här fungerar det:**

```typescript
const { text } = await generateText({
  model: google('gemini-3.0-flash-preview', {
    useSearchGrounding: true  // ← Aktiverar Google Search
  }),
  system: 'Du är en affärsanalytiker...',
  prompt: `Skapa en företagsprofil för: ${orgName}...`
});
```

**Fördel:**
- ❌ Ingen manuell scraping behövs
- ✅ Google Search API integrerat direkt i modellen
- ✅ Realtidsdata från webben
- ✅ Automatisk faktagranskning

---

## 🧪 Testplan

### Manuell testning:

1. **Skapa testorganisation:**
   - Gå till `/organizations`
   - Klicka "Lägg till organisation"
   - Namn: "IT by Design"
   - Status: "Pilot"

2. **Lägg till hemsida:**
   - Gå till organisationens detaljvy
   - Business Profile Card → "Redigera hemsida"
   - URL: `https://itbydesign.se`

3. **Testa Auto-Enrich:**
   - Klicka "Auto-Enrich Profile"
   - Verifiera laddningsindikator visas
   - Verifiera att profil genereras (ca 5-10 sekunder)
   - Kontrollera att texten är på svenska
   - Kontrollera att informationen är relevant

4. **Testa utan hemsida:**
   - Skapa organisation utan website_url
   - Klicka "Auto-Enrich Profile"
   - Verifiera att AI:n ändå genererar en profil baserat på namnet

5. **Testa uppdatering:**
   - Klicka "Uppdatera profil" på befintlig profil
   - Verifiera att ny text genereras

---

## 📊 API Usage

### Token-kostnad (uppskattning):

- **Input:** ~300 tokens (prompt + system)
- **Output:** ~200-400 tokens (business profile)
- **Search Grounding:** Extra kostnad för Google Search-anrop
- **Total per enrichment:** ~500-700 tokens + search cost

**Modell:** `gemini-3.0-flash-preview`  
**Pris:** Låg kostnad (Flash-modell)

---

## ✅ Checklist för deployment

- [x] Database migrations skapad
- [x] TypeScript types uppdaterad
- [x] Server Action implementerad
- [x] UI Component skapad
- [x] Integration i detail page
- [x] Inga linter-fel
- [ ] **Kör migrationer i Supabase** (manuellt steg)
- [ ] Testa i development
- [ ] Deploy till production
- [ ] Testa i production

---

## 🔐 Environment Variables

**Kräver:**
```env
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

Detta är redan konfigurerat från tidigare sprints (AI Architect).

---

## 🎉 Resultat

Sprint 4 är nu **implementerad och redo för testning**. Funktionaliteten ger systemet:

✨ **"Ögon"** via Google Search  
🧠 **Intelligens** för att tolka företagsinformation  
⚡ **Automatisering** av manuell research  
💼 **Säljstöd** med rikare kundprofiler  

**Nästa steg:**  
1. Kör databasmigrationer (se ovan)
2. Testa funktionaliteten i development
3. Deploy till production

---

**Frågor?** Se `docs/active_sprint.md` för mer kontext.

