# AI Architect Implementation Guide (v2.1)

## Översikt
Detta dokument beskriver implementationen av **"The Intelligent Architect"** – en AI-driven försäljnings- och lösningsarkitekt som hjälper kunder att planera och prisera nya funktioner i deras Boilerplate-instanser.

**Senast uppdaterad:** 2025-12-25
**Status:** ✅ Verifierad för React 19.2 + Vercel AI SDK v4
**Model:** Google Gemini 2.0/3.0 Flash via Vercel AI SDK

---

## 🏗 Arkitektur

### Backend (Headless API)
- **Endpoint:** `POST /api/chat`
- **AI Provider:** `@ai-sdk/google` (Gemini)
- **Logik:** Validerar `projectId` mot Supabase `organizations`-tabell innan AI-generering påbörjas.
- **CORS:** Konfigurerad för att tillåta anrop från externa kunddomäner.

### Frontend (Portable Widget)
- **Komponent:** `<AiArchitectWidget />`
- **Bibliotek:** `@ai-sdk/react` (Använder `useChat`-hooken)
- **UI:** Flytande knapp (FAB) med Popover-interface byggt på shadcn/ui.

---

## 📦 Installerade Paket

**Viktigt:** För att undvika versionskonflikter med React 19.2 måste installationen ske med `--legacy-peer-deps`.

```bash
npm install ai@latest @ai-sdk/react@latest @ai-sdk/google@latest --legacy-peer-deps
```

**Kritiska beroenden:**
- `ai`: Kärnfunktionalitet för streaming.
- `@ai-sdk/react`: Moderna React-hooks (Ersätter gamla `ai/react`).
- `@ai-sdk/google`: Adapter för Google Gemini.
- `lucide-react`: För ikoner.

---

## 🔧 Kod-implementation (Kritiska delar)

### 1. Frontend: useChat-initiering
För att undvika `TypeError: Cannot read properties of undefined (reading 'trim')` vid första renderingen, måste `input` initieras.

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: apiUrl,
  initialInput: '', // Förhindrar undefined-fel
  body: {
    projectId: projectId, // Skickas till backend för auth
  },
});
```

### 2. Backend: System Prompt
AI:n är instruerad med följande personlighet:
- **Roll:** Senior lösningsarkitekt hos ITBD.
- **Prissättning:** Aldrig tid/pengar, endast **Krediter** (1, 10, eller 30).
- **Teknik:** Förespråka Next.js, Supabase, Tailwind.
- **Språk:** Svenska.

---

## 🚀 Deployment & Användning

### I Kundapplikation (Boilerplate)
Kopiera widget-filen till kundprojektet och rendera den i `layout.tsx`:

```typescript
import { AiArchitectWidget } from '@/components/ai-architect-widget';

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>
        {children}
        <AiArchitectWidget 
          projectId="CUSTOMER_ORG_UUID"
          apiUrl="[https://your-admin-portal.vercel.app/api/chat](https://your-admin-portal.vercel.app/api/chat)"
        />
      </body>
    </html>
  );
}
```

---

## 🔐 Säkerhet & Felhantering

- **Auth:** API-routen kollar om `projectId` existerar i databasen. Om inte, returneras `401 Unauthorized`.
- **CORS:** Hanterar preflight-anrop (`OPTIONS`) för att tillåta cross-origin requests.
- **Error States:** Widgeten fångar upp 401/500-fel och visar användarvänliga meddelanden via Toasts.

---

## 📁 Filstruktur

```text
app/
  api/
    chat/
      route.ts            # Backend (CORS, Auth, Gemini)
components/
  ai-architect-widget.tsx # Frontend (shadcn/ui + useChat)
docs/
  ai_architect_guide.md   # Denna guide
```

---

## 📝 Changelog

### 2025-12-25 (v2.1)
- 🛠 **Fix:** Migrerat från `ai/react` till `@ai-sdk/react` för React 19-kompatibilitet.
- 🛠 **Fix:** Löst krasch i `input.trim()` genom `initialInput: ''`.
- 🛠 **Fix:** Uppdaterat installationsinstruktioner med `--legacy-peer-deps`.
- ✅ **Verifierat:** Testat i Cursor med Claude 3.5/4.5 Sonnet.

---
*Dokumentet skapat i samarbete med Gemini & Cursor Agent.*