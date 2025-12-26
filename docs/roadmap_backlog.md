# Product Roadmap & Backlog: ITBD SaaS Factory

Detta dokument styr den långsiktiga utvecklingen av Admin Portalen och Boilerplaten.

---

## 🛣 Roadmap

### Fas 1: The Foundation & Inventory (Nuvarande Fokus)
*Mål: Få kontroll på alla instanser och etablera grunden för "Fabriken".*
- [x] Grundläggande Admin Dashboard (KPIer, Kunder).
- [x] Kredit-ledger (Huvudbok) och Transaktioner.
- [x] **Provisioning Core:** Spara länkar till Repo/Prod i databasen.
- [x] **GitHub Integration (POC):** Koppla Admin Portal till GitHub API.

### Fas 2: The Intelligent Architect (AI Integration)
*Mål: Automatisera merförsäljning och teknisk specifikation via AI.*
- [x] **Sprint 1 (Core):** Headless Agent API (Gemini 3.0 Flash) + Chat Widget.
- [ ] **Sprint 2 (Awareness):** Context Injection (Agenten läser DB-schema & Profil).
- [ ] **Sprint 3 (Spec):** Integration med Claude 3.5 Sonnet för att generera `spec.md`.
- [ ] **Sprint 4 (Cold Start):** Automatisk research/profilering vid nykunds-signup.

### Fas 3: Business Automation (Scale)
*Mål: Självgående fakturering och övervakning.*
- [ ] Faktureringsunderlag baserat på Subscription Plans.
- [ ] Automatisk påminnelse vid lågt kreditsaldo.
- [ ] System Health Monitoring (Ping av kund-instanser).

---

## 📂 Feature Backlog (Prioriterad)

### High Priority
1. **AI Chat API (`/api/chat`):** Centralhjärnan för alla kund-botar.
2. **AI Widget Component:** UI-komponenten som exporteras till kunderna.
3. **GitHub "Create Repo" Action:** Automatisera kloning av Boilerplate.
4. **Subscription Refill Engine:** Hantera månatlig påfyllning av krediter.

### Medium Priority
1. **Pilot Request Funnel:** Förfina uppladdning av filer/krav.
2. **API Key Management:** UI för att rotera/skapa API-nycklar åt kunder.
3. **Audit Logs:** Vem ändrade vad i admin-portalen?

### Low Priority / Future Ideas
1. **Mobile App:** En "Companion App" för administratörer.
2. **White-label Admin:** Låta slutkunder logga in i en begränsad del av Admin Portalen?

---

## 🧠 Arkitektoniska Principer
1. **Headless AI:** All intelligens bor i Admin Portalen. Klienten är bara ett skal.
2. **The Ledger is Truth:** All förbrukning måste loggas som transaktioner.
3. **Supabase Native:** Använd RLS, Edge Functions och Webhooks där det går.