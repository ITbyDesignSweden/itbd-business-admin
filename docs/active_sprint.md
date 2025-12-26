# Active Sprint: The Cold Start (Sprint 4)

**Status:** 🟢 Planerad
**Startdatum:** 2025-12-30
**Fokus:** Automatisera kundinsikter. Ersätt manuell scraper med **Google Search Grounding** för att skapa en rikare företagsprofil automatiskt.

---

## 🎯 Sprint Mål
Att ge systemet "ögon" via Googles index. Vi ska bygga en funktion som tar kundens namn/url och låter Gemini använda **Google Search** för att sammanställa en komplett **Business Profile** (Verksamhet, SNI-kod, Storlek) och spara ner det i databasen.

---

## 📋 Backlog & Tasks

### 1. Database: Prep
*Säkerställa att vi har plats för datan.*

- [ ] **Migration (om det saknas):**
  - Kontrollera att `organizations` har kolumnen `website_url` (TEXT).
  - (Vi har redan `business_profile` från Sprint 2).

### 2. The Analyst (AI Server Action)
*Hjärnan som söker och tolkar (Nu utan scraper).*

- [ ] **Uppdatera `ai/google-provider`:**
  - Aktivera `useSearchGrounding: true` i Vercel AI SDK-konfigurationen (eller via Google AI Studio settings om vi använder API-nyckel direkt).
- [ ] **Server Action `enrichOrganizationProfile(orgId)`:**
  - 1. Hämta `name` och `website_url` från databasen.
  - 2. Anropa **Gemini 3.0 Flash** med prompt:
    *"Använd Google Search för att hitta information om bolaget [NAMN] (Webb: [URL]). Sammanfatta deras verksamhet, bransch och målgrupp till en kort 'Business Profile' på svenska. Formatet ska vara säljstödjande."*
  - 3. Spara resultatet direkt till `organizations.business_profile`.

### 3. UI Integration (Admin Portal)
*Knappen som startar magin.*

- [ ] **Uppdatera `/organizations/[id]`:**
  - Lägg till en knapp: "✨ Auto-Enrich Profile" bredvid profil-fältet.
  - Visa laddnings-indikator ("Söker på nätet...") medan AI jobbar.
  - Uppdatera fältet automatiskt när det är klart.

---

## 🛠 Technical Notes

### Implementation med Vercel AI SDK (Google Provider)
Vi behöver ingen scraper. Vi använder verktyget som redan finns i modellen.

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function enrichOrganization(orgName: string, websiteUrl: string) {
  
  const { text } = await generateText({
    model: google('gemini-3.0-flash-preview', {
      useSearchGrounding: true // <-- MAGIN HÄNDER HÄR
    }),
    system: 'Du är en affärsanalytiker. Använd Google Search för att verifiera fakta.',
    prompt: `Skapa en företagsprofil för: ${orgName}. Hemsida: ${websiteUrl}.
             Inkludera:
             1. Verksamhetsbeskrivning (Vad säljer de?)
             2. Trolig SNI-kod/Bransch.
             3. Storlek (om tillgängligt).
             Svara kortfattat på svenska.`
  });

  return text;
}