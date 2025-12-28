-- Sprint 6: The Gatekeeper
-- Migration for security, enrichment prep, and system settings

-- 1. Create enrichment_mode enum
CREATE TYPE enrichment_mode_type AS ENUM ('manual', 'assist', 'autopilot');

-- 2. Create system_settings table (singleton)
CREATE TABLE system_settings (
  id int PRIMARY KEY DEFAULT 1,
  enrichment_mode enrichment_mode_type DEFAULT 'manual',
  max_daily_leads int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize default row
INSERT INTO system_settings (id) VALUES (1);

-- 3. Add new columns to pilot_requests table
ALTER TABLE pilot_requests
  ADD COLUMN IF NOT EXISTS fit_score int,
  ADD COLUMN IF NOT EXISTS enrichment_data jsonb,
  ADD COLUMN IF NOT EXISTS turnstile_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'web_form';

-- 4. Create index on turnstile_verified for faster queries
CREATE INDEX IF NOT EXISTS idx_pilot_requests_turnstile ON pilot_requests(turnstile_verified);

-- 5. Create index on lead_source for analytics
CREATE INDEX IF NOT EXISTS idx_pilot_requests_lead_source ON pilot_requests(lead_source);

-- 6. Add comment to explain enrichment_data structure
COMMENT ON COLUMN pilot_requests.enrichment_data IS 'JSONB data from AI research and enrichment process';

-- 7. Add comment to explain fit_score
COMMENT ON COLUMN pilot_requests.fit_score IS 'AI-calculated score (0-100) representing lead quality';

