# Sprint 7: The SDR Brain - Testing Checklist

**Status:** ✅ Redo för testning  
**Datum:** 2025-01-28

---

## 🧪 Testplan

### Förberedelser

1. **Verifiera att dev-servern körs:**
   ```bash
   npm run dev
   ```

2. **Kontrollera att miljövariabeln finns:**
   - Öppna `.env.local`
   - Verifiera att `GOOGLE_GENERATIVE_AI_API_KEY` är satt
   - Om inte, hämta nyckel från [Google AI Studio](https://aistudio.google.com/app/apikey)

3. **Kontrollera databas:**
   ```sql
   -- I Supabase SQL Editor
   SELECT * FROM system_settings;
   ```
   - Ska returnera en rad med `id = 1`
   - `enrichment_mode` ska vara `manual`, `assist`, eller `autopilot`

---

## ✅ Test 1: AI Enrichment Settings UI

**Mål:** Verifiera att admin kan konfigurera enrichment-inställningar.

### Steg:
1. Logga in på admin-portalen
2. Navigera till `/settings`
3. Klicka på fliken **"AI Enrichment"**

### Förväntat resultat:
- ✅ Enrichment Settings-kortet visas
- ✅ Dropdown för "Enrichment-läge" med 3 alternativ:
  - Manual
  - Assist
  - Autopilot
- ✅ Input för "Max leads per dag"
- ✅ Förklaringstext för varje läge
- ✅ Kostnadsinformation visas längst ner
- ✅ "Spara ändringar"-knapp är disabled när inga ändringar gjorts

### Testfall 1.1: Ändra enrichment mode
1. Välj **"Assist"** i dropdown
2. Klicka **"Spara ändringar"**
3. Förväntat: Toast "Inställningar sparade"
4. Ladda om sidan
5. Förväntat: "Assist" är fortfarande valt

### Testfall 1.2: Ändra max daily leads
1. Ändra värdet till `50`
2. Klicka **"Spara ändringar"**
3. Förväntat: Toast "Inställningar sparade"
4. Ladda om sidan
5. Förväntat: Värdet är `50`

---

## ✅ Test 2: Manuell Lead-analys

**Mål:** Verifiera att admin kan analysera ett lead manuellt.

### Förberedelser:
1. Sätt enrichment mode till **"Manual"** i Settings
2. Skapa ett testlead via `/apply`:
   - Företagsnamn: "Byggservice Stockholm AB"
   - Kontaktperson: "Test Testsson"
   - E-post: "test@example.com"
   - Org.nr: "556123-4567" (valfritt)
   - Beskrivning: "Vi söker hjälp med IT-system"

### Steg:
1. Navigera till `/pilot-requests`
2. Hitta det nya leadet i tabellen
3. Verifiera att **Fit Score-kolumnen** visar "—" (ingen analys ännu)
4. Klicka på **"✨ Analysera"**-knappen

### Förväntat resultat:
- ✅ Knappen visar "Analyserar..." under 3-5 sekunder
- ✅ Toast: "Analyserar lead... AI:n söker information om Byggservice Stockholm AB"
- ✅ Efter ~3-5 sekunder: Toast "Analys klar! Fit Score: X/100"
- ✅ Sidan laddar om automatiskt
- ✅ Fit Score-kolumnen visar nu en färgkodad badge:
  - 🟢 (grön) om 80-100
  - 🟡 (gul) om 50-79
  - 🔴 (röd) om 0-49

### Testfall 2.1: Expandera rad och visa AI-analys
1. Klicka på raden med det analyserade leadet
2. Förväntat: Expanderad vy visas med:
   - **AI-analys-sektion** med lila Sparkles-ikon
   - Omsättning (t.ex. "10-20 MSEK")
   - Anställda (t.ex. "12-15")
   - Bransch (t.ex. "Bygg")
   - Fit Score
   - Beskrivning (2 meningar)
   - Motivering (lila box med italic text)

---

## ✅ Test 3: Automatisk Lead-analys (Assist Mode)

**Mål:** Verifiera att AI analyserar leads automatiskt när de kommer in.

### Förberedelser:
1. Sätt enrichment mode till **"Assist"** i Settings
2. Verifiera att inställningen sparats

### Steg:
1. Gå till `/apply`
2. Skicka in ett nytt lead:
   - Företagsnamn: "Nordic Transport AB"
   - Kontaktperson: "Anna Andersson"
   - E-post: "anna@nordictransport.se"
   - Beskrivning: "Vi behöver hjälp med digitalisering"
3. Efter formuläret skickas in, vänta 5 sekunder
4. Navigera till `/pilot-requests`

### Förväntat resultat:
- ✅ Leadet finns i tabellen
- ✅ Fit Score-kolumnen visar redan en badge (analysen har körts i bakgrunden)
- ✅ Ingen manuell klick på "Analysera" behövdes

### Testfall 3.1: Verifiera att analysen är korrekt
1. Klicka på raden för att expandera
2. Förväntat: AI-analys-data visas
3. Verifiera att informationen verkar rimlig:
   - Omsättning är antingen "Okänt" eller ett intervall
   - Anställda är antingen "Okänt" eller ett intervall
   - Bransch är relevant (t.ex. "Transport")
   - Motivering förklarar poängen

---

## ✅ Test 4: Omkörning av analys

**Mål:** Verifiera att admin kan köra om analysen på ett redan analyserat lead.

### Steg:
1. Gå till `/pilot-requests`
2. Hitta ett lead som redan har en Fit Score
3. Klicka på **"✨ Analysera"** igen

### Förväntat resultat:
- ✅ Analysen körs igen
- ✅ Fit Score kan ändras (AI kan ge olika svar beroende på nya data)
- ✅ Enrichment data uppdateras

---

## ✅ Test 5: Edge Cases

### Testfall 5.1: Företag som inte finns
1. Skapa ett lead med ett påhittat företagsnamn: "Nonexistent Company XYZ 123"
2. Analysera leadet
3. Förväntat:
   - AI:n returnerar "Okänt" för omsättning, anställda
   - Fit Score är låg (0-30)
   - Motivering: "Ingen information hittades"

### Testfall 5.2: Stort känt företag (utanför ICP)
1. Skapa ett lead med "Volvo AB"
2. Analysera leadet
3. Förväntat:
   - AI:n hittar korrekt info (stor omsättning, många anställda)
   - Fit Score är låg (0-40) pga för stort företag
   - Motivering: "För stort företag, utanför ICP"

### Testfall 5.3: Perfekt match
1. Skapa ett lead med ett medelstort byggföretag (t.ex. "Byggpartner i Stockholm AB")
2. Analysera leadet
3. Förväntat:
   - Fit Score är hög (80-100)
   - Motivering: "Perfekt match med ICP"

---

## ✅ Test 6: Integration med Godkännande-flödet

**Mål:** Verifiera att enrichment_data kopieras till organization vid godkännande.

### Steg:
1. Analysera ett lead (så att det har enrichment_data)
2. Klicka **"Godkänn"** på leadet
3. Navigera till `/organizations`
4. Hitta den nya organisationen
5. Klicka på organisationen för att se detaljsidan

### Förväntat resultat:
- ✅ Organisationen har skapats
- ✅ `business_profile` innehåller AI-analysen (JSON)
- ✅ Informationen visas på organisationens detaljsida (om UI stöder det)

---

## 🐛 Kända begränsningar

1. **Fire-and-forget i Vercel Serverless:**
   - I Assist-mode körs analysen i bakgrunden utan `await`
   - På Vercel kan funktionen avslutas innan analysen är klar
   - **Lösning:** Använd `waitUntil` (Next.js 15) eller Inngest/Cron för 100% säkerhet
   - **Nuvarande status:** Fungerar oftast eftersom Gemini Flash är snabb (~3-5 sek)

2. **Google Search Grounding kostnad:**
   - Varje analys gör ett Google Search-anrop
   - Kostnaden är liten men inte noll
   - **Rekommendation:** Sätt `max_daily_leads` till en rimlig gräns (t.ex. 50-100)

3. **AI-variabilitet:**
   - Samma lead kan få olika poäng vid olika analyser
   - Detta är normalt för LLM:er
   - **Rekommendation:** Använd Fit Score som vägledning, inte absolut sanning

---

## 📊 Success Criteria

Sprint 7 anses **godkänd** om:

- ✅ Settings UI fungerar och sparar inställningar
- ✅ Manuell analys fungerar (Manual mode)
- ✅ Automatisk analys fungerar (Assist mode)
- ✅ Fit Score-badges visas korrekt i tabellen
- ✅ AI-analys-data visas i expanderad vy
- ✅ Omkörning av analys fungerar
- ✅ Enrichment data kopieras vid godkännande
- ✅ Inga linter-fel eller runtime-errors

---

## 🚀 Nästa steg efter testning

1. **Deploy till production:**
   - Pusha koden till GitHub
   - Vercel deployar automatiskt
   - Sätt `GOOGLE_GENERATIVE_AI_API_KEY` i Vercel

2. **Aktivera Assist mode i production:**
   ```sql
   UPDATE system_settings SET enrichment_mode = 'assist' WHERE id = 1;
   ```

3. **Övervaka första veckan:**
   - Kolla Fit Score-distribution
   - Verifiera att AI:ns bedömningar är rimliga
   - Justera ICP-kriterier i prompten om nödvändigt

4. **Dokumentera learnings:**
   - Vilka branscher får högst poäng?
   - Finns det false positives/negatives?
   - Behöver prompten justeras?

---

**Lycka till med testningen! 🎉**

