-- Sprint 10: Link pilot_requests to created organizations
-- Purpose: Enable lookup of original contact email during onboarding handshake
--          without storing email in the organizations table.

-- Add org_id column to pilot_requests
ALTER TABLE pilot_requests
ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add index for fast lookups by org_id
CREATE INDEX idx_pilot_requests_org_id ON pilot_requests(org_id);

-- Add comment for documentation
COMMENT ON COLUMN pilot_requests.org_id IS 'Reference to the organization created from this pilot request.';


