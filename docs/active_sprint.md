# Active Sprint: AI Context Awareness (Sprint 2)

**Status:** ✅ Slutförd
**Startdatum:** 2025-12-26
**Slutdatum:** 2025-12-26
**Fokus:** Ge agenten "minne" och kontext genom realtids-injektion av kunddata och schema.

---

## 🎯 Sprint Mål
Att göra agenten medveten om vem den pratar med och hur deras system ser ut just nu. Vi implementerar en mekanism där **Business Profile** hämtas från Admin DB (centralt), men **Tekniskt Schema** skickas med dynamiskt från klienten (lokalt) för 100% träffsäkerhet.

---

## 📋 Backlog & Tasks

### 1. Database: Business Profile (Admin Portal)
*Vi skapar "behållaren" för affärsinsikter.*
- [x] **Migration:** Lägg till `business_profile` (TEXT) i tabellen `organizations`.
- [x] **UI:** Lägg till ett redigeringsfält (Textarea) för detta i `/organizations/[id]`.
  - *Syfte:* Möjliggör manuell input nu (och automatisk input i Sprint 4).

### 2. Client Feature: Schema Introspection (Boilerplate-kod)
*Koden som ska leva i kundens app för att läsa av sig själv.*
- [x] **Server Action `getSchemaContext()`:**
  - Skriv en SQL-query mot `information_schema.columns`.
  - Returnera en förenklad stränglista: `Table: users (id, email...), Table: projects (id, title...)`.
  - **Cache:** Implementera enkel caching (t.ex. `unstable_cache`) så vi inte belastar DB vid varje chat-meddelande.

### 3. Frontend Update: The Widget
- [x] **Payload Update:** Uppdatera `<AiArchitectWidget />` att anropa `getSchemaContext()` vid start.
- [x] **API Call:** Skicka med schemat i `body`-parametern (`req.body.schema`) till `/api/chat`.

### 4. Backend: Context Synthesis (`/api/chat`)
*Hjärnan som lägger ihop pusslet.*
- [x] **Data Fetching:**
  - Hämta `Business Profile` & `Credits` från Admin DB (baserat på `projectId`).
- [x] **Prompt Engineering:**
  - Sätt ihop System Prompten dynamiskt:
    1.  "Du pratar med [Org Name]. Verksamhet: [Business Profile]."
    2.  "Här är deras nuvarande databasstruktur: [Inkommande Schema]."
    3.  "Saldo: [X] krediter."

---

## 🛠 Technical Notes

### SQL for Introspection
```sql
-- Hämtar alla publika tabeller och kolumner
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### Prompt Template Idea
```typescript
const systemPrompt = `
ROLE: ITBD Architect.
CONTEXT:
- Client: ${org.name}
- Business: ${org.business_profile || "Okänd verksamhet"}
- Credits: ${credits}

DATABASE SCHEMA (Current State):
${schemaFromClient}

INSTRUCTIONS:
- Use the schema to suggest real table names.
- Suggest features relevant to their Business Profile.
`;
```