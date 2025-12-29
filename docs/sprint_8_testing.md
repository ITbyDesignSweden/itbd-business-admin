# Sprint 8: Testing Guide

## 🧪 Testplan för Token-baserad Onboarding

### Förberedelser

1. **Kör migrationen:**
```bash
npx supabase db push
```

2. **Starta utvecklingsservern:**
```bash
npm run dev
```

---

## Test 1: Generera Inbjudningslänk ✅

**Steg:**
1. Logga in som admin
2. Navigera till `/organizations`
3. Klicka på en organisation
4. Klicka på knappen "Skapa Inbjudningslänk"
5. Klicka på "Generera Länk"
6. Verifiera att en URL visas
7. Klicka på kopiera-knappen

**Förväntat resultat:**
- ✅ Dialog öppnas
- ✅ Länk genereras (format: `/onboarding?token=<uuid>`)
- ✅ Toast-meddelande: "Inbjudningslänk skapad!"
- ✅ Länk kopieras till urklipp
- ✅ Toast-meddelande: "Länk kopierad!"

---

## Test 2: Öppna Onboarding-rum med Giltig Token ✅

**Steg:**
1. Kopiera länken från Test 1
2. Öppna inkognito-fönster
3. Klistra in länken
4. Navigera till sidan

**Förväntat resultat:**
- ✅ Sidan laddas utan fel
- ✅ Företagsnamn visas korrekt
- ✅ AI-chatten är tillgänglig
- ✅ Feature ideas visas (om de finns)
- ✅ Ingen org_id syns i URL:en

---

## Test 3: Persistence - Ladda Om Sidan ✅

**Steg:**
1. Från Test 2, tryck F5 för att ladda om
2. Eller navigera bort och tillbaka

**Förväntat resultat:**
- ✅ Sidan laddas igen utan problem
- ✅ Samma data visas
- ✅ Chat-historik finns kvar (localStorage)

---

## Test 4: AI-Chat med Token ✅

**Steg:**
1. I onboarding-rummet, skriv ett meddelande i chatten
2. Skicka meddelandet
3. Vänta på svar

**Förväntat resultat:**
- ✅ Meddelandet skickas
- ✅ AI svarar med relevant information om företaget
- ✅ Inga fel i konsolen
- ✅ Backend-loggar visar "Token validated, org_id: <id>"

---

## Test 5: Ogiltig Token ❌

**Steg:**
1. Navigera till `/onboarding?token=00000000-0000-0000-0000-000000000000`
2. (Eller någon annan ogiltig UUID)

**Förväntat resultat:**
- ✅ Felmeddelande visas: "Ogiltig inbjudningslänk"
- ✅ Ingen data laddas
- ✅ Ingen crash

---

## Test 6: Saknad Token ❌

**Steg:**
1. Navigera till `/onboarding` (utan query parameter)

**Förväntat resultat:**
- ✅ 404-sida visas

---

## Test 7: Gammal Route Blockerad 🚫

**Steg:**
1. Försök navigera till `/onboarding/[någon-org-id]`
2. (Använd ett riktigt org_id från databasen)

**Förväntat resultat:**
- ✅ 404-sida visas
- ✅ Ingen data exponeras

---

## Test 8: Utgången Token ⏰

**Steg:**
1. I databasen, uppdatera en token:
```sql
UPDATE invitation_tokens 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE token = '<din-token>';
```
2. Försök öppna länken

**Förväntat resultat:**
- ✅ Felmeddelande: "Inbjudningslänken har gått ut"

---

## Test 9: Security - Token Manipulation 🔒

**Steg:**
1. Öppna Developer Tools → Network tab
2. Öppna en giltig onboarding-länk
3. Skicka ett meddelande i chatten
4. Inspektera request till `/api/onboarding-chat`
5. Försök modifiera request body för att lägga till `orgId` med ett annat ID

**Förväntat resultat:**
- ✅ Backend ignorerar eventuell `orgId` i body
- ✅ Backend använder endast `token` för att härleda org_id
- ✅ AI svarar om rätt företag (det som token pekar på)

---

## Test 10: Frontend Code Inspection 🔍

**Steg:**
1. Öppna Developer Tools → Sources/Debugger
2. Sök efter `org_id` eller `orgId` i client-side kod
3. Inspektera komponenter under `/onboarding`

**Förväntat resultat:**
- ✅ Ingen `org_id` finns i client components
- ✅ Endast `token` skickas mellan komponenter
- ✅ Ingen möjlighet att manipulera vilket företag som visas

---

## Test 11: Multiple Tokens per Organization ♻️

**Steg:**
1. Generera en inbjudningslänk för en organisation
2. Generera en till länk för samma organisation
3. Öppna båda länkarna i olika fönster

**Förväntat resultat:**
- ✅ Båda länkarna fungerar
- ✅ Båda visar samma företag
- ✅ Tokens är olika (olika UUID:er)

---

## Test 12: Copy-to-Clipboard i Olika Browsers 📋

**Steg:**
1. Testa kopiera-funktionen i:
   - Chrome/Edge
   - Firefox
   - Safari (om tillgänglig)

**Förväntat resultat:**
- ✅ Länk kopieras korrekt i alla browsers
- ✅ Toast-meddelande visas

---

## 🐛 Debugging Tips

### Om migrationen misslyckas:
```bash
# Kolla status
npx supabase migration list --local

# Kolla Supabase-loggar
npx supabase logs --local
```

### Om token-validering misslyckas:
- Kontrollera att `SUPABASE_SERVICE_ROLE_KEY` finns i `.env.local`
- Kolla backend-loggar i terminalen
- Verifiera att RLS är aktiverad på `invitation_tokens`

### Om AI-chatten inte fungerar:
- Öppna Network tab och kolla request till `/api/onboarding-chat`
- Verifiera att `token` finns i request body
- Kolla backend-loggar för valideringsfel

---

## ✅ Acceptance Criteria

Alla dessa måste vara uppfyllda:

- [ ] Test 1-4: Fungerar perfekt (happy path)
- [ ] Test 5-7: Felhantering fungerar korrekt
- [ ] Test 8: Utgångna tokens blockeras
- [ ] Test 9: Säkerheten är intakt (ingen manipulation möjlig)
- [ ] Test 10: Ingen org_id läcker till frontend
- [ ] Test 11-12: Edge cases hanteras

---

## 📊 Performance Check

Kör dessa för att säkerställa att inga performance-regressioner införts:

```bash
# Lighthouse audit på onboarding-sidan
npm run build
npm run start
# Öppna Chrome DevTools → Lighthouse → Run audit
```

**Mål:**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

---

## 🎉 När Alla Tester Passerar

1. Commit alla ändringar
2. Skapa PR med referens till Sprint 8
3. Merga till main
4. Deploy till production
5. Skicka ut nya inbjudningslänkar till befintliga pilotkunder
6. Uppdatera dokumentation
7. Fira! 🎊


