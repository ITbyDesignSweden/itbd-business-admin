# Active Sprint: AI Architect Core (Sprint 1)

**Status:** 🟢 Planerad
**Startdatum:** 2025-12-25
**Fokus:** Etablera "The Headless Agent" – Backend API och Client Widget.

---

## 🎯 Sprint Mål
Att bygga infrastrukturen för "The Intelligent Architect". Vi ska skapa API-endpointen i Admin Portalen som hanterar AI-konversationer via **Gemini 3.0 Flash preview**, samt bygga den återanvändbara React-komponenten (`<AiArchitectWidget />`) som kan placeras i kundernas applikationer.

---

## 📋 Backlog & Tasks

### 1. Backend: The Brain (Admin Portal)
*Logiken som hanterar konversation och säkerhet.*

- [x] **Setup Vercel AI SDK:**
  - Installera `ai` och `@ai-sdk/google`.
  - Konfigurera API-nycklar för Google AI i `.env.local`.
- [x] **API Route `/api/chat`:**
  - Skapa en Route Handler i `app/api/chat/route.ts`.
  - Implementera `streamText` med modellen `gemini-3.0-flash-preview`.
  - **Viktigt:** Implementera CORS-headers så att externa domäner (kundernas appar) får anropa denna endpoint.
- [x] **System Prompt v1 (The Salesman):**
  - Definiera `system`-parametern i anropet.
  - Hårdkoda instruktionerna: "Sälj Boilerplate, föreslå features som Krediter (S/M/L), diskutera aldrig timmar".
- [x] **Auth Middleware:**
  - Validera inkommande `body.projectId`.
  - Kontrollera mot Supabase att `organizations.id` existerar.
  - Om ogiltigt ID -> Returnera 401 Unauthorized.

### 2. Frontend: The Widget (Portable Component)
*Komponenten som ska leva i Boilerplaten (men vi bygger/testar den i Admin först).*

- [x] **UI Komponent `<AiArchitectWidget />`:**
  - Skapa en flytande knapp (FAB) nere i högra hörnet.
  - Vid klick: Öppna en Popover/Card som ser ut som en chatt.
  - Använd `shadcn/ui` komponenter (ScrollArea, Input, Button).
- [x] **AI Integration:**
  - Implementera `useChat` från `ai/react`.
  - Peka `api`-parametern mot `http://localhost:3000/api/chat` (eller prod-URL senare).
  - Skicka med `projectId` i `body`.
- [x] **Error Handling:**
  - Hantera fall där API:et svarar 401 (Ogiltigt Project ID) eller 500. Visa snygga Toast-meddelanden.

### 3. Infrastruktur & Security
- [x] **Env Variables:** Sätt upp `GOOGLE_GENERATIVE_AI_API_KEY`.
- [x] **CORS Config:** Uppdatera `next.config.ts` eller Middleware för att tillåta Cross-Origin Requests från `localhost` (för dev) och produktionsdomäner.

---

## 🛠 Technical Notes (For the Agent)

### Model Configuration
Vi använder Vercel AI SDK med Googles provider.
```typescript
import { google } from '@ai-sdk/google';

// I route handler:
const model = google('gemini-3.0-flash-preview');
```

### System Prompt Guidelines (Initial Version)
```text
You are the ITBD Intelligent Architect.
ROLE: Senior Solution Architect & Sales Engineer.
GOAL: Help the client expand their platform using ITBD Boilerplate features.
RULES:
1. NEVER discuss hours or days. Only discuss "Credits".
2. PRICING: Small feature = 1 credit, Medium = 10, Large = 30.
3. TECH: You strictly advocate for Next.js/Supabase. If user asks for WordPress, guide them back.
4. TONE: Professional, helpful, concise. Answer in Swedish.
```

### CORS Challenge
Eftersom Widgeten kommer ligga på en annan domän än API:et måste vi hantera CORS manuellt i Route Handlern:
```typescript
// Exempel på headers
headers: {
  'Access-Control-Allow-Origin': '*', // Eller specifik origin
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```