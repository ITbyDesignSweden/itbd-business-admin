# Active Sprint: The SDR Brain (Sprint 7)

**Status:** 🟢 Planerad
**Startdatum:** 2025-01-08
**Fokus:** AI-driven research och kvalificering. Vi kopplar på Google Search för att automatiskt berika inkomna leads med finansiell data och sätta en "Fit Score".

---

## 🎯 Sprint Mål
Att göra systemet intelligent. När ett lead kommer in (eller via knapptryck) ska AI:n söka upp bolaget, hitta omsättning/bransch, bedöma hur väl de passar vår ICP (Ideal Customer Profile) och spara resultatet i databasen.

---

## 📋 Backlog & Tasks

### 1. The Analyst Engine (Backend)
*Hjärnan som utför jobbet.*

- [ ] **AI Configuration:**
  - Säkerställ att `google-ai-sdk` (Vercel AI SDK) är uppsatt.
  - Verifiera att modellen (Gemini 1.5 Pro/Flash eller 2.0) har tillgång till `useSearchGrounding: true`.
- [ ] **Server Action: `analyzeLeadAction(requestId)`:**
  - 1. Hämta leadet från `pilot_requests` via ID.
  - 2. Hämta `system_settings` för att se om enrichment är påslaget.
  - 3. **AI-anrop:** Använd `generateText` med `output: object({ schema })` för strukturerad output. Instruktion: "Sök fakta om bolag X. Returnera JSON med omsättning, anställda, bransch."
  - 4. **Scoring:** AI:n ska sätta 0-100 poäng baserat på vår ICP.
  - 5. **Spara:** Uppdatera `pilot_requests` med resultatet i kolumnerna `enrichment_data` (JSON) och `fit_score` (Int).

### 2. Admin UI: Visualization
*Visa resultatet för admin.*

- [ ] **Update Pilot Request List (`/admin/pilot-requests`):**
  - Visa "Fit Score" som en "Badge" i tabellen:
    - 🟢 > 80 (High Fit)
    - 🟡 50-79 (Medium Fit)
    - 🔴 < 50 (Low Fit)
  - Lägg till en knapp: **"✨ Analysera"** på varje rad (för att köra analysen manuellt/omkörning).
- [ ] **Detail View (Tooltip/Expand):**
  - Visa AI:ns motivering (`reasoning`) när man hovrar över poängen eller klickar på raden.

### 3. Automation Hook (The Loop)
*Koppla ihop intaget med hjärnan.*

- [ ] **Update `submitPilotRequest` (från Sprint 6):**
  - Lägg till logik efter `insert`:
  - Kolla `system_settings.enrichment_mode`.
  - Om `assist` eller `autopilot` -> Trigga `analyzeLeadAction(id)` (utan att `await`:a svaret, så användaren slipper vänta).

---

## 🛠 Technical Notes

### The "Researcher" Implementation
Vi använder `generateText` med `output: object({ schema })` för att tvinga AI:n att svara med exakt den JSON-struktur vi behöver för databasen.

```typescript
// actions/analyze-lead.ts
'use server'
import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// 1. Schemat vi vill att AI ska fylla i
const AnalysisSchema = z.object({
  turnover_range: z.string().describe("Omsättningsintervall i SEK, t.ex. '10-20 MKR' eller 'Okänt'"),
  employee_count: z.string().describe("Antal anställda, t.ex. '15-20' eller 'Okänt'"),
  industry_sni: z.string().describe("Trolig bransch eller SNI-kod"),
  summary: z.string().describe("Kort beskrivning av verksamheten (max 2 meningar)"),
  fit_score: z.number().min(0).max(100).describe("Poäng 0-100 baserat på ICP"),
  reasoning: z.string().describe("Kort motivering till poängen (max 1 mening)")
});

export async function analyzeLeadAction(requestId: string) {
  const supabase = await createClient();
  
  // Hämta request
  const { data: req } = await supabase.from('pilot_requests').select('*').eq('id', requestId).single();
  if (!req) return;

  const prompt = `
    ROLL: Senior Affärsanalytiker.
    UPPGIFT: Analysera potentiell kund för SaaS-plattformen 'IT By Design'.
    
    KUND: ${req.company_name} (Org nr: ${req.org_nr || "Okänt"}).
    
    ICP (Ideal Customer Profile) - Ger höga poäng:
    - Bransch: Bygg, Transport, Handel, Konsult.
    - Storlek: 5-50 anställda.
    - Omsättning: > 5 MSEK.
    
    INSTRUKTION:
    1. Använd Google Search för att hitta fakta om bolaget (Allabolag, Hemsida, LinkedIn).
    2. Bedöm hur väl de passar profilen (Fit Score).
    3. Returnera endast JSON enligt schema.
  `;

  try {
    const { output: analysis } = await generateText({
      model: google('gemini-1.5-flash', {
        useSearchGrounding: true,          // <--- AKTIVERAR SÖKMOTORN
      }),
      output: Output.object({
        schema: AnalysisSchema,
      }),
      prompt: prompt,
    });

    // Spara till DB
    await supabase.from('pilot_requests').update({
      enrichment_data: analysis, // Sparar hela JSON-objektet
      fit_score: analysis.fit_score
    }).eq('id', requestId);

    return { success: true, data: analysis };
    
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return { success: false, error: "Kunde inte analysera bolaget." };
  }
}
```

### Automation Logic (Non-blocking)
För att inte göra formuläret långsamt för användaren:

```typescript
// I submitPilotRequest action:
// ... efter insert ...

const settings = await getSystemSettings(); // Hämta din singleton
if (settings.enrichment_mode !== 'manual') {
  // Kör analysen i bakgrunden (fire and forget)
  // Notera: I Vercel serverless kan detta dödas om funktionen avslutas direkt.
  // För 100% säkerhet, använd `waitUntil` (Next.js 15) eller Inngest/Cron.
  // För MVP funkar oftast detta om analysen är snabb:
  analyzeLeadAction(newRequestId).catch(err => console.error(err));
}
```