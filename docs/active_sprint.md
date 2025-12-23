# Active Sprint: Admin Portal - API & Connectivity

**Status:** Planering
**Mål:** Göra systemet redo att agera "Mothership" åt kundernas applikationer.

## ✅ Klart (Done)
- [x] Subscription Engine & Plans.
- [x] Projects & Ledger.

## 🚧 Pågående (Current Context)

### Feature O: API Key Management
*Vi måste kunna generera säkra nycklar åt kunderna.*

- [x] **Database (`api_keys`):**
    - Tabell: `id`, `org_id`, `key_hash` (vi sparar aldrig nyckeln i klartext!), `is_active`, `created_at`.
    - Unikt index på `key_hash`.
- [x] **UI - Organization Settings:**
    - På `/organizations/[id]`: Lägg till en flik/sektion "API Access".
    - Knapp: "Generera ny API-nyckel".
    - **Viktigt:** Visa nyckeln *en gång* (som en toast/modal) och be mig kopiera den. Spara sedan bara hashen.
    - Knapp: "Revoke Key" (Sätt `is_active = false`).

### Feature P: The Public API
*Endpointen som kundens app anropar.*

- [x] **API Route (`app/api/v1/credits/route.ts`):**
    - Metod: `GET`.
    - **Auth:** Läs `Authorization: Bearer <KEY>`.
    - **Logik:**
        1. Hasha inkommande nyckel.
        2. Leta upp aktiv rad i `api_keys`.
        3. Om giltig: Hämta saldo och plan för kopplad `org_id`.
        4. Returnera JSON: `{ credits: 50, plan: 'Growth', status: 'active' }`.
    - **Rate Limit:** (Optional) Enkel spärr för att skydda mot spam.

## 📝 Att göra (Backlog)
- [ ] **Starta Boilerplate-projektet:** (Nästa stora fas).