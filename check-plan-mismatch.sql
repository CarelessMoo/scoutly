select s.id, s.user_id, s.plan, s.plan_name, s.price_id, s.status, s.stripe_subscription_id, s.monthly_lead_credits, s.credits_allocated, s.credits_remaining, u.remaining_credits as usage_remaining
from public.subscriptions s
left join public.usage_credits u on u.user_id = s.user_id
order by s.updated_at desc nulls last;
