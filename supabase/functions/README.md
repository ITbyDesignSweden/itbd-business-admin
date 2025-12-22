# Supabase Edge Functions

Detta projekt använder Supabase Edge Functions för att säkert hantera publika API-anrop.

## Edge Functions

### `submit-pilot-request`

**Syfte:** Hantera publika ansökningar från `/apply`-formuläret på ett säkert sätt.

**URL:** `https://xmedbyzogflxermekejg.supabase.co/functions/v1/submit-pilot-request`

**Metod:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>
```

**Request Body:**
```json
{
  "email": "anna@foretag.se",
  "contact_name": "Anna Andersson",
  "company_name": "Företag AB",
  "org_nr": "556677-8899",
  "description": "Vi behöver IT-hjälp",
  "file_path": "1234567890-abc123.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "anna@foretag.se",
    "contact_name": "Anna Andersson",
    "company_name": "Företag AB",
    "status": "pending",
    "created_at": "2025-12-23T00:00:00Z"
  }
}
```

**Säkerhet:**
- ✅ Använder `service_role` key för att bypassa RLS på ett kontrollerat sätt
- ✅ Server-side validering av alla inputs
- ✅ Email-validering
- ✅ RLS aktiverad på `pilot_requests` - ingen direkt access från klienten
- ✅ CORS-headers för att tillåta anrop från din frontend

**Varför Edge Function istället för RLS-policy?**

Supabase RLS-policies har begränsningar med `anon`-rollen för INSERT-operationer. 
Edge Functions löser detta genom att:
1. Köra server-side med full kontroll
2. Använda `service_role` för att bypassa RLS på ett säkert sätt
3. Validera och sanitera all input innan insert
4. Skydda personuppgifter (ingen direkt databasaccess från klient)

## Deployment

Edge Functions deployades via MCP Server:
```bash
# Functions är redan deployed i Supabase
# Ingen lokal deployment krävs
```

## Lokal utveckling (om du vill testa lokalt)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local functions
supabase functions serve

# Test function
curl -i --location --request POST 'http://localhost:54321/functions/v1/submit-pilot-request' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@test.com","contact_name":"Test","company_name":"Test AB"}'
```

## Övriga funktioner

För framtida Edge Functions, lägg till här...

