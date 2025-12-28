# Onboarding Room Components

**Sprint 9: The SDR Experience**

En komplett onboarding-upplevelse med AI-driven personalisering för att minimera tröskeln till start.

## 📁 Komponenter

### Server Components

#### `onboarding-header.tsx`
Minimalistisk header för onboarding-sidan.

**Props:**
- `companyName: string` - Företagsnamn att visa

**Features:**
- ITBD logo
- Företagsnamn i header
- Responsiv design

---

#### `onboarding-hero.tsx`
Personlig välkomsthälsning.

**Props:**
- `companyName: string` - Företagsnamn för personalisering

**Features:**
- Stor, välkomnande rubrik
- Subtitel med värdeproposition

---

### Client Components

#### `onboarding-client.tsx`
Client wrapper som hanterar state mellan prompt starters och chat.

**Props:**
- `orgId: string` - Organisation ID

**Ansvar:**
- State management för vald prompt
- Kommunikation mellan child components
- Layout för two-column grid

---

#### `prompt-starters.tsx`
AI-genererade förslag för att undvika "Blank Page Syndrome".

**Props:**
- `orgId: string` - Organisation ID för AI-generering
- `onPromptClick?: (prompt: string, title: string) => void` - Callback vid klick

**Features:**
- AI-generering med Gemini 2.0 Flash
- Skeleton loading states
- Error handling
- Hover effects
- Click-to-chat integration

**AI Integration:**
- Använder `generatePromptStarters()` från `actions/ai-sdr.ts`
- Genererar 3 branschanpassade förslag
- Baserat på organization's `business_profile`

**States:**
- `loading` - Visar skeleton cards
- `error` - Visar felmeddelande
- `loaded` - Visar AI-genererade förslag

---

#### `sdr-chat.tsx`
Full-featured chat interface med Vercel AI SDK.

**Props:**
- `orgId: string` - Organisation ID för context
- `initialPrompt?: string` - Initial prompt från starter card

**Features:**
- Real-time streaming med `useChat`
- Auto-scroll till nya meddelanden
- Typing indicator under loading
- Disabled state under processing
- Welcome message
- Responsive design

**AI Integration:**
- Anropar `/api/onboarding-chat`
- Streamar svar från Gemini 2.0 Flash
- SDR-fokuserad system prompt

**Message Types:**
- `user` - Kundens meddelanden (höger, primary)
- `assistant` - AI:ns svar (vänster, secondary)

---

## 🔄 Data Flow

```
User lands on /onboarding/[orgId]
    ↓
page.tsx (Server Component)
    ↓
Fetch organization data
    ↓
onboarding-client.tsx (Client Component)
    ├─→ prompt-starters.tsx
    │       ↓
    │   Call generatePromptStarters()
    │       ↓
    │   AI generates 3 suggestions
    │       ↓
    │   User clicks suggestion
    │       ↓
    │   onPromptClick(prompt, title)
    │       ↓
    └─→ sdr-chat.tsx
            ↓
        useChat receives initialPrompt
            ↓
        Sends to /api/onboarding-chat
            ↓
        AI streams response
```

## 🎨 Styling

Alla komponenter använder:
- Tailwind CSS för styling
- Shadcn/ui komponenter (Card, Button, Input, Avatar)
- CSS variables från `globals.css`
- Responsive design (mobile-first)

### Color Scheme
- **Primary:** Accent color för CTAs och hover states
- **Secondary:** Bakgrund för AI-meddelanden
- **Muted:** Text och borders
- **Background:** Sida bakgrund

### Spacing
- Container: `max-w-7xl mx-auto px-6`
- Grid gap: `gap-8`
- Card padding: `p-5`

## 🔧 Tekniska Detaljer

### Dependencies
```json
{
  "ai": "^6.0.3",
  "@ai-sdk/google": "^3.0.1",
  "@ai-sdk/react": "^3.0.3",
  "lucide-react": "latest"
}
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY=your_key
```

### API Routes
- `/api/onboarding-chat` - Chat streaming endpoint

### Server Actions
- `actions/onboarding.ts` - Fetch organization
- `actions/ai-sdr.ts` - Generate prompt starters

## 🧪 Testing

Se `docs/testing_sprint_9.md` för fullständig testguide.

**Quick Test:**
```typescript
// 1. Navigera till
/onboarding/[valid-org-id]

// 2. Verifiera
- Header visar företagsnamn
- 3 AI-förslag genereras
- Klick på förslag → prompt i chat
- Chat svarar på svenska
```

## 🚀 Performance

### Metrics
- **Initial Load:** < 1s (Server Component)
- **Prompt Generation:** 1-3s (AI processing)
- **Chat Response:** < 1s (streaming starts)

### Optimizations
- Server-side data fetching
- Streaming AI responses
- Lazy loading av chat messages
- Skeleton states för perceived performance

## 🔐 Security

### Public Route
- Ingen autentisering krävs
- Använder orgId som public identifier
- Service role key för Supabase access

### Rate Limiting
Implementeras i API route:
- 10 requests/minute per IP (chat)
- AI quota limits från Google

## 📝 Maintenance

### Updating Prompts
Prompter lagras i `ai_prompts` tabellen:
```sql
UPDATE ai_prompts 
SET content = 'new prompt...'
WHERE prompt_type = 'sdr-chat-system';
```

### Adding New Starter Types
1. Uppdatera `ai-sdr.ts` schema
2. Tweaka system/user prompts
3. Testa med olika branscher

### Monitoring
Loggar att följa:
- `🎯 Generating prompt starters for: [name]`
- `✅ Prompt starters generated`
- `📊 Token usage: {...}`
- `=== Onboarding Chat Request ===`

## 🐛 Troubleshooting

### Prompt starters laddar inte
1. Kontrollera `GOOGLE_GENERATIVE_AI_API_KEY`
2. Verifiera SDR-prompter i DB
3. Kolla API quota

### Chat svarar inte
1. Kontrollera `/api/onboarding-chat` endpoint
2. Verifiera organization finns
3. Kolla console för errors

### Förslagen är dåliga
1. Förbättra `business_profile` i DB
2. Uppdatera prompts i `ai_prompts`
3. Justera temperature i `ai-sdr.ts`

## 📚 Related Documentation

- `docs/sprint_9_implementation.md` - Implementation details
- `docs/testing_sprint_9.md` - Testing guide
- `docs/active_sprint.md` - Sprint overview
- `supabase/seed_sdr_prompts.sql` - Database seeds

---

**Maintainer:** IT by Design  
**Last Updated:** 2025-12-28  
**Version:** 1.0.0

