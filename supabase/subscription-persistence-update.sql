alter table public.subscriptions
  add column if not exists plan_name text,
  add column if not exists price_id text,
  add column if not exists credits_allocated integer not null default 0,
  add column if not exists credits_remaining integer not null default 0;

update public.subscriptions
set plan_name = coalesce(plan_name, plan),
    credits_allocated = case when credits_allocated = 0 then monthly_lead_credits else credits_allocated end,
    credits_remaining = case when credits_remaining = 0 then monthly_lead_credits else credits_remaining end
where plan_name is null
   or credits_allocated = 0
   or credits_remaining = 0;
