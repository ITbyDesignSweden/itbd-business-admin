# Supabase Migrations

Detta är migrationsfiler för IT by Design Admin Portal.

## Hur man kör migrationer

### 1. Kör SQL-migrationer i Supabase Dashboard

1. Gå till din Supabase-projekt: https://supabase.com/dashboard
2. Navigera till **SQL Editor**
3. **Aktiva migrationer** (dessa används):
   - `add_project_fk_to_credit_ledger.sql` - Foreign key constraint
   - `create_organizations_with_credits_view.sql` - VIEW för credits
   - `setup_pilot_storage.sql` - Storage bucket för filuppladdning
   
4. **Automatiskt körda via MCP** (redan implementerade):
   - RLS policies för pilot_requests ✅
   - Edge Function deployment ✅

### 2. Pilot Requests Implementation

**Arkitektur:**
- Public form (`/apply`) → Edge Function (`submit-pilot-request`) → Database (med RLS)
- Admin dashboard (`/pilot-requests`) → Direct database access (autentiserad)

**Säkerhet:**
- ✅ RLS aktiverad på `pilot_requests`
- ✅ Edge Function hanterar publika submissions (via service_role)
- ✅ Storage bucket `pilot-uploads` skyddad (endast admins kan läsa filer)

## Verifiering

För att verifiera att allt fungerar:

1. **Testa publika formuläret:** Gå till `/apply` och skicka en ansökan med en fil
2. **Testa admin-vyn:** Logga in och gå till `/pilot-requests` för att se ansökan och ladda ner filen

## Filvalidering

Formuläret validerar följande:
- **Max filstorlek:** 10MB
- **Tillåtna filtyper:**
  - PDF (`.pdf`)
  - Word (`.doc`, `.docx`)
  - Excel (`.xls`, `.xlsx`)
  - Bilder (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
