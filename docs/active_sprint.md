# Active Sprint: The Cold Start (Sprint 4)

**Status:** 🟢 Planerad
**Startdatum:** 2025-12-30
**Fokus:** Automatisera insamlingen av kundinsikter. Från "Tomt blad" till "Full Profil" på sekunder via Web Scraping + AI Analys.

---

## 🎯 Sprint Mål
Att ge systemet "ögon". Vi ska bygga en funktion som utgår från kundens URL, skannar deras hemsida, och låter Gemini sammanställa en **Business Profile** automatiskt. Detta fyller `organizations.business_profile` utan att vi behöver lyfta ett finger.

---

## 📋 Backlog & Tasks

### 1. Database: Prep
*Säkerställa att vi har plats för datan.*

- [ ] **Migration (om det saknas):**
  - Kontrollera att `organizations` har kolumnen `website_url` (TEXT). Om inte, skapa den.
  - (Vi har redan `business_profile` från Sprint 2).

### 2. The Scraper (`lib/scraper.ts`)
*En enkel, robust funktion för att hämta råtext från webben.*

- [ ] **Installera:** `cheerio` (för att parsa HTML server-side).
- [ ] **Utility Function:**
  - `scrapeWebsite(url: string)`:
  - Ska göra en `fetch` mot URL:en.
  - Ska använda Cheerio för att extrahera relevant text (`p`, `h1-h6`, `meta description`).
  - Ska rensa bort "brus" (navigering, footers, scripts).
  - Returnera en ren textsträng (max ca 20k tecken).

### 3. The Analyst (AI Server Action)
*Hjärnan som tolkar datan.*

- [ ] **Server Action `enrichOrganizationProfile(orgId)`:**
  - 1. Hämta `website_url` från databasen.
  - 2. Kör `scrapeWebsite`.
  - 3. Anropa **Gemini 3.0 Flash** med prompt:
    *"Analysera denna hemsidetext. Sammanfatta bolagets verksamhet, bransch (SNI-kod om möjligt), och storlek till en kort 'Business Profile' på svenska. Formatet ska vara anpassat för att ge kontext till en sälj-AI."*
  - 4. Spara resultatet direkt till `organizations.business_profile`.

### 4. UI Integration (Admin Portal)
*Knappen som startar magin.*

- [ ] **Uppdatera `/organizations/[id]`:**
  - Lägg till en knapp: "✨ Auto-Enrich Profile" bredvid profil-fältet.
  - Visa en laddnings-indikator ("Scannar hemsida...") medan Server Action körs.
  - Uppdatera fältet automatiskt när det är klart.

---

## 🛠 Technical Notes

### Scraper Logic (Cheerio)
Vi behöver inte en tung browser (Puppeteer). Rå HTML räcker för textanalys.

```typescript
import * as cheerio from 'cheerio';

export async function scrapeWebsite(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ITBD-Bot/1.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Ta bort skräp för att spara tokens
    $('script, style, nav, footer, svg, button, form').remove();

    // Hämta text och städa whitespace
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Begränsa storleken så vi inte spränger context window (Gemini klarar mycket, men onödigt att skicka spam)
    return text.slice(0, 20000); 
  } catch (e) {
    console.error("Scrape failed", e);
    return null;
  }
}
```

### AI Prompt Strategy
```typescript
const prompt = `
INPUT: Text från bolagets hemsida.
TASK: Skapa en 'Business Persona' för detta bolag.
OUTPUT: En kort text (max 50-75 ord) som beskriver:
1. Vad de säljer/gör.
2. Vilken bransch de tillhör.
3. Deras troliga tekniska mognad (baserat på hur de beskriver sig).

TEXT: ${scrapedText}
`;
```