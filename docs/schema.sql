-- 1. Organizations (Kunder)
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  org_nr text,
  subscription_plan text default 'care' check (subscription_plan in ('care', 'growth', 'scale')),
  status text default 'pilot' check (status in ('pilot', 'active', 'churned'))
);

-- 2. Profiles (Admin Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text,
  last_name text,
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
create policy "Admins can do everything" on organizations for all using (auth.role() = 'authenticated');
create policy "Admins can do everything" on profiles for all using (auth.role() = 'authenticated');
create policy "Admins can do everything" on credit_ledger for all using (auth.role() = 'authenticated');
create policy "Admins can do everything" on projects for all using (auth.role() = 'authenticated');