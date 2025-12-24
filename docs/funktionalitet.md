# Funktionalitetsöversikt - ITBD Business Admin

**Uppdaterad:** 2025-12-24  
**Version:** 1.0  
**System:** IT by Design Admin Portal

---

## 📋 Innehållsförteckning
1. [Introduktion](#introduktion)
2. [Arkitektur & Teknisk Stack](#arkitektur--teknisk-stack)
3. [Huvudfunktioner](#huvudfunktioner)
4. [Databasmodell](#databasmodell)
5. [Användargränssnitt](#användargränssnitt)
6. [API & Integrationer](#api--integrationer)
7. [Automatisering](#automatisering)
8. [Säkerhet](#säkerhet)

---

## Introduktion

ITBD Business Admin är en modern SaaS-administrationsportal byggd för IT by Design Sweden AB. Systemet stödjer företagets "Productized Service"-affärsmodell där kunderna köper utvecklingstjänster via en kreditbaserad prenumerationsmodell istället för timdebitering.

### Kärnkoncept
- **Krediter som valuta:** Kunderna får krediter månadsvis via sin prenumeration
- **Pilot-först approach:** Varje ny kund börjar med en gratis pilot (8h utveckling)
- **Abonnemangsbaserat:** Tre planer (Care, Growth, Scale) med olika kreditvolymer
- **Projektbaserad förbrukning:** Krediter används när kunden beställer funktioner/projekt

---

## Arkitektur & Teknisk Stack

### Frontend
- **Framework:** Next.js 16 (App Router, React Server Components)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Ikoner:** lucide-react
- **Språk:** TypeScript (strict mode)
- **Styling:** Modern, responsiv design med dark/light mode-stöd

### Backend
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Email/Password)
- **Data Fetching:** React Server Components (RSC)
- **Mutations:** Server Actions
- **Storage:** Supabase Storage (för pilotansökningsbilagor)

### Deployment
- **Hosting:** Vercel
- **Database:** Supabase Cloud
- **Environment:** Node.js LTS

### Kodarkitektur
```
/app
  /(dashboard)           # Skyddade admin-routes
    /page.tsx            # Dashboard med KPI-kort
    /organizations       # Kundhantering
    /ledger              # Global huvudbok
    /pilot-requests      # Pilotansökningar
    /settings            # Systeminställningar
  /apply                 # Publik pilotansökningssida
  /login                 # Inloggningssida
  /api/v1                # Externa API-endpoints

/actions                 # Server Actions
  /database.ts           # Databasoperationer
  /auth.ts               # Autentisering
  /subscription-plans.ts # Prenumerationshantering
  /api-keys.ts           # API-nyckelhantering
  /pilot-requests.ts     # Pilothantering

/components              # React-komponenter
  /ui                    # shadcn primitives
  /[feature]-*.tsx       # Feature-specifika komponenter

/lib
  /supabase              # Supabase-klienter
  /types                 # TypeScript-typer
  /utils.ts              # Hjälpfunktioner

/supabase
  /migrations            # Databasmigrationer
  /functions             # Edge Functions
  /schema.sql            # Komplett DB-schema
```

---

## Huvudfunktioner

### 1. 📊 Dashboard & KPI-överblick

**Sida:** `/` (dashboard root)

**Funktionalitet:**
- **KPI-kort (real-time data):**
  - **MRR (Monthly Recurring Revenue):** Summa av alla aktiva prenumerationer
  - **Aktiva kunder:** Antal organisationer med status "active"
  - **Väntande pilots:** Antal pilotansökningar med status "pending"
  - **Total kreditutput:** Summa krediter som förbrukats (beräknas i databas via RPC)
  
- **Senaste organisationer:** Tabell med de nyaste kunderna och deras kreditsaldo
- **Snabbåtgärder:** Snabblänkar för vanliga uppgifter (Lägg till kund, Visa huvudbok, etc.)

**Teknisk implementation:**
- Data hämtas parallellt via `Promise.all()` i Server Component
- Använder databas-VIEW (`organizations_with_credits`) för att undvika N+1 queries
- KPI-beräkningar sker i PostgreSQL för optimal prestanda

---

### 2. 👥 Organisationshantering

**Sida:** `/organizations`

**Funktionalitet:**
- **Lista alla kunder** med följande information:
  - Namn och organisationsnummer
  - Status (Pilot, Active, Churned)
  - Aktuellt kreditsaldo
  - Prenumerationsplan
  - Skapad datum
  
- **Lägg till ny organisation** (Dialog):
  - Namn (obligatoriskt)
  - Organisationsnummer (valfritt)
  - Initial status (default: pilot)

- **Sök & Filter:**
  - Sök efter namn eller organisationsnummer
  - Filtrera på status
  - Sortera på olika kolumner

**Detaljvy:** `/organizations/[id]`

**Funktionalitet:**
- **Organisation Header:**
  - Namn, org.nr, status badge
  - Redigera organisationsinfo (inline dialog)
  
- **Kreditsaldo Card:**
  - Visar aktuellt saldo
  - Knapp: "Lägg till krediter" (Top-up dialog)
  
- **Prenumerationshantering:**
  - Visa aktuell plan (om aktiv)
  - Startdatum & nästa påfyllningsdatum
  - Status (active, paused, cancelled, inactive)
  - **Starta prenumeration:** Välj plan, sätt startdatum, beräknar automatiskt nästa påfyllningsdatum
  - **Pausa/Avsluta prenumeration**
  
- **Projekt (Order/Beställningar):**
  - Lista alla projekt för kunden
  - Skapa nytt projekt (titel, kostnad i krediter, status)
  - Status: backlog, in_progress, completed, on_hold
  - När projekt skapas dras krediter automatiskt från saldot (negativ transaktion i ledger)
  
- **Transaktionshistorik:**
  - Fullständig kreditledger för denna kund
  - Visar datum, belopp (+/-), beskrivning, kopplat projekt
  - Positiva transaktioner = Inköp/Påfyllning
  - Negativa transaktioner = Förbrukning (projekt)

- **API-nycklar:**
  - Lista aktiva och inaktiva API-nycklar
  - Generera ny nyckel (visas EN gång, sparas sedan bara hashen)
  - Revoke (inaktivera) nyckel
  - Visa nyckelförhandsvisning (sista 8 tecken)
  - Senast använd timestamp

**Teknisk implementation:**
- Parallell datahämtning för optimal prestanda
- Använder database JOINs för att undvika N+1 problem
- All mutation via Server Actions med `revalidatePath()`

---

### 3. 📒 Global Huvudbok (Credit Ledger)

**Sida:** `/ledger`

**Funktionalitet:**
- **Fullständig transaktionshistorik** för ALLA organisationer
- Visar:
  - Datum & tid
  - Organisation (med länk till detaljsida)
  - Belopp (+/- krediter)
  - Beskrivning
  - Kopplat projekt (om relevant)
  
- **Användningsområden:**
  - Ekonomisk rapportering
  - Felsökning av kreditsaldon
  - Revision och bokföring
  - "The Single Source of Truth" för all kreditförbrukning

**Teknisk implementation:**
- Hämtar alla transaktioner via Server Component
- Join med organizations och projects för komplett data
- Sorterad efter datum (senaste först)

---

### 4. 🚀 Pilothantering (Inbound Funnel)

**Publikt formulär:** `/apply`

**Funktionalitet:**
- **Kundansökan utan inloggning:**
  - Kontaktperson (namn + email)
  - Företagsnamn + Organisationsnummer (valfritt)
  - Beskrivning av behov
  - Bifoga dokument (PDF, Word, Excel, bilder)
  - Multi-file upload (max 10MB per fil)
  
- **Säkerhet:**
  - Använder Edge Function för att bypassa RLS (Row Level Security)
  - Filer laddas upp till Supabase Storage (bucket: `pilot-attachments`)
  - Formuläret är helt publikt, inget krav på inloggning

**Admin-vy:** `/pilot-requests`

**Funktionalitet:**
- **Lista alla pilotansökningar** med status:
  - Pending (orange badge)
  - Approved (grön badge)
  - Rejected (röd badge)
  
- **Detaljvy per ansökan:**
  - Kontaktinformation
  - Företagsdetaljer
  - Beskrivning
  - Bifogade filer (nerladdningsbara)
  
- **Åtgärder:**
  - Godkänn pilot (skapar organisation + initial kredit)
  - Avslå pilot
  - Ladda ner bilagor

**Teknisk implementation:**
- Pilot requests har RLS aktiverad
- Publika submissions hanteras via Edge Function med service_role
- Multi-file support via separat tabell (`pilot_request_attachments`)

---

### 5. 💳 Prenumerationsplaner

**Sida:** `/settings/plans`

**Funktionalitet:**
- **Hantera produktkatalog** för prenumerationer
- **Default-planer (seedade vid installation):**
  - **Care:** 25 krediter/mån, 5 000 kr/mån
  - **Growth:** 50 krediter/mån, 15 000 kr/mån
  - **Scale:** 100 krediter/mån, 35 000 kr/mån
  
- **CRUD-operationer:**
  - Skapa ny plan (namn, krediter/mån, pris, aktiv/inaktiv)
  - Redigera befintlig plan
  - Inaktivera plan (kan ej raderas om organisationer använder den)
  - Ta bort oanvänd plan
  
- **Användning:**
  - Visas när man startar prenumeration för en organisation
  - Används av Refill Engine för automatisk påfyllning
  - Används för MRR-beräkning i dashboard

**Teknisk implementation:**
- Tabell: `subscription_plans`
- Foreign key från `organizations.plan_id`
- Soft delete via `is_active`-flagga

---

### 6. 🔄 Automatisk Kreditpåfyllning (Refill Engine)

**Sida:** `/settings/refills` (Monitoring & Manual trigger)

**Funktionalitet:**
- **Automatisk månatlig påfyllning:**
  - Kör dagligen (cron via Edge Function)
  - Hittar alla organisationer där:
    - `subscription_status = 'active'`
    - `next_refill_date <= TODAY`
    - `plan_id IS NOT NULL`
  
- **Process:**
  1. Hämta alla orgs som är due for refill
  2. För varje org:
     - Hämta plan-detaljer (monthly_credits)
     - Skapa positiv transaktion i credit_ledger
     - Uppdatera `next_refill_date` (+1 månad)
  3. Logga exekvering i `refill_executions`-tabell
  
- **Monitorering:**
  - Visa senaste exekveringar
  - Visa nästa planerade körning
  - Visa vilka orgs som är due for refill
  - Manuell trigger (för testning/felsökning)
  
- **Felhantering:**
  - Fortsätter vid fel (skippar problematisk org, loggar error)
  - Status: success, partial_failure, failure
  - Detaljerad error-logg

**Teknisk implementation:**
- PostgreSQL Stored Procedure: `process_subscription_refills()`
- Edge Function (cron): `/functions/subscription-refill`
- Körs av Supabase Edge Functions (daglig cron)
- Audit log: `refill_executions`-tabell

---

### 7. 🔐 API-nyckelhantering

**Sida:** `/organizations/[id]` (API Keys-sektion)

**Funktionalitet:**
- **Generera API-nycklar för kunder:**
  - Varje organisation kan ha flera nycklar
  - Nyckeln visas EN gång vid skapelse
  - Endast hashen sparas i databasen (SHA-256)
  - Nyckelförhandsvisning: "...a1b2c3d4" (sista 8 tecken)
  
- **Hantering:**
  - Lista alla nycklar (aktiva + inaktiva)
  - Valfritt friendly name (t.ex. "Production", "Development")
  - Revoke/Återaktivera nyckel
  - Visa "Senast använd"-timestamp
  
- **Användningsområde:**
  - Kundens app kan hämta sitt kreditsaldo via public API
  - Används för att visa krediter i kundens gränssnitt
  - Rate-limiting och säker auth

**Teknisk implementation:**
- Tabell: `api_keys` (org_id, key_hash, key_preview, is_active)
- Unique index på key_hash
- Hashas med crypto.subtle.digest (SHA-256) före lagring

---

### 8. 🌐 Public API (för kundappar)

**Endpoint:** `/api/v1/credits`

**Metod:** GET

**Autentisering:** Bearer token (API-nyckel)

**Request:**
```http
GET /api/v1/credits
Authorization: Bearer itbd_live_abc123def456...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 50,
    "plan": "Growth",
    "subscription_status": "active",
    "organization": "Acme AB"
  }
}
```

**Funktionalitet:**
- Validerar API-nyckel (hashar + lookup i db)
- Kontrollerar att nyckeln är aktiv
- Hämtar kreditsaldo för kopplad organisation
- Uppdaterar `last_used_at` för nyckeln
- Rate-limiting (optional, TODO)

**Användningsområde:**
- Kundens app visar sitt kreditsaldo
- Kundens app kan kolla prenumerationsstatus
- Möjliggör "self-service"-funktioner i kundportalen

---

### 9. ⚙️ Inställningar & Profil

**Sida:** `/settings`

**Funktionalitet:**

**Flik: Profil**
- Redigera förnamn & efternamn
- Visa email (read-only)
- Visa roll (admin)

**Flik: Säkerhet**
- Visa inloggningsinformation
- Uppdatera lösenord (via Supabase Auth)
- Sessionshantering

**Flik: System**
- Systemstatistik:
  - Totalt antal organisationer
  - Totalt antal projekt
  - Totalt antal transaktioner
  - Databas-storlek (optional)
- Systemhälsa och status

**Snabblänkar:**
- Prenumerationsplaner (`/settings/plans`)
- Kreditpåfyllning (`/settings/refills`)

---

## Databasmodell

### Tabeller

#### 1. `organizations` (Kunder)
```sql
id                      uuid PRIMARY KEY
created_at              timestamp
name                    text NOT NULL
org_nr                  text
plan_id                 uuid → subscription_plans(id)
subscription_start_date timestamp
next_refill_date        timestamp
subscription_status     enum (active, paused, cancelled, inactive)
status                  enum (pilot, active, churned)
```

**Beskrivning:** Innehåller alla kundorganisationer (både pilots och betalande kunder).

---

#### 2. `profiles` (Admin-användare)
```sql
id          uuid PRIMARY KEY → auth.users(id)
email       text NOT NULL
first_name  text
last_name   text
role        text DEFAULT 'admin'
```

**Beskrivning:** Kopplar Supabase Auth-användare till profiler med namn.

---

#### 3. `credit_ledger` (Transaktioner)
```sql
id          uuid PRIMARY KEY
created_at  timestamp
org_id      uuid → organizations(id)
amount      integer (+ = inköp, - = förbrukning)
description text
project_id  uuid → projects(id) (optional)
```

**Beskrivning:** Alla kredittransaktioner. Saldot beräknas via `SUM(amount) GROUP BY org_id`.

---

#### 4. `projects` (Beställningar)
```sql
id           uuid PRIMARY KEY
created_at   timestamp
org_id       uuid → organizations(id)
title        text NOT NULL
status       enum (backlog, in_progress, completed, on_hold)
cost_credits integer DEFAULT 0
```

**Beskrivning:** Kundernas beställningar/projekt. När projekt skapas dras krediter från ledger.

---

#### 5. `subscription_plans` (Produktkatalog)
```sql
id              uuid PRIMARY KEY
created_at      timestamp
name            text UNIQUE NOT NULL
monthly_credits integer NOT NULL
price           integer (SEK)
is_active       boolean DEFAULT true
```

**Beskrivning:** Definierar tillgängliga prenumerationsplaner.

---

#### 6. `pilot_requests` (Ansökningar)
```sql
id           uuid PRIMARY KEY
created_at   timestamp
email        text NOT NULL
contact_name text NOT NULL
company_name text NOT NULL
org_nr       text
description  text
file_path    text (deprecated, använd attachments)
status       enum (pending, approved, rejected)
```

**Beskrivning:** Inkommande pilotansökningar från prospekts.

---

#### 7. `pilot_request_attachments` (Bilagor)
```sql
id          uuid PRIMARY KEY
created_at  timestamp
request_id  uuid → pilot_requests(id) CASCADE
file_path   text NOT NULL
file_name   text NOT NULL
file_type   text
file_size   integer
```

**Beskrivning:** Multi-file support för pilot requests.

---

#### 8. `api_keys` (API-autentisering)
```sql
id            uuid PRIMARY KEY
created_at    timestamp
org_id        uuid → organizations(id) CASCADE
key_hash      text UNIQUE NOT NULL
key_preview   text NOT NULL
name          text
is_active     boolean DEFAULT true
last_used_at  timestamp
```

**Beskrivning:** API-nycklar för kundintegration (hashas före lagring).

---

#### 9. `refill_executions` (Audit log)
```sql
id                       uuid PRIMARY KEY
executed_at              timestamp
organizations_processed  integer
credits_added            integer
execution_duration_ms    integer
status                   enum (success, partial_failure, failure)
error_message            text
```

**Beskrivning:** Logg över automatiska kreditpåfyllningar.

---

### Views

#### `organizations_with_credits`
Kombinerar organizations med aggregerat kreditsaldo och plan-detaljer.
Används för att eliminera N+1 query-problem.

```sql
SELECT 
  o.*, 
  SUM(cl.amount) AS total_credits,
  sp.name AS plan_name,
  sp.price AS plan_price,
  sp.monthly_credits AS plan_monthly_credits
FROM organizations o
LEFT JOIN credit_ledger cl ON o.id = cl.org_id
LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
GROUP BY o.id, sp.id
```

#### `organizations_due_for_refill`
Visar orgs som behöver påfyllning idag.

```sql
SELECT o.*, sp.monthly_credits
FROM organizations o
INNER JOIN subscription_plans sp ON o.plan_id = sp.id
WHERE o.subscription_status = 'active'
  AND o.next_refill_date <= CURRENT_DATE
```

---

### Stored Procedures

#### `process_subscription_refills()`
Hanterar automatisk kreditpåfyllning.
Returns: JSON med exekveringsstatistik.

#### `get_total_credits_output()`
Beräknar total kreditförbrukning i databasen (summa av negativa transaktioner).
Returns: integer

#### `get_next_refill_execution()`
Returnerar timestamp för nästa planerade refill.
Returns: timestamp

---

## Användargränssnitt

### Design-principer
- **Modern & Minimalistisk:** Följer v0.dev-genererad design
- **Responsiv:** Fungerar på desktop, tablet och mobil
- **Dark/Light mode:** Stöd för båda teman via `next-themes`
- **Tillgänglighet:** WCAG AA-standard, keyboard navigation
- **Svenska UI:** All användarvänd text på svenska
- **Engelsk kod:** All intern kod och databas på engelska

### Komponenter (shadcn/ui)
- Button, Card, Dialog, Input, Textarea
- Table, Badge, Tabs, Select
- Toast (sonner) för notifikationer
- Alert Dialog för bekräftelser
- Form (react-hook-form + zod validation)

### Layout

**Dashboard Layout:**
```
┌─────────────────────────────────────────────┐
│ Header (Profil, Notifikationer, Sök)       │
├──────┬──────────────────────────────────────┤
│      │  Content Area                        │
│ Side │  (Dashboard, Organizations, etc.)    │
│ bar  │                                      │
│      │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘
```

**Sidebar Navigation:**
- Dashboard (hem-ikon)
- Organisationer
- Global huvudbok
- Pilotförfrågningar
- Inställningar

**Mobile:**
- Hamburger-meny
- Sheet-komponent för sidebar
- Responsiva tabeller (scroll)

---

## API & Integrationer

### Externa API:er

#### Public Credits API
**Endpoint:** `/api/v1/credits`  
**Autentisering:** Bearer token (API-nyckel)  
**Rate limit:** TODO  
**Dokumentation:** TODO

### Edge Functions (Supabase)

#### `submit-pilot-request`
- **Trigger:** HTTP POST från `/apply`
- **Funktion:** Skapar pilot request + attachments
- **Security:** Använder service_role för att bypassa RLS

#### `subscription-refill` (Cron)
- **Trigger:** Daglig cron (00:00 UTC)
- **Funktion:** Anropar `process_subscription_refills()`
- **Loggning:** Skriver till `refill_executions`

---

## Automatisering

### Dagliga Processer

#### Kreditpåfyllning (Refill Engine)
- **Schema:** Dagligen kl. 00:00 UTC
- **Process:** Edge Function → Stored Procedure
- **Logik:** Se [Automatisk Kreditpåfyllning](#6--automatisk-kreditpåfyllning-refill-engine)

### Framtida automation (Roadmap)
- Email-notifikationer vid lågt saldo
- Automatiska påminnelser om förnyelse
- Webhooks för externa integrationer
- Slack-notifikationer vid nya pilots

---

## Säkerhet

### Autentisering
- **Provider:** Supabase Auth
- **Metod:** Email + Password
- **Session:** HTTP-only cookies via `@supabase/ssr`
- **Middleware:** Automatisk session refresh

### Authorization
- **Row Level Security (RLS):** Aktiverad på alla tabeller
- **Policy:** Authenticated users kan göra allt (internt admin-system)
- **Service role:** Används endast i Edge Functions för specifika use cases

### Data Protection
- **API-nycklar:** Hashas med SHA-256 före lagring
- **Lösenord:** Hanteras av Supabase Auth (bcrypt)
- **Sensitive data:** Inga kreditkort eller PII lagras

### Input Validation
- **Client-side:** React Hook Form + Zod schemas
- **Server-side:** Validering i Server Actions
- **Database:** CHECK constraints och foreign keys

### File Upload Security
- **Allowed types:** PDF, DOC, DOCX, XLS, XLSX, bilder
- **Max size:** 10MB per fil
- **Storage:** Supabase Storage (privat bucket)
- **Validation:** MIME-type check + file extension

---

## Sammanfattning

ITBD Business Admin är en fullständig SaaS-administrationsportal som stödjer en kreditbaserad prenumerationsmodell. Systemet hanterar:

✅ **Kundhantering** - Organisationer, pilots, aktiva kunder  
✅ **Kredithantering** - Ledger, saldo, transaktioner  
✅ **Prenumerationer** - Planer, automatisk påfyllning  
✅ **Projekthantering** - Beställningar, kreditförbrukning  
✅ **API-integration** - Säkra nycklar, public API  
✅ **Pilotfunnel** - Publikt ansökningsformulär  
✅ **Automatisering** - Daglig cron för påfyllning  
✅ **Rapportering** - KPI-dashboard, global huvudbok  

Systemet är byggt med modern teknik (Next.js, Supabase, TypeScript) och följer best practices för prestanda, säkerhet och skalbarhet.

