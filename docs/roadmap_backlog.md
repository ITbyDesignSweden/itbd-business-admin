# Product Roadmap & Backlog - ITBD Admin Portal

Detta är bruttolistan över funktioner vi planerar att bygga.
När vi är redo att bygga en feature, flyttar vi den till `active_sprint.md`.

## 🚀 High Priority (Nästa Sprint)
*Dessa är kritiska för att systemet ska vara körbart.*

- [x] **Organizations Detail Page (`/organizations/[id]`)**
    - Se detaljerad info om kund.
    - Se lista på användare kopplade till org.
- [x] **Credit Ledger Page (`/ledger`)**
    - En central vy för ALLA transaktioner i hela systemet.
    - Filtrering på datum och organisation.
- [x] **Pilot Requests (`/pilot-requests`)**
    - Hantera inkommande förfrågningar från hemsidan.
    - Knapp för "Approve" -> Skapar automatiskt en Organization och skickar email.

## 🔮 Medium Priority (Snart)
*Viktiga funktioner för daglig drift.*

- [ ] **Projects Management**
    - Kunna skapa projekt åt kunder (t.ex. "Integration Fortnox").
    - Logga tid/krediter mot projekt.
- [ ] **Settings / Admin Profile**
    - Byta lösenord.
    - Hantera andra admin-användare (Multi-tenant support).
- [ ] **Search & Filters**
    - Global sök i headern (Hitta kund snabbt på Org.nr eller Namn).

## 🧊 Icebox / Future Ideas (Senare)
*Bra idéer ("Nice to have") som vi tar när grunden sitter.*

- [ ] **Notifications System**
    - Notis när en kunds krediter understiger 10p.
    - Notis vid ny Pilot Request.
- [ ] **Export Functions**
    - Exportera fakturaunderlag till CSV/Excel för bokföring.
- [ ] **Analytics Dashboard**
    - Grafer över kreditanvändning per månad (Churn warning).
    - MRR-utveckling över tid.

 ## 🔧 Tech Debt & Hardening
- [ ] **RLS Security:** Strama åt policies så att bara användare med rollen 'admin' får göra INSERT/UPDATE (just nu är det 'authenticated').
- [ ] **Data Integrity:** Lägg till unik constraint på `org_nr` i databasen för att förhindra dubbletter.