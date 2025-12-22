# Active Sprint: Admin Portal - Navigation & Global Views

**Status:** Uppstart
**Mål:** Fixa alla "döda länkar" i sidomenyn. Admin ska ha dedikerade vyer för Kunder och Transaktioner.

## ✅ Klart (Done)
- [x] Business Core: Projects, Costs, Safe Delete.
- [x] Security: RLS & Constraints.

## 🚧 Pågående (Current Context)

### Feature F: Organizations Index Page (`/organizations`)
*Fixar 404-felet i menyn.*

- [x] **Skapa sidan:** `app/(dashboard)/organizations/page.tsx`.
- [x] **Återanvändning:** Importera och använd befintlig `OrganizationsTable`.
- [x] **Flytta UI:**
    - Flytta "Add Organization"-knappen från Dashboarden till denna nya sida (eller ha den på båda ställena).
    - Dashboarden kan istället visa "Recent Organizations" (t.ex. limit 5).
- [x] **Search:** Se till att sökfunktionen i tabellen fungerar bra på denna sida.

### Feature G: Global Ledger Page (`/ledger`)
*Revisorns favoritvy. En lista på ALLA transaktioner i hela systemet.*

- [ ] **Skapa sidan:** `app/(dashboard)/ledger/page.tsx`.
- [ ] **Server Action:** Skapa `getAllTransactions()` i `actions/database.ts` (måste joina `organizations` för att visa kundnamn).
- [ ] **UI - Global Table:**
    - Skapa `components/global-ledger-table.tsx`.
    - Kolumner: Datum, Kund (Länk till org), Projekt (Länk), Beskrivning, Belopp.
- [ ] **Filter:** Enkel filtrering (t.ex. dropdown för att välja en specifik organisation).

## 📝 Att göra (Backlog)
- [ ] **Pilot Requests:** Leadshantering (får vänta till nästa sprint).
- [ ] **Settings:** Admin-profil.