import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { serviceClient } from '../_shared/supabase.ts'

const planConfig = {
  founding: { credits: 2500, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  starter: { credits: 1000, dailySearchLimit: 25, monthlySearchLimit: 250 },
  pro: { credits: 5000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  agency: { credits: 15000, dailySearchLimit: 200, monthlySearchLimit: 3000 },
} as const

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-10-29.clover' })
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
    const supabase = serviceClient()

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata.user_id
      const incomingPlan = (subscription.metadata.plan || 'starter') as keyof typeof planConfig
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle()

      const plan = existingSubscription?.plan === 'founding' ? 'founding' : incomingPlan
      const config = planConfig[plan]

      const { data } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status,
        monthly_lead_credits: config.credits,
        daily_search_limit: config.dailySearchLimit,
        monthly_search_limit: config.monthlySearchLimit,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' }).select('id').single()

      await supabase.from('usage_credits').upsert({
        user_id: userId,
        subscription_id: data?.id,
        monthly_credits: config.credits,
        remaining_credits: config.credits,
        reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' })
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
    }

    return Response.json({ received: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Webhook failed' }, { status: 400 })
  }
})
