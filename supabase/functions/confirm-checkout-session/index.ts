import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

const planConfig = {
  founding: { name: 'Founding Member', credits: 2000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  starter: { name: 'Starter', credits: 1000, dailySearchLimit: 25, monthlySearchLimit: 250 },
  pro: { name: 'Pro', credits: 3000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  agency: { name: 'Agency', credits: 10000, dailySearchLimit: 200, monthlySearchLimit: 3000 },
} as const

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function normalizePlan(value?: string | null) {
  if (value && value in planConfig) return value as keyof typeof planConfig
  return null
}

function timestampToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null
}

async function saveSubscriptionForUser(args: {
  userId: string
  subscription: Stripe.Subscription
  session?: Stripe.Checkout.Session | null
  forceStatus?: string | null
}) {
  const subscription = args.subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }
  const incomingPlan = normalizePlan(args.session?.metadata?.plan) ?? normalizePlan(subscription.metadata?.plan) ?? 'starter'
  const supabase = serviceClient()

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, credits_remaining')
    .eq('user_id', args.userId)
    .maybeSingle()

  const { data: existingCredits } = await supabase
    .from('usage_credits')
    .select('remaining_credits')
    .eq('user_id', args.userId)
    .maybeSingle()

  const plan = existingSubscription?.plan === 'founding' ? 'founding' : incomingPlan
  const config = planConfig[plan]
  const status = args.forceStatus ?? subscription.status
  const isPaid = status === 'active' || status === 'trialing'
  const allocatedCredits = isPaid ? config.credits : 0
  const priceId = args.session?.metadata?.price_id ?? subscription.items.data[0]?.price?.id ?? null
  const periodEnd = timestampToIso(subscription.current_period_end)
  const periodChanged = Boolean(periodEnd && existingSubscription?.current_period_end !== periodEnd)
  const wasInactive = !existingSubscription || !['active', 'trialing'].includes(existingSubscription.status ?? '')
  const shouldResetCredits = isPaid && (periodChanged || wasInactive)
  const existingRemainingCredits = existingCredits?.remaining_credits ?? existingSubscription?.credits_remaining ?? allocatedCredits
  const remainingCredits = shouldResetCredits ? allocatedCredits : Math.min(existingRemainingCredits, allocatedCredits)

  const { data, error } = await supabase.from('subscriptions').upsert({
    user_id: args.userId,
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
    user_id: args.userId,
    subscription_id: data?.id,
    monthly_credits: allocatedCredits,
    remaining_credits: isPaid ? remainingCredits : 0,
    reset_at: periodEnd ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  console.log('Subscription updated in Supabase', { user_id: args.userId, subscription_id: subscription.id, plan_name: config.name, status })
  return isPaid
}

async function findLatestSubscriptionForUser(stripe: Stripe, userId: string) {
  const supabase = serviceClient()
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing?.stripe_customer_id) return null

  const subscriptions = await stripe.subscriptions.list({
    customer: existing.stripe_customer_id,
    status: 'all',
    limit: 10,
  })

  return subscriptions.data.find((subscription) => ['active', 'trialing'].includes(subscription.status)) ?? subscriptions.data[0] ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(requiredSecret('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' })
    const { sessionId } = await req.json()
    let session: Stripe.Checkout.Session | null = null
    let subscription: Stripe.Subscription | null = null
    let userId: string | null = null
    let forceStatus: string | null = null

    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId)
      userId = session.metadata?.user_id ?? null
      console.log('Subscription status checked on checkout return', { user_id: userId, session_id: session.id, payment_status: session.payment_status })

      if (!userId) throw new Error('Checkout session is missing user metadata')
      if (session.payment_status === 'paid' && session.subscription) {
        subscription = await stripe.subscriptions.retrieve(String(session.subscription))
        forceStatus = subscription.status === 'trialing' ? 'trialing' : 'active'
      }
    }

    if (!subscription) {
      const user = await getUser(req)
      userId = user.id
      subscription = await findLatestSubscriptionForUser(stripe, user.id)
      console.log('Subscription fallback lookup by Stripe customer', { user_id: user.id, subscription_found: Boolean(subscription) })
    }

    if (!subscription) return Response.json({ active: false }, { headers: corsHeaders })

    const active = await saveSubscriptionForUser({ userId: userId!, subscription, session, forceStatus })
    return Response.json({ active }, { headers: corsHeaders })
  } catch (error) {
    console.error('Checkout confirmation failed', { message: error instanceof Error ? error.message : 'Checkout confirmation failed' })
    return Response.json({ error: error instanceof Error ? error.message : 'Checkout confirmation failed' }, { status: 400, headers: corsHeaders })
  }
})
