# Active Sprint: Dynamic Brain & Spec Generation (Sprint 3)

**Status:** 🟢 Planerad
**Startdatum:** 2025-12-28
**Fokus:** Gå från "Chatt" till "Leverans". Implementera dynamiska prompts i DB samt förmågan att generera tekniska specifikationer internt via Gemini 3.0 Flash.

---

## 🎯 Sprint Mål
1.  **Dynamisk Styrning:** Flytta System Prompt och instruktioner till databasen så vi kan tweaka "säljaren" utan att deploya kod.
2.  **The Silent Handover:** Implementera logiken där agenten skapar en formell `spec.md` för internt bruk, medan kunden bara får en orderbekräftelse.

---

## 📋 Backlog & Tasks

### 1. Database: Prompt Management (Dynamic Brain)
*Möjliggör styrning av AI:n via Admin Portalen.*

- [ ] **Migration:**
  - Skapa tabell `ai_prompts` (id, name, content, is_active).
  - Lägg till kolumn `custom_ai_instructions` (TEXT) på `organizations`-tabellen för kundspecifika regler.
- [ ] **Admin UI:**
  - Skapa enkel CRUD-sida `/admin/prompts` för att redigera och aktivera prompts.
  - Lägg till redigeringsfält för `custom_ai_instructions` på kundkortet.

### 2. Backend: Prompt Injection
*Uppdatera hjärnan att läsa från DB.*

- [ ] **Update `/api/chat`:**
  - Ersätt den hårdkodade prompten med en uppslagning mot `ai_prompts` (hämta den som är `active`).
  - Injicera `custom_ai_instructions` i kontexten om det finns för kunden.
  - Behåll en `FALLBACK_PROMPT` i koden som reserv.

### 3. The Spec Engine (Internal Gemini Tool)
*Agenten gör grovjobbet åt utvecklarna, dolt för kunden.*

- [ ] **Tool Definition:**
  - Skapa ett Vercel AI SDK verktyg: `submit_feature_request`.
  - Trigger: När kunden godkänner förslaget (t.ex. "Kör på det", "Beställ").
- [ ] **Server Action `generateInternalSpec`:**
  - Tar emot chatthistorik + nuvarande schema.
  - Gör ett **nytt, dolt anrop** mot **Gemini 3.0 Flash** med instruktionen: "Agera Technical Lead. Sammanfatta denna konversation till en teknisk kravspecifikation i Markdown för utvecklarna."
- [ ] **Delivery (Internal):**
  - Spara resultatet som en fil i Admin-databasen (t.ex. tabell `project_documents` med flaggan `internal_only: true`).
  - **Till Kunden:** Returnera endast ett trevligt svar: "Tack! Jag har skickat in önskemålet till utvecklingsteamet. Det syns nu i din orderhistorik."

---

## 🛠 Technical Notes

### SQL: Prompts Table
```sql
CREATE TABLE ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ADD COLUMN custom_ai_instructions text;
```

### Spec Generation (Hidden Implementation)
```typescript
// I verktygets execute-funktion:
// 1. Generera specen (Backend operation)
const { text: specContent } = await generateText({
  model: google('gemini-3.0-flash-preview'),
  system: 'Output strictly Markdown for Developers.',
  prompt: `Create tech spec from history: ${JSON.stringify(chatHistory)}`
});

// 2. Spara internt
await supabase.from('project_documents').insert({
  project_id: projectId,
  title: 'Auto-Spec: Feature Request',
  content: specContent,
  is_internal: true
});

// 3. Svara användaren
return "Tack! Jag har registrerat ditt önskemål. En utvecklare kommer att titta på detta inom kort.";
```