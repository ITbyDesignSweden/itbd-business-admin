# Active Sprint: Admin Portal - Operations & Management

**Status:** Uppstart
**Mål:** Göra portalen interaktiv. Jag ska kunna lägga till kunder och hantera krediter direkt från UI:t.

## ✅ Klart (Done)
- [x] Grundstruktur (Next.js, Tailwind, Supabase).
- [x] Auth-flöde (Login/Logout).
- [x] Dashboard "Read-Only" vy (KPI:er och tabell med riktig data).
- [x] Databasschema och Types.

## 🚧 Pågående (Current Context)

### Feature A: Hantera Organisationer (CRUD)
- [x] Skapa en "Add Organization"-knapp i Dashboarden.
- [x] Bygga en Modal (Dialog) eller separat sida `/organizations/new` för att skapa kund.
- [x] Skapa Server Action `createOrganization` (Ska hantera inserts i `organizations`-tabellen).
- [x] Implementera "Toast"-notifikationer för success/error (använd `sonner` eller `use-toast`).

### Feature B: Organisations-detaljer & Krediter
- [x] Skapa dynamisk route: `app/(dashboard)/organizations/[id]/page.tsx`.
- [x] På detaljsidan: Visa kundens info och en lista på deras transaktioner (Credit Ledger).
- [X] Skapa funktion: "Top-up Credits" (Knapp som öppnar modal).
    - Input: Antal krediter, Beskrivning (t.ex. "Faktura 1024").
    - Server Action: `addTransaction` (Insert till `credit_ledger`).

## 📝 Att göra (Backlog)
- [ ] Settings-sida (Hantera min egen admin-profil).
- [ ] Projekt-vy (Se kundernas beställningar).
- [ ] Sök/Filtrering på Dashboarden (Server-side search).

## 🐞 Buggar / Tech Debt
- [ ] Kontrollera att RLS-policies tillåter INSERT för admin-användaren.