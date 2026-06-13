select user_id, plan, plan_name, status, stripe_customer_id is not null as has_customer, stripe_subscription_id is not null as has_subscription, price_id is not null as has_price, monthly_lead_credits, credits_allocated, credits_remaining, current_period_end, updated_at
from public.subscriptions
order by updated_at desc nulls last, created_at desc
limit 10;
