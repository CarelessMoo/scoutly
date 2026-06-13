import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { serviceClient } from '../_shared/supabase.ts'

const planConfig = {
  founding: { name: 'Founding Member', credits: 2000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  starter: { name: 'Starter', credits: 1000, dailySearchLimit: 25, monthlySearchLimit: 250 },
  pro: { name: 'Pro', credits: 3000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  agency: { name: 'Agency', credits: 10000, dailySearchLimit: 200, monthlySearchLimit: 3000 },
} as const

const priceEnvByPlan = {
  founding: 'STRIPE_FOUNDING_PRICE_ID',
  starter: 'STRIPE_STARTER_PRICE_ID',
  pro: 'STRIPE_PRO_PRICE_ID',
  agency: 'STRIPE_AGENCY_PRICE_ID',
} as const

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function planFromPriceId(priceId?: string | null) {
  if (!priceId) return null
  for (const [plan, envName] of Object.entries(priceEnvByPlan)) {
    if (Deno.env.get(envName)?.trim() === priceId) return plan as keyof typeof planConfig
  }
  return null
}

function normalizePlan(value?: string | null) {
  if (value && value in planConfig) return value as keyof typeof planConfig
  return null
}

function timestampToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null
}

async function saveSubscription(args: {
  stripe: Stripe
  subscription: Stripe.Subscription
  metadata?: Stripe.Metadata | null
  fallbackUserId?: string | null
  fallbackPlan?: string | null
  fallbackPriceId?: string | null
  forceStatus?: string | null
  resetCredits?: boolean
}) {
  const supabase = serviceClient()
  const subscription = args.subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }
  const firstItem = subscription.items.data[0]
  const priceId = args.fallbackPriceId ?? firstItem?.price?.id ?? null
  const metadata = { ...(subscription.metadata ?? {}), ...(args.metadata ?? {}) }
  const userId = args.fallbackUserId ?? metadata.user_id
  const incomingPlan = normalizePlan(metadata.plan) ?? normalizePlan(args.fallbackPlan) ?? planFromPriceId(priceId) ?? 'starter'

  console.log('User ID found in metadata', { user_id: userId ?? null, subscription_id: subscription.id })
  if (!userId) throw new Error(`Missing user_id metadata for subscription ${subscription.id}`)

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, credits_remaining')
    .or(`user_id.eq.${userId},stripe_subscription_id.eq.${subscription.id}`)
    .maybeSingle()

  const { data: existingCredits } = await supabase
    .from('usage_credits')
    .select('remaining_credits')
    .eq('user_id', userId)
    .maybeSingle()

  const plan = existingSubscription?.plan === 'founding' ? 'founding' : incomingPlan
  const config = planConfig[plan]
  const status = args.forceStatus ?? subscription.status
  const isPaid = status === 'active' || status === 'trialing'
  const periodEnd = timestampToIso(subscription.current_period_end)
  const periodChanged = Boolean(periodEnd && existingSubscription?.current_period_end !== periodEnd)
  const wasInactive = !existingSubscription || !['active', 'trialing'].includes(existingSubscription.status ?? '')
  const shouldResetCredits = isPaid && (args.resetCredits || periodChanged || wasInactive)
  const allocatedCredits = isPaid ? config.credits : 0
  const existingRemainingCredits = existingCredits?.remaining_credits ?? existingSubscription?.credits_remaining ?? allocatedCredits
  const remainingCredits = shouldResetCredits ? allocatedCredits : Math.min(existingRemainingCredits, allocatedCredits)

  const { data, error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    plan,
    plan_name: config.name,
    price_id: priceId,
    status,
    monthly_lead_credits: allocatedCredits,
    credits_allocated: allocatedCredits,
    credits_remaining: isPaid ? remainingCredits : 0,
    daily_search_limit: config.dailySearchLimit,
    monthly_search_limit: config.monthlySearchLimit,
    current_period_start: timestampToIso(subscription.current_period_start),
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('id').single()

  if (error) throw error

  await supabase.from('usage_credits').upsert({
    user_id: userId,
    subscription_id: data?.id,
    monthly_credits: allocatedCredits,
    remaining_credits: isPaid ? remainingCredits : 0,
    reset_at: periodEnd ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  console.log('Subscription updated in Supabase', { user_id: userId, subscription_id: subscription.id, plan_name: config.name, status })
}

Deno.serve(async (req) => {
  const stripe = new Stripe(requiredSecret('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' })
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(body, signature!, requiredSecret('STRIPE_WEBHOOK_SECRET'))
    console.log('Stripe webhook received', { event_type: event.type, event_id: event.id })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (!session.subscription) throw new Error('Completed checkout session is missing subscription')
      const subscription = await stripe.subscriptions.retrieve(String(session.subscription))
      await saveSubscription({
        stripe,
        subscription,
        metadata: session.metadata,
        fallbackUserId: session.metadata?.user_id,
        fallbackPlan: session.metadata?.plan,
        fallbackPriceId: session.metadata?.price_id,
        forceStatus: 'active',
        resetCredits: true,
      })
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      await saveSubscription({ stripe, subscription: event.data.object as Stripe.Subscription })
    }

    if (event.type === 'customer.subscription.deleted') {
      await saveSubscription({ stripe, subscription: event.data.object as Stripe.Subscription, forceStatus: 'canceled' })
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
      if (invoice.subscription) {
        const subscription = typeof invoice.subscription === 'string'
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : invoice.subscription
        await saveSubscription({
          stripe,
          subscription,
          forceStatus: event.type === 'invoice.payment_failed' ? 'past_due' : null,
          resetCredits: event.type === 'invoice.payment_succeeded',
        })
      }
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook failed', { message: error instanceof Error ? error.message : 'Webhook failed' })
    return Response.json({ error: error instanceof Error ? error.message : 'Webhook failed' }, { status: 400 })
  }
})
