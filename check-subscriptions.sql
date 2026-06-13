select user_id, plan, plan_name, price_id, status, stripe_customer_id, stripe_subscription_id, monthly_lead_credits, credits_allocated, credits_remaining, current_period_start, current_period_end, updated_at, created_at
from public.subscriptions
order by updated_at desc nulls last, created_at desc;
