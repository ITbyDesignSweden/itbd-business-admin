# Active Sprint: Admin Portal - Subscription Engine

**Status:** Planering
**Mål:** Automatisera månatlig kreditpåfyllning baserat på prenumerationsplaner.

## ✅ Klart (Done)
- [x] Business Core: Projects, Costs, Ledger.
- [x] Admin Control: Pilot Requests, Organization Management.

## 🚧 Pågående (Current Context)

### Feature L: Plan Management (Product Catalog)
*Vi måste definiera vad vi säljer i systemet.*

- [x] **Database Table (`subscription_plans`):**
    - Kolumner: `name` (t.ex. 'Growth'), `monthly_credits` (t.ex. 50), `price` (optional för nu), `is_active`.
- [x] **Admin UI (`/settings/plans`):**
    - En enkel tabell där admin kan skapa och redigera planer.
    - T.ex. kunna ändra "Growth" från 50 till 60 krediter inför framtiden.

### Feature M: Customer Subscriptions (The State)
*Koppla en kund till en plan.*

- [x] **Database Update (`organizations`):**
    - Lägg till kolumner: `plan_id` (FK), `subscription_start_date`, `next_refill_date`, `subscription_status` ('active', 'canceled').
- [x] **UI Update (Org Detail):**
    - På `/organizations/[id]`: Lägg till en "Subscription"-sektion.
    - Knapp "Start Subscription": Välj Plan (från Feature L) + Startdatum.
    - Logik: Sätter `next_refill_date` till en månad framåt.

### Feature N: The Refill Engine (Automation)
*Det magiska scriptet som körs varje natt.*

- [ ] **Edge Function / Cron Job:**
    - Skapa en funktion (via Supabase Edge Functions eller Next.js API route + Vercel Cron).
    - **Logik:**
        1. Hitta alla aktiva orgs där `next_refill_date` <= IDAG.
        2. För varje org: Skapa en transaktion i `credit_ledger` ("Månadspåfyllning: +50").
        3. Uppdatera `next_refill_date` med +1 månad.
    - **Säkerhet:** Endast anropbar med en "Service Role Key" (så ingen kan trigga den utifrån).
- [ ] **UI Visibility:**
    - (Optional) Visa "Nästa påfyllning: 2024-02-01" i dashboarden.

## 📝 Att göra (Backlog)
- [ ] **Customer Boilerplate:** Nästa stora fas.
- [ ] **Email Notifieringar:** Skicka mail när påfyllning skett ("Dina nya krediter är här!").