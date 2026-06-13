with fixed_sub as (
  update public.subscriptions
  set plan = 'founding',
      plan_name = 'Founding Member',
      monthly_lead_credits = 2000,
      credits_allocated = 2000,
      credits_remaining = least(credits_remaining, 2000),
      daily_search_limit = 75,
      monthly_search_limit = 1000,
      updated_at = now()
  where price_id = 'price_1ThayeEjx1pTq9cwKEHo1RA4'
    and status in ('active', 'trialing')
  returning user_id, id
)
update public.usage_credits u
set subscription_id = fixed_sub.id,
    monthly_credits = 2000,
    remaining_credits = least(u.remaining_credits, 2000),
    updated_at = now()
from fixed_sub
where u.user_id = fixed_sub.user_id;

select s.user_id, s.plan, s.plan_name, s.price_id, s.status, s.monthly_lead_credits, s.credits_allocated, s.credits_remaining, u.remaining_credits as usage_remaining
from public.subscriptions s
left join public.usage_credits u on u.user_id = s.user_id
order by s.updated_at desc nulls last;
