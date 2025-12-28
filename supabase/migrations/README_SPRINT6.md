# Sprint 6 Migration Guide

## Migration Fil
`20250128_sprint6_gatekeeper.sql`

## Vad gör denna migration?

1. **Skapar `system_settings` tabell** - En singleton-tabell för globala inställningar
2. **Uppdaterar `pilot_requests` tabell** - Lägger till kolumner för AI-berikande och säkerhetsverifiering
3. **Skapar index** - För bättre prestanda vid queries

## Hur kör jag migrationen?

### Alternativ 1: Supabase Dashboard (Rekommenderat för production)

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Gå till **SQL Editor**
4. Öppna filen `supabase/migrations/20250128_sprint6_gatekeeper.sql`
5. Kopiera hela innehållet
6. Klistra in i SQL Editor
7. Klicka **Run**

### Alternativ 2: Supabase CLI (För lokal utveckling)

```bash
# Om du har Supabase CLI installerat
supabase db push

# Eller specifikt denna migration
supabase migration up
```

### Alternativ 3: Installera Supabase CLI

```bash
# Windows (via Scoop)
scoop install supabase

# Windows (via PowerShell)
iwr get.scoop.sh -useb | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS (via Homebrew)
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh
```

## Verifiera att migrationen lyckades

```sql
-- 1. Kolla att system_settings finns
SELECT * FROM system_settings;

-- 2. Kolla att nya kolumner finns i pilot_requests
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pilot_requests'
  AND column_name IN ('fit_score', 'enrichment_data', 'turnstile_verified', 'lead_source');

-- 3. Kolla att index skapades
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'pilot_requests'
  AND indexname LIKE 'idx_pilot_requests_%';
```

## Förväntade resultat

### system_settings tabell
```
 id | enrichment_mode | max_daily_leads | created_at | updated_at
----+-----------------+-----------------+------------+------------
  1 | manual          |              10 | <timestamp>| <timestamp>
```

### pilot_requests nya kolumner
```
 column_name        | data_type | is_nullable
--------------------+-----------+-------------
 fit_score          | integer   | YES
 enrichment_data    | jsonb     | YES
 turnstile_verified | boolean   | NO (default: false)
 lead_source        | text      | NO (default: 'web_form')
```

## Rollback (Om något går fel)

```sql
-- Ta bort nya kolumner från pilot_requests
ALTER TABLE pilot_requests
  DROP COLUMN IF EXISTS fit_score,
  DROP COLUMN IF EXISTS enrichment_data,
  DROP COLUMN IF EXISTS turnstile_verified,
  DROP COLUMN IF EXISTS lead_source;

-- Ta bort index
DROP INDEX IF EXISTS idx_pilot_requests_turnstile;
DROP INDEX IF EXISTS idx_pilot_requests_lead_source;

-- Ta bort system_settings tabell
DROP TABLE IF EXISTS system_settings;

-- Ta bort enum
DROP TYPE IF EXISTS enrichment_mode_type;
```

## Nästa steg efter migration

1. ✅ Lägg till Cloudflare Turnstile keys i `.env.local` (se `ENV_SETUP.md`)
2. ✅ Starta dev server: `npm run dev`
3. ✅ Testa formuläret på `/apply`
4. ✅ Verifiera att Turnstile-widget visas
5. ✅ Skicka en test-ansökan
6. ✅ Kontrollera att den dyker upp i `/pilot-requests`

## Support

Om du stöter på problem:
1. Kolla att alla miljövariabler är korrekta (se `ENV_SETUP.md`)
2. Se `docs/sprint6_implementation_summary.md` för fullständig dokumentation
3. Kontakta teamet för hjälp

