# 🚨 SNABB FIX - "Database error querying schema" 

## Problem
Du får detta fel när du försöker logga in:
```
"error finding user: sql: Scan error on column index 8, name \"email_change\": 
converting NULL to string is unsupported"
```

## Orsak
Användare har skapats med NULL-värden i `auth.users` tabellen där Supabase förväntar sig tomma strängar ('').

## ✅ LÖSNING (5 minuter)

### Steg 1: Ta bort befintliga användare

1. Öppna Supabase Dashboard
2. Gå till **Authentication** → **Users**
3. Ta bort ALLA befintliga användare (klicka på tre prickar → Delete)

### Steg 2: Skapa ny användare KORREKT

1. Klicka **"Add user"** → **"Create new user"**
2. Fyll i:
   ```
   Email: admin@itbydesign.se
   Password: Admin123!
   ```
3. ✅ **VIKTIGT:** Bocka i **"Auto Confirm User"**
4. Klicka **"Create user"**

### Steg 3: (Valfritt) Skapa profil

Kör detta i SQL Editor:

```sql
-- Skapa profil för den nya användaren
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@itbydesign.se'
ON CONFLICT (id) DO NOTHING;
```

### Steg 4: Testa login

1. Gå till http://localhost:3000
2. Logga in med:
   - Email: `admin@itbydesign.se`
   - Password: `Admin123!`

## ✨ Det borde fungera nu!

---

## Alternativ lösning (Om du vill fixa istället för att ta bort)

Kör detta i SQL Editor:

```sql
-- Fixa befintliga användare
UPDATE auth.users 
SET 
  email_change = '',
  phone_change = '',
  email_change_token_current = '',
  email_change_token_new = '',
  phone_change_token = ''
WHERE email_change IS NULL;

-- Verifiera fix
SELECT 
  id, 
  email, 
  email_confirmed_at,
  CASE 
    WHEN email_change IS NULL THEN '❌ NULL (BAD)' 
    ELSE '✅ OK' 
  END as status
FROM auth.users;
```

Alla användare ska visa "✅ OK" i status-kolumnen.

---

## Varför hände detta?

Manuell INSERT i `auth.users` via SQL skapar ofta ofullständiga poster. Supabase Dashboard fyller automatiskt i alla nödvändiga fält med korrekta default-värden.

## Best Practice

**Skapa ALLTID användare via Supabase Dashboard**, inte via SQL!

Om du måste använda SQL, använd `supabase/create_admin_user_safe.sql` som har alla nödvändiga fält.

---

## Fortfarande problem?

Se `docs/troubleshooting.md` för mer omfattande felsökning.

