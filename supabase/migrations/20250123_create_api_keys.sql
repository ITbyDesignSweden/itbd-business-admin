-- Migration: Create API Keys Table
-- This migration implements Feature O: API Key Management
-- 
-- Purpose: Allow organizations to generate API keys for external API access
-- Security: Keys are hashed before storage, never stored in plaintext

-- ========================================
-- 1. Create API Keys Table
-- ========================================
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  org_id uuid references public.organizations(id) on delete cascade not null,
  key_hash text not null, -- Hashed version of the API key (never store plaintext!)
  key_preview text not null, -- Last 8 characters for user identification (e.g., "...a1b2c3d4")
  name text, -- Optional friendly name (e.g., "Production API", "Development")
  is_active boolean default true not null,
  last_used_at timestamp with time zone -- Track when key was last used
);

-- Create unique index on key_hash for fast lookup and prevent duplicates
create unique index api_keys_key_hash_idx on public.api_keys(key_hash);

-- Create index on org_id for fast queries by organization
create index api_keys_org_id_idx on public.api_keys(org_id);

-- Create index on is_active for filtering active keys
create index api_keys_is_active_idx on public.api_keys(is_active);

-- ========================================
-- 2. Enable Row Level Security
-- ========================================
alter table public.api_keys enable row level security;

-- Policy: Authenticated users can read all API keys
create policy "Authenticated users can read api keys"
  on api_keys for select 
  to authenticated
  using (true);

-- Policy: Authenticated users can insert API keys
create policy "Authenticated users can insert api keys"
  on api_keys for insert 
  to authenticated
  with check (true);

-- Policy: Authenticated users can update API keys
create policy "Authenticated users can update api keys"
  on api_keys for update 
  to authenticated
  using (true)
  with check (true);

-- Policy: Authenticated users can delete API keys
create policy "Authenticated users can delete api keys"
  on api_keys for delete 
  to authenticated
  using (true);

-- ========================================
-- 3. Comments for documentation
-- ========================================
comment on table public.api_keys is 'Stores hashed API keys for external access to organization data';
comment on column public.api_keys.key_hash is 'SHA-256 hash of the API key (never store plaintext)';
comment on column public.api_keys.key_preview is 'Last 8 characters of the key for user identification';
comment on column public.api_keys.name is 'Optional friendly name for the API key';
comment on column public.api_keys.is_active is 'Whether the key is active (false = revoked)';
comment on column public.api_keys.last_used_at is 'Timestamp of last successful API request using this key';

