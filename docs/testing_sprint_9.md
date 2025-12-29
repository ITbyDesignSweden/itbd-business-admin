# Testing Guide: Sprint 9 - The Onboarding Room

## 🧪 Förberedelser

### 1. Seeda SDR-prompter
Kör följande SQL för att lägga till de nya prompt-typerna:

```bash
# Från projektets root
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/seed_sdr_prompts.sql
```

Eller via Supabase Dashboard:
1. Gå till SQL Editor
2. Klistra in innehållet från `supabase/seed_sdr_prompts.sql`
3. Kör query

### 2. Verifiera miljövariabler
Kontrollera att följande finns i `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY=your_key
```

### 3. Hitta ett test-org ID
```sql
-- Kör i Supabase SQL Editor
SELECT id, name, business_profile 
FROM organizations 
LIMIT 5;
```

Kopiera ett `id` för testning.

## 🎯 Test Scenarios

### Test 1: Page Load & Header
**URL:** `/onboarding/[org-id]`

**Förväntat resultat:**
- ✅ Sidan laddas utan inloggning
- ✅ Header visar "ITBD" logo
- ✅ Header visar "Inloggad som [Företagsnamn]"
- ✅ Hero section visar "Välkommen, [Företagsnamn]"
- ✅ Two-column layout på desktop

**Om det misslyckas:**
- Kontrollera att org ID finns i databasen
- Kolla console för fel
- Verifiera att `getOrganizationForOnboarding()` returnerar data

---

### Test 2: AI-Genererade Prompt Starters
**Vad ska hända:**
1. Vänster kolumn visar "Kom igång"
2. Tre skeleton cards visas under laddning
3. Efter 1-3 sekunder ersätts de med AI-genererade förslag
4. Varje kort har:
   - Sparkles-ikon
   - Titel (kort, catchy)
   - Beskrivning (1-2 meningar)
   - Hover-effekt

**Förväntat resultat:**
- ✅ Loading state visas först
- ✅ 3 unika förslag genereras
- ✅ Förslagen är relevanta för företagets bransch
- ✅ Hover-effekt fungerar (border blir primary, chevron flyttas)

**Om det misslyckas:**
- Öppna DevTools Console
- Leta efter fel från `generatePromptStarters()`
- Kontrollera att `GOOGLE_GENERATIVE_AI_API_KEY` är satt
- Verifiera att SDR-prompter finns i `ai_prompts` tabellen

**Debug:**
```typescript
// I components/onboarding/prompt-starters.tsx
console.log('Prompt starters result:', result)
```

---

### Test 3: Click-to-Chat Integration
**Steg:**
1. Klicka på ett av de AI-genererade förslagen
2. Observera chat-komponenten till höger

**Förväntat resultat:**
- ✅ Förslagets prompt dyker upp som user message i chatten
- ✅ AI börjar svara (typing indicator visas)
- ✅ AI-svar streamar in ord för ord
- ✅ Chat scrollar automatiskt till botten

**Om det misslyckas:**
- Kontrollera att `onPromptClick` callback körs
- Verifiera att `initialPrompt` skickas till `SDRChat`
- Kolla att `/api/onboarding-chat` är tillgänglig

---

### Test 4: Chat Functionality
**Steg:**
1. Skriv ett meddelande i chat input
2. Tryck Enter eller klicka Send
3. Vänta på svar

**Förväntat resultat:**
- ✅ User message visas till höger (primary bakgrund)
- ✅ Input töms efter submit
- ✅ Loading indicator visas (tre bouncande prickar)
- ✅ AI-svar streamar in från vänster (secondary bakgrund)
- ✅ Svaret är på svenska
- ✅ Svaret är säljande men hjälpsamt

**Test-meddelanden:**
```
"Vi behöver hålla koll på våra fordon"
"Kan ni hjälpa oss med ett kundregister?"
"Vad kostar det att bygga en app?"
```

**Förväntat AI-beteende:**
- Ställer följdfrågor för att förstå behovet
- Föreslår konkreta lösningar
- Prissätter i krediter (1, 10, eller 30)
- Använder verksamhetsord, inte tekniska termer

---

### Test 5: Error Handling
**Scenario A: Ogiltigt Org ID**
- URL: `/onboarding/invalid-id-123`
- Förväntat: 404-sida med "Organisation hittades inte"

**Scenario B: AI-generering misslyckas**
- Simulera: Stäng av internet eller sätt fel API-nyckel
- Förväntat: Felmeddelande i prompt starters
- Chatten ska fortfarande fungera

**Scenario C: Chat API-fel**
- Simulera: Sätt fel `GOOGLE_GENERATIVE_AI_API_KEY`
- Förväntat: Error message i chatten

---

## 🔍 Console Logs att leta efter

### Lyckad körning:
```
=== Onboarding Chat Request ===
Org ID: [uuid]
Messages count: 2

=== SDR Prompt Built ===
Organization: [Företagsnamn]
Business Profile: [Beskrivning eller "Not set"]

🎯 Generating prompt starters for: [Företagsnamn]
✅ Prompt starters generated
📊 Token usage: { ... }
💡 Suggestions: Fordonskoll, Kundregister, Projektöversikt
```

### Fel att kolla efter:
```
Error fetching organization for starters: [error]
Error generating prompt starters: [error]
Onboarding Chat API Error: [error]
```

---

## 📊 Performance Checklist

- [ ] Sidan laddas på < 1 sekund
- [ ] Prompt starters genereras på < 3 sekunder
- [ ] Chat-svar börjar streama på < 1 sekund
- [ ] Inga layout shifts under laddning
- [ ] Smooth scroll i chat
- [ ] Responsiv design (testa mobile viewport)

---

## 🐛 Vanliga Problem & Lösningar

### Problem: "Organization hittades ej"
**Lösning:** 
- Kontrollera att org ID är korrekt
- Verifiera att `organizations_with_credits` view finns
- Kör: `SELECT * FROM organizations_with_credits WHERE id = '[org-id]'`

### Problem: Prompt starters laddar oändligt
**Lösning:**
- Kolla att `GOOGLE_GENERATIVE_AI_API_KEY` är satt
- Verifiera att SDR-prompter finns: `SELECT * FROM ai_prompts WHERE prompt_type LIKE 'sdr-%'`
- Kontrollera Gemini API quota

### Problem: Chat svarar inte
**Lösning:**
- Öppna Network tab i DevTools
- Kolla att `/api/onboarding-chat` returnerar 200
- Verifiera att response är en stream
- Kontrollera att `useChat` hook är korrekt konfigurerad

### Problem: Förslagen är generiska
**Lösning:**
- Uppdatera `business_profile` för organisationen
- Tweaka prompts i `seed_sdr_prompts.sql`
- Öka temperature (0.8 → 0.9) i `ai-sdr.ts`

---

## 🎨 Visual Regression Testing

### Desktop (1920x1080)
- [ ] Header är 1 rad
- [ ] Two-column layout
- [ ] Cards har hover-effekt
- [ ] Chat fyller höjden

### Tablet (768px)
- [ ] Header är responsiv
- [ ] Columns stackar
- [ ] Touch-friendly buttons

### Mobile (375px)
- [ ] Single column
- [ ] Chat är scrollbar
- [ ] Input är tillgänglig

---

## ✅ Sign-off Checklist

Innan du markerar Sprint 9 som klar:

- [ ] Alla 4 Definition of Done-punkter är verifierade
- [ ] Inga console errors
- [ ] Inga linter errors
- [ ] Responsiv design fungerar
- [ ] AI genererar relevanta förslag
- [ ] Chat conversation flödar naturligt
- [ ] Error states hanteras gracefully
- [ ] Performance är acceptabel (< 3s för starters)

---

**Happy Testing! 🚀**



