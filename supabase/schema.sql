-- 1. Organizations (Kunder)
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  org_nr text,
  subscription_plan text check (subscription_plan is null or subscription_plan in ('care', 'growth', 'scale')),
  status text default 'pilot' check (status in ('pilot', 'active', 'churned'))
);

-- 2. Profiles (Admin Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text default 'admin' -- I admin-portalen är alla admins
);

-- 3. Credit Ledger (Centralbanken)
create table public.credit_ledger (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  org_id uuid references public.organizations(id) not null,
  amount integer not null, -- Positivt = Köp, Negativt = Förbrukning
  description text not null,
  project_id uuid references public.projects(id) on delete set null
);

-- 4. Projects (Beställningar)
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  org_id uuid references public.organizations(id) not null,
  title text not null,
  status text default 'backlog',
  cost_credits integer default 0
);

-- RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.projects enable row level security;

-- Admin Policy (Låt inloggade göra allt i detta interna system)
-- Använd auth.uid() istället för auth.role() för att kolla om användaren är inloggad
create policy "Authenticated users can do everything on organizations"
  on organizations for all using (auth.uid() IS NOT NULL);

create policy "Authenticated users can do everything on profiles"
  on profiles for all using (auth.uid() IS NOT NULL);

create policy "Authenticated users can do everything on credit_ledger"
  on credit_ledger for all using (auth.uid() IS NOT NULL);

create policy "Authenticated users can do everything on projects"
  on projects for all using (auth.uid() IS NOT NULL);

-- 5. Pilot Requests (Inbound Funnel)
create table public.pilot_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  contact_name text not null,
  company_name text not null,
  org_nr text,
  description text,
  file_path text, -- Path to uploaded file in storage
  status text default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- RLS is ENABLED for pilot_requests to protect personal data
alter table public.pilot_requests enable row level security;

-- Only authenticated admins can read/update
-- Public submissions are handled via Edge Function (submit-pilot-request)
-- which uses service_role to bypass RLS in a controlled manner
create policy "authenticated_select_pilot_requests"
  on pilot_requests for select 
  to authenticated
  using (true);

create policy "authenticated_update_pilot_requests"
  on pilot_requests for update 
  to authenticated
  using (true)
  with check (true);

