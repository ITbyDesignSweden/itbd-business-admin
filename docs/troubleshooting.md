# Felsökning - ITBD Admin Portal

## "Database error querying schema" vid login

Detta fel kan ha två orsaker:

### Orsak 1: Fel RLS-policies

### Orsak 2: Korrupta användare i auth.users (Vanligare!)

Om du får detta specifika fel i Supabase logs:
```
"error finding user: sql: Scan error on column index 8, name \"email_change\": converting NULL to string is unsupported"
```

Detta beror på att användare har skapats manuellt via SQL med NULL-värden där Supabase förväntar sig tomma strängar.

**SNABB FIX:**

1. Ta bort befintliga användare och skapa nya via Dashboard (REKOMMENDERAT)
2. Eller fixa befintliga användare via SQL

#### Lösning A: Skapa användare via Dashboard (Enklast!)

1. Supabase Dashboard → **Authentication** → **Users**
2. Ta bort befintliga användare (om några finns)
3. Klicka **"Add user"** → **"Create new user"**
4. Fyll i:
   - Email: `admin@itbydesign.se`
   - Password: `DittLösenord123`
   - ✅ **Auto Confirm User** (VIKTIGT!)
5. Klicka "Create user"

Denna metod skapar användare korrekt utan NULL-problem!

#### Lösning B: Fixa via SQL

Om du redan har användare, kör detta i SQL Editor:

```sql
-- Ta bort korrupta användare
DELETE FROM auth.users 
WHERE email_change IS NULL;

-- Skapa ny användare KORREKT (se supabase/create_admin_user_safe.sql)
```

### Orsak 3: Fel RLS-policies

Om ovanstående inte hjälper, följ dessa steg:

### Steg 1: Uppdatera RLS-policies

1. Öppna Supabase Dashboard → **SQL Editor**
2. Kopiera och kör följande SQL:

```sql
-- Drop gamla policies
DROP POLICY IF EXISTS "Admins can do everything" ON organizations;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON credit_ledger;
DROP POLICY IF EXISTS "Admins can do everything" ON projects;

-- Skapa korrekta policies
CREATE POLICY "Authenticated users can do everything on organizations"
  ON organizations
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on profiles"
  ON profiles
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on credit_ledger"
  ON credit_ledger
  FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can do everything on projects"
  ON projects
  FOR ALL
  USING (auth.uid() IS NOT NULL);
```

### Steg 2: Verifiera att policies skapades

Kör denna query:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Du bör se 4 policies - en för varje tabell.

### Steg 3: Testa login igen

Starta om dev-servern och försök logga in igen:

```bash
# Stoppa servern (Ctrl+C)
npm run dev
```

## Alternativ lösning: Återskapa schema från början

Om problemet kvarstår, återskapa hela schemat:

### 1. Ta bort gamla tabeller

```sql
-- Ta bort tabeller (i rätt ordning pga foreign keys)
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
```

### 2. Skapa nya tabeller

Kopiera och kör hela innehållet från `supabase/schema.sql` (den uppdaterade versionen).

## Andra vanliga fel

### "Invalid API key"

**Orsak:** Felaktiga environment variables

**Lösning:**

1. Kontrollera att `.env.local` finns i projektets root
2. Verifiera att värdena är korrekta:
   - `NEXT_PUBLIC_SUPABASE_URL` ska vara din projekt-URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ska vara **anon/public** key (inte service_role!)
3. Starta om dev-servern

```bash
# Stoppa servern (Ctrl+C)
npm run dev
```

### "Email not confirmed"

**Orsak:** Användaren är inte bekräftad i Supabase

**Lösning:**

1. Gå till Supabase Dashboard → **Authentication** → **Users**
2. Hitta din användare
3. Klicka på tre prickar → "Send confirmation email" ELLER
4. Klicka på användaren → Sätt "Email Confirmed At" till nutid

### "relation does not exist"

**Orsak:** Tabeller är inte skapade

**Lösning:**

1. Gå till Supabase Dashboard → **Database** → **Tables**
2. Verifiera att följande tabeller finns:
   - `organizations`
   - `profiles`
   - `credit_ledger`
   - `projects`
3. Om de saknas, kör `supabase/schema.sql` i SQL Editor

### Kan inte se data i dashboarden

**Orsak:** Ingen testdata finns

**Lösning:**

Lägg till testdata:

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

### Middleware redirect loop

**Orsak:** Problem med cookies eller session

**Lösning:**

1. Rensa browser cookies för `localhost:3000`
2. Öppna inkognito/private window
3. Försök logga in igen

### TypeScript-fel vid build

**Orsak:** Cache-problem

**Lösning:**

```bash
# Rensa Next.js cache
Remove-Item -Path ".next" -Recurse -Force

# Bygg igen
npm run build
```

## Debug-tips

### Kolla Supabase logs

1. Supabase Dashboard → **Logs**
2. Välj service: **API** eller **Postgres**
3. Leta efter felmeddelanden

### Kolla browser console

1. Öppna Developer Tools (F12)
2. Gå till **Console**-fliken
3. Leta efter röda felmeddelanden

### Kolla server logs

I terminalen där `npm run dev` körs, kolla efter:
- Supabase-fel
- Database-fel
- Auth-fel

### Testa Supabase-anslutning direkt

Skapa en test-fil:

```typescript
// test-supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase.from('organizations').select('*')
  console.log('Data:', data)
  console.log('Error:', error)
}

test()
```

Kör:
```bash
npx tsx test-supabase.ts
```

## Behöver mer hjälp?

1. Kolla Supabase dokumentation: https://supabase.com/docs
2. Kolla Next.js dokumentation: https://nextjs.org/docs
3. Läs `docs/setup_guide.md` igen
4. Kontrollera att alla steg är gjorda

## Vanliga misstag

### ❌ Fel: Använder service_role key istället för anon key

Service role key ger full access och ska ALDRIG användas i client-kod!

**Rätt:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ❌ Fel: Glömmer att starta om dev-servern efter .env.local ändringar

Efter ändringar i `.env.local` måste servern startas om!

```bash
# Ctrl+C för att stoppa
npm run dev
```

### ❌ Fel: Kör schema.sql flera gånger utan att drop:a först

Detta skapar dubbletter av policies.

**Rätt sätt:**
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...
```

### ❌ Fel: Använder fel RLS-syntax

```sql
-- FEL:
using (auth.role() = 'authenticated')

-- RÄTT:
using (auth.uid() IS NOT NULL)
```

## Snabb checklista

När något går fel, gå igenom denna lista:

- [ ] `.env.local` finns och har korrekta värden
- [ ] Dev-servern är omstartad efter env-ändringar
- [ ] Alla tabeller finns i Supabase (Database → Tables)
- [ ] RLS är aktiverat på alla tabeller
- [ ] RLS policies är korrekta (kör fix_rls_policies.sql)
- [ ] Admin-användare är skapad och bekräftad
- [ ] Browser cache är rensad / använder inkognito
- [ ] Inga JavaScript-fel i browser console
- [ ] Inga fel i terminal där dev-servern körs

Om allt ovan är ✅ och det fortfarande inte fungerar, kontakta support eller öppna ett issue!

