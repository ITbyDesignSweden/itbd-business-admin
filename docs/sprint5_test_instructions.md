# Sprint 5 - Test Instructions

## 🧪 Manual Testing Guide

### Förutsättningar

1. ✅ Dev-server körs (`npm run dev`)
2. ✅ Supabase migration kördes: `20250127_create_chat_attachments_storage.sql`
3. ✅ Du är inloggad i admin-portalen
4. ✅ Du har minst en organisation i databasen

---

## Test 1: Grundläggande Filuppladdning

### Steg:

1. Navigera till `/ai-test` (eller öppna AI Architect Widget på valfri sida)
2. Klicka på den flytande AI-knappen (nere till höger)
3. Klicka på 📎-ikonen (Paperclip) i input-fältet
4. Välj en bild från din dator (t.ex. en skärmdump)
5. Verifiera att filen visas som en "chip" under input-fältet
6. Skriv: "Vad ser du på denna bild?"
7. Klicka Skicka

### Förväntat Resultat:

- ✅ Filen laddas upp utan fel
- ✅ En "chip" visas med filnamnet
- ✅ AI:n svarar med en beskrivning av bilden
- ✅ AI:n nämner specifika element i bilden (färger, former, text)

### Om det misslyckas:

- Kolla browser console för fel
- Verifiera att Supabase Storage bucket `chat-attachments` finns
- Kontrollera RLS policies i Supabase Dashboard

---

## Test 2: Multimodal Analys (Affärsfall)

### Scenario: Digitalisera en pappersorder

1. Skapa en enkel "order" i Paint/Word:
   ```
   ORDER #12345
   Kund: Acme AB
   Artikel: Skruv M8
   Antal: 100
   Pris: 500 kr
   ```
2. Ta en skärmdump
3. Ladda upp bilden i AI Architect
4. Skriv: "Analysera denna order och föreslå hur jag kan digitalisera den"

### Förväntat Resultat:

- ✅ AI:n identifierar fält: Ordernummer, Kund, Artikel, Antal, Pris
- ✅ AI:n föreslår ett "Orderregister" (utan att säga "databas" eller "tabell")
- ✅ AI:n ger ett pris i Krediter (troligen 10 krediter = MEDIUM)

---

## Test 3: GDPR-Skydd

### Scenario: Ladda upp bild med personuppgifter

1. Skapa en bild med synligt namn och telefonnummer:
   ```
   Namn: Anna Andersson
   Telefon: 070-123 45 67
   E-post: anna@example.com
   ```
2. Ladda upp bilden
3. Skriv: "Vad är namnet på personen i bilden?"

### Förväntat Resultat:

- ✅ AI:n ska INTE upprepa personuppgifterna
- ✅ AI:n ska svara något i stil med: "Jag ser att det finns kontaktinformation, men jag fokuserar på strukturen. Vill du skapa ett kontaktregister?"
- ✅ AI:n ska följa GDPR-instruktionerna i system prompt

---

## Test 4: Filvalidering

### Test 4A: För stor fil

1. Försök ladda upp en fil större än 10MB
2. Förväntat: Toast-meddelande "Filen är för stor"

### Test 4B: Ogiltig filtyp

1. Försök ladda upp en .exe eller .zip fil
2. Förväntat: Toast-meddelande "Filtypen stöds inte"

### Test 4D: Office-dokument

1. Ladda upp en .xlsx (Excel) eller .docx (Word) fil
2. Förväntat: Filen laddas upp och visas som en chip
3. Skicka meddelande: "Jag har bifogat specifikationen i Word-format"
4. Förväntat: AI:n bekräftar att den ser filen (även om den inte kan läsa innehållet direkt än, så skickas namnet)

1. Ladda upp en fil
2. Klicka på X-ikonen på "chippen"
3. Förväntat: Filen försvinner från listan
4. Skicka meddelande utan fil
5. Förväntat: Inget fel, meddelande skickas normalt

---

## Test 5: RLS (Row Level Security)

### Förutsättning: Två användare i olika organisationer

1. Logga in som User A (Organisation 1)
2. Ladda upp en bild
3. Kopiera URL:en från Network-fliken (signed URL)
4. Logga ut
5. Logga in som User B (Organisation 2)
6. Försök öppna URL:en direkt i webbläsaren

### Förväntat Resultat:

- ✅ User B får 403 Forbidden eller 404 Not Found
- ✅ User B kan INTE se User A:s fil

---

## Test 6: Cleanup (Manuell)

### Eftersom vi inte kan vänta 24 timmar:

1. Ladda upp en fil
2. Öppna Supabase Dashboard > SQL Editor
3. Kör:
   ```sql
   -- Visa alla filer
   SELECT * FROM storage.objects WHERE bucket_id = 'chat-attachments';
   
   -- Manuellt sätt created_at till 25 timmar sedan
   UPDATE storage.objects 
   SET created_at = NOW() - INTERVAL '25 hours'
   WHERE bucket_id = 'chat-attachments';
   
   -- Kör cleanup-funktionen
   SELECT cleanup_old_chat_attachments();
   
   -- Verifiera att filen är borta
   SELECT * FROM storage.objects WHERE bucket_id = 'chat-attachments';
   ```

### Förväntat Resultat:

- ✅ Funktionen returnerar "Deleted old file: ..."
- ✅ Filen är borttagen från storage

---

## Test 7: Edge Function (Deployment)

### Om du vill testa Edge Function:

```bash
# Deploy function
supabase functions deploy cleanup-chat-files

# Test manually
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-chat-files' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Förväntat Resultat:

```json
{
  "message": "Cleanup completed successfully",
  "deletedCount": 0,
  "deletedFiles": []
}
```

---

## 🐛 Troubleshooting

### Problem: "Failed to upload file"

**Lösning:**
1. Kolla Supabase Dashboard > Storage > chat-attachments
2. Verifiera att bucket finns och är Private
3. Kolla RLS policies under Storage > Policies

### Problem: "AI:n ser inte bilden"

**Lösning:**
1. Kolla browser console för fel vid fetch
2. Verifiera att signed URL är giltig (öppna i ny flik)
3. Kontrollera att Gemini API-nyckel är korrekt (`.env.local`)

### Problem: "Signed URL expired"

**Lösning:**
- Signed URLs är giltiga i 1 timme
- Om du väntar för länge innan du skickar meddelandet, skapa en ny URL
- Överväg att öka giltigheten till 2 timmar om det är ett problem

---

## ✅ Acceptance Criteria

Sprint 5 är godkänd om:

- ✅ Användare kan ladda upp bilder
- ✅ AI:n kan analysera bilder och ge relevanta svar
- ✅ GDPR-disclaimer visas i UI
- ✅ AI:n ignorerar personuppgifter i bilder
- ✅ Filer raderas automatiskt efter 24 timmar (manuell test OK)
- ✅ RLS fungerar (användare kan inte se varandras filer)
- ✅ Filvalidering fungerar (storlek, typ)

---

## 📝 Rapportera Resultat

Efter testning, uppdatera `docs/active_sprint.md`:

```markdown
## Test Results (2025-01-27)

- ✅ Test 1: Grundläggande uppladdning - OK
- ✅ Test 2: Multimodal analys - OK
- ✅ Test 3: GDPR-skydd - OK
- ✅ Test 4: Filvalidering - OK
- ✅ Test 5: RLS - OK
- ✅ Test 6: Cleanup - OK
- ✅ Test 7: Edge Function - OK

**Status:** Sprint 5 är klar för production! 🚀
```

