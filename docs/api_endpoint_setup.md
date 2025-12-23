# API Endpoint Setup - Feature P

Detta dokument beskriver hur du konfigurerar den publika API-endpointen för Feature P.

## 🔑 Miljövariabler

För att API-endpointen ska fungera behöver du lägga till `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`.

### Hitta Service Role Key

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Navigera till **Settings** → **API**
4. Under "Project API keys", kopiera **service_role key** (secret)

⚠️ **VARNING:** Service role key är en hemlig nyckel som ger full åtkomst till databasen. Dela ALDRIG denna nyckel publikt!

### Lägg till i .env.local

```bash
# Existing keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Add this line (Feature P: Public API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Varför behövs Service Role Key?

Den publika API-endpointen (`/api/v1/credits`) anropas av kundernas applikationer **utan** Supabase Auth-session. För att kunna:
1. Verifiera API-nyckeln i `api_keys`-tabellen
2. Hämta organisationsdata från `organizations_with_credits`

...måste vi bypassa Row Level Security (RLS). Service role key ger oss denna möjlighet.

## 🧪 Testning

### 1. Generera en API-nyckel

1. Starta dev-servern: `npm run dev`
2. Logga in i admin-portalen
3. Gå till en organisation: `/organizations/[id]`
4. Scrolla ner till "API Access"
5. Klicka **"Generera ny nyckel"**
6. Kopiera nyckeln (börjar med `itbd_`)

### 2. Testa API-endpointen

#### Med cURL:

```bash
curl -X GET http://localhost:3000/api/v1/credits \
  -H "Authorization: Bearer itbd_YOUR_API_KEY_HERE"
```

#### Med JavaScript/Fetch:

```javascript
const response = await fetch('http://localhost:3000/api/v1/credits', {
  headers: {
    'Authorization': 'Bearer itbd_YOUR_API_KEY_HERE'
  }
});

const data = await response.json();
console.log(data);
```

#### Med Postman:

1. Skapa en ny GET-request till `http://localhost:3000/api/v1/credits`
2. Gå till **Headers**-fliken
3. Lägg till:
   - Key: `Authorization`
   - Value: `Bearer itbd_YOUR_API_KEY_HERE`
4. Klicka **Send**

### 3. Förväntad Response

#### Lyckad request (200):

```json
{
  "credits": 150,
  "plan": "Growth",
  "status": "active",
  "subscription_status": "active",
  "monthly_credits": 100,
  "next_refill_date": "2025-02-01T00:00:00Z"
}
```

#### Ogiltig API-nyckel (401):

```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or has been revoked."
}
```

#### Saknad Authorization header (401):

```json
{
  "error": "Missing or invalid Authorization header",
  "message": "Please provide a valid API key in the format: Authorization: Bearer <your-api-key>"
}
```

#### Rate limit överskriden (429):

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

## 🔒 Säkerhet

### Rate Limiting

Endpointen har inbyggd rate limiting:
- **Gräns:** 60 requests per minut per API-nyckel
- **Implementation:** In-memory store (för produktion, använd Redis/Upstash)

### API Key Hashing

- API-nycklar hashas med SHA-256 innan lagring
- Nycklar lagras ALDRIG i klartext i databasen
- Nycklar visas bara EN GÅNG vid generering

### Service Role Key

- Används ENDAST på servern (aldrig exponerad till klienten)
- Krävs för att bypassa RLS i den publika API-endpointen
- Ska ALDRIG committas till Git

## 📊 Monitoring

### Last Used Tracking

Varje gång en API-nyckel används uppdateras `last_used_at`-fältet i databasen. Detta kan användas för:
- Identifiera inaktiva nycklar
- Audit trail
- Användningsstatistik

### Logs

API-endpointen loggar:
- Ogiltiga API-nycklar
- Rate limit-överträdelser
- Interna fel

Kolla Next.js-loggar för felsökning.

## 🚀 Production Deployment

### Vercel

1. Gå till Vercel Dashboard → ditt projekt → **Settings** → **Environment Variables**
2. Lägg till:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (din service role key)
   - Environment: Production (och Preview om du vill)
3. Redeploya projektet

### Rate Limiting i Production

För produktion, överväg att byta från in-memory store till:
- **Redis** (via Upstash, Railway, etc.)
- **Vercel KV** (key-value store)
- **Database-based** (spara rate limit-data i Supabase)

In-memory store fungerar för små volymer men skalas inte horisontellt.

## 📝 API Documentation för Kunder

När du delar API-endpointen med kunder, ge dem denna information:

### Endpoint

```
GET https://your-domain.com/api/v1/credits
```

### Authentication

```
Authorization: Bearer <your-api-key>
```

### Response

```json
{
  "credits": 150,
  "plan": "Growth",
  "status": "active",
  "subscription_status": "active",
  "monthly_credits": 100,
  "next_refill_date": "2025-02-01T00:00:00Z"
}
```

### Rate Limits

- 60 requests per minute per API key
- HTTP 429 returneras vid överträdelse

### Error Codes

- `401` - Invalid or missing API key
- `404` - Organization not found
- `429` - Rate limit exceeded
- `500` - Internal server error

