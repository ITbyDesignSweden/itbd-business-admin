-- Sprint 8: Migration Script
-- Generate invitation tokens for existing pilot organizations
-- Run this AFTER the migration has been applied

-- This script generates tokens for all organizations with status 'pilot'
-- Adjust the WHERE clause if you need different criteria

-- Generate tokens for all pilot organizations
INSERT INTO invitation_tokens (org_id)
SELECT id 
FROM organizations 
WHERE status = 'pilot'
ON CONFLICT DO NOTHING;

-- View the generated tokens with organization names
-- Use this to send out new invitation links to customers
SELECT 
  it.token,
  o.name as organization_name,
  o.status,
  it.created_at,
  it.expires_at,
  CONCAT(
    'https://app.itbd.se/onboarding?token=', 
    it.token
  ) as invitation_url
FROM invitation_tokens it
JOIN organizations o ON it.org_id = o.id
WHERE it.created_at > NOW() - INTERVAL '1 hour'  -- Only show recently created
ORDER BY o.name;

-- Optional: Generate tokens for ALL organizations (active, pilot, etc)
-- Uncomment if needed:
-- INSERT INTO invitation_tokens (org_id)
-- SELECT id FROM organizations
-- ON CONFLICT DO NOTHING;

