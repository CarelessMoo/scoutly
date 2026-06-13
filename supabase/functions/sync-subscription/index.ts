import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

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

function timestampToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null
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

async function saveSubscription(userId: string, subscription: Stripe.Subscription) {
  const supabase = serviceClient()
  const typedSubscription = subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }
  const priceId = typedSubscription.items.data[0]?.price?.id ?? null
  const incomingPlan = planFromPriceId(priceId) ?? normalizePlan(typedSubscription.metadata.plan) ?? 'starter'
  const config = planConfig[incomingPlan]
  const isPaid = typedSubscription.status === 'active' || typedSubscription.status === 'trialing'
  const allocatedCredits = isPaid ? config.credits : 0
  const periodEnd = timestampToIso(typedSubscription.current_period_end)

  const { data: existingCredits } = await supabase
    .from('usage_credits')
    .select('remaining_credits')
    .eq('user_id', userId)
    .maybeSingle()

  const remainingCredits = isPaid ? Math.min(existingCredits?.remaining_credits ?? allocatedCredits, allocatedCredits) : 0

  const { data, error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: String(typedSubscription.customer),
    stripe_subscription_id: typedSubscription.id,
    plan: incomingPlan,
    plan_name: config.name,
    price_id: priceId,
    status: typedSubscription.status,
    monthly_lead_credits: allocatedCredits,
    credits_allocated: allocatedCredits,
    credits_remaining: remainingCredits,
    daily_search_limit: config.dailySearchLimit,
    monthly_search_limit: config.monthlySearchLimit,
    current_period_start: timestampToIso(typedSubscription.current_period_start),
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('id').single()

  if (error) throw error

  await supabase.from('usage_credits').upsert({
    user_id: userId,
    subscription_id: data?.id,
    monthly_credits: allocatedCredits,
    remaining_credits: remainingCredits,
    reset_at: periodEnd ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return { active: isPaid, status: typedSubscription.status, plan: incomingPlan }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(requiredSecret('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' })
    const user = await getUser(req)
    const supabase = serviceClient()

    const { data: row, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!row?.stripe_customer_id) return Response.json({ active: false, reason: 'No Stripe customer found' }, { headers: corsHeaders })

    const subscriptions = await stripe.subscriptions.list({
      customer: row.stripe_customer_id,
      status: 'all',
      limit: 20,
    })

    const subscription =
      subscriptions.data.find((item) => item.status === 'active') ??
      subscriptions.data.find((item) => item.status === 'trialing') ??
      subscriptions.data[0]

    if (!subscription) return Response.json({ active: false, reason: 'No Stripe subscription found for this customer' }, { headers: corsHeaders })

    const result = await saveSubscription(user.id, subscription)
    console.log('Manual subscription sync complete', { user_id: user.id, subscription_id: subscription.id, status: result.status, plan: result.plan })
    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    console.error('Manual subscription sync failed', { message: error instanceof Error ? error.message : 'Sync failed' })
    return Response.json({ active: false, error: error instanceof Error ? error.message : 'Sync failed' }, { status: 400, headers: corsHeaders })
  }
})
