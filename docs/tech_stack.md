# Tech Stack & Guidelines - ITBD Admin Portal

Detta dokument definierar den tekniska stacken och kodreglerna för IT by Design Admin Portal.
AI-agenter (Cursor/Claude) SKA följa dessa regler strikt.

## 1. Core Framework
- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript.
- **Hosting:** Vercel.
- **Environment:** Node.js (Latest LTS).

## 2. UI & Styling (Generated via v0.dev)
- **Styling Engine:** Tailwind CSS.
- **Component Library:** shadcn/ui.
- **Icons:** `lucide-react`.
- **Fonts:** Geist Sans or Inter (via `next/font`).
- **Theme:** Supports Light/Dark mode (via `next-themes`), default to System/Dark.
- **Workflow:** UI components are primarily generated via v0.dev and refined manually. Do not overwrite v0-generated styles unless necessary for functionality.

## 3. Backend & Database (Supabase)
- **Service:** Supabase (Project: ITBD Admin).
- **Database:** PostgreSQL.
- **Auth:** Supabase Auth (Email/Password + Magic Link).
- **Package:** `@supabase/ssr` (for Next.js Server Components & Actions).
- **Security:**
    - Enable Row Level Security (RLS) on ALL tables.
    - Admin users are defined via specific policies or `service_role` checks where strictly necessary.

## 4. Data Fetching & State
- **Fetching:** Use **React Server Components (RSC)** for initial data load.
    - *Pattern:* Fetch data directly in `page.tsx` or `layout.tsx` using Supabase Server Client.
- **Mutations:** Use **Server Actions** (`actions/*.ts`) for all writes (Create, Update, Delete).
    - *Pattern:* Use `revalidatePath` to update UI after mutation.
- **Client State:** Keep client state minimal. Use `useFormStatus` and `useOptimistic` for UI feedback.
- **API Routes:** Only use Route Handlers (`app/api/...`) for:
    - Webhooks (Stripe etc).
    - External API endpoints (e.g., serving credit balance to customer apps).

## 5. Directory Structure
```text
/app
  /(dashboard)      # Protected admin routes (Layout with Sidebar)
    /page.tsx       # Main Dashboard
    /organizations  # Customer management
    /ledger         # Credit transactions
  /login            # Public auth route
  /api              # External APIs
  /embed            # Embeddable views for Customer Portals (Iframe targets)
/components
  /ui               # shadcn primitives (Button, Card, etc)
  /layout           # Sidebar, Header
  /dashboard        # Dashboard specific widgets
/lib
  /supabase         # client.ts, server.ts, middleware.ts
  utils.ts          # Helper functions
/actions            # Server Actions (auth.ts, database.ts)