# 🚀 Quick Start - ITBD Admin Portal

Kom igång på 5 minuter!

## 📋 Prerequisites

- Node.js 18+ installerat
- Ett Supabase-konto (gratis på [supabase.com](https://supabase.com))

## ⚡ Snabbstart

### 1. Installera dependencies

```bash
npm install
```

### 2. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) → "New Project"
2. Välj namn: **ITBD Admin**
3. Välj region: **North Europe (Stockholm)**
4. Vänta ~2 minuter tills projektet är klart

### 3. Konfigurera environment variables

Skapa `.env.local` i projektets root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Hitta dina nycklar:**
- Supabase Dashboard → Settings → API
- Kopiera "Project URL" och "anon public" key

### 4. Skapa databas-schema

1. Supabase Dashboard → **SQL Editor**
2. Kopiera innehållet från `supabase/schema.sql`
3. Klistra in och klicka **Run**

**Viktigt:** Se till att du använder den uppdaterade versionen av schema.sql som använder `auth.uid() IS NOT NULL` i policies!

### 5. Skapa admin-användare

**Via Dashboard (REKOMMENDERAT):**

1. Supabase Dashboard → **Authentication** → **Users**
2. Klicka **"Add user"** → **"Create new user"**
3. Fyll i:
   - **Email:** `admin@itbydesign.se`
   - **Password:** `Admin123!`
   - ✅ **Auto Confirm User** ← VIKTIGT!
4. Klicka "Create user"

**VIKTIGT:** Använd alltid Dashboard för att skapa användare! Detta undviker NULL-problem i auth-schemat.

<details>
<summary>Alternativ: Skapa via SQL (Endast om Dashboard inte fungerar)</summary>

Se filen `supabase/create_admin_user_safe.sql` för korrekt SQL.

⚠️ **Varning:** Manuell SQL kan orsaka "Database error querying schema" om det görs fel!
</details>

### 6. (Valfritt) Lägg till testdata

```sql
-- Skapa test-organisationer
INSERT INTO public.organizations (name, org_nr, subscription_plan, status) VALUES
  ('Åkeri AB', '556123-4567', 'growth', 'active'),
  ('Bygg & Son', '556234-5678', 'scale', 'active'),
  ('Logistikcenter', '556345-6789', 'care', 'pilot');

-- Lägg till krediter
INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, 100, 'Initial credit purchase'
FROM public.organizations WHERE name = 'Åkeri AB';

INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, -88, 'Project work consumption'
FROM public.organizations WHERE name = 'Åkeri AB';
```

### 7. Starta utvecklingsservern

```bash
npm run dev
```

### 8. Öppna appen

Gå till [http://localhost:3000](http://localhost:3000)

**Logga in med:**
- Email: `admin@itbydesign.se`
- Password: `Admin123!`

## ✅ Checklista

- [ ] Node.js installerat
- [ ] Supabase-projekt skapat
- [ ] `.env.local` konfigurerad
- [ ] Databas-schema kört
- [ ] Admin-användare skapad
- [ ] (Valfritt) Testdata tillagt
- [ ] Dev-server startad
- [ ] Kan logga in

## 🎉 Klart!

Du bör nu se:
- 📊 Dashboard med KPI-kort
- 👥 Lista på organisationer
- 🎨 Modern UI med dark mode
- 🔐 Fungerande login/logout

## 📚 Nästa steg

1. **Läs dokumentationen:**
   - `README.md` - Projektöversikt
   - `docs/tech_stack.md` - Tekniska regler
   - `docs/setup_guide.md` - Detaljerad guide
   - `docs/project_structure.md` - Filstruktur

2. **Utforska koden:**
   - `app/(dashboard)/page.tsx` - Dashboard-sidan
   - `actions/database.ts` - Data-queries
   - `components/` - UI-komponenter

3. **Bygg nya features:**
   - Organizations detail page
   - Credit Ledger
   - Pilot Requests
   - Projects management

## 🆘 Problem?

### Kan inte logga in
- Kontrollera att användaren finns: Authentication → Users
- Verifiera att "Email Confirm" är aktiverad (grön bock)
- Testa att återställa lösenordet

### "Invalid API key"
- Kontrollera `.env.local` har rätt värden
- Starta om dev-servern (`Ctrl+C` → `npm run dev`)
- Använd **anon/public** key, inte service_role

### "relation does not exist"
- Kör `supabase/schema.sql` igen
- Verifiera att tabellerna skapades: Database → Tables

### RLS-fel / "Database error querying schema"
- Kör `supabase/fix_rls_policies.sql` för att uppdatera policies
- Kontrollera att policies använder `auth.uid() IS NOT NULL`
- Verifiera policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
- Se `docs/troubleshooting.md` för detaljerad hjälp

## 📖 Mer hjälp

- **Setup Guide:** `docs/setup_guide.md`
- **Tech Stack:** `docs/tech_stack.md`
- **Project Structure:** `docs/project_structure.md`

---

**Lycka till med utvecklingen! 🚀**

