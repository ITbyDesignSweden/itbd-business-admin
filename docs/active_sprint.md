# Active Sprint: The Gatekeeper (Sprint 6)

**Status:** ✅ Komplett
**Startdatum:** 2025-01-05
**Slutdatum:** 2025-01-28
**Fokus:** Säkra inflödet och aktivera Admin-funktionerna. Vi bygger på befintlig `PilotRequest`-logik med Cloudflare Turnstile och lägger till fält för kommande AI-analys.

---

## 🎯 Sprint Mål
1.  **Säkerhet:** Skydda `/apply` (skapandet av requests) med Cloudflare Turnstile.
2.  **Data:** Migrera databasen för att stödja AI-data och globala systeminställningar.
3.  **Admin:** Koppla upp UI-knappar ("Godkänn"/"Neka") mot den befintliga funktionen `updatePilotRequestStatus`.

---

## 📋 Backlog & Tasks

### 1. Database: Prep for Enrichment & Settings ✅
*Vi behöver plats för rådata och en "nödbroms" för systemet.*

- [x] **Migration `system_settings` (Ny tabell):**
  - Skapa en singleton-tabell (endast 1 rad tillåten).
  - Kolumner: 
    - `enrichment_mode` (enum: 'manual', 'assist', 'autopilot').
    - `max_daily_leads` (int).
- [x] **Migration `pilot_requests` (Uppdatering):**
  - Lägg till kolumner för spårbarhet och framtida AI:
    - `enrichment_data` (jsonb, nullable) – *Plats för rådata från research.*
    - `fit_score` (int, nullable) – *Plats för AI-poäng.*
    - `turnstile_verified` (boolean, default false).
    - `lead_source` (text, default 'web_form').

### 2. Security: Cloudflare Turnstile (`/apply`) ✅
*Skydda endpointen som skapar förfrågningar.*

- [x] **Setup:**
  - Hämta Site Key & Secret Key från Cloudflare Dashboard.
  - Spara keys i `.env.local`.
- [x] **Frontend (`/apply/page.tsx`):**
  - Integrera `<Turnstile />` i formuläret.
  - Kräv en giltig token för att aktivera submit-knappen.
- [x] **Backend (Ny Action: `submitPilotRequest`):**
  - Skapa en Server Action som anropas av formuläret.
  - **Steg 1:** Verifiera Turnstile-token mot Cloudflare (se Tech Notes).
  - **Steg 2:** Kolla `system_settings` (valfritt: stoppa om inflödet är pausat).
  - **Steg 3:** Spara till `pilot_requests` med `turnstile_verified: true`.

### 3. Admin UI: Activate the Inbox ✅
*Gör listan interaktiv med din befintliga kod.*

- [x] **UI Update (`/admin/pilot-requests`):**
  - I listvyn, lägg till en kolumn "Actions".
  - Lägg till knapp: **✅ Godkänn**. Anropa `updatePilotRequestStatus({ id, status: 'approved' })`.
  - Lägg till knapp: **❌ Neka**. Anropa `updatePilotRequestStatus({ id, status: 'rejected' })`.
  - **OBS:** Detta var redan implementerat från tidigare sprint! ✅
- [x] **Logic Tweak (`actions/pilot-requests.ts`):**
  - Uppdatera `updatePilotRequestStatus` så att den vid godkännande kopierar `enrichment_data` till `organizations.business_profile` (om datan finns).

---

## 🛠 Technical Notes

### SQL Migrations

```sql
-- 1. Settings & Enums
CREATE TYPE enrichment_mode_type AS ENUM ('manual', 'assist', 'autopilot');

CREATE TABLE system_settings (
  id int PRIMARY KEY DEFAULT 1,
  enrichment_mode enrichment_mode_type DEFAULT 'manual',
  max_daily_leads int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
-- Initiera default-raden
INSERT INTO system_settings (id) VALUES (1);

-- 2. Update PilotRequests table
ALTER TABLE pilot_requests
  ADD COLUMN fit_score int,
  ADD COLUMN enrichment_data jsonb,
  ADD COLUMN turnstile_verified boolean DEFAULT false,
  ADD COLUMN lead_source text DEFAULT 'web_form';
```

### Backend: Turnstile Verification Helper
Skapa `utils/security.ts`:

```typescript
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
  if (!secret) {
    console.warn("Turnstile secret missing, skipping validation (Dev mode)");
    return true; 
  }

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);

  try {
    const res = await fetch('[https://challenges.cloudflare.com/turnstile/v0/siteverify](https://challenges.cloudflare.com/turnstile/v0/siteverify)', {
      method: 'POST',
      body: formData,
    });
    const outcome = await res.json();
    return outcome.success;
  } catch (e) {
    console.error("Turnstile error:", e);
    return false;
  }
}
```

### Refactoring: Mapping Data on Approval
I `updatePilotRequestStatus` (inuti `if (validatedData.status === "approved")` blocket):

```typescript
// ...
const { data: newOrg, error: orgError } = await supabase
  .from("organizations")
  .insert({
    name: pilotRequest.company_name,
    org_nr: pilotRequest.org_nr || null,
    status: "pilot",
    // NYTT: Om vi har AI-data (Sprint 7), spara den som business_profile
    business_profile: pilotRequest.enrichment_data 
      ? JSON.stringify(pilotRequest.enrichment_data) 
      : null, 
  })
// ...
```