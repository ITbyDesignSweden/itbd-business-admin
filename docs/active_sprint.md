# Active Sprint: Admin Portal - Business Core & Security

**Status:** Planering
**Mål:** Implementera projekt-hantering för att kunna logga arbete mot krediter, samt säkra applikationen.

## ✅ Klart (Done)
- [x] Core: Next.js + Supabase + Auth.
- [x] Org Management: Create, Read, Update.
- [x] Credit System: Saldo, Transaktioner & Justeringar (Top-up).

## 🚧 Pågående (Current Context)

### Feature D: Projects Management (The Work)
*Vi måste kunna skapa projekt (beställningar) för att veta vad krediterna används till.*

- [x] **Projects List (Org Detail):**
    - På sidan `/organizations/[id]`: Lägg till en flik eller sektion för "Projects".
    - Visa lista på projekt med: Titel, Status (Backlog/Active/Done), Kostnad (Credits).
- [x] **Create Project Action:**
    - Skapa Server Action `createProject`.
    - UI: Knapp "New Project" som öppnar en Modal (Titel, Status).
- [x] **Link Credits to Projects:**
    - Uppdatera "Top-up/Spend"-modalen så man kan välja ett Projekt (valfritt).
    - Uppdatera `addTransaction` så att `project_id` sparas i `credit_ledger`.
    - *Resultat:* Vi kan se exakt vad krediter dragits för.

### Feature E: Security & Hardening (Tech Debt)
*Nu säkrar vi datan innan vi växer.*

- [ ] **RLS Audit:**
    - Uppdatera Supabase Policies. Ändra från `authenticated` till att specifikt kräva rollen `admin` i `profiles`-tabellen.
    - Detta skyddar mot att framtida "vanliga" användare (kunder) kan nå admin-data.
- [ ] **Data Integrity:**
    - Lägg till unikt index på `organizations.org_nr` (så vi inte får dubbletter).

## 📝 Att göra (Backlog - Next Up)
- [ ] **Global Ledger (`/ledger`):** Totalekonomi-vy.
- [ ] **Pilot Requests:** Leadshantering.