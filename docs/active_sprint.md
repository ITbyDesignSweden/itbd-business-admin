# active_sprint.md

## 🏗️ Sprint 9: The SDR Experience

**Mål:** Skapa "Säljrummet" (The Onboarding Room) – en dedikerad, exklusiv landningssida där kunden landar efter en intresseanmälan. Fokus är på UX och AI-driven personalisering för att minimera tröskeln till start.

**Strategi:** "Experience First". Vi använder en öppen route (`/onboarding/[orgId]`) utan inloggning för att snabbt iterera på säljupplevelsen.

**Status:** 🏃 In Progress
**Startdatum:** 2025-12-28

---

### 📋 Tickets & Specs

#### 9.1 🏠 The Onboarding Room (Page Shell)
**Syfte:** Skapa ramen för säljupplevelsen som hämtar kundens kontext.
* **Fil:** `app/onboarding/[orgId]/page.tsx`
* **Data Action:** `actions/onboarding.ts` (Hämta `Organization` + parsa `business_profile` JSON).
* **UI Layout:**
    * **Header:** Minimalistisk. Endast ITBD-logo + Kundens företagsnamn.
    * **Hero Section:** Personlig hälsning ("Välkommen [Företag]..."). Använd `enrichment_data.industry` för att sätta kontext.
    * **Main Grid:** Två kolumner på desktop.
        * *Vänster:* Statisk info + Prompt Starters (Feature 9.2).
        * *Höger:* Full-height Chat Interface (Feature 9.3).
* **Tech:** Server Components. Hantera 404 om `orgId` ej finns.

#### 9.2 💡 Dynamic Prompt Starters (The Hook)
**Syfte:** Generera 3 unika, branschanpassade förslag på vad kunden kan bygga, för att undvika "Blank Page Syndrome".
* **Fil:** `actions/ai-sdr.ts` (Ny server action).
* **Logik (Server Side):**
    * Använd **Vercel AI SDK** (`generateObject`).
    * **Model:** Google Gemini 2.0 Flash.
    * **Input:** Kundens `business_profile` (från DB).
    * **Prompt:** "Du är en expert säljare. Baserat på denna kundprofil, föreslå 3 konkreta pilot-projekt de kan bygga på 1 dag."
    * **Output Schema (`zod`):**
        ```typescript
        z.object({
          suggestions: z.array(z.object({
            title: z.string(), // T.ex. "Fordonskoll"
            description: z.string(), // Säljande pitch (1 mening)
            prompt: z.string() // Texten som skickas till chatten vid klick
          }))
        })
        ```
* **UI Component:** `components/onboarding/prompt-starters.tsx`.
    * Använd `useSWR` eller `useEffect` för att hämta förslagen klient-sides (streaming) så sidan laddar snabbt.
    * Visa skeletons under laddning.
    * Vid klick: Skicka texten till Chat-komponenten (via prop eller context).

#### 9.3 💬 The SDR Chat Interface (UI Only)
**Syfte:** Gränssnittet där förhandlingen sker.
* **Fil:** `components/onboarding/sdr-chat.tsx`
* **Tech:** `useChat` från `ai/react`.
* **UI Specs:**
    * Ska fylla hela höjdutrymmet (flex-1).
    * Bubblor: Tydlig distinktion mellan "SDR Agent" och "Kund".
    * Input: Clean design, stöd för enter-to-send.
    * **Empty State:** Om inga meddelanden finns, visa en välkomnande text (eller låt 9.2 fylla utrymmet).
* **Backend Connect:** Koppla mot en enkel `api/chat`-route (vi implementerar den tunga "Brain"-logiken i Sprint 10, nu ska bara rören fungera).

---

### 📝 Definition of Done
1.  Jag kan gå till `/onboarding/[giltigt-org-id]`.
2.  Jag ser kundens namn i headern.
3.  Inom 2 sekunder dyker 3 skräddarsydda förslag upp (genererade av AI).
4.  Jag kan klicka på ett förslag -> Texten dyker upp i chatten -> Chatten svarar (även om svaret är enkelt just nu).