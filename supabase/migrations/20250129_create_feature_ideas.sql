-- Sprint 9.5: The Persistence Layer
-- Create table for storing AI-generated feature ideas/prompt starters

-- Enums for status and source
create type feature_status as enum ('suggested', 'saved', 'planned', 'implemented', 'rejected');
create type feature_source as enum ('ai_initial', 'chat_agent', 'manual');

-- Main table for feature ideas
create table feature_ideas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  org_id uuid references organizations(id) on delete cascade not null,
  title text not null,
  description text not null,
  prompt text not null, -- Full prompt that gets sent to chat agent when clicked
  status feature_status default 'suggested' not null,
  source feature_source default 'ai_initial' not null,
  complexity text check (complexity is null or complexity in ('small', 'medium', 'large'))
);

-- Performance index for common query pattern
create index idx_feature_ideas_org_status on feature_ideas(org_id, status);

-- RLS (Row Level Security)
alter table feature_ideas enable row level security;

-- Policy: Allow authenticated users (admins) to do everything
-- This is an internal admin system, so all authenticated users should have full access
create policy "Authenticated users can manage feature ideas"
  on feature_ideas for all
  using (auth.uid() is not null);

-- Comments for clarity
comment on table feature_ideas is 'AI-generated feature ideas and prompt starters for customer onboarding';
comment on column feature_ideas.prompt is 'Full prompt text that gets sent to chat when user clicks suggestion';
comment on column feature_ideas.complexity is 'Optional complexity estimate (null for initial AI suggestions)';

