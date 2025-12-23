# Subscription Refill Cron Job

**Feature N: The Refill Engine (Automation)**

Denna Edge Function hanterar automatisk månatlig kreditpåfyllning för organisationer med aktiva prenumerationer.

## 🎯 Syfte

- Körs automatiskt varje natt (midnight UTC)
- Fyller på krediter för orgs där `next_refill_date <= TODAY`
- Uppdaterar `next_refill_date` med +1 månad
- Loggar alla körningar i `refill_executions` tabellen

## 🔒 Säkerhet

- **Kräver service_role key** för att köras
- Endast anropbar med korrekt Authorization header
- Validerar att anroparen använder service role (inte user tokens)
- Perfekt för cron-jobb som körs från Supabase eller Vercel

## 📋 Setup Instructions

### 1. Deploy Edge Function till Supabase

```bash
# Logga in på Supabase CLI
npx supabase login

# Länka ditt projekt
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploya funktionen
npx supabase functions deploy subscription-refill
```

### 2. Konfigurera Cron Schedule

Det finns två alternativ för att köra funktionen automatiskt:

#### **Alternativ A: Supabase Cron (Rekommenderat)**

1. Gå till Supabase Dashboard → Database → Cron Jobs
2. Skapa ny cron job:

```sql
-- Run daily at midnight UTC
SELECT
  cron.schedule(
    'subscription-refill-daily',
    '0 0 * * *',  -- Varje dag kl 00:00 UTC
    $$
    SELECT
      net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/subscription-refill',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        )
      ) as request_id;
    $$
  );
```

**Obs:** Ersätt `YOUR_PROJECT_REF` med ditt projekt-ID.

#### **Alternativ B: Vercel Cron (Om du använder Vercel)**

1. Skapa `vercel.json` i root:

```json
{
  "crons": [
    {
      "path": "/api/cron/refill",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. Skapa API route `app/api/cron/refill/route.ts`:

```typescript
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Call Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/subscription-refill`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  )

  const data = await response.json()
  return NextResponse.json(data)
}
```

### 3. Test Funktionen Manuellt

```bash
# Hämta din service_role key från Supabase Dashboard → Settings → API
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SERVICE_ROLE_KEY="your-service-role-key"

# Testa funktionen
curl -X POST "$SUPABASE_URL/functions/v1/subscription-refill" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Förväntat svar:**
```json
{
  "success": true,
  "message": "Subscription refill completed successfully",
  "execution_id": "uuid-here",
  "organizations_processed": 3,
  "credits_added": 150,
  "duration_ms": 234,
  "errors": []
}
```

## 📊 Monitoring & Debugging

### Admin UI

Gå till `/settings/refills` i admin-portalen för att:
- Se vilka organisationer som behöver påfyllning
- Manuellt trigga påfyllning (för testning)
- Se historik över tidigare körningar

### Database Queries

```sql
-- Visa senaste körningarna
SELECT * FROM refill_executions
ORDER BY executed_at DESC
LIMIT 10;

-- Vilka orgs kommer fyllas på nästa gång?
SELECT * FROM organizations_due_for_refill;

-- Kontrollera en specifik orgs prenumeration
SELECT 
  name,
  subscription_status,
  next_refill_date,
  plan_name,
  plan_monthly_credits
FROM organizations_with_credits
WHERE id = 'org-uuid-here';
```

## 🧪 Testing

### 1. Skapa test-organisation med prenumeration

```sql
-- Sätt next_refill_date till igår för att trigga påfyllning
UPDATE organizations
SET 
  subscription_status = 'active',
  next_refill_date = CURRENT_DATE - INTERVAL '1 day'
WHERE id = 'test-org-uuid';
```

### 2. Kör påfyllning manuellt från Admin UI

1. Gå till `/settings/refills`
2. Klicka "Kör påfyllning nu"
3. Verifiera att krediter lades till

### 3. Kontrollera resultatet

```sql
-- Kontrollera att transaktion skapades
SELECT * FROM credit_ledger
WHERE org_id = 'test-org-uuid'
ORDER BY created_at DESC
LIMIT 1;

-- Kontrollera att next_refill_date uppdaterades
SELECT name, next_refill_date
FROM organizations
WHERE id = 'test-org-uuid';
```

## ⚙️ Environment Variables

Edge Function använder dessa miljövariabler (sätts automatiskt av Supabase):

- `SUPABASE_URL` - Din Supabase projekt-URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (för att bypassa RLS)

## 🔄 Logik Flow

```
1. Cron trigger (midnight UTC)
   ↓
2. Edge Function anropas med service_role key
   ↓
3. Validerar authorization
   ↓
4. Anropar database function: process_subscription_refills()
   ↓
5. Database function:
   - Hittar alla orgs med subscription_status='active' OCH next_refill_date <= TODAY
   - För varje org:
     * Hämtar plan details
     * Skapar transaktion i credit_ledger
     * Uppdaterar next_refill_date (+1 månad)
   - Loggar execution i refill_executions
   ↓
6. Returnerar summary med stats
```

## 📝 Troubleshooting

**Problem:** Cron-jobbet körs inte

- Kontrollera att cron schedule är korrekt konfigurerad
- Verifiera att service_role key är korrekt i cron-konfigurationen
- Kolla logs i Supabase Dashboard → Edge Functions → Logs

**Problem:** "Unauthorized" error

- Edge Function kräver service_role key, inte anon key
- Kontrollera att Authorization header innehåller rätt key

**Problem:** Organisationer fylls inte på

- Kontrollera att `subscription_status = 'active'`
- Kontrollera att `next_refill_date <= CURRENT_DATE`
- Kontrollera att `plan_id` är satt och refererar till en giltig plan
- Kör query: `SELECT * FROM organizations_due_for_refill`

**Problem:** Dubbelkökning av päfyllning

- Edge Function är idempotent - endast orgs där `next_refill_date <= TODAY` fylls på
- Efter påfyllning uppdateras `next_refill_date` till +1 månad
- Därför är det säkert att köra funktionen flera gånger per dag

## 🚀 Performance

- **Database-driven:** All logik körs i PostgreSQL (optimal prestanda)
- **Batch processing:** Alla orgs processas i en transaktion
- **Error isolation:** Om en org failar fortsätter processen med nästa
- **Logging:** Varje körning loggas med stats och errors
- **Idempotent:** Säkert att köra flera gånger utan dupliceringar

## 📚 Related Files

- **Database function:** `supabase/migrations/20250123_create_refill_engine.sql`
- **Edge function:** `supabase/functions/subscription-refill/index.ts`
- **Server actions:** `actions/database.ts` (triggerSubscriptionRefills)
- **Admin UI:** `app/(dashboard)/settings/refills/page.tsx`

