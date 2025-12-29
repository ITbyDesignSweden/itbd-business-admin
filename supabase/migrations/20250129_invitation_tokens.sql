-- Sprint 8.1: Invitation Tokens Table
-- Purpose: Store cryptographically secure tokens for onboarding access

create table invitation_tokens (
  token uuid default gen_random_uuid() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days'),
  used_at timestamp with time zone, -- Null = Can be used for access

  constraint valid_dates check (expires_at > created_at)
);

-- Index for fast token lookup
create index idx_tokens_lookup on invitation_tokens(token);

-- IMPORTANT: Enable RLS but create NO policies for 'anon'. 
-- This forces us to use Service Role (Admin) for access.
alter table invitation_tokens enable row level security;

-- Optional: Policy for authenticated admin users to view tokens
create policy "Admin users can view all tokens"
  on invitation_tokens
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );


