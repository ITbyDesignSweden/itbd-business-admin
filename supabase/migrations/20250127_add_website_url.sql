-- Migration: Add website_url for company research
-- Description: Adds website_url column to track the customer's corporate website (different from production_url)
-- Date: 2025-01-27
-- Purpose: Used by AI Search Grounding to research company profiles

-- Add website_url column to organizations table
ALTER TABLE organizations
ADD COLUMN website_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN organizations.website_url IS 'Company website URL for business profile research (e.g., itbydesign.se)';

