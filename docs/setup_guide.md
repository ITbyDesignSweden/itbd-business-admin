# Setup Guide - ITBD Admin Portal

## Steg-för-steg installation

### 1. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och logga in
2. Klicka på "New Project"
3. Välj organisation och fyll i:
   - **Name:** ITBD Admin
   - **Database Password:** (välj ett starkt lösenord)
   - **Region:** North Europe (Stockholm) eller närmaste region
4. Klicka "Create new project" och vänta ~2 minuter

### 2. Hämta API-nycklar

1. I Supabase Dashboard, gå till **Settings** → **API**
2. Kopiera följande:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 3. Konfigurera miljövariabler

1. Skapa en fil `.env.local` i projektets root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Ersätt med dina egna värden från steg 2

### 4. Skapa databas-schema

1. I Supabase Dashboard, gå till **SQL Editor**
2. Klicka på "New query"
3. Öppna filen `supabase/schema.sql` i din editor
4. Kopiera hela innehållet och klistra in i SQL Editor
5. Klicka "Run" (eller tryck Cmd/Ctrl + Enter)

Du bör se meddelandet: "Success. No rows returned"

### 5. Skapa första admin-användaren

#### Alternativ A: Via Supabase Dashboard (Rekommenderat)

1. Gå till **Authentication** → **Users**
2. Klicka "Add user" → "Create new user"
3. Fyll i:
   - **Email:** din@email.se
   - **Password:** (välj ett säkert lösenord)
   - **Auto Confirm User:** ✅ (bocka i)
4. Klicka "Create user"

#### Alternativ B: Via SQL

```sql
-- Skapa användare (ersätt email och lösenord)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@itbydesign.se',
  crypt('DittLösenord123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  ''
);

-- Skapa profil för användaren
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@itbydesign.se';
```

### 6. (Valfritt) Lägg till testdata

För att testa dashboarden kan du lägga till lite testdata:

```sql
-- Skapa test-organisationer
INSERT INTO public.organizations (name, org_nr, subscription_plan, status) VALUES
  ('Åkeri AB', '556123-4567', 'growth', 'active'),
  ('Bygg & Son', '556234-5678', 'scale', 'active'),
  ('Logistikcenter', '556345-6789', 'care', 'pilot');

-- Lägg till krediter
INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, 100, 'Initial credit purchase'
FROM public.organizations
WHERE name = 'Åkeri AB';

INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, -88, 'Project work consumption'
FROM public.organizations
WHERE name = 'Åkeri AB';

INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, 200, 'Initial credit purchase'
FROM public.organizations
WHERE name = 'Bygg & Son';

INSERT INTO public.credit_ledger (org_id, amount, description)
SELECT id, -155, 'Project work consumption'
FROM public.organizations
WHERE name = 'Bygg & Son';
```

### 7. Starta utvecklingsservern

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000)

Du bör nu omdirigeras till `/login`. Logga in med den användare du skapade i steg 5!

## Felsökning

### "Invalid API key" eller liknande fel

- Kontrollera att `.env.local` finns och har rätt värden
- Starta om dev-servern (`Ctrl+C` och `npm run dev` igen)
- Kontrollera att du kopierat **anon/public** key, inte service_role key

### "relation does not exist" fel

- Kör `supabase/schema.sql` igen i SQL Editor
- Kontrollera att alla tabeller skapades: Gå till **Database** → **Tables**

### Kan inte logga in

- Kontrollera att användaren är skapad: **Authentication** → **Users**
- Kontrollera att "Email Confirm" är aktiverad (grön bock)
- Försök återställa lösenordet via Supabase Dashboard

### RLS-fel: "new row violates row-level security policy"

- Kontrollera att du är inloggad (kolla Network-tab i DevTools)
- Verifiera att RLS-policies skapades korrekt:

```sql
-- Kör denna query för att se policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Du bör se 4 policies: en för varje tabell.

## Nästa steg

När allt fungerar:

1. ✅ Testa att logga in
2. ✅ Verifiera att dashboarden visar data
3. ✅ Testa att logga ut
4. 📖 Läs `docs/tech_stack.md` för utvecklingsregler
5. 🚀 Börja bygga nya features!

## Production Deployment

Se `README.md` för instruktioner om deployment till Vercel.

