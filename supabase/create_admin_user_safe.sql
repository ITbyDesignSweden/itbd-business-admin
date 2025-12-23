-- Säkert sätt att skapa admin-användare via SQL
-- Använd detta istället för manuell INSERT för att undvika NULL-problem

-- ERSÄTT dessa värden:
-- 'admin@itbydesign.se' = Din email
-- 'DittLösenord123'     = Ditt lösenord

-- Alternativ 1: Använd Supabase Auth API (REKOMMENDERAT)
-- Gå till Supabase Dashboard → Authentication → Users → "Add user"
-- Detta är det säkraste sättet!

-- Alternativ 2: Om du MÅSTE använda SQL, använd denna query:
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Skapa användare med auth.users (Supabase hanterar defaults)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_current,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@itbydesign.se',                        -- ← ÄNDRA DETTA
    crypt('DittLösenord123', gen_salt('bf')),     -- ← ÄNDRA DETTA
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',      -- email_change måste vara '' inte NULL
    '',      -- email_change_token_current
    '',      -- email_change_token_new  
    ''       -- recovery_token
  )
  RETURNING id INTO new_user_id;

  -- Skapa profil för användaren
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (new_user_id, 'admin@itbydesign.se', 'Admin', 'User', 'admin');  -- ← ÄNDRA EMAIL & NAMN
  
  RAISE NOTICE 'User created with ID: %', new_user_id;
END $$;

-- Verifiera att användaren skapades korrekt
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@itbydesign.se'  -- ← ÄNDRA DETTA
ORDER BY u.created_at DESC
LIMIT 1;

