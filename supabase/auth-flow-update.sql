alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists target_service text,
  add column if not exists first_search_city text,
  add column if not exists target_industry text;

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

insert into public.subscriptions (user_id, plan, status, monthly_lead_credits, daily_search_limit, monthly_search_limit)
select id, 'starter', 'inactive', 0, 25, 250
from auth.users
where not exists (
  select 1
  from public.subscriptions
  where subscriptions.user_id = auth.users.id
);

insert into public.usage_credits (user_id, monthly_credits, remaining_credits)
select id, 0, 0
from auth.users
where not exists (
  select 1
  from public.usage_credits
  where usage_credits.user_id = auth.users.id
);
