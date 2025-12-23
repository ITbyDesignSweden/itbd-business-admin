# API Usage Examples - För Kunder

Detta dokument visar hur kunder kan integrera ITBD Admin API i sina applikationer.

## 🔑 Hämta din API-nyckel

1. Logga in i ITBD Admin Portal
2. Gå till din organisation
3. Scrolla ner till "API Access"
4. Klicka "Generera ny nyckel"
5. **Kopiera nyckeln omedelbart** - den visas bara en gång!

## 📡 API Endpoint

```
GET https://admin.itbydesign.se/api/v1/credits
```

*(Ersätt med din faktiska domän)*

## 💻 Kodexempel

### JavaScript/TypeScript (Fetch)

```typescript
async function getCredits() {
  const API_KEY = 'itbd_your_api_key_here';
  
  try {
    const response = await fetch('https://admin.itbydesign.se/api/v1/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Credits:', data.credits);
    console.log('Plan:', data.plan);
    console.log('Status:', data.status);
    
    return data;
  } catch (error) {
    console.error('Error fetching credits:', error);
    throw error;
  }
}

// Användning
getCredits().then(data => {
  console.log('Current balance:', data.credits);
});
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface CreditData {
  credits: number;
  plan: string;
  status: string;
  subscription_status: string;
  monthly_credits: number;
  next_refill_date: string | null;
}

export function useCredits() {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const API_KEY = process.env.NEXT_PUBLIC_ITBD_API_KEY;

    async function fetchCredits() {
      try {
        const response = await fetch('https://admin.itbydesign.se/api/v1/credits', {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, []);

  return { data, loading, error };
}

// Användning i komponent
function CreditBalance() {
  const { data, loading, error } = useCredits();

  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Fel: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Kreditsaldo</h2>
      <p>Tillgängliga krediter: {data.credits}</p>
      <p>Plan: {data.plan}</p>
      <p>Status: {data.status}</p>
    </div>
  );
}
```

### Node.js (Backend)

```javascript
const https = require('https');

function getCredits(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admin.itbydesign.se',
      path: '/api/v1/credits',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Användning
const API_KEY = process.env.ITBD_API_KEY;
getCredits(API_KEY)
  .then(data => {
    console.log('Credits:', data.credits);
    console.log('Plan:', data.plan);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Python

```python
import requests
import os

API_KEY = os.getenv('ITBD_API_KEY')
API_URL = 'https://admin.itbydesign.se/api/v1/credits'

def get_credits():
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print(f"Credits: {data['credits']}")
        print(f"Plan: {data['plan']}")
        print(f"Status: {data['status']}")
        
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        raise

# Användning
if __name__ == '__main__':
    credits_data = get_credits()
```

### cURL (Terminal)

```bash
curl -X GET https://admin.itbydesign.se/api/v1/credits \
  -H "Authorization: Bearer itbd_your_api_key_here" \
  -H "Content-Type: application/json"
```

## 📊 Response Format

### Lyckad Response (200 OK)

```json
{
  "credits": 150,
  "plan": "Growth",
  "status": "active",
  "subscription_status": "active",
  "monthly_credits": 100,
  "next_refill_date": "2025-02-01T00:00:00.000Z"
}
```

**Fält:**
- `credits` (number) - Nuvarande kreditsaldo
- `plan` (string) - Namn på abonnemangsplan
- `status` (string) - Organisationsstatus: `"pilot"`, `"active"`, eller `"churned"`
- `subscription_status` (string) - Abonnemangsstatus: `"active"`, `"paused"`, `"cancelled"`, eller `"inactive"`
- `monthly_credits` (number) - Antal krediter som fylls på varje månad
- `next_refill_date` (string | null) - Datum för nästa påfyllning (ISO 8601)

### Felresponser

#### 401 Unauthorized - Ogiltig API-nyckel

```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or has been revoked."
}
```

#### 401 Unauthorized - Saknad Authorization header

```json
{
  "error": "Missing or invalid Authorization header",
  "message": "Please provide a valid API key in the format: Authorization: Bearer <your-api-key>"
}
```

#### 429 Too Many Requests - Rate limit

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

#### 404 Not Found - Organisation hittades inte

```json
{
  "error": "Organization not found"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## 🔒 Säkerhet & Best Practices

### 1. Förvara API-nyckeln säkert

❌ **Gör INTE:**
```javascript
// Hårdkoda ALDRIG API-nyckeln i koden
const API_KEY = 'itbd_abc123...';
```

✅ **Gör:**
```javascript
// Använd miljövariabler
const API_KEY = process.env.ITBD_API_KEY;
```

### 2. Exponera ALDRIG nyckeln på klientsidan

❌ **Gör INTE:**
```javascript
// I en React-komponent (körs i webbläsaren)
const API_KEY = 'itbd_abc123...'; // FARLIGT!
```

✅ **Gör:**
```javascript
// Anropa API:et från din egen backend
// Din backend håller API-nyckeln hemlig
```

### 3. Hantera rate limits

```typescript
async function getCreditsWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (response.status === 429) {
        // Rate limit - vänta och försök igen
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 4. Cacha resultatet

```typescript
// Cacha credits i 1 minut för att minska API-anrop
let cachedData: CreditData | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minut

async function getCachedCredits() {
  const now = Date.now();
  
  if (cachedData && (now - cacheTime) < CACHE_DURATION) {
    return cachedData;
  }

  const data = await getCredits();
  cachedData = data;
  cacheTime = now;
  
  return data;
}
```

## 🚨 Felsökning

### Problem: "Invalid API key"

**Lösning:**
1. Kontrollera att du kopierade hela nyckeln (börjar med `itbd_`)
2. Verifiera att nyckeln inte har återkallats i admin-portalen
3. Se till att `Authorization`-headern är korrekt formaterad: `Bearer itbd_...`

### Problem: "Rate limit exceeded"

**Lösning:**
1. Vänta 1 minut innan du försöker igen
2. Implementera caching för att minska antalet API-anrop
3. Använd exponential backoff vid retry

### Problem: CORS-fel i webbläsaren

**Lösning:**
API:et är avsett att anropas från backend, inte direkt från webbläsaren. Skapa en proxy-endpoint i din egen backend:

```typescript
// Din backend (t.ex. Next.js API Route)
export async function GET(request: Request) {
  const response = await fetch('https://admin.itbydesign.se/api/v1/credits', {
    headers: {
      'Authorization': `Bearer ${process.env.ITBD_API_KEY}`,
    },
  });
  
  const data = await response.json();
  return Response.json(data);
}
```

## 📞 Support

Om du stöter på problem eller har frågor:
- Kontakta IT by Design support
- Kolla din API-nyckel i admin-portalen
- Verifiera att din organisation har aktiv status

