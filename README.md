# ITBD Admin Portal

Admin portal för IT by Design - en SaaS-plattform för att hantera kunder, krediter och projekt.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel

## Kom igång

### 1. Installera dependencies

```bash
npm install
```

### 2. Konfigurera Supabase

1. Skapa ett nytt projekt på [Supabase](https://supabase.com)
2. Kopiera `.env.local.example` till `.env.local`
3. Fyll i dina Supabase-credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Skapa databas-schema

Kör SQL-koden från `supabase/schema.sql` i Supabase SQL Editor:

1. Gå till Supabase Dashboard → SQL Editor
2. Kopiera innehållet från `supabase/schema.sql`
3. Kör SQL-koden

Detta skapar:
- `organizations` - Kundorganisationer
- `profiles` - Admin-användare
- `credit_ledger` - Kredittransaktioner
- `projects` - Beställningar/projekt
- RLS-policies för säkerhet

### 4. Skapa en admin-användare

1. Gå till Supabase Dashboard → Authentication → Users
2. Skapa en ny användare med email/password
3. (Valfritt) Lägg till en profil i `profiles`-tabellen

### 5. Starta utvecklingsservern

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Projektstruktur

```
/app
  /(dashboard)      # Skyddade admin-routes med sidebar
    /layout.tsx     # Dashboard layout med Sidebar + Header
    /page.tsx       # Dashboard-sida
  /login            # Publik inloggningssida
  /layout.tsx       # Root layout
  /globals.css      # Global CSS

/components
  /ui               # shadcn/ui primitiver (Button, Card, etc)
  /dashboard-header.tsx
  /sidebar.tsx
  /mobile-sidebar.tsx
  /kpi-cards.tsx
  /organizations-table.tsx
  /quick-actions.tsx

/lib
  /supabase         # Supabase clients
    /client.ts      # Browser client
    /server.ts      # Server client
    /middleware.ts  # Session refresh
  /types
    /database.ts    # TypeScript types för databas
  /utils.ts         # Helper-funktioner

/actions            # Server Actions
  /auth.ts          # Auth-actions (login, logout)
  /database.ts      # Databas-queries

/supabase
  /schema.sql       # Databas-schema
```

## Features

### ✅ Implementerat

- 🔐 Autentisering med Supabase Auth
- 📊 Dashboard med KPI-kort (MRR, Kunder, Pilots, Credits)
- 👥 Organisationslista med kreditsaldo
- 🎨 Modern UI med Tailwind + shadcn/ui
- 🌓 Dark/Light mode support
- 📱 Responsiv design (Desktop + Mobile)
- 🔒 Row Level Security (RLS) på alla tabeller

### 🚧 Kommande

- Detaljvy för organisationer
- Credit Ledger-sida
- Pilot Requests-hantering
- Projekthantering
- Inställningar
- Notifikationer

## Deployment

### Vercel

1. Pusha koden till GitHub
2. Importera projektet i Vercel
3. Lägg till environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Utvecklingsregler

Se `docs/tech_stack.md` för fullständiga tekniska riktlinjer.

### Viktiga principer

- **Server Components först:** Använd RSC för datahämtning
- **Server Actions för mutations:** Alla writes via Server Actions
- **Minimal client state:** Använd `"use client"` sparsamt
- **Behåll v0-design:** Ändra inte Tailwind-klasser utan anledning
- **TypeScript strict:** Alla filer måste vara strikt typade

## Support

För frågor eller problem, kontakta IT by Design-teamet.
