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

# GitHub Integration (SaaS Factory)
# Personal Access Token för att skapa repositories från templates
# Kräver 'repo' scope (full control of private repositories)
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Template repository som ska användas för provisioning
GITHUB_TEMPLATE_OWNER=itbd-org
GITHUB_TEMPLATE_REPO=itbd-boilerplate-v1

# Cloudflare Turnstile (Sprint 6: Security)
# Site Key (public, används i frontend)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=

# Secret Key (privat, används för verifiering på servern)
CLOUDFLARE_TURNSTILE_SECRET=
```

## Var hittar jag nycklarna?

### Supabase

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Navigera till **Settings** → **API**
4. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### GitHub Personal Access Token

1. Gå till [GitHub Settings](https://github.com/settings/tokens)
2. Klicka **Generate new token** → **Generate new token (classic)**
3. Ge den ett namn, t.ex. "ITBD Admin Portal - Repository Provisioning"
4. Välj scopes:
   - ✅ **repo** (Full control of private repositories)
5. Generera token och kopiera den till `GITHUB_ACCESS_TOKEN`
6. ⚠️ **OBS:** Spara token säkert - den visas bara en gång!

### GitHub Template Repository

- Om du använder standardtemplate från `itbd-org`, behöver du inte ändra `GITHUB_TEMPLATE_OWNER` och `GITHUB_TEMPLATE_REPO`
- Om du vill använda en annan template, uppdatera dessa värden

### Cloudflare Turnstile (Sprint 6)

1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigera till **Turnstile** i sidomenyn
3. Klicka **Add Site**
4. Välj **Managed** och konfigurera:
   - **Site name**: IT by Design - Business Admin
   - **Domain**: Din domän (eller `localhost` för utveckling)
   - **Widget Mode**: Managed (rekommenderat)
5. Kopiera:
   - **Site Key** → `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
   - **Secret Key** → `CLOUDFLARE_TURNSTILE_SECRET`

**För utveckling:** Cloudflare tillhandahåller test-keys:
- Site Key: `1x00000000000000000000AA` (alltid godkänd)
- Secret Key: `1x0000000000000000000000000000000AA`

## Vercel Deployment

När du deployar till Vercel:

1. Gå till Vercel Dashboard → ditt projekt → **Settings** → **Environment Variables**
2. Lägg till alla variablerna ovan (både Supabase och GitHub)
3. Välj environment: Production (och Preview om du vill)
4. Spara och redeploya

## Säkerhet

- `.env.local` är redan i `.gitignore` - commita ALDRIG denna fil!
- `SUPABASE_SERVICE_ROLE_KEY` används endast på servern (API routes)
- `GITHUB_ACCESS_TOKEN` används endast på servern (Server Actions)
- Dela ALDRIG service role key eller GitHub token med klienten eller publikt

