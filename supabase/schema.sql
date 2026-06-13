create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company text,
  onboarding_completed boolean not null default false,
  target_service text,
  first_search_city text,
  target_industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('founding', 'starter', 'pro', 'agency')),
  status text not null default 'inactive',
  monthly_lead_credits integer not null default 0,
  daily_search_limit integer not null default 25,
  monthly_search_limit integer not null default 250,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  monthly_credits integer not null default 0,
  remaining_credits integer not null default 0 check (remaining_credits >= 0),
  reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_type text,
  industry text,
  keyword text,
  city text,
  state text,
  radius integer,
  filters jsonb not null default '{}'::jsonb,
  leads_returned integer not null default 0,
  result_count integer not null default 0,
  credits_used integer not null default 0,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.returned_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text,
  fingerprint text not null,
  business_name text,
  phone_number text,
  address text,
  first_returned_at timestamptz not null default now(),
  unique(user_id, fingerprint)
);

create table if not exists public.pipeline_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.saved_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  phone_number text,
  website text,
  address text,
  rating numeric,
  review_count integer,
  category text,
  google_maps_url text,
  score_reasons text[] not null default '{}'::text[],
  city text,
  state text,
  lead_score integer not null default 0,
  status text not null default 'New',
  notes text not null default '',
  follow_up_date date,
  place_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.saved_leads(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.saved_leads(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(lead_id, tag)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.saved_leads(id) on delete cascade,
  title text not null,
  type text not null check (type in ('Follow-up', 'Call', 'Meeting')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_credits enable row level security;
alter table public.saved_leads enable row level security;
alter table public.search_history enable row level security;
alter table public.returned_leads enable row level security;
alter table public.pipeline_statuses enable row level security;
alter table public.calendar_events enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_tags enable row level security;

create policy "profiles are owned by user" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "subscriptions are owned by user" on public.subscriptions for select using (auth.uid() = user_id);
create policy "credits are owned by user" on public.usage_credits for select using (auth.uid() = user_id);
create policy "saved leads are owned by user" on public.saved_leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "search history is owned by user" on public.search_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "returned leads are owned by user" on public.returned_leads for select using (auth.uid() = user_id);
create policy "pipeline statuses are owned by user" on public.pipeline_statuses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar events are owned by user" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lead notes are owned by user" on public.lead_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lead tags are owned by user" on public.lead_tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = now();

  insert into public.subscriptions (user_id, plan, status, monthly_lead_credits, daily_search_limit, monthly_search_limit)
  values (new.id, 'starter', 'inactive', 0, 25, 250)
  on conflict (user_id) do nothing;

  insert into public.usage_credits (user_id, monthly_credits, remaining_credits)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.pipeline_statuses (user_id, name, sort_order)
  values
    (new.id, 'New', 1),
    (new.id, 'Contacted', 2),
    (new.id, 'Interested', 3),
    (new.id, 'Follow-up', 4),
    (new.id, 'Closed', 5),
    (new.id, 'Not Interested', 6)
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

create or replace function public.assert_search_allowed(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  subscription_record record;
  daily_count integer;
  monthly_count integer;
begin
  select status, daily_search_limit, monthly_search_limit
  into subscription_record
  from public.subscriptions
  where user_id = target_user_id;

  if subscription_record is null or subscription_record.status not in ('active', 'trialing') then
    raise exception 'Active paid subscription required';
  end if;

  select count(*) into daily_count
  from public.search_history
  where user_id = target_user_id
    and created_at >= date_trunc('day', now());

  if daily_count >= subscription_record.daily_search_limit then
    raise exception 'Daily search limit reached';
  end if;

  select count(*) into monthly_count
  from public.search_history
  where user_id = target_user_id
    and created_at >= date_trunc('month', now());

  if monthly_count >= subscription_record.monthly_search_limit then
    raise exception 'Monthly search limit reached';
  end if;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_active_subscription(target_user_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = target_user_id
      and status in ('active', 'trialing')
  );
$$;

create or replace function public.consume_lead_credits(target_user_id uuid, credit_count integer)
returns void
language plpgsql
security definer
as $$
begin
  if credit_count < 1 then
    raise exception 'credit_count must be positive';
  end if;

  update public.usage_credits
  set remaining_credits = remaining_credits - credit_count,
      updated_at = now()
  where user_id = target_user_id
    and remaining_credits >= credit_count;

  if not found then
    raise exception 'insufficient lead credits';
  end if;
end;
$$;
