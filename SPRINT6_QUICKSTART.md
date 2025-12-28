# 🚀 Sprint 6 Quick Start Guide

**Sprint:** The Gatekeeper  
**Tid att sätta upp:** ~10 minuter

---

## ⚡ Snabbstart (3 steg)

### 1️⃣ Kör Database Migration

**Via Supabase Dashboard:**
```
1. Öppna Supabase Dashboard → SQL Editor
2. Kopiera innehållet från: supabase/migrations/20250128_sprint6_gatekeeper.sql
3. Klistra in och klicka RUN
```

**Verifiera:**
```sql
SELECT * FROM system_settings;  -- Ska returnera 1 rad
```

### 2️⃣ Lägg till Cloudflare Turnstile Keys

**För utveckling (testar alltid godkänt):**
```bash
# I .env.local
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

**För production:**
1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
2. Skapa ny Site
3. Kopiera Site Key och Secret Key
4. Lägg till i `.env.local` / Vercel Environment Variables

### 3️⃣ Starta & Testa

```bash
npm install  # Installerar @marsidev/react-turnstile
npm run dev
```

**Testa:**
1. Öppna http://localhost:3000/apply
2. Fyll i formuläret
3. Vänta på Turnstile-verifiering (grön check ✓)
4. Klicka "Skicka ansökan"
5. Gå till http://localhost:3000/pilot-requests
6. Se din ansökan → Klicka "Godkänn"

---

## 🎯 Vad är nytt?

### Frontend (`/apply`)
- ✅ Cloudflare Turnstile CAPTCHA-widget
- ✅ Submit-knapp aktiveras bara efter verifiering
- ✅ Bättre felmeddelanden

### Backend
- ✅ Server-side Turnstile-verifiering
- ✅ Ny `submitPilotRequest` Server Action
- ✅ Databas redo för AI-berikande (Sprint 7)

### Database
- ✅ `system_settings` tabell (global configuration)
- ✅ `pilot_requests` nya kolumner:
  - `turnstile_verified` - Säkerhetsverifiering
  - `enrichment_data` - AI-data (används i Sprint 7)
  - `fit_score` - AI-kvalitetspoäng (används i Sprint 7)
  - `lead_source` - Spårning av leadkälla

### Admin UI (`/pilot-requests`)
- ✅ Godkänn/Neka knappar (fanns redan från tidigare sprint!)
- ✅ Kopierar AI-data till organisation vid godkännande

---

## 📋 Deployment Checklist

### Development
- [x] Kör migration lokalt
- [x] Lägg till test-keys i `.env.local`
- [x] `npm install`
- [x] `npm run dev`
- [x] Testa formulär på `/apply`

### Production (Vercel)
- [ ] Kör migration på production-databasen
- [ ] Lägg till riktiga Cloudflare keys i Vercel Environment Variables:
  - `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`
  - `CLOUDFLARE_TURNSTILE_SECRET`
- [ ] Deploy till Vercel
- [ ] Testa formulär på production-domän
- [ ] Övervaka Cloudflare Dashboard för verifieringsstatistik

---

## 🔧 Troubleshooting

### Problem: "Säkerhetsverifiering krävs"
**Lösning:** Vänta tills Turnstile-widget visar grön check. Om den inte laddas:
- Kontrollera att `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` finns i `.env.local`
- Ladda om sidan

### Problem: "Säkerhetsverifiering misslyckades"
**Lösning:**
- Kontrollera att `CLOUDFLARE_TURNSTILE_SECRET` finns i `.env.local`
- För utveckling: använd test-secret `1x0000000000000000000000000000000AA`

### Problem: Migration fel
**Lösning:**
- Se `supabase/migrations/README_SPRINT6.md` för verifiering och rollback

### Problem: TypeScript errors
**Lösning:**
```bash
npm install  # Installerar @marsidev/react-turnstile
```

---

## 📚 Mer Information

- **Fullständig dokumentation:** `docs/sprint6_implementation_summary.md`
- **Migration guide:** `supabase/migrations/README_SPRINT6.md`
- **Environment setup:** `ENV_SETUP.md`
- **Sprint plan:** `docs/active_sprint.md`

---

## 🎉 Nästa Sprint

Sprint 6 lägger grunden för **Sprint 7: AI Enrichment**

**Kommande features:**
- 🤖 Automatisk företagsanalys med AI
- 📊 Fit Score-beräkning (0-100)
- 🎯 Smart prioritering av kvalitativa leads
- ⚙️ System Settings UI för att styra AI-läge

**Tack vare Sprint 6 har vi nu:**
- Säker lead-inmatning (Turnstile)
- Databas redo för AI-data (`enrichment_data`)
- System för att kontrollera inflödet (`system_settings`)

---

**Framgång!** 🚀 Sprint 6 "The Gatekeeper" är redo att köra!

