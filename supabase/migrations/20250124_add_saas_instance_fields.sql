-- Migration: Add SaaS Instance Management Fields
-- Description: Adds columns to track production URL, GitHub repo, and Supabase project reference
-- Date: 2025-01-24

-- Add new columns to organizations table
ALTER TABLE organizations
ADD COLUMN production_url TEXT,
ADD COLUMN github_repo_url TEXT,
ADD COLUMN supabase_project_ref TEXT;

-- Add comments for documentation
COMMENT ON COLUMN organizations.production_url IS 'URL to the customer''s production environment';
COMMENT ON COLUMN organizations.github_repo_url IS 'URL to the customer''s GitHub repository';
COMMENT ON COLUMN organizations.supabase_project_ref IS 'Supabase project reference ID for the customer''s instance';

