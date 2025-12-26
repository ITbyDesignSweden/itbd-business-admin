# Sprint 2: AI Context Awareness - Migration Guide

## Översikt
Sprint 2 lägger till "minne" och kontext till AI-agenten genom att:
1. Lagra affärsprofil för varje organisation
2. Skicka databas-schema dynamiskt från klienten
3. Bygga kontextuell System Prompt baserat på kunddata

---

## Databas-migrationer

Kör följande SQL-filer i **Supabase SQL Editor** i denna ordning:

### 1. Lägg till `business_profile` kolumn
**Fil:** `supabase/schema.sql` (redan uppdaterad)

Eller kör manuellt:
```sql
ALTER TABLE public.organizations
ADD COLUMN business_profile TEXT;

COMMENT ON COLUMN public.organizations.business_profile IS 'Business description used for AI context. Describes industry, use case, and business model.';
```

### 2. Skapa RPC-funktion för schema introspection
**Syfte:** Låter server actions hämta databas-schema effektivt.

```sql
CREATE OR REPLACE FUNCTION get_schema_context()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

COMMENT ON FUNCTION get_schema_context() IS 'Returns schema information for AI context. Used by getSchemaContext() server action.';
```

### 3. Uppdatera VIEW: organizations_with_credits
**Fil:** `supabase/create_organizations_view.sql`

**Syfte:** Inkludera `business_profile` i VIEW:en så att API:t kan hämta den effektivt.

```sql
DROP VIEW IF EXISTS organizations_with_credits;

CREATE VIEW organizations_with_credits AS
SELECT 
  o.id,
  o.created_at,
  o.name,
  o.org_nr,
  o.plan_id,
  o.subscription_start_date,
  o.next_refill_date,
  o.subscription_status,
  o.status,
  o.production_url,
  o.github_repo_url,
  o.supabase_project_ref,
  o.business_profile, -- Ny kolumn
  COALESCE(SUM(cl.amount), 0) AS total_credits,
  sp.name AS plan_name,
  sp.price AS plan_price,
  sp.monthly_credits AS plan_monthly_credits
FROM organizations o
LEFT JOIN credit_ledger cl ON o.id = cl.org_id
LEFT JOIN subscription_plans sp ON o.plan_id = sp.id
GROUP BY o.id, sp.id, sp.name, sp.price, sp.monthly_credits;
```

---

## Verifiering

### 1. Testa att kolumnen finns
```sql
SELECT name, business_profile 
FROM organizations 
LIMIT 1;
```

### 2. Testa RPC-funktionen
```sql
SELECT * FROM get_schema_context() LIMIT 10;
```

### 3. Testa VIEW:en
```sql
SELECT id, name, business_profile, total_credits 
FROM organizations_with_credits 
LIMIT 5;
```

---

## Användning i Admin Portal

### Redigera affärsprofil
1. Gå till **Organisationer** → Välj en organisation
2. Klicka på **redigera-ikonen** (penna)
3. Fyll i fältet **Affärsprofil**
4. Spara

**Exempel på bra affärsprofil:**
> "Byggföretag med 25 anställda. Behöver spåra projekt, offerter och materialbeställningar. Arbetar främst med ROT-avdrag och behöver dokumentation för Skatteverket."

---

## Boilerplate-kod för Kunder

Filen `actions/schema-context.ts` är designad för att kopieras till kundens app.

**Steg för kunden:**
1. Kopiera `actions/schema-context.ts` till deras projekt
2. Kör SQL-migrationen för `get_schema_context()` i deras Supabase
3. Anropa `getSchemaContext()` i widgeten (redan implementerat)

---

## Tekniska Detaljer

### Caching
Schema-context använder React's `cache()` för per-request memoization:
```typescript
const getCachedSchema = cache(async () => fetchSchemaFromDatabase())
```
Detta betyder att samma HTTP-request inte gör duplicate queries, men varje ny request får färsk data.

### API Flow
1. **Widget** → Hämtar schema vid mount (`getSchemaContext()`)
2. **Widget** → Skickar `projectId` + `schema` till `/api/chat`
3. **API** → Hämtar `business_profile` + `total_credits` från VIEW
4. **API** → Bygger dynamisk System Prompt
5. **AI** → Får full kontext om kund, verksamhet och databas

---

## Nästa Steg (Sprint 3)
- Automatisk extrahering av business_profile från konversationer
- Spara konversationshistorik
- Generera tekniska specifikationer

