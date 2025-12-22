-- Seed script för Credit Ledger testdata
-- Uppdatera 'YOUR_ORG_ID_HERE' med ett faktiskt organisations-ID från din databas

-- För att hitta ditt organisations-ID, kör:
-- SELECT id, name FROM organizations;

DO $$
DECLARE
  target_org_id UUID := 'YOUR_ORG_ID_HERE'; -- Byt ut detta!
BEGIN
  -- Initial top-up när kunden började som pilot (3 månader sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    5000,
    'Startkapital - Pilot Program',
    NOW() - INTERVAL '90 days'
  );

  -- Första projektet (2.5 månader sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -1200,
    'Webbdesign - Landningssida',
    NOW() - INTERVAL '75 days'
  );

  -- Top-up efter första projektet (2 månader sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    10000,
    'Påfyllning - Faktura #1024',
    NOW() - INTERVAL '60 days'
  );

  -- Projekt 2 (2 månader sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -2500,
    'App-utveckling - MVP fas 1',
    NOW() - INTERVAL '55 days'
  );

  -- Projekt 3 (1.5 månader sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -800,
    'SEO-optimering',
    NOW() - INTERVAL '45 days'
  );

  -- Mindre förbrukning (1 månad sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -450,
    'Support & Underhåll - November',
    NOW() - INTERVAL '30 days'
  );

  -- Större top-up efter upgrade till Growth (3 veckor sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    15000,
    'Påfyllning - Faktura #1089 (Upgrade till Growth)',
    NOW() - INTERVAL '21 days'
  );

  -- Stort projekt startar (2 veckor sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -3500,
    'App-utveckling - MVP fas 2',
    NOW() - INTERVAL '14 days'
  );

  -- Mindre förbrukning (1 vecka sedan)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -600,
    'UI/UX Design - Prototyper',
    NOW() - INTERVAL '7 days'
  );

  -- Senaste förbrukning (igår)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    -1200,
    'API-integration - Stripe & Mailchimp',
    NOW() - INTERVAL '1 day'
  );

  -- Bonus: En kreditjustering (idag - tidig morgon)
  INSERT INTO credit_ledger (org_id, amount, description, created_at)
  VALUES (
    target_org_id,
    500,
    'Kreditjustering - Rabatt återbetald',
    NOW() - INTERVAL '2 hours'
  );

END $$;

-- Verifiera resultatet
SELECT 
  created_at,
  description,
  amount,
  (SELECT SUM(amount) FROM credit_ledger WHERE org_id = 'YOUR_ORG_ID_HERE' AND created_at <= cl.created_at) as running_balance
FROM credit_ledger cl
WHERE org_id = 'YOUR_ORG_ID_HERE'
ORDER BY created_at DESC;

