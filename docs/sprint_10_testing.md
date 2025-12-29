# Sprint 10: Testing Checklist

## 🧪 The SDR Brain & Closing Logic - Test Plan

### Förberedelser

**Database Setup:**
```sql
-- 1. Kör migration
\i supabase/migrations/20250129_link_pilot_requests_to_org.sql

-- 2. Verifiera att migration körts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pilot_requests' AND column_name = 'org_id';
```

**Start Dev Server:**
```bash
npm run dev
```

---

## Test 1: Memory - Manage Feature Ideas ✨

**Syfte:** Verifiera att agenten kan skapa, spara och avvisa idéer

### Setup
1. Skapa en ny pilot request via `/apply`
2. Godkänn den (skapar organization + feature_ideas)
3. Kopiera onboarding-länken med token
4. Öppna länken i incognito/privat läge

### Test Steps

#### 1.1 Create Feature Idea
**Input:** 
```
"Jag vill också ha en funktion för att skanna fakturor"
```

**Förväntat:**
- ✅ Agenten säger något som "Jag har lagt till 'Fakturanskanning' i din idélista"
- ✅ Ett success badge visas under meddelandet
- ✅ I databasen:
```sql
SELECT * FROM feature_ideas 
WHERE org_id = '<ORG_ID>' 
AND status = 'suggested' 
AND source = 'chat_agent';
```

#### 1.2 Save Feature Idea for Later
**Input:**
```
"Låter intressant men vi kan parkera det till senare"
```

**Förväntat:**
- ✅ Agenten använder `manage_feature_idea` med action='save'
- ✅ Status ändras till 'saved' i databasen

#### 1.3 Reject Feature Idea
**Input:**
```
"Fakturanskanning är inte relevant för oss"
```

**Förväntat:**
- ✅ Agenten använder action='reject'
- ✅ Status ändras till 'rejected'

---

## Test 2: Context Injection - Agentens Minne 🧠

**Syfte:** Verifiera att agenten känner till organisationen och befintliga idéer

### Test Steps

#### 2.1 Organization Context
**Input:**
```
"Vem pratar jag med?"
```

**Förväntat:**
- ✅ Agenten nämner företagsnamnet korrekt
- ✅ Refererar till verksamhetsbeskrivning om tillgänglig

#### 2.2 Feature Ideas Context
**Kontrollera att org har feature_ideas:**
```sql
SELECT id, title, status FROM feature_ideas WHERE org_id = '<ORG_ID>';
```

**Input:**
```
"Vilka idéer har vi pratat om?"
```

**Förväntat:**
- ✅ Agenten listar de 3 AI-genererade idéerna (från Sprint 9.5)
- ✅ Refererar till befintliga idéer med ID från context

---

## Test 3: Generate Proposal - The Artifact 🎨

**Syfte:** Verifiera att visuellt förslag genereras och renderas

### Test Steps

#### 3.1 Trigger Proposal Generation
**Input:**
```
"Vi vill bygga ett kundregister. Kan du göra ett förslag?"
[Chatta vidare tills ni är överens om scope]
"Låter bra, vi kör på det!"
```

**Förväntat:**
- ✅ Agent använder `generate_pilot_proposal` tool
- ✅ Ett visuellt kort (ProposalCard) visas istället för text
- ✅ Kortet innehåller:
  - Titel
  - Sammanfattning
  - Komplexitetsbadge (Small/Medium)
  - Lista med 3-7 features (med checkmarks)
  - Kostnad i krediter och SEK
  - Primary button: "Starta Pilotprojekt"

#### 3.2 Proposal Content Validation
**Verifiera att:**
- ✅ Complexity är antingen 'small' eller 'medium' (aldrig 'large')
- ✅ Estimated credits är 1-30
- ✅ Key features är minst 3 st

---

## Test 4: The Handshake - Conversion 🤝

**Syfte:** Verifiera fullständig lead-till-kund konvertering

### Pre-Check
```sql
-- Kontrollera initial state
SELECT id, name, email, status FROM organizations WHERE id = '<ORG_ID>';
SELECT id, title, status FROM projects WHERE org_id = '<ORG_ID>';
SELECT token, used_at FROM invitation_tokens WHERE org_id = '<ORG_ID>';
```

### Test Steps

#### 4.1 Accept Proposal
**Action:**
1. Klicka på "Starta Pilotprojekt" i ProposalCard
2. Vänta på loading state

**Förväntat i UI:**
- ✅ Button visar "Skapar projekt..." med spinner
- ✅ Success toast: "Pilotprojekt startat!"
- ✅ Kort visar success state: "Projekt startat! Kolla din e-post"

#### 4.2 Database Verification
```sql
-- 1. Project skapad
SELECT id, title, status, cost_credits, org_id
FROM projects 
WHERE org_id = '<ORG_ID>' 
AND status = 'active_pilot';

-- 2. Organization status uppdaterad
SELECT id, name, status 
FROM organizations 
WHERE id = '<ORG_ID>';
-- Förväntat: status = 'active_pilot'

-- 3. Token markerad som använd
SELECT token, used_at 
FROM invitation_tokens 
WHERE org_id = '<ORG_ID>';
-- Förväntat: used_at IS NOT NULL
```

#### 4.3 Auth Invitation Verification

**Kolla Supabase Dashboard:**
1. Gå till Authentication → Users
2. Hitta den nya användaren (email från organization)
3. Verifiera:
   - ✅ Status: "Invited" eller "Waiting for verification"
   - ✅ Email är korrekt
   - ✅ User metadata innehåller `org_id` och `org_name`

**Kolla E-post:**
4. Öppna mailbox för organization email
5. Verifiera:
   - ✅ Mail från Supabase mottaget
   - ✅ Subject: "Confirm your signup" eller liknande
   - ✅ Länk innehåller token
   - ✅ redirectTo pekar på rätt URL

#### 4.4 Full Flow Test
1. Klicka på länken i mailet
2. Sätt lösenord
3. Förväntat:
   - ✅ Redirect till `/onboarding/welcome` eller dashboard
   - ✅ Användaren är inloggad
   - ✅ Kan se sitt projekt

---

## Test 5: Error Handling 🚨

**Syfte:** Verifiera att felhantering fungerar korrekt

### Test Cases

#### 5.1 Invalid Token
**Action:** Modifiera token i URL:en (lägg till en bokstav)

**Förväntat:**
- ✅ 401 Unauthorized från API
- ✅ Användaren ser felmeddelande
- ✅ Chat laddar inte

#### 5.2 Expired Token
```sql
-- Sätt token som expired
UPDATE invitation_tokens 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE token = '<TOKEN>';
```

**Förväntat:**
- ✅ "Inbjudningslänken har gått ut"

#### 5.3 Missing Pilot Request Link
**Action:** Ta bort kopplingen manuellt: `UPDATE pilot_requests SET org_id = NULL WHERE org_id = '<ORG_ID>'`

**Förväntat:**
- ✅ Error: "Kunde inte hitta kontaktinformation för inbjudan"
- ✅ Project skapas EJ

#### 5.4 Duplicate Email
**Setup:** Skapa en user med samma email manuellt först

**Action:** Försök acceptera proposal

**Förväntat:**
- ✅ Error: "En användare med denna e-post finns redan"

---

## Test 6: Tool Invocation Rendering 🎨

**Syfte:** Verifiera att alla tool states renderas korrekt

### Test Matrix

| Tool | State | Förväntat UI |
|------|-------|--------------|
| manage_feature_idea | call | "Hanterar idélista..." spinner |
| manage_feature_idea | result (success) | Blue badge med checkmark + message |
| manage_feature_idea | result (error) | Inget (eller error badge) |
| generate_pilot_proposal | call | "Skapar förslag..." spinner |
| generate_pilot_proposal | result (success) | ProposalCard renderas |
| generate_pilot_proposal | result (error) | Inget kort visas |

---

## Test 7: Security Validation 🔒

**Syfte:** Verifiera att säkerhetsmekanismer fungerar

### Test Cases

#### 7.1 OrgId Derivation
**Kontrollera backend logs:**
```
Token validated, org_id: <UUID>
```

**Verifiera:**
- ✅ OrgId kommer från token validation
- ✅ OrgId används i tool closures
- ✅ Ingen orgId skickas från frontend

#### 7.2 Tool Security
**Försök manipulera:**
- Ändra idea_id i manage_feature_idea till en annan org
- Verifiera att DB-operationen inkluderar `.eq('org_id', orgId)`

**Förväntat:**
- ✅ Operation misslyckas för ideas från andra orgs
- ✅ Endast ideas för rätt org kan modifieras

---

## Regression Tests 🔄

**Syfte:** Säkerställ att befintlig funktionalitet inte brutits

### Checklist

- ☐ AI Architect chat fungerar fortfarande (`/projects/[id]`)
- ☐ Submit feature request tool fungerar i Architect
- ☐ Pilot request submission fungerar
- ☐ Organization creation från pilot request approval
- ☐ Feature ideas genereras fortfarande (Sprint 9.5)
- ☐ AI prompts kan skapas/editeras
- ☐ File attachments fungerar i chat

---

## Performance Tests ⚡

### Latency Checks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Chat API first response (TTFB) | < 2s | `Network tab` |
| Tool execution (manage_feature_idea) | < 1s | `Console logs` |
| Tool execution (generate_pilot_proposal) | < 3s | `Console logs` |
| AcceptProposal action | < 2s | `Network tab` |
| Auth invitation send | < 3s | `Backend logs` |

---

## Definition of Done ✅

Sprint 10 är godkänd när:

1. ☐ **Memory:** Kan säga "Vi behöver också BankID", och en ny rad skapas i `feature_ideas`
2. ☐ **Proposal:** När jag säger "Det låter bra, vi kör på det", renderas ett snyggt kort (inte text/JSON)
3. ☐ **Conversion:** Klick på "Starta" skapar projektet och skickar invite till min mail
4. ☐ **Security:** Försök att anropa `/api/onboarding-chat` utan giltig token returnerar 401
5. ☐ **Email:** Invitation mail kommer fram och fungerar
6. ☐ **No Regressions:** Alla regression tests passerar

---

## Debug Tips 🔧

### Chat API inte fungerar
```bash
# Kolla backend logs
tail -f .next/server.log

# Kolla Supabase logs
# Dashboard → Logs → API
```

### Tool exekveras inte
- Kolla att tool-namnet matchar exakt i route.ts
- Verifiera att orgId finns i closure
- Kontrollera Zod schema validation errors

### Proposal renderas inte
- Öppna React DevTools
- Hitta AIChatMessage component
- Kolla message.parts för tool-invocation
- Verifiera att toolName === 'generate_pilot_proposal'

### Auth invitation skickas ej
```sql
-- Kolla Supabase Auth logs i dashboard
SELECT * FROM auth.users WHERE email = '<EMAIL>';
```

- Verifiera SMTP settings i Supabase
- Kolla att email är valid
- Test i Supabase Studio manuellt först

---

**Lycka till med testningen! 🚀**

