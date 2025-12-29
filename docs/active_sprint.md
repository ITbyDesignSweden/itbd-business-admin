# active_sprint.md

## 🛡️ Sprint 8: The Security Layer (Custom Invitation Tokens)

**Mål:** Säkra upp "Säljrummet" (Onboarding) genom att ersätta öppna URL:er (`/onboarding/[id]`) med kryptografiskt säkra tokens. Vi bygger en "Manuell Gatekeeper" som validerar behörighet innan data hämtas eller AI-processer körs.

**Status:** 📅 Planned
**Prio:** Critical (Security Blocker)

---

### 📋 Tickets & Specs

#### 8.1 🗄️ Database: Invitation Tokens
**Syfte:** Skapa lagringsplatsen för tokens.
* **Fil:** `supabase/migrations/[timestamp]_invitation_tokens.sql`
* **SQL Definition:**
    ```sql
    create table invitation_tokens (
      token uuid default gen_random_uuid() primary key,
      org_id uuid references organizations(id) on delete cascade not null,
      created_at timestamp with time zone default now(),
      expires_at timestamp with time zone default (now() + interval '30 days'),
      used_at timestamp with time zone, -- Null = Kan användas för access

      constraint valid_dates check (expires_at > created_at)
    );

    -- Index för snabb uppslagning
    create index idx_tokens_lookup on invitation_tokens(token);

    -- VIKTIGT: Enable RLS men skapa inga policies för 'anon'. 
    -- Detta tvingar oss att använda Service Role (Admin) för åtkomst.
    alter table invitation_tokens enable row level security;
    ```

#### 8.2 👮 Backend: The Validator (Gatekeeper Logic)
**Syfte:** En central funktion som verifierar access utan att förbruka token direkt (tillåter page reload).
* **Fil:** `lib/auth/token-gate.ts`
* **Funktion:** `validateInvitationToken(token: string): Promise<string>`
* **Logik:**
    1.  Initiera `createAdminClient()` (Service Role) för att kringgå RLS.
    2.  Hämta token-raden.
    3.  **Check 1:** Finns token? (Nej -> Throw "Invalid Token").
    4.  **Check 2:** Har `expires_at` passerat? (Ja -> Throw "Expired Token").
    5.  *(Notering: Vi kollar inte `used_at` här än, för att tillåta att användaren går in och ut ur säljrummet under processen).*
    6.  **Return:** `org_id` (Detta är nu ett verifierat ID).

#### 8.3 ⚙️ Actions: Generate & Send Invite
**Syfte:** Admin-verktyg för att skapa länken.
* **Fil:** `actions/invitations.ts`
* **Funktion:** `createInvitation(orgId: string)`
* **Logik:**
    * Använd Admin Client.
    * Insert till `invitation_tokens`.
    * Returnera URL: `/onboarding?token=[UUID]`.
* **UI Update:** Lägg till knapp "Kopiera Inbjudningslänk" på Admin Dashboard (`/admin/pilots` eller `/admin/organizations`).

#### 8.4 🚧 Frontend: Secure Routing (The Swap)
**Syfte:** Flytta användaren till den säkra routen.
* **Refactor:**
    * 🗑️ **Radera:** `app/onboarding/[orgId]/page.tsx` (Stäng bakdörren).
    * ✨ **Skapa:** `app/onboarding/page.tsx`.
* **Page Logic (Server Component):**
    ```typescript
    export default async function OnboardingPage({ searchParams }) {
      const token = await searchParams.token; // Next.js 15: await params
      if (!token) return <NotFound />; 

      try {
        // 1. Validera token -> få Org ID
        const orgId = await validateInvitationToken(token);

        // 2. Hämta data som Admin (eftersom user är anon)
        const org = await getOrgAsAdmin(orgId); 
        
        // 3. Hämta feature ideas (från Sprint 9.5)
        const features = await getFeaturesAsAdmin(orgId);

        // 4. Rendera vyn men skicka BARA token vidare, aldrig orgId
        return <OnboardingView org={org} features={features} token={token} />;
      } catch (e) {
        return <ErrorPage message="Länken är ogiltig eller utgången" />;
      }
    }
    ```

#### 8.5 🔒 Security Protocol: Securing AI Actions
**Syfte:** Säkerställa att frontend aldrig kan manipulera vilket företag AI:n pratar om.
* **Regel:** Frontend får ALDRIG skicka `orgId` som parameter till Server Actions.
* **Refactor:** `actions/ai-sdr.ts` (och eventuella andra actions).
    * **Input:** Ändra från `{ orgId }` till `{ token }`.
    * **Implementation:**
        ```typescript
        export async function chatAction(input: { token: string, messages: any[] }) {
          // Steg 1: Servern härleder ID från token (säkert)
          const orgId = await validateInvitationToken(input.token);
          
          // Steg 2: Nu vet vi säkert vem det är
          // ... kör logik mot orgId ...
        }
        ```
* **Frontend:** Uppdatera `useChat` att skicka `{ body: { token } }`.

---

### 📝 Definition of Done
1.  **Inga IDn i URL:** Routen `/onboarding/[orgId]` ger 404.
2.  **Endast Token:** Jag kan nå sidan via `?token=XYZ`.
3.  **Persistence:** Jag kan ladda om sidan utan att länken slutar fungera (token bränns inte direkt).
4.  **Backend Security:** Om jag anropar AI-agenten med en giltig token men försöker injecta ett annat `orgId` i bodyn, ignoreras det (eftersom backend bara tittar på token).
5.  **Leak Proof:** Källkoden i frontend exponerar aldrig `org_id`.