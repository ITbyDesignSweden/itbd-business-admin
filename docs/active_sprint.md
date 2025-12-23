# Active Sprint: Admin Portal - Growth & Admin Control

**Status:** Planering
**Mål:** Automatisera inflödet av nya kunder (Pilot Requests) och ge admin kontroll över sitt eget konto.

## ✅ Klart (Done)
- [x] Navigation: Organizations & Ledger Index pages.
- [x] Business Core: Projects, Costs, Safe Delete.
- [x] Security: RLS & Constraints.

## 🚧 Pågående (Current Context)

### Feature H: Pilot Requests (Inbound Funnel)
*Hantera förfrågningar från hemsidan.*

- [x] **Database & Storage:** Grundtabell och Bucket uppsatt.
- [x] **Public Page:** Formulär och Single-file upload.
- [x] **Admin Page:** Listning av leads.

#### 🔄 Feature H (Refactor): Multi-file Support
*Vi behöver ändra från 1 fil till stöd för flera filer.*

- [ ] **Database Migration:**
    - Skapa ny tabell `pilot_request_attachments` (request_id, file_path, file_name, file_type).
    - (Optional) Ta bort kolumnen `file_url` från `pilot_requests` när vi är klara.
- [ ] **Frontend Update (`/apply`):**
    - Ändra file-input till `multiple`.
    - Visa en lista ("badge list") på valda filer i UI:t innan man skickar.
- [ ] **Backend Update:**
    - Uppdatera Server Action `submitPilotRequest`.
    - Iterera igenom alla filer, ladda upp dem till Storage, och skapa rader i `pilot_request_attachments`.
- [ ] **Admin Update:**
    - Uppdatera detaljvyn så den hämtar och listar alla filer kopplade till requesten.

### Feature I: Admin Settings
*Grundläggande profilhantering.*

- [ ] **Settings Page (`/settings`):**
    - Skapa sida med flikar (Profile, Security).
- [ ] **Profile Form:**
    - Kunna uppdatera sitt eget Förnamn/Efternamn (i `profiles`-tabellen).
- [ ] **System Status:**
    - Visa enkel info om systemet (t.ex. "Antal kunder totalt", "System version").

## 📝 Att göra (Backlog - Next Up)
- [ ] **Email Integration:** Skicka automatiskt välkomstmail vid "Approve" (kräver Resend/Sendgrid).
- [ ] **Search & Filters:** Global sök i headern.