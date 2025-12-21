# Project Structure - ITBD Admin Portal

```
itbd-business-admin/
│
├── app/                                    # Next.js App Router
│   ├── (dashboard)/                        # Protected route group (har sidebar)
│   │   ├── layout.tsx                      # Dashboard layout (Sidebar + Header)
│   │   └── page.tsx                        # Dashboard page (hämtar data från Supabase)
│   │
│   ├── login/                              # Public route (ingen sidebar)
│   │   └── page.tsx                        # Login page med auth form
│   │
│   ├── layout.tsx                          # Root layout (HTML wrapper)
│   ├── globals.css                         # Global styles + Tailwind
│   └── favicon.ico
│
├── components/                             # React komponenter
│   ├── ui/                                 # shadcn/ui primitives
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── sheet.tsx
│   │   └── table.tsx
│   │
│   ├── dashboard-header.tsx                # Header med mobile menu + notifications
│   ├── sidebar.tsx                         # Desktop sidebar med navigation
│   ├── mobile-sidebar.tsx                  # Mobile sidebar (i Sheet)
│   ├── kpi-cards.tsx                       # KPI-kort (Server Component)
│   ├── organizations-table.tsx             # Organizations tabell med search
│   └── quick-actions.tsx                   # Quick actions card
│
├── lib/                                    # Utilities & helpers
│   ├── supabase/                           # Supabase clients
│   │   ├── client.ts                       # Browser client (Client Components)
│   │   ├── server.ts                       # Server client (RSC + Server Actions)
│   │   └── middleware.ts                   # Session refresh + route protection
│   │
│   ├── types/
│   │   └── database.ts                     # TypeScript types för databas-scheman
│   │
│   └── utils.ts                            # Helper functions (cn, etc)
│
├── actions/                                # Server Actions
│   ├── auth.ts                             # login(), logout(), getUser()
│   └── database.ts                         # getDashboardStats(), getOrganizationsWithCredits()
│
├── supabase/                               # Supabase-relaterade filer
│   └── schema.sql                          # Databas-schema (organizations, profiles, etc)
│
├── docs/                                   # Dokumentation
│   ├── tech_stack.md                       # Tekniska regler & guidelines
│   ├── setup_guide.md                      # Steg-för-steg setup-instruktioner
│   ├── implementation_summary.md           # Sammanfattning av implementationen
│   ├── project_structure.md                # Denna fil
│   ├── business_model.md                   # Business logic & affärsmodell
│   └── schema.sql                          # Backup av databas-schema
│
├── middleware.ts                           # Next.js middleware (auth check)
├── .env.local.example                      # Template för environment variables
├── .gitignore                              # Git ignore rules
├── README.md                               # Projektöversikt
├── package.json                            # Dependencies
├── tsconfig.json                           # TypeScript config
├── next.config.ts                          # Next.js config
├── postcss.config.mjs                      # PostCSS config (Tailwind)
├── components.json                         # shadcn/ui config
└── eslint.config.mjs                       # ESLint config
```

## Fil-förklaring

### App Router (`app/`)

#### `(dashboard)/` - Protected Route Group
- **layout.tsx**: Wrapper med Sidebar + Header, hämtar user data
- **page.tsx**: Dashboard-sida, hämtar KPI + organizations data

#### `login/`
- **page.tsx**: Login-formulär, använder Server Action för auth

#### Root
- **layout.tsx**: HTML wrapper, Analytics, Font setup
- **globals.css**: Tailwind directives + CSS variables

### Components (`components/`)

#### UI Primitives (`ui/`)
Alla genererade av shadcn/ui CLI - ändra inte manuellt!

#### Dashboard Components
- **dashboard-header.tsx**: Client Component (useState för mobile menu)
- **sidebar.tsx**: Client Component (usePathname för active state)
- **mobile-sidebar.tsx**: Client Component (navigation i Sheet)
- **kpi-cards.tsx**: Server Component (hämtar stats direkt)
- **organizations-table.tsx**: Client Component (useState för search)
- **quick-actions.tsx**: Statisk komponent

### Lib (`lib/`)

#### Supabase (`supabase/`)
- **client.ts**: `createBrowserClient()` för Client Components
- **server.ts**: `createServerClient()` för Server Components/Actions
- **middleware.ts**: `updateSession()` för Next.js middleware

#### Types (`types/`)
- **database.ts**: TypeScript interfaces för alla tabeller + aggregate types

### Actions (`actions/`)

#### Auth (`auth.ts`)
```typescript
login(formData: FormData)      // Logga in
logout()                       // Logga ut
getUser()                      // Hämta current user
```

#### Database (`database.ts`)
```typescript
getDashboardStats()                    // KPI-data
getOrganizationsWithCredits()          // Orgs med kreditsaldo
```

### Supabase (`supabase/`)

#### Schema (`schema.sql`)
Innehåller:
- Tabeller: organizations, profiles, credit_ledger, projects
- RLS policies
- Constraints & indexes

## Data Flow

### Server Component Data Fetching
```
Page (Server Component)
  ↓
Server Action / Direct Supabase call
  ↓
lib/supabase/server.ts
  ↓
Supabase Database
  ↓
Return data
  ↓
Render with data
```

### Client Component Interaction
```
User clicks button
  ↓
Client Component calls Server Action
  ↓
Server Action (actions/*.ts)
  ↓
lib/supabase/server.ts
  ↓
Database mutation
  ↓
revalidatePath() / redirect()
  ↓
UI updates
```

### Authentication Flow
```
User submits login form
  ↓
actions/auth.ts (login)
  ↓
Supabase Auth
  ↓
Set cookies
  ↓
Redirect to dashboard
  ↓
Middleware checks auth
  ↓
Allow access
```

## Route Protection

### Middleware (`middleware.ts`)
Körs på VARJE request:
1. Refresh Supabase session
2. Check if user is authenticated
3. Redirect to `/login` if not (except for `/login` itself)
4. Redirect to `/` if already logged in and trying to access `/login`

### Protected Routes
- `/` (dashboard)
- `/organizations`
- `/credit-ledger`
- `/pilot-requests`
- `/settings`

### Public Routes
- `/login`

## Environment Variables

Krävs i `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Key Patterns

### Server Components (Default)
```typescript
// app/(dashboard)/page.tsx
export default async function Page() {
  const data = await getDashboardStats()
  return <Component data={data} />
}
```

### Client Components (When needed)
```typescript
// components/organizations-table.tsx
"use client"

export function OrganizationsTable({ data }) {
  const [search, setSearch] = useState("")
  // ... interactive logic
}
```

### Server Actions
```typescript
// actions/database.ts
"use server"

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select()
  return data
}
```

## Dependencies

### Core
- `next` - Framework
- `react` - UI library
- `typescript` - Type safety

### Supabase
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side auth

### UI
- `tailwindcss` - Styling
- `@radix-ui/*` - Headless UI components (via shadcn)
- `lucide-react` - Icons
- `next-themes` - Dark mode

### Utils
- `class-variance-authority` - Component variants
- `clsx` + `tailwind-merge` - Conditional classes
- `zod` - Schema validation

## Naming Conventions

### Files
- `kebab-case.tsx` - Components
- `kebab-case.ts` - Utilities
- `PascalCase` - Component names

### Components
- `PascalCase` - Component functions
- `camelCase` - Props, variables
- `UPPER_CASE` - Constants

### Database
- `snake_case` - Tabeller, kolumner
- `camelCase` - TypeScript interfaces

## Next Steps

När du vill lägga till nya features:

1. **Ny sida**: Skapa i `app/(dashboard)/[route]/page.tsx`
2. **Ny komponent**: Lägg till i `components/`
3. **Ny Server Action**: Lägg till i `actions/`
4. **Ny typ**: Lägg till i `lib/types/database.ts`
5. **Ny tabell**: Uppdatera `supabase/schema.sql`

Följ alltid `docs/tech_stack.md` för tekniska regler!

