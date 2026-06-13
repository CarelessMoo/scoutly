import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

const planConfig = {
  founding: { credits: 2000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  starter: { credits: 1000, dailySearchLimit: 25, monthlySearchLimit: 250 },
  pro: { credits: 3000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  agency: { credits: 10000, dailySearchLimit: 200, monthlySearchLimit: 3000 },
} as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-10-29.clover' })
    const user = await getUser(req)
    const { sessionId } = await req.json()
    if (!sessionId) throw new Error('Missing checkout session id')

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.user_id !== user.id) throw new Error('Checkout session does not belong to this user')
    if (session.payment_status !== 'paid') return Response.json({ active: false }, { headers: corsHeaders })
    if (!session.subscription) throw new Error('Checkout session has no subscription')

    const subscription = await stripe.subscriptions.retrieve(String(session.subscription))
    const incomingPlan = (session.metadata?.plan || subscription.metadata?.plan || 'starter') as keyof typeof planConfig
    const supabase = serviceClient()

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const plan = existingSubscription?.plan === 'founding' ? 'founding' : incomingPlan
    const config = planConfig[plan]
    if (!config) throw new Error('Invalid subscription plan')

    const { data } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
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
      user_id: user.id,
      subscription_id: data?.id,
      monthly_credits: config.credits,
      remaining_credits: config.credits,
      reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: 'user_id' })

    return Response.json({ active: subscription.status === 'active' || subscription.status === 'trialing' }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Checkout confirmation failed' }, { status: 400, headers: corsHeaders })
  }
})
