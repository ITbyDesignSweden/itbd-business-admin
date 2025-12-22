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
- [x] **Calculate Project Cost:**
    - Uppdatera `getProjectsByOrgId` (eller skapa ny) så att den räknar ut summan av alla negativa transaktioner i `credit_ledger` kopplade till projektet.
    - Fältet `cost_credits` i tabellen ska visa verklig förbrukning (t.ex. "500 kr").
- [x] **Edit Project (Update Status):**
    - Skapa `updateProject` Server Action.
    - Lägg till en "Redigera"-knapp (eller pen-ikon) i projekttabellen.
    - Möjliggör ändring av Titel och framförallt **Status** (så vi kan flytta projekt från "In Progress" -> "Done").
- [x] **Safe Delete:**
    - Lägg till en "Ta bort"-knapp (gärna i Edit-dialogen med en "Är du säker?"-varning).
    - Skapa Server Action `deleteProject`.
    - **Logik:** Kontrollera först om det finns rader i `credit_ledger` kopplade till projektet.
    - **Regel:**
        - Om transaktioner finns: Kasta ett fel/returnera error ("Kan ej radera projekt med ekonomisk historik. Sätt status till Cancelled istället.").
        - Om inga transaktioner finns: Utför `DELETE` från databasen.

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