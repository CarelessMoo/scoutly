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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(requiredSecret('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' })
    const user = await getUser(req)
    const { sessionId } = await req.json()
    if (!sessionId) throw new Error('Missing checkout session id')

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('Subscription status checked on checkout return', { user_id: user.id, session_id: session.id })

    if (session.metadata?.user_id !== user.id) throw new Error('Checkout session does not belong to this user')
    if (session.payment_status !== 'paid') return Response.json({ active: false }, { headers: corsHeaders })
    if (!session.subscription) throw new Error('Checkout session has no subscription')

    const subscription = await stripe.subscriptions.retrieve(String(session.subscription)) as Stripe.Subscription & {
      current_period_start?: number
      current_period_end?: number
    }
    const incomingPlan = normalizePlan(session.metadata?.plan) ?? normalizePlan(subscription.metadata?.plan) ?? 'starter'
    const supabase = serviceClient()

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const plan = existingSubscription?.plan === 'founding' ? 'founding' : incomingPlan
    const config = planConfig[plan]
    const isPaid = subscription.status === 'active' || subscription.status === 'trialing'
    const allocatedCredits = isPaid ? config.credits : 0
    const priceId = session.metadata?.price_id ?? subscription.items.data[0]?.price?.id ?? null
    const periodEnd = timestampToIso(subscription.current_period_end)

    const { data, error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id,
      plan,
      plan_name: config.name,
      price_id: priceId,
      status: subscription.status,
      monthly_lead_credits: allocatedCredits,
      credits_allocated: allocatedCredits,
      credits_remaining: allocatedCredits,
      daily_search_limit: config.dailySearchLimit,
      monthly_search_limit: config.monthlySearchLimit,
      current_period_start: timestampToIso(subscription.current_period_start),
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select('id').single()

    if (error) throw error

    await supabase.from('usage_credits').upsert({
      user_id: user.id,
      subscription_id: data?.id,
      monthly_credits: allocatedCredits,
      remaining_credits: allocatedCredits,
      reset_at: periodEnd ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    console.log('Subscription updated in Supabase', { user_id: user.id, subscription_id: subscription.id, plan_name: config.name, status: subscription.status })
    return Response.json({ active: isPaid }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Checkout confirmation failed' }, { status: 400, headers: corsHeaders })
  }
})
