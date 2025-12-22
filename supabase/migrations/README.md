# Supabase Migrations

Denna mapp innehåller SQL-migrations för ITBD Admin Portal.

## Hur man kör migrations

### Via Supabase Dashboard (Rekommenderat)
1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Navigera till **SQL Editor** i vänstermenyn
4. Öppna filen du vill köra
5. Kopiera innehållet och klistra in i SQL Editor
6. Klicka på **Run** för att exekvera

### Via Supabase CLI (Avancerat)
```bash
supabase db push
```

## Migrations i ordning

### 1. `create_organizations_with_credits_view.sql`
**Syfte:** Optimering av databas-queries  
**Vad den gör:**
- Skapar en PostgreSQL VIEW `organizations_with_credits`
- Eliminerar N+1 query-problem när vi listar organisationer
- Kombinerar organizations med aggregerat kreditsaldo i en enda query

**Performance-vinst:**
- Före: 1 query + N queries (där N = antal organisationer)
- Efter: 1 query totalt
- Exempel: 100 organisationer = 101 queries → 1 query (100x snabbare!)

**Säkerhet:**
- Viewn respekterar samma RLS-policies som base-tabellerna
- Endast authenticated users har SELECT-access

**Kör denna migration om:**
- Du märker att Organizations-sidan laddar långsamt
- Du har 100+ organisationer
- Du vill optimera din databasanvändning

**Test efter migration:**
1. Gå till `/organizations` i din app
2. Öppna Network tab i DevTools
3. Verifiera att endast EN Supabase-query körs (istället för många)

