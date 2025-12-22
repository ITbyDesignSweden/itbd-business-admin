# Active Sprint: Admin Portal - Growth & Admin Control

**Status:** Planering
**Mål:** Automatisera inflödet av nya kunder (Pilot Requests) och ge admin kontroll över sitt eget konto.

## ✅ Klart (Done)
- [x] Navigation: Organizations & Ledger Index pages.
- [x] Business Core: Projects, Costs, Safe Delete.
- [x] Security: RLS & Constraints.

## 🚧 Pågående (Current Context)

### Feature H: Pilot Requests (Inbound Funnel)
*Hantera förfrågningar från hemsidan så vi slipper skapa organisationer manuellt.*

- [ ] **Database Setup:**
    - Skapa tabell `pilot_requests` (email, company_name, org_nr, status: 'pending'/'approved'/'rejected').
    - Sätt upp RLS (Public insert tillåten, Admin select/update tillåten).
- [ ] **Public Apply Page (`/apply`):**
    - En enkel, öppen sida (utanför (dashboard)-gruppen) där potentiella kunder kan ansöka.
    - Formulär som sparar till `pilot_requests`.
- [ ] **Admin View (`/pilot-requests`):**
    - En lista i admin-panelen som visar alla 'pending' förfrågningar.
- [ ] **Approve Action:**
    - Knapp "Godkänn" på en förfrågan.
    - **Logik:**
        1. Uppdatera status till 'approved'.
        2. Skapa automatiskt en ny rad i `organizations`-tabellen baserat på datan.
        3. (Bonus) Visa en toast: "Organisation skapad från förfrågan!".
- [ ] **File Upload Support:**
    - Aktivera Supabase Storage: Skapa bucket `pilot-uploads`.
    - Sätt upp Storage Policies: Public upload tillåten, men endast Admin får läsa/ladda ner.
    - Uppdatera formuläret (`/apply`) med en File Input (drag-and-drop eller enkel knapp).
    - Validering: Endast PDF/Word/Excel/Bilder, max 10MB.

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