-- Fix för "Database error querying schema" i Auth
-- Detta fel uppstår när auth.users har NULL-värden i kolumner som inte ska vara NULL

-- STEG 1: Ta bort potentiellt korrupta användare
-- (Om du har skapat användare manuellt via SQL)
DELETE FROM auth.users WHERE email_change IS NULL AND confirmed_at IS NULL;

-- STEG 2: Om du vill behålla befintliga användare, uppdatera istället:
-- Uncomment raderna nedan om du vill försöka fixa istället för att ta bort

-- UPDATE auth.users 
-- SET 
--   email_change = '',
--   phone_change = '',
--   email_change_token_current = '',
--   email_change_token_new = '',
--   phone_change_token = ''
-- WHERE email_change IS NULL;

-- STEG 3: Verifiera att inga NULL-värden finns kvar
SELECT 
  id, 
  email, 
  email_confirmed_at,
  CASE WHEN email_change IS NULL THEN 'NULL' ELSE 'OK' END as email_change_status
FROM auth.users;

-- RESULTAT: Alla användare bör visa "OK" i email_change_status

