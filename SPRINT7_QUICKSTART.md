# Sprint 7: The SDR Brain - Quick Start Guide

**Status:** ✅ Implementerad  
**Datum:** 2025-01-28

---

## 🎯 Vad är nytt?

Sprint 7 introducerar **AI-driven lead research och kvalificering**. Systemet använder Google Search och Gemini AI för att automatiskt:

- 🔍 Söka upp företagsinformation (omsättning, anställda, bransch)
- 🎯 Bedöma hur väl leadet passar vår ICP (Ideal Customer Profile)
- 📊 Sätta en Fit Score (0-100) för varje lead
- 💾 Spara analysen i databasen för framtida användning

---

## 🚀 Snabbstart

### 1. Verifiera miljövariabel

Kontrollera att du har Google AI API-nyckel i `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here
```

**Saknar du nyckeln?**
1. Gå till [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Klicka "Create API Key"
3. Kopiera nyckeln till `.env.local`

### 2. Aktivera AI Enrichment

1. Starta dev-servern: `npm run dev`
2. Logga in på admin-portalen
3. Gå till **Settings** → **AI Enrichment**
4. Välj läge:
   - **Manual**: Du klickar "Analysera" manuellt
   - **Assist**: AI analyserar automatiskt, du godkänner manuellt (rekommenderat)
   - **Autopilot**: AI analyserar och godkänner automatiskt (experimentell)
5. Klicka **"Spara ändringar"**

### 3. Testa funktionen

**Manuell testning:**
1. Gå till `/apply`
2. Skicka in ett testlead (använd ett riktigt företagsnamn för bäst resultat)
3. Gå till `/pilot-requests`
4. Om **Manual mode**: Klicka "✨ Analysera"
5. Om **Assist mode**: Vänta 5 sekunder, ladda om sidan
6. Se Fit Score-badge i tabellen
7. Klicka på raden för att se full AI-analys

---

## 📁 Nya filer

```
actions/
  ├── analyze-lead.ts          # AI-analys Server Action
  └── system-settings.ts       # Settings management

components/
  ├── enrichment-settings.tsx  # Settings UI
  └── pilot-requests-table.tsx # Uppdaterad med Fit Score

docs/
  ├── sprint7_implementation_summary.md
  └── sprint7_testing_checklist.md
```

---

## 🛠 Modifierade filer

- `actions/pilot-requests.ts` - Automation hook
- `app/(dashboard)/settings/page.tsx` - Ny flik för AI Enrichment
- `components/pilot-requests-table.tsx` - Fit Score-kolumn och AI-analys-vy

---

## 🎨 UI-ändringar

### Pilot Requests-tabellen

**Ny kolumn: Fit Score**
- 🟢 80-100: High Fit (grön badge)
- 🟡 50-79: Medium Fit (gul badge)
- 🔴 0-49: Low Fit (röd badge)
- — : Ej analyserad (grå badge)

**Ny knapp: ✨ Analysera**
- Triggar manuell analys
- Visar "Analyserar..." under körning
- Toast-meddelande med resultat

**Expanderad vy:**
- AI-analys-sektion med:
  - Omsättning
  - Anställda
  - Bransch
  - Sammanfattning
  - Motivering för poäng

### Settings-sidan

**Ny flik: AI Enrichment**
- Enrichment-läge (Manual/Assist/Autopilot)
- Max leads per dag (säkerhetsgräns)
- Kostnadsinformation
- Förklaringstext för varje läge

---

## 🧠 Hur det fungerar

### 1. Lead kommer in via `/apply`

```typescript
// I submitPilotRequest action:
if (settings.enrichment_mode !== 'manual') {
  // Trigga analys i bakgrunden (fire-and-forget)
  analyzeLeadAction(newRequest.id)
}
```

### 2. AI analyserar leadet

```typescript
// I analyzeLeadAction:
const { output: analysis } = await generateText({
  model: google('gemini-1.5-flash', {
    useSearchGrounding: true // <-- Google Search aktiverad
  }),
  output: Output.object({
    schema: AnalysisSchema,
  }),
  prompt: contextualPrompt
})
```

### 3. Resultat sparas i databasen

```typescript
await supabase.from('pilot_requests').update({
  enrichment_data: analysis, // JSON med all data
  fit_score: analysis.fit_score // 0-100
})
```

### 4. Admin ser resultatet i UI

- Fit Score-badge i tabellen
- Full analys i expanderad vy
- Kan köra om analysen vid behov

---

## 💰 Kostnad

**Per lead-analys:**
- ~500-900 tokens (Gemini Flash)
- Google Search Grounding (liten extra kostnad)
- **Total: ~$0.01-0.02 per lead**

**Exempel:**
- 100 leads/månad = ~$1-2/månad
- 1000 leads/månad = ~$10-20/månad

**Tips:** Sätt `max_daily_leads` till en rimlig gräns för att undvika oväntade kostnader.

---

## 🔧 Troubleshooting

### "AI-tjänsten är inte korrekt konfigurerad"
- Kontrollera att `GOOGLE_GENERATIVE_AI_API_KEY` finns i `.env.local`
- Starta om dev-servern efter att ha lagt till nyckeln

### "Kunde inte analysera bolaget"
- Kontrollera att du har internetanslutning
- Verifiera att API-nyckeln är giltig
- Kolla console logs för felbeskrivning

### Fit Score visas inte
- Kontrollera att enrichment mode är "Assist" eller "Manual"
- Om "Assist": Vänta 5-10 sekunder efter lead submission
- Om "Manual": Klicka "Analysera"-knappen

### Analysen tar för lång tid
- Normal tid: 3-5 sekunder
- Om >10 sekunder: Kolla nätverksanslutning
- Google Search kan vara långsam ibland

---

## 📚 Mer information

- **Implementation Summary:** `docs/sprint7_implementation_summary.md`
- **Testing Checklist:** `docs/sprint7_testing_checklist.md`
- **Active Sprint:** `docs/active_sprint.md`

---

## 🎉 Resultat

Sprint 7 ger systemet:

✨ **Intelligens** - AI-driven lead-kvalificering  
⚡ **Automation** - Automatisk research i bakgrunden  
🎯 **Prioritering** - Visuell Fit Score för snabb bedömning  
💼 **Säljstöd** - Rikare kundprofiler från start  

**Tid sparad:** ~5-10 minuter per lead (manuell research)  
**Noggrannhet:** Baserat på realtidsdata från webben  
**Skalbarhet:** Kan hantera hundratals leads utan manuellt arbete  

---

**Frågor?** Kontakta teamet eller se dokumentationen ovan.

