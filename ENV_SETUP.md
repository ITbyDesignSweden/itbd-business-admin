# Environment Variables Setup

Skapa en fil `.env.local` i projektets root med följande innehåll:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xmedbyzogflxermekejg.supabase.co

# Din 'anon' / 'public' key (den långa strängen)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase Service Role Key (Feature P: Public API)
# ⚠️ VARNING: Denna nyckel ger full åtkomst till databasen. Dela ALDRIG publikt!
SUPABASE_SERVICE_ROLE_KEY=
```

## Var hittar jag nycklarna?

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Navigera till **Settings** → **API**
4. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Vercel Deployment

När du deployar till Vercel:

1. Gå till Vercel Dashboard → ditt projekt → **Settings** → **Environment Variables**
2. Lägg till alla tre variablerna ovan
3. Välj environment: Production (och Preview om du vill)
4. Spara och redeploya

## Säkerhet

- `.env.local` är redan i `.gitignore` - commita ALDRIG denna fil!
- `SUPABASE_SERVICE_ROLE_KEY` används endast på servern (API routes)
- Dela ALDRIG service role key med klienten

