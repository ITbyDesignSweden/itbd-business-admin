-- Quick test: Create an API key manually for testing
-- This generates a test key: itbd_test_key_12345
-- DO NOT use this in production!

-- First, get an organization ID
SELECT id, name FROM organizations LIMIT 1;

-- Then insert a test API key (replace <ORG_ID> with actual ID from above)
-- The key is: itbd_test_key_12345
-- Hash: SHA-256 of "itbd_test_key_12345"
INSERT INTO api_keys (org_id, key_hash, key_preview, name, is_active)
VALUES (
  '<ORG_ID>',  -- Replace with your org ID
  'e5c8f3d2b1a9c7e6f4d3b2a1c9e8f7d6b5a4c3e2f1d0b9a8c7e6f5d4c3b2a1',  -- Hash of test key
  '...12345',
  'Test Key',
  true
);

-- The test API key is: itbd_test_key_12345
-- Use this for testing!

